/* =============================================================================
 * OR-SimLab · AI 建模助手（自然语言 → 仿真模型参数）
 * -----------------------------------------------------------------------------
 * 教学目标：把「文字描述的业务问题」翻译成「可运行、可调参的仿真模型」。
 * 这是 AI + 仿真最真实的结合点——学生最容易卡住的地方不是求解，而是第一步建模。
 *
 * 两条通道，结果都要过校验，且必须由使用者确认后才写入参数台：
 *   ① 语义通道  调用大模型（OR.AI.complete），要求返回严格 JSON，逐字段校验
 *   ② 规则通道  完全本地：标签关键词 + 量纲匹配 + 邻近度打分 + 顺序回退
 *
 * 设计原则（防止 AI 幻觉影响教学）：
 *   · 模型不直接改界面，只产出「候选参数 + 每项的匹配依据」
 *   · 所有数值强制按参数定义做区间裁剪与步长吸附，越界必须显式告警
 *   · 未匹配到的参数一律保留原值并标注，绝不猜
 *   · 应用前一定要人看一遍匹配表
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var U = OR.ui;

  /* ---------- 参数展平 ---------- */
  function flatten(params) {
    var out = [];
    (function walk(list) {
      (list || []).forEach(function (p) {
        if (p.type === 'group') return walk(p.params);
        out.push(p);
      });
    })(params);
    return out;
  }

  /* ---------- 文本归一化 ---------- */
  var CN_NUM = { '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };

  function normalize(text) {
    var s = String(text || '');
    s = s.replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); })
      .replace(/[．]/g, '.')
      .replace(/[，、；]/g, ',')
      .replace(/[：]/g, ':');
    /* 中文数字：仅处理 一~十 后紧跟量词或作为独立词的简单情形 */
    s = s.replace(/([零一二两三四五六七八九十])(?=\s*(?:个|台|人|件|元|小时|分钟|天|周|次|%|％))/g, function (m) {
      return String(CN_NUM[m]);
    });
    return s;
  }

  /* ---------- 数值与量纲抽取 ---------- */
  function scanNumbers(text) {
    var out = [];
    var re = /(-?\d+(?:\.\d+)?)/g, m;
    while ((m = re.exec(text)) !== null) {
      var tail = text.slice(m.index + m[0].length, m.index + m[0].length + 6);
      out.push({ raw: m[1], value: Number(m[1]), at: m.index, end: re.lastIndex, tail: tail });
    }
    return out;
  }

  /* ---------- 参数关键词 ---------- */
  function paramTokens(p) {
    var label = String(p.label || '');
    var parts = label.split(/[·\s]+/).filter(Boolean);
    var toks = [];
    parts.forEach(function (part) {
      var clean = part.replace(/[（(][^)）]*[)）]/g, '');
      if (!clean) return;
      if (clean.length <= 8) toks.push(clean);
      for (var L = Math.min(4, clean.length); L >= 2; L--) {
        for (var i = 0; i + L <= clean.length; i++) toks.push(clean.substr(i, L));
      }
    });
    /* 量纲本身也是强线索：「小时」「元」 */
    var unit = String(p.unit || '');
    if (unit.length >= 1) toks.push(unit);
    return uniq(toks).filter(function (t) { return t.length >= 2; });
  }

  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
    return out;
  }

  /** 文本中某 token 出现的位置列表 */
  function positionsOf(text, tok) {
    var out = [], i = text.indexOf(tok);
    while (i >= 0) { out.push({ at: i, len: tok.length }); i = text.indexOf(tok, i + 1); }
    return out;
  }

  /** 为一个 (参数, 数字) 组合打分，返回 {score, token, distance} */
  function scorePair(text, p, num) {
    var toks = paramTokens(p);
    var best = { score: 0, token: null, distance: Infinity };
    toks.forEach(function (tok) {
      var ps = positionsOf(text, tok);
      ps.forEach(function (pos) {
        /* 中文描述里「参数名 数值」是常态，所以词在前优于词在后：
           词在前用真实间距，词在后按 2.5 倍惩罚，避免把下一个参数的词算到前一个数上 */
        var back = num.at - (pos.at + pos.len);   // >0：词在数字之前
        var fwd = pos.at - num.end;               // >0：词在数字之后
        var d, penalty = 0;
        if (back >= 0) { d = back; }
        else { d = fwd < 0 ? 0 : fwd; penalty = 3.6; }
        if (d > 40) return;
        var s = tok.length * 3;                   // 关键词越长越可信
        s += Math.max(0, 30 - d) / 30 * 6;        // 距离越近越可信
        s -= penalty;
        if (s > best.score) best = { score: s, token: tok, distance: d };
      });
    });
    /* 量纲加成：数字后面紧接该参数的量纲 */
    var unit = String(p.unit || '');
    if (unit && num.tail && num.tail.indexOf(unit) === 0) {
      best.score += 12;
      best.token = best.token || unit;
      best.distance = 0;
    }
    return best;
  }

  /* ---------- 规则通道主过程 ---------- */
  function parseByRules(text, lab) {
    var src = normalize(text);
    var params = flatten(lab.params).filter(isNumeric);
    var nums = scanNumbers(src);
    var mapping = [];
    var usedNum = {}, usedParam = {};

    var pairs = [];
    params.forEach(function (p) {
      nums.forEach(function (n, ni) {
        var r = scorePair(src, p, n);
        if (r.score > 0) pairs.push({ p: p, n: n, ni: ni, score: r.score, token: r.token, distance: r.distance });
      });
    });
    pairs.sort(function (a, b) { return b.score - a.score; });

    pairs.forEach(function (x) {
      if (usedParam[x.p.key] || usedNum[x.ni]) return;
      /* 区间明显越界且差距过大时降权，让更合适的组合胜出 */
      var inRange = x.n.value >= x.p.min - 1e-9 && x.n.value <= x.p.max + 1e-9;
      if (!inRange && x.score < 20) return;
      usedParam[x.p.key] = 1; usedNum[x.ni] = 1;
      mapping.push({
        key: x.p.key, label: x.p.label, value: x.n.value,
        source: x.token === (x.p.unit || '') ? '量纲' : '关键词',
        token: x.token, distance: x.distance, raw: x.n.raw
      });
    });

    /* 顺序回退：仅当剩余数字与剩余参数数量恰好相等时启用，并标注来源 */
    var restP = params.filter(function (p) { return !usedParam[p.key]; });
    var restN = nums.filter(function (n, i) { return !usedNum[i]; });
    var orderFallback = 0;
    if (restP.length && restP.length === restN.length) {
      restP.forEach(function (p, i) {
        mapping.push({
          key: p.key, label: p.label, value: restN[i].value,
          source: '顺序', token: null, distance: null, raw: restN[i].raw
        });
        orderFallback++;
      });
    }

    return {
      provider: 'offline',
      mapping: mapping,
      missing: params.filter(function (p) {
        return !mapping.some(function (m) { return m.key === p.key; });
      }).map(function (p) { return { key: p.key, label: p.label }; }),
      orderFallback: orderFallback
    };
  }

  function isNumeric(p) {
    return p.type === 'range';
  }

  /* ---------- 语义通道（大模型，严格 JSON） ---------- */
  function buildSchema(lab) {
    return flatten(lab.params).map(function (p) {
      if (p.type === 'range') {
        return { key: p.key, label: p.label, type: 'number', min: p.min, max: p.max, step: p.step, unit: p.unit || '' };
      }
      if (p.type === 'select' || p.type === 'seg') {
        return { key: p.key, label: p.label, type: 'enum', options: p.options.map(function (o) { return o.value; }) };
      }
      if (p.type === 'toggle') return { key: p.key, label: p.label, type: 'boolean' };
      return { key: p.key, label: p.label, type: 'text' };
    });
  }

  function buildPrompt(lab, text) {
    var schema = buildSchema(lab);
    var sys = [
      '你是运筹学建模助手。任务：把用户用自然语言描述的业务问题，转换成该仿真实验的参数。',
      '【严格规则】',
      '1. 只输出一个 JSON 对象，不要任何解释文字，不要 markdown 代码块围栏。',
      '2. JSON 的键只能是下面 schema 中出现的 key；无法从描述中确定的键必须省略，绝对不要猜测或填默认值。',
      '3. number 类型的值必须是数字，且落在 [min, max] 内；enum 类型必须是 options 中的某一项；boolean 为 true/false。',
      '4. 尽量利用单位（元、小时、件、人、台等）判断数值属于哪个参数。',
      '5. 输出示例：{"c1": 80, "b1": 150}',
      '【当前实验】' + lab.name + '（' + (lab.subtitle || '') + '）',
      '【场景背景】' + (lab.scenario || lab.brief || ''),
      '【参数 schema】',
      JSON.stringify(schema, null, 1)
    ].join('\n');
    return [{ role: 'system', content: sys }, { role: 'user', content: text }];
  }

  function extractJson(s) {
    var t = String(s || '').trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    var i = t.indexOf('{'), j = t.lastIndexOf('}');
    if (i < 0 || j <= i) return null;
    try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { return null; }
  }

  /** 把模型返回的原始对象转成标准 mapping（同时做类型与枚举校验） */
  function mappingFromJson(obj, lab) {
    var defs = {};
    flatten(lab.params).forEach(function (p) { defs[p.key] = p; });
    var mapping = [];
    Object.keys(obj || {}).forEach(function (k) {
      var p = defs[k];
      if (!p) return;
      var raw = obj[k];
      if (p.type === 'range') {
        var v = Number(raw);
        if (!isFinite(v)) return;
        mapping.push({ key: k, label: p.label, value: v, source: '语义', token: null, distance: null, raw: String(raw) });
      } else if (p.type === 'select' || p.type === 'seg') {
        var okOpt = p.options.some(function (o) { return String(o.value) === String(raw); });
        if (!okOpt) return;
        mapping.push({ key: k, label: p.label, value: raw, source: '语义', token: null, distance: null, raw: String(raw) });
      } else if (p.type === 'toggle') {
        mapping.push({ key: k, label: p.label, value: !!raw, source: '语义', token: null, distance: null, raw: String(raw) });
      } else if (p.type === 'text') {
        mapping.push({ key: k, label: p.label, value: String(raw), source: '语义', token: null, distance: null, raw: String(raw) });
      }
    });
    return {
      provider: 'cloud',
      mapping: mapping,
      missing: flatten(lab.params).filter(function (p) {
        return !mapping.some(function (m) { return m.key === p.key; });
      }).map(function (p) { return { key: p.key, label: p.label }; }),
      orderFallback: 0
    };
  }

  /* ---------- 校验：裁剪、吸附步长、显式告警 ---------- */
  function clampAll(mapping, lab) {
    var defs = {};
    flatten(lab.params).forEach(function (p) { defs[p.key] = p; });
    var warnings = [];
    var values = {};
    mapping.forEach(function (m) {
      var p = defs[m.key];
      if (!p) return;
      var v = m.value;
      if (p.type === 'range') {
        if (v < p.min) { warnings.push(m.label + '：' + v + ' 低于下限，已裁剪为 ' + p.min); v = p.min; }
        if (v > p.max) { warnings.push(m.label + '：' + v + ' 高于上限，已裁剪为 ' + p.max); v = p.max; }
        if (p.step) {
          var snapped = Math.round((v - p.min) / p.step) * p.step + p.min;
          snapped = Number(snapped.toFixed(6));
          if (Math.abs(snapped - v) > 1e-9) {
            warnings.push(m.label + '：' + v + ' 不是步长 ' + p.step + ' 的整数倍，已吸附为 ' + snapped);
            v = snapped;
          }
        }
        v = Number(v.toFixed(6));
      }
      values[m.key] = v;
      m.applied = v;
    });
    return { values: values, warnings: warnings };
  }

  /* ===========================================================================
   * 对外接口
   * ======================================================================== */
  var NL = {
    flatten: flatten,
    normalize: normalize,
    scanNumbers: scanNumbers,
    parseByRules: parseByRules,
    mappingFromJson: mappingFromJson,
    extractJson: extractJson,
    clampAll: clampAll,
    buildSchema: buildSchema,

    /** 规则通道：纯本地解析（同步） */
    parse: function (text, lab) { return parseByRules(text, lab); },

    /** 语义通道：调用大模型解析（异步），失败自动回落到规则通道 */
    parseAsync: async function (text, lab) {
      var ruleResult = parseByRules(text, lab);
      if (!OR.AI || typeof OR.AI.complete !== 'function') {
        return Object.assign(ruleResult, { note: '未接入大模型，已使用本地规则解析' });
      }
      var res;
      try {
        res = await OR.AI.complete(buildPrompt(lab, text));
      } catch (e) {
        return Object.assign(ruleResult, { note: '大模型调用失败，已回落到本地规则解析' });
      }
      if (!res || res.provider === 'offline' || !String(res.text || '').trim()) {
        return Object.assign(ruleResult, { note: '大模型不可用，已回落到本地规则解析' });
      }
      var obj = extractJson(res.text);
      if (!obj) {
        return Object.assign(ruleResult, { note: '大模型返回内容无法解析为 JSON，已回落到本地规则解析' });
      }
      var byAi = mappingFromJson(obj, lab);
      if (!byAi.mapping.length) {
        return Object.assign(ruleResult, { note: '大模型未识别出可用参数，已回落到本地规则解析' });
      }
      /* 语义通道有结果、但某些参数缺失时，用规则通道补齐（只在关键词明确匹配时） */
      var aiKeys = {};
      byAi.mapping.forEach(function (m) { aiKeys[m.key] = 1; });
      ruleResult.mapping.forEach(function (m) {
        if (!aiKeys[m.key] && m.source === '关键词') {
          byAi.mapping.push(m);
          aiKeys[m.key] = 1;
        }
      });
      byAi.missing = flatten(lab.params).filter(function (p) { return !aiKeys[p.key]; })
        .map(function (p) { return { key: p.key, label: p.label }; });
      byAi.note = '由大模型完成语义解析' + (byAi.mapping.some(function (m) { return m.source === '关键词'; }) ? '，并由本地规则补齐关键词命中项' : '');
      return byAi;
    },

    /** 生成一句按参数逐项描述的示例文本 */
    example: function (lab) {
      var parts = flatten(lab.params).filter(isNumeric).map(function (p) {
        return p.label + ' ' + p.value + (p.unit ? p.unit : '');
      });
      return '现有条件如下：' + parts.join('，') + '。请据此求解。';
    },

    /** 打开建模弹窗；onApply(values) 由调用方负责写入并重算 */
    open: function (lab, onApply) {
      var h = function (t, a, c) { return U.el(t, a, c); };
      var ta = h('textarea.input', {
        rows: '5',
        placeholder: '用一段话描述你的业务问题，例如：每张桌子的利润是 80 元，每把椅子 60 元，木料共有 150 单位，装配工时 60 小时……'
      });
      ta.style.minHeight = '104px';
      ta.style.resize = 'vertical';
      ta.style.lineHeight = '1.7';

      var out = h('div', { style: 'margin-top:12px' });
      var last = null;

      function renderResult(r) {
        out.innerHTML = '';
        var defs = {};
        flatten(lab.params).forEach(function (p) { defs[p.key] = p; });
        var clinch = clampAll(r.mapping, lab);

        var head = h('div.hstack.wrap', { style: 'gap:8px;margin-bottom:9px;align-items:center' }, [
          h('span.pill.' + (r.provider === 'cloud' ? 'p-brand' : 'p-warn'), {
            text: r.provider === 'cloud' ? '语义通道 · 大模型' : '规则通道 · 本地'
          }),
          h('span.small.muted', {
            text: '识别 ' + r.mapping.length + ' 项 · 未识别 ' + r.missing.length + ' 项' +
              (r.orderFallback ? ' · 其中 ' + r.orderFallback + ' 项按出现顺序匹配' : '')
          })
        ]);
        out.appendChild(head);

        if (!r.mapping.length) {
          out.appendChild(h('div.note.rose', {
            html: '没有识别出可用参数。请把「参数名 + 数值 + 单位」写清楚，例如「<b>木料可用量 150 单位</b>」。'
          }));
          return;
        }

        var rows = r.mapping.map(function (m) {
          var p = defs[m.key] || {};
          var changed = m.applied !== undefined && Math.abs(Number(m.applied) - Number(m.value)) > 1e-9;
          return '<tr>' +
            '<td>' + esc(m.label) + '</td>' +
            '<td style="font-variant-numeric:tabular-nums">' + esc(String(m.raw)) +
            (changed ? ' <span class="pill p-warn" style="margin-left:4px">→ ' + esc(String(m.applied)) + '</span>' : '') + '</td>' +
            '<td>' + esc(m.source) + (m.token ? '（' + esc(m.token) + '）' : '') + '</td>' +
            '<td class="muted">' + (p.min !== undefined ? p.min + ' ~ ' + p.max : '—') + '</td>' +
            '</tr>';
        }).join('');
        out.appendChild(h('div.tbl-wrap', {
          html: '<table class="tbl"><thead><tr><th>参数</th><th>识别值</th><th>匹配依据</th><th>允许区间</th></tr></thead><tbody>' + rows + '</tbody></table>'
        }));

        if (r.missing.length) {
          out.appendChild(h('div.note', {
            html: '<b>未识别（保留原值）：</b>' + r.missing.map(function (m) { return esc(m.label); }).join('、')
          }));
        }
        if (clinch.warnings.length) {
          out.appendChild(h('div.note.warn', {
            html: '<b>已按参数定义修正：</b><br>' + clinch.warnings.map(esc).join('<br>')
          }));
        }
        out.appendChild(h('div.note', {
          html: '写入前请核对上表。<b>AI 只负责翻译，不负责判断对错</b>——模型对不对，仍要由你回到理论页确认。' +
            (r.note ? '<br><span class="muted">' + esc(r.note) + '</span>' : '')
        }));

        last = clinch.values;
      }

      var modal = U.modal({
        title: 'AI 建模 · 用一段话生成实验参数',
        width: '720px',
        html: '',
        actions: [
          { label: '填入示例', onClick: function () { ta.value = NL.example(lab); return false; } },
          { label: '解析', onClick: function () { doParse(); return false; } },
          {
            label: '应用到参数台', primary: true, onClick: function () {
              if (!last || !Object.keys(last).length) { U.toast('请先解析出可用参数', 'warn'); return false; }
              onApply(last);
              U.toast('已应用 ' + Object.keys(last).length + ' 项参数', 'ok');
              return true;
            }
          }
        ]
      });

      modal.body.appendChild(h('p.small.muted', {
        text: '把业务描述写成「参数名 + 数值 + 单位」，识别率最高。数值超出参数定义的区间会被裁剪并提示。',
        style: 'margin:0 0 8px'
      }));
      modal.body.appendChild(ta);
      modal.body.appendChild(out);

      async function doParse() {
        var text = String(ta.value || '').trim();
        if (!text) { U.toast('请先输入业务描述', 'warn'); return; }
        out.innerHTML = '<div class="small muted" style="padding:10px 0">解析中…</div>';
        var r;
        try {
          r = await NL.parseAsync(text, lab);
        } catch (e) {
          r = NL.parse(text, lab);
          r.note = '解析异常，已使用本地规则通道：' + e.message;
        }
        renderResult(r);
      }
    }
  };

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  OR.NL = NL;
})(typeof window !== 'undefined' ? window : globalThis);

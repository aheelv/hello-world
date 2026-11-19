/* =============================================================================
 * OR-SimLab · 实验工作台视图
 * -----------------------------------------------------------------------------
 * 左侧参数控制面板 + 右侧结果展示区，参数变化即时重算并把上下文推送给 AI 助教。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var U = OR.ui;

  function h(t, a, c) { return U.el(t, a, c); }

  var LEVEL_META = {
    1: { name: '入门', color: 'p-lv1', badge: 'lv1' },
    2: { name: '进阶', color: 'p-lv2', badge: 'lv2' },
    3: { name: '挑战', color: 'p-lv3', badge: 'lv3' }
  };

  function render(labId, root, tab) {
    var lab = OR.Lab.get(labId);
    if (!lab) { root.appendChild(h('div.empty', { html: '<div class="ico">🔍</div><h4>未找到该实验场景</h4>' })); return; }
    tab = tab || 'result';

    var values = Object.assign({}, OR.Lab.defaults(lab.params));
    var runCount = 0;
    var timer = null;
    var lastResult = null;

    /* ---------- 顶部信息条 ---------- */
    var lv = LEVEL_META[lab.level];
    var headCard = h('div.card');
    headCard.appendChild(h('div.card-body', { style: 'padding:16px 18px' }, [
      h('div.hstack.wrap', { style: 'gap:10px;align-items:flex-start' }, [
        h('div.scn-icon.i-' + (lab.tone || 'brand'), { html: U.icon(lab.icon, 19) }),
        h('div', { style: 'flex:1;min-width:220px' }, [
          h('div.hstack.wrap', { style: 'gap:8px' }, [
            h('h2', { text: lab.name, style: 'font-size:19px;letter-spacing:-.025em' }),
            h('span.pill.' + lv.color, { text: lv.name }),
            h('span.pill.p-brand', { text: lab.topic })
          ]),
          h('div.small.muted', { text: lab.subtitle, style: 'margin-top:3px;font-weight:600' })
        ]),
        h('div.hstack', { style: 'gap:7px' }, [
          h('button.btn.btn-sm.btn-ai', {
            title: '用一段业务描述自动生成实验参数（AI 建模）',
            html: U.icon('spark', 14) + '<span>AI 建模</span>',
            onclick: function () {
              if (!OR.NL) { U.toast('AI 建模模块未加载', 'warn'); return; }
              OR.NL.open(lab, function (nv) {
                Object.assign(values, nv);
                buildParams();
                schedule(true);
              });
            }
          }),
          h('button.btn.btn-sm', { html: U.icon('reset', 14) + '<span>恢复默认</span>', onclick: function () {
            values = Object.assign({}, OR.Lab.defaults(lab.params));
            buildParams();
            schedule(true);
            U.toast('已恢复默认参数', 'ok');
          } }),
          h('button.btn.btn-sm.btn-soft', { html: U.icon('check', 14) + '<span>记录成绩</span>', onclick: function () {
            var p = OR.Store.getProgress(lab.id);
            OR.Store.setProgress(lab.id, { runs: (p.runs || 0) + 1 });
            OR.Store.record({ lab: lab.id, labName: lab.name, params: values, summary: lastResult ? lastResult.summary : '' });
            U.toast('已记录本次实验结果到学习档案', 'ok');
          } })
        ])
      ]),
      h('div.scn-tags', { style: 'margin-top:12px' }, (lab.tags || []).map(function (t) { return h('span.pill', { text: t }); })),
      knowledgeChips(lab),
      h('p', { text: lab.brief, style: 'margin:11px 0 0;font-size:13.2px;color:var(--ink-500)' })
    ]));

    /* ---------- 参数面板 ---------- */
    var paramsBody = h('div.card-body');
    var paramsCard = h('div.card', null, [
      h('div.card-head', null, [
        h('h3', { text: '参数控制台' }),
        h('span.sub', { id: 'param-hint', text: '调整后自动重算' })
      ]),
      paramsBody
    ]);

    function buildParams() {
      paramsBody.innerHTML = '';
      function build(list, parent) {
        list.forEach(function (def) {
          if (def.type === 'group') {
            var g = h('details', { style: 'margin-bottom:14px', open: def.collapsed ? null : 'open' });
            g.appendChild(h('summary', {
              text: def.title,
              style: 'font-size:12.5px;font-weight:700;color:var(--ink-600);cursor:pointer;padding:6px 0;letter-spacing:.02em'
            }));
            var inner = h('div', { style: 'padding-top:6px' });
            build(def.params, inner);
            g.appendChild(inner);
            parent.appendChild(g);
            return;
          }
          var field = buildControl(def, function (val) { values[def.key] = val; schedule(); });
          parent.appendChild(field);
        });
      }
      build(lab.params, paramsBody);
    }

    function buildControl(def, onChange) {
      var ctrl;
      if (def.type === 'range') {
        ctrl = U.slider({
          min: def.min, max: def.max, step: def.step, value: values[def.key],
          hint: def.hint,
          onChange: function (v) { onChange(v); var unit = U.el('span.unit', { text: def.unit || '' }); }
        });
        // 实时更新单位显示
        var unitEl = U.el('span.unit', { text: def.unit || '' });
        var labelRow = h('div.field-label', null, [h('span', { text: def.label }), unitEl]);
        var numInput = ctrl.getInput();
        numInput.addEventListener('input', function () { unitEl.textContent = def.unit || ''; });
        return h('div.field', null, [labelRow, ctrl, def.hint ? h('div.field-hint', { text: def.hint }) : null]);
      }
      if (def.type === 'select') {
        ctrl = h('select.select');
        (def.options || []).forEach(function (o) {
          var op = h('option', { value: o.value, text: o.label });
          if (o.value === values[def.key]) op.selected = true;
          ctrl.appendChild(op);
        });
        ctrl.addEventListener('change', function () { onChange(ctrl.value); });
        return U.field(def.label, ctrl, def.hint, def.unit);
      }
      if (def.type === 'seg') {
        ctrl = U.segmented(def.options || [], values[def.key], function (val) { onChange(val); });
        return U.field(def.label, ctrl, def.hint, def.unit);
      }
      if (def.type === 'toggle') {
        ctrl = U.toggle(def.label, values[def.key], function (val) { onChange(val); });
        return h('div.field', null, [ctrl, def.hint ? h('div.field-hint', { text: def.hint }) : null]);
      }
      if (def.type === 'text') {
        ctrl = h('input.input', { type: 'text', value: values[def.key] });
        ctrl.addEventListener('input', function () { onChange(ctrl.value); });
        return U.field(def.label, ctrl, def.hint, def.unit);
      }
      if (def.type === 'custom' && typeof def.build === 'function') {
        return def.build(values, onChange);
      }
      return h('div');
    }

    /* ---------- 主区域 ---------- */
    var output = h('div#lab-output');

    var tabsHost = h('div.card', null, []);
    var tabsBar = U.tabs([
      { id: 'result', label: '仿真结果' },
      { id: 'knowledge', label: '知识图谱' },
      { id: 'theory', label: '理论要点' },
      { id: 'scenario', label: '场景说明' },
      { id: 'practice', label: '配套练习' }
    ], tab, function (id) {
      location.hash = '#/lab/' + lab.id + '/' + id;
    });
    tabsHost.appendChild(tabsBar);

    var workbench = h('div.workbench', null, [
      h('div.wb-side', null, [paramsCard, h('div.card', { id: 'side-extra' })]),
      h('div.wb-main', null, [headCard, tabsHost, output])
    ]);
    root.appendChild(workbench);

    /* ---------- 参数变化调度 ---------- */
    function schedule(immediate) {
      clearTimeout(timer);
      var hint = document.getElementById('param-hint');
      if (hint) hint.textContent = '正在重算…';
      timer = setTimeout(function () { execute(); }, immediate ? 0 : 300);
    }

    function execute() {
      var t0 = performance.now();
      var res;
      try {
        res = lab.run(values);
      } catch (e) {
        console.error(e);
        output.innerHTML = '';
        output.appendChild(h('div.card', { style: 'border-color:#f7c3cd' }, [
          h('div.card-body', { html: '<div style="color:#e11d48;font-weight:650">求解失败</div><p class="small muted" style="margin-top:6px">' + U.esc(e.message) + '</p>' })
        ]));
        return;
      }
      var ms = Math.round(performance.now() - t0);
      lastResult = res;
      runCount++;

      var hint = document.getElementById('param-hint');
      if (hint) hint.textContent = '第 ' + runCount + ' 次求解 · ' + ms + 'ms';

      // 渲染
      output.innerHTML = '';
      var isPractice = location.hash.indexOf('/practice') >= 0;
      var isTheory = location.hash.indexOf('/theory') >= 0;
      var isScenario = location.hash.indexOf('/scenario') >= 0;
      var isKnowledge = location.hash.indexOf('/knowledge') >= 0;

      if (isKnowledge) {
        var kgHost = h('div.lab-kg-host');
        output.appendChild(kgHost);
        if (OR.KnowledgeView) OR.KnowledgeView.renderLabGraph(kgHost, lab);
        else output.appendChild(h('div.empty', { text: '知识图谱模块未加载' }));
      } else if (isTheory || isScenario) {
        var r0 = OR.render.blocks(isTheory ? theoryBlocks(lab) : scenarioBlocks(lab));
        output.appendChild(r0.node);
        r0.mount();
      } else if (isPractice) {
        OR.Problems.renderInto(output, lab);
      } else {
        var r = OR.render.blocks(res.blocks || []);
        output.appendChild(r.node);
        r.mount();
      }

      // 推送 AI 上下文
      OR.AIPanel.setContext({
        lab: lab,
        values: values,
        summary: res.summary || '',
        prompt: buildPrompt(lab, values, res.summary)
      });

      // 侧栏附加信息
      var extra = document.getElementById('side-extra');
      if (extra) {
        extra.innerHTML = '';
        var ep = OR.Store.getProgress(lab.id);
        var eb = OR.render.blocks([{
          type: 'card', title: '学习档案', tone: 'teal', blocks: [
            { type: 'kv', pairs: [
              ['累计实验次数', (ep.runs || 0) + ' 次'],
              ['本次会话求解', runCount + ' 次'],
              ['题目正确率', ep.total ? Math.round((ep.solved / ep.total) * 100) + '%' : '尚未作答'],
              ['最近实验时间', ep.lastAt ? new Date(ep.lastAt).toLocaleString('zh-CN') : '—']
            ] },
            { type: 'html', html: '<div class="divider"></div><div class="tiny muted">每次点击「记录成绩」都会把当前参数与结论写入本地学习档案，可在「学习仪表盘」中查看汇总。</div>' }
          ]
        }]);
        extra.appendChild(eb.node);
        eb.mount();
      }
    }

    buildParams();
    execute();
  }

  function theoryBlocks(lab) {
    return [
      { type: 'card', title: '学习目标', tone: 'brand', blocks: [
        { type: 'list', items: (lab.objectives || []).map(function (o, i) { return '<b>' + (i + 1) + '.</b> ' + o; }) }
      ], sub: '完成本实验后你应当能够' },
      { type: 'card', title: '核心理论', tone: 'violet', blocks: [
        { type: 'list', items: lab.theory || [] }
      ], sub: lab.topic + ' 的关键结论' }
    ];
  }

  function scenarioBlocks(lab) {
    return [
      { type: 'card', title: '真实业务场景', tone: 'teal', blocks: [
        { type: 'html', html: '<p style="font-size:13.6px;line-height:1.9;color:#3d4a66">' + lab.scenario + '</p>' }
      ], sub: '问题的来龙去脉' },
      { type: 'card', title: '建模提示', blocks: [
        { type: 'list', items: [
          '先明确<b>决策变量</b>：我们要决定的量是什么？（产量、服务台数、订货量、路径选择…）',
          '再明确<b>目标</b>：最大化收益还是最小化成本？',
          '然后列出<b>约束</b>：资源上限、容量限制、逻辑关系、非负性。',
          '最后判断<b>问题类型</b>：确定型还是随机型？连续还是离散？单阶段还是多阶段？这决定了该用什么方法求解。'
        ] },
        { type: 'note', html: '点击左侧参数面板任意控件，系统会立即用真实算法重新求解并刷新全部图表。把参数推到极端值（例如把容量设为 0 或把到达率调到远大于服务能力）观察模型的行为，是理解模型边界最快的办法。', tone: 'brand' }
      ], sub: '五步法把业务语言翻译成数学模型' }
    ];
  }

  function buildPrompt(lab, values, summary) {
    var lines = [];
    lines.push('实验名称：' + lab.name + '（' + lab.subtitle + '）');
    lines.push('所属领域：' + lab.topic + '，难度：' + (LEVEL_META[lab.level] || {}).name);
    lines.push('场景描述：' + lab.scenario);
    lines.push('当前参数：' + Object.keys(values).map(function (k) { return k + '=' + values[k]; }).join('，'));
    lines.push('当前结果：' + (summary || '（尚未运行）'));

    /* 知识库上下文：让助教的回答落在课程知识体系上，而不是泛泛而谈 */
    var k = lab.knowledge;
    if (k && OR.KB) {
      ['core', 'support', 'extend'].forEach(function (role) {
        var names = (k[role] || []).map(function (cid) {
          var c = OR.KB.get(cid);
          return c ? c.name : null;
        }).filter(Boolean);
        if (names.length) lines.push('关联知识点（' + ROLE_LABEL[role] + '）：' + names.join('、'));
      });
      var core = (k.core || []).map(function (cid) { return OR.KB.get(cid); }).filter(Boolean);
      var withFormula = core.filter(function (c) { return (c.formula || []).length; })[0];
      if (withFormula) {
        lines.push('核心公式（' + withFormula.name + '）：' +
          withFormula.formula.map(function (f) { return String(f).replace(/<[^>]+>/g, ''); }).join('；'));
      }
      var mistakes = [];
      core.forEach(function (c) {
        (c.mistakes || []).forEach(function (x) {
          mistakes.push(String(x.m).replace(/<[^>]+>/g, ''));
        });
      });
      if (mistakes.length) lines.push('学生在本主题上常见错误：' + mistakes.slice(0, 4).join('；'));
    }
    return lines.join('\n');
  }

  var ROLE_LABEL = { core: '核心', support: '支撑', extend: '拓展' };
  var ROLE_STYLE = {
    core: 'background:#eef3ff;color:#1e3fbf',
    support: 'background:#f1f5f9;color:#475569',
    extend: 'background:#f2eeff;color:#6d4aff'
  };

  /** 实验头部的「关联知识点」条：点标签直接进知识点详情 */
  function knowledgeChips(lab) {
    var k = lab.knowledge;
    if (!k || !OR.KB) return null;
    var chips = [];
    ['core', 'support', 'extend'].forEach(function (role) {
      (k[role] || []).forEach(function (cid) {
        var c = OR.KB.get(cid);
        if (!c) return;
        chips.push(h('a.pill', {
          href: '#/kb/' + cid,
          text: c.name,
          title: ROLE_LABEL[role] + '知识点：' + c.summary,
          style: 'text-decoration:none;cursor:pointer;' + ROLE_STYLE[role]
        }));
      });
    });
    if (!chips.length) return null;
    return h('div.hstack.wrap', { style: 'gap:5px;margin-top:11px;align-items:center' },
      [h('span.tiny.muted', { text: '关联知识点', style: 'flex:0 0 auto;font-weight:650' })].concat(chips, [
        h('button.btn.btn-sm.btn-ghost', {
          style: 'padding:3px 8px;font-size:11.5px',
          html: U.icon('layers', 12) + '<span>知识图谱</span>',
          onclick: function () { location.hash = '#/lab/' + lab.id + '/knowledge'; }
        })
      ]));
  }

  OR.LabView = { render: render, LEVEL_META: LEVEL_META };
})(typeof window !== 'undefined' ? window : globalThis);

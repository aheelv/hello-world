/* =============================================================================
 * OR-SimLab · AI 通道设置
 * -----------------------------------------------------------------------------
 * 两条推理通道的可视化配置与连通性自检：
 *   ① 自定义 OpenAI 兼容端点（学校内网 / 第三方网关，需自行配置）
 *   ② 离线知识引擎（默认，也是断网兜底）
 * 作品不内置任何第三方地址与密钥，未配置端点时自动走离线引擎。
 * 目标是让「AI 助教不可用」这件事在课堂现场永不发生。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  var CHANNEL_META = {
    cloud: {
      name: '云服务通道（未启用）', icon: 'cpu', tone: 'brand',
      desc: '本作品不内置任何第三方地址与密钥。如需大模型增强，请在「自定义端点」中填入自有服务；未配置时默认使用离线知识引擎。',
      badge: '未启用'
    },
    custom: {
      name: '自定义端点', icon: 'layers', tone: 'teal',
      desc: '接入任何兼容 OpenAI Chat Completions 协议的服务：学校自建推理集群、私有化部署模型、或第三方 API 网关。',
      badge: '可选'
    },
    offline: {
      name: '离线知识引擎', icon: 'book', tone: 'amber',
      desc: '完全运行在浏览器内的教学知识引擎：内置运筹学概念条目、公式推导模板与结果诊断规则，通过关键词与数值信号匹配生成回答，不需要任何网络请求。',
      badge: '兜底'
    }
  };

  /* ---------- 通道状态卡 ---------- */
  function channelCard(kind, active) {
    var U = OR.ui;
    var m = CHANNEL_META[kind];
    var avail = kind === 'cloud' ? !!(OR.AI.config && OR.AI.config.publishableKey)
      : kind === 'custom' ? !!OR.Store.get('settings.apiBase', '')
        : true;

    return U.el('div.card' + (active ? '' : ''), {
      style: active ? 'border-color:var(--brand-300);box-shadow:var(--sh-brand)' : ''
    }, [
      U.el('div.card-body', null, [
        U.el('div.hstack', { style: 'gap:11px;margin-bottom:9px;align-items:flex-start' }, [
          U.el('div.scn-icon.i-' + m.tone, { html: U.icon(m.icon, 18) }),
          U.el('div', { style: 'flex:1;min-width:0' }, [
            U.el('div.hstack', { style: 'gap:7px' }, [
              U.el('div.scn-title', { text: m.name }),
              active ? U.el('span.pill.p-brand', { text: '使用中' }) : U.el('span.pill', { text: m.badge })
            ]),
            U.el('div.scn-sub', { text: kind === 'offline' ? '常驻可用' : (avail ? '已配置' : '未配置') })
          ]),
          (kind === 'custom')
            ? U.el('button.btn.btn-sm' + (active ? '.btn-ghost' : ''), {
              text: active ? '正在使用' : '设为首选',
              disabled: active,
              onclick: function () { setProvider('custom'); }
            })
            : null
        ]),
        U.el('p.tiny.muted', { text: m.desc, style: 'line-height:1.72;margin-bottom:0' })
      ])
    ]);
  }

  function setProvider(p) {
    OR.Store.set('settings.aiProvider', p);
    OR.ui.toast('已将「' + CHANNEL_META[p].name + '」设为首选通道', 'ok');
    OR.AIPanel.updateStatus();
    rerender();
  }

  /* ---------- 云服务面板 ---------- */
  function cloudPanel() {
    var U = OR.ui;
    var st = OR.AI.status();
    var cfg = OR.AI.config || {};
    var sdk = !!global.WorkBuddyCloud;

    var ready = !!(cfg.endpoint && cfg.publishableKey);
    var rows = [
      ['服务端点', cfg.endpoint || '未配置'],
      ['公开密钥', ready ? (cfg.publishableKey.slice(0, 10) + '…' + cfg.publishableKey.slice(-4)) : '未配置'],
      ['SDK 状态', sdk ? '已加载' : '未加载'],
      ['通道可用性', ready ? '可用' : '未配置 — 自动走「自定义端点 → 离线知识引擎」'],
      ['当前模型', st.modelName || '（首次调用后确定）']
    ];

    var body = U.el('div');
    body.appendChild(U.el('div.card-body', null, [
      U.el('div', null, rows.map(function (p, i) {
        return U.el('div.hstack', {
          style: 'padding:7px 0;gap:14px;' + (i < rows.length - 1 ? 'border-bottom:1px solid var(--line)' : '')
        }, [
          U.el('span', { text: p[0], style: 'font-size:12.6px;color:var(--ink-400);font-weight:600;flex:0 0 34%;min-width:96px' }),
          U.el('span.mono', { text: String(p[1]), style: 'font-size:11.8px;color:var(--ink-700);flex:1;word-break:break-all' })
        ]);
      })),
      U.el('div.hstack', { style: 'gap:9px;margin-top:14px' }, [
        U.el('button.btn.btn-sm.btn-primary', {
          html: U.icon('spark', 13) + '<span>测试云服务连通性</span>',
          onclick: function (e) { probe('cloud', e.currentTarget); }
        }),
        U.el('button.btn.btn-sm.btn-soft', {
          html: U.icon('reset', 13) + '<span>重载 SDK</span>',
          onclick: function () {
            OR.Store.set('settings.aiProvider', 'cloud');
            OR.ui.toast('已请求使用云服务通道，请点击「测试连通性」验证', 'ok');
            OR.AIPanel.updateStatus();
            rerender();
          }
        })
      ])
    ]));

    return U.el('div.card', null, [
      U.el('div.card-head', null, [
        U.el('h3', { text: '云服务通道详情' }),
        U.el('span.spacer'),
        U.el('span.pill' + (sdk && st.cloudReady ? '.p-green' : '.p-amber'), {
          text: sdk && st.cloudReady ? '就绪' : (sdk ? '待验证' : 'SDK 未加载')
        })
      ]),
      body
    ]);
  }

  /* ---------- 自定义端点面板 ---------- */
  function customPanel() {
    var U = OR.ui;
    var s = OR.Store.get('settings', {}) || {};

    var baseInput = U.el('input.input', {
      type: 'text', placeholder: 'https://your-gateway.example.com/v1',
      value: s.apiBase || ''
    });
    var keyInput = U.el('input.input', {
      type: 'password', placeholder: 'sk-...（仅保存在本机浏览器）',
      value: s.apiKey || ''
    });
    var modelInput = U.el('input.input', {
      type: 'text', placeholder: '例如 gpt-4o-mini / qwen-plus / deepseek-chat',
      value: s.aiModel || ''
    });
    var showKey = U.el('input', { type: 'checkbox' });
    showKey.addEventListener('change', function () {
      keyInput.type = showKey.checked ? 'text' : 'password';
    });

    var fields = U.el('div.vstack', { style: 'gap:14px' }, [
      U.field('API Base URL', baseInput, '需包含版本路径，例如 /v1。请求将发往 {Base}/chat/completions。'),
      U.field('API Key', keyInput, '经浏览器 localStorage 保存，不经过任何服务器转发。'),
      U.el('label.hstack', { style: 'gap:8px;font-size:12.5px' }, [showKey, U.el('span.small.muted', { text: '显示密钥明文' })]),
      U.field('模型名称', modelInput, '留空时使用 gpt-4o-mini。')
    ]);

    var protoNote = OR.render.block(OR.Lab.B.note(
      '<b>协议兼容性</b>：仅要求服务端支持 <code>POST {Base}/chat/completions</code>，请求体为 <code>{model, messages, stream:true}</code>，响应为 SSE 流。已在 DeepSeek、通义千问（DashScope 兼容模式）、vLLM / Ollama 网关等端点上验证。若服务端不支持流式返回，AI 助教会自动退化为一次性输出。',
      'teal')).node;
    protoNote.style.marginTop = '16px';

    var card = U.el('div.card', null, [
      U.el('div.card-head', null, [
        U.el('h3', { text: '自定义端点配置' }),
        U.el('span.spacer'),
        U.el('button.btn.btn-sm.btn-ghost', {
          text: '填入示例',
          onclick: function () {
            baseInput.value = 'https://api.deepseek.com/v1';
            modelInput.value = 'deepseek-chat';
            OR.ui.toast('已填入示例端点，需自行补充 API Key', 'warn');
          }
        })
      ]),
      U.el('div.card-body', null, [
        fields,
        U.el('div.hstack', { style: 'gap:9px;margin-top:16px;flex-wrap:wrap' }, [
          U.el('button.btn.btn-sm.btn-primary', {
            html: U.icon('check', 13) + '<span>保存并检测</span>',
            onclick: function (e) {
              var base = baseInput.value.trim().replace(/\/+$/, '');
              if (!base) { OR.ui.toast('请填写 API Base URL', 'err'); return; }
              if (!/^https?:\/\//i.test(base)) { OR.ui.toast('地址需以 http:// 或 https:// 开头', 'err'); return; }
              OR.Store.set('settings.apiBase', base);
              OR.Store.set('settings.apiKey', keyInput.value.trim());
              OR.Store.set('settings.aiModel', modelInput.value.trim());
              OR.Store.set('settings.aiProvider', 'custom');
              OR.ui.toast('自定义端点已保存，正在检测…', 'ok');
              OR.AIPanel.updateStatus();
              probe('custom', e.currentTarget, function () { rerender(); });
            }
          }),
          U.el('button.btn.btn-sm', {
            html: U.icon('close', 13) + '<span>清空配置</span>',
            onclick: function () {
              OR.Store.set('settings.apiBase', '');
              OR.Store.set('settings.apiKey', '');
              OR.Store.set('settings.aiModel', '');
              if (OR.Store.get('settings.aiProvider', 'cloud') === 'custom') OR.Store.set('settings.aiProvider', 'cloud');
              OR.ui.toast('自定义端点配置已清空', 'ok');
              OR.AIPanel.updateStatus();
              rerender();
            }
          })
        ]),
        protoNote
      ])
    ]);

    return card;
  }

  /* ---------- 连通性自检 ---------- */
  function probe(kind, btn, after) {
    var U = OR.ui;
    var old = btn ? btn.innerHTML : null;
    if (btn) { btn.disabled = true; btn.innerHTML = U.icon('reset', 13) + '<span>检测中…</span>'; }
    var t0 = Date.now();

    OR.AI.ask('concept', '请只回答四个字：通道正常。', {
      lab: { name: '【连通性自检】', topic: '系统' },
      summary: '这是一次 AI 通道连通性自检请求，与任何具体实验无关。',
      prompt: '【连通性自检】用户正在验证 AI 通道是否可用，请直接回复「通道正常」，不要展开讲解。'
    }, {
      onStart: function (provider, model) {
        OR.ui.toast('正在通过「' + (CHANNEL_META[provider] ? CHANNEL_META[provider].name : provider) + '」' +
          (model ? '（' + model + '）' : '') + ' 请求…', 'info', 1800);
      },
      onDone: function (text, provider) {
        var ms = Date.now() - t0;
        if (btn) { btn.disabled = false; btn.innerHTML = old; }
        var label = CHANNEL_META[provider] ? CHANNEL_META[provider].name : provider;
        U.modal({
          title: '连通性自检结果',
          html: '<div style="font-size:13px;line-height:1.85">' +
            '<p><b>实际使用通道：</b>' + label + '</p>' +
            '<p><b>响应耗时：</b>' + ms + ' ms</p>' +
            '<p><b>应答内容：</b></p>' +
            '<div style="background:var(--bg-alt);border-radius:9px;padding:11px 13px;font-size:12.5px">' +
            U.esc(text || '（空响应）') + '</div>' +
            (provider !== kind
              ? '<p class="small muted" style="margin-top:10px">注意：首选通道为「' + CHANNEL_META[kind].name +
              '」，但实际由「' + label + '」完成应答，说明发生了自动降级。请检查首选通道的网络与配置。</p>'
              : '<p class="small muted" style="margin-top:10px">首选通道工作正常。</p>') +
            '</div>',
          actions: [{ label: '知道了', primary: true }]
        });
        if (after) after();
      },
      onError: function (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = old; }
        U.modal({
          title: '连通性自检失败',
          html: '<div style="font-size:13px;line-height:1.8">' +
            '<p>首选通道「' + CHANNEL_META[kind].name + '」未能完成应答。</p>' +
            '<p><b>错误信息：</b></p>' +
            '<div style="background:var(--rose-50);color:#be123c;border-radius:9px;padding:11px 13px;font-size:12.2px;word-break:break-all">' +
            U.esc(err && err.message ? err.message : String(err)) + '</div>' +
            '<p class="small muted" style="margin-top:10px">系统会自动退回到可用的下一级通道，教学不会中断。若要验证其他通道，请切换首选通道后重试。</p>' +
            '</div>',
          actions: [{ label: '知道了', primary: true }]
        });
        if (after) after();
      }
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.innerHTML = old; }
      U.toast('检测异常：' + (e && e.message ? e.message : e), 'err');
    });
  }

  /* ---------- 离线引擎面板 ---------- */
  function offlinePanel() {
    var U = OR.ui;
    var terms = (OR.AI._terms && OR.AI._terms('线性规划 单纯形法 影子价格 排队论 库存 动态规划')) || [];
    return U.el('div.card', null, [
      U.el('div.card-head', null, [
        U.el('h3', { text: '离线知识引擎' }),
        U.el('span.spacer'),
        U.el('span.pill.p-green', { text: '常驻可用' })
      ]),
      U.el('div.card-body', null, [
        U.el('p.small.muted', {
          text: '当云服务与自定义端点都不可用时，助教会自动切换到本地引擎。它不依赖任何网络请求，因此即使断网、防火墙阻断或密钥失效，课堂演示依然可以进行。',
          style: 'line-height:1.75'
        }),
        U.el('div.grid.g3', { style: 'margin-top:4px' }, [
          U.el('div.stat.t-teal', { style: 'padding:12px 14px' }, [
            U.el('div.stat-k', { text: '知识条目' }),
            U.el('div.stat-v', { text: '30+', style: 'font-size:20px' }),
            U.el('div.stat-d', { text: '覆盖运筹学主干概念' })
          ]),
          U.el('div.stat.t-violet', { style: 'padding:12px 14px' }, [
            U.el('div.stat-k', { text: '诊断规则' }),
            U.el('div.stat-v', { text: '12 条', style: 'font-size:20px' }),
            U.el('div.stat-d', { text: '基于数值信号的自动解读' })
          ]),
          U.el('div.stat.t-amber', { style: 'padding:12px 14px' }, [
            U.el('div.stat-k', { text: '网络依赖' }),
            U.el('div.stat-v', { text: '零', style: 'font-size:20px' }),
            U.el('div.stat-d', { text: '纯浏览器内运行' })
          ])
        ]),
        U.el('div.hstack', { style: 'gap:9px;margin-top:15px;flex-wrap:wrap' }, [
          U.el('button.btn.btn-sm', {
            html: U.icon('spark', 13) + '<span>离线引擎试答</span>',
            onclick: function (e) { probe('offline', e.currentTarget); }
          }),
          U.el('button.btn.btn-sm.btn-ghost', {
            text: '切换到离线通道',
            onclick: function () { setProvider('offline'); }
          })
        ]),
        terms.length
          ? U.el('div.tiny.muted', { text: '当前分词示例：' + terms.slice(0, 12).join(' / '), style: 'margin-top:10px' })
          : null
      ])
    ]);
  }

  /* ---------- 数据与隐私 ---------- */
  function privacyPanel() {
    var U = OR.ui;
    var answers = OR.Store.get('answers', {}) || {};
    var nAns = Object.keys(answers).length;
    return U.el('div.card', null, [
      U.el('div.card-head', null, [
        U.el('h3', { text: '数据与隐私' }),
        U.el('span.spacer'),
        U.el('button.btn.btn-sm.btn-ghost', {
          text: '清空全部本地数据',
          onclick: function () {
            U.modal({
              title: '清空全部本地数据',
              html: '<p>将删除作答记录、错题本、实验轨迹、进度与 AI 配置。</p>' +
                '<p class="small muted">该操作不可撤销，建议先到「学习档案」页导出 JSON 备份。</p>',
              actions: [
                { label: '取消' },
                {
                  label: '确认清空', primary: true, onClick: function () {
                    OR.Store.reset();
                    U.toast('全部本地数据已清空', 'ok');
                    setTimeout(function () { location.reload(); }, 500);
                  }
                }
              ]
            });
          }
        })
      ]),
      U.el('div.card-body', null, [
        U.el('div.vstack', { style: 'gap:11px' }, [
          privacyRow('存储位置', '浏览器 localStorage（键名 orsimlab.v1）'),
          privacyRow('已保存作答', nAns + ' 条题目记录'),
          privacyRow('发送给模型的内容', '当前场景名称、参数取值、求解摘要与你输入的问题；不含姓名、学号等身份信息'),
          privacyRow('自定义密钥', '仅存于本机浏览器，由浏览器直接向你的端点发起请求，不经平台服务器'),
          privacyRow('云服务通道', '请求经平台托管网关转发至大模型，仅用于生成教学回答')
        ])
      ])
    ]);
  }

  function privacyRow(k, v) {
    var U = OR.ui;
    return U.el('div.hstack', { style: 'gap:14px;align-items:flex-start' }, [
      U.el('span', { text: k, style: 'font-size:12.6px;color:var(--ink-400);font-weight:600;flex:0 0 30%;min-width:100px' }),
      U.el('span', { text: v, style: 'font-size:12.8px;color:var(--ink-700);flex:1;line-height:1.7' })
    ]);
  }

  /* ---------- 渲染 ---------- */
  var host = null;

  function rerender() {
    if (host) render(host);
  }

  function render(root) {
    var U = OR.ui;
    host = root;
    var st = OR.AI.status();
    var active = OR.Store.get('settings.aiProvider', 'cloud') || 'cloud';
    root.innerHTML = '';

    /* 当前状态横幅 */
    var bannerTone = st.provider === 'cloud' ? 'brand' : st.provider === 'custom' ? 'teal' : 'amber';
    root.appendChild(U.el('div.card', {
      style: 'margin-top:4px;background:linear-gradient(135deg,var(--brand-50),#fff);border-color:var(--brand-100)'
    }, [
      U.el('div.card-body', { style: 'padding:18px 20px' }, [
        U.el('div.hstack', { style: 'gap:14px;align-items:flex-start;flex-wrap:wrap' }, [
          U.el('div.scn-icon.i-' + bannerTone, { html: U.icon('cpu', 20) }),
          U.el('div', { style: 'flex:1;min-width:240px' }, [
            U.el('div.hstack', { style: 'gap:9px;margin-bottom:5px' }, [
              U.el('h3', { text: 'AI 助教推理通道', style: 'font-size:15.5px' }),
              U.el('span.pill.p-brand', { text: '首选：' + (CHANNEL_META[active] ? CHANNEL_META[active].name : active) }),
              U.el('span.pill' + (st.sdkReady ? '.p-green' : '.p-amber'), {
                text: st.sdkReady ? '云 SDK 已加载' : '云 SDK 未加载'
              })
            ]),
            U.el('p.small.muted', {
              text: '系统按「首选通道 → 其余可用通道 → 离线引擎」的顺序自动降级。你只需要选一个首选通道，剩下的交给系统判断。某条通道临时不可用不会影响上课。',
              style: 'line-height:1.72;margin:0'
            }),
            st.lastError
              ? U.el('div.tiny', { text: '最近一次错误：' + st.lastError, style: 'margin-top:8px;color:#be123c' })
              : null
          ]),
          U.el('button.btn.btn-primary', {
            html: U.icon('spark', 15) + '<span>一键自检</span>',
            onclick: function (e) { probe(active, e.currentTarget, null); }
          })
        ])
      ])
    ]));

    root.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '通道总览' }),
      U.el('span.sub', { text: '点击卡片上的按钮切换首选通道' })
    ]));
    root.appendChild(U.el('div.grid.g3', null, [
      channelCard('cloud', active === 'cloud'),
      channelCard('custom', active === 'custom'),
      channelCard('offline', active === 'offline')
    ]));

    if (active === 'cloud' || !active) {
      root.appendChild(U.el('div.sec-head', null, [U.el('h2', { text: '云服务通道' })]));
      root.appendChild(cloudPanel());
    }
    if (active === 'custom' || OR.Store.get('settings.apiBase', '')) {
      root.appendChild(U.el('div.sec-head', null, [U.el('h2', { text: '自定义端点' })]));
      root.appendChild(customPanel());
    }
    if (active === 'offline') {
      root.appendChild(U.el('div.sec-head', null, [U.el('h2', { text: '离线引擎' })]));
      root.appendChild(offlinePanel());
    } else {
      root.appendChild(U.el('div.sec-head', null, [U.el('h2', { text: '离线引擎（兜底）' })]));
      root.appendChild(offlinePanel());
    }

    root.appendChild(U.el('div.sec-head', null, [U.el('h2', { text: '隐私说明' })]));
    root.appendChild(privacyPanel());

    root.appendChild(U.el('div.hstack', { style: 'gap:10px;margin-top:20px;flex-wrap:wrap' }, [
      U.el('button.btn', {
        html: U.icon('cpu', 14) + '<span>打开 AI 助教面板</span>',
        onclick: function () { OR.AIPanel.open(); }
      }),
      U.el('button.btn.btn-ghost', {
        html: U.icon('book', 14) + '<span>阅读部署方案文档</span>',
        onclick: function () { location.hash = '#/docs/deploy'; }
      })
    ]));
  }

  OR.SettingsView = { render: render, CHANNEL_META: CHANNEL_META };
})(typeof window !== 'undefined' ? window : globalThis);

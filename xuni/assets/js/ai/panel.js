/* =============================================================================
 * OR-SimLab · AI 助教侧边面板
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var U = OR.ui;

  var refs = {};
  var ctx = { lab: null, concept: null, values: null, summary: '', prompt: '' };
  var mode = 'concept';
  var busy = false;

  function h(t, a, c) { return U.el(t, a, c); }

  function init(container) {
    var head = h('div.ai-head', null, [
      h('div.ai-avatar', { html: U.icon('cpu', 18) }),
      h('div', { style: 'flex:1;min-width:0' }, [
        h('div.ai-title', { text: 'AI 运筹助教' }),        h('div.ai-sub', null, [
          h('span.dot.pulse', { id: 'ai-status-dot' }),
          h('span', { id: 'ai-status-text', text: '正在检测通道…' })
        ])
      ]),
      h('button.btn.btn-ghost.btn-ico', { html: U.icon('close', 15), title: '收起面板', onclick: toggle })
    ]);

    var modes = h('div.ai-modes');
    Object.keys(OR.AI.ROLES).forEach(function (k) {
      var r = OR.AI.ROLES[k];
      var b = h('button.ai-mode' + (k === mode ? '.on' : ''), {
        type: 'button', title: r.desc,
        onclick: function () {
          mode = k;
          Array.prototype.forEach.call(modes.children, function (c) { c.classList.remove('on'); });
          b.classList.add('on');
          refreshQuick();
        }
      }, [h('span', { text: r.label })]);
      b.dataset.mode = k;
      modes.appendChild(b);
    });

    var log = h('div.ai-log');

    var quick = h('div.ai-quick');
    var steps = h('div.ai-steps', null, [
      h('div.k', { text: '试试这样问' }),
      quick
    ]);

    var ta = h('textarea', { rows: 1, placeholder: '问点什么…（Enter 发送，Shift+Enter 换行）' });
    var send = h('button.ai-send', { html: U.icon('send', 15), title: '发送', onclick: submit });
    var inputBox = h('div.ai-input-box', null, [ta, send]);
    var input = h('div.ai-input', null, [inputBox, h('div.ai-note', { text: '内容由 AI 生成，请结合课程教材核对' })]);

    ta.addEventListener('input', function () {
      ta.style.height = 'auto';
      ta.style.height = Math.min(108, ta.scrollHeight) + 'px';
    });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });

    refs = { head: head, modes: modes, log: log, quick: quick, ta: ta, send: send, dock: container };

    container.appendChild(head);
    container.appendChild(modes);
    container.appendChild(log);
    container.appendChild(steps);
    container.appendChild(input);
    refreshQuick();
    updateStatus();
    greet();
  }

  function greet() {
    push('bot', '你好！我是运筹学课程的 AI 助教 👋\n\n我可以帮你：\n- **概念答疑**：把抽象的模型假设、对偶理论、算法步骤讲清楚\n- **引导提示**：不直接给答案，用提问带你一步步推出来\n- **结果诊断**：解读你当前的实验数据，指出瓶颈与改进方向\n- **变式出题**：基于当前场景或知识点给你出一道新练习题\n\n进入任意实验场景后，我会自动读取你的参数与结果；在「知识图谱」里打开某个知识点后，我会以该知识点的结构化解说为底座来回答。');
  }

  function refreshQuick() {
    refs.quick.innerHTML = '';
    var role = OR.AI.ROLES[mode];
    role.quick.forEach(function (q) {
      refs.quick.appendChild(h('button', { type: 'button', text: q, onclick: function () { refs.ta.value = q; submit(); } }));
    });
  }

  function push(role, text) {
    var bubble = h('div.bubble');
    bubble.innerHTML = U.md(text);
    var msg = h('div.ai-msg.' + role, null, [
      h('div.mini-av', { html: role === 'bot' ? U.icon('cpu', 13) : U.icon('check', 12) }),
      bubble
    ]);
    refs.log.appendChild(msg);
    refs.log.scrollTop = refs.log.scrollHeight;
    return bubble;
  }

  function setContext(c) {
    ctx = Object.assign({ lab: null, concept: null, values: null, summary: '', prompt: '' }, c || {});
  }

  /** 由外部（知识点详情、实验页）直接发起一次问答 */
  function askNow(m, text) {
    if (m && OR.AI.ROLES[m]) {
      mode = m;
      if (refs.modes) {
        Array.prototype.forEach.call(refs.modes.children, function (c) {
          c.classList.toggle('on', c.dataset.mode === m);
        });
      }
      refreshQuick();
    }
    toggle(false);
    if (!refs.ta) return;
    if (text) refs.ta.value = text;
    submit();
  }

  function updateStatus() {
    var s = OR.AI.status();
    var dot = document.getElementById('ai-status-dot');
    var txt = document.getElementById('ai-status-text');
    if (!dot || !txt) return;
    var label, color;
    if (s.prefer === 'custom' && s.customReady) { label = '自定义接口 · ' + (s.modelName || '就绪'); color = '#14b8a6'; }
    else if (s.prefer === 'custom') { label = '自定义接口未配置'; color = '#f59e0b'; }
    else if (s.cloudReady) { label = '端点通道 · ' + (s.modelName || '大模型'); color = '#10b981'; }
    else { label = '本地知识引擎（离线可用）'; color = '#f59e0b'; }
    if (s.lastError && s.prefer === 'cloud' && !s.cloudReady) label = '本地知识引擎（云端不可达）';
    dot.style.background = color;
    txt.textContent = label;
  }

  async function submit() {
    if (busy) { OR.AI.stop(); busy = false; refs.send.disabled = false; return; }
    var text = refs.ta.value.trim();
    if (!text && mode === 'diagnose') text = '请诊断我当前的实验结果。';
    if (!text && mode === 'generate') text = '请基于当前场景给我出一道新题。';
    if (!text && mode === 'hint') text = '给我一点提示。';
    if (!text) { U.toast('请输入问题', 'warn'); return; }
    refs.ta.value = '';
    refs.ta.style.height = 'auto';
    push('user', text);

    busy = true;
    refs.send.disabled = true;
    refs.send.innerHTML = U.icon('close', 14);
    refs.send.title = '停止生成';

    var botBubble = push('bot', '');
    botBubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    var acc = '';
    var started = false;

    try {
      await OR.AI.ask(mode, text, ctx, {
        onStart: function (provider, name) {
          started = true;
          botBubble.innerHTML = '';
          var s = OR.AI.status();
          var dot = document.getElementById('ai-status-dot');
          var txt = document.getElementById('ai-status-text');
          if (provider === 'offline') {
            if (dot) dot.style.background = '#f59e0b';
            if (txt) txt.textContent = '本地知识引擎（离线可用）';
          } else if (dot && txt) {
            dot.style.background = '#10b981';
            txt.textContent = (provider === 'cloud' ? '云服务 · ' : '自定义接口 · ') + (name || '');
          }
        },
        onDelta: function (piece) {
          acc += piece;
          botBubble.innerHTML = U.md(acc);
          refs.log.scrollTop = refs.log.scrollHeight;
        },
        onDone: function (full, provider) {
          if (!full.trim()) botBubble.innerHTML = '<span class="muted">（没有返回内容）</span>';
          else botBubble.innerHTML = U.md(full);
        }
      });
    } catch (e) {
      botBubble.innerHTML = '<span style="color:#e11d48">调用失败：' + U.esc(e.message || e) + '</span>';
    } finally {
      busy = false;
      refs.send.disabled = false;
      refs.send.innerHTML = U.icon('send', 15);
      refs.send.title = '发送';
      updateStatus();
    }
  }

  function toggle(force) {
    var dock = document.querySelector('.ai-dock');
    if (!dock) return;
    var collapsed = force === undefined ? !dock.classList.contains('collapsed') : force;
    dock.classList.toggle('collapsed', collapsed);
    try { OR.Store.set('settings.aiCollapsed', collapsed); } catch (e) { }
  }

  function openPanel() { toggle(false); }

  OR.AIPanel = {
    init: init, setContext: setContext, toggle: toggle, open: openPanel,
    ask: askNow, updateStatus: updateStatus, _push: push
  };

})(typeof window !== 'undefined' ? window : globalThis);

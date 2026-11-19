/* =============================================================================
 * OR-SimLab · 题目系统（练习 / 自动判分 / 错题本）
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var U = OR.ui;

  function h(t, a, c) { return U.el(t, a, c); }

  var TYPE_LABEL = { single: '单项选择', number: '数值计算', text: '建模论述' };
  var LEVEL_TONE = { '概念': 'p-brand', '计算': 'p-teal', '建模': 'p-violet' };

  /** 渲染整个题库页 */
  function renderAll(root) {
    var labs = OR.Lab.all();
    var total = labs.reduce(function (s, l) { return s + (l.problems || []).length; }, 0);
    var done = 0, correct = 0;
    labs.forEach(function (l) {
      (l.problems || []).forEach(function (p) {
        var rec = OR.Store.get('answers.' + p.id, null);
        if (rec) { done++; if (rec.ok) correct++; }
      });
    });

    root.appendChild(h('div.hero', { style: 'padding:26px 30px' }, [
      h('div.hero-grid-bg'),
      h('div.hero-inner', null, [
        h('div.hero-tag', { text: 'PRACTICE BANK' }),
        h('h1', { html: '运筹学配套习题库' }),
        h('p', { text: '覆盖全部 ' + labs.length + ' 个实验场景，共 ' + total + ' 道分层题目。每题均可即时判分并给出详细解析；答错的题目会自动进入错题本，便于考前集中攻克。' }),
        h('div.hero-stats', null, [
          h('div.hero-stat', null, [h('div.v', { text: String(total) }), h('div.k', { text: '题目总数' })]),
          h('div.hero-stat', null, [h('div.v', { text: String(done) }), h('div.k', { text: '已作答' })]),
          h('div.hero-stat', null, [h('div.v', { text: done ? Math.round(correct / done * 100) + '%' : '—' }), h('div.k', { text: '正确率' })]),
          h('div.hero-stat', null, [h('div.v', { text: String(labs.length) }), h('div.k', { text: '关联实验' })])
        ]),
        h('div.hero-actions', { style: 'margin-top:20px' }, [
          h('button.btn.btn-white', { html: U.icon('reset', 15) + '<span>清空作答记录</span>', onclick: function () {
            U.modal({
              title: '确认清空作答记录？',
              html: '<p>将清除所有题目的作答状态与正确率统计，此操作不可撤销。学习档案中的实验记录不受影响。</p>',
              actions: [
                { label: '取消' },
                { label: '确认清空', primary: true, onClick: function () { OR.Store.set('answers', {}); OR.Store.set('wrong', []); location.reload(); } }
              ]
            });
          } })
        ])
      ])
    ]));

    // 错题本
    var wrongs = OR.Store.get('wrong', []);
    if (wrongs.length) {
      var wc = h('div.card', null, [
        h('div.card-head', null, [h('h3', { text: '错题本' }), h('span.sub', { text: wrongs.length + ' 道待攻克' })])
      ]);
      var wb = h('div.card-body');
      wrongs.slice(0, 8).forEach(function (w) {
        wb.appendChild(h('div.hstack', { style: 'gap:9px;padding:8px 0;border-bottom:1px solid var(--line)' }, [
          h('span.pill.p-rose', { text: w.labName || '' }),
          h('span', { text: w.q, style: 'font-size:12.8px;color:var(--ink-600);flex:1' }),
          h('button.btn.btn-sm.btn-ghost', { text: '移除', onclick: function () { OR.Store.removeWrong(w.id); location.reload(); } })
        ]));
      });
      wc.appendChild(wb);
      root.appendChild(wc);
    }

    // 按场景分组
    labs.forEach(function (lab) {
      var lv = OR.LabView.LEVEL_META[lab.level];
      var section = h('div.card', { style: 'margin-top:20px' });
      section.appendChild(h('div.card-head', null, [
        h('div.scn-icon.i-' + (lab.tone || 'brand'), { style: 'width:32px;height:32px;flex:0 0 32px', html: U.icon(lab.icon, 16) }),
        h('h3', { text: lab.name }),
        h('span.pill.' + lv.color, { text: lv.name }),
        h('span.sub', { text: (lab.problems || []).length + ' 题' }),
        h('span.spacer'),
        h('button.btn.btn-sm.btn-ghost', { text: '进入实验 →', onclick: function () { location.hash = '#/lab/' + lab.id; } })
      ]));
      var body = h('div.card-body');
      body.appendChild(quizWidget(lab, lab.problems || []));
      section.appendChild(body);
      root.appendChild(section);
    });
  }

  /** 一组题目的交互组件 */
  function quizWidget(lab, questions) {
    var wrap = h('div');
    var state = { answered: 0, correct: 0 };

    var summary = h('div.hstack', {
      style: 'gap:12px;padding:11px 14px;background:var(--brand-50);border-radius:10px;margin-bottom:14px;flex-wrap:wrap'
    });
    function refreshSummary() {
      summary.innerHTML = '';
      summary.appendChild(h('span', { html: U.icon('check2', 15), style: 'color:var(--brand-600)' }));
      summary.appendChild(h('span', { text: '已作答 ' + state.answered + ' / ' + questions.length + ' 题', style: 'font-size:12.8px;font-weight:650;color:var(--brand-700)' }));
      if (state.answered) {
        summary.appendChild(h('span', { text: '正确率 ' + Math.round(state.correct / state.answered * 100) + '%', style: 'font-size:12.8px;font-weight:650;color:var(--ink-600)' }));
      }
      summary.appendChild(h('span.spacer'));
      summary.appendChild(h('button.btn.btn-sm.btn-ghost', { text: '重做本组', onclick: function () {
        questions.forEach(function (q) { OR.Store.set('answers.' + q.id, null); });
        wrap.innerHTML = '';
        state = { answered: 0, correct: 0 };
        buildAll();
      } }));
    }

    function buildAll() {
      wrap.appendChild(summary);
      questions.forEach(function (q, i) { wrap.appendChild(questionCard(lab, q, i)); });
      refreshSummary();
      // 统计进度
      OR.Store.setProgress(lab.id, {
        solved: state.correct, total: questions.length,
        done: state.answered === questions.length
      });
    }

    function questionCard(lab, q, idx) {
      var saved = OR.Store.get('answers.' + q.id, null);
      var card = h('div.q-item' + (saved ? (saved.ok ? '.correct' : '.wrong') : ''));
      var head = h('div.q-head', null, [
        h('div.q-no', { text: String(idx + 1) }),
        h('div.q-text', { text: q.q }),
        h('div.q-meta', null, [
          h('span.pill.' + (LEVEL_TONE[q.level] || 'p-brand'), { text: q.level }),
          h('span.pill.p-outline', { text: TYPE_LABEL[q.type] || q.type })
        ])
      ]);
      card.appendChild(head);

      var exp = null;
      function showExplanation(ok) {
        if (exp) return;
        exp = h('div.q-exp', { html: '<b>' + (ok ? '✓ 回答正确' : '✗ 回答错误') + '</b><br>' + U.esc(q.explain || '') });
        card.appendChild(exp);
      }
      /**
       * 写入作答结果。
       * 注意：必须与已有记录**合并**而非覆盖，否则会丢失题型的附加字段
       * （单选题的 chosen、数值题的 input），导致刷新后无法回显学生当时的选择。
       */
      function record(ok, patch) {
        state.answered++;
        if (ok) state.correct++;
        card.classList.add(ok ? 'correct' : 'wrong');
        var prev = OR.Store.get('answers.' + q.id, null) || {};
        OR.Store.set('answers.' + q.id,
          Object.assign({}, prev, { ok: ok, ts: Date.now() }, patch || {}));
        if (ok) OR.Store.removeWrong(q.id);
        else OR.Store.addWrong({ id: q.id, labName: lab.name, q: q.q, explain: q.explain });
        showExplanation(ok);
        refreshSummary();
        OR.Store.setProgress(lab.id, { solved: state.correct, total: questions.length, done: state.answered === questions.length });
      }

      if (q.type === 'single') {
        var opts = h('div.q-opts');
        var chosen = saved ? saved.chosen : null;
        (q.options || []).forEach(function (o, oi) {
          var opt = h('div.q-opt', { dataset: { i: String(oi) } }, [
            h('span.k', { text: String.fromCharCode(65 + oi) }),
            h('span', { text: o, style: 'flex:1' })
          ]);
          if (saved) {
            if (oi === q.answer) opt.classList.add('ok');
            else if (chosen === oi) opt.classList.add('no');
          } else {
            opt.addEventListener('click', function () {
              Array.prototype.forEach.call(opts.children, function (c) { c.classList.remove('on'); });
              opt.classList.add('on');
              Array.prototype.forEach.call(opts.children, function (c) { c.style.pointerEvents = 'none'; });
              var ok = oi === q.answer;
              if (oi === q.answer) opt.classList.add('ok'); else { opt.classList.add('no'); opts.children[q.answer].classList.add('ok'); }
              record(ok, { chosen: oi });
            });
          }
          opts.appendChild(opt);
        });
        card.appendChild(opts);
        if (saved) showExplanation(saved.ok);
      } else if (q.type === 'number') {
        var input = h('input.input.num', {
          type: 'text', placeholder: '输入数值…', value: saved && saved.input !== undefined ? saved.input : '',
          style: 'max-width:220px'
        });
        var checkBtn = h('button.btn.btn-sm.btn-primary', { text: '提交答案' });
        var hint = h('span.small.muted', { text: q.tolerance ? '（允许误差 ±' + q.tolerance + '）' : '' });
        checkBtn.addEventListener('click', function () {
          var raw = String(input.value);
          var val = parseFloat(raw.replace(/[^\d.\-]/g, ''));
          if (!isNaN(val)) {
            var ok = Math.abs(val - q.answer) <= (q.tolerance || 0.01);
            input.disabled = true; checkBtn.disabled = true;
            input.style.borderColor = ok ? '#a7e8c8' : '#f7c3cd';
            if (!ok) input.value = raw + '（正确答案：' + q.answer + '）';
            record(ok, { input: raw });
          } else U.toast('请输入一个数值', 'warn');
        });
        card.appendChild(h('div.hstack.wrap', { style: 'gap:9px;margin-top:11px' }, [input, checkBtn, hint]));
        if (saved) showExplanation(saved.ok);
      } else {
        var ta = h('textarea.textarea', { placeholder: '请写下你的建模思路…' });
        var revealBtn = h('button.btn.btn-sm.btn-soft', { html: U.icon('book', 14) + '<span>查看参考答案</span>' });
        var ref = h('div.q-exp', { style: 'display:none;white-space:pre-wrap' });
        ref.innerHTML = '<b>参考答案要点</b><br>' + U.esc(q.reference || '') + (q.explain ? '<br><br><b>点评</b><br>' + U.esc(q.explain) : '');

        function selfEval(ok) {
          record(ok, { selfEval: ok, draft: ta.value || '' });
          card.classList.remove('correct', 'wrong');
          card.classList.add(ok ? 'correct' : 'wrong');
          exp = ref; // 避免重复插入解析
        }

        revealBtn.addEventListener('click', function () {
          ref.style.display = 'block';
          revealBtn.style.display = 'none';
          if (saved) return;
          /* 建模题为开放题，用自评替代机器判分；使用统一弹窗而非原生 confirm，
             以保证与整体视觉一致，并避免被浏览器拦截。 */
          U.modal({
            title: '自评：这道建模题你掌握了吗？',
            html: '<p>建模题没有唯一答案。请先对照上方的参考答案要点，检查自己的思路是否覆盖了：' +
              '<b>决策变量</b>、<b>目标函数</b>、<b>约束条件</b>、<b>求解方法</b>四个要素。</p>' +
              '<p style="margin-top:8px">选择「已掌握」记为答对；选择「需复习」会记入错题本，便于考前集中攻克。</p>',
            actions: [
              { label: '需复习', onClick: function () { selfEval(false); } },
              { label: '已掌握', primary: true, onClick: function () { selfEval(true); } }
            ]
          });
        });
        var selfWarn = h('div.tiny.muted', { text: '建模题为开放题，请先写下自己的思路再对照参考答案进行自评。' });
        card.appendChild(ta);
        card.appendChild(h('div.hstack', { style: 'margin-top:9px' }, [revealBtn]));
        card.appendChild(selfWarn);
        card.appendChild(ref);
        if (saved) {
          revealBtn.style.display = 'none';
          ref.style.display = 'block';
        }
      }
      return card;
    }

    // 初始化已有作答统计
    questions.forEach(function (q) {
      var s = OR.Store.get('answers.' + q.id, null);
      if (s) { state.answered++; if (s.ok) state.correct++; }
    });
    buildAll();
    return wrap;
  }

  /** 供实验页「配套练习」标签页使用 */
  function renderInto(container, lab) {
    container.innerHTML = '';
    container.appendChild(h('div.card', null, [
      h('div.card-head', null, [
        h('h3', { text: '配套练习' }),
        h('span.sub', { text: (lab.problems || []).length + ' 题 · 即时判分' })
      ]),
      h('div.card-body', null, [quizWidget(lab, lab.problems || [])])
    ]));
  }

  OR.Problems = { renderAll: renderAll, renderInto: renderInto, quizWidget: quizWidget, TYPE_LABEL: TYPE_LABEL };
})(typeof window !== 'undefined' ? window : globalThis);

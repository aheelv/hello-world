/* =============================================================================
 * OR-SimLab · 学习仪表盘
 * -----------------------------------------------------------------------------
 * 把 OR.Store 中的原始记录聚合成可读的学习画像：
 *   总体指标 → 分层进度 → 知识点掌握度 → 场景明细 → 实验轨迹 → 薄弱环节
 * 支持导出 JSON 学习档案与打印版学习报告。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  var TONE_BY_LEVEL = { 1: 'green', 2: 'amber', 3: 'rose' };

  /* ---------- 数据聚合 ---------- */
  function collect() {
    var labs = OR.Lab.all();
    var rows = labs.map(function (lab) {
      var p = OR.Store.getProgress(lab.id);
      var total = lab.problems ? lab.problems.length : 0;
      var answers = lab.problems ? lab.problems.filter(function (q) {
        var a = OR.Store.get('answers.' + q.id, null);
        return a && a.ok;
      }).length : 0;
      return {
        lab: lab, prog: p, total: total, correct: answers,
        accuracy: total ? answers / total : 0,
        runs: p.runs || 0,
        done: total > 0 && answers >= total
      };
    });

    var totalQ = rows.reduce(function (a, r) { return a + r.total; }, 0);
    var correctQ = rows.reduce(function (a, r) { return a + r.correct; }, 0);
    var visited = rows.filter(function (r) { return r.runs > 0; }).length;
    var explored = rows.filter(function (r) { return r.runs > 0 && r.correct > 0; }).length;
    var totalRuns = rows.reduce(function (a, r) { return a + r.runs; }, 0);
    var wrongs = OR.Store.get('wrong', []) || [];
    var records = OR.Store.get('records', []) || [];

    /* 按知识点聚合 */
    var topicMap = {};
    rows.forEach(function (r) {
      var t = r.lab.topic;
      if (!topicMap[t]) topicMap[t] = { topic: t, total: 0, correct: 0, labs: 0, runs: 0, level: r.lab.level };
      topicMap[t].total += r.total;
      topicMap[t].correct += r.correct;
      topicMap[t].labs += 1;
      topicMap[t].runs += r.runs;
    });
    var topics = Object.keys(topicMap).map(function (k) { return topicMap[k]; });

    return {
      rows: rows, topics: topics, wrongs: wrongs, records: records,
      totalQ: totalQ, correctQ: correctQ, visited: visited, explored: explored,
      totalRuns: totalRuns,
      accuracy: totalQ ? correctQ / totalQ : 0,
      completion: labs.length ? visited / labs.length : 0
    };
  }

  /* ---------- 概要指标 ---------- */
  function buildOverview(d) {
    var U = OR.ui;
    return U.el('div.grid.g4', null, [
      U.el('div.stat', null, [
        U.el('div.stat-k', { html: U.icon('flask', 13) + '<span>已探索场景</span>' }),
        U.el('div.stat-v', { html: d.visited + '<small>/ ' + OR.Lab.all().length + '</small>' }),
        U.el('div.stat-d', { text: '共完成 ' + d.totalRuns + ' 次求解' })
      ]),
      U.el('div.stat.t-teal', null, [
        U.el('div.stat-k', { html: U.icon('check2', 13) + '<span>练习完成度</span>' }),
        U.el('div.stat-v', { html: d.correctQ + '<small>/ ' + d.totalQ + '</small>' }),
        U.el('div.stat-d', { text: '全部题目答对 ' + d.correctQ + ' 道' })
      ]),
      U.el('div.stat.t-violet', null, [
        U.el('div.stat-k', { html: U.icon('target', 13) + '<span>综合正确率</span>' }),
        U.el('div.stat-v', { text: U.pct(d.accuracy, 1) }),
        U.el('div.stat-d', { text: d.totalQ ? '基于全部已作答题目' : '尚未开始作答' })
      ]),
      U.el('div.stat.t-amber', null, [
        U.el('div.stat-k', { html: U.icon('pen', 13) + '<span>错题归档</span>' }),
        U.el('div.stat-v', { text: String(d.wrongs.length) }),
        U.el('div.stat-d', { text: d.wrongs.length ? '点击下方错题本复习' : '暂无错题' })
      ])
    ]);
  }

  /* ---------- 分层进度 ---------- */
  function buildLevelProgress(d) {
    var U = OR.ui;
    var wrap = U.el('div.grid.g3');

    OR.Lab.levels().forEach(function (lv) {
      var rows = d.rows.filter(function (r) { return r.lab.level === lv.level; });
      var tot = rows.reduce(function (a, r) { return a + r.total; }, 0);
      var ok = rows.reduce(function (a, r) { return a + r.correct; }, 0);
      var vis = rows.filter(function (r) { return r.runs > 0; }).length;
      var rate = tot ? ok / tot : 0;
      var tone = TONE_BY_LEVEL[lv.level];

      wrap.appendChild(U.el('div.card', null, [
        U.el('div.card-body', null, [
          U.el('div.hstack', { style: 'gap:12px;align-items:center;margin-bottom:12px' }, [
            U.el('div', { html: U.ring(rate, 52, toneColor(tone), U.pct(rate, 0)) }),
            U.el('div', { style: 'flex:1;min-width:0' }, [
              U.el('div.scn-title', { text: '难度 ' + lv.level + ' · ' + lv.name }),
              U.el('div.scn-sub', { text: rows.length + ' 个场景 · 已探索 ' + vis + '/' + rows.length })
            ])
          ]),
          progressBar(ok, tot, tone),
          U.el('div.tiny.muted', {
            text: '练习 ' + ok + '/' + tot + ' 题 · ' + lv.desc,
            style: 'margin-top:8px;line-height:1.6'
          })
        ])
      ]));
    });
    return wrap;
  }

  function toneColor(t) {
    return { green: '#10b981', amber: '#f59e0b', rose: '#f43f5e', brand: '#2b5cff', teal: '#14b8a6', violet: '#8b5cf6' }[t] || '#2b5cff';
  }

  function progressBar(val, tot, tone) {
    var U = OR.ui;
    var rate = tot ? val / tot : 0;
    return U.el('div', {
      style: 'height:7px;border-radius:99px;background:var(--bg-alt);overflow:hidden'
    }, [
      U.el('div', {
        style: 'height:100%;width:' + (rate * 100).toFixed(1) + '%;border-radius:99px;' +
          'background:' + toneColor(tone) + ';transition:width .5s var(--ease-out)'
      })
    ]);
  }

  /* ---------- 知识点掌握度 ---------- */
  function buildTopicChart(d) {
    var U = OR.ui;
    var B = OR.Lab.B;
    var topics = d.topics.slice().sort(function (a, b) {
      var ra = a.total ? a.correct / a.total : 0;
      var rb = b.total ? b.correct / b.total : 0;
      return ra - rb;
    });

    var blocks = [
      B.chart('bar', {
        height: 226,
        labels: topics.map(function (t) { return t.topic; }),
        series: [{
          label: '已答对题数',
          values: topics.map(function (t) { return t.correct; }),
          color: '#2b5cff'
        }, {
          label: '练习总题数',
          values: topics.map(function (t) { return t.total; }),
          color: '#c9d7f5'
        }],
        legend: true,
        title: '各知识点练习完成情况'
      }),
      B.note('柱子越短的条目前面代表掌握越薄弱。建议优先回到这些知识点对应的场景，先把概念题做对，再挑战计算题与建模题。')
    ];
    return blocks;
  }

  /* ---------- 场景明细表 ---------- */
  function buildScenarioTable(d) {
    var U = OR.ui;
    var head = ['场景', '难度', '求解次数', '练习完成', '正确率', '状态'];

    var t = U.el('table.tbl.tbl-zebra');
    var thead = U.el('thead');
    var htr = U.el('tr');
    head.forEach(function (h, i) {
      htr.appendChild(U.el('th', { text: h, class: i >= 2 ? 'num' : null }));
    });
    thead.appendChild(htr);
    t.appendChild(thead);

    var tbody = U.el('tbody');
    d.rows.forEach(function (r) {
      var tr = U.el('tr');
      tr.appendChild(U.el('td', null, [
        U.el('div.bold', { text: r.lab.name }),
        U.el('div.tiny.muted', { text: r.lab.subtitle })
      ]));
      tr.appendChild(U.el('td', null, [
        U.el('span.pill.p-lv' + r.lab.level, { text: ['', '入门', '进阶', '挑战'][r.lab.level] })
      ]));
      tr.appendChild(U.el('td.num', { text: String(r.runs) }));
      tr.appendChild(U.el('td.num', { text: r.correct + ' / ' + r.total }));
      tr.appendChild(U.el('td.num', {
        html: '<span class="' + (r.accuracy >= 0.8 ? 'hl' : r.accuracy > 0 ? 'muted' : 'tiny') + '">' +
          U.pct(r.accuracy, 0) + '</span>'
      }));
      tr.appendChild(U.el('td', null, [
        r.done
          ? U.el('span.pill.p-green', { text: '✓ 已完成' })
          : r.runs > 0
            ? U.el('span.pill.p-amber', { text: '进行中' })
            : U.el('span.pill', { text: '未开始' })
      ]));
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);

    return U.el('div.tbl-wrap', null, [t]);
  }

  /* ---------- 实验轨迹 ---------- */
  function buildTimeline(d) {
    var U = OR.ui;
    if (!d.records.length) {
      return U.el('div.empty', { text: '还没有实验记录。进入任意场景拖动一次参数，这里就会留下轨迹。' });
    }
    var list = U.el('div.vstack', { style: 'gap:0' });
    d.records.slice(0, 12).forEach(function (r, i) {
      var t = new Date(r.ts);
      var hh = ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);
      var dd = (t.getMonth() + 1) + '月' + t.getDate() + '日';
      list.appendChild(U.el('div.hstack', {
        style: 'gap:13px;padding:11px 2px;align-items:flex-start;' +
          (i < Math.min(d.records.length, 12) - 1 ? 'border-bottom:1px solid var(--line)' : '')
      }, [
        U.el('div', {
          style: 'flex:0 0 74px;font-size:11.5px;color:var(--ink-400);font-weight:600;padding-top:2px',
          text: dd + ' ' + hh
        }),
        U.el('div.dot', { style: 'margin-top:6px;background:var(--brand-500)' }),
        U.el('div', { style: 'flex:1;min-width:0' }, [
          U.el('div.small.bold', { text: r.labName || r.lab }),
          U.el('div.tiny.muted', {
            text: r.summary ? String(r.summary).slice(0, 150) : '（无摘要）',
            style: 'margin-top:3px;line-height:1.6'
          })
        ]),
        U.el('button.btn.btn-sm.btn-ghost', {
          text: '复现',
          onclick: function () { location.hash = '#/lab/' + r.lab; }
        })
      ]));
    });
    return list;
  }

  /* ---------- 薄弱环节 ---------- */
  function buildWeakness(d) {
    var U = OR.ui;
    var weakTopics = d.topics
      .filter(function (t) { return t.runs > 0 })
      .map(function (t) { return { t: t, rate: t.total ? t.correct / t.total : 0 }; })
      .sort(function (a, b) { return a.rate - b.rate; })
      .slice(0, 3);

    var items = [];

    if (weakTopics.length) {
      items.push(U.el('div', null, [
        U.el('div.small.bold', { text: '掌握度最低的知识点', style: 'margin-bottom:8px' }),
        U.el('div.vstack', { style: 'gap:7px' }, weakTopics.map(function (w) {
          return U.el('div.hstack', { style: 'gap:10px' }, [
            U.el('span.pill.p-lv' + w.t.level, { text: w.t.topic }),
            U.el('div', { style: 'flex:1;min-width:0' }, [progressBar(w.t.correct, w.t.total, 'rose')]),
            U.el('span.tiny.muted', { text: U.pct(w.rate, 0), style: 'flex:0 0 34px;text-align:right' })
          ]);
        }))
      ]));
    }

    if (d.wrongs.length) {
      var byLab = {};
      d.wrongs.forEach(function (w) {
        var k = w.labName || '未知场景';
        byLab[k] = (byLab[k] || 0) + 1;
      });
      var arr = Object.keys(byLab).map(function (k) { return { k: k, n: byLab[k] }; })
        .sort(function (a, b) { return b.n - a.n; });
      items.push(U.el('div', null, [
        U.el('div.small.bold', { text: '错题分布场景', style: 'margin-bottom:8px' }),
        U.el('div.vstack', { style: 'gap:6px' }, arr.map(function (x) {
          return U.el('div.hstack', { style: 'gap:8px' }, [
            U.el('span.tiny', { text: x.k, style: 'flex:0 0 auto' }),
            U.el('span.spacer'),
            U.el('span.pill.p-rose', { text: x.n + ' 道' })
          ]);
        }))
      ]));
    }

    if (!items.length) {
      items.push(U.el('div.small.muted', {
        text: '数据不足。先到任意场景做几道练习题，系统会自动识别你的薄弱环节。'
      }));
    }

    /* 建议 */
    var next = d.rows.filter(function (r) { return r.runs === 0; })[0];
    if (next) {
      items.push(U.el('div', null, [
        U.el('div.small.bold', { text: '下一步建议', style: 'margin-bottom:8px' }),
        U.el('div.small.muted', {
          text: '你还没有探索过「' + next.lab.name + '」。它的知识点是「' + next.lab.topic + '」，与已有基础衔接较好。',
          style: 'line-height:1.68;margin-bottom:9px'
        }),
        U.el('button.btn.btn-sm.btn-primary', {
          html: U.icon('play', 13) + '<span>进入该场景</span>',
          onclick: function () { location.hash = '#/lab/' + next.lab.id; }
        })
      ]));
    }

    return U.el('div.vstack', { style: 'gap:18px' }, items);
  }

  /* ---------- 知识图谱覆盖 ---------- */
  function buildKnowledgeCoverage() {
    var U = OR.ui, KG = OR.KG, KB = OR.KB;
    if (!KG || !KB) return U.el('div');
    var cov = KG.coverage();
    var total = cov.total || 1;
    var MC = KG.MASTERY_COLOR;

    /* ① 覆盖概览 */
    var levels = [
      { lv: 0, name: '未学习' }, { lv: 1, name: '初步了解' },
      { lv: 2, name: '基本掌握' }, { lv: 3, name: '熟练应用' }
    ];
    var stack = U.el('div', {
      style: 'display:flex;height:9px;border-radius:999px;overflow:hidden;background:var(--bg-alt);margin:10px 0 12px'
    });
    levels.forEach(function (x) {
      var n = cov.byLevel[x.lv] || 0;
      if (!n) return;
      stack.appendChild(U.el('div', { style: 'width:' + (n / total * 100) + '%;background:' + MC[x.lv], title: x.name + '：' + n }));
    });

    var levelCells = U.el('div', { style: 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px' },
      levels.map(function (x) {
        var n = cov.byLevel[x.lv] || 0;
        return U.el('div', {
          style: 'padding:7px 9px;border-radius:9px;background:var(--surface-2);border:1px solid var(--line);text-align:center'
        }, [
          U.el('div', { text: String(n), style: 'font-size:15px;font-weight:750;color:' + MC[x.lv] + ';font-variant-numeric:tabular-nums' }),
          U.el('div.tiny.muted', { text: x.name, style: 'font-size:10.5px' })
        ]);
      }));

    var overview = U.el('div.card', null, [
      U.el('div.card-head', null, [
        U.el('h3', { text: '知识覆盖' }),
        U.el('span.spacer'),
        U.el('span.pill.p-brand', { text: '覆盖率 ' + Math.round(cov.rate * 100) + '%' })
      ]),
      U.el('div.card-body', { style: 'padding:15px 17px' }, [
        U.el('div.hstack', { style: 'gap:14px;align-items:center' }, [
          U.el('div', { html: U.ring(cov.rate, 58, '#2b5cff', Math.round(cov.rate * 100) + '%') }),
          U.el('div', { style: 'flex:1;min-width:0' }, [
            U.el('div.small', {
              html: '已接触 <b>' + cov.touched + '</b> / ' + cov.total + ' 个知识点，其中 <b>' + cov.mastered + '</b> 个达到基本掌握及以上。',
              style: 'line-height:1.7;color:var(--ink-600)'
            }),
            U.el('div.tiny.muted', {
              text: '掌握度＝关联实验答题正确率（75%）＋实验探索次数（25%）',
              style: 'margin-top:4px'
            })
          ])
        ]),
        stack,
        levelCells
      ])
    ]);

    /* ② 按领域 */
    var rows = KB.domains().map(function (d) {
      var st = cov.byDomain[d.id] || { total: 0, learned: 0, mastered: 0 };
      return { d: d, st: st, rate: st.total ? st.learned / st.total : 0 };
    }).sort(function (a, b) { return b.rate - a.rate; });

    var domainCard = U.el('div.card', null, [
      U.el('div.card-head', null, [
        U.el('h3', { text: '按领域覆盖' }),
        U.el('span.sub', { text: '已接触 / 总数' }),
        U.el('span.spacer'),
        U.el('button.btn.btn-sm.btn-ghost', {
          html: '<span>知识中心</span>',
          onclick: function () { location.hash = '#/knowledge'; }
        })
      ]),
      U.el('div.card-body', { style: 'padding:12px 17px' }, rows.map(function (r) {
        var color = KG.TONE_COLOR[r.d.tone] || '#2b5cff';
        return U.el('a', {
          href: '#/knowledge',
          style: 'display:block;padding:7px 0;text-decoration:none;color:inherit;border-bottom:1px dashed var(--line)'
        }, [
          U.el('div.hstack', { style: 'gap:8px;margin-bottom:4px' }, [
            U.el('span', { style: 'width:7px;height:7px;border-radius:99px;background:' + color + ';flex:0 0 7px' }),
            U.el('span', { text: r.d.name, style: 'font-size:12.4px;font-weight:620;flex:1;min-width:0' }),
            U.el('span.tiny.muted', { text: r.st.learned + '/' + r.st.total })
          ]),
          U.el('div', { style: 'height:5px;border-radius:999px;background:var(--bg-alt);overflow:hidden' }, [
            U.el('div', { style: 'width:' + (r.rate * 100) + '%;height:100%;background:' + color + ';border-radius:999px' })
          ])
        ]);
      }))
    ]);

    return U.el('div.grid.g2', { style: 'align-items:start' }, [overview, domainCard]);
  }

  /* ---------- 导出 ---------- */
  function exportJSON() {
    var payload = {
      exportedAt: new Date().toISOString(),
      platform: 'OR-SimLab',
      summary: collect(),
      raw: OR.Store.load()
    };
    try {
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'OR-SimLab-学习档案-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      OR.ui.toast('学习档案已导出', 'ok');
    } catch (e) {
      OR.ui.toast('导出失败：' + e.message, 'err');
    }
  }

  /* ---------- 渲染 ---------- */
  function render(root) {
    var U = OR.ui;
    var d = collect();
    root.innerHTML = '';

    root.appendChild(U.el('div.sec-head', { style: 'margin-top:4px' }, [
      U.el('h2', { text: '学习档案' }),
      U.el('span.sub', { text: '所有数据保存在本机浏览器，可随时导出带走' }),
      U.el('span.spacer'),
      U.el('button.btn.btn-sm', {
        html: U.icon('reset', 13) + '<span>导出 JSON</span>',
        onclick: exportJSON
      }),
      U.el('button.btn.btn-sm', {
        html: U.icon('doc', 13) + '<span>打印报告</span>',
        onclick: function () { window.print(); }
      }),
      U.el('button.btn.btn-sm.btn-ghost', {
        html: U.icon('close', 13) + '<span>重置档案</span>',
        onclick: function () {
          U.modal({
            title: '重置学习档案',
            html: '<p>将清空全部作答记录、错题本与实验轨迹，此操作不可撤销。</p><p class="small muted">建议先点击「导出 JSON」备份。</p>',
            actions: [
              { label: '取消' },
              {
                label: '确认重置', primary: true, onClick: function () {
                  OR.Store.reset();
                  OR.ui.toast('学习档案已重置', 'ok');
                  setTimeout(function () { location.reload(); }, 500);
                }
              }
            ]
          });
        }
      })
    ]));

    root.appendChild(buildOverview(d));

    root.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '分层进度' }),
      U.el('span.sub', { text: '三个难度层级的推进节奏' })
    ]));
    root.appendChild(buildLevelProgress(d));

    root.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '知识图谱覆盖' }),
      U.el('span.sub', { text: '55 个知识点按领域统计的学习进度' })
    ]));
    root.appendChild(buildKnowledgeCoverage());

    root.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '知识点掌握度' }),
      U.el('span.sub', { text: '按运筹学知识点聚合的练习完成情况' })
    ]));
    var chartCard = U.el('div.card');
    root.appendChild(chartCard);

    root.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '场景明细' }),
      U.el('span.sub', { text: '每个场景的求解次数与练习完成状态' })
    ]));
    root.appendChild(buildScenarioTable(d));

    root.appendChild(U.el('div.grid.g2', { style: 'align-items:start' }, [
      U.el('div.card', null, [
        U.el('div.card-head', null, [
          U.el('h3', { text: '最近实验轨迹' }),
          U.el('span.spacer'),
          U.el('span.tiny.muted', { text: '最近 12 条' })
        ]),
        U.el('div.card-body', null, [buildTimeline(d)])
      ]),
      U.el('div.card', null, [
        U.el('div.card-head', null, [
          U.el('h3', { text: '薄弱环节与建议' }),
          U.el('span.spacer'),
          U.el('button.btn.btn-sm.btn-ghost', {
            text: '错题本 →',
            onclick: function () { location.hash = '#/wrong'; }
          })
        ]),
        U.el('div.card-body', null, [buildWeakness(d)])
      ])
    ]));

    /* 图表挂载：先插入 DOM 再绘制，避免画布尺寸为 0 */
    var r = OR.render.blocks(buildTopicChart(d));
    chartCard.appendChild(r.node);
    r.mount();
  }

  OR.DashView = { render: render, collect: collect };
})(typeof window !== 'undefined' ? window : globalThis);

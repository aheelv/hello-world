/* =============================================================================
 * OR-SimLab · 实验场景注册表与结果渲染契约
 * -----------------------------------------------------------------------------
 * 每个实验场景实现统一的契约：
 *   meta        静态元信息（名称/难度/领域/图标/目标/理论）
 *   params      参数定义数组（自动生成控制面板）
 *   run(values) 执行仿真/求解，返回声明式 blocks 结果
 *   problems    配套题目
 * blocks 是纯数据描述，由 views/lab.js 统一渲染，便于 AI 助教读取上下文。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  var registry = [];
  var byId = {};

  function register(lab) {
    registry.push(lab);
    byId[lab.id] = lab;
    return lab;
  }

  /** 声明式积木构造器 */
  var B = {
    metrics: function (items) { return { type: 'metrics', items: items }; },
    chart: function (kind, opts) { return { type: 'chart', kind: kind, opts: opts }; },
    svg: function (html, title) { return { type: 'svg', html: html, title: title }; },
    table: function (opt) { return Object.assign({ type: 'table' }, opt); },
    formula: function (lines) { return { type: 'formula', lines: lines }; },
    note: function (html, tone) { return { type: 'note', html: html, tone: tone || 'brand' }; },
    steps: function (items) { return { type: 'steps', items: items }; },
    grid: function (cols, blocks) { return { type: 'grid', cols: cols, blocks: blocks }; },
    card: function (title, blocks, sub, tone) { return { type: 'card', title: title, sub: sub, blocks: blocks, tone: tone }; },
    list: function (items) { return { type: 'list', items: items }; },
    kv: function (pairs) { return { type: 'kv', pairs: pairs }; },
    html: function (html) { return { type: 'html', html: html }; },
    bars: function (items) { return { type: 'bars', items: items }; },
    tabs: function (items) { return { type: 'tabs', items: items }; }
  };

  /* ---------- 参数控件工厂 ---------- */
  var P = {
    range: function (key, label, opts) {
      return Object.assign({ key: key, label: label, type: 'range', step: 1 }, opts);
    },
    select: function (key, label, options, value, hint) {
      return { key: key, label: label, type: 'select', options: options, value: value, hint: hint };
    },
    seg: function (key, label, options, value, hint) {
      return { key: key, label: label, type: 'seg', options: options, value: value, hint: hint };
    },
    text: function (key, label, value, hint) {
      return { key: key, label: label, type: 'text', value: value, hint: hint };
    },
    toggle: function (key, label, value, hint) {
      return { key: key, label: label, type: 'toggle', value: value, hint: hint };
    },
    custom: function (key, label, build, hint) {
      return { key: key, label: label, type: 'custom', build: build, hint: hint };
    },
    group: function (title, params, collapsed) {
      return { type: 'group', title: title, params: params, collapsed: collapsed };
    }
  };

  /** 从参数定义生成默认值对象 */
  function defaults(params) {
    var out = {};
    (function walk(list) {
      list.forEach(function (p) {
        if (p.type === 'group') return walk(p.params);
        out[p.key] = p.value;
      });
    })(params);
    return out;
  }

  /** 按难度分组 */
  function levels() {
    return [
      { level: 1, name: '入门', desc: '建立运筹学基本建模直觉，掌握经典确定性模型的求解与解读' },
      { level: 2, name: '进阶', desc: '面向随机与网络环境，处理不确定性下的系统优化决策' },
      { level: 3, name: '挑战', desc: '综合运用规划、仿真与风险度量解决复杂真实问题' }
    ];
  }

  OR.Lab = { register: register, all: function () { return registry; }, get: function (id) { return byId[id]; }, B: B, P: P, defaults: defaults, levels: levels };
})(typeof window !== 'undefined' ? window : globalThis);

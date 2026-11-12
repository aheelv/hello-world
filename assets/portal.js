/* ==========================================================================
   portal.js — 站点合集首页的渐进增强（零依赖）
   首页卡片是纯静态 HTML：禁用 JS / 离线打开时内容依旧完整可见。
   本脚本只提供：即时搜索、分组计数、空分组折叠、无结果提示。
   新增挂载页不需要改本文件。
   ========================================================================== */
(function () {
  "use strict";

  var cards = Array.prototype.slice.call(document.querySelectorAll(".pcard"));
  var groups = Array.prototype.slice.call(document.querySelectorAll(".pgroup"));
  var input = document.getElementById("portal-search");
  var hint = document.getElementById("search-hint");
  var empty = document.getElementById("noresult");
  var countEl = document.getElementById("match-count");

  function textOf(card) {
    return (card.getAttribute("data-search") || card.textContent || "")
      .replace(/\s+/g, " ").toLowerCase();
  }
  cards.forEach(function (c) {
    if (!c.getAttribute("data-search")) c.setAttribute("data-search", textOf(c));
  });

  var total = cards.length;
  var statTotal = document.getElementById("stat-pages");
  var statGroups = document.getElementById("stat-groups");
  if (statTotal) statTotal.textContent = String(total);
  if (statGroups) statGroups.textContent = String(groups.length);

  function apply(q) {
    var words = q.toLowerCase().replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    var shown = 0;
    cards.forEach(function (c) {
      var hay = c.getAttribute("data-search") || "";
      var ok = words.every(function (w) { return hay.indexOf(w) !== -1; });
      c.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach(function (g) {
      var visible = g.querySelectorAll(".pcard:not([hidden])").length;
      g.hidden = visible === 0;
    });
    if (countEl) countEl.textContent = String(shown);
    if (hint) {
      hint.textContent = words.length
        ? "找到 " + shown + " / " + total + " 个页面 · 清空输入框恢复全部"
        : "共 " + total + " 个入口 · 支持按名称、简介、标签或路径筛选";
    }
    if (empty) empty.style.display = (words.length && shown === 0) ? "block" : "none";
  }

  if (input) {
    input.addEventListener("input", function () { apply(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { input.value = ""; apply(""); input.blur(); }
    });
    /* 浏览器回填搜索词时同步一次 */
    if (input.value) apply(input.value);
  }

  /* 供校验脚本读取的只读信息 */
  window.PORTAL = {
    total: total,
    groups: groups.length,
    search: function (q) { if (input) { input.value = q; } apply(q); },
    visible: function () { return cards.filter(function (c) { return !c.hidden; }).length; }
  };
})();

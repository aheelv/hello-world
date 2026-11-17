/* ==========================================================================
   learning.js — v3 学习体验交互层
   --------------------------------------------------------------------------
   依赖：无（纯原生 JS，file:// 可用）。所有逻辑在缺少对应 DOM 时静默跳过。
   功能：① 自测题判分与解析展开 ② 代码块一键复制 ③ 学习闭环搜索条目合并
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- ① 自测题判分 ---------- */
  function initQuizzes() {
    document.querySelectorAll(".self-test[data-quiz]").forEach(function (box) {
      var btn = box.querySelector("[data-quiz-submit]");
      var score = box.querySelector(".st-score");
      if (!btn || !score) return;
      btn.addEventListener("click", function () {
        var items = box.querySelectorAll(".quiz-item[data-answer]");
        var right = 0;
        items.forEach(function (item) {
          var expected = (item.getAttribute("data-answer") || "").trim();
          var picked = item.querySelector("input:checked");
          var actual = picked ? picked.value : "";
          var fb = item.querySelector(".quiz-feedback");
          var ok = actual !== "" && actual === expected;
          if (ok) right++;
          if (fb) {
            fb.classList.remove("show", "correct", "wrong");
            fb.classList.add("show", ok ? "correct" : "wrong");
            var prefix = ok ? "回答正确。" : (actual === "" ? "未作答。" : "回答有误。");
            fb.textContent = prefix + " " + (fb.getAttribute("data-explain") || "");
          }
        });
        score.textContent = "得分：" + right + " / " + items.length +
          (items.length && right === items.length ? "　全对，可以进入下一章" : "");
      });
    });
  }

  /* ---------- ② 代码块复制 ---------- */
  function initCopy() {
    document.querySelectorAll(".code-lab").forEach(function (lab) {
      var pre = lab.querySelector("pre");
      var head = lab.querySelector(".cl-head");
      if (!pre || !head || head.querySelector(".copy-btn")) return;
      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "复制代码";
      btn.addEventListener("click", function () {
        var text = pre.textContent;
        var done = function () {
          btn.textContent = "已复制 ✓";
          setTimeout(function () { btn.textContent = "复制代码"; }, 1600);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
        } else {
          fallback(text, done);
        }
      });
      head.appendChild(btn);
    });
    function fallback(text, done) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { /* 忽略：离线环境 */ }
      document.body.removeChild(ta);
    }
  }

  /* ---------- ③ 合并学习闭环 subsection 级搜索条目 ---------- */
  function mergeIndex() {
    if (!window.LEARNING_INDEX || !window.SEARCH_INDEX) return;
    var seen = {};
    window.SEARCH_INDEX.forEach(function (e) { seen[e.href] = 1; });
    window.LEARNING_INDEX.forEach(function (e) {
      if (!seen[e.href]) { window.SEARCH_INDEX.push(e); seen[e.href] = 1; }
    });
  }

  function boot() {
    try { initQuizzes(); } catch (e) { /* 不让交互层阻断页面 */ }
    try { initCopy(); } catch (e) { /* 同上 */ }
    try { mergeIndex(); } catch (e) { /* 同上 */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

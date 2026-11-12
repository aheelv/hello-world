/* ==========================================================================
   全站移动端适配补丁  site-responsive.js
   - 仅在 <=900px 视口执行；桌面端不改动任何 DOM 或样式。
   - 职责：宽表格与超宽内容补滚动容器、放大块级点击区域、
     提升过小文字、把固定 1280x720 课件舞台切成流式阅读。
   - 不增删任何原有内容、链接或事件绑定。
   ========================================================================== */
(function () {
  "use strict";
  var mq = window.matchMedia
    ? window.matchMedia("(max-width:900px)")
    : { matches: window.innerWidth <= 900 };
  var applied = false;

  function css(el) { return window.getComputedStyle(el); }

  function hasScrollParent(el) {
    var p = el.parentNode, n = 0;
    while (p && p.nodeType === 1 && p !== document.body && n < 8) {
      var ox = css(p).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
      p = p.parentNode; n++;
    }
    return false;
  }

  /* 1. 宽表格：包一层可横向滑动的容器（原本已有滚动容器的跳过） */
  function wrapTables() {
    var list = document.querySelectorAll("table"), i;
    for (i = 0; i < list.length; i++) {
      var t = list[i], p = t.parentNode;
      if (!p || p.nodeType !== 1) continue;
      if (p.classList && p.classList.contains("wb-scroll")) continue;
      if (hasScrollParent(t)) continue;
      var box = document.createElement("div");
      box.className = "wb-scroll";
      p.insertBefore(box, t);
      box.appendChild(t);
      if (box.scrollWidth > box.clientWidth + 4) {
        var tip = document.createElement("div");
        tip.className = "wb-scroll-tip";
        tip.textContent = "← 左右滑动查看完整表格 →";
        box.parentNode.insertBefore(tip, box);
      }
    }
  }

  /* 2. 其它超宽内容块（导航条、甘特图、定义列表等）补横向滚动 */
  function wideContainers() {
    var list = document.querySelectorAll("div,section,nav,header,ul,ol,dl"), i;
    for (i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.closest && el.closest(".wb-scroll")) continue;
      var s = css(el);
      if (s.display === "none" || s.overflowX !== "visible") continue;
      if (s.position === "fixed" || s.position === "absolute") continue;
      if (el.clientWidth < 40 || el.scrollWidth <= el.clientWidth + 12) continue;
      if (!el.querySelector("a,table,img,pre,svg,dt,dd,button")) continue;
      el.classList.add("wb-scroll-x");
    }
  }

  /* 3. 块级链接 / 按钮 / 表单控件：保证触屏点击区域 */
  function tapTargets() {
    var list = document.querySelectorAll("a,button,input,select,textarea,[role=button]"), i;
    var skip = "input[type=checkbox],input[type=radio],input[type=range]," +
               "input[type=hidden],input[type=color]";
    for (i = 0; i < list.length; i++) {
      var el = list[i], s = css(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      if (el.matches && el.matches(skip)) continue;
      if (el.tagName === "A" && s.display === "inline") continue;
      var r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      /* 页码圆点等纯装饰性小按钮不放大，避免被撑成大圆 */
      if (r.width < 24 && r.height < 24 && !(el.textContent || "").trim()) continue;
      if (r.height < 40 || r.width < 40) el.classList.add("wb-tap");
    }
  }

  /* 4. 小于 12px 的正文文字提升到可读下限（上下标、SVG 等排除） */
  function readableText() {
    var list = document.querySelectorAll("body *"), i;
    var skip = "script,style,sup,sub,svg,svg *,canvas,iframe,noscript,textarea";
    for (i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.matches && el.matches(skip)) continue;
      var kids = el.childNodes, hasText = false, j;
      for (j = 0; j < kids.length; j++) {
        if (kids[j].nodeType === 3 && kids[j].nodeValue.replace(/\s/g, "")) {
          hasText = true; break;
        }
      }
      if (!hasText) continue;
      var fs = parseFloat(css(el).fontSize);
      if (fs > 0 && fs < 12) el.classList.add("wb-readable");
    }
  }

  /* 5. 固定舞台课件：加类后由 CSS 切换为流式阅读，翻页逻辑保持不变 */
  function detectStage() {
    if (!document.body) return;
    var s = document.getElementById("stage");
    if (!s || s.offsetWidth < 1000) return;
    var pos = css(s).position;
    if (pos !== "fixed" && pos !== "absolute") return;
    document.body.classList.add("wb-stage-mobile");
    document.body.classList.add(s.querySelector(".slide")
      ? "wb-stage-slides" : "wb-stage-plain");
  }

  /* 6. SVG 图表内部连线 / 标签超出自身 viewBox 时，
        给最近的定位容器补一层横向滚动，避免超出部分被视口裁掉 */
  function svgOverflow() {
    var list = document.querySelectorAll("svg"), i;
    for (i = 0; i < list.length; i++) {
      var svg = list[i];
      if (hasScrollParent(svg)) continue;
      var sr = svg.getBoundingClientRect();
      if (sr.width < 40 || sr.height < 20) continue;
      var kids = svg.querySelectorAll("path,text,rect,line,polyline,polygon,circle,ellipse");
      var far = false, k;
      for (k = 0; k < kids.length; k++) {
        var kr = kids[k].getBoundingClientRect();
        if (kr.width < 2 && kr.height < 2) continue;
        if (kr.right > sr.right + 20 || kr.left < sr.left - 20) { far = true; break; }
      }
      if (!far) continue;
      var p = svg.parentNode;
      while (p && p.nodeType === 1 && p !== document.body) {
        var ps = css(p);
        if (ps.position === "relative" || ps.position === "absolute") {
          p.classList.add("wb-scroll");
          break;
        }
        p = p.parentNode;
      }
    }
  }

  function run() {
    if (!mq.matches || applied) return;
    applied = true;
    document.documentElement.classList.add("wb-mobile");
    try {
      detectStage();
      wrapTables();
      wideContainers();
      svgOverflow();
      tapTargets();
      readableText();
    } catch (e) {
      if (window.console && console.warn) console.warn("site-responsive:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  window.addEventListener("resize", function () {
    if (mq.matches && !applied) run();
  });
  window.addEventListener("orientationchange", function () {
    setTimeout(function () { if (mq.matches && !applied) run(); }, 200);
  });
})();

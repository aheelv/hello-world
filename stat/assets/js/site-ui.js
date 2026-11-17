/* ==========================================================================
   site-ui.js — 数据驱动交互层（资源库筛选 / 时间线筛选 / 阶段联动）
   依赖 site-data.js（由 build-site.py 生成）。
   无匹配容器时静默跳过，不影响其它页面。
   ========================================================================== */
(function () {
  "use strict";

  var D = window.SITE_DATA;
  if (!D) return;

  var L = D.labels || {};
  var RES = D.resources || [];
  var TL = D.timeline || [];
  var UPD = (D.meta && D.meta.updated) || "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function params() { return new URLSearchParams(location.search); }

  function vBadge(v) {
    var label = (L.verify && L.verify[v]) || v || "待核验";
    var cls = v === "verified" ? "ok" : (v === "canonical" ? "info" : "warn");
    return '<span class="badge ' + cls + '">' + esc(label) + '</span>';
  }
  function stageBadges(ids) {
    return (ids || []).map(function (id) {
      return '<span class="badge">' + esc((L.stages && L.stages[id]) || id) + '</span>';
    }).join(" ");
  }

  /* ==================== 资源库 ==================== */
  function initLibrary() {
    var root = $("#library-app");
    if (!root) return;

    var q = params();
    var state = {
      type: q.get("type") || "all",
      stage: q.get("stage") || "all",
      verify: q.get("verify") || "all",
      era: q.get("era") || "all",
      sort: "year-desc",
      q: ""
    };

    // 类型 chips
    var typesBox = $("#lib-types");
    if (typesBox) {
      var counts = {};
      RES.forEach(function (r) { counts[r.t] = (counts[r.t] || 0) + 1; });
      var html = '<button class="chip active" data-type="all">全部 (' + RES.length + ')</button>';
      Object.keys(L.types || {}).forEach(function (t) {
        if (!counts[t]) return;
        html += '<button class="chip" data-type="' + esc(t) + '">' +
          esc((L.icons && L.icons[t]) || "") + " " + esc(L.types[t]) + " (" + counts[t] + ")</button>";
      });
      typesBox.innerHTML = html;
      typesBox.addEventListener("click", function (e) {
        var b = e.target.closest(".chip");
        if (!b) return;
        state.type = b.dataset.type;
        $$(".chip", typesBox).forEach(function (x) { x.classList.toggle("active", x === b); });
        render();
      });
    }

    ["lib-stage", "lib-verify", "lib-era", "lib-sort"].forEach(function (id) {
      var el = $("#" + id);
      if (!el) return;
      var key = { "lib-stage": "stage", "lib-verify": "verify", "lib-era": "era", "lib-sort": "sort" }[id];
      if (state[key] && el.querySelector('option[value="' + state[key] + '"]')) el.value = state[key];
      el.addEventListener("change", function () { state[key] = el.value; render(); });
    });

    var input = $("#lib-q");
    if (input) {
      input.value = q.get("q") || "";
      state.q = input.value.trim().toLowerCase();
      var timer;
      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () { state.q = input.value.trim().toLowerCase(); render(); }, 120);
      });
    }
    var reset = $("#lib-reset");
    if (reset) reset.addEventListener("click", function () {
      state = { type: "all", stage: "all", verify: "all", era: "all", sort: "year-desc", q: "" };
      if (input) input.value = "";
      $$(".chip", typesBox).forEach(function (x) { x.classList.toggle("active", x.dataset.type === "all"); });
      ["lib-stage", "lib-verify", "lib-era", "lib-sort"].forEach(function (id) {
        var el = $("#" + id); if (el) el.selectedIndex = 0;
      });
      render();
    });

    var list = $("#lib-list"), count = $("#lib-count");

    function inEra(y, era) {
      y = Number(y) || 0;
      if (era === "all") return true;
      if (era === "-2000") return y < 2000;
      if (era === "2000s") return y >= 2000 && y < 2010;
      if (era === "2010s") return y >= 2010 && y < 2020;
      if (era === "2020s") return y >= 2020 && y < 2025;
      if (era === "2025+") return y >= 2025;
      return true;
    }
    function matches(r) {
      if (state.type !== "all" && r.t !== state.type) return false;
      if (state.stage !== "all" && (r.st || []).indexOf(state.stage) < 0) return false;
      if (state.verify !== "all" && r.v !== state.verify) return false;
      if (!inEra(r.y, state.era)) return false;
      if (state.q) {
        var blob = [r.n, r.en, r.by, r.src, r.desc, r.note, r.y, r.id,
                    ((L.types || {})[r.t] || ""), (r.st || []).map(function (s) { return (L.stages || {})[s] || s; }).join(" ")]
                   .join(" ").toLowerCase();
        if (blob.indexOf(state.q) < 0) return false;
      }
      return true;
    }
    function sortFn(a, b) {
      if (state.sort === "year-asc") return (a.y || 0) - (b.y || 0);
      if (state.sort === "name") return String(a.n).localeCompare(String(b.n), "zh-CN");
      if (state.sort === "verify") {
        var rank = { verified: 0, canonical: 1, pending: 2 };
        return (rank[a.v] || 9) - (rank[b.v] || 9) || (b.y || 0) - (a.y || 0);
      }
      return (b.y || 0) - (a.y || 0);
    }

    function card(r) {
      var name = r.url
        ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.n) + ' ↗</a>'
        : esc(r.n);
      var meta = [r.by, r.y + (r.yNote ? "（" + r.yNote + "）" : ""), r.src,
                  (L.auth || {})[r.auth] || "", "更新 " + (r.up || UPD)]
                 .filter(Boolean).map(esc).join(" · ");
      return '<div class="res-item res-card" id="r-' + esc(r.id) + '" data-id="' + esc(r.id) + '">' +
        '<div class="res-icon">' + esc((L.icons || {})[r.t] || "·") + '</div>' +
        '<div class="res-main">' +
          '<div class="res-name">' + name + ' ' + vBadge(r.v) +
            ' <span class="badge">' + esc((L.types || {})[r.t] || r.t) + '</span></div>' +
          (r.en && r.en !== r.n ? '<div class="res-en">' + esc(r.en) + '</div>' : '') +
          '<p class="res-desc">' + esc(r.desc) + '</p>' +
          '<div class="res-meta">' + meta + '</div>' +
          '<div class="tag-row res-tags">' + stageBadges(r.st) + '</div>' +
          (r.note ? '<div class="res-meta verify-note">核验备注：' + esc(r.note) + '</div>' : '') +
        '</div>' +
      '</div>';
    }

    function render() {
      var hits = RES.filter(matches).sort(sortFn);
      if (count) count.innerHTML = '匹配 <strong>' + hits.length + '</strong> / ' + RES.length +
        ' 条资源 · 数据更新 ' + esc(UPD);
      if (!list) return;
      list.innerHTML = hits.length
        ? hits.map(card).join("")
        : '<div class="callout warn"><div class="callout-title">没有匹配结果</div><p>试试放宽筛选条件，或点击「重置筛选」。</p></div>';
      // 支持从搜索结果 / 阶段页带锚点直达
      if (location.hash && location.hash.indexOf("#r-") === 0) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60);
      }
    }
    render();
  }

  /* ==================== 时间线 ==================== */
  function initTimeline() {
    var root = $("#timeline-app");
    if (!root) return;
    var q = params();
    var state = { stage: q.get("stage") || "all", verify: q.get("verify") || "all", q: "" };

    var stageSel = $("#tl-stage"), verifySel = $("#tl-verify"), input = $("#tl-q");
    if (stageSel) {
      if (q.get("stage") && stageSel.querySelector('option[value="' + q.get("stage") + '"]')) stageSel.value = q.get("stage");
      stageSel.addEventListener("change", function () { state.stage = stageSel.value; render(); });
    }
    if (verifySel) verifySel.addEventListener("change", function () { state.verify = verifySel.value; render(); });
    if (input) {
      var timer;
      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () { state.q = input.value.trim().toLowerCase(); render(); }, 120);
      });
    }
    var reset = $("#tl-reset");
    if (reset) reset.addEventListener("click", function () {
      state = { stage: "all", verify: "all", q: "" };
      if (input) input.value = "";
      if (stageSel) stageSel.selectedIndex = 0;
      if (verifySel) verifySel.selectedIndex = 0;
      render();
    });

    var list = $("#tl-list"), count = $("#tl-count");

    function item(t) {
      var src = t.url
        ? '<a href="' + esc(t.url) + '" target="_blank" rel="noopener">' + esc(t.src) + ' ↗</a>'
        : esc(t.src || "");
      var st = D.stages.filter(function (s) { return s.id === t.stage; })[0];
      return '<div class="tl-item ' + esc(t.stage) + '" id="tl-' + esc(t.id) + '">' +
        '<div class="tl-date">' + esc(t.date) + '</div>' +
        '<div class="tl-body">' +
          '<div class="tag-row">' +
            (st ? '<a class="badge brand" href="' + (document.body.dataset.prefix || "") + 'stages/' + esc(st.slug) + '.html">' + esc(st.short) + '</a>' : '') +
            vBadge(t.v) +
          '</div>' +
          '<h3>' + esc(t.n) + '</h3>' +
          (t.en && t.en !== t.n ? '<div class="res-en">' + esc(t.en) + '</div>' : '') +
          '<p>' + esc(t.desc) + '</p>' +
          '<div class="res-meta">' + esc(t.by || "") + ' · ' + src + ' · 更新 ' + esc(t.up || UPD) + '</div>' +
          (t.note ? '<div class="res-meta verify-note">核验备注：' + esc(t.note) + '</div>' : '') +
        '</div>' +
      '</div>';
    }

    function render() {
      var hits = TL.filter(function (t) {
        if (state.stage !== "all" && t.stage !== state.stage) return false;
        if (state.verify !== "all" && t.v !== state.verify) return false;
        if (state.q) {
          var blob = [t.n, t.en, t.by, t.src, t.desc, t.note, t.date].join(" ").toLowerCase();
          if (blob.indexOf(state.q) < 0) return false;
        }
        return true;
      }).sort(function (a, b) { return a.year - b.year || String(a.id).localeCompare(String(b.id)); });

      if (count) count.innerHTML = '显示 <strong>' + hits.length + '</strong> / ' + TL.length +
        ' 个节点 · 按时间正序 · 数据更新 ' + esc(UPD);
      if (!list) return;
      list.innerHTML = hits.length
        ? '<div class="timeline">' + hits.map(item).join("") + '</div>'
        : '<div class="callout warn"><p>没有匹配结果，试试放宽筛选。</p></div>';
      if (location.hash && location.hash.indexOf("#tl-") === 0) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60);
      }
    }
    render();
  }

  /* ==================== 阶段页：资源与时间线的「查看全部」深链 ==================== */
  function initStageLinks() {
    var st = document.body.dataset.page || "";
    if (!/^s[1-6]$/.test(st)) return;
    $$("[data-all-resources]").forEach(function (a) {
      a.href = "../resources.html?stage=" + st;
    });
    $$("[data-all-timeline]").forEach(function (a) {
      a.href = "../timeline.html?stage=" + st;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLibrary();
    initTimeline();
    initStageLinks();
  });
})();

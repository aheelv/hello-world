/* ==========================================================================
   app.js — 通用壳层逻辑
   职责：侧边栏渲染 / 页内目录 / 全站搜索 / 主题切换 / 阅读进度 / KaTeX 初始化
   与具体学科内容无关，可随模板整体复用。
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.SITE_CONFIG;
  const body = document.body;

  /* ---------- 工具 ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const page = body.dataset.page || "";
  const prefix = body.dataset.prefix || "";

  const abs = (href) => (prefix ? prefix + href : href);

  /* ============================================================
     1. 侧边栏
     ============================================================ */
  function buildSidebar() {
    const box = $("#sidebar-nav");
    if (!box || !CFG) return;

    const frag = document.createDocumentFragment();

    // 导航组
    const navGroup = document.createElement("div");
    navGroup.className = "sidebar-title";
    navGroup.textContent = "快速导航";
    frag.appendChild(navGroup);

    (CFG.extras || []).forEach((ex) => {
      const a = document.createElement("a");
      a.className = "nav-item" + (page === ex.id ? " active" : "");
      a.href = abs(ex.href);
      a.textContent = ex.title;
      frag.appendChild(a);
    });

    // 按阶段分组的模块（阶段标题本身可点击，直达阶段总览页）
    (CFG.stages || []).forEach((st) => {
      const t = document.createElement(st.href ? "a" : "div");
      t.className = "sidebar-title" + (st.href ? " stage-link" : "") + (page === st.id ? " active" : "");
      if (st.href) t.href = abs(st.href);
      t.textContent = st.name;
      frag.appendChild(t);

      (st.modules || []).forEach((mid) => {
        const m = (CFG.modules || []).find((x) => x.id === mid);
        if (!m) return;
        const a = document.createElement("a");
        a.className = "nav-item" + (page === m.id ? " active" : "");
        a.href = abs(m.href);
        a.innerHTML =
          '<span class="nav-num">' + m.num + "</span>" +
          escapeHtml(m.title) +
          '<span class="nav-badge ' + m.levelKey + '">' + escapeHtml(m.level) + "</span>";
        frag.appendChild(a);
      });
    });

    box.appendChild(frag);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  /* ============================================================
     2. 页内目录（TOC）
     ============================================================ */
  function buildToc() {
    const box = $("#toc-list");
    if (!box) return;
    const heads = $$(".content h2, .content h3").filter((h) => h.id);
    if (heads.length < 2) {
      const wrap = $("#toc");
      if (wrap) wrap.style.display = "none";
      return;
    }
    heads.forEach((h) => {
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.replace(/¶/g, "").trim();
      if (h.tagName === "H3") a.className = "lvl-3";
      box.appendChild(a);
    });

    // 滚动高亮
    const links = $$("#toc-list a");
    const map = new Map();
    links.forEach((a) => map.set(a.getAttribute("href").slice(1), a));

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((l) => l.classList.remove("active"));
            const link = map.get(en.target.id);
            if (link) link.classList.add("active");
          }
        });
      },
      { rootMargin: "-70px 0px -70% 0px", threshold: 0 }
    );
    heads.forEach((h) => obs.observe(h));
  }

  /* ============================================================
     3. 标题锚点
     ============================================================ */
  function addAnchors() {
    $$(".content h2[id], .content h3[id]").forEach((h) => {
      const a = document.createElement("a");
      a.className = "anchor-flag";
      a.href = "#" + h.id;
      a.textContent = "🔗";
      a.title = "本节链接";
      h.appendChild(a);
    });
  }

  /* ============================================================
     4. 全站搜索（依赖 search-index.js）
     ============================================================ */
  function initSearch() {
    const overlay = $("#search-overlay");
    const input = $("#search-input");
    const results = $("#search-results");
    if (!overlay || !input || !results) return;

    const index = window.SEARCH_INDEX || [];

    function open() {
      overlay.classList.add("open");
      setTimeout(() => input.focus(), 40);
      render(input.value);
    }
    function close() {
      overlay.classList.remove("open");
      input.value = "";
    }

    function score(item, q) {
      const qq = q.toLowerCase();
      let s = 0;
      const t = (item.title || "").toLowerCase();
      const d = (item.desc || "").toLowerCase();
      const k = (item.keywords || "").toLowerCase();
      const sec = (item.sections || []).join(" ").toLowerCase();
      if (t.includes(qq)) s += 12;
      if (k.includes(qq)) s += 8;
      if (d.includes(qq)) s += 5;
      if (sec.includes(qq)) s += 3;
      // 逐字命中
      for (const ch of qq) if (t.includes(ch)) s += 0.5;
      return s;
    }

    function hl(text, q) {
      if (!q) return escapeHtml(text);
      const i = text.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) return escapeHtml(text);
      return (
        escapeHtml(text.slice(0, i)) +
        "<mark>" + escapeHtml(text.slice(i, i + q.length)) + "</mark>" +
        escapeHtml(text.slice(i + q.length))
      );
    }

    function render(q) {
      q = (q || "").trim();
      if (!q) {
        results.innerHTML =
          '<div class="search-hint">输入关键词搜索章节、概念、公式或例题。例如：<b>置信区间</b>、<b>贝叶斯</b>、<b>扩散模型</b>。</div>';
        return;
      }
      const hits = index
        .map((it) => ({ it, s: score(it, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 12);

      if (!hits.length) {
        results.innerHTML = '<div class="search-hint">未找到「' + escapeHtml(q) + '」相关内容。</div>';
        return;
      }
      results.innerHTML = hits
        .map(({ it }) => {
          return (
            '<a class="search-item" href="' + abs(it.href) + '">' +
            '<div class="si-title">' + hl(it.title, q) +
            '<span class="si-scope">' + escapeHtml(it.scope || "") + "</span></div>" +
            '<div class="si-text">' + hl(it.desc || "", q) + "</div>" +
            "</a>"
          );
        })
        .join("");
    }

    input.addEventListener("input", () => render(input.value));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // 快捷键 Ctrl/Cmd + K
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        overlay.classList.contains("open") ? close() : open();
      }
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });

    // 触发按钮
    $$("[data-search-open]").forEach((b) => b.addEventListener("click", open));
  }

  /* ============================================================
     5. 主题切换（浅色 / 深色，记忆到 localStorage）
     ============================================================ */
  function initTheme() {
    const saved = localStorage.getItem("site-theme");
    if (saved === "dark") body.dataset.theme = "dark";

    $$("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dark = body.dataset.theme === "dark";
        if (dark) {
          delete body.dataset.theme;
          localStorage.setItem("site-theme", "light");
        } else {
          body.dataset.theme = "dark";
          localStorage.setItem("site-theme", "dark");
        }
        syncThemeIcon();
      });
    });
    syncThemeIcon();
  }
  function syncThemeIcon() {
    const dark = body.dataset.theme === "dark";
    $$("[data-theme-toggle] .theme-label").forEach((el) => {
      el.textContent = dark ? "浅色" : "深色";
    });
  }

  /* ============================================================
     6. 移动端侧栏
     ============================================================ */
  function initSidebarToggle() {
    $$("[data-sidebar-toggle]").forEach((b) =>
      b.addEventListener("click", () => body.classList.toggle("sidebar-open"))
    );
    const ov = $("#sidebar-overlay");
    if (ov) ov.addEventListener("click", () => body.classList.remove("sidebar-open"));
    $$("#sidebar-nav a").forEach((a) =>
      a.addEventListener("click", () => body.classList.remove("sidebar-open"))
    );
  }

  /* ============================================================
     7. 阅读进度 + 返回顶部
     ============================================================ */
  function initProgress() {
    const bar = $("#progress-bar");
    const top = $("#back-top");
    function onScroll() {
      const st = window.scrollY || document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
      if (top) top.classList.toggle("show", st > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (top) top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ============================================================
     8. KaTeX 公式渲染（离线）
     ============================================================ */
  function renderMath() {
    if (typeof katex === "undefined") return;
    if (typeof renderMathInElement === "function") {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false,
        errorColor: "#b91c1c",
        strict: false
      });
    }
  }

  /* ============================================================
     9. 侧边栏当前模块的「完成打勾」进度（localStorage）
     ============================================================ */
  function initCompletion() {
    $$("[data-complete-btn]").forEach((btn) => {
      const id = btn.dataset.completeBtn;
      const key = "done-" + id;
      const sync = () => {
        const done = localStorage.getItem(key) === "1";
        btn.textContent = done ? "✓ 已标记完成" : "标记本章完成";
        btn.classList.toggle("primary", !done);
      };
      btn.addEventListener("click", () => {
        const done = localStorage.getItem(key) === "1";
        if (done) localStorage.removeItem(key);
        else localStorage.setItem(key, "1");
        sync();
      });
      sync();
    });

    // 总进度
    const bar = $("#stage-progress");
    if (bar && CFG && CFG.modules) {
      const total = CFG.modules.length;
      const done = CFG.modules.filter((m) => localStorage.getItem("done-" + m.id) === "1").length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const fill = bar.querySelector("i");
      const label = $("#stage-progress-label");
      if (fill) fill.style.width = pct + "%";
      if (label) label.textContent = done + " / " + total + " 章已标记完成（" + pct + "%）";
    }
  }

  /* ============================================================
     10. 页脚年份 / 版本注入
     ============================================================ */
  function initMeta() {
    $$("[data-site-name]").forEach((el) => (el.textContent = CFG.site.name));
    $$("[data-site-tagline]").forEach((el) => (el.textContent = CFG.site.tagline));
    $$("[data-site-footer]").forEach((el) => (el.textContent = CFG.site.footer));
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initMeta();
    buildSidebar();
    buildToc();
    addAnchors();
    initSearch();
    initTheme();
    initSidebarToggle();
    initProgress();
    initCompletion();
    renderMath();
  });
})();

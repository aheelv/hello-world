# -*- coding: utf-8 -*-
"""
build-site.py — 站点生成器（v2 六阶段架构）

单一数据源：data/core.json + data/resources.json + data/timeline.json
生成产物：
  assets/js/site-data.js     运行时数据（供筛选/时间线交互使用）
  assets/js/config.js        站点配置（供 app.js 侧边栏/进度使用）
  assets/js/search-index.js  全站搜索索引（页面 + 资源条目）
  stages/<slug>.html         6 个阶段页

用法：cd assets/js && python build-site.py
改内容后只需修改 data/*.json 再运行本脚本，无需手改任何 HTML。
"""
import json
import re
import html
import pathlib
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
ASSETS_JS = ROOT / "assets" / "js"
STAGES_DIR = ROOT / "stages"

core = json.loads((DATA / "core.json").read_text(encoding="utf-8"))
resources = json.loads((DATA / "resources.json").read_text(encoding="utf-8"))["resources"]
timeline = json.loads((DATA / "timeline.json").read_text(encoding="utf-8"))["timeline"]

meta = core["meta"]
stages = core["stages"]
modules = core["modules"]
levels = core["levels"]
extras = core["extras"]
stage_by_id = {s["id"]: s for s in stages}
module_by_id = {m["id"]: m for m in modules}

UPDATED = meta["updated"]

TYPE_LABEL = {
    "book": "标志性书籍", "theory": "标志性理论", "paper": "关键论文",
    "model": "里程碑模型", "course": "经典课程", "dataset": "数据集",
    "tool": "工具/框架", "oss": "开源资源",
}
TYPE_ICON = {
    "book": "📘", "theory": "🧭", "paper": "📄", "model": "🏛",
    "course": "🎓", "dataset": "🗂", "tool": "🧰", "oss": "🔓",
}
AUTH_LABEL = {"official": "一级 · 官方一手", "academic": "二级 · 学术机构", "community": "三级 · 社区维护"}
VERIFY_LABEL = {"verified": "已核验", "canonical": "权威共识", "pending": "待核验"}
STAGE_SHORT = {s["id"]: s["short"] for s in stages}


def esc(s):
    return html.escape(str(s), quote=False)


def esc_attr(s):
    return html.escape(str(s), quote=True)


# ---------------------------------------------------------------- 数据一致性
errors = []
for r in resources:
    for sid in r.get("st", []):
        if sid not in stage_by_id:
            errors.append(f"资源 {r['id']} 指向未知阶段 {sid}")
for t in timeline:
    if t["stage"] not in stage_by_id:
        errors.append(f"时间线 {t['id']} 指向未知阶段 {t['stage']}")
for s in stages:
    for mid in s["modules"]:
        if mid not in module_by_id:
            errors.append(f"阶段 {s['id']} 指向未知模块 {mid}")
for m in modules:
    if m["stage"] not in stage_by_id:
        errors.append(f"模块 {m['id']} 指向未知阶段 {m['stage']}")
    if m["id"] not in stage_by_id[m["stage"]]["modules"]:
        errors.append(f"模块 {m['id']} 未登记在阶段 {m['stage']} 的模块列表中")
ids = [r["id"] for r in resources]
if len(ids) != len(set(ids)):
    errors.append("资源 id 存在重复")
if errors:
    for e in errors:
        print("  ✗", e)
    raise SystemExit(f"数据校验失败：{len(errors)} 个问题")


# ---------------------------------------------------------------- site-data.js
site_data = {
    "meta": meta, "levels": levels, "stages": stages, "modules": modules,
    "extras": extras, "resources": resources, "timeline": timeline,
    "labels": {"types": TYPE_LABEL, "icons": TYPE_ICON, "auth": AUTH_LABEL,
               "verify": VERIFY_LABEL, "stages": STAGE_SHORT},
}
(ASSETS_JS / "site-data.js").write_text(
    "/* 由 build-site.py 自动生成，勿手改。修改 data/*.json 后重新运行。 */\n"
    "window.SITE_DATA = " + json.dumps(site_data, ensure_ascii=False, indent=1) + ";\n",
    encoding="utf-8",
)


# ---------------------------------------------------------------- config.js
cfg = {
    "site": {
        "name": meta["siteName"], "short": meta["short"], "tagline": meta["tagline"],
        "subtitle": meta["subtitle"], "description": meta["description"],
        "version": meta["version"], "footer": meta["footer"], "updated": UPDATED,
    },
    "route": meta["route"], "routeNote": meta["routeNote"],
    "stages": [{
        "id": s["id"], "name": f"阶段 {s['num']} · {s['name']}", "short": s["short"],
        "weeks": s["weeks"], "goal": s["goal"], "color": s["color"],
        "modules": s["modules"], "href": f"stages/{s['slug']}.html",
    } for s in stages],
    "modules": [{
        "id": m["id"], "num": m["num"], "title": m["title"], "level": m["level"],
        "levelKey": m["levelKey"], "hours": m["hours"], "href": m["href"],
        "desc": m["desc"], "tags": m["tags"], "prereq": m["prereq"],
        "goals": m["goals"], "stage": m["stage"],
    } for m in modules],
    "extras": extras,
    "levels": levels,
}
(ASSETS_JS / "config.js").write_text(
    "/* ==========================================================================\n"
    "   config.js — 由 build-site.py 从 data/*.json 自动生成，勿手改。\n"
    "   换站点方向 / 增删阶段 / 增删章节：修改 data/core.json 后重跑生成器。\n"
    "   ========================================================================== */\n\n"
    "window.SITE_CONFIG = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)


# ---------------------------------------------------------------- 页面骨架
HEADER = '''<header class="site-header">
  <button class="icon-btn" data-sidebar-toggle aria-label="打开目录">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
  </button>
  <a class="brand" href="{p}index.html">
    <span class="brand-mark">Σ</span>
    <span data-site-name>{name}</span>
    <span class="brand-sub" data-site-tagline>{tagline}</span>
  </a>
  <div class="header-spacer"></div>
  <div class="header-actions">
    <button class="icon-btn search-trigger" data-search-open aria-label="搜索">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <span class="label">搜索</span><span class="kbd">Ctrl K</span>
    </button>
    <button class="icon-btn" data-theme-toggle aria-label="切换主题"><span class="theme-label">深色</span></button>
    <a class="icon-btn" href="{p}roadmap.html">路线图</a>
    <a class="icon-btn" href="{p}resources.html">资源库</a>
    <a class="icon-btn" href="{p}timeline.html">时间线</a>
  </div>
</header>'''

FOOTER = '''<footer class="site-footer">
  <p><span data-site-footer></span> · 数据更新 {upd}</p>
  <p>内容与来源见 <a href="{p}resources.html">资源库</a> · <a href="{p}timeline.html">时间线</a> · <a href="{p}glossary.html">术语表</a> · <a href="{p}roadmap.html">学习路线图</a> · <a href="{p}DATA-GUIDE.md">数据维护说明</a> · <a href="{p}TEMPLATE-GUIDE.md">模板复用指南</a></p>
</footer>'''

SCRIPTS = '''<script src="{p}assets/vendor/katex/dist/katex.min.js"></script>
<script src="{p}assets/vendor/katex/dist/contrib/auto-render.min.js"></script>
<script src="{p}assets/js/config.js"></script>
<script src="{p}assets/js/site-data.js"></script>
<script src="{p}assets/js/search-index.js"></script>
<script src="{p}assets/js/learning-index.js"></script>
<script src="{p}assets/js/app.js"></script>
<script src="{p}assets/js/site-ui.js"></script>
<script src="{p}assets/js/learning.js"></script>'''

SEARCH_OVERLAY = '''<div class="search-overlay" id="search-overlay">
  <div class="search-panel">
    <div class="search-input-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input class="search-input" id="search-input" type="text" placeholder="搜索阶段、概念、资源、论文…">
    </div>
    <div class="search-results" id="search-results">
      <div class="search-hint">输入关键词搜索全站内容。例如：置信区间、Transformer、共形预测、DeepSeek-R1。</div>
    </div>
  </div>
</div>'''


def page_shell(title, desc, body_page, prefix, content_inner, toc=True):
    p = prefix
    toc_html = '''  <aside class="toc" id="toc">
    <div class="toc-title">本页目录</div>
    <nav id="toc-list"></nav>
  </aside>''' if toc else ''
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc_attr(desc)}">
<link rel="icon" type="image/svg+xml" href="{p}assets/favicon.svg">
<link rel="stylesheet" href="{p}assets/css/tokens.css">
<link rel="stylesheet" href="{p}assets/css/base.css">
<link rel="stylesheet" href="{p}assets/css/layout.css">
<link rel="stylesheet" href="{p}assets/css/components.css">
<link rel="stylesheet" href="{p}assets/css/learning.css">
<link rel="stylesheet" href="{p}assets/vendor/katex/dist/katex.min.css">
</head>
<body data-page="{body_page}" data-prefix="{p}">
<div class="progress-bar" id="progress-bar"></div>

{HEADER.format(p=p, name=esc(meta['siteName']), tagline=esc(meta['tagline']))}

<div class="sidebar-overlay" id="sidebar-overlay"></div>

<div class="app-body">
  <aside class="sidebar"><nav id="sidebar-nav"></nav></aside>

  <main class="content">
{content_inner}
  </main>

{toc_html}
</div>

{FOOTER.format(p=p, upd=UPDATED)}

<button class="back-top" id="back-top" aria-label="返回顶部">↑</button>

{SEARCH_OVERLAY}

{SCRIPTS.format(p=p)}
</body>
</html>
'''


def badge(text, cls=""):
    return f'<span class="badge {cls}">{esc(text)}</span>'


# ---------------------------------------------------------------- 阶段页生成
def render_resource_rows(rs, limit=None):
    rows = []
    for r in (rs[:limit] if limit else rs):
        link = (f'<a href="{esc_attr(r["url"])}" target="_blank" rel="noopener">{esc(r["n"])} ↗</a>'
                if r.get("url") else esc(r["n"]))
        stages_txt = " · ".join(STAGE_SHORT.get(x, x) for x in r.get("st", []))
        v = r.get("v", "pending")
        meta_line = (f'{esc(r.get("by", ""))} · {r.get("y", "")} · {esc(r.get("src", ""))}'
                     f' · {esc(AUTH_LABEL.get(r.get("auth", ""), ""))}'
                     f' · {esc(stages_txt)}')
        rows.append(f'''      <div class="res-item" id="r-{esc_attr(r['id'])}">
        <div class="res-icon">{TYPE_ICON.get(r['t'], '·')}</div>
        <div>
          <div class="res-name">{link} {badge(VERIFY_LABEL.get(v, v), 'ok' if v == 'verified' else ('info' if v == 'canonical' else 'warn'))} {badge(TYPE_LABEL.get(r['t'], r['t']))}</div>
          <p class="res-desc">{esc(r['desc'])}</p>
          <div class="res-meta">{meta_line}</div>
          {f'<div class="res-meta verify-note">核验备注：{esc(r["note"])}</div>' if r.get('note') else ''}
        </div>
      </div>''')
    return "\n".join(rows)


def render_stage(st):
    sid = st["id"]
    prev_s = stages[st["num"] - 2] if st["num"] > 1 else None
    next_s = stages[st["num"]] if st["num"] < len(stages) else None
    st_res = [r for r in resources if sid in r.get("st", [])]
    st_res.sort(key=lambda r: (-r.get("y", 0), r["id"]))
    st_tl = sorted([t for t in timeline if t["stage"] == sid], key=lambda t: t["year"])

    parts = []
    parts.append(f'''      <article class="module" data-stage="{sid}">
      <div class="inner">
      <header class="module-header">
        <div class="crumbs"><a href="../index.html">首页</a> / <a href="../roadmap.html">学习路线图</a> / 阶段 {st['num']} · {esc(st['name'])}</div>
        <h1>{st['num']:02d} · {esc(st['name'])}</h1>
        <p class="lead">{esc(st['tagline'])}。{esc(st['goal'])}。本页给出该阶段的完整学习路径、先修知识、难度层级、核心概念、目标能力、实践任务、评估标准与进阶衔接。</p>
        <div class="module-meta">
          {badge('阶段 ' + str(st['num']), 'brand')}
          {badge(st['difficulty']['label'], 'info')}
          {badge(st['weeks'], 'ok')}
          {badge(str(st['hours']) + ' 学时')}
          {badge(str(len(st['modules'])) + ' 个专题', 'accent')}
          {badge('更新 ' + UPDATED)}
        </div>
      </header>

      <div class="callout note">
        <div class="callout-title">阶段定位</div>
        <p><strong>{esc(st['era'])}</strong>。全站按「{esc(' → '.join(meta['route']))}」组织。{esc(meta['routeNote'])}</p>
      </div>''')

    # 1 学习路径
    parts.append('      <h2 id="path">1 · 学习路径</h2>')
    parts.append('      <p>按下列顺序推进，每一步都对应一个可点击的站内专题；未完成当前步的评估标准前，不建议跳步。</p>')
    parts.append('      <div class="table-wrap"><table><thead><tr><th>步骤</th><th>主题</th><th>要点</th><th>对应专题</th></tr></thead><tbody>')
    for step in st["path"]:
        m = module_by_id.get(step.get("m"))
        link = (f'<a href="../{esc_attr(m["href"])}">{esc(m["num"])} · {esc(m["title"])}</a>'
                if m else '<span class="muted">建设中</span>')
        parts.append(f'<tr><td>{esc(step["step"])}</td><td><strong>{esc(step["n"])}</strong></td><td>{esc(step["d"])}</td><td>{link}</td></tr>')
    parts.append('</tbody></table></div>')

    # 2 先修
    parts.append('      <h2 id="prereq">2 · 先修知识</h2>')
    parts.append('      <div class="callout tip"><div class="callout-title">进入本阶段前应具备</div><ul class="check-list">')
    for x in st["prereq"]:
        parts.append(f'<li>{esc(x)}</li>')
    parts.append('</ul></div>')

    # 3 难度层级
    parts.append('      <h2 id="difficulty">3 · 难度层级</h2>')
    parts.append(f'      <p>本阶段覆盖 <strong>{esc(st["difficulty"]["label"])}</strong>。全站统一采用五级难度标尺：</p>')
    parts.append('      <div class="table-wrap"><table><thead><tr><th>层级</th><th>含义</th><th>本阶段</th></tr></thead><tbody>')
    for i, lv in enumerate(levels, start=1):
        mark = "✓ 覆盖" if st["difficulty"]["min"] <= i <= st["difficulty"]["max"] else "—"
        parts.append(f'<tr><td>{esc(lv["label"])}</td><td>{esc(lv["desc"])}</td><td>{mark}</td></tr>')
    parts.append('</tbody></table></div>')

    # 4 核心概念
    parts.append('      <h2 id="concepts">4 · 核心概念</h2>')
    parts.append('      <div class="card-grid two">')
    for c in st["concepts"]:
        parts.append(f'<div class="card"><h3>{esc(c["n"])}</h3><p>{esc(c["d"])}</p></div>')
    parts.append('</div>')

    # 5 目标能力
    parts.append('      <h2 id="competencies">5 · 目标能力</h2>')
    parts.append('      <p>完成本阶段后，你应当能够：</p><ul class="check-list">')
    for c in st["competencies"]:
        parts.append(f'<li>{esc(c)}</li>')
    parts.append('</ul>')

    # 6 实践任务
    parts.append('      <h2 id="tasks">6 · 实践任务</h2>')
    parts.append('      <p>任务按基础 → 进阶 → 挑战分层，均要求提交可复现产物，而非只看结论。</p>')
    parts.append('      <div class="card-grid two">')
    for t in st["tasks"]:
        cls = {"基础": "ok", "进阶": "info", "挑战": "warn"}.get(t["level"], "")
        parts.append(f'''<div class="card">
          <div class="tag-row">{badge(t['level'], cls)} {badge(t['deliverable'])}</div>
          <h3>{esc(t['n'])}</h3>
          <p>{esc(t['d'])}</p>
        </div>''')
    parts.append('</div>')

    # 7 评估标准
    parts.append('      <h2 id="assessment">7 · 评估标准</h2>')
    parts.append('      <div class="callout exam"><div class="callout-title">达标再进阶</div></div>')
    parts.append('      <div class="table-wrap"><table><thead><tr><th>维度</th><th>可检验标准</th></tr></thead><tbody>')
    for a in st["assessment"]:
        parts.append(f'<tr><td><strong>{esc(a["n"])}</strong></td><td>{esc(a["standard"])}</td></tr>')
    parts.append('</tbody></table></div>')

    # 8 进阶衔接
    bridge_to = stage_by_id.get(st["bridge"]["to"])
    parts.append('      <h2 id="bridge">8 · 进阶衔接</h2>')
    if bridge_to:
        parts.append(f'''      <div class="callout tip">
        <div class="callout-title">下一阶段：{esc(bridge_to['name'])}</div>
        <p>{esc(st['bridge']['text'])}</p>
        <p><a class="btn primary" href="{esc_attr(bridge_to['slug'])}.html">进入阶段 {bridge_to['num']} · {esc(bridge_to['name'])} →</a>
        <a class="btn" href="../roadmap.html">查看完整路线图</a></p>
      </div>''')
    else:
        parts.append(f'      <div class="callout tip"><p>{esc(st["bridge"]["text"])}</p></div>')

    # 9 本阶段资源
    parts.append(f'      <h2 id="resources">9 · 本阶段资源（{len(st_res)} 条）</h2>')
    parts.append(f'      <p>下列条目来自全站资源库，均标注来源、年份、权威性、适用阶段与核验状态。完整可筛选版本见 <a href="../resources.html">资源库</a>。</p>')
    by_type = Counter(r["t"] for r in st_res)
    summary = " · ".join(f"{TYPE_LABEL[t]} {n}" for t, n in sorted(by_type.items()))
    parts.append(f'      <div class="callout note"><div class="callout-title">构成</div><p>{esc(summary)}</p></div>')
    parts.append(render_resource_rows(st_res, limit=28))
    if len(st_res) > 28:
        parts.append(f'      <p class="muted">本页展示前 28 条，其余 {len(st_res) - 28} 条请到 <a href="../resources.html">资源库</a> 按阶段筛选查看。</p>')

    # 10 时间线切片
    parts.append(f'      <h2 id="timeline">10 · 本阶段里程碑（{len(st_tl)} 项）</h2>')
    if st_tl:
        parts.append('      <div class="timeline">')
        for t in st_tl:
            src = (f'<a href="{esc_attr(t["url"])}" target="_blank" rel="noopener">来源 ↗</a>'
                   if t.get("url") else esc(t.get("src", "")))
            v = t.get("v", "pending")
            parts.append(f'''      <div class="tl-item">
          <div class="tl-date">{esc(t['date'])}</div>
          <div class="tl-body"><strong>{esc(t['n'])}</strong>
            {badge(VERIFY_LABEL.get(v, v), 'ok' if v == 'verified' else ('info' if v == 'canonical' else 'warn'))}
            <p>{esc(t['desc'])}</p>
            <div class="res-meta">{esc(t['by'])} · {src}</div>
            {f'<div class="res-meta verify-note">核验备注：{esc(t["note"])}</div>' if t.get('note') else ''}
          </div>
        </div>''')
        parts.append('</div>')
    parts.append(f'      <p><a class="btn" href="../timeline.html">查看完整时间线 →</a></p>')

    # 结尾
    prev_link = (f'<a class="prev" href="{esc_attr(prev_s["slug"])}.html"><span class="dir">← 上一阶段</span><span class="ttl">{prev_s["num"]:02d} · {esc(prev_s["name"])}</span></a>'
                 if prev_s else '<a class="prev" href="../roadmap.html"><span class="dir">← 返回</span><span class="ttl">学习路线图</span></a>')
    next_link = (f'<a class="next" href="{esc_attr(next_s["slug"])}.html"><span class="dir">下一阶段 →</span><span class="ttl">{next_s["num"]:02d} · {esc(next_s["name"])}</span></a>'
                 if next_s else '<a class="next" href="../resources.html"><span class="dir">继续探索 →</span><span class="ttl">全站资源库</span></a>')
    parts.append(f'''      <div class="flex-between mt-6">
        <div><a class="btn" href="../index.html">← 返回首页</a> <a class="btn" href="../roadmap.html">路线图</a></div>
        <button class="btn primary" data-complete-btn="{sid}">标记本阶段完成</button>
      </div>
      <nav class="module-nav">
        {prev_link}
        {next_link}
      </nav>
      </div>
      </article>''')

    inner = "\n".join(parts)
    return page_shell(
        title=f"{st['num']:02d} · {st['name']} · {meta['siteName']}",
        desc=f"阶段 {st['num']} {st['name']}：学习路径、先修知识、难度层级、核心概念、目标能力、实践任务、评估标准与进阶衔接。",
        body_page=sid, prefix="../", content_inner=inner,
    )


STAGES_DIR.mkdir(exist_ok=True)
for s in stages:
    (STAGES_DIR / f"{s['slug']}.html").write_text(render_stage(s), encoding="utf-8")


# ---------------------------------------------------------------- 四个核心页
def render_index():
    recent = sorted([r for r in resources if (r.get("y") or 0) >= 2024],
                    key=lambda r: -(r.get("y") or 0))[:10]
    cnt_verified = sum(1 for r in resources if r.get("v") == "verified")
    cnt_pending = sum(1 for r in resources if r.get("v") == "pending")

    parts = []
    parts.append(f'''      <section class="hero">
        <div class="tag-row" style="justify-content:center">
          {badge('六阶段演进路线', 'brand')} {badge('168 条可核验资源', 'accent')}
          {badge('公式离线渲染', 'ok')} {badge('零基础可上手', 'info')}
        </div>
        <h1>{esc(meta['siteName'])}</h1>
        <p class="hero-sub">
          按「{esc(' → '.join(meta['route']))}」组织的完整学习体系：
          每阶段给出学习路径、先修知识、难度层级、核心概念、目标能力、实践任务、评估标准与进阶衔接，
          并用统一资源库与时间线把标志性书籍、理论、论文、模型、课程、数据集与工具串起来。
          所有条目标注来源、年份、权威性、适用阶段与更新时间，无法确认的一律标记待核验。
        </p>
        <div class="hero-actions">
          <a class="btn primary" href="roadmap.html">从学习路线图开始 →</a>
          <a class="btn" href="stages/statistics.html">进入阶段 1 · 统计学</a>
          <a class="btn" href="stages/generative-ai.html">直达生成式 AI</a>
        </div>
      </section>

      <div class="stat-row">
        <div class="stat"><div class="num">6</div><div class="lbl">学习阶段</div></div>
        <div class="stat"><div class="num">{len(modules)}</div><div class="lbl">专题章节</div></div>
        <div class="stat"><div class="num">{len(resources)}</div><div class="lbl">资源条目</div></div>
        <div class="stat"><div class="num">{len(timeline)}</div><div class="lbl">时间线节点</div></div>
        <div class="stat"><div class="num">100%</div><div class="lbl">离线可用</div></div>
      </div>

      <div class="divider-title" id="route">六阶段演进路线</div>
      <div class="route-grid">''')
    for s in stages:
        parts.append(f'''        <a class="route-node {s['color']}" href="stages/{esc_attr(s['slug'])}.html">
          <span class="route-num">STAGE {s['num']}</span>
          <span class="route-name">{esc(s['name'])}</span>
          <span class="route-en">{esc(s['en'])}</span>
          <span class="route-goal">{esc(s['goal'])}</span>
          <span class="route-foot">{esc(s['difficulty']['label'])} · {esc(s['weeks'])} →</span>
        </a>''')
    parts.append('</div>')
    parts.append(f'''      <p class="route-chain">{esc(' → '.join(meta['route']))}</p>
      <div class="callout note">
        <div class="callout-title">关于顺序的说明</div>
        <p>{esc(meta['routeNote'])}</p>
      </div>

      <div class="divider-title" id="howto">如何使用本站</div>
      <div class="card-grid three">
        <div class="card"><h3>① 先看路线图与阶段页</h3>
          <p>先确定自己该从哪一阶段进入。每个阶段页都写清先修、难度、目标能力与<strong>可检验的评估标准</strong>——达标再进阶，避免盲目刷章节。</p></div>
        <div class="card"><h3>② 概念 → 公式 → 例题</h3>
          <p>专题章节沿用统一结构：直觉解释 → 严格定义 → 公式 → 分步例题 → 易错点 → 练习。例题解答默认折叠，先自己动笔再展开对照。</p></div>
        <div class="card"><h3>③ 用资源库与时间线校验</h3>
          <p>资源库可按类型、阶段、年代、核验状态筛选；时间线按时间与阶段筛选。所有外部链接指向官方一手来源，年份与出处不确定者明确标为待核验。</p></div>
      </div>

      <div class="divider-title" id="stages">六阶段速览</div>
      <div class="table-wrap"><table>
        <thead><tr><th>阶段</th><th>难度</th><th>周期</th><th>学时</th><th>核心概念</th><th>实践任务</th><th>入口</th></tr></thead><tbody>''')
    for s in stages:
        parts.append(f'''<tr>
          <td><strong>{s['num']} · {esc(s['name'])}</strong><br><span class="muted">{esc(s['tagline'])}</span></td>
          <td>{esc(s['difficulty']['label'])}</td><td>{esc(s['weeks'])}</td><td>{s['hours']}</td>
          <td>{len(s['concepts'])} 项</td><td>{len(s['tasks'])} 项</td>
          <td><a href="stages/{esc_attr(s['slug'])}.html">阶段页 →</a></td>
        </tr>''')
    parts.append('''</tbody></table></div>

      <div class="divider-title" id="recent">近年成果速览（2024 年后）</div>
      <p>下列条目均来自资源库，年份与出处可在资源库中逐条核对。优先近年成果，不意味着忽略经典——基础阶段仍以经过时间检验的教材与理论为主。</p>
      <div class="card-grid two">''')
    for r in recent:
        parts.append(f'''<div class="card">
          <div class="tag-row">{badge(TYPE_LABEL.get(r['t'], r['t']))} {badge(str(r['y']))} {v_badge_short(r.get('v'))}</div>
          <h3>{esc(r['n'])}</h3>
          <p>{esc(r['desc'])}</p>
          <div class="res-meta">{esc(r.get('by', ''))} · {esc(r.get('src', ''))}</div>
        </div>''')
    parts.append(f'''</div>
      <p><a class="btn" href="resources.html?era=2025%2B">查看 2025 年后全部资源 →</a> <a class="btn" href="timeline.html">查看完整时间线 →</a></p>

      <div class="divider-title" id="verification">核验与更新规则</div>
      <div class="legend-grid">''')
    for k, label in VERIFY_LABEL.items():
        parts.append(f'<div class="legend-item"><strong>{esc(label)}</strong>{esc(meta["verificationLegend"][k])}</div>')
    for k, label in AUTH_LABEL.items():
        parts.append(f'<div class="legend-item"><strong>{esc(label.split(" · ")[0])}</strong>{esc(meta["authorityLegend"][k])}</div>')
    parts.append(f'''</div>
      <div class="callout warn">
        <div class="callout-title">避免把未确认内容当结论</div>
        <p>本次收录 {len(resources)} 条资源中，<strong>{cnt_verified} 条为本轮检索命中官方一手来源</strong>，其余多为学界通行的经典条目（标注「权威共识」，使用官方固定入口）。<strong>{cnt_pending} 条标记「待核验」</strong>，其年份、版次、出处或服务状态存在不确定，卡片上会写明具体不确定点，请勿作为定论引用。</p>
        <p>全站数据更新时间：<strong>{esc(UPDATED)}</strong>。数据存放在 <code>data/*.json</code>，修改后运行 <code>python assets/js/build-site.py</code> 即可重建，详见 <a href="DATA-GUIDE.md">数据维护说明</a>。</p>
      </div>

      <div class="divider-title" id="entries">全站入口</div>
      <div class="card-grid two">
        <a class="card mod-card" href="roadmap.html"><div class="mod-num">ROADMAP</div><h3>学习路线图</h3><p>六阶段路径、先修知识、能力目标与进阶衔接的完整对照。</p></a>
        <a class="card mod-card" href="resources.html"><div class="mod-num">LIBRARY</div><h3>资源库（可筛选）</h3><p>书籍 / 理论 / 论文 / 模型 / 课程 / 数据集 / 工具 / 开源，八类 168 条。</p></a>
        <a class="card mod-card" href="timeline.html"><div class="mod-num">TIMELINE</div><h3>里程碑时间线</h3><p>1763–2025 关键节点，按阶段与核验状态筛选。</p></a>
        <a class="card mod-card" href="glossary.html"><div class="mod-num">GLOSSARY</div><h3>术语表</h3><p>覆盖六个阶段的中英对照核心术语。</p></a>
      </div>

      <div class="callout tip">
        <div class="callout-title">离线使用与部署</div>
        <p>纯静态站点，零外部 CDN 依赖（KaTeX 与全部字体本地化）。双击 <code>index.html</code> 即可离线阅读；或运行 <code>python -m http.server 8080</code> 后访问 <code>http://localhost:8080</code>；也可整目录上传到任意静态托管。</p>
      </div>''')

    return page_shell(
        title=f'{meta["siteName"]} · {meta["tagline"]}',
        desc=meta["description"], body_page="home", prefix="",
        content_inner='<div class="inner">\n' + "\n".join(parts) + '\n</div>', toc=False,
    )


def v_badge_short(v):
    label = VERIFY_LABEL.get(v, "待核验")
    cls = "ok" if v == "verified" else ("info" if v == "canonical" else "warn")
    return badge(label, cls)


def render_roadmap():
    parts = [f'''      <article class="module">
      <div class="inner">
      <header class="module-header">
        <div class="crumbs"><a href="index.html">首页</a> / 学习路线图</div>
        <h1>学习路线图</h1>
        <p class="lead">六个阶段、约 {sum(s['hours'] for s in stages)} 学时、{len(modules)} 个专题。每阶段都给出先修知识、难度层级、学习路径、目标能力、实践任务、评估标准与进阶衔接，达标后再进阶。</p>
        <div class="module-meta">
          {badge('6 阶段', 'brand')} {badge(str(len(modules)) + ' 专题', 'info')}
          {badge(str(sum(s['hours'] for s in stages)) + ' 学时', 'ok')} {badge('更新 ' + UPDATED)}
        </div>
      </header>
      <div class="callout note"><div class="callout-title">演进主线</div>
        <p><strong>{esc(' → '.join(meta['route']))}</strong></p>
        <p>{esc(meta['routeNote'])}</p>
      </div>

      <h2 id="overview">0 · 阶段总览</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>阶段</th><th>难度</th><th>周期</th><th>学时</th><th>先修摘要</th><th>专题数</th><th>阶段页</th></tr></thead><tbody>''']
    for s in stages:
        parts.append(f'''<tr><td><strong>{s['num']} · {esc(s['name'])}</strong></td>
          <td>{esc(s['difficulty']['label'])}</td><td>{esc(s['weeks'])}</td><td>{s['hours']}</td>
          <td>{esc('；'.join(s['prereq'][:2]))}</td><td>{len(s['modules'])}</td>
          <td><a href="stages/{esc_attr(s['slug'])}.html">进入 →</a></td></tr>''')
    parts.append('</tbody></table></div>')

    # ---- v3：知识依赖全景 + 跨模块贯穿案例 ----
    fig_data = json.loads((ROOT / "assets" / "js" / "figure-library.json").read_text(encoding="utf-8"))
    case_data = json.loads((ROOT / "data" / "case.json").read_text(encoding="utf-8"))

    def roadmap_figure(fid, num):
        f = fig_data[fid]
        u = f.get("url", "")
        src = (f'<a href="{esc_attr(u)}" target="_blank" rel="noopener">{esc(f["src"])}</a>'
               if u.startswith("http") else
               (f'<a href="{esc_attr(u)}">{esc(f["src"])}</a>' if u else esc(f["src"])))
        return (f'<figure class="figure">{f["svg"]}<figcaption>'
                f'<span class="fig-no">图 {num}</span><span class="fig-title">{esc(f["title"])}</span>'
                f'<span class="fig-note">{esc(f["note"])}</span>'
                f'<span class="fig-src">类型：{esc(f["kind"])} · 来源：{src} · 离线自绘</span>'
                f'</figcaption></figure>')

    parts.append('''      <h2 id="knowledge-map">知识依赖全景 · 六阶段如何咬合</h2>
      <div class="callout note"><div class="callout-title">怎么读这张图</div>
        <p>统计学是共同底座：它提供「不确定性如何量化」的语言。大数据分析把这套语言放大到单机装不下的规模；机器学习把它变成可泛化的预测函数；深度学习给出可端到端训练的参数化结构；神经网络架构讨论把何种先验写进结构；生成式 AI 则是前五层在真实系统里的集成。任意一层的缺口都会在后一层以「调参玄学」的形式暴露出来。</p>
      </div>''')
    parts.append(roadmap_figure("mind-knowledge-deps", "R-1"))
    parts.append(roadmap_figure("flow-learning-loop", "R-2"))
    parts.append('''      <div class="callout tip"><div class="callout-title">难度递进与术语口径</div>
        <p>全站按 L1 入门 → L2 基础 → L3 进阶 → L4 高级 → L5 前沿递进；每章页首的「本章定位」给出先修、后继与知识依赖链。术语统一以 <a href="glossary.html">术语表</a> 为准，例如「置信区间」专指频率学区间，「可信区间」专指贝叶斯后验区间，不混用。</p>
      </div>''')

    relay_rows = []
    for r in case_data["relay"]:
        m = module_by_id.get(r["m"])
        if not m:
            continue
        relay_rows.append(
            f'<tr><td><a href="{esc_attr(m["href"])}">{esc(m["num"])} · {esc(m["title"])}</a></td>'
            f'<td>{esc(r["focus"])}</td><td>{esc(r["task"])}</td></tr>')
    parts.append(f'''      <h2 id="case-relay">跨模块贯穿案例 · 一条数据链走完 15 章</h2>
      <div class="callout info"><div class="callout-title">{esc(case_data["name"])}</div>
        <p>{esc(case_data["goal"])} 数据集固定为 <code>N={case_data["n"]:,}</code> 名学员、{len(case_data["fields"])} 个字段，随机种子 <code>{case_data["seed"]}</code>，由 <code>assets/js/case-data.py</code> 用纯 Python 标准库确定性生成。各章「代码实验」共用同一份数据，因此统计量可跨章对照——这是本站把零散方法串成系统工程视角的主线。</p>
      </div>''')
    parts.append(roadmap_figure("flow-case-relay", "R-3"))
    parts.append('<div class="table-wrap"><table><thead><tr><th>章节</th><th>本章视角</th><th>本章任务</th></tr></thead><tbody>'
                 + "".join(relay_rows) + '</tbody></table></div>')
    parts.append('''      <div class="callout note"><p>字段字典、规范统计量与生成方式见 <a href="DATA-GUIDE.md">数据维护说明</a>；章节编写规范见 <a href="CHAPTER-SPEC.md">教材级章节规范</a>。系统工程视角下，这条链路对应「采集与口径 → 描述与建模 → 实验验证 → 规模化 → 深度系统 → 生成式应用」的完整生命周期。</p></div>''')

    for s in stages:
        sid, n = s["id"], s["num"]
        parts.append(f'''      <h2 id="stage-{sid}">{n} · {esc(s['name'])}</h2>
      <div class="tag-row">{badge(s['difficulty']['label'], 'info')} {badge(s['weeks'], 'ok')} {badge(str(s['hours']) + ' 学时')} {badge(s['era'])}</div>
      <p>{esc(s['tagline'])}。{esc(s['goal'])}。</p>

      <h3 id="{sid}-prereq">先修知识</h3>
      <ul class="check-list">''')
        for x in s["prereq"]:
            parts.append(f'<li>{esc(x)}</li>')
        parts.append('</ul>')

        parts.append(f'''      <h3 id="{sid}-path">学习路径</h3>
      <div class="table-wrap"><table><thead><tr><th>步</th><th>主题</th><th>要点</th><th>专题</th></tr></thead><tbody>''')
        for step in s["path"]:
            m = module_by_id.get(step.get("m"))
            link = f'<a href="{esc_attr(m["href"])}">{esc(m["num"])} · {esc(m["title"])}</a>' if m else '<span class="muted">建设中</span>'
            parts.append(f'<tr><td>{esc(step["step"])}</td><td><strong>{esc(step["n"])}</strong></td><td>{esc(step["d"])}</td><td>{link}</td></tr>')
        parts.append('</tbody></table></div>')

        parts.append(f'''      <h3 id="{sid}-competency">目标能力</h3><ul class="check-list">''')
        for c in s["competencies"]:
            parts.append(f'<li>{esc(c)}</li>')
        parts.append('</ul>')

        parts.append(f'''      <h3 id="{sid}-tasks">实践任务</h3>
      <div class="table-wrap"><table><thead><tr><th>任务</th><th>层级</th><th>提交物</th></tr></thead><tbody>''')
        for t in s["tasks"]:
            parts.append(f'<tr><td>{esc(t["n"])}</td><td>{esc(t["level"])}</td><td>{esc(t["deliverable"])}</td></tr>')
        parts.append('</tbody></table></div>')

        parts.append(f'''      <h3 id="{sid}-assessment">评估标准</h3>
      <div class="table-wrap"><table><thead><tr><th>维度</th><th>可检验标准</th></tr></thead><tbody>''')
        for a in s["assessment"]:
            parts.append(f'<tr><td><strong>{esc(a["n"])}</strong></td><td>{esc(a["standard"])}</td></tr>')
        parts.append('</tbody></table></div>')

        parts.append(f'''      <h3 id="{sid}-bridge">进阶衔接</h3>
      <div class="callout tip"><p>{esc(s['bridge']['text'])}</p>
        <p><a class="btn primary" href="stages/{esc_attr(s['slug'])}.html">阶段 {n} 完整页面 →</a>
        <a class="btn" href="resources.html?stage={sid}">本阶段资源</a>
        <a class="btn" href="timeline.html?stage={sid}">本阶段里程碑</a></p>
      </div>''')

    parts.append('''      <h2 id="howto">如何自检进阶</h2>
      <div class="callout exam"><div class="callout-title">三条硬规则</div>
        <ol><li>每阶段至少完成 2 项实践任务并提交可复现产物，才进入下一阶段。</li>
        <li>评估标准中任何一条说不清，就回到对应专题的例题与易错点，不要靠「看懂了」代替「做得出」。</li>
        <li>涉及外部资料时，优先读资源库中标注「已核验」的一手来源；「待核验」条目仅作线索。</li></ol>
      </div>
      <div class="flex-between mt-6">
        <div><a class="btn" href="index.html">← 返回首页</a> <a class="btn" href="resources.html">资源库</a> <a class="btn" href="timeline.html">时间线</a></div>
        <a class="btn primary" href="stages/statistics.html">从阶段 1 开始 →</a>
      </div>
      </div>
      </article>''')
    return page_shell(
        title=f'学习路线图 · {meta["siteName"]}',
        desc="六阶段演进路线的完整学习路径、先修知识、难度层级、目标能力、实践任务、评估标准与进阶衔接。",
        body_page="roadmap", prefix="", content_inner="\n".join(parts),
    )


def render_resources():
    cnt = {v: sum(1 for r in resources if r.get("v") == v) for v in VERIFY_LABEL}
    stage_opts = "".join(f'<option value="{esc_attr(s["id"])}">阶段 {s["num"]} · {esc(s["name"])}</option>' for s in stages)
    parts = f'''      <article class="module">
      <div class="inner">
      <header class="module-header">
        <div class="crumbs"><a href="index.html">首页</a> / 资源库</div>
        <h1>资源库 · 可检索可筛选</h1>
        <p class="lead">八类共 {len(resources)} 条资源，覆盖标志性书籍、标志性理论、关键论文、里程碑模型、经典课程、数据集、通用工具/框架与开源资源。每条标注来源、年份、权威性、适用阶段、核验状态与更新时间。</p>
        <div class="module-meta">
          {badge(str(len(resources)) + ' 条资源', 'brand')} {badge('8 个类型', 'info')}
          {badge(str(cnt['verified']) + ' 条已核验', 'ok')} {badge(str(cnt['pending']) + ' 条待核验', 'warn')}
          {badge('更新 ' + UPDATED)}
        </div>
      </header>

      <h2 id="policy">1 · 收录与核验规则</h2>
      <div class="callout note">
        <div class="callout-title">为什么有的条目标「待核验」</div>
        <p>本轮构建对每条资源区分三种状态。<strong>已核验</strong>表示检索命中官方论文页、出版社页、官方仓库或官方公告；<strong>权威共识</strong>表示学界通行引用的经典条目，链接为官方固定入口，年份按通行引用，但未在本轮逐条打开复核；<strong>待核验</strong>表示年份、版次、出处或服务状态存在不确定，卡片中会写明具体不确定点。</p>
        <p>权威等级另分三级：一级官方一手、二级学术机构、三级社区维护。任何「待核验」条目都不应作为定论引用。</p>
      </div>
      <div class="legend-grid">'''
    for k, label in VERIFY_LABEL.items():
        parts += f'<div class="legend-item"><strong>{esc(label)}</strong>{esc(meta["verificationLegend"][k])}</div>'
    for k, label in AUTH_LABEL.items():
        parts += f'<div class="legend-item"><strong>{esc(label.split(" · ")[0])}</strong>{esc(meta["authorityLegend"][k])}</div>'
    parts += f'''</div>
      <div class="callout tip">
        <div class="callout-title">按阶段或年代直达</div>
        <p>阶段页中已内置本阶段资源切片；也可直接打开：'''
    for s in stages:
        parts += f' <a class="chip" href="resources.html?stage={s["id"]}">{esc(s["short"])}</a>'
    parts += f'''</p>
        <p>年代： <a class="chip" href="resources.html?era=2025%2B">2025 年后</a>
          <a class="chip" href="resources.html?era=2020s">2020–2024</a>
          <a class="chip" href="resources.html?era=2010s">2010s</a>
          <a class="chip" href="resources.html?type=paper">全部论文</a>
          <a class="chip" href="resources.html?verify=pending">待核验清单</a></p>
      </div>

      <h2 id="browse">2 · 筛选浏览</h2>
      <div id="library-app">
        <div class="filter-bar">
          <div class="filter-row"><span class="filter-label">关键词</span>
            <input class="field grow" id="lib-q" type="search" placeholder="名称 / 作者 / 出处 / 年份 / 说明，例如：Transformer、共形、DeepSeek、教材">
          </div>
          <div class="filter-row"><span class="filter-label">类型</span><div class="chips" id="lib-types"></div></div>
          <div class="filter-row">
            <span class="filter-label">条件</span>
            <select class="field" id="lib-stage"><option value="all">全部阶段</option>{stage_opts}</select>
            <select class="field" id="lib-verify">
              <option value="all">全部核验状态</option>
              <option value="verified">仅已核验</option>
              <option value="canonical">仅权威共识</option>
              <option value="pending">仅待核验</option>
            </select>
            <select class="field" id="lib-era">
              <option value="all">全部年代</option>
              <option value="-2000">2000 年前</option>
              <option value="2000s">2000–2009</option>
              <option value="2010s">2010–2019</option>
              <option value="2020s">2020–2024</option>
              <option value="2025+">2025 年后</option>
            </select>
            <select class="field" id="lib-sort">
              <option value="year-desc">年份：新 → 旧</option>
              <option value="year-asc">年份：旧 → 新</option>
              <option value="verify">核验状态优先</option>
              <option value="name">按名称</option>
            </select>
            <button class="btn" id="lib-reset">重置筛选</button>
          </div>
        </div>
        <div class="filter-summary" id="lib-count"></div>
        <div id="lib-list"></div>
      </div>
      <noscript><div class="callout warn"><p>筛选功能需要 JavaScript。本站为纯静态页面，浏览器启用脚本后即可使用（离线环境同样有效）。</p></div></noscript>

      <h2 id="update">3 · 如何持续更新</h2>
      <p>所有资源记录集中存放在 <code>data/resources.json</code>，阶段与时间线分别在 <code>data/core.json</code>、<code>data/timeline.json</code>。新增一条资源只需追加一条 JSON 记录，然后运行：</p>
      <pre><code>python assets/js/build-site.py</code></pre>
      <p>生成器会重建配置、运行时数据、六个阶段页与本页依赖的搜索索引。完整字段说明见 <a href="DATA-GUIDE.md">数据维护说明</a>。</p>

      <div class="flex-between mt-6">
        <div><a class="btn" href="index.html">← 返回首页</a> <a class="btn" href="roadmap.html">路线图</a> <a class="btn" href="timeline.html">时间线</a></div>
        <a class="btn primary" href="stages/statistics.html">从阶段 1 开始 →</a>
      </div>
      </div>
      </article>'''
    return page_shell(
        title=f'资源库 · {meta["siteName"]}',
        desc="可筛选的统计学、大数据、机器学习、深度学习、神经网络与生成式 AI 资源库，含来源、年份、权威性与核验状态。",
        body_page="resources", prefix="", content_inner=parts,
    )


def render_timeline_page():
    stage_opts = "".join(f'<option value="{esc_attr(s["id"])}">阶段 {s["num"]} · {esc(s["name"])}</option>' for s in stages)
    era_note = " · ".join(f'{esc(s["short"])} {sum(1 for t in timeline if t["stage"] == s["id"])} 项' for s in stages)
    parts = f'''      <article class="module">
      <div class="inner">
      <header class="module-header">
        <div class="crumbs"><a href="index.html">首页</a> / 里程碑时间线</div>
        <h1>里程碑时间线</h1>
        <p class="lead">从 1763 年贝叶斯定理到 2025 年推理模型与新一代基准，共 {len(timeline)} 个关键节点。按时间正序排列，可按阶段与核验状态筛选，并注明每个节点与统计主线的关联。</p>
        <div class="module-meta">
          {badge(str(len(timeline)) + ' 个节点', 'brand')} {badge('6 个阶段', 'info')}
          {badge('1763 – 2025', 'ok')} {badge('更新 ' + UPDATED)}
        </div>
      </header>

      <h2 id="reading">1 · 怎么读这条时间线</h2>
      <div class="callout note">
        <div class="callout-title">不是编年史，是统计主线的展开</div>
        <p>每个节点都写明「它与统计推断的哪一部分相关」。例如 1922 年最大似然直通今天所有训练目标，1952 年的 Bradley–Terry 模型在 70 年后成为 RLHF 奖励模型的根基，2005 年共形预测在 20 年后成为大模型不确定性量化的热点。顺着这条线读，前五个阶段不是历史背景，而是理解生成式 AI 的必要前提。</p>
        <p>阶段分布：{era_note}。2026 年条目已明确标注「待核验」，仅作为持续更新的提醒，不作为定论。</p>
      </div>

      <h2 id="filters">2 · 筛选时间线</h2>
      <div id="timeline-app">
        <div class="filter-bar">
          <div class="filter-row"><span class="filter-label">关键词</span>
            <input class="field grow" id="tl-q" type="search" placeholder="事件 / 机构 / 出处，例如：Transformer、Chinchilla、扩散">
          </div>
          <div class="filter-row">
            <span class="filter-label">条件</span>
            <select class="field" id="tl-stage"><option value="all">全部阶段</option>{stage_opts}</select>
            <select class="field" id="tl-verify">
              <option value="all">全部核验状态</option>
              <option value="verified">仅已核验</option>
              <option value="canonical">仅权威共识</option>
              <option value="pending">仅待核验</option>
            </select>
            <button class="btn" id="tl-reset">重置筛选</button>
          </div>
        </div>
        <div class="filter-summary" id="tl-count"></div>
        <div id="tl-list"></div>
      </div>
      <noscript><div class="callout warn"><p>筛选功能需要 JavaScript，离线环境同样可用。</p></div></noscript>

      <h2 id="by-stage">3 · 按阶段查看</h2>
      <div class="card-grid three">'''
    for s in stages:
        n = sum(1 for t in timeline if t["stage"] == s["id"])
        parts += f'''<a class="card mod-card" href="timeline.html?stage={s['id']}">
          <div class="mod-num">STAGE {s['num']}</div><h3>{esc(s['name'])}</h3>
          <p>{n} 个里程碑节点 · {esc(s['era'])}</p></a>'''
    parts += f'''</div>
      <div class="flex-between mt-6">
        <div><a class="btn" href="index.html">← 返回首页</a> <a class="btn" href="roadmap.html">路线图</a> <a class="btn" href="resources.html">资源库</a></div>
        <a class="btn primary" href="stages/statistics.html">从阶段 1 开始 →</a>
      </div>
      </div>
      </article>'''
    return page_shell(
        title=f'里程碑时间线 · {meta["siteName"]}',
        desc="1763–2025 统计学到生成式 AI 的里程碑时间线，含阶段归属、来源与核验状态。",
        body_page="timeline", prefix="", content_inner=parts,
    )


(ROOT / "index.html").write_text(render_index(), encoding="utf-8")
(ROOT / "roadmap.html").write_text(render_roadmap(), encoding="utf-8")
(ROOT / "resources.html").write_text(render_resources(), encoding="utf-8")
(ROOT / "timeline.html").write_text(render_timeline_page(), encoding="utf-8")


# ---------------------------------------------------------------- 搜索索引
def clean(s):
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", s).strip()


PAGE_SCOPE = {"index.html": "首页", "roadmap.html": "路线图", "resources.html": "资源库",
              "timeline.html": "时间线", "glossary.html": "术语表"}
entries = []
for f in sorted(ROOT.rglob("*.html")):
    if "vendor" in f.parts or "fragments" in f.parts:
        continue
    rel = f.relative_to(ROOT).as_posix()
    h = f.read_text(encoding="utf-8")
    m = re.search(r"<title>(.*?)</title>", h, re.S)
    title = clean(m.group(1)) if m else rel
    title = re.sub(r"\s*·\s*统计[^\s]*$", "", title).strip()
    m = re.search(r'name="description"\s+content="(.*?)"', h, re.S)
    desc = clean(m.group(1)) if m else ""
    sections = [clean(x).replace("🔗", "").replace("¶", "").strip()
                for x in re.findall(r"<h[23][^>]*>(.*?)</h[23]>", h, re.S)][:40]
    kw = []
    m = re.search(r'class="lead">(.*?)</p>', h, re.S)
    if m:
        kw.append(clean(m.group(1))[:250])
    kw += [clean(x) for x in re.findall(r'<span class="ex-title">(.*?)</span>', h)]
    kw += [clean(x) for x in re.findall(r'<div class="gl-term">(.*?)</div>', h)]
    scope = PAGE_SCOPE.get(rel)
    if not scope and rel.startswith("stages/"):
        scope = "阶段页"
    elif not scope and rel.startswith("modules/"):
        scope = "专题章节"
    entries.append({
        "href": rel, "title": title, "scope": scope or "页面",
        "desc": desc[:300], "sections": sections,
        "keywords": " | ".join(kw)[:1200],
    })

# 资源条目：点击直接跳到资源库对应锚点
for r in resources:
    blob = " ".join([r["n"], r.get("en", ""), r.get("by", ""), r.get("src", ""),
                     r.get("desc", ""), r.get("note", ""), str(r.get("y", ""))])
    entries.append({
        "href": f"resources.html#r-{r['id']}",
        "title": f"{TYPE_ICON.get(r['t'], '')} {r['n']}",
        "scope": TYPE_LABEL.get(r["t"], "资源"),
        "desc": f'{r.get("y", "")} · {r.get("by", "")} · {r.get("src", "")} · {r["desc"]}',
        "sections": [STAGE_SHORT.get(x, x) for x in r.get("st", [])],
        "keywords": f'{blob} | {VERIFY_LABEL.get(r.get("v"), "")} | {AUTH_LABEL.get(r.get("auth"), "")}'[:1200],
    })

(ASSETS_JS / "search-index.js").write_text(
    "/* 由 build-site.py 自动生成，勿手改。修改内容后重新运行该脚本。 */\n"
    "window.SEARCH_INDEX = " + json.dumps(entries, ensure_ascii=False, indent=1) + ";\n",
    encoding="utf-8",
)

print("=" * 62)
print(f"✅ 生成完成  · 数据更新 {UPDATED}")
print(f"   阶段页      : {len(stages)} 个 -> stages/*.html")
print(f"   资源条目    : {len(resources)} 条  {dict(Counter(r['t'] for r in resources))}")
print(f"   时间线节点  : {len(timeline)} 项")
print(f"   核验状态    : {dict(Counter(r['v'] for r in resources))}")
print(f"   搜索索引    : {len(entries)} 条（{len(entries)-len(resources)} 页面 + {len(resources)} 资源）")
print(f"   输出        : config.js / site-data.js / search-index.js")
print("=" * 62)

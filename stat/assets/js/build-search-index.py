# -*- coding: utf-8 -*-
"""从 HTML 页面生成 search-index.js（纯静态站离线搜索用）。
用法: python build-search-index.py   （在 assets/js 目录下运行）"""
import re, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGES = [
    ("index.html", "首页"),
    ("roadmap.html", "路线图"),
    ("resources.html", "资料库"),
    ("glossary.html", "术语表"),
    ("modules/m01-data.html", "模块 01"),
    ("modules/m02-descriptive.html", "模块 02"),
    ("modules/m03-probability.html", "模块 03"),
    ("modules/m04-distributions.html", "模块 04"),
    ("modules/m05-inference.html", "模块 05"),
    ("modules/m06-regression.html", "模块 06"),
    ("modules/m07-bayesian.html", "模块 07"),
    ("modules/m08-experiment.html", "模块 08"),
    ("modules/m09-ml-stats.html", "模块 09"),
    ("modules/m10-ai-stats.html", "模块 10"),
]

def clean(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

entries = []
for rel, scope in PAGES:
    p = ROOT / rel
    if not p.exists():
        continue
    html = p.read_text(encoding="utf-8")
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    title = clean(m.group(1)) if m else rel
    title = title.replace(" · 统计分析自学系统", "").strip()
    m = re.search(r'name="description"\s+content="(.*?)"', html, re.S)
    desc = clean(m.group(1)) if m else ""
    sections = [clean(x) for x in re.findall(r"<h[23][^>]*>(.*?)</h[23]>", html, re.S)]
    sections = [s.replace("🔗", "").replace("¶", "").strip() for s in sections][:40]
    kw = []
    m = re.search(r'class="lead">(.*?)</p>', html, re.S)
    if m: kw.append(clean(m.group(1))[:200])
    for t in re.findall(r'<span class="ex-title">(.*?)</span>', html):
        kw.append(clean(t))
    for t in re.findall(r'<div class="gl-term">(.*?)</div>', html):
        kw.append(clean(t))
    entries.append({
        "href": rel.replace("\\", "/"),
        "title": title,
        "scope": scope,
        "desc": desc[:300],
        "sections": sections,
        "keywords": " | ".join(kw)[:1200],
    })

out = ROOT / "assets" / "js" / "search-index.js"
out.write_text(
    "/* 由 build-search-index.py 自动生成，勿手改。修改内容后重新运行该脚本。 */\n"
    "window.SEARCH_INDEX = " + json.dumps(entries, ensure_ascii=False, indent=1) + ";\n",
    encoding="utf-8",
)
print("OK:", len(entries), "pages ->", out)

# -*- coding: utf-8 -*-
"""站点完整性校验：结构、链接、公式语法、脚本引用。"""
import re, pathlib, json, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
errors, warns = [], []

# 1) 收集所有 HTML
html_files = sorted([f for f in ROOT.rglob("*.html")
                     if "vendor" not in f.parts and "fragments" not in f.parts])
print(f"[1] HTML 文件数: {len(html_files)}  (data/fragments/* 为注入片段，非整页，已排除)")

REQUIRED_SNIPPETS = [
    "assets/css/tokens.css", "assets/css/base.css", "assets/css/layout.css",
    "assets/css/components.css", "katex.min.css", "katex.min.js",
    "auto-render.min.js", "config.js", "search-index.js", "app.js",
    'id="sidebar-nav"', 'id="search-overlay"', 'id="toc-list"',
    "data-theme-toggle", "data-search-open", "data-sidebar-toggle",
]

for f in html_files:
    rel = f.relative_to(ROOT).as_posix()
    html = f.read_text(encoding="utf-8")
    for s in REQUIRED_SNIPPETS:
        # 首页等落地页有意不渲染 TOC 侧栏（page_shell(toc=False)）；
        # 只要没有 <aside id="toc">，就不应强制要求 id="toc-list"。
        if s == 'id="toc-list"' and 'id="toc"' not in html:
            continue
        if s not in html:
            errors.append(f"{rel}: 缺少必要片段 -> {s}")
    # data-page
    m = re.search(r'<body data-page="([^"]+)"', html)
    if not m:
        errors.append(f"{rel}: body 缺少 data-page")
    # 脚本顺序
    order = ["katex.min.js", "auto-render.min.js", "config.js", "search-index.js", "app.js"]
    srcs = re.findall(r'<script[^>]+src="([^"]+)"', html)
    idx = []
    for x in order:
        pos = next((i for i, s2 in enumerate(srcs) if x in s2), -1)
        idx.append(pos)
    if any(i < 0 for i in idx) or idx != sorted(idx):
        errors.append(f"{rel}: 脚本顺序不正确 {idx}")
    # 公式禁用宏
    for bad in [r"\\tag\{", r"\\label\{", r"\\eqref\{", r"\\begin\{equation\}"]:
        if re.search(bad, html):
            errors.append(f"{rel}: 公式使用了不支持的宏 {bad}")
    # 花括号平衡（KaTeX 内）
    for m2 in re.finditer(r"\$\$([^$]+)\$\$", html, re.S):
        seg = m2.group(1)
        if seg.count("{") != seg.count("}"):
            errors.append(f"{rel}: 显示公式花括号不平衡: {seg[:60]}...")
    for m2 in re.finditer(r"(?<!\$)\$([^$\n]+)\$(?!\$)", html):
        seg = m2.group(1)
        if seg.count("{") != seg.count("}"):
            warns.append(f"{rel}: 行内公式花括号可能不平衡: {seg[:40]}")

print(f"[2] 结构/公式检查完成")

# 2) 链接检查
link_re = re.compile(r'(?:href|src)="([^"#]+?)(?:#[^"]*)?"')
all_targets = {f.relative_to(ROOT).as_posix() for f in ROOT.rglob("*") if f.is_file()}
for f in html_files:
    rel = f.relative_to(ROOT).as_posix()
    base = f.parent
    html = f.read_text(encoding="utf-8")
    for href in link_re.findall(html):
        if href.startswith(("http://", "https://", "mailto:", "javascript:", "data:")):
            continue
        # 站内筛选链接带 ?stage=s1 / ?era=2025%2B 等查询串，由 site-ui.js 消费；
        # 判活时只取路径部分，但报错仍显示原始 href 便于定位。
        clean = href.split("?", 1)[0].strip()
        if not clean:
            continue
        target = (base / clean).resolve()
        try:
            t_rel = target.relative_to(ROOT.resolve()).as_posix()
        except ValueError:
            errors.append(f"{rel}: 链接越出站点 {href}")
            continue
        if t_rel not in all_targets and not target.exists():
            errors.append(f"{rel}: 死链 -> {href}")

print(f"[3] 链接检查完成")

# 2b) 锚点检查（页面内 & 跨页）
from html.parser import HTMLParser

VOID = {"area","base","br","col","embed","hr","img","input","link","meta",
        "param","source","track","wbr","path","circle","rect","line",
        "polygon","polyline","use","stop"}

class IdCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if d.get("id"):
            self.ids.add(d["id"])

id_map = {}
for f in html_files:
    rel = f.relative_to(ROOT).as_posix()
    c = IdCollector()
    c.feed(f.read_text(encoding="utf-8"))
    id_map[rel] = c.ids

frag_count = 0
# resources.html 的资源卡由 site-ui.js 运行时渲染，锚点形如 #r-b05；
# 静态 HTML 里不存在，改由 data/resources.json 的 id 集合判活。
try:
    _rd = json.loads((ROOT / "data" / "resources.json").read_text(encoding="utf-8"))
    _rl = _rd["resources"] if isinstance(_rd, dict) else _rd
    DYNAMIC_RES_ANCHORS = {"r-" + r["id"] for r in _rl}
except Exception:
    DYNAMIC_RES_ANCHORS = set()

for f in html_files:
    rel = f.relative_to(ROOT).as_posix()
    base = f.parent
    html = f.read_text(encoding="utf-8")
    for href in re.findall(r'href="([^"]+)"', html):
        if href.startswith(("http://", "https://", "mailto:", "javascript:", "data:")):
            continue
        if "#" not in href:
            continue
        path_part, _, frag = href.partition("#")
        if not frag:
            continue
        frag_count += 1
        if not path_part:
            if frag not in id_map[rel]:
                errors.append(f"{rel}: 页内锚点失效 -> #{frag}")
            continue
        # 查询串不属于文件名（例如 resources.html?stage=s6#r-p23）
        clean = path_part.split("?", 1)[0].strip()
        target = (base / clean).resolve()
        try:
            t_rel = target.relative_to(ROOT.resolve()).as_posix()
        except ValueError:
            continue
        if t_rel in id_map and frag not in id_map[t_rel]:
            if t_rel == "resources.html" and frag in DYNAMIC_RES_ANCHORS:
                continue  # 运行时由 site-ui.js 渲染
            errors.append(f"{rel}: 跨页锚点失效 -> {href}（{t_rel} 无 id='{frag}'）")
print(f"[3b] 锚点检查完成（{frag_count} 个带片段链接）")

# 2c) HTML 标签结构平衡检查
class BalanceChecker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        self.stack.append((tag, self.getpos()))
    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"多余闭合 </{tag}> @ 行{self.getpos()[0]}")
            return
        if self.stack[-1][0] == tag:
            self.stack.pop()
            return
        found = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                found = i
                break
        if found is None:
            self.errors.append(f"孤立闭合 </{tag}> @ 行{self.getpos()[0]}")
        else:
            unclosed = [t for t, _ in self.stack[found + 1:]]
            if unclosed:
                self.errors.append(
                    f"未闭合 <{unclosed[0]}>（开于行{self.stack[found+1][1][0]}）-> </{tag}> @ 行{self.getpos()[0]}"
                )
            del self.stack[found:]

for f in html_files:
    rel = f.relative_to(ROOT).as_posix()
    bc = BalanceChecker()
    bc.feed(f.read_text(encoding="utf-8"))
    for e in bc.errors:
        errors.append(f"{rel}: {e}")
    leftover = [t for t, _ in bc.stack]
    if leftover:
        errors.append(f"{rel}: 文档结束时仍未闭合 -> {leftover}")
print("[3c] HTML 标签结构检查完成")

# 3) search-index 校验
si = (ROOT / "assets/js/search-index.js").read_text(encoding="utf-8")
m = re.search(r"window\.SEARCH_INDEX = (\[.*\]);", si, re.S)
if not m:
    errors.append("search-index.js 格式错误")
else:
    idx = json.loads(m.group(1))
    print(f"[4] 搜索索引条目: {len(idx)}")
    hrefs = {e["href"] for e in idx}
    for f in html_files:
        rel = f.relative_to(ROOT).as_posix()
        if rel not in hrefs:
            warns.append(f"搜索索引未收录: {rel}")

# 4) config.js 中 href 存在性
cfg = (ROOT / "assets/js/config.js").read_text(encoding="utf-8")
for href in re.findall(r'href:/s*"([^"]+)"', cfg):
    p = ROOT / href
    if not p.exists():
        errors.append(f"config.js 指向不存在的文件: {href}")

# 5) KaTeX 资源
for p in ["assets/vendor/katex/dist/katex.min.js",
          "assets/vendor/katex/dist/contrib/auto-render.min.js",
          "assets/vendor/katex/dist/katex.min.css"]:
    if not (ROOT / p).exists():
        errors.append(f"缺少 KaTeX 资源: {p}")
fonts = list((ROOT / "assets/vendor/katex/dist/fonts").glob("*.woff2"))
print(f"[5] KaTeX woff2 字体: {len(fonts)}")

print("\n" + "="*60)
if errors:
    print(f"❌ 发现 {len(errors)} 个错误:")
    for e in errors[:40]:
        print("  -", e)
else:
    print("✅ 全部检查通过（0 错误）")
if warns:
    print(f"⚠️  {len(warns)} 条警告:")
    for w in warns[:10]:
        print("  -", w)
sys.exit(1 if errors else 0)

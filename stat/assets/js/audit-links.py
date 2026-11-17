# -*- coding: utf-8 -*-
"""完备链接审计：检查每个页面的所有链接（文件 + 锚点片段）、aria/label 引用、
空区块、占位内容、TODO 残留等，输出可执行的修复清单。
用法: python audit-links.py"""
import re, pathlib, json, sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[2]

def page_files():
    # v2 起覆盖全站（含 stages/ 与 timeline.html），排除 KaTeX vendor 自带演示页
    return sorted(f for f in ROOT.rglob("*.html")
                  if "vendor" not in f.parts and "fragments" not in f.parts)

files = page_files()

# ---------- 收集每页的 id 集合与链接 ----------
class Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set(); self.links = []; self.empty_anchors = []
        self.tags = []; self.text_len = 0
        self._in = {}   # tag -> depth
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if d.get("id"): self.ids.add(d["id"])
        if tag == "a" and "href" in d:
            self.links.append(d["href"])
        self.tags.append((tag, d))
    def handle_endtag(self, tag):
        pass
    def handle_data(self, data):
        if data.strip(): self.text_len += len(data.strip())

collectors = {}
for f in files:
    c = Collector()
    c.feed(f.read_text(encoding="utf-8"))
    collectors[f] = c

id_map = {f.relative_to(ROOT).as_posix(): c.ids for f, c in collectors.items()}

# resources.html 的资源卡由 site-ui.js 运行时渲染（id="r-<资源 id>"），静态审计按数据源判活
try:
    _rd = json.loads((ROOT / "data" / "resources.json").read_text(encoding="utf-8"))
    _rl = _rd["resources"] if isinstance(_rd, dict) else _rd
    DYNAMIC_RES_ANCHORS = {"r-" + r["id"] for r in _rl}
except Exception:
    DYNAMIC_RES_ANCHORS = set()

print("=" * 78)
print("链接审计报告")
print("=" * 78)

problems = []
ok_links = 0

for f in files:
    rel = f.relative_to(ROOT).as_posix()
    base_dir = f.parent
    for href in collectors[f].links:
        h = href.strip()
        if not h or h.startswith(("http://", "https://", "mailto:", "javascript:", "data:")):
            continue
        if h.startswith("#"):
            frag = h[1:]
            if frag and frag not in collectors[f].ids:
                problems.append(("锚点失效", rel, h, f"页面内不存在 id='{frag}'"))
            else:
                ok_links += 1
            continue
        path_part, _, frag = h.partition("#")
        # 站内筛选链接带 ?stage=s1 等查询串；判活时只解析路径部分
        path_part = path_part.split("?", 1)[0].strip()
        if not path_part:
            if frag and frag not in collectors[f].ids:
                problems.append(("锚点失效", rel, h, f"页面内不存在 id='{frag}'"))
            else:
                ok_links += 1
            continue
        target = (base_dir / path_part).resolve()
        try:
            t_rel = target.relative_to(ROOT.resolve()).as_posix()
        except ValueError:
            problems.append(("越界链接", rel, h, "指向站点根目录之外"))
            continue
        if not target.exists():
            problems.append(("死链/404", rel, h, f"目标文件不存在: {t_rel}"))
            continue
        if frag:
            tgt_ids = id_map.get(t_rel)
            if tgt_ids is not None and frag not in tgt_ids:
                if t_rel == "resources.html" and frag in DYNAMIC_RES_ANCHORS:
                    ok_links += 1
                    continue  # 运行时渲染
                problems.append(("跨页锚点失效", rel, h, f"{t_rel} 中不存在 id='{frag}'"))
            else:
                ok_links += 1
        else:
            ok_links += 1

print(f"\n可解析链接总数: {ok_links}")
if problems:
    print(f"\n发现 {len(problems)} 处问题:")
    for kind, src, link, msg in problems:
        print(f"  [{kind}] {src}  ->  {link}\n        {msg}")
else:
    print("✅ 未发现死链或锚点失效")

# ---------- 空区块 / 占位内容 ----------
print("\n" + "=" * 78)
print("内容完整性扫描")
print("=" * 78)

from html import unescape as html_unescape

# 只在「可见文本」里找占位词：避免把 placeholder="..." 这类属性名误判为占位内容
PLACEHOLDER = re.compile(
    r"(TODO|FIXME|待补充|占位(?!符)|placeholder|Lorem ipsum|XXX|待完善|敬请期待|coming soon)", re.I)
CHECK_TAGS = {"div", "section", "article", "ul", "ol", "table", "tbody", "nav", "aside"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "param", "source", "track", "wbr", "path", "circle", "rect", "line",
        "polygon", "polyline", "use", "stop"}


class ContentChecker(HTMLParser):
    """按 DOM 树判定真正无内容的容器。

    正则无法正确处理嵌套 <div>（会把 <div><div>文字</div></div> 误判为空），
    因此改用栈：任意后代文本会向上冒泡标记 has=True；带 id / data-* 的容器
    视为 JS 挂载点（如 #lib-list、#toc-list），不计为空区块。
    """
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.empties = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
            return
        if tag in VOID:
            for fr in self.stack:
                fr["has"] = True
            return
        d = dict(attrs)
        cls = d.get("class") or ""
        # CSS 布局留白（如 .header-spacer{flex:1}）本身就没有内容，属正常结构
        layout = "spacer" in cls or "divider" in cls or "sep" in cls
        dynamic = bool(d.get("id")) or any(k.startswith("data-") for k in d) or layout
        self.stack.append({"tag": tag, "line": self.getpos()[0],
                           "dynamic": dynamic, "has": False})
        if len(self.stack) >= 2:
            self.stack[-2]["has"] = True

    def handle_startendtag(self, tag, attrs):
        for fr in self.stack:
            fr["has"] = True

    def handle_data(self, data):
        if self.skip or not data.strip():
            return
        for fr in self.stack:
            fr["has"] = True

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
            return
        if tag in VOID:
            return
        idx = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]["tag"] == tag:
                idx = i
                break
        if idx is None:
            return
        fr = self.stack[idx]
        if fr["tag"] in CHECK_TAGS and not fr["has"] and not fr["dynamic"]:
            self.empties.append((fr["tag"], fr["line"]))
        del self.stack[idx:]


for f in files:
    rel = f.relative_to(ROOT).as_posix()
    html = f.read_text(encoding="utf-8")
    issues = []

    # 占位文本（只看可见文本）
    # 「经典配图占位」是 v3 规范要求的正式组件，带准确图注与来源链接，不是未完成内容；
    # 整块剔除后再扫描，避免把设计意图误报为残留。
    visible = re.sub(r"<figure class=\"figure-placeholder\".*?</figure>", " ", html,
                     flags=re.S | re.I)
    visible = re.sub(r"<script.*?</script>", " ", visible, flags=re.S | re.I)
    visible = re.sub(r"<style.*?</style>", " ", visible, flags=re.S | re.I)
    visible = html_unescape(re.sub(r"<[^>]+>", " ", visible))
    for word in sorted({m.group(0) for m in PLACEHOLDER.finditer(visible)}):
        issues.append(f"占位文本 '{word}'")

    # 真正无内容的容器
    checker = ContentChecker()
    checker.feed(html)
    for tag, line in checker.empties[:8]:
        issues.append(f"空区块 <{tag}> @ 行{line}")
    if len(checker.empties) > 8:
        issues.append(f"…另有 {len(checker.empties) - 8} 个空区块")

    # 例题骨架不变量：每道例题一个解答折叠，另允许练习区一个「查看答案」折叠
    n_ex = len(re.findall(r'class="example"', html))
    n_sol = len(re.findall(r'<details class="solution"', html))
    if "modules" in rel:
        if n_sol < n_ex or n_sol - n_ex > 1:
            issues.append(f"例题数({n_ex}) 与解答折叠数({n_sol}) 不一致（允许练习答案多 1 个）")
        if n_ex < 6:
            issues.append(f"例题偏少: 仅 {n_ex} 道 (目标 6+)")

        # 练习题按「练习题」小节里的 <li> 计数；v3 新增的「自测题」小节另按 quiz-item 计数
        # 注意：注入片段里的 <h2>自测题</h2> 排在原有 <h2>练习题</h2> 之前，
        # 不能用首个「练习|自测」标题，否则会取到错误段落。
        n_q = 0
        n_quiz = 0
        for sec in re.finditer(
                r"<h2[^>]*>([^<]*(?:练习题|练习|自测)[^<]*)</h2>(.*?)(?=<h2|\Z)", html, re.S):
            title, body = sec.group(1), sec.group(2)
            if "练习题" in title or "练习" in title:
                n_q += len(re.findall(r"<li\b", body))
            if "自测" in title:
                n_quiz += len(re.findall(r'class="quiz-item"', body))
        n_q = max(n_q, n_quiz)
        if n_q < 4:
            issues.append(f"练习题偏少: {n_q} 道 (目标 4+)")

    if issues:
        print(f"\n{rel}:")
        for i in issues:
            print("   -", i)

# ---------- 统计 ----------
print("\n" + "=" * 78)
print("各页指标")
print("=" * 78)
print(f"{'页面':<32}{'字数':>8}{'H2':>5}{'例题':>6}{'解答':>6}{'表格':>6}{'公式':>7}{'练习':>6}")
for f in files:
    rel = f.relative_to(ROOT).as_posix()
    html = f.read_text(encoding="utf-8")
    body = re.sub(r"<script.*?</script>", "", html, flags=re.S)
    body = re.sub(r"<style.*?</style>", "", body, flags=re.S)
    txt = re.sub(r"<[^>]+>", " ", body)
    txt = re.sub(r"\s+", " ", txt).strip()
    print(f"{rel:<32}{len(txt):>8}{len(re.findall(r'<h2[ >]',html)):>5}"
          f"{len(re.findall(chr(34)+'example'+chr(34),html)):>6}"
          f"{len(re.findall(r'<details class=.solution',html)):>6}"
          f"{len(re.findall(r'<table',html)):>6}"
          f"{len(re.findall(r'[$][$]',html)):>7}"
          f"{len(re.findall(r'练习题',html)):>6}")

sys.exit(0)

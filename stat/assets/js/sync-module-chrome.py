# -*- coding: utf-8 -*-
"""
sync-module-chrome.py — 同步 modules/*.html 的共享框架

解决什么问题
------------
v1 章节（m01–m10）与 v2 新增章节（m11–m15）由不同批次生成，导致：
  * 两套互不相通的「上一篇 / 下一篇」链，出现孤岛；
  * 部分章节把「时间线」误指向 roadmap.html，或指向不存在的说明文件；
  * 页脚、面包屑、站点名、脚本栈不一致。

本脚本只替换共享框架（header / crumbs / footer / module-nav / script 栈），
不触碰任何正文内容。阅读顺序直接从 data/core.json 的 stages[].modules 推导，
因此增删模块后重跑即可，无需手改 15 个 HTML。

用法：cd assets/js && python sync-module-chrome.py
"""
import json
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "core.json"
MODULES = ROOT / "modules"

core = json.loads(DATA.read_text(encoding="utf-8"))
meta = core["meta"]
stages = core["stages"]
module_by_id = {m["id"]: m for m in core["modules"]}
esc = lambda s: html.escape(str(s), quote=False)

# 单一连续的六阶段阅读顺序：阶段 1..6，阶段内按 modules 登记顺序
order = []            # [(module_id, stage_dict)]
for st in stages:
    for mid in st["modules"]:
        order.append((mid, st))
stage_of = {mid: st for mid, st in order}
pos_of = {mid: i for i, (mid, _) in enumerate(order)}

UPDATED = meta["updated"]
NAME = esc(meta["siteName"])
TAGLINE = esc(meta["tagline"])

HEADER_ACTIONS = '''<div class="header-actions">
    <button class="icon-btn search-trigger" data-search-open aria-label="搜索">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <span class="label">搜索</span><span class="kbd">Ctrl K</span>
    </button>
    <button class="icon-btn" data-theme-toggle aria-label="切换主题"><span class="theme-label">深色</span></button>
    <a class="icon-btn" href="../roadmap.html">路线图</a>
    <a class="icon-btn" href="../resources.html">资源库</a>
    <a class="icon-btn" href="../timeline.html">时间线</a>
  </div>'''

FOOTER = '''<footer class="site-footer">
  <p><span data-site-footer></span> · 数据更新 {upd}</p>
  <p>内容与来源见 <a href="../resources.html">资源库</a> · <a href="../timeline.html">时间线</a> · <a href="../glossary.html">术语表</a> · <a href="../roadmap.html">学习路线图</a> · <a href="../DATA-GUIDE.md">数据维护说明</a> · <a href="../TEMPLATE-GUIDE.md">模板复用指南</a></p>
</footer>'''.format(upd=UPDATED)

SCRIPTS = '''<script src="../assets/vendor/katex/dist/katex.min.js"></script>
<script src="../assets/vendor/katex/dist/contrib/auto-render.min.js"></script>
<script src="../assets/js/config.js"></script>
<script src="../assets/js/site-data.js"></script>
<script src="../assets/js/search-index.js"></script>
<script src="../assets/js/learning-index.js"></script>
<script src="../assets/js/app.js"></script>
<script src="../assets/js/site-ui.js"></script>
<script src="../assets/js/learning.js"></script>'''


def basename(mid):
    return pathlib.PurePosixPath(module_by_id[mid]["href"]).name


def nav_link(mid, st, kind, cur_stage):
    """生成 module-nav 的一侧链接。"""
    m = module_by_id[mid]
    ttl = f'{m["num"]} · {esc(m["title"])}'
    href = basename(mid)
    same = st["id"] == cur_stage["id"]
    if kind == "prev":
        direction = "← 上一篇" if same else f'← 阶段 {st["num"]} · 上一篇'
        return f'<a class="prev" href="{href}"><span class="dir">{direction}</span><span class="ttl">{ttl}</span></a>'
    direction = "下一篇 →" if same else f'进入阶段 {st["num"]} →'
    return f'<a class="next" href="{href}"><span class="dir">{direction}</span><span class="ttl">{ttl}</span></a>'


changed = []
for mid, st in order:
    cur_stage = st
    path = MODULES / basename(mid)
    if not path.exists():
        raise SystemExit(f"缺少模块文件: {path}")
    src = path.read_text(encoding="utf-8")
    out = src

    # 1) 站点名与副标题（app.js 运行时也会覆盖，这里保证无 JS / 离线时一致）
    out = re.sub(r'<span data-site-name>[^<]*</span>',
                 f'<span data-site-name>{NAME}</span>', out)
    out = re.sub(r'<span class="brand-sub" data-site-tagline>[^<]*</span>',
                 f'<span class="brand-sub" data-site-tagline>{TAGLINE}</span>', out)

    # 1b) 标题与 favicon（统一站名，消除 HTTP 下 /favicon.ico 的 404）
    m = module_by_id[mid]
    title = f'{esc(m["num"])} · {esc(m["title"])} · {NAME}'
    out, n = re.subn(r"<title>.*?</title>", lambda _: f"<title>{title}</title>",
                     out, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{path.name}: 未找到 <title>")
    if 'rel="icon"' not in out:
        out = out.replace('<link rel="stylesheet" href="../assets/css/tokens.css">',
                          '<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">\n'
                          '<link rel="stylesheet" href="../assets/css/tokens.css">', 1)
    # v3 学习闭环组件层（幂等）
    if 'assets/css/learning.css' not in out:
        out = out.replace('<link rel="stylesheet" href="../assets/css/components.css">',
                          '<link rel="stylesheet" href="../assets/css/components.css">\n'
                          '<link rel="stylesheet" href="../assets/css/learning.css">', 1)

    # 2) 顶部快捷入口（含修正 m11/m12 的「时间线」误指向 roadmap.html）
    out, n = re.subn(r'<div class="header-actions">.*?</div>',
                     lambda _: HEADER_ACTIONS, out, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{path.name}: 未找到 header-actions")

    # 3) 面包屑：补上所属阶段总览入口
    m = module_by_id[mid]
    crumbs = ('<div class="crumbs"><a href="../index.html">首页</a> / '
              '<a href="../roadmap.html">学习路线图</a> / '
              f'<a href="../stages/{st["slug"]}.html">阶段 {st["num"]} · {esc(st["name"])}</a>'
              f' / {esc(m["num"])} · {esc(m["title"])}</div>')
    out, n = re.subn(r'<div class="crumbs">.*?</div>', lambda _: crumbs,
                     out, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{path.name}: 未找到 crumbs")

    # 4) 统一页脚
    out, n = re.subn(r'<footer class="site-footer">.*?</footer>',
                     lambda _: FOOTER, out, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{path.name}: 未找到 footer")

    # 5) 单一连续的上一篇 / 下一篇链
    i = pos_of[mid]
    if i > 0:
        prev_html = nav_link(*order[i - 1], kind="prev", cur_stage=cur_stage)
    else:
        prev_html = ('<a class="prev" href="../stages/statistics.html">'
                     '<span class="dir">← 阶段 1 总览</span>'
                     '<span class="ttl">01 · 统计学</span></a>')
    if i < len(order) - 1:
        next_html = nav_link(*order[i + 1], kind="next", cur_stage=cur_stage)
    else:
        next_html = ('<a class="next" href="../resources.html">'
                     '<span class="dir">继续探索 →</span>'
                     '<span class="ttl">全站资源库 · 按阶段筛选</span></a>')
    new_nav = ('<nav class="module-nav">\n        '
               + prev_html + '\n        ' + next_html + '\n      </nav>')
    out, n = re.subn(r'<nav class="module-nav">.*?</nav>',
                     lambda _: new_nav, out, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{path.name}: 未找到 module-nav")

    # 6) 统一脚本栈（site-ui.js 在无匹配容器时静默跳过，章节页加载安全）
    out, n = re.subn(r'(<script src="\.\./assets/vendor/katex/dist/katex\.min\.js"></script>.*?)(?=</body>)',
                     lambda _: SCRIPTS + "\n", out, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{path.name}: 未找到脚本栈")

    if out != src:
        path.write_text(out, encoding="utf-8")
        changed.append(path.name)

print("=" * 62)
print(f"✅ 模块框架同步完成 · 数据更新 {UPDATED}")
print(f"   阅读顺序（六阶段连续）: {' → '.join(mid for mid, _ in order)}")
print(f"   已更新 {len(changed)} / {len(order)} 个章节")
if changed:
    print("   " + ", ".join(changed))
print("=" * 62)

# -*- coding: utf-8 -*-
"""
inject-learning.py — 把「教材级学习闭环」注入 15 个章节
=========================================================
职责（幂等，可反复运行）：
  1. 在每个章节的 V3:HEAD / V3:DEEP / V3:TAIL 标记区间重建共享框架；
  2. 展开 <figure data-figure="ID"></figure> 为离线内联 SVG + 图题 + 说明 + 来源；
  3. 展开 <figure data-classic="mNN:i"></figure> 为「经典配图占位」（准确图注 + 来源链接）；
  4. 从 data/learning.json 生成本章定位、核心问题、跨模块案例、延伸阅读、最新理论突破；
  5. 合并 data/fragments/mNN.html 中由写作者产出的深度专题内容；
  6. 补 id="obj" / id="examples" 锚点，生成 subsection 级搜索条目 learning-index.js。

顺序：build-site.py → sync-module-chrome.py → inject-learning.py → validate-site.py
用法：cd assets/js && python inject-learning.py
"""
import json
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
MODULES = ROOT / "modules"
FRAGS = ROOT / "data" / "fragments"
DATA = ROOT / "data"

core = json.loads((DATA / "core.json").read_text(encoding="utf-8"))
learn = json.loads((DATA / "learning.json").read_text(encoding="utf-8"))
case = json.loads((DATA / "case.json").read_text(encoding="utf-8"))
figs = json.loads((ROOT / "assets" / "js" / "figure-library.json").read_text(encoding="utf-8"))
res_data = json.loads((DATA / "resources.json").read_text(encoding="utf-8"))
resources = res_data["resources"] if isinstance(res_data, dict) else res_data
res_by_id = {r["id"]: r for r in resources}

esc = lambda s: html.escape(str(s), quote=False)
esc_a = lambda s: html.escape(str(s), quote=True)

modules = core["modules"]
module_by_id = {m["id"]: m for m in modules}
stage_by_id = {s["id"]: s for s in core["stages"]}
# 六阶段连续阅读顺序
order = []
for st in core["stages"]:
    for mid in st["modules"]:
        order.append((mid, st))
pos_of = {mid: i for i, (mid, _) in enumerate(order)}
stage_of = {mid: st for mid, st in order}
case_relay = {r["m"]: r for r in case["relay"]}
UPDATED = core["meta"]["updated"]


def href_of(mid, prefix=""):
    """同目录章节的相对链接由 sync-module-chrome.py 统一用 basename；此处保持一致。"""
    return prefix + basename(mid)


def basename(mid):
    return pathlib.PurePosixPath(module_by_id[mid]["href"]).name


# --------------------------------------------------------------------------
# 片段渲染
# --------------------------------------------------------------------------
def render_figure(fid, num):
    f = figs.get(fid)
    if not f:
        raise SystemExit(f"未知图示 ID: {fid}")
    url = f.get("url", "")
    src = f.get("src", "")
    if url and not url.startswith("http"):
        url_html = f'<a href="../{esc_a(url)}">{esc(src)}</a>'
    elif url:
        url_html = f'<a href="{esc_a(url)}" target="_blank" rel="noopener">{esc(src)}</a>'
    else:
        url_html = esc(src)
    return f'''<figure class="figure" id="fig-{esc_a(fid)}">
  {f["svg"]}
  <figcaption>
    <span class="fig-no">图 {num}</span><span class="fig-title">{esc(f["title"])}</span>
    <span class="fig-note">{esc(f["note"])}</span>
    <span class="fig-src">类型：{esc(f["kind"])} · 来源：{url_html} · 本站离线自绘，双主题自适配</span>
  </figcaption>
</figure>'''


def render_classic(mid, idx, num):
    L = learn["modules"][mid]
    c = L["classics"][idx]
    return f'''<figure class="figure-placeholder" id="fig-classic-{esc_a(mid)}-{idx}">
  <div class="ph-frame">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
    <span class="ph-k">插图占位 · {esc(c["no"])}</span>
    <span class="ph-s">本站为离线站点，不内嵌 / 不热链外部图片；请按下方来源链接查看原图</span>
  </div>
  <figcaption>
    <span class="fig-no">图 {num}</span><span class="fig-title">{esc(c["title"])}</span>
    <span class="fig-note">{esc(c["note"])}</span>
    <span class="fig-src">来源：{esc(c["src"])} · 查看：<a href="{esc_a(c["url"])}" target="_blank" rel="noopener">{esc(c["url"])}</a> · 核验状态：来源链接已核对，原图未内嵌</span>
  </figcaption>
</figure>'''


def render_loop_nav():
    items = "".join(
        f'<a href="{esc_a(x["anchor"])}"><span class="n">{esc(x["n"])}</span>{esc(x["label"])}</a>'
        for x in learn["meta"]["loop"])
    return ('<nav class="loop-nav" aria-label="本章学习闭环导航">'
            '<span class="loop-label">学习闭环</span>' + items + '</nav>')


def render_position(mid):
    m = module_by_id[mid]
    st = stage_of[mid]
    i = pos_of[mid]
    L = learn["modules"][mid]
    lvl = m.get("level", "")
    lk = m.get("levelKey", "")
    lv_cls = {"lv-intro": "l1", "lv-base": "l2", "lv-mid": "l3",
              "lv-adv": "l4", "lv-ai": "l5"}.get(lk, "l3")

    prev = order[i - 1][0] if i > 0 else None
    nxt = order[i + 1][0] if i < len(order) - 1 else None
    prev_html = (f'<a href="{esc_a(href_of(prev))}">{esc(module_by_id[prev]["num"])} · '
                 f'{esc(module_by_id[prev]["title"])}</a>') if prev else "无（本站起点）"
    next_html = (f'<a href="{esc_a(href_of(nxt))}">{esc(module_by_id[nxt]["num"])} · '
                 f'{esc(module_by_id[nxt]["title"])}</a>') if nxt else '<a href="../resources.html">全站资源库</a>'

    # 知识依赖链：前两章 + 本章 + 后一章
    chain_ids = [x[0] for x in order[max(0, i - 2):i]] + [mid]
    if nxt:
        chain_ids.append(nxt)
    chain = []
    for cid in chain_ids:
        cls = " current" if cid == mid else ""
        chain.append(f'<a class="dep-node{cls}" href="{esc_a(href_of(cid))}">'
                     f'{esc(module_by_id[cid]["num"])} {esc(module_by_id[cid]["title"])}</a>')
    chain_html = '<span class="dep-arrow">→</span>'.join(chain)

    terms = ", ".join(t for t in L.get("terms", []))
    term_html = (f'<div class="term-strip"><span class="k">本章术语口径 · </span>'
                 f'统一以 <a href="../glossary.html">术语表</a> 为准：{esc(terms)}</div>') if terms else ""

    return f'''<section class="chapter-position" id="pos" aria-label="本章定位与知识依赖">
  <div class="eyebrow">本章定位 · Chapter Position</div>
  <div class="pos-grid">
    <div class="pos-cell"><span class="k">所属阶段</span><span class="v">阶段 {esc(st["num"])} · <a href="../stages/{esc_a(st["slug"])}.html">{esc(st["name"])}</a></span></div>
    <div class="pos-cell"><span class="k">难度层级</span><span class="v"><span class="lv-tag {lv_cls}">{esc(lvl)}</span> · {esc(m.get("hours", ""))}</span></div>
    <div class="pos-cell"><span class="k">先修知识</span><span class="v">{esc(m.get("prereq", "—"))} · 上一篇：{prev_html}</span></div>
    <div class="pos-cell"><span class="k">进阶衔接</span><span class="v">下一篇：{next_html}</span></div>
  </div>
  <div class="dep-chain" aria-label="知识依赖链"><span class="k" style="font-size:var(--fs-xs);font-weight:700;color:var(--text-3)">知识依赖</span>{chain_html}</div>
  {term_html}
</section>'''


def render_core_questions(mid):
    L = learn["modules"][mid]
    lis = "".join(f'<li>{esc(q["q"])} <a class="q-anchor" href="{esc_a(q["anchor"])}">→ 对应讲解</a></li>'
                  for q in L["questions"])
    return f'''<section class="core-q" id="core-q" aria-label="本章核心问题">
  <div class="cq-title">本章核心问题 · 带着问题读</div>
  <ol>{lis}</ol>
</section>'''


def render_case_leg(mid):
    c = case_relay.get(mid)
    if not c:
        return ""
    relay = "".join(
        f'<a class="{"current" if r["m"] == mid else ""}" href="{esc_a(href_of(r["m"]))}" '
        f'title="{esc_a(r["focus"])}">{esc(r["m"].upper())}</a>' for r in case["relay"])
    return f'''<section class="case-leg" id="d-case" aria-label="跨模块贯穿案例">
  <div class="cl-title">跨模块贯穿案例 · <span class="cl-baton">{esc(case["name"])}</span></div>
  <p><strong>本章接棒：{esc(c["focus"])}。</strong>{esc(c["task"])}</p>
  <p class="small muted">数据集固定为 <code>N={case["n"]:,}</code> 名学员、{len(case["fields"])} 个字段，随机种子 <code>{case["seed"]}</code>，由 <code>assets/js/case-data.py</code> 用纯标准库确定性生成；全站各章的代码实验共用同一份数据，因此数字可跨章对照。字段字典与规范统计量见 <a href="../DATA-GUIDE.md">数据维护说明</a>。</p>
  <div class="case-relay" aria-label="15 章案例接力">{relay}</div>
</section>'''


def render_reading(mid):
    L = learn["modules"][mid]
    rows = []
    for r in L["reading"]:
        res = res_by_id.get(r["id"])
        if not res:
            continue
        label = {"book": "教材", "paper": "论文", "course": "课程", "tool": "工具",
                 "dataset": "数据集", "model": "模型", "theory": "理论", "oss": "资源"}.get(res["t"], "资料")
        url = res.get("url") or ""
        if url:
            name = (f'<a href="{esc_a(url)}" target="_blank" rel="noopener">{esc(res["n"])}</a>')
        else:
            name = f'<a href="../resources.html#r-{esc_a(res["id"])}">{esc(res["n"])}</a>'
        vmap = {"verified": "已核验", "canonical": "权威共识", "pending": "待核验"}
        v = vmap.get(res.get("v", ""), "待核验")
        rows.append(f'<div class="fr-item"><span class="fr-tag">{label}</span>'
                    f'<span class="fr-body">{name} <span class="muted small">（{esc(str(res.get("y", "")))} · {v}）</span>'
                    f'<span class="fr-why">为什么读：{esc(r["why"])}</span></span></div>')
    return f'''<section class="learning-summary" id="d-summary" aria-label="总结与延伸阅读">
  <h2>延伸阅读 · 回到体系</h2>
  <div class="callout note"><div class="callout-title">本章小结与本章的衔接</div>
    <p>上表的「本章小结」负责压缩本章概念；本节负责把概念接回六阶段体系：先按上方「本章定位」确认先修与后继，再按「跨模块案例」看同一份数据在下一章如何换一种方法重算，最后用下列资料把直觉补成可推导的形式。难度按 L1→L5 递进，来源与核验状态以 <a href="../resources.html">全站资源库</a> 为准。</p>
  </div>
  <h3>延伸阅读（按与本章的相关度排序）</h3>
  <div class="further-reading">{"".join(rows)}</div>
</section>'''


def render_breakthroughs(mid):
    bs = learn["modules"][mid].get("breakthroughs", [])
    if not bs:
        return ""
    out = ['<h2 id="d-frontier">最新理论突破 · 背景 / 核心思想 / 结论 / 影响 / 局限</h2>',
           '<div class="callout tip"><div class="callout-title">阅读提示</div>'
           '<p>下列条目按「背景 → 核心思想 → 关键结论 → 影响 → 局限」五栏固定展开，来源指向资源库中带核验状态的原始论文。'
           '局限一栏与结论同等重要：多数突破性结论只在特定数据分布、算力口径或任务族内成立。</p></div>']
    for j, b in enumerate(bs, 1):
        refs = []
        for rid in b.get("refs", []):
            r = res_by_id.get(rid)
            if not r:
                continue
            u = r.get("url") or f"../resources.html#r-{rid}"
            refs.append(f'<a href="{esc_a(u)}" target="_blank" rel="noopener">{esc(r["n"])}</a>')
        fields = [("背景与动机", b.get("bg", "")), ("核心思想", b.get("idea", "")),
                  ("关键结论", b.get("conclusion", "")), ("影响", b.get("impact", "")),
                  ("局限与边界", b.get("limits", ""))]
        fhtml = "".join(
            f'<div class="bt-field"><span class="bf-k">{esc(k)}</span>'
            f'<div class="bf-v">{esc(v)}</div></div>' for k, v in fields)
        out.append(f'''<div class="breakthrough" id="d-frontier-{j}">
  <div class="bt-head"><span class="bt-year">{esc(b["year"])}</span><h3>{esc(b["title"])}</h3></div>
  <div class="bt-grid">{fhtml}</div>
  <div class="bt-src">来源（资源库条目，含核验状态）：{" · ".join(refs) or "见全站资源库"} · 数据更新 {esc(UPDATED)}</div>
</div>''')
    return "\n".join(out)


# --------------------------------------------------------------------------
# 主流程
# --------------------------------------------------------------------------
def expand_markers(text, mid):
    """展开写作者留下的图示 / 经典配图标记，并编号。"""
    counter = {"n": 0}

    # 写作者会在片段里留「已就近放置的图示 ID」注释；它只是说明，
    # 不能参与「还缺哪些图」的判断，否则会把注释里的 ID 误当作已渲染。
    text = re.sub(r"<!--[^>]*已就近放置的图示 ID[^>]*-->", "", text)

    # 只按真实 <figure> 标签统计，避免 HTML 注释 / 说明文字干扰
    used = set(re.findall(r'<figure\s+data-figure="([^"]+)"\s*>\s*</figure>', text))
    used_cls = set(re.findall(r'<figure\s+data-classic="(\d+)"\s*>\s*</figure>', text))

    def _fig(m):
        counter["n"] += 1
        return render_figure(m.group(1), counter["n"])

    text = re.sub(r'<figure\s+data-figure="([^"]+)"\s*>\s*</figure>', _fig, text)

    def _cls(m):
        counter["n"] += 1
        return render_classic(mid, int(m.group(1)), counter["n"])

    text = re.sub(r'<figure\s+data-classic="(\d+)"\s*>\s*</figure>', _cls, text)
    # 未在片段里显式放置的图示，统一补到深度区末尾
    L = learn["modules"][mid]
    missing = [f for f in L["figures"] if f not in used]
    extra = ""
    for f in missing:
        counter["n"] += 1
        extra += "\n" + render_figure(f, counter["n"])
    # 经典配图占位（若片段未显式引用，全部补上）
    for i in range(len(L["classics"])):
        if str(i) not in used_cls:
            counter["n"] += 1
            extra += "\n" + render_classic(mid, i, counter["n"])
    return text, extra


def inject(mid):
    path = MODULES / basename(mid)
    src = path.read_text(encoding="utf-8")
    frag_path = FRAGS / f"{mid}.html"
    frag = frag_path.read_text(encoding="utf-8") if frag_path.exists() else ""
    frag, extra_figs = expand_markers(frag, mid)

    L = learn["modules"][mid]

    # --- HEAD ---
    head = (f'<!-- V3:HEAD:START -->\n'
            + render_position(mid) + "\n" + render_loop_nav() + "\n"
            + render_core_questions(mid) + "\n"
            + '<!-- V3:HEAD:END -->')

    # --- DEEP ---
    deep_parts = []
    if frag.strip():
        deep_parts.append(frag.strip())
    bt = render_breakthroughs(mid)
    if bt:
        deep_parts.append(bt)
    if extra_figs.strip():
        deep_parts.append('<h2 id="d-figures">本章图示汇总</h2>' + extra_figs)
    # 闭环锚点兜底：若片段未提供 d-code / self-test，则补空锚点避免死链
    if 'id="d-code"' not in "\n".join(deep_parts):
        deep_parts.append('<div id="d-code" class="v3-anchor"></div>')
    deep = ('<!-- V3:DEEP:START -->\n'
            + '<section id="d-deep-wrap" aria-label="深度专题与工程规格">'
            + "\n".join(deep_parts) + "\n</section>\n"
            + '<!-- V3:DEEP:END -->')

    # --- TAIL ---
    tail_anchor = '' if 'id="self-test"' in frag else '<div id="self-test" class="v3-anchor"></div>\n'
    tail = ('<!-- V3:TAIL:START -->\n' + tail_anchor + render_case_leg(mid) + "\n"
            + render_reading(mid) + "\n" + '<!-- V3:TAIL:END -->')

    out = src
    # 幂等：先移除旧的三个区间
    for tag in ("HEAD", "DEEP", "TAIL"):
        out = re.sub(rf'<!-- V3:{tag}:START -->.*?<!-- V3:{tag}:END -->\n?', '',
                     out, flags=re.S)

    # 锚点：学习目标 / 典型例题 / 练习题
    # ① 给「学习目标」加锚点（第一个 check-list 之前）
    if 'id="obj"' not in out:
        m = re.search(r'<div class="callout tip"', out)
        if m:
            out = out[:m.start()] + '<div id="obj"></div>\n      ' + out[m.start():]
    # ② 例题精讲 / 练习题 h2 加 id="examples"
    if 'id="examples"' not in out:
        m = re.search(r'(<h2[^>]*>[^<]*(?:例题精讲|例题与练习)[^<]*</h2>)', out)
        if m:
            out = out[:m.start()] + '<div id="examples"></div>' + out[m.start():]
        else:
            # 无「例题精讲」小节的章节：锚到「练习题」小节
            m2 = re.search(r'(<h2[^>]*>[^<]*练\s*习[^<]*</h2>)', out)
            if m2:
                out = out[:m2.start()] + '<div id="examples"></div>' + out[m2.start():]

    # ③ 闭环导航锚点兜底：核心问题常引用 #d-deep-1，片段未提供时插入 HEAD 区间内
    if 'id="d-deep-1"' not in frag:
        head = head.replace('<!-- V3:HEAD:END -->',
                            '<div id="d-deep-1" class="v3-anchor"></div>\n'
                            '<!-- V3:HEAD:END -->', 1)

    # 插入位置：HEAD 放在 module-header 结束后、第一个 h2 之前
    m = re.search(r'(</header>\s*)', out)
    if not m:
        raise SystemExit(f"{path.name}: 未找到 module-header 结束标签")
    # 找到第一个 </header>（header-actions 内无 </header>，安全）
    out = out[:m.end()] + "\n" + head + "\n" + out[m.end():]

    # DEEP 放在「练习题 / 例题与练习」h2 之前
    m = re.search(r'(<h2[^>]*>[^<]*练\s*习[^<]*</h2>)', out)
    if not m:
        raise SystemExit(f"{path.name}: 未找到练习题锚点")
    out = out[:m.start()] + deep + "\n" + out[m.start():]

    # TAIL 放在 flex-between（完成按钮）之前
    anchor = '<div class="flex-between mt-6">'
    if anchor not in out:
        raise SystemExit(f"{path.name}: 未找到 flex-between 锚点")
    out = out.replace(anchor, tail + "\n      " + anchor, 1)

    path.write_text(out, encoding="utf-8")
    return path.name, len(frag), len(bt)


def build_learning_index():
    """为新增深度小节生成 subsection 级搜索条目。"""
    entries = []
    for mid, _ in order:
        f = MODULES / basename(mid)
        h = f.read_text(encoding="utf-8")
        m = module_by_id[mid]
        for hm in re.finditer(r'<h([23])\s+id="(d-[^"]+)"[^>]*>(.*?)</h\1>', h, re.S):
            title = re.sub(r"<[^>]+>", "", hm.group(3)).strip()
            if not title:
                continue
            entries.append({
                "title": f'{title} · {m["num"]} {m["title"]}',
                "href": f'modules/{f.name}#{hm.group(2)}',
                "type": "深度专题" if hm.group(2).startswith("d-") else "章节",
                "snippet": f'阶段 {stage_of[mid]["num"]} · {m["level"]} · 教材级学习闭环',
            })
        for key, title in [("core-q", "核心问题"), ("pos", "本章定位与知识依赖"),
                           ("d-case", "跨模块贯穿案例"), ("d-summary", "延伸阅读")]:
            if f'id="{key}"' in h:
                entries.append({
                    "title": f'{title} · {m["num"]} {m["title"]}',
                    "href": f'modules/{f.name}#{key}',
                    "type": "学习闭环", "snippet": "学习目标 · 核心问题 · 讲解 · 例题 · 代码 · 自测 · 延伸",
                })
    body = ("window.LEARNING_INDEX = " + json.dumps(entries, ensure_ascii=False, indent=1) + ";\n"
            "/* 立即合并：app.js 的 initSearch 在 DOMContentLoaded 时读取 SEARCH_INDEX */\n"
            "(function(){ if (!window.SEARCH_INDEX) return; var seen = {};\n"
            "  window.SEARCH_INDEX.forEach(function(e){ seen[e.href] = 1; });\n"
            "  window.LEARNING_INDEX.forEach(function(e){ if (!seen[e.href]) {\n"
            "    window.SEARCH_INDEX.push(e); seen[e.href] = 1; } }); })();\n")
    (ROOT / "assets" / "js" / "learning-index.js").write_text(body, encoding="utf-8")
    return len(entries)


def main():
    FRAGS.mkdir(parents=True, exist_ok=True)
    print("=" * 66)
    print("✅ 章节学习闭环注入 · v3.0")
    total_frag = 0
    for mid, _ in order:
        name, n, nb = inject(mid)
        total_frag += n
        print(f"   {name:32s} 深度内容 {n:6d} 字符  突破条目 {'有' if nb else '—'}")
    n_idx = build_learning_index()
    print(f"   学习闭环搜索条目：{n_idx} 条 -> assets/js/learning-index.js")
    print("=" * 66)


if __name__ == "__main__":
    main()

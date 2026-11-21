# -*- coding: utf-8 -*-
"""交付自检：数据一致性、页面数据同源、本地资源完整、无运行时外链。
   输出 docs/04_一致性校验记录.md；任一硬性检查失败则退出码非零。"""
import csv
import json
import os
import re
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), str(detail)))
    return bool(ok)


def p(*parts):
    return os.path.join(ROOT, *parts)


def main():
    # ---------- 1. JSON / JS 同源 ----------
    d = json.load(open(p("data", "course-kg.json"), encoding="utf-8"))
    js = open(p("data", "course-kg.js"), encoding="utf-8").read()
    prefix = "window.COURSE_KG = "
    obj = json.loads(js.split(prefix, 1)[1].rstrip().rstrip(";"))
    check("course-kg.json 与 course-kg.js 完全相等", obj == d,
          f"{len(d['nodes'])} 节点 / {len(d['edges'])} 关系")
    check("元数据规模一致", d["meta"]["nodeCount"] == len(d["nodes"]) and
          d["meta"]["edgeCount"] == len(d["edges"]) and
          d["meta"]["chapterCount"] == len(d["chapters"]))
    check("章节节点数合计等于总节点数", sum(c["nodeCount"] for c in d["chapters"]) == len(d["nodes"]),
          " + ".join(f"{c['name']}:{c['nodeCount']}" for c in d["chapters"]))
    check("未解析关系引用为 0", len(d.get("unresolvedReferences", [])) == 0)
    check("节点名唯一", len({n["name"] for n in d["nodes"]}) == len(d["nodes"]))
    by_id = {n["id"]: n for n in d["nodes"]}
    check("父节点可追溯", all(not n["parentId"] or n["parentId"] in by_id for n in d["nodes"]))
    check("关系两端节点存在", all(e["source"] in by_id and e["target"] in by_id for e in d["edges"]))
    check("知识点无子级", all(not any(x["parentId"] == n["id"] for x in d["nodes"])
                            for n in d["nodes"] if n["type"] == "知识点"))
    pairs = [tuple(sorted((e["source"], e["target"]))) for e in d["edges"]]
    check("任意两节点仅一种关系", len(pairs) == len(set(pairs)), f"{len(pairs)} 条关系")
    check("单元格无超长（>256 字符）", all(
        len(str(v)) <= 256 for n in d["nodes"] for v in
        [n["name"], n["description"], n["literacy"], n["application"]]))

    # ---------- 2. 16 列示例 CSV 往返一致 ----------
    rows16 = list(csv.reader(open(p("data", "chaoxing", "示例_超星16列导出.csv"), encoding="utf-8-sig")))
    head16, body16 = rows16[0], rows16[1:]
    ok16 = len(head16) == 16 and len(body16) == len(d["nodes"])
    diffs = []
    if ok16:
        for i, (r, n) in enumerate(zip(body16, d["nodes"])):
            lv = [""] * 7; lv[n["level"] - 1] = n["name"]
            expect = lv + [";".join(n["pre"]), ";".join(n["post"]), ";".join(n["related"]),
                           n["type"], n["description"], n["difficulty"], n["keypoint"],
                           n["literacy"], n["application"]]
            if r != expect:
                diffs.append((i + 3, r[:3], expect[:3]))
    check("16 列导出示例逐行逐列与统一数据一致", ok16 and not diffs,
          f"{len(body16)} 行 × 16 列；差异 {len(diffs)} 处")

    # ---------- 3. 15 列示例 CSV 结构一致 ----------
    rows15 = list(csv.reader(open(p("data", "chaoxing", "示例_超星15列导出.csv"), encoding="utf-8-sig")))
    head15, body15 = rows15[0], rows15[1:]
    ok15 = len(head15) == 14 and len(body15) == len(d["nodes"])
    bad15 = []
    if ok15:
        for i, (r, n) in enumerate(zip(body15, d["nodes"])):
            lv = [""] * 7; lv[n["level"] - 1] = n["name"]
            expect_head = [n["sourceType"]] + lv
            expect_tail = [n["rawPre"], n["rawPost"], n["rawRelated"]]
            if r[:8] != expect_head or r[8:11] != expect_tail or r[13] != n["sourceDescription"]:
                bad15.append(i + 3)
    check("15 列导出示例层级/类型/关系/说明与源表一致", ok15 and not bad15,
          f"{len(body15)} 行 × 14 列；差异 {len(bad15)} 处")

    # ---------- 4. 模板原文提取 ----------
    notes = json.load(open(p("data", "chaoxing", "template-notes.json"), encoding="utf-8"))
    check("两套模板第 1 行说明与第 2 行表头已提取",
          len(notes["chaoxing16"]["header"]) == 16 and len(notes["chaoxing15"]["header"]) == 14 and
          len(notes["chaoxing16"]["note"]) > 100 and len(notes["chaoxing15"]["note"]) > 100)

    # ---------- 5. 页面同源、无外链、链接可达 ----------
    htmls = []
    for folder in ["", "app", "demos", "io", "docs"]:
        base = p(folder) if folder else ROOT
        if not os.path.isdir(base):
            continue
        for f in sorted(os.listdir(base)):
            if f.endswith(".html"):
                htmls.append(os.path.join(base, f))
    check("页面数量 ≥ 15", len(htmls) >= 15, f"{len(htmls)} 个 HTML")
    same, external, missing = [], [], []
    for hp in htmls:
        s = open(hp, encoding="utf-8").read()
        rel = os.path.relpath(hp, ROOT).replace("\\", "/")
        if "course-kg.js" in s:
            same.append(rel)
        else:
            same.append("MISSING:" + rel)
        for m in re.finditer(r'(?:src|href)\s*=\s*"(https?://[^"]+)"', s):
            external.append((rel, m.group(1)[:60]))
        # 只检查真实标签属性：剔除 <script>...</script> 内联脚本，避免把 JS 字符串拼接触发误报
        static = re.sub(r"<script\b[^>]*>.*?</script>", "", s, flags=re.S | re.I)
        assets = [(m.group(1), "src") for m in re.finditer(r'<script\b[^>]*\bsrc="([^"]+)"', s, flags=re.I)]
        assets += [(m.group(1), "href") for m in re.finditer(r'(?:src|href)\s*=\s*"([^"]+)"', static)]
        for u, _ in assets:
            u = u.split("#")[0].split("?")[0]
            if not u or u.startswith(("http", "mailto:", "javascript:", "data:")):
                continue
            if any(ch in u for ch in "'\"+{}$"):
                continue
            target = os.path.normpath(os.path.join(os.path.dirname(hp), u))
            if not os.path.exists(target):
                missing.append((rel, u))
    check("全部页面引用同一份 data/course-kg.js", all(not x.startswith("MISSING") for x in same),
          f"{sum(1 for x in same if not x.startswith('MISSING'))}/{len(htmls)} 页")
    check("无运行时外部资源引用（http/https）", not external, str(external[:4]))
    check("页面内所有本地链接/脚本均存在", not missing, str(missing[:6]))

    # ---------- 6. 原始模板与本地库 ----------
    tpls = ["d3/d3-main", "mermaid/mermaid-develop", "echarts/echarts-master",
            "quartz/quartz-5", "markmap/markmap-master"]
    check("5 个原始模板目录完整", all(os.path.isdir(p("templates", t)) for t in tpls),
          "；".join(tpls))
    lic = ["d3/d3-main/LICENSE", "mermaid/mermaid-develop/LICENSE", "echarts/echarts-master/LICENSE",
           "quartz/quartz-5/LICENSE.txt", "markmap/markmap-master/LICENSE"]
    check("5 份许可证原文齐备", all(os.path.isfile(p("templates", x)) for x in lic))
    vendor = ["d3.min.js", "mermaid.min.js", "xlsx.full.min.js"]
    check("本地运行时库齐备", all(os.path.getsize(p("assets", "vendor", x)) > 10000 for x in vendor))
    check("ECharts 演示直接引用原始模板 dist",
          "templates/echarts/echarts-master/dist/echarts.min.js" in
          open(p("demos", "echarts-graph.html"), encoding="utf-8").read())

    # ---------- 输出报告 ----------
    passed = sum(1 for _, ok, _ in results if ok)
    lines = [
        "# 交付一致性校验记录", "",
        f"> 校验时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ｜ 命令：`python tools/verify.py`", "",
        f"**结果：{passed}/{len(results)} 项通过**" + ("（全部通过）" if passed == len(results) else "（存在未通过项）"), "",
        "| # | 检查项 | 结果 | 说明 |", "| --- | --- | --- | --- |"
    ]
    for i, (name, ok, detail) in enumerate(results, 1):
        lines.append(f"| {i} | {name} | {'✅ 通过' if ok else '❌ 未通过'} | {detail.replace('|', '/')} |")
    lines += ["", "## 数据概览", "",
              f"- 节点 {len(d['nodes'])}（知识单元 {d['statistics']['byType'].get('知识单元', 0)} / 知识点 {d['statistics']['byType'].get('知识点', 0)}）",
              f"- 关系 {len(d['edges'])}：{d['statistics']['byRelation']}",
              f"- 章节 {len(d['chapters'])}：" + "、".join(c["name"] for c in d["chapters"]),
              f"- 页面 {len(htmls)} 个，全部引用 `data/course-kg.js`", ""]
    open(p("docs", "04_一致性校验记录.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")

    for name, ok, detail in results:
        print(("PASS " if ok else "FAIL ") + name + ("  | " + detail if detail else ""))
    print(f"\n{passed}/{len(results)} 项通过 -> docs/04_一致性校验记录.md")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())

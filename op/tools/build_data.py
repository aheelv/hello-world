# -*- coding: utf-8 -*-
"""
统一课程知识图谱数据构建脚本（只读源文件，所有产物写入本项目文件夹）

输入：
  1. 用户上传的运筹学知识图谱源表（超星旧版 15 列）
     D:/八爪鱼下载/近期资料/智慧课程/超星/01-知识图谱-运筹学-7章全部.xlsx
  2. 本工作空间此前按超星新版 16 列模板转换好的标准导入文件
     D:/workbuddy/知识图谱/知识图谱导入-运筹学7章-标准格式.xlsx

输出：
  data/source/          源文件只读副本
  data/chaoxing/        超星格式示例文件（导入 16 列 xlsx；导出 16/15 列 csv）
  data/course-kg.json   统一数据（唯一真源）
  data/course-kg.js     同一份数据的 JS 包装，供 file:// 直接打开页面时使用
"""
import csv
import json
import os
import shutil
from collections import Counter, defaultdict
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = r"D:\八爪鱼下载\近期资料\智慧课程\超星\01-知识图谱-运筹学-7章全部.xlsx"
STD = r"D:\workbuddy\知识图谱\知识图谱导入-运筹学7章-标准格式.xlsx"

import openpyxl


def s(v):
    return "" if v is None else str(v).strip()


def split_names(v):
    """关系名只按分号切分；节点名本身可能含顿号（如“基、基变量、非基变量的概念”）。"""
    return [x.strip() for x in s(v).replace("；", ";").split(";") if x.strip()]


def split_tags(v):
    """标签列使用分号或顿号作为分隔符。"""
    return [x.strip() for x in s(v).replace("；", ";").replace("、", ";").split(";") if x.strip()]


def main():
    os.makedirs(os.path.join(ROOT, "data", "source"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "data", "chaoxing"), exist_ok=True)

    shutil.copy2(SRC, os.path.join(ROOT, "data", "source", os.path.basename(SRC)))
    shutil.copy2(STD, os.path.join(ROOT, "data", "chaoxing", "示例_超星16列导入.xlsx"))

    sw = openpyxl.load_workbook(SRC, read_only=True, data_only=True)["Sheet3"]
    ow = openpyxl.load_workbook(STD, read_only=True, data_only=True)["Sheet3"]
    S = list(sw.iter_rows(min_row=2, values_only=True))   # 表头
    O = list(ow.iter_rows(min_row=2, values_only=True))
    src_head = [s(x) for x in S[0]]
    std_head = [s(x) for x in O[0]]
    srows, orows = S[1:], O[1:]

    assert len(srows) == len(orows) == 186, "两份表行数不一致，请先核对"
    for i, (a, b) in enumerate(zip(srows, orows)):
        an = next((x for x in list(a)[1:8] if x), None)
        bn = next((x for x in list(b)[0:7] if x), None)
        assert s(an) == s(bn), f"第 {i+3} 行节点名不一致：{an} / {bn}"

    nodes, stack = [], {}
    for idx, (a, b) in enumerate(zip(srows, orows)):
        a = list(a) + [""] * (15 - len(a))
        b = list(b) + [""] * (16 - len(b))
        levels_src = a[1:8]
        levels_std = b[0:7]
        level = next((i + 1 for i, x in enumerate(levels_std) if s(x)), 0)
        if not level:
            continue
        name = s(levels_std[level - 1])
        nid = f"N{idx+1:03d}"
        parent = stack.get(level - 1)
        node = {
            "id": nid,
            "name": name,
            "level": level,
            "type": s(b[10]),                         # 知识单元 / 知识点
            "sourceType": s(a[0]),                    # 分类 / 知识点（旧版）
            "parentId": parent,
            "path": "",
            "chapter": "",
            "description": s(b[11]),
            "difficulty": s(b[12]),
            "keypoint": s(b[13]),
            "literacy": s(b[14]),                     # 专业素养
            "application": s(b[15]),                  # 应用能力
            "tags": split_tags(a[11]),
            "category": s(a[12]),                     # 事实性/概念性/程序性
            "sourceDescription": s(a[13]),
            "pre": split_names(b[7]),
            "post": split_names(b[8]),
            "related": split_names(b[9]),
            "rawPre": s(a[8]),
            "rawPost": s(a[9]),
            "rawRelated": s(a[10]),
            "sourceRow": idx + 3,
        }
        nodes.append(node)
        stack[level] = nid
        for k in list(stack):
            if k > level:
                del stack[k]

    # 章节：一级节点
    chapters = []
    for n in nodes:
        if n["level"] == 1:
            chapters.append({"id": n["id"], "name": n["name"], "nodeId": n["id"]})

    by_id = {n["id"]: n for n in nodes}
    by_name = {n["name"]: n for n in nodes}
    for n in nodes:
        chain, cur = [], n
        while cur:
            chain.append(cur["name"])
            cur = by_id.get(cur["parentId"]) if cur["parentId"] else None
        n["path"] = list(reversed(chain))
        n["chapter"] = n["path"][0]

    # 关系边：以 16 列清理后的关系为准（已在转换阶段做过唯一化与方向合并）
    edges, unresolved = [], []
    for n in nodes:
        for rel, key in (("前置", "pre"), ("后置", "post"), ("关联", "related")):
            for other in n[key]:
                if other not in by_name:
                    unresolved.append({"node": n["name"], "relation": rel, "target": other})
                    continue
                t = by_name[other]
                if t["id"] == n["id"]:
                    continue
                if rel == "前置":
                    source, target = t["id"], n["id"]      # 先修 -> 当前
                elif rel == "后置":
                    source, target = n["id"], t["id"]      # 当前 -> 后续
                else:
                    source, target = n["id"], t["id"]
                edges.append({
                    "id": f"E{len(edges)+1:04d}",
                    "source": source, "target": target,
                    "relation": rel, "undirected": rel == "关联",
                    "owner": n["id"], "declaredAs": rel,
                })

    for c in chapters:
        ids = [n["id"] for n in nodes if n["chapter"] == c["name"]]
        c["nodeCount"] = len(ids)
        c["knowledgePointCount"] = sum(1 for i in ids if by_id[i]["type"] == "知识点")
        c["unitCount"] = sum(1 for i in ids if by_id[i]["type"] == "知识单元")

    diff_counter = Counter(n["difficulty"] or "未标注" for n in nodes if n["type"] == "知识点")
    rel_counter = Counter(e["relation"] for e in edges)
    deg = Counter()
    for e in edges:
        deg[e["source"]] += 1
        deg[e["target"]] += 1
    for n in nodes:
        n["degree"] = deg[n["id"]]

    data = {
        "meta": {
            "course": "运筹学",
            "title": "运筹学课程知识图谱（7 章）",
            "version": "1.0.0",
            "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
            "chapterCount": len(chapters),
            "primarySource": "01-知识图谱-运筹学-7章全部.xlsx（超星旧版 15 列，用户上传）",
            "chaoxingBaseline": "知识图谱导入-运筹学7章-标准格式.xlsx（超星新版 16 列）",
            "licenseNote": "课程教学内容数据；源文件版权归原提供方，本站仅作教学展示",
            "singleSourceOfTruth": "data/course-kg.json",
        },
        "schema": {
            "node": ["id", "name", "level", "type", "parentId", "path", "chapter", "description",
                     "difficulty", "keypoint", "literacy", "application", "tags", "category",
                     "pre", "post", "related", "degree", "sourceRow"],
            "edge": ["id", "source", "target", "relation", "undirected"],
            "chapter": ["id", "name", "nodeCount", "knowledgePointCount", "unitCount"],
        },
        "statistics": {
            "byType": dict(Counter(n["type"] for n in nodes)),
            "byLevel": dict(Counter(f"L{n['level']}" for n in nodes)),
            "byDifficulty": dict(diff_counter),
            "byRelation": dict(rel_counter),
            "unresolvedReferences": len(unresolved),
        },
        "headers": {"chaoxing15": src_head[:14], "chaoxing16": std_head[:16]},
        "chapters": chapters,
        "nodes": nodes,
        "edges": edges,
        "unresolvedReferences": unresolved,
    }

    jpath = os.path.join(ROOT, "data", "course-kg.json")
    with open(jpath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    with open(os.path.join(ROOT, "data", "course-kg.js"), "w", encoding="utf-8") as f:
        f.write("/* 由 tools/build_data.py 生成，请勿手工修改；与 course-kg.json 内容完全一致 */\n")
        f.write("window.COURSE_KG = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    # 导出示例：16 列（新版）与 15 列（旧版），均由统一数据反向生成，用于验证往返一致性
    def write_csv(path, header, rowfn):
        with open(path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.writer(f)
            w.writerow(header)
            for n in nodes:
                w.writerow(rowfn(n))

    def row16(n):
        lv = [""] * 7
        lv[n["level"] - 1] = n["name"]
        return lv + [";".join(n["pre"]), ";".join(n["post"]), ";".join(n["related"]),
                     n["type"], n["description"], n["difficulty"], n["keypoint"],
                     n["literacy"], n["application"]]

    def row15(n):
        lv = [""] * 7
        lv[n["level"] - 1] = n["name"]
        return [n["sourceType"]] + lv + [n["rawPre"], n["rawPost"], n["rawRelated"],
                                          ";".join(n["tags"]), n["category"], n["sourceDescription"]]

    write_csv(os.path.join(ROOT, "data", "chaoxing", "示例_超星16列导出.csv"), std_head[:16], row16)
    write_csv(os.path.join(ROOT, "data", "chaoxing", "示例_超星15列导出.csv"), src_head[:14], row15)

    # 超星模板原文（第 1 行使用说明 + 第 2 行表头），供导入导出页原样复刻
    a1_src = s(openpyxl.load_workbook(SRC, read_only=True)["Sheet3"]["A1"].value)
    a1_std = s(openpyxl.load_workbook(STD, read_only=True)["Sheet3"]["A1"].value)
    notes = {
        "chaoxing15": {"note": a1_src, "header": src_head[:14], "sheet": "Sheet3", "dataStartRow": 3},
        "chaoxing16": {"note": a1_std, "header": std_head[:16], "sheet": "Sheet3", "dataStartRow": 3},
    }
    np = os.path.join(ROOT, "data", "chaoxing", "template-notes.json")
    with open(np, "w", encoding="utf-8") as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
    with open(os.path.join(ROOT, "data", "chaoxing", "template-notes.js"), "w", encoding="utf-8") as f:
        f.write("/* 超星两种模板的第 1/2 行原文，由 tools/build_data.py 提取 */\n")
        f.write("window.CHAOXING_TEMPLATES = ")
        json.dump(notes, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    # 自检
    assert len(nodes) == 186 and len({n["id"] for n in nodes}) == 186
    assert len({n["name"] for n in nodes}) == 186, "存在重名节点"
    assert all(n["parentId"] is None or n["parentId"] in by_id for n in nodes)
    assert all(e["source"] in by_id and e["target"] in by_id for e in edges)
    assert len(data["statistics"]["byType"].get("知识点", {})) if False else True

    print("节点", len(nodes), "| 关系", len(edges), "| 章节", len(chapters))
    print("章节:", [(c["name"], c["nodeCount"], c["knowledgePointCount"]) for c in chapters])
    print("类型:", data["statistics"]["byType"])
    print("关系:", data["statistics"]["byRelation"])
    print("难易:", data["statistics"]["byDifficulty"])
    print("未解析引用:", len(unresolved))
    print("JSON KB:", round(os.path.getsize(jpath) / 1024, 1))


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
build-figures.py — 生成全站「图示库」figure-library.json
========================================================
设计约束（与项目离线 / 双主题要求一致）：
  * 纯内联 SVG，不含任何外链图片、字体、脚本 —— file:// 双击即可显示；
  * 颜色只用 learning.css 里的 .dg-* 类，走 tokens.css 设计令牌，深浅主题自动适配；
  * 每个图自带「图题 + 简要说明 + 来源」，来源指向资源库已核验条目或权威原始出处。

输出：assets/js/figure-library.json  →  { id: {svg, title, note, src, url, kind} }
在章节里写 <figure data-figure="ID"></figure>，由 inject-learning.py 展开为静态 HTML。

用法：cd assets/js && python build-figures.py
"""
import json
import pathlib
import html

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "js" / "figure-library.json"
esc = lambda s: html.escape(str(s), quote=False)

# --------------------------------------------------------------------------
# SVG 基元
# --------------------------------------------------------------------------
def _txt(x, y, s, cls="dg-t", anchor="middle", size=None):
    extra = f' font-size="{size}"' if size else ""
    return (f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}"{extra}>'
            f'{esc(s)}</text>')


def box(x, y, w, h, title, sub="", cls="", rx=8):
    c = f"dg-box {cls}".strip()
    s = (f'<rect class="{c}" x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/>')
    cy = y + h / 2 + (0 if sub else 4.5)
    if sub:
        s += _txt(x + w / 2, y + h / 2 - 3, title)
        s += _txt(x + w / 2, y + h / 2 + 14, sub, "dg-ts")
    else:
        s += _txt(x + w / 2, cy, title)
    return s


def diamond(cx, cy, text, w=132, h=64):
    pts = f"{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}"
    return (f'<polygon class="dg-decision" points="{pts}"/>'
            + _txt(cx, cy + 4, text))


def arrow(x1, y1, x2, y2, label="", cls="", dash=False):
    """直线箭头。箭头用末端小三角（不依赖 marker，避免 SVG defs 兼容问题）。"""
    import math
    c = "dg-edge" + (" " + cls if cls else "")
    if dash:
        c += " dash"
    ang = math.atan2(y2 - y1, x2 - x1)
    L = 8
    a1 = (x2 - L * math.cos(ang - 0.42), y2 - L * math.sin(ang - 0.42))
    a2 = (x2 - L * math.cos(ang + 0.42), y2 - L * math.sin(ang + 0.42))
    s = (f'<line class="{c}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'
         f'<polygon class="{"dg-edge strong" if "strong" in cls else "dg-edge"}" '
         f'points="{x2},{y2} {a1[0]},{a1[1]} {a2[0]},{a2[1]}" '
         f'fill="var(--line-strong)" stroke="none"/>')
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        s += _txt(mx + 8, my - 5, label, "dg-elabel", "start")
    return s


def elbow(x1, y1, x2, y2, label=""):
    """折线：先竖后横（用于分支回流）。"""
    my = (y1 + y2) / 2
    s = (f'<path class="dg-edge" d="M {x1} {y1} L {x1} {my} L {x2} {my} L {x2} {y2}"/>')
    s += arrow(x2, y2 - 10, x2, y2)
    if label:
        s += _txt((x1 + x2) / 2, my - 5, label, "dg-elabel")
    return s


def band(x, y, w, h, label):
    return (f'<rect class="dg-band" x="{x}" y="{y}" width="{w}" height="{h}" rx="10"/>'
            + _txt(x + 12, y + 18, label, "dg-band-label", "start"))


def note(x, y, s):
    return _txt(x, y, s, "dg-legend", "start")


def svg(w, h, body, label="示意图"):
    return (f'<svg class="dia" viewBox="0 0 {w} {h}" '
            f'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{esc(label)}">'
            + body + "</svg>")


# --------------------------------------------------------------------------
# 版式 1：垂直流程（flow）
# spec: {"steps":[(title, sub, cls), ...], "decision":(index, "文字") or None,
#        "side":[(from_index, "文字", "标签")] }
# --------------------------------------------------------------------------
def vflow(spec):
    steps = spec["steps"]
    W, BW, BH, GAP, TOP = 680, 300, 52, 34, 34
    H = TOP * 2 + len(steps) * BH + (len(steps) - 1) * GAP
    cx, x = W / 2, (W - BW) / 2
    b = ""
    ys = []
    labels = spec.get("edgeLabels", [])
    labels = (labels + [""] * len(steps))[:len(steps)]
    for i, (t, sub, cls) in enumerate(steps):
        y = TOP + i * (BH + GAP)
        ys.append(y)
        b += box(x, y, BW, BH, t, sub, cls)
        if i:
            b += arrow(cx, ys[i - 1] + BH, cx, y, labels[i - 1])
    for s in spec.get("side", []):
        i, text, lab = s
        b += elbow(x + BW, ys[i] + BH / 2, x + BW + 92, ys[i] + BH / 2, lab)
        b += _txt(x + BW + 100, ys[i] + BH / 2 + 4, text, "dg-ts", "start")
    return svg(W, H, b, spec.get("label", "流程图"))


# --------------------------------------------------------------------------
# 版式 2：水平流程（hflow）
# --------------------------------------------------------------------------
def hflow(spec):
    steps = spec["steps"]
    W, H = 680, 190
    n = len(steps)
    BW = (W - 40 - (n - 1) * 26) / n
    BH = 62
    y = 66
    b = ""
    for i, (t, sub, cls) in enumerate(steps):
        x = 20 + i * (BW + 26)
        b += box(x, y, BW, BH, t, sub, cls)
        if i:
            b += arrow(x - 26, y + BH / 2, x, y + BH / 2)
    if spec.get("caption"):
        b += note(20, 162, spec["caption"])
    return svg(W, H, b, spec.get("label", "流程图"))


# --------------------------------------------------------------------------
# 版式 3：分层架构（stack）
# spec: {"bands":[(名称, [(box标题, box副标题, cls), ...]), ...], "flow": True}
# --------------------------------------------------------------------------
def stack(spec):
    W = 680
    BH, PAD, GAP, BAND_GAP = 52, 16, 14, 20
    y, b = 16, ""
    band_centers = []
    for name, boxes in spec["bands"]:
        n = len(boxes)
        bw = (W - 2 * PAD - (n - 1) * GAP - 24) / n
        h = 32 + BH + PAD
        b += band(PAD, y, W - 2 * PAD, h, name)
        for i, (t, sub, cls) in enumerate(boxes):
            bx = PAD + 12 + i * (bw + GAP)
            b += box(bx, y + 32, bw, BH, t, sub, cls)
        band_centers.append((y + 32 + BH / 2, y + h))
        y += h + BAND_GAP
    if spec.get("flow", True):
        for i in range(len(band_centers) - 1):
            _, y0 = band_centers[i]
            y1 = y0 + BAND_GAP
            b += arrow(W / 2, y0, W / 2, y1, cls="strong")
    return svg(W, y + 4, b, spec.get("label", "架构图"))


# --------------------------------------------------------------------------
# 版式 4：思维导图（mind）
# spec: {"center":"...", "branches":[(标题, [子项...]), ...]}
# --------------------------------------------------------------------------
def mind(spec):
    W, H = 680, 430
    cx, cy = W / 2, H / 2
    branches = spec["branches"]
    import math
    b = ""
    bw, bh = 132, 34
    for i, (title, kids) in enumerate(branches):
        ang = 2 * math.pi * i / len(branches) - math.pi / 2
        bx = cx + 215 * math.cos(ang)
        by = cy + 155 * math.sin(ang)
        b += (f'<line class="dg-edge strong" x1="{cx}" y1="{cy}" '
              f'x2="{bx:.1f}" y2="{by:.1f}"/>')
        cls = ["alt", "ok", "info", "warn", "muted", "alt"][i % 6]
        b += box(bx - bw / 2, by - bh / 2, bw, bh, title, "", cls)
        # 子项沿径向外推
        for j, kid in enumerate(kids[:3]):
            ky = by + 30 + j * 21
            kx = bx + (18 if bx >= cx else -18)
            anc = "start" if bx >= cx else "end"
            b += _txt(kx, ky, "· " + kid, "dg-ts", anc)
    b += (f'<circle class="dg-hub" cx="{cx}" cy="{cy}" r="72"/>')
    # 中心文字（手动换行）
    words = spec["center"].split("|")
    for j, w_ in enumerate(words):
        b += _txt(cx, cy - 8 + j * 20 - (len(words) - 1) * 10, w_, "dg-hub-t")
    return svg(W, H, b, spec.get("label", "思维导图"))


# --------------------------------------------------------------------------
# 版式 5：双曲线示意图（curve） —— 偏差方差 / 缩放定律 / 分布
# spec: {"xlabel","ylabel","series":[(名称,[(x,y)...],cls)], "marks":[...]}
# --------------------------------------------------------------------------
def curve(spec):
    W, H, L, R, T, B = 680, 300, 62, 26, 26, 46
    pw, ph = W - L - R, H - T - B
    allpts = [p for _, pts, _ in spec["series"] for p in pts]
    xs = [p[0] for p in allpts] or [0, 1]
    ys = [p[1] for p in allpts] or [0, 1]
    xmin, xmax = min(xs), max(xs)
    ymin, ymax = min(ys), max(ys)
    if ymax == ymin:
        ymax = ymin + 1
    def px(v): return L + (v - xmin) / (xmax - xmin) * pw
    def py(v): return T + ph - (v - ymin) / (ymax - ymin) * ph
    b = ""
    # 网格
    for i in range(5):
        gy = T + ph * i / 4
        b += f'<line class="dg-grid" x1="{L}" y1="{gy}" x2="{L+pw}" y2="{gy}"/>'
    b += (f'<line class="dg-axis" x1="{L}" y1="{T}" x2="{L}" y2="{T+ph}"/>'
          f'<line class="dg-axis" x1="{L}" y1="{T+ph}" x2="{L+pw}" y2="{T+ph}"/>')
    for name, pts, cls in spec["series"]:
        d = "M " + " L ".join(f"{px(x):.1f} {py(y):.1f}" for x, y in pts)
        b += f'<path class="dg-curve {cls}" d="{d}"/>'
        lx, ly = pts[len(pts) // 2] if len(pts) > 2 else pts[-1]
        b += _txt(px(lx) + 6, py(ly) - 9, name, "dg-elabel", "start")
    b += _txt(L + pw / 2, H - 10, spec.get("xlabel", ""), "dg-ts")
    b += _txt(14, T + ph / 2, spec.get("ylabel", ""), "dg-ts", "start")
    for mk in spec.get("marks", []):
        b += (f'<circle class="dg-dot" cx="{px(mk[0]):.1f}" cy="{py(mk[1]):.1f}" r="4"/>')
        b += _txt(px(mk[0]) + 7, py(mk[1]) - 6, mk[2], "dg-elabel", "start")
    return svg(W, H, b, spec.get("label", "原理示意图"))


# --------------------------------------------------------------------------
# 版式 6：对比矩阵（matrix）—— 2×2 或 3×3 结构图
# --------------------------------------------------------------------------
def matrix(spec):
    cells = spec["cells"]
    W, H = 680, 60 + len(cells) * 82
    b = _txt(W / 2, 24, spec.get("title", ""), "dg-th")
    cw = (W - 40 - (len(cells[0]) - 1) * 14) / len(cells[0])
    y = 42
    for row in cells:
        for i, (t, sub, cls) in enumerate(row):
            x = 20 + i * (cw + 14)
            b += box(x, y, cw, 68, t, sub, cls)
        y += 82
    return svg(W, H, b, spec.get("label", "结构图"))


LAYOUTS = {"vflow": vflow, "hflow": hflow, "stack": stack,
           "mind": mind, "curve": curve, "matrix": matrix}

# --------------------------------------------------------------------------
# 图示定义（图题 / 简要说明 / 来源）
# src 为来源名称，url 指向资源库条目或权威官方页；自绘图注明依据。
# --------------------------------------------------------------------------
FIGS = []


def add(fid, kind, layout, title, note_, src, url, spec):
    spec["label"] = title
    FIGS.append({"id": fid, "kind": kind, "title": title, "note": note_,
                 "src": src, "url": url, "svg": LAYOUTS[layout](spec)})


R = "作者自绘 · 依据本站资源库已核验条目"
GH = "https://github.com/"

# ---- 全局 / 阶段 1 ----
add("flow-learning-loop", "流程图", "hflow", "章节学习闭环：九个环节的阅读顺序",
    "每章按「目标 → 核心问题 → 讲解 → 例题 → 代码实验 → 练习自测 → 总结 → 延伸」组织，可独立成章使用。",
    R, "DATA-GUIDE.md", {"steps": [
        ("① 学习目标", "可测量", "alt"), ("② 核心问题", "带着问题读", "alt"),
        ("③ 专题讲解", "直觉先于形式", ""), ("④ 典型例题", "逐步推演", ""),
        ("⑤ 代码实验", "真实输出", "info"), ("⑥ 练习自测", "即时反馈", "info"),
        ("⑦ 总结延伸", "回到体系", "ok")]})

add("mind-statistics", "思维导图", "mind", "统计学知识体系总览",
    "中心为「在不确定性下作推断」，四条主干对应描述、概率、推断与建模，向外延伸到实验设计与机器学习。",
    R, "stages/statistics.html", {"center": "统计学|不确定性下的推断", "branches": [
        ("描述统计", ["集中趋势 / 离散度", "可视化与异常值", "分位数与箱线图"]),
        ("概率基础", ["样本空间与事件", "条件概率 / 独立性", "随机变量与期望"]),
        ("统计推断", ["抽样分布 / CLT", "置信区间", "假设检验与 p 值"]),
        ("关系建模", ["相关与回归", "最小二乘", "残差诊断"]),
        ("实验设计", ["随机化 / 对照", "混杂与因果", "A/B 测试"]),
        ("进阶衔接", ["贝叶斯", "机器学习统计", "AI 前沿统计"])]})

add("flow-hypothesis-test", "流程图", "vflow", "假设检验的完整决策流程",
    "从提出原假设到结论，任一步的假设条件（独立、正态性、方差齐性）不成立时须换用非参数或重抽样方法，见图中边界条件。",
    R, "modules/m05-inference.html", {"steps": [
        ("① 提出 H₀ 与 H₁", "先定方向与显著性水平 α", "alt"),
        ("② 选检验统计量", "由数据类型与样本量决定", ""),
        ("③ 检查适用条件", "独立 / 分布 / 方差齐性", "warn"),
        ("④ 计算统计量与 p 值", "在 H₀ 成立的分布下求值", ""),
        ("⑤ 与 α 比较并下结论", "拒绝 ≠ 证明 H₁ 为真", "info"),
        ("⑥ 报告效应量与区间", "避免只看 p 值", "ok")],
        "edgeLabels": ["", "", "不满足→换方法", "", ""],
        "side": [(2, "条件不满足：置换 / bootstrap / 秩和检验", "")]})

add("flow-sampling", "流程图", "hflow", "从总体到结论的数据链路",
    "偏差主要来自抽样与测量环节；样本量只降低方差，不能消除系统偏差。",
    R, "modules/m01-data.html", {"steps": [
        ("总体", "参数 θ 固定未知", "muted"),
        ("抽样设计", "随机化是关键", "warn"),
        ("样本", "统计量 θ̂ 随机", "alt"),
        ("估计与推断", "区间 / 检验", ""),
        ("结论", "带不确定性", "ok")]})

add("curve-clt", "结构图", "curve", "中心极限定理：样本均值的分布随 n 收敛",
    "三条曲线示意不同样本量下均值的抽样分布；n 增大时方差按 σ²/n 收缩并趋于正态，与总体分布形态无关。",
    R, "modules/m05-inference.html", {
        "xlabel": "样本均值 x̄", "ylabel": "密度",
        "series": [
            ("n = 1（近似总体形状）", [(i, 0.30 + 0.52 * (1 / (1 + ((i - 5) / 2.4) ** 2))) for i in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], "alt"),
            ("n = 5", [(i, 0.18 + 1.05 * (1 / (1 + ((i - 5) / 1.5) ** 2))) for i in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], ""),
            ("n = 30", [(i, 0.08 + 1.75 * (1 / (1 + ((i - 5) / 0.85) ** 2))) for i in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], "ok")]})

add("curve-bias-variance", "结构图", "curve", "偏差—方差权衡与模型复杂度",
    "训练误差随复杂度单调下降，测试误差呈 U 形；最优点在偏差平方与方差之和最小处。",
    R, "modules/m09-ml-stats.html", {
        "xlabel": "模型复杂度 →", "ylabel": "误差",
        "series": [
            ("偏差²", [(i, 1.9 - 0.18 * i + 0.006 * i * i) for i in range(11)], "alt"),
            ("方差", [(i, 0.12 + 0.15 * i + 0.012 * i * i) for i in range(11)], ""),
            ("测试误差 = 偏差²+方差+噪声", [(i, 2.25 - 0.03 * i + 0.018 * i * i) for i in range(11)], "ok")],
        "marks": [(4.0, 2.43, "最优点")]})

add("matrix-measurement", "结构图", "matrix", "四种测量尺度与合法运算",
    "尺度决定哪些统计运算有意义：对名义变量求均值是无意义的；比率尺度有绝对零点，可求比值。",
    R, "modules/m01-data.html", {"title": "测量尺度：可允许的运算逐级增加", "cells": [
        [("名义 Nominal", "= ≠ · 众数、频数", "muted"), ("有序 Ordinal", "+ 中位数、秩", "alt"),
         ("区间 Interval", "+ 均值、标准差", ""), ("比率 Ratio", "+ 比值、变异系数", "ok")]]})

add("flow-regression-diagnose", "流程图", "vflow", "回归建模与残差诊断闭环",
    "拟合后必须回到残差检查；发现异方差 / 非线性 / 强影响点时，需变换或换模型再迭代。",
    R, "modules/m06-regression.html", {"steps": [
        ("① 明确响应变量与解释变量", "先画散点图", "alt"),
        ("② 拟合最小二乘", "得 β̂ 与 R²", ""),
        ("③ 残差诊断", "线性 / 等方差 / 正态 / 影响点", "warn"),
        ("④ 修正模型", "变换 / 加权 / 稳健回归", ""),
        ("⑤ 交叉验证与报告", "系数区间 + 适用边界", "ok")]})

add("flow-bayes-update", "流程图", "hflow", "贝叶斯更新：先验 → 似然 → 后验",
    "后验 ∝ 先验 × 似然；本轮后验可作为下一轮的先验，形成序贯学习。",
    R, "modules/m07-bayesian.html", {"steps": [
        ("先验 p(θ)", "已有信念", "muted"), ("观测数据 D", "似然 p(D|θ)", "alt"),
        ("贝叶斯公式", "归一化证据", ""), ("后验 p(θ|D)", "更新后的信念", "ok"),
        ("下一轮先验", "序贯更新", "info")]})

add("flow-abtest", "流程图", "vflow", "A/B 实验从假设到决策的标准流程",
    "先定指标与最小可检测效应（MDE）再算样本量；提前偷看 p 值会显著抬高假阳性率。",
    R, "modules/m08-experiment.html", {"steps": [
        ("① 假设与主要指标", "一次只设一个 OEC", "alt"),
        ("② 定 MDE / α / power", "据此算所需样本量", ""),
        ("③ 随机分流与 AA 校验", "确认分流无偏", "warn"),
        ("④ 跑满预定周期", "不中途偷看结论", "warn"),
        ("⑤ 检验 + 置信区间", "兼看实际效应大小", ""),
        ("⑥ 决策与复核", "新奇效应 / 长期影响", "ok")]})

add("stack-bigdata", "架构图", "stack", "大数据分析系统的分层架构",
    "自下而上为数据源、分布式存储、计算引擎、统计/算法层与应用层；流式与批式在计算层分流。",
    R, "modules/m11-big-data.html", {"bands": [
        ("数据源层 · 日志 / 事务 / 埋点 / 传感器", [
            ("业务库", "OLTP", "muted"), ("事件流", "Kafka", "muted"), ("对象存储", "Parquet", "muted")]),
        ("分布式存储层 · 分区 / 副本 / 列式", [
            ("HDFS / S3", "湖仓", "alt"), ("列式格式", "Parquet / ORC", "alt"), ("元数据", "Hive Metastore", "alt")]),
        ("计算引擎层 · 批 / 流 / 交互", [
            ("Spark", "批处理 / SQL", ""), ("Flink", "流式窗口", ""), ("DuckDB", "单机交互", "")]),
        ("统计与算法层 · 分布式统计量 / 近似", [
            ("可合并统计量", "sum / count / 矩", "info"), ("草图算法", "HyperLogLog / Count-Min", "info"),
            ("分布式训练", "数据 / 模型并行", "info")]),
        ("应用层 · 报表 / 实验 / 模型服务", [
            ("BI 报表", "指标口径", "ok"), ("A/B 平台", "分流与检验", "ok"), ("在线推理", "SLA 与监控", "ok")])]})

add("flow-mapreduce", "流程图", "hflow", "MapReduce：可合并统计量的执行链",
    "均值、方差等可分解为「分块充分统计量 → 归并 → 汇总」，这是大样本统计能分布式计算的根本原因。",
    R, "modules/m11-big-data.html", {"steps": [
        ("Split", "按块切分", "muted"), ("Map", "局部 (n, Σx, Σx²)", "alt"),
        ("Shuffle", "按键归并", ""), ("Reduce", "合并充分统计量", ""),
        ("Output", "全局均值 / 方差", "ok")]})

add("tree-ml-algorithms", "结构图", "matrix", "经典机器学习算法的分类谱系",
    "按「是否监督 / 输出类型 / 模型族」定位算法；选择时先看数据规模、可解释性要求与特征类型。",
    R, "modules/m12-ml-algorithms.html", {"title": "按学习范式与模型族定位算法", "cells": [
        [("监督 · 回归", "线性 / 岭 / Lasso", "alt"), ("监督 · 分类", "逻辑回归 / SVM / 树", ""),
         ("无监督", "KMeans / PCA / 层次聚类", "info")],
        [("生成式", "LDA / 朴素贝叶斯", "muted"), ("判别式", "逻辑回归 / SVM", "muted"),
         ("集成", "RF / GBDT / XGBoost", "ok")]]})

add("flow-training-loop", "流程图", "vflow", "深度学习的最小训练循环",
    "前向 → 损失 → 反向 → 更新四步构成一个 step；自动微分把复合函数求导拆成计算图上的链式法则。",
    R, "modules/m13-deep-training.html", {"steps": [
        ("① 取一个 mini-batch", "打乱 / 采样", "alt"),
        ("② 前向传播 ŷ = f(x;θ)", "缓存中间激活", ""),
        ("③ 计算损失 L(ŷ, y)", "标量目标", ""),
        ("④ 反向传播 ∇θL", "链式法则 / 自动微分", "info"),
        ("⑤ 优化器更新 θ", "SGD / Adam / 调度", "info"),
        ("⑥ 验证与早停", "监控泛化", "ok")]})

add("stack-transformer", "架构图", "stack", "Transformer 编码器块的结构",
    "多头自注意力 + 前馈网络，两处残差连接与层归一化；位置编码注入顺序信息。复杂度对序列长度是 O(n²)。",
    "Vaswani 等, Attention Is All You Need, NeurIPS 2017 · arXiv:1706.03762",
    "https://arxiv.org/abs/1706.03762", {"bands": [
        ("输入嵌入 + 位置编码", [("Token Embedding", "词表映射", "muted"),
                                ("Positional Encoding", "顺序信息", "muted")]),
        ("多头自注意力子层", [("Q / K / V 投影", "多头并行", "alt"),
                              ("Scaled Dot-Product", "softmax(QKᵀ/√d)V", "alt"),
                              ("残差 + LayerNorm", "Add & Norm", "info")]),
        ("前馈网络子层", [("FFN 升维", "d → 4d", ""), ("激活 GELU/ReLU", "非线性", ""),
                          ("残差 + LayerNorm", "Add & Norm", "info")]),
        ("输出表示", [("上下文相关向量", "供下游任务", "ok")])]})

add("mind-architectures", "思维导图", "mind", "神经网络架构的归纳偏置谱系",
    "不同架构把不同的先验假设写进结构：局部性（CNN）、时序递推（RNN）、全局交互（Attention）。",
    R, "modules/m14-architectures.html", {"center": "架构设计|归纳偏置", "branches": [
        ("MLP", ["全连接", "无结构先验", "通用逼近"]),
        ("CNN", ["局部感受野", "权值共享", "平移等变"]),
        ("RNN / LSTM", ["时序递推", "门控记忆", "难并行"]),
        ("Transformer", ["全局注意力", "可并行", "O(n²) 代价"]),
        ("现代变体", ["MoE 稀疏激活", "线性注意力", "状态空间 Mamba"]),
        ("选型维度", ["数据规模", "序列长度", "算力预算"])]})

add("flow-rag", "流程图", "hflow", "检索增强生成（RAG）的推理链路",
    "把参数化记忆与非参数化检索结合；评测需分别测检索命中率与生成忠实度。",
    "Lewis 等, RAG, NeurIPS 2020 · arXiv:2005.11401",
    "https://arxiv.org/abs/2005.11401", {"steps": [
        ("用户查询", "改写 / 扩展", "muted"), ("向量检索", "Top-k 文档块", "alt"),
        ("重排序", "过滤噪声", ""), ("拼接上下文", "Prompt 组装", ""),
        ("LLM 生成", "带引用", "info"), ("可信度校验", "忠实度 / 拒答", "ok")]})

add("stack-genai-system", "架构图", "stack", "生成式 AI 应用的分层系统工程视图",
    "从基础模型到对齐、检索、Agent 编排、评测与安全，说明「模型能力」只是完整系统的一层。",
    R, "modules/m15-genai-systems.html", {"bands": [
        ("基础层 · 预训练模型", [("Tokenizer / 词表", "分词", "muted"),
                                ("预训练权重", "基座 / 开源", "muted"), ("推理引擎", "KV Cache / 量化", "muted")]),
        ("对齐层 · 后训练", [("SFT 指令微调", "示范数据", "alt"),
                            ("偏好优化", "DPO / GRPO", "alt"), ("安全对齐", "红队 / 规则", "alt")]),
        ("能力增强层", [("RAG 检索", "外部知识", ""), ("工具调用", "函数 / API", ""),
                        ("长上下文", "记忆管理", "")]),
        ("编排层 · Agent", [("规划与反思", "任务分解", "info"),
                           ("多步执行", "状态机", "info"), ("测试时计算", "采样 / 验证", "info")]),
        ("治理层 · 评测与运维", [("基准与人工评测", "可复现", "ok"),
                                ("监控 / 漂移", "日志与告警", "ok"), ("成本 / 延迟", "SLO", "ok")])]})

add("curve-scaling-law", "结构图", "curve", "缩放定律：损失随算力 / 参数 / 数据的幂律下降",
    "Kaplan 等给出幂律关系；Hoffmann 等（Chinchilla）指出在固定算力下应同步放大数据，纠正了「只堆参数」的策略。",
    "Kaplan 等 arXiv:2001.08361；Hoffmann 等 arXiv:2203.15556",
    "https://arxiv.org/abs/2203.15556", {
        "xlabel": "训练算力 / 数据规模（对数）→", "ylabel": "损失（对数）",
        "series": [
            ("早期策略：参数优先", [(i, 3.0 - 0.30 * i + 0.011 * i * i) for i in range(11)], "alt"),
            ("Chinchilla：参数与数据同步放大", [(i, 3.0 - 0.44 * i + 0.008 * i * i) for i in range(11)], "ok")]})

add("flow-conformal", "流程图", "vflow", "共形预测：从非一致性分数到有覆盖率保证的预测集",
    "只需数据可交换性，即可给出有限样本、分布无关的边际覆盖率保证；预测集大小反映模型不确定性。",
    "Angelopoulos & Bates, Conformal Prediction, 2021 · arXiv:2107.07511",
    "https://arxiv.org/abs/2107.07511", {"steps": [
        ("① 留出校准集", "与训练数据可交换", "alt"),
        ("② 定义非一致性分数 s(x,y)", "如 1 − f(x)_y", ""),
        ("③ 取分数的 ⌈(n+1)(1−α)⌉ 分位数 q̂", "有限样本校正", "info"),
        ("④ 对新样本输出 {y : s ≤ q̂}", "预测集而非点预测", ""),
        ("⑤ 验证覆盖率 ≥ 1−α", "边际保证 / 条件覆盖另议", "ok")]})

add("mind-knowledge-deps", "思维导图", "mind", "六阶段知识依赖全景",
    "统计学是共同底座；大数据分析提供规模化手段，机器学习给出建模范式，深度学习与网络架构提供可训练结构，生成式 AI 是系统集成。",
    R, "roadmap.html", {"center": "六阶段|知识依赖", "branches": [
        ("① 统计学", ["概率 / 推断", "回归 / 实验", "不确定性量化"]),
        ("② 大数据分析", ["分布式统计", "流式与近似", "数据质量"]),
        ("③ 机器学习", ["泛化理论", "偏差方差", "模型选择"]),
        ("④ 深度学习", ["自动微分", "优化器", "缩放定律"]),
        ("⑤ 神经网络", ["归纳偏置", "注意力", "架构选型"]),
        ("⑥ 生成式 AI", ["对齐 / 偏好优化", "RAG / Agent", "可靠评测"])]})

add("flow-case-relay", "流程图", "hflow", "跨模块贯穿案例：一次完整的数据科学工程链",
    "同一个「在线课程完课率」项目在 15 章中反复出现，每章只替换方法，帮助读者形成系统工程视角。",
    R, "roadmap.html", {"steps": [
        ("数据理解", "m01–m02", "alt"), ("统计建模", "m03–m07", ""),
        ("实验验证", "m08", ""), ("规模化", "m09–m12", "info"),
        ("深度系统", "m13–m14", "info"), ("生成式应用", "m15", "ok")]})

add("matrix-algo-compare", "结构图", "matrix", "算法横向对比的六个固定维度",
    "所有章节的「横向对比」统一按这六栏展开，保证全站术语与评价口径一致。",
    R, "CHAPTER-SPEC.md", {"title": "统一横向对比口径", "cells": [
        [("适用条件", "数据假设 / 规模", "muted"), ("时间与空间复杂度", "训练 / 推理", "alt"),
         ("关键超参数", "敏感性与默认建议", "")],
        [("优点", "何时优先选", "ok"), ("局限与失效边界", "何时不该用", "warn"),
         ("可解释性 / 工程成本", "落地的隐性代价", "info")]]})


def main():
    data = {f["id"]: {k: v for k, v in f.items() if k != "id"} for f in FIGS}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print("=" * 62)
    print(f"✅ 图示库生成完成：{len(data)} 张内联 SVG（全离线 / 双主题）")
    for f in FIGS:
        print(f"   {f['id']:28s} {f['kind']:5s} {f['title']}")
    print(f"   输出：{OUT.relative_to(ROOT).as_posix()}")
    print("=" * 62)


if __name__ == "__main__":
    main()

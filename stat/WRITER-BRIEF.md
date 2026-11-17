# WRITER-BRIEF.md · 深度片段写作共享说明（供 15 章写作者使用）

**必读**：`CHAPTER-SPEC.md`（章节规范，唯一权威）。本文件补充「数据真源」与「可用图示 ID」，两者冲突时以 CHAPTER-SPEC.md 为准。

## 你只做一件事

为你负责的每一章创建 **一个** 文件：`D:\AI\统计分析\data\fragments\mNN.html`。
**不要**编辑 `modules/*.html`（由 `inject-learning.py` 自动合并），**不要**改数据文件、CSS、脚本、导航。

片段是纯 HTML 片段（无 `<html>/<head>/<body>`），结构见 CHAPTER-SPEC.md 第二节。

## 跨模块贯穿案例（数字必须与此一致）

`知学云 · 在线课程完课率提升项目`，N=12,000，seed=20261107，纯 Python 标准库确定性生成。
真实运行输出（来自 `assets/js/case-outputs.txt`，由 `assets/js/case-data.py` 生成）：

```
overall completed : 5,967 / 12,000 = 0.4973
study_minutes/week: mean=95.30  sd=43.43  median=94.80  q1=65.10  q3=125.10
quiz_avg          : mean=79.76  sd=14.58  median=80.70
corr(study, quiz) : 0.4792
treatment : n=6,000  completed=3,353  rate=0.5588  Wilson95=[0.5462, 0.5714]
control   : n=6,000  completed=2,614  rate=0.4357  Wilson95=[0.4232, 0.4482]
ATE       : +0.1232   z=13.4924   se=0.009129
OLS quiz ~ study : intercept=64.4306  slope=0.160833  R2=0.2296
Beta posterior   : Beta(5969, 6035)  mean=0.497251
2x2 high/low study: [3939, 2071, 2028, 3962]  OR=3.7158
```

字段：`user_id, age, device, enroll_channel, region, signup_month, treatment, peer_group,
study_minutes_week, video_watch_ratio, quiz_avg, forum_posts, days_to_first_quiz, completed`。

**涉及这些数字时直接引用上表，不要另造一套。** 你也可以写自己的小型确定性程序（固定种子、纯标准库），但**必须实际运行**并把 stdout 原样贴进 `run-output`。

## 可用图示 ID（写 `<figure data-figure="ID"></figure>`，脚本自动展开）

```
flow-learning-loop      mind-statistics          flow-hypothesis-test
flow-sampling           curve-clt                curve-bias-variance
matrix-measurement      flow-regression-diagnose flow-bayes-update
flow-abtest             stack-bigdata            flow-mapreduce
tree-ml-algorithms      flow-training-loop       stack-transformer
mind-architectures      flow-rag                 stack-genai-system
curve-scaling-law       flow-conformal           mind-knowledge-deps
flow-case-relay         matrix-algo-compare
```

经典配图占位写 `<figure data-classic="0"></figure>`（下标从 0 开始，各章数量见 `data/learning.json` 的 `classics`）。图题与来源由脚本生成，你不要手写 figcaption。

## 每章片段的硬性最少内容

1. `<h2 id="d-deep-1">深度专题一…</h2>` + `<h2 id="d-deep-2">深度专题二…</h2>`：各含背景 / 直觉 / 形式化 / `key-result` / 条件句边界；至少 1 张图示标记。
2. `<h2 id="d-algo">经典算法详解…</h2>`：原理 / 步骤 / 适用条件 / `complexity` 复杂度 / `pros-cons` 优缺点 / `step-solve` 手算推演 / `compare-table` 与 ≥2 个同类算法按六维对比。
3. `<h2 id="d-code">代码实验…</h2>`：`code-lab`（`cl-head` + `<pre>` 代码 + `run-output` **真实**输出 + `code-interp` 解读）。
4. `<h2 id="d-spec">功能规格与工程边界</h2>`：`spec-table` 六行（功能说明 / 输入输出 / 适用场景 / 关键参数 / 边界条件 / 常见问题）+ `faq` ≥4 条。
5. `<h2 id="self-test">自测题</h2>`：`self-test[data-quiz]` ≥4 题，`quiz-item[data-answer]` + `quiz-opts` radio + `quiz-feedback[data-explain]` + `[data-quiz-submit]` 按钮。
6. 至少 1 组 `step-solve` 逐步解题（可放在算法详解里）。
7. 至少 1 处 `<figure data-classic="0"></figure>`（若该章 classics 非空）。

**不要**写：核心问题、本章定位、跨模块案例、延伸阅读、最新理论突破、本章小结、练习题、页头页脚 —— 这些已存在或由脚本注入。

## 公式 / HTML 红线

- 行内 `$…$`，独立 `$$…$$`；禁用 `\tag` `\label` `\eqref` `\begin{equation}`；花括号平衡。
- 源码里裸 `<` 写 `&lt;`，`>` 写 `&gt;`；公式内禁圆圈数字 `①②③`。
- 所有 `<h2>` 需要唯一 id（`d-deep-1` / `d-deep-2` / `d-algo` / `d-code` / `d-spec` / `self-test`）。
- 不写 `TODO` / `待补充` / `占位` / `Lorem` 等未完成字样。
- 目标读者是**初中数学基础起步**的自学者：先直觉后形式，每个公式配一句白话解释。

## 交付前自检

```bash
cd D:/AI/统计分析/assets/js
python inject-learning.py
python validate-site.py
python audit-links.py
```
若报错与你写的片段有关，修片段后重跑。完成后简要报告：写了哪些文件、每章多少行、代码实验是否真实运行过。

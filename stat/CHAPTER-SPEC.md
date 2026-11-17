# CHAPTER-SPEC.md · 教材级章节规范（v3.0）

> 本站《统计 · 智能学习体系》的**唯一章节编写规范**。
> 目标读者不变：仅具备初中数学基础、希望一路走到生成式 AI 核心的自学者。
> 主题与栏目不变：六阶段（统计学 → 大数据分析 → 机器学习 → 深度学习 → 神经网络 → 生成式 AI）、15 个章节、原有导航与页面结构一律保留。
> 本文件只规定**内容深度与学习体验**，不新增任何栏目或页面。

---

## 一、每个章节必须形成的完整学习闭环

每章必须可**独立成章、当作一份教材使用**。九个环节按顺序出现，缺一不可：

| # | 环节 | 由谁提供 | 落地标记 |
|---|---|---|---|
| ① | 学习目标 | 原有 `callout tip` + `check-list`，由注入脚本补 `id="obj"` | `#obj` |
| ② | 核心问题 | `data/learning.json` 的 `questions`，脚本注入 | `#core-q` |
| ②′ | 本章定位 / 知识依赖 / 难度 / 先修 / 后继 / 术语口径 | `data/core.json` + `learning.json`，脚本注入 | `#pos` |
| ③ | 专题讲解 | 原有 `s1…sN` 正文，**保留不删** | `#s1` |
| ④ | 典型例题 + 逐步解题过程 | 原有 `example` + 新增 `step-solve` 深度推演 | `#examples` |
| ⑤ | 代码运行结果与结果解读 | 写作者在深度片段中提供 `code-lab` | `#d-code` |
| ⑥ | 练习或自测 | 原有「练习题」+ 新增交互式 `self-test` | `#self-test` |
| ⑦ | 总结与延伸阅读 | 原有「本章小结」+ 脚本注入 `further-reading` | `#d-summary` |
| 补 | 功能说明 / 输入输出 / 适用场景 / 关键参数 / 边界条件 / 常见问题 | 写作者 `spec-table` + `faq` | `#d-spec` |
| 补 | 深度专题 + 图示 | 写作者 + 图示库 | `#d-deep-1` |
| 补 | 经典算法详解 | 写作者 `algo-spec` | `#d-algo` |
| 补 | 最新理论突破 | `learning.json` 的 `breakthroughs`，脚本注入（有则生成） | `#d-frontier` |
| 补 | 跨模块贯穿案例 | `data/case.json`，脚本注入 | `#d-case` |

**写作者只需产出 `data/fragments/mNN.html` 一个文件**，其余由 `assets/js/inject-learning.py` 自动注入，保证 15 章的层级、风格、术语、导航、视觉完全一致。

---

## 二、深度片段必须包含的结构（按顺序）

```html
<h2 id="d-deep-1">深度专题一 · ……</h2>
   <div class="deep-topic">… 背景 / 直觉 / 形式化 / 关键结论 / 边界 …</div>

<h2 id="d-deep-2">深度专题二 · ……</h2>
   ……

<h2 id="d-algo">经典算法详解 · ……</h2>
   <div class="algo-spec">… 原理 / 步骤 / 适用条件 / 复杂度 / 优缺点 / 示例推演 / 横向对比 …</div>

<h2 id="d-code">代码实验 · ……</h2>
   <div class="code-lab">… 代码 + 真实运行输出 + 结果解读 …</div>

<h2 id="d-spec">功能规格与工程边界</h2>
   <table class="spec-table">… 6 个固定行 …</table>
   <div class="faq">… 常见问题 …</div>

<h2 id="self-test">自测题</h2>
   <div class="self-test" data-quiz>…</div>
```

### 2.1 深度专题（≥ 2 个，围绕核心问题）

每个专题必须有：
- **背景**：这个问题为什么会出现、前人怎么处理的；
- **直觉**：先用不含公式的话讲清楚（本项目的第一原则：先直觉后形式）；
- **形式化**：公式与推导，允许用 KaTeX；
- **关键结论**：用 `<div class="key-result">` 标出；
- **边界**：明确写出「在 XX 条件下本结论不成立，应改用 YY」的条件句，禁止「视情况而定」。
- 至少配 **1 张图示**（见第三节）。

### 2.2 经典算法详解

必须完整覆盖七项，缺一不可：
1. **原理**：优化目标 / 概率模型 / 几何解释；
2. **步骤**：编号可逐条照做；
3. **适用条件**：数据假设、规模、分布、特征类型；
4. **复杂度**：时间与空间，用 `<div class="complexity">` 标出训练与推理；
5. **优缺点**：`<div class="pros-cons">` 两栏；
6. **示例推演**：用 `<div class="step-solve">` 给一组小数字**手算到底**，每一步有数值；
7. **横向对比**：`<table class="compare-table">`，按 `matrix-algo-compare` 的六维口径（适用条件 / 复杂度 / 关键超参 / 优点 / 局限与失效边界 / 可解释性与工程成本）与至少 2 个同类算法对比。

### 2.3 代码实验（强制：真实运行结果）

- 语言：**纯 Python 标准库**（本机无 numpy/pandas/scipy/sklearn；也不要求读者安装任何包）。
- 数据：优先复用跨模块案例 `知学云 · 在线课程完课率`。可直接 `exec` 读取 `data/case.json` 的 `stats`，或写一段固定种子的小程序。
- **输出必须真实运行得到**：写作者须实际执行 `python` 并把 stdout 原样贴入 `<pre class="run-output">`，不得编造数字。
- 三件套齐全：`<pre>` 代码 → `<div class="run-output">` 真实输出 → `<div class="code-interp">` 结果解读（解释每个关键数字的含义、与公式的对应、何时会变）。
- 代码块用 `<div class="code-lab">` 包裹，含 `.cl-head` 标注语言与「可复现」。

### 2.4 功能规格表（6 个固定行）

```html
<table class="spec-table">
  <thead><tr><th>项目</th><th>说明</th></tr></thead>
  <tbody>
    <tr><th>功能说明</th><td>这个方法做什么、不做什么</td></tr>
    <tr><th>输入 / 输出</th><td>输入的形状与类型；输出的形式与量纲</td></tr>
    <tr><th>适用场景</th><td>哪些问题应该用它</td></tr>
    <tr><th>关键参数</th><td>参数名、默认值、敏感性、调参方向</td></tr>
    <tr><th>边界条件</th><td>失效条件句：在 XX 条件下不适用，应改用 YY</td></tr>
    <tr><th>常见问题</th><td>初学者最常踩的 2–3 个坑，配合下方 faq</td></tr>
  </tbody>
</table>
```

### 2.5 常见问题（≥ 4 条）

```html
<div class="faq">
  <details><summary>问题？</summary><div class="faq-a">回答……</div></details>
  …
</div>
```

### 2.6 交互式自测（≥ 4 题）

```html
<div class="self-test" data-quiz>
  <div class="st-head"><h3>本章自测</h3><span class="st-score">得分：—</span></div>
  <div class="quiz-item" data-answer="B">
    <div class="q-text">题干……</div>
    <div class="quiz-opts">
      <label class="quiz-opt"><input type="radio" name="q1" value="A"> A. …</label>
      <label class="quiz-opt"><input type="radio" name="q1" value="B"> B. …</label>
      <label class="quiz-opt"><input type="radio" name="q1" value="C"> C. …</label>
    </div>
    <div class="quiz-feedback" data-explain="解析：因为……"></div>
  </div>
  <div class="quiz-actions"><button class="btn primary" data-quiz-submit type="button">提交并查看解析</button></div>
</div>
```

`data-answer` 与某个 `value` 严格一致；`name` 每题唯一（q1/q2/q3…）。

### 2.7 逐步解题（≥ 1 组）

```html
<div class="step-solve">
  <div class="solve-step"><span class="ss-k">写出已知。</span> n=…，x̄=…</div>
  <div class="solve-step"><span class="ss-k">代入公式。</span> …… = 3.72</div>
  <div class="solve-step"><span class="ss-k">解释。</span> ……</div>
</div>
```

---

## 三、图示规范（离线优先）

### 3.1 自绘图示（主手段）

在片段里写占位标记，由注入脚本展开为**内联 SVG**（无外链、无 JS、深浅主题自动适配）：

```html
<figure data-figure="flow-hypothesis-test"></figure>
```

可用的 23 个 ID 见 `assets/js/figure-library.json`。每章 `learning.json` 的 `figures` 已列出推荐 ID；**未显式放置的会自动补到「本章图示汇总」**，所以写作者至少要引用 1–2 个并把它们放在对应专题旁边。图题、简要说明、来源由脚本统一生成，写作者不必手写 `figcaption`。

### 3.2 经典配图占位（无法内嵌外图时）

用户允许「无法直接获取图片时保留准确图注、来源链接和插图占位」。本站为离线站点，**一律不热链外部图片**，采用：

```html
<figure data-classic="0"></figure>   <!-- 数字为该章 classics 数组下标 -->
```

脚本会生成带斜纹占位框、准确图题、图注说明、原始出处与可核验来源链接的 `figure-placeholder`。**禁止编造图片内容或伪造 URL**：`classics` 里的 `src` / `url` 已由维护者核对。

### 3.3 来源标注

- 自绘图示的 `src` 指向权威原始论文 / 教材（arXiv 编号、出版社页）或注明「作者自绘 · 依据本站资源库已核验条目」；
- 经典配图给出处名称 + 原始文献 + 链接；
- 不确定的一律写「来源待核」，不写成定论。

---

## 四、公式与 HTML 硬约束（违反会导致全站校验失败）

1. 行内 `$…$`，独立 `$$…$$`；**禁止** `\tag`、`\label`、`\eqref`、`\begin{equation}`；花括号必须平衡。
2. 源码中 `<` 必须写成 `&lt;`，`>` 写成 `&gt;`（否则 HTML 解析破损）。
3. 禁止圆圈数字 `①②③` 出现在公式内（KaTeX 字形回退）。
4. 所有 `<h2>` / `<h3>` 若需进入目录必须有**唯一 id**；深度片段统一用 `d-` 前缀（`d-deep-1`、`d-algo`、`d-code`、`d-spec`、`self-test`）。
5. 不写 `TODO` / `待补充` / `占位文本` 等未完成字样（图示占位由脚本生成、带独立标记）。
6. 不改 `<head>`、页头、页脚、面包屑、`module-nav`、脚本栈——这些由 `sync-module-chrome.py` 统一维护。
7. 片段内**不要**重复写「核心问题」「本章定位」「跨模块案例」「延伸阅读」「最新理论突破」——由脚本注入，重复会出现两次。
8. 不得删除或改写原有正文、例题、练习、小结。

---

## 五、统一术语与知识衔接

- 术语以 `glossary.html` 为准；同一概念全站只用一种叫法（如统一「置信区间」而非「可信区间」，后者专用于贝叶斯）。
- 每章「本章定位」自动列出前两章、本章、下一章的依赖链；正文中提到前置概念时用 `<a href="mXX-….html">` 相对链接指向同目录章节。
- 难度按 L1 → L5 递进：L1 只需初中数学，L3 起引入线代与编程，L5 需要读论文。
- 跨模块案例固定为「知学云 · 在线课程完课率提升项目」（`data/case.json`，N=12000、seed=20261107、纯标准库确定性生成）；涉及数字时以该文件的 `stats` 为准，保证 15 章数字可对照。
- 系统工程视角：讲解方法时须点明它在「数据采集 → 存储计算 → 建模 → 评估 → 部署运维」链条中的位置与上下游契约。

---

## 六、构建与自检顺序

```bash
cd D:/AI/统计分析/assets/js
python build-figures.py       # 1. 生成离线 SVG 图示库
python case-data.py           # 2. 生成贯穿案例确定性数据
python build-site.py          # 3. 生成阶段页 / 首页 / 路线图 / 资源库 / 时间线 / 索引
python sync-module-chrome.py  # 4. 统一章节共享框架与阅读链
#   （写作者产出 data/fragments/mNN.html）
python inject-learning.py     # 5. 注入学习闭环 + 合并深度片段 + 生成 subsection 索引
python validate-site.py       # 6. 结构 / 链接 / 公式校验
python audit-links.py         # 7. 链接与内容审计
node _check-katex.js ...      # 8. KaTeX 全量公式实测
node probe-site.js http://127.0.0.1:8877   # 9. 无头浏览器（HTTP 与 file:// 双模式）
```

数据维护字段与生成物清单见 `DATA-GUIDE.md`；把本站改造成其他方向学习网站的通用做法见 `TEMPLATE-GUIDE.md`。

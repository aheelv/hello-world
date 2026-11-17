# DATA-GUIDE · 数据维护说明

> 适用版本：v3.0（六阶段数据驱动 + 教材级学习闭环） · 数据更新：2026-11-07
> 本文件说明「改哪里、怎么改、改完跑什么」。**内容一律改 `data/*.json` 与 `data/fragments/*.html`，不要手改生成的 HTML / JS**——下次生成会被覆盖。
> 章节骨架规范见 `CHAPTER-SPEC.md`，深度片段写作约定见 `WRITER-BRIEF.md`。

---

## 1. 为什么有这一层

v1 的内容散落在各 HTML 里，加一条资源要改页面、改索引、改导航，容易漏。v2 把「事实」集中到三个 JSON，页面与索引全部由生成器推导：

```
data/core.json ─┐
data/resources.json ─┼─→ assets/js/build-site.py ─→  stages/*.html · index.html · roadmap.html
data/timeline.json ─┘                              resources.html · timeline.html
                                                  assets/js/config.js
                                                  assets/js/site-data.js
                                                  assets/js/search-index.js
        data/core.json ─────→ assets/js/sync-module-chrome.py ─→ modules/*.html 的共享框架
                     ← assets/js/validate-site.py 全站校验

v3 在 v2 之上增加一条「教材内容层」，同样是数据驱动、幂等可重跑：

```
data/learning.json ─────┐
data/case.json ─────────┼─→ assets/js/inject-learning.py ─→ modules/*.html 的学习闭环区块
data/fragments/mNN.html ┘                                  └→ assets/js/learning-index.js
data/fragments/mNN.html 中的 <figure data-figure="ID">
                          ← assets/js/build-figures.py ─→ assets/js/figure-library.json
assets/js/case-data.py ──→ data/case.json + assets/js/case-outputs.txt
```

- `inject-learning.py` 重建每章的 `V3:HEAD / V3:DEEP / V3:TAIL` 标记区间：本章定位与知识依赖、核心问题、闭环导航、跨模块案例接力、最新理论突破（背景/思想/结论/影响/局限）、延伸阅读、术语口径；并展开图示标记、合并写作者产出的深度片段、生成 subsection 级搜索条目。**反复运行不会重复插入。**
- 深度内容写在 `data/fragments/mNN.html`（纯 HTML 片段，不是整页），`modules/*.html` 由注入器合成。片段里的 `<figure data-figure="…">` 会展开成**离线内联 SVG + 图题**；`<figure data-classic="i">` 展开成「插图占位 + 准确图注 + 来源链接」。
- `learning-index.js` 在脚本加载时把章节子条目并入 `window.SEARCH_INDEX`，因此 `app.js` 的搜索浮层无需改动即可检索深度专题。
- `learning.js` 提供自测判分、解析展开与代码复制；缺少对应 DOM 时静默跳过，非章节页加载也安全。
- `build-site.py` 与 `inject-learning.py` 都会**排除 `data/fragments/`**；这些是部分 HTML，不是可独立打开的页面。校验器与浏览器探针同样排除该目录。

- `build-site.py` 是**唯一**的构建入口；`build-search-index.py` 是 v1 遗留脚本，v2 起不再单独调用（索引已并入生成器）。
- `sync-module-chrome.py` 只改 `modules/*.html` 的**共享框架**（页头、面包屑、页脚、上下篇导航、脚本栈），不碰正文。它从 `core.json` 的 `stages[].modules` 推导出一条连续阅读链，避免 v1/v2 章节各成孤岛。
- 运行时分工：`config.js` 给 `app.js`（侧边栏/进度），`site-data.js` 给 `site-ui.js`（资源库筛选、时间线筛选），`search-index.js` 给搜索浮层。`site-ui.js` 在没有匹配容器时会静默跳过，因此章节页加载它也是安全的，全站脚本栈得以统一。
- 生成器启动时会做**引用一致性校验**：资源指向的阶段、时间线指向的阶段、模块与阶段双向登记、资源 id 唯一性。任一不满足会直接报错退出，不会产出半成品。

---

## 2. 当前数据规模

| 项目 | 数量 | 说明 |
| --- | --- | --- |
| 阶段 `stages` | 6 | 统计学 → 大数据分析 → 机器学习 → 深度学习 → 神经网络 → 生成式 AI |
| 模块 `modules` | 15 | `modules/m01…m15-*.html` |
| 资源 `resources` | 168 | book 24 / theory 22 / paper 40 / model 20 / course 14 / dataset 18 / tool 20 / oss 10 |
| 时间线 `timeline` | 39 | 1763–2025，含 2026 待核验提醒 |
| 搜索索引 | 194 → 412 | 194 条基础（26 页面 + 168 资源）+ 218 条学习闭环子条目，运行时由 `learning-index.js` 合并 |
| 核验状态 | verified 42 / canonical 103 / pending 23 | 见第 5 节 |
| 离线图示 `figure-library.json` | 23 | 流程图 / 结构图 / 架构图 / 思维导图 / 曲线图，全部为主题自适应内联 SVG |
| 深度片段 `fragments/*.html` | 15 · 8459 行 | 每章 2 个深度专题、1 个经典算法七要素、1 组代码实验、功能规格、FAQ、自测题 |
| 章节配图 | 57 图 / 57 图题 | 42 张自绘 SVG + 15 个「经典配图占位（图注 + 来源链接）」 |
| 统一术语 | 127 | 各章「术语口径」与 `glossary.html` 逐字对齐，覆盖率 127/127 |

---

## 3. `data/core.json`

顶层：`meta` / `levels` / `stages` / `modules` / `extras`。

### 3.1 `meta`

| 字段 | 含义 |
| --- | --- |
| `schema` | 数据模型版本号，当前 `2.0` |
| `siteName` / `short` / `tagline` / `subtitle` | 站名、简称、副标题、首页描述 |
| `description` | 全站 meta description |
| `version` / `footer` | 版本号、页脚文字 |
| `updated` | **全站数据日期**。页面页脚、资源默认 `up` 都取它，改数据后记得同步 |
| `route` | 六阶段名称数组，首页路线图节点读它 |
| `routeNote` | 解释「深度学习→神经网络」顺序的理由 |
| `verificationLegend` / `authorityLegend` / `difficultyLegend` | 三套图例，首页、资源库、路线图共用 |

> 换站点方向（例如改做「大数据分析学习网」）时，主要就是改 `meta` 的站名/描述/route 与 `stages`、`modules`。

### 3.2 `levels`

难度五档，每项 `{key, label, desc}`。`key` 会变成侧边栏徽章的 CSS 类（`lv-intro`…`lv-ai`），改动需同步 `components.css`。

### 3.3 `stages[]`（6 项）

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `id` | `s1`…`s6` | 主键，资源/时间线/模块都靠它关联 |
| `num` / `slug` / `color` | 数字 / 英文 / 色系 | `slug` 决定 `stages/<slug>.html` 文件名 |
| `name` / `short` / `en` / `tagline` / `era` | 字符串 | 阶段展示信息 |
| `weeks` / `hours` | 字符串 / 数字 | 建议周期与学时 |
| `goal` | 字符串 | 阶段目标 |
| `difficulty` | `{min,max,label}` | 难度层级 |
| `prereq` | 字符串数组 | 先修知识 |
| `path` | `[{step,n,d,m}]` | **学习路径**；`m` 指向模块 id |
| `concepts` | `[{n,d}]` | 核心概念 |
| `competencies` | 字符串数组 | 目标能力 |
| `tasks` | `[{n,d,level,deliverable}]` | 实践任务与交付物 |
| `assessment` | `[{n,d}]` 或同类结构 | 评估标准 |
| `bridge` | 字符串/结构 | 进阶衔接（下一阶段怎么接） |
| `modules` | 模块 id 数组 | **必须与 `modules[].stage` 双向一致**，生成器会校验 |

阶段页由 `render_stage(st)` 生成，固定十个板块：学习路径 / 先修知识 / 难度层级 / 核心概念 / 目标能力 / 实践任务 / 评估标准 / 进阶衔接 / 本阶段资源 / 本阶段里程碑。

### 3.4 `modules[]`（15 项）

| 字段 | 含义 |
| --- | --- |
| `id` / `num` / `stage` | 主键、显示编号、所属阶段 |
| `title` / `desc` / `hours` | 标题、简介、学时 |
| `level` / `levelKey` | 难度文案、难度 CSS 类（对应 `levels[].key`） |
| `href` | 相对站点根的路径，如 `modules/m01-data.html` |
| `tags` / `prereq` / `goals` | 标签、先修、学习目标 |

新增模块时：先写 HTML（骨架见 `modules/m01-data.html`），再在 `modules[]` 加一条，并把它登记进对应阶段的 `modules` 数组，否则生成器报错。

### 3.5 `extras[]`

首页之外的固定入口，当前 5 项：`home` / `roadmap` / `resources` / `timeline` / `glossary`。`app.js` 的「快速导航」区读这里。

---

## 4. `data/resources.json` 与 `data/timeline.json`

两个文件都有 `_schema` 字段（仅作人读说明，生成器忽略），真实数据在 `resources[]` / `timeline[]`。

### 4.1 资源条目字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | ✅ | 全库唯一，如 `p23`；搜索索引锚点为 `resources.html#r-<id>` |
| `t` | ✅ | 类型，八选一：`book` `theory` `paper` `model` `course` `dataset` `tool` `oss` |
| `n` / `en` | ✅ | 中文名 / 英文名 |
| `by` | | 作者或机构 |
| `y` / `yNote` | | 年份（数字）；年份有争议时把说明写进 `yNote` |
| `src` | ✅ | 出处，如 `arXiv:2305.18290 / NeurIPS 2023` |
| `url` | ✅ | 官方链接（外链，允许 http/https） |
| `auth` | | `official` / `academic` / `community` |
| `st` | ✅ | 适用阶段 id 数组，可多阶段，如 `["s3","s4"]` |
| `d` | | 难度 1–5，对应 `difficultyLegend` |
| `v` | ✅ | `verified` / `canonical` / `pending` |
| `note` | | 核验备注；`pending` 时**必须**写明不确定点 |
| `desc` | ✅ | 一句话说明，纯字符串 |
| `up` | | 单条更新时间；省略则继承 `meta.updated` |

示例：

```json
{
  "id": "p23", "t": "paper", "n": "Direct Preference Optimization", "en": "DPO",
  "by": "Rafailov 等", "y": 2023, "src": "arXiv:2305.18290 / NeurIPS 2023",
  "url": "https://arxiv.org/abs/2305.18290", "auth": "official",
  "st": ["s6"], "d": 4, "v": "verified",
  "note": "本轮已打开 arXiv 摘要页核验",
  "desc": "把 KL 约束的 RLHF 化为闭式解 + 简单分类损失，无需在线采样。"
}
```

> ⚠️ 历史踩坑：`desc` 曾误写成 `"desc":["..."][0]` 这类 JSON 里不合法的表达式，导致解析失败。值必须是**普通字符串**。

### 4.2 时间线条目字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` / `year` / `date` | ✅ | 唯一编号、排序用数字年份、显示用日期（如 `2025-01`） |
| `n` / `en` / `by` | ✅ | 事件名 / 英文名 / 主体 |
| `stage` | ✅ | 单个阶段 id，如 `s6` |
| `src` / `url` | ✅ | 出处与链接 |
| `v` / `note` / `desc` | ✅ | 核验状态、备注、意义与统计关联 |
| `up` | | 省略则继承 `meta.updated` |

时间线按 `year` 正序展示；筛选支持阶段、核验状态、关键词，URL 参数形如 `timeline.html?stage=s1`。

### 4.3 URL 参数约定

`site-ui.js` 支持从地址栏预置筛选，阶段页的「查看本阶段全部资源/里程碑」按钮会自动拼上：

| 页面 | 参数 | 取值 |
| --- | --- | --- |
| `resources.html` | `stage` `type` `verify` `era` `q` `sort` | `s1`…`s6`、`paper` 等、`verified`/`canonical`/`pending`、`2025+`/`2020s`/`2010s`、关键词、`year-desc` 等 |
| `timeline.html` | `stage` `verify` `q` | 同上 |

这些 `?` 链接是**合法站内筛选入口**，不是死链。

---

## 5. 核验与权威性规则（重要）

用户要求「权威、较新、可核验；无法确认的标注待核验，避免虚构」。因此：

| `v` | 显示 | 判定标准 |
| --- | --- | --- |
| `verified` | 已核验 | 本轮检索命中官方论文页 / 出版社页 / 官方仓库 / 官方公告 |
| `canonical` | 权威共识 | 学界通行引用的经典条目，链接为官方固定入口，年份按通行引用；**未在本轮逐条打开复核** |
| `pending` | 待核验 | 年份、版次、出处或状态存在不确定，**暂不作为定论引用** |

| `auth` | 显示 |
| --- | --- |
| `official` | 一级 · 官方一手（出版社 / 期刊 / 会议 / 官方仓库 / 官方公告） |
| `academic` | 二级 · 学术机构（大学课程页 / 综述 / 研究机构） |
| `community` | 三级 · 社区维护（开源社区 / 百科 / 聚合站点） |

**维护纪律**

1. 新增条目一律先给 `v: "pending"`，打开一手链接确认后再改 `verified` / `canonical`，并在 `note` 里写清核验了什么。
2. `pending` 会正常显示在资源库，但带醒目标记，页面明确提示「仅作线索」。这是刻意保留的透明度，不要为了好看把它删掉或伪装成已核验。
3. 拿不准的年份写进 `yNote`，不要编一个整数凑数；模型年份以官方技术报告为准。
4. 难度 `d` 用 1–5：`1` 只需基础数学 → `5` 需读论文与复现能力。

---

## 6. 标准更新流程

在 `D:\AI\统计分析` 下操作（Git Bash / PowerShell 均可）：

```bash
# 1) 改数据（三选一或全部）
#    data/core.json / data/resources.json / data/timeline.json

# 2) 先确认 JSON 合法
python -c "import json;[json.load(open('data/'+f,encoding='utf-8')) for f in ['core.json','resources.json','timeline.json','learning.json','case.json']];print('JSON OK')"

# 3) 按固定顺序重建全站（顺序不可颠倒）
cd assets/js
python build-figures.py       # 3a 生成 23 张离线 SVG 图示库
python case-data.py           # 3b 生成贯穿案例确定性数据与真实运行输出
python build-site.py          # 3c 阶段页 / 首页 / 路线图 / 资源库 / 时间线 / 三份运行时 JS
python sync-module-chrome.py  # 3d 统一 15 章共享框架与连续阅读链
python inject-learning.py     # 3e 注入学习闭环 + 合并 data/fragments/*.html + 生成 learning-index.js

# 4) 静态校验（必须为 0 错误）
python validate-site.py
python audit-links.py
node _check-katex.js <全部页面>   # 公式全量渲染实测

# 5) 本地预览
cd ../..
python -m http.server 8080
# 浏览器打开 http://localhost:8080

# 6) 可选：真实浏览器实测（Edge 无头 + CDP，Node 22 内置 WebSocket）
cd assets/js
node probe-site.js http://127.0.0.1:8080          # HTTP 模式
node probe-site.js "file:///D:/AI/统计分析"       # 离线 file:// 模式
```

> 只改了 `data/fragments/*.html`（不动数据）时，从第 3e 步开始即可；只改了 `core/resources/timeline/learning.json` 时从第 3c 步开始；改了图示定义或案例数据时才需要跑 3a/3b。

也可直接双击 `index.html` 用 `file://` 离线阅读：全站零 CDN 依赖，KaTeX 与全部字体已放在 `assets/vendor/katex/dist/`。

### 生成成功应看到

```
✅ 生成完成  · 数据更新 2026-11-07
   阶段页      : 6 个 -> stages/*.html
   资源条目    : 168 条
   时间线节点  : 39 项
   核验状态    : {...}
   搜索索引    : 194 条（26 页面 + 168 资源）
   输出        : config.js / site-data.js / search-index.js
✅ 章节学习闭环注入 · v3.0
   15 章深度内容（每章 2 深度专题 / 算法七要素 / 代码实验 / 规格表 / 自测题）
   学习闭环搜索条目：218 条 -> assets/js/learning-index.js
```

---

## 7. 常见操作

**加一条资源／一个里程碑**：在对应数组末尾追加对象 → `id` 不重复 → `st`/`stage` 用已有阶段 id → `v: "pending"` + `note` → 跑第 6 节流程。搜索索引会自动收录，无需手改。

**把 `pending` 转 `verified`**：打开 `url` 核对名称/年份/出处 → 改 `v` → 在 `note` 写「本轮核验 XXX」→ 同步 `meta.updated` → 重跑。

**改某章深度内容**：只编辑 `data/fragments/mNN.html`（规范见 `CHAPTER-SPEC.md` 第二节、`WRITER-BRIEF.md`）→ 跑 `python inject-learning.py` → `validate-site.py` + `audit-links.py`。片段必须包含六个唯一 `<h2>`：`d-deep-1` / `d-deep-2` / `d-algo` / `d-code` / `d-spec` / `self-test`；代码实验的 `run-output` 必须是**实际执行过的 stdout**，不得编造数字。不要写核心问题/本章定位/延伸阅读/最新理论突破/小结等——那些由 `learning.json` 注入。

**加一张图示**：在 `build-figures.py` 的 `SPECS` 中追加定义 → 跑该脚本 → 在 `data/learning.json` 对应模块的 `figures[]` 登记 ID → 重跑 `inject-learning.py`。未在片段里显式放置的图示会自动补到深度区末尾。

**加一个模块**：复制 `modules/m01-data.html` 骨架写内容（需含学习目标、例题 `details.solution`、易错 callout、练习、小结表、`data-complete-btn`、`module-nav`）→ 在 `modules[]` 注册 → 在目标阶段的 `modules[]` 登记 → 在 `data/learning.json` 建同名条目（position / questions / figures / classics / breakthroughs / reading / terms）→ 建 `data/fragments/mNN.html` → 重跑第 6 节全流程。同步脚本会自动重排全部章节的上一篇/下一篇，注入器会自动补齐学习闭环。

> **当前连续阅读链**（由 `stages[].modules` 推导，不是按编号数字顺序）：
> `m01 → m02 → … → m08 → m11 → m09 → m12 → m13 → m14 → m10 → m15 → 资源库`
> 阶段 3 同时含 m09 与 m12，阶段 6 同时含 m10 与 m15；跨阶段处导航会显示「进入阶段 N →」。

**加一个阶段**：在 `stages[]` 加一项并设好 `slug`/`id`/`modules` → `meta.route` 同步 → 资源/时间线按需加 `st` → 重跑。`stages/<slug>.html` 会自动生成。注意 `site-ui.js` 的 `initStageLinks()` 目前用 `/^s[1-6]$/` 匹配阶段页，若阶段数超过 6 需同步放宽该正则。

**换站点方向**：见 `TEMPLATE-GUIDE.md`（四层架构与通用化方法）。核心是改 `core.json` 的 `meta`/`stages`/`modules`，并替换 `modules/` 下内容；`tokens.css` 改主题色即可换皮。

---

## 8. 校验器检查什么

`validate-site.py` 覆盖：必要片段（CSS/JS 引用、搜索浮层、侧栏、主题按钮）、`body[data-page]`、脚本加载顺序、公式禁用宏（`\tag` `\label` `\eqref` `\begin{equation}`）、公式花括号平衡、站内链接与锚点、HTML 标签闭合平衡、搜索索引覆盖、KaTeX 本地资源与字体。

`audit-links.py` 补充：跨页锚点、可见文本中的占位词（「插图占位」是 v3 明确要求的图注形式，已白名单）、按 DOM 树判定的真正空区块（带 `id`/`data-*` 的 JS 挂载点与 CSS 布局留白不算）、例题数与解答折叠数的骨架不变量（允许练习答案多 1 个折叠）、练习题数与自测题数、各页字量指标。练习题计数按「标题含练习题」的小节精确取段，避免被 v3 的「自测题」标题抢先匹配。

上述三个脚本均**排除 `data/fragments/`**：那里是注入用的部分 HTML，不含页面骨架，按整页校验必然误报。

`probe-site.js`（浏览器实测）自动发现全部 26 个页面，逐页检查白页、JS 异常、请求失败、KaTeX 错误、侧栏与目录数量，并实测 14 项交互：资源库筛选、URL 参数预置筛选、时间线筛选、全站搜索（含 218 条学习闭环子条目）、学习闭环骨架、图示与图题内联、算法与代码实验组件、最新理论突破五栏、代码复制按钮、自测题判分与解析展开、子条目可检索、六阶段连续导航；支持 HTTP 与 `file://` 两种模式。

公式规范：`$…$` 行内、`$$…$$` 独立；源码里 `<`/`>` 建议写 `&lt;`/`&gt;`；避免在公式中使用圆圈数字等 KaTeX 字体不支持的字符。

---

## 9. 目录速查

```
D:\AI\统计分析\
├─ data/                     ← 只改这里
│  ├─ core.json              阶段 / 模块 / 站点元信息
│  ├─ resources.json         168 条资源
│  ├─ timeline.json          39 个里程碑
│  ├─ learning.json          v3 学习闭环元数据（定位/核心问题/图示/突破/术语/延伸阅读）
│  ├─ case.json              贯穿案例确定性数据（生成物）
│  └─ fragments/             15 章深度片段（手写，纯 HTML 片段，非整页）
├─ assets/
│  ├─ favicon.svg              离线站点图标（避免 HTTP 下 /favicon.ico 404）
│  ├─ js/
│  │  ├─ build-figures.py      ← 生成 23 张离线 SVG 图示库
│  │  ├─ case-data.py          ← 生成贯穿案例数据与真实运行输出
│  │  ├─ build-site.py         ← 页面 / 配置 / 运行时数据 / 基础搜索索引的唯一入口
│  │  ├─ sync-module-chrome.py ← 同步 modules/*.html 共享框架与上下篇链
│  │  ├─ inject-learning.py    ← 注入学习闭环、合并深度片段、展开图示
│  │  ├─ figure-library.json   生成物（图示 SVG），勿手改
│  │  ├─ learning-index.js     生成物（章节子条目），勿手改
│  │  ├─ case-outputs.txt      生成物（可复现运行输出），勿手改
│  │  ├─ site-data.js          生成物，勿手改
│  │  ├─ config.js             生成物，勿手改
│  │  ├─ search-index.js       生成物，勿手改
│  │  ├─ site-ui.js            资源库 / 时间线筛选交互
│  │  ├─ learning.js           v3 自测判分 / 代码复制
│  │  ├─ app.js                侧栏 / TOC / 搜索 / 主题 / 进度
│  │  ├─ validate-site.py      静态校验
│  │  ├─ audit-links.py        链接与内容审计
│  │  ├─ _check-katex.js       公式全量渲染实测
│  │  └─ probe-site.js         无头浏览器实测（HTTP / file://）
│  ├─ css/                      tokens.css（主题）/ base / layout / components
│  │                          learning.css（v3 学习闭环组件）
│  └─ vendor/katex/             离线公式与字体
├─ stages/                   6 个阶段页（生成物）
├─ modules/                  15 个章节（共享框架自动生成，深度内容由片段注入）
├─ index.html / roadmap.html / resources.html / timeline.html   （生成物）
├─ glossary.html             术语表（手写内容）
├─ CHAPTER-SPEC.md           教材级章节规范（v3 契约）
├─ WRITER-BRIEF.md           深度片段写作共享说明
├─ TEMPLATE-GUIDE.md         通用模板与换方向说明
└─ DATA-GUIDE.md             本文件
```

> ⚠️ 生成物清单：`index.html`、`roadmap.html`、`resources.html`、`timeline.html`、`stages/*.html`、`assets/js/{config,site-data,search-index,learning-index}.js`、`assets/js/figure-library.json`、`data/case.json`、`assets/js/case-outputs.txt`。手改这些文件会在下次构建时被覆盖。
> `modules/*.html` 的**正文骨架**与 `glossary.html` 属于手写内容；但 `sync-module-chrome.py` 会重写 `modules/*.html` 的共享框架，`inject-learning.py` 会重写三处 `V3:*` 标记区间内的全部内容——**不要把需长期保留的内容写进这些区间**，应放进 `data/fragments/mNN.html` 或 `data/learning.json`。

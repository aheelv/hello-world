# GitHub 高星标「知识图谱静态网站模板」调研

> 数据采集时间：**2026-11-10**；采集方式：GitHub REST API `GET /repos/{owner}/{repo}`（星标数、许可证、默认分支、体积）与 `GET /repos/{owner}/{repo}/commits/{branch}`（快照提交）。
> 星标数是动态值，本文记录的是采集当日的实测值；可复核接口地址见文末。
> 原始模板已按分支快照下载并**原样解压**到 `templates/`，未经任何修改。

## 一、口径说明

"知识图谱静态网站模板"在 GitHub 上并非一个独立品类，实际由两类仓库构成：

1. **带图谱视图的静态站点生成器**（数字花园 / 文档站）：整站可静态部署，内置节点关系图、反向链接等知识图谱能力；
2. **图谱可视化引擎 / 文本转图模板**：自带可直接静态托管的示例页，负责把节点与边渲染成图。

因此本项目的筛选条件是：**（a）与知识节点/关系的可视化直接相关；（b）产物可静态托管（无需后端）；（c）有可参考的模板或示例页；（d）许可证允许教学场景复用**。按星标数从高到低选取 5 个，覆盖 5 种互不重复的展示形式。

## 二、入选模板（5 个，按星标数降序）

| # | 仓库 | 星标数 | 许可证 | 定位 | 功能特点（据仓库 README / docs） | 可借鉴的展示形式 | 本项目落地页 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [d3/d3](https://github.com/d3/d3) | **113,892** | ISC | 数据驱动文档底层库 | `d3-force` 力模拟、`d3-zoom` 缩放拖拽、`d3-selection` 数据绑定；SVG 完全可控 | **力导向关系网络**：节点半径映射度数、按章节着色、拖拽后回弹、滚轮缩放、邻接高亮 | `demos/d3-force.html`；`app/graph.html` |
| 2 | [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) | **91,056** | MIT | 文本即图的图表语言 | Markdown 式 DSL 生成 flowchart / mindmap；`subgraph` 分组、`classDef` 样式、点击跳转；图定义可版本管理 | **图谱即文本**：把章节层级编译成可复制的图定义，配 `subgraph` 分章、`classDef` 分色 | `demos/mermaid-flow.html` |
| 3 | [apache/echarts](https://github.com/apache/echarts) | **67,697** | Apache-2.0 | 企业级图表库，`dist/echarts.min.js` 可直接 `<script>` 引入 | `series-graph` 支持 force / circular / none 三种布局、`focus: 'adjacency'` 邻接高亮、`roam` 漫游、legend 图例筛选、tooltip | **多布局切换 + 图例筛选**：一键切换力引导/环形，按章节图例过滤，邻接聚焦 | `demos/echarts-graph.html` |
| 4 | [jackyzha0/quartz](https://github.com/jackyzha0/quartz) | **13,558** | MIT | 数字花园静态站点生成器 | 官方 `docs/features/graph view.md` 定义了**局部图谱**（当前笔记一跳邻域）与**全局图谱**（全部笔记）；另有反向链接、悬停卡片预览、全文搜索 | **全局图谱 + 反向链接 + 局部聚焦**：点节点只看邻域，侧栏列出"被谁引用/引用了谁"，悬停显示摘要卡片 | `demos/quartz-graph.html` |
| 5 | [markmap/markmap](https://github.com/markmap/markmap) | **13,229** | MIT | Markdown → 交互式思维导图 | README：标题与列表项变成可折叠分支，可 zoom / pan；段落与代码作为分支注释在浮层展开；`classic / cards / minimal` 三套主题 | **大纲驱动的可折叠思维导图**：左栏 Markdown 大纲、右栏导图，逐级展开/收起、缩放平移 | `demos/markmap-outline.html` |

### 逐条补充说明

- **D3（ISC）**：`d3/d3` 是元包，仓库内不含预构建 `dist/`；本项目把 npm 发行版 `d3@7.9.0/dist/d3.min.js` 本地化到 `assets/vendor/`，许可证文本见 `templates/d3/d3-main/LICENSE`。
- **Mermaid（MIT）**：仓库自带 `demos/mindmap.html` 与 `docs/syntax/mindmap.md`。本项目本地化 `mermaid@10.9.5/dist/mermaid.min.js`（UMD 构建），演示以 `flowchart + subgraph + classDef` 为主，避免 ESM 分包在 `file://` 下的动态加载失败；同时提供 mindmap 试验开关。
- **ECharts（Apache-2.0）**：仓库**自带** `dist/echarts.min.js`，演示页直接以相对路径引用 `templates/echarts/echarts-master/dist/echarts.min.js`，未复制、未改动，保证"原始模板"与"运行文件"是同一份。
- **Quartz（MIT）**：v5 为 TypeScript 构建型站点，需 `npm run build` 才能产出静态站，其 Graph View 已是社区插件（见官方 `docs/features/graph view.md`）。本项目**不改动其源码**，在演示页用本地 D3 复刻其"全局/局部图谱 + 反向链接 + 悬停卡片"交互范式，并在页面标注为"借鉴实现"。
- **markmap（MIT）**：`markmap-autoloader` 运行时会从 CDN 拉取 d3 与 markmap-view，不适合纯离线；本项目用本地 D3 复刻其"Markdown 大纲 → 可折叠导图"范式，原始仓库完整保留供查阅。

## 三、候选池与未入选原因（可复核的筛选过程）

| 仓库 | 星标数 | 许可证 | 未入选原因 |
| --- | --- | --- | --- |
| docsifyjs/docsify | 31,580 | MIT | 零构建静态文档站的优秀范式，但**无内置图谱视图**，与"知识图谱展示"不直接相关；本项目仅借鉴其"侧栏 + 单页 + 免构建"组织方式 |
| vuejs/vitepress | 18,481 | MIT | 通用文档站生成器，无节点关系图组件 |
| foambubble/foam | 17,475 | 自定义（API 返回 NOASSERTION） | 偏 VS Code 端的个人知识管理方法论，非静态网站模板；许可证需逐文件确认，教学复用成本较高 |
| antvis/G6 | 12,384 | MIT | 专业图可视化引擎，值得借鉴但展示形式与 D3/ECharts 高度重叠，且体量较大；列入备选 |
| jacomyal/sigma.js | 12,229 | MIT | 大规模网络绘制引擎，偏 WebGL，课程数据量（186 节点）无需该量级 |
| cytoscape/cytoscape.js | 11,277 | MIT | 图论布局库，定位与 D3 重叠 |
| visjs/vis-network | 3,637 | Apache-2.0 | 星标数明显偏低，且仓库体积 1.7 GB（含大量测试素材），不适合作为交付模板 |

> 说明：入选的 5 个并非"全部候选里星标最高的 5 个"，而是**满足筛选条件后**星标最高的 5 个；这避免了把"无图谱能力的通用文档站"算作知识图谱模板。

## 四、下载与保留记录

| 模板 | 分支 | 快照提交 SHA（前 12 位） | 下载 URL | ZIP 体积 | 解压文件数 | 本地路径 |
| --- | --- | --- | --- | --- | --- | --- |
| d3/d3 | `main` | `db118c93a429` | `https://codeload.github.com/d3/d3/zip/refs/heads/main` | 0.71 MB | 201 | `templates/d3/d3-main/` |
| mermaid-js/mermaid | `develop` | `b7080e16a4ae` | `https://codeload.github.com/mermaid-js/mermaid/zip/refs/heads/develop` | 9.46 MB | 4,885 | `templates/mermaid/mermaid-develop/` |
| apache/echarts | `master` | `34f4d927eafe` | `https://codeload.github.com/apache/echarts/zip/refs/heads/master` | 24.88 MB | 2,343 | `templates/echarts/echarts-master/` |
| jackyzha0/quartz | `v5` | `beeeed45b82a` | `https://codeload.github.com/jackyzha0/quartz/zip/refs/heads/v5` | 12.90 MB | 401 | `templates/quartz/quartz-5/` |
| markmap/markmap | `master` | `116bd2bdf1e5` | `https://codeload.github.com/markmap/markmap/zip/refs/heads/master` | 0.27 MB | 240 | `templates/markmap/markmap-master/` |

- 原始 ZIP 快照保留在 `templates/_zips/`，机器可读清单为 `templates/_zips/download_manifest.json`；解压目录**保持仓库原目录名与内部层级**，未删改任何文件。
- 各仓库许可证原文：`templates/d3/d3-main/LICENSE`、`templates/mermaid/mermaid-develop/LICENSE`、`templates/echarts/echarts-master/LICENSE`、`templates/quartz/quartz-5/LICENSE.txt`、`templates/markmap/markmap-master/LICENSE`。

## 五、数据复核接口

```
https://api.github.com/repos/d3/d3
https://api.github.com/repos/mermaid-js/mermaid
https://api.github.com/repos/apache/echarts
https://api.github.com/repos/jackyzha0/quartz
https://api.github.com/repos/markmap/markmap
```

返回字段中 `stargazers_count` 对应星标数、`license.spdx_id` 对应许可证、`size` 为仓库体积（KB）、`pushed_at` 为最近推送时间。

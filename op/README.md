# 通用课程知识图谱系统（运筹学 7 章知识图谱 · 超星文件兼容）

> 项目根目录：`D:\workbuddy\知识图谱\课程知识图谱系统\`
> 所有产物只在本文件夹内；原始模板、素材、页面、脚本、文档均不写入其他目录。

## 一、项目目标

1. **调研并保留原始模板**：整理 GitHub 上星标数靠前的 5 个知识图谱静态网站模板，下载分支快照、记录来源/星标/许可证/功能特点/可借鉴展示形式（[完整调研](docs/01_GitHub模板调研.md)）。
2. **统一基础数据**：以用户上传的《01-知识图谱-运筹学-7章全部.xlsx》及工作空间已有的超星 16 列标准导入文件为依据，构建一份全站共用的课程知识图谱数据（186 节点 / 320 关系 / 7 章）。
3. **扩展超星能力**：在超星知识图谱导入/导出能力之上，实现通用课程图谱展示系统（关系图、层级树、思维导图、检索、关系矩阵、节点详情），并支持超星文件双向导入导出；不完全兼容处提供清晰的数据转换接口。
4. **展示模板特色**：5 个演示页分别进入并展示各模板的进一步特色功能，全部使用同一份运筹学数据。
5. **统一入口与可运行性**：一个统一登录入口页通往通用系统、模板演示、导入导出；目录清晰、离线可运行、可当堂检查。

## 二、运行方式（三选一）

| 方式 | 操作 | 说明 |
| --- | --- | --- |
| 直接打开 | 双击根目录 `index.html` | 全部页面用 `<script>` 引入 `data/course-kg.js`，**无需服务器**；导入页的"载入内置示例"在 `file://` 下会提示改用手动选择文件 |
| 本地服务（推荐） | 双击 `启动.bat`，或执行 `python tools/serve.py`，浏览器访问 `http://127.0.0.1:8765/` | 所有功能（含 fetch 示例、剪贴板）完整可用 |
| 静态托管 | 把本文件夹整体放到任意静态服务器 | 纯静态、无后端、无数据库 |

> 统一登录入口：`index.html`。演示账号 `teacher` / `student` / `guest`，密码均为 `123456`；也可输入任意用户名 + `123456`。**登录是纯前端演示**，只在浏览器本地保存展示用标识，不做真实鉴权、不上传数据；未登录可访客模式浏览全部页面。

## 三、目录结构

```
课程知识图谱系统/
├── index.html                     统一登录入口 + 工作台
├── 启动.bat / tools/serve.py      本地静态服务
├── README.md                      本文件（项目说明）
├── assets/
│   ├── css/common.css             全站统一浅色主题
│   ├── js/kg-core.js              公共数据层（KG.*）
│   ├── js/kg-force.js             可复用 D3 力导向组件
│   └── vendor/                    本地化运行时库（d3 / mermaid / SheetJS）
├── data/                          ★ 唯一基础数据
│   ├── course-kg.json             规范真源
│   ├── course-kg.js               同一对象的 JS 包装（供 file:// 使用）
│   ├── source/                    用户上传原件只读副本（15 列）
│   └── chaoxing/                  超星示例文件与模板原文
├── app/                           通用课程知识图谱系统（7 页）
│   ├── index.html 总览            graph.html 力导向关系图
│   ├── tree.html 层级树           mindmap.html 思维导图
│   ├── search.html 知识点检索     matrix.html 关系矩阵
│   └── node.html 节点详情
├── demos/                         模板特色演示（5 页 + 索引）
│   ├── d3-force.html              echarts-graph.html      mermaid-flow.html
│   └── quartz-graph.html          markmap-outline.html
├── io/                            导入导出工作台
│   ├── index.html                 4 个 Tab：导入 / 导出 / 转换接口 / 示例与校验
│   └── js/converter.js            超星 ↔ 统一数据转换接口
├── docs/                          项目文档
│   ├── index.html                 项目说明（网页版）
│   ├── 01_GitHub模板调研.md       来源、星标、许可证、功能、展示形式
│   ├── 02_超星兼容范围与字段映射.md
│   ├── 03_数据转换接口说明.md
│   ├── 04_一致性校验记录.md       由 tools/verify.py 生成
│   ├── 05_转换接口测试记录.md     由 tools/test_converter.js 生成
│   └── 06_浏览器运行时校验记录.md 由 tools/runtime_probe.py 生成
├── templates/                     ★ 5 个 GitHub 原始模板快照（未改动）
│   ├── _zips/                     原始 ZIP + 下载清单
│   ├── PROVENANCE.md              下载凭证（URL / 分支 / SHA / 体积）
│   ├── d3/d3-main/                mermaid/mermaid-develop/
│   ├── echarts/echarts-master/    quartz/quartz-5/
│   └── markmap/markmap-master/
└── tools/
    ├── build_data.py              从两份超星 xlsx 生成统一数据与示例文件
    ├── verify.py                  静态一致性自检（数据/同源/资源/链接）
    ├── test_converter.js          转换接口自动化测试
    ├── runtime_probe.py           Chrome headless 逐页检查 JS 运行时错误
    └── serve.py                   本地静态服务
```

## 四、页面地图

| 区域 | 页面 | 主要能力 |
| --- | --- | --- |
| 入口 | `index.html` | 登录/登出、数据概览、三个区域入口、快捷直达 |
| 通用系统 | `app/index.html` | 统计卡片、章节分布、关系/难易分布、7 章导航、热点知识点 |
| 通用系统 | `app/graph.html` | D3 力导向图；章节/关系/关键词筛选、拖拽缩放、邻接高亮、节点详情 |
| 通用系统 | `app/tree.html` | 1—7 级可折叠层级树、关键词定位、缩放平移 |
| 通用系统 | `app/mindmap.html` | Markdown 大纲 + 左右分叉导图、逐级折叠、大纲复制 |
| 通用系统 | `app/search.html` | 全文检索（含四属性）、组合筛选、详情、结果导出 CSV |
| 通用系统 | `app/matrix.html` | 7×7 章节关系热力矩阵、单元格下钻、边清单 |
| 通用系统 | `app/node.html` | 单节点属性、四属性、入边出边、一跳邻域小图、溯源行号 |
| 模板演示 | `demos/d3-force.html` | 力参数实时调节、视觉通道映射 |
| 模板演示 | `demos/echarts-graph.html` | force/circular/none 布局切换、图例筛选、邻接聚焦（引用原始模板 dist） |
| 模板演示 | `demos/mermaid-flow.html` | 图定义实时编译、subgraph 分章、classDef 分色、.mmd 下载 |
| 模板演示 | `demos/quartz-graph.html` | 全局/局部图谱、反向链接、悬停卡片、搜索 |
| 模板演示 | `demos/markmap-outline.html` | Markdown 大纲 → 放射式可折叠导图 |
| 导入导出 | `io/index.html` | 拖放导入、字段映射预览、11 项校验、导出 xlsx/csv/json、接口在线试验、示例与体检 |

**数据同源保证**：所有页面均引入 `data/course-kg.js`；`tools/verify.py` 会静态扫描每个 HTML 确认这一点，并校验 JSON 与 JS 包装内容完全相等。

## 五、统一数据

| 指标 | 数值 |
| --- | --- |
| 节点 | 186（知识单元 41 / 知识点 145） |
| 关系 | 320（前置 167 / 后置 63 / 关联 90） |
| 章节 | 7：绪论 30、线性规划与单纯形法 32、线性规划对偶理论与灵敏度分析 30、整数规划 24、运输问题 21、动态规划 23、图与网络分析 26 |
| 难易程度 | 容易 31 / 偏易 49 / 适中 49 / 偏难 6 / 难 10 |
| 未解析关系引用 | 0 |

节点字段：`id / name / level / type / parentId / path / chapter / description / difficulty / keypoint / literacy / application / tags / category / pre / post / related / degree / sourceRow`。详见 [数据转换接口说明](docs/03_数据转换接口说明.md)。

## 六、与超星格式的兼容范围（明确边界）

### ✅ 完全兼容（文件级无损往返）
- 新版 **16 列** `.xlsx` / `.csv` 的读取与写出，复刻模板第 1 行使用说明、第 2 行表头、`Sheet3` 工作表名；
- A—G 层级、H—J 关系、K 节点类型、L 节点描述、M—P 四属性；
- 模板硬约束：名称 ≤256、节点 ≤5000、关系 ≤2000、标签 ≤1000、知识点无子级、任意两节点仅一种关系、难易程度 5 枚举、知识单元 M—P 留空。

### ⚠️ 经转换接口兼容（有损，逐项列明）
- 旧版 **15 列 ↔ 新版 16 列 ↔ 统一 JSON**：`分类 ⇄ 知识单元`；标签仅重点/难点可写入「重难点」；知识点分类无对应列；难易程度/专业素养/应用能力在旧版缺失；
- 空引用、自引用、重复关系的清洗（保留警告清单）；
- 标签体系与知识点分类保存在统一数据扩展字段，不写回 xlsx。

### ❌ 不在兼容范围
- 超星**在线 API**、账号权限、课程绑定、资源/习题挂接、审核发布（请到平台后台完成）；
- 图片、公式、附件、视频；学习行为数据、平台内渲染样式；7 级以上层级、跨课程合并。

完整逐列对照见 [02_超星兼容范围与字段映射.md](docs/02_超星兼容范围与字段映射.md)。

## 七、字段映射速览（16 列 → 统一数据）

| 超星列 | 表头 | 统一数据字段 |
| --- | --- | --- |
| A—G | 一~七级知识节点 | `level` + `name` + `parentId` + `path` |
| H / I / J | 前置 / 后置 / 关联知识节点 | `edges(relation=前置/后置/关联)` |
| K | 节点类型 | `type`（知识单元 / 知识点） |
| L | 节点描述 | `description` |
| M / N / O / P | 难易程度 / 重难点 / 专业素养 / 应用能力 | `difficulty / keypoint / literacy / application` |
| — | 新版无对应列 | `tags[] / category / sourceRow`（仅本项目保留） |

旧版 15 列整体右移一列：A 为节点类型，B—H 为层级，I—K 为关系，L 标签，M 知识点分类，N 节点说明。**关系列只按英文分号切分**（节点名可能含顿号，如「基、基变量、非基变量的概念」）。

## 八、示例文件清单

| 文件 | 用途 |
| --- | --- |
| `data/source/01-知识图谱-运筹学-7章全部.xlsx` | 用户上传原件只读副本（旧版 15 列） |
| `data/chaoxing/示例_超星16列导入.xlsx` | 可直接拿去超星后台导入的 16 列示例 |
| `data/chaoxing/示例_超星16列导出.csv` | 由统一数据反向生成，验证 16 列往返一致 |
| `data/chaoxing/示例_超星15列导出.csv` | 由统一数据反向生成，验证 15 列转换 |
| `data/chaoxing/template-notes.json` / `.js` | 两套模板第 1/2 行原文（导出时原样复刻） |
| `data/course-kg.json` / `.js` | 统一课程图谱数据 |

## 九、GitHub 模板（星标数为 2026-11-10 GitHub API 实测值）

| 模板 | 星标 | 许可证 | 特色展示形式 | 演示页 |
| --- | --- | --- | --- | --- |
| d3/d3 | 113,892 | ISC | 力导向网络、参数可调、视觉映射 | `demos/d3-force.html` |
| mermaid-js/mermaid | 91,056 | MIT | 图谱即文本、subgraph、classDef | `demos/mermaid-flow.html` |
| apache/echarts | 67,697 | Apache-2.0 | 多布局切换、图例筛选、邻接聚焦 | `demos/echarts-graph.html` |
| jackyzha0/quartz | 13,558 | MIT | 全局/局部图谱、反向链接、悬停卡片 | `demos/quartz-graph.html` |
| markmap/markmap | 13,229 | MIT | Markdown 大纲 → 可折叠导图 | `demos/markmap-outline.html` |

D3 / ECharts / Mermaid 演示使用本地化的真实库；Quartz / markmap 因需 Node 构建或运行时 CDN，以本地 D3 **复刻其展示范式**并在页面标注，原始仓库完整保留。筛选过程、下载凭证与许可证路径见 [01_GitHub模板调研.md](docs/01_GitHub模板调研.md) 与 `templates/PROVENANCE.md`。

## 十、复现与校验

```bash
python tools/build_data.py     # 从两份超星 xlsx 重建统一数据 + 示例 CSV
python tools/verify.py         # 21 项静态自检，生成 docs/04_一致性校验记录.md
node tools/test_converter.js    # 22 项转换接口自动化测试，生成 docs/05_转换接口测试记录.md
python tools/runtime_probe.py  # Chrome headless 逐页检查，生成 docs/06_浏览器运行时校验记录.md
python tools/serve.py          # 启动 http://127.0.0.1:8765/
```

**三层校验当前结果：21/21 静态 · 22/22 接口 · 16/16 页零 JS 错误。**

| 层次 | 覆盖内容 |
| --- | --- |
| `verify.py` | 数据完整性、JSON/JS 同源、16 列往返逐格一致、15 列结构一致、模板原文提取、全站页面同源、无运行时外链、本地链接可达、5 个原始模板与许可证齐备 |
| `test_converter.js` | 11 项模板硬约束、16 列 xlsx → 统一数据 → 16 列无损往返、15 列旧版解析与有损字段清单、接口输出与 Python 示例逐格一致 |
| `runtime_probe.py` | 启动临时本地服务并注入错误捕获，用 Chrome headless `--dump-dom` 逐页加载 16 个 HTML，检查 `window.onerror` 与 `unhandledrejection` |

> `runtime_probe.py` 需要本机安装 Chrome；探针注入与临时浏览器 profile 均在内存/系统临时目录完成，不修改任何交付文件。端口冲突时可用 `PROBE_PORT=8770 python tools/runtime_probe.py`。

## 十一、边界与声明

- 本项目是**教学演示用静态站点**：无后端、无数据库、无真实登录鉴权；导入导出全在浏览器内存完成，不产生网络请求、不上传数据。
- 与超星平台的对接是**文件级**（xlsx/csv），不是在线 API 同步；课程绑定与发布请在超星后台完成。
- 课程语料为教学内容数据；原始模板版权归各仓库作者，许可证原文见 `templates/*/LICENSE*`，本项目仅按许可证要求保留与引用，未修改原始文件。
- 本系统所有展示页面固定读取 `data/course-kg.js`；导入功能用于校验与生成超星文件，**不在浏览器内替换展示数据**，以保证各页数据一致。若需更换基础数据，请覆盖 `data/` 下文件并重跑 `tools/build_data.py`（或同步更新 JS 包装）。

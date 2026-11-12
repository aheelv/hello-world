# 模板来源与许可信息

## 选定模板

| 项目 | 内容 |
| --- | --- |
| 名称 | **Simple.css** |
| 仓库 | https://github.com/kevquirk/simple.css |
| 官网 | https://simplecss.org |
| 作者 / 版权 | Kev Quirk（Copyright (c) 2020 Simple.css (Kev Quirk)） |
| 许可证 | **MIT License** |
| 许可全文 | 本站随附 [`LICENSE-Simple.css.txt`](LICENSE-Simple.css.txt) |
| 实际采用的文件 | `assets/simple.css`（模板原版，未改动，14,086 B） |

## 为什么选它

1. **多站点集合适配**：基于语义化 HTML（header / nav / main / section / article / footer）与 CSS 变量体系，适合承载分类分组、卡片网格与锚点导航，不预设业务结构。
2. **依赖极轻**：仅一个 CSS 文件，无 JavaScript 框架、无构建步骤、无 CDN、无字体外链、无追踪脚本；本站全部资源自包含。
3. **许可清晰**：MIT 允许使用、复制、修改、合并、发布、分发与商用，唯一条件是保留版权声明与许可声明 —— 已通过随附许可全文与首页页脚署名满足。
4. **结构清晰**：模板本身是 classless 语义模板；本站 `index.html` 使用其语义骨架，`assets/portal.css` 只做变量覆盖与门户组件，`assets/portal.js` 只做搜索增强（禁用 JS 时页面内容仍完整可见）。
5. **开箱响应式与明暗主题**：模板自带 `prefers-color-scheme` 与响应式规则，本站扩展部分同样覆盖桌面、手机竖屏/横屏与 320px 小屏。

## 筛选时对比过但未采用的候选

| 候选 | 许可 | 未采用原因 |
| --- | --- | --- |
| WebStackPage/WebStackPage.github.io（纯静态网址导航） | MIT（Copyright 2017 DesignStack） | 版式最贴近网址集合，但仓库 320 个文件，依赖 Bootstrap + Xenon 多套 CSS + jQuery + TweenMax + 3 套图标字体，主页面 275 KB 且含广告与统计脚本，与「依赖轻量」冲突；仅参考其「分类分组 + 卡片」的信息架构，未复制任何代码。 |
| sergio-arreola/link-in-bio-clone | MIT（Copyright 2025 Sergio） | 配置驱动、零依赖，但版式为 480px 单列个人链接页，不适合数十个独立网页的分类集合；仅参考其「单一数据源」思路。 |
| p32929/link_in_bio | MIT（Copyright Fayaz Bin Salam） | 单文件 + 一个 JSON 对象驱动，但样式依赖 Tailwind CDN，离线与零外链要求不满足。 |
| scottglshields/classlesscss | MIT | 同为单文件 classless 方案，但仓库主分支 CSS 文件未能稳定获取，社区活跃度低于 Simple.css。 |

以上候选仅用于选型对比，**本站不包含其任何源码或素材**。

## 本站自有内容

- `index.html`、`assets/portal.css`、`assets/portal.js`、`assets/sites.json`、`README.md`、本文件：为本次生成的门户层。
- 其余原有子页与资源：来自 `aheelv/hello-world` 已发布内容，逐字节复制，保持原有内容、相对路径与访问入口不变。
- `research-writing/`：新增挂载站点「科研论文写作与发表 · 循证教程」，由本地 `dist/` 目录 17 个文件逐字节复制。该站点自带两套 CSS、两个数据／渲染脚本与 12 个页面，站内引用全部为同级相对路径，未改动任何字节、未引入外部静态依赖。
- `legacy-index.html`：改造前原版首页的完整归档副本。

MIT 许可声明按要求保留：Copyright (c) 2020 Simple.css (Kev Quirk)。

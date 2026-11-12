# 数字资源中心 · 站点合集

一个可直接发布的**完整纯静态站点**：新版门户首页 + 全部挂载子页 + 全部依赖资源。
零构建、零 CDN、零外部依赖；双击 `index.html` 即可浏览，也可整目录部署到任意静态托管。

## 目录结构

```
portal-site/                     ← 静态站点根目录（整个目录发布即可）
├── index.html                   门户首页（基于 Simple.css 模板生成）
├── legacy-index.html            原版首页归档（原有板块与链接完整保留）
├── assets/
│   ├── simple.css               模板原版 CSS（MIT，未改动）
│   ├── portal.css               门户版式扩展
│   ├── portal.js                搜索增强（渐进增强，禁用不影响内容）
│   ├── sites.json               条目机器可读清单（与首页同源，用于校验/批量维护）
│   ├── site-responsive.css      原有全站移动端适配补丁（子页依赖）
│   └── site-responsive.js
├── research-writing/            新增挂载站点：科研写作与发表教程（dist/ 原样复制，17 文件）
├── agents/  research/  library/  ai-reading-notes/  …   ← 全部原有子页与资源（逐字节复制）
├── CREDITS.md                   模板来源与许可信息
├── LICENSE-Simple.css.txt       MIT 许可全文（模板要求保留）
└── README.md                    本文件
```

## 如何发布

- **GitHub Pages**：把 `portal-site/` 内的全部文件提交到仓库根目录（或把该目录设为 Pages 的发布根），开启 Pages 即可。
- **任意静态托管 / Nginx / 对象存储**：把 `portal-site/` 整个目录作为站点根上传即可，无需安装依赖、无需构建。
- 所有链接均为相对路径；子页原有的「返回资源中心」链接会自动指向新的门户首页，原有页面之间的相互跳转保持不变。
- `research-writing/` 是整体挂载的独立静态站：其 12 个页面与 `assets/`、`data/` 资源均使用**同级相对路径**，不含 `<base>`、绝对路径或动态 fetch，因此挂到子目录后无需改写任何路径；`build-info.json` 一并随站发布。

## 如何新增一个挂载页（只需在首页追加一条）

1. 把新页面文件（及其依赖）放进站点内合适的目录，例如 `research/my-new-page.html`。
2. 打开 `index.html`，找到对应分类的 `<section class="pgroup" id="g-…">`，在其 `<div class="pgrid">` 末尾追加下面这段（复制相邻卡片改 4 处文字与链接即可）：

```html
<article class="pcard" data-search="页面名称 简述关键词 标签 路径">
  <h3>页面名称</h3>
  <p class="desc">一句话内容简述，说明这个页面讲什么、能做什么。</p>
  <div class="tags"><span class="tag">标签一</span><span class="tag">标签二</span></div>
  <a class="pbtn" href="research/my-new-page.html">打开页面 <span class="arrow">→</span></a>
  <span class="path">research/my-new-page.html</span>
</article>
```

3. 完成。卡片网格使用 `repeat(auto-fill, minmax(...))` 自动排布，**不需要改 CSS、JS 或其他任何页面**，既有子页与整体布局不受影响。
   - 若该页属于原首页入口，可加 `class="pcard has-badge"` 并在卡片内加 `<span class="badge">首页入口</span>`。
   - `data-search` 填上名称、简述、标签与路径，即可被首页搜索命中。
   - 新分类：复制一个 `<section class="pgroup">` 整块，改 `id`、编号与标题，并在顶部 `.groupnav` 增加一个锚点链接。

`assets/sites.json` 是与首页条目一一对应的机器可读清单，可用于核对或批量维护；
日常新增**只需追加上面的 HTML 片段**，无需运行任何脚本或构建命令。

## 条目规则

- 每个挂载页都有：页面名称、内容简述、标签、醒目的「打开页面 →」按钮与相对路径。
- 按 11 个主题分组，顶部导航可直接跳转；搜索框按名称 / 简述 / 标签 / 路径即时过滤。
- 首页卡片为静态 HTML，不依赖 JS 渲染；`assets/portal.js` 仅提供搜索与计数。
- 顶部「挂载页 / 分组」数字由 `assets/portal.js` 在页面加载时按实际卡片数自动校正，
  **追加条目后无需修改任何数字**（禁用 JS 时显示的是生成时的初始值，不影响浏览与跳转）。

## 许可

门户样式基底为 Simple.css（MIT）。详见 [`CREDITS.md`](CREDITS.md) 与
[`LICENSE-Simple.css.txt`](LICENSE-Simple.css.txt)；首页页脚亦注明来源。

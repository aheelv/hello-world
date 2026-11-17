# 通用学习网站模板 · 复用指南

> 本项目既是《统计分析自学系统》，也是一套**可迁移的通用学习网站模板**。
> 用同一套架构可以快速生成「大数据学习网站」「人工智能学习网站」「任何方向的自学站」，
> 保持外观、交互、导航、搜索、进度、公式渲染完全一致。

> **版本提示**：本站已升级到 v3（六阶段数据驱动 + 教材级学习闭环），下方第一、二节的目录树为 v1 时期的形态，
> 仅用于说明分层思想。**当前真实结构、数据字段与构建顺序请以 `DATA-GUIDE.md` 第 1、6、9 节为准**；
> 章节应达到的教材级规范以 `CHAPTER-SPEC.md` 为准，深度内容写法以 `WRITER-BRIEF.md` 为准。
> 迁移到新方向时，除改 `data/core.json` 外，还需为新章节建立 `data/learning.json` 条目与 `data/fragments/mNN.html`，
> 并按需重绘 `build-figures.py` 中的图示定义与 `case-data.py` 中的贯穿案例。

---

## 一、架构总览

```
站点根目录/
├── index.html                  # 首页（Hero + 阶段卡片 + 模块卡片）
├── roadmap.html                # 学习路线图（阶段详解 + 检验标准）
├── resources.html              # 资料库
├── glossary.html               # 术语表
├── modules/                    # 章节内容（每章一个 HTML）
│   └── m01-data.html  …  m10-ai-stats.html
├── assets/
│   ├── css/
│   │   ├── tokens.css          # ★ 设计令牌（换主题只改这里）
│   │   ├── base.css            # 基础排版
│   │   ├── layout.css          # 布局（顶栏/侧栏/TOC/响应式）
│   │   └── components.css      # 组件（卡片/例题/提示框/公式框…）
│   ├── js/
│   │   ├── config.js           # ★ 站点配置（换方向主要改这里）
│   │   ├── app.js              # 通用壳逻辑（与学科无关）
│   │   ├── search-index.js     # 生成的搜索索引（勿手改）
│   │   └── build-search-index.py  # 索引生成脚本
│   └── vendor/katex/           # 离线公式渲染引擎（含 60 个字体文件）
└── TEMPLATE-GUIDE.md           # 本文档
```

**四层分离原则**：

| 层 | 文件 | 职责 | 换方向时是否要改 |
|---|---|---|---|
| 配置层 | `assets/js/config.js` | 站点名、阶段、模块清单、导航 | **必改** |
| 内容层 | `modules/*.html`、各顶层页面 | 知识正文 | **重写** |
| 样式层 | `assets/css/tokens.css` | 颜色、字体、间距 | 可选（换配色） |
| 行为层 | `assets/js/app.js` | 导航/搜索/进度/公式/主题 | 一般不改 |

---

## 二、改造为「大数据 / 人工智能」等新站点（5 步）

### 第 1 步：改配置 `assets/js/config.js`

```js
window.SITE_CONFIG = {
  site: {
    name: "大数据自学系统",          // 站点名（顶栏、页脚自动同步）
    short: "数据",
    tagline: "从零到数据智能",
    ...
  },
  stages: [ /* 改成你的阶段划分，每阶段绑定模块 id */ ],
  modules: [
    {
      id: "m01",                     // 与 body[data-page] 一致
      num: "01",
      title: "分布式计算基础",        // 章节标题
      level: "入门",
      levelKey: "lv-intro",          // 徽章配色：lv-intro/base/mid/adv/ai
      hours: "8 学时",
      href: "modules/m01-data.html", // 章节文件路径（相对站点根）
      desc: "…",
      tags: ["Hadoop", "Spark"],
      prereq: "…",
      goals: ["…"]
    },
    ...
  ],
  extras: [ /* roadmap / resources / glossary */ ]
};
```

侧边栏、首页模块卡片、路线图阶段表会自动读取此配置；**不需要改 app.js**。

### 第 2 步：复制章节骨架

以 `modules/m01-data.html` 为参考实现，复制后替换内容。必须保持的骨架要素：

- `<body data-page="mXX" data-prefix="../">` —— `data-page` 必须等于 `config.js` 中的 `id`
- 五个样式表 + KaTeX 样式的 `<link>` 顺序
- `header` / `sidebar` / `footer` / `search-overlay` / 末尾五个 `<script>`
- `.module-header`（crumbs / h1 / lead / module-meta）
- 学习目标 `.callout.tip` + `ul.check-list`
- 例题块 `.example` + `details.solution`
- 结尾 `data-complete-btn="mXX"` 按钮 + `.module-nav`（改上一篇/下一篇链接）

### 第 3 步：更新首页与路线图

- `index.html`：改 hero 文案、统计数字、阶段卡片、模块卡片（可与 config.js 保持一致）
- `roadmap.html`：改阶段详解（时间、目标、检验标准）、学习者画像表

### 第 4 步：重建搜索索引

```bash
cd assets/js
python build-search-index.py
```

（如新增/删除页面，同步修改脚本里的 `PAGES` 列表。）

### 第 5 步：验证

- 双击 `index.html` 离线打开，检查导航、公式、搜索（`Ctrl+K`）、主题切换、进度
- `python -m http.server 8080` 后浏览器访问，检查响应式（缩窄窗口看侧栏抽屉）

---

## 三、公式书写规范（KaTeX）

```html
<p>行内公式用单美元：$P(A\mid B)$，独立公式用双美元：</p>
$$ \hat{\beta}_1 = \frac{S_{xy}}{S_{xx}} $$
```

- 支持标准 LaTeX 数学宏；**不要用** `\tag{}`、`\label{}`、`\eqref{}`
- 中文可写在 `\text{中文}` 内
- 渲染配置在 `app.js` 的 `renderMath()`（delimiters：`$$`、`$`、`\[`、`\(`）
- 全部离线渲染，无 CDN 依赖；若替换为 MathJax 需自行本地化资源

## 四、内容组件速查

| 组件 | 类名 | 用途 |
|---|---|---|
| 提示框 | `.callout.tip/.note/.warn/.danger/.exam/.formula` | 学习目标、提示、易错、练习 |
| 例题 | `.example` > `.example-head` + `.example-body` | 带标签的完整例题 |
| 解答 | `details.solution` > `summary` + `.sol-body` | 折叠式分步解答 |
| 公式框 | `.formula-box`（`.f-name` + `$$` + `.f-note`） | 突出重要公式 |
| 表格 | `.table-wrap > table` | 可横向滚动的表格 |
| 卡片 | `.card` / `.card-grid.two/.three` | 特性、阶段、模块卡片 |
| 算法 | `.algo > .algo-title + .algo-steps` | 分步算法 |
| 时间线 | `.timeline > .tl-item.s1…s5` | 路线图阶段 |
| 徽章 | `.badge.brand/.ok/.warn/.danger/.info/.accent` | 难度、学时标签 |
| 清单 | `ul.check-list` / `.check-list.done` | 学习目标勾选 |
| 进度 | `#stage-progress .pct-bar` + `data-complete-btn` | 学习进度（localStorage） |

## 五、换主题配色

只需改 `assets/css/tokens.css` 顶部变量：

```css
:root {
  --brand-h: 160;      /* 品牌色相（0-360） */
  --brand-s: 70%;      /* 饱和度 */
  --brand-l: 38%;      /* 亮度 */
  --accent: #7c3aed;   /* 强调色 */
  /* 中性色、阴影、圆角、布局宽度等均可调 */
}
```

暗色主题由 `body[data-theme="dark"]` 自动接管（样式内置，用户可切换，选择记入 localStorage）。

## 六、部署与离线

- **纯静态**：无构建步骤、无服务端、无外部请求（字体/脚本/公式全本地）
- **离线**：直接双击 `index.html` 即可全功能使用
- **部署**：整个目录上传任意静态托管（Nginx / GitHub Pages / 对象存储 / 内网文件服务器）
- **打印**：内置打印样式，可导出 PDF（隐藏侧栏/顶栏）

## 七、常见问题

**Q：可以删掉某个模块吗？**
可以。从 `config.js` 的 `modules` 与对应 `stages.modules` 中移除，并删除 HTML 文件，再重建搜索索引。首页卡片手动同步。

**Q：如何增加一页「附录」？**
复制任意章节骨架，`data-page` 设为新 id（如 `appendix`），并加进 `config.js` 的 `extras`（`group: "导航"`）。

**Q：搜索为什么有时搜不到刚改的内容？**
`search-index.js` 是静态生成的，改完内容后需重新运行 `build-search-index.py`。

**Q：进度数据存在哪里？**
浏览器 `localStorage`（键名 `done-m01` 等），不上传、不跨浏览器同步。清空浏览器数据会重置。

**Q：想接入统计仿真（如在线跑 A/B 测试模拟器）？**
可新增一个页面引入任意前端计算库（本地化部署）。保持 `body[data-page]` 与壳结构不变即可获得统一导航。

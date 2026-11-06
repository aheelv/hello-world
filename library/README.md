# 我的书库

把读过的书拆成「结构 → 观点 → 引文 → 动作」四层，每本书一个独立页面，统一入口检索、按模块分组。

## 目录结构

```
书库/
├── index.html                 书架首页（入口）
├── assets/
│   ├── books.js               书籍注册表 + 模块分组 ← 新增书只改这里
│   ├── book.css               书籍页共享样式
│   ├── book.js                书籍页渲染引擎（含思维导图布局）
│   ├── shelf.css              书架页样式
│   └── shelf.js               书架页渲染（分组 + 模块筛选）
├── books/
│   ├── _template/             新书模板（复制这个目录）
│   ├── naval-almanack/        《纳瓦尔宝典》                        00 入门读本
│   ├── think-and-grow-rich/   《思考致富》                          00 入门读本
│   ├── poor-charlies-almanack/《穷查理宝典》                        A 认知总纲
│   ├── buffett-letters/       《巴菲特致股东的信》                  A 认知总纲
│   ├── principles/            《原则》                              A 认知总纲
│   ├── antifragile/           《反脆弱》                            B 风险与不确定性
│   ├── noise/                 《噪声》                              C 判断与行为决策
│   ├── influence/             《影响力》                            C 判断与行为决策
│   ├── superforecasting/      《超预测》                            C 判断与行为决策
│   ├── thinking-in-bets/      《对赌》                              C 判断与行为决策
│   ├── asking-the-right-questions/《学会提问》                      D 批判性思维与成长心智
│   └── mindset/               《终身成长》                          D 批判性思维与成长心智
└── README.md
```

每本书的目录里：`index.html`（骨架，全站相同）、`data.js`（本书全部内容）、`manifest.json` + `skill/`（配套实践 Skill，可无）。

## 新增一本书

**第一步**：复制模板

```
books/_template/  →  books/你的书名拼音/
```

**第二步**：改写 `books/你的书名拼音/data.js`

每个字段都有注释。最少需要填：`slug`、`title`、`titleEn`、`author`、`color`、`themes`、`quotes`、`checklist`、`sources`。

**第三步**：在 `assets/books.js` 的 `books` 数组里追加一条，并用 `group` 指定所属模块

```js
{
  slug: 'your-book',            // 必须与目录名一致
  title: '书名',
  titleEn: 'Book Title',
  shortEn: 'SHORT',
  author: '作者',
  color: '#2E5C8A',             // 与 data.js 里的 color 保持一致
  tag: '主题一 · 主题二',
  group: 'c',                   // 对应 groups 里的 id；不填会落到「其它」
  summary: '一句话说明这本书解决什么问题',
  date: '2026-11-01',
  status: 'ready'               // ready 上线；planned 显示为“整理中”
}
```

保存，刷新 `index.html` 即可。以下内容会自动更新，不需要额外配置：

- 书架卡片、模块分区与总统计（主题数、观点数、金句数由 `data.js` 实时计算）
- 顶部的模块筛选按钮与计数
- 书籍页顶部「切换书籍」下拉
- 页脚「上一本 / 下一本」
- 搜索索引

**新增一个模块**：在 `assets/books.js` 的 `groups` 数组里加 `{ id, no, title, desc }`，顺序即展示顺序，筛选按钮自动出现。

## 数据字段

| 字段 | 必填 | 说明 |
|---|:--:|---|
| `slug` | ✓ | 目录名，英文小写连字符 |
| `title` / `titleEn` | ✓ | 中文名 / 英文名 |
| `shortEn` | | 封面上的英文短名 |
| `heroAccent` | | 首屏第二行彩色大字 |
| `author` | ✓ | 作者，`/` 分隔编者与述者 |
| `intro` / `meta` | | 首屏说明文字 / 元信息行 |
| `color` | ✓ | 全书主色（hex），会替换页面强调色与首屏底色 |
| `mapHint` / `footNote` | | 导图说明 / 页脚声明（可含 HTML） |
| `themes` | ✓ | 主题数组，见下 |
| `quotes` | ✓ | 金句数组，`t` 对应 theme.id |
| `checklist` | ✓ | 行动清单，8–12 条 |
| `sources` | ✓ | `{t, u}`，至少 3 条 |
| `reading` | | `{title, note, items:[{h,p}]}` |
| `caution` | | 阅读提示（局限、争议、误传），字符串数组 |

`themes` 单项：

| 字段 | 说明 |
|---|---|
| `id` | 英文标识，用于锚点与金句归类 |
| `no` | 编号，如 `01` |
| `title` | 主题名 |
| `chapter` | 对应章节，显示在标题下 |
| `color` | 该主题色 |
| `side` | `right` / `left`，导图分支在根节点哪一侧 |
| `lead` | 一句导语 |
| `map` | 导图短标签数组，建议 ≤ 10 个汉字、4–6 个 |
| `points` | `{h: 标题, p: 正文, s: 原书小节}` |

## 约定

- **配色**：浅色底，主色从 `#2E5C8A` / `#4A90D9` / `#27AE60` / `#E67E22` / `#D4537E` / `#7F77DD` 中选，避免深色科技风；每本书另有一个专属主色，用于封面与强调。
- **观点**：每条 80–120 字，用自己的话复述，不整段抄原文。
- **引文**：英文必须是原书或作者公开文字，中文标注为译述；无法确证原话的，`src` 里标「（意译）」并在 `caution` 里说明；流传广但非原书的内容放进 `caution`，不要混进金句。
- **来源**：优先官方站、出版社、图书馆书目，至少 3 条。

## 配套 Skill

每本书可另配一个实践 Skill（manifest.json + 用 `book_to_skill` 脚手架生成），副本放在 `books/<slug>/skill/`。Skill 与网页共用同一份 `checklist` 与 `sources`，避免两处说法不一致。

## 说明

各书页面为结构化摘要与少量引文，不是原著全文，也不替代购买正版图书。引文中译仅供理解，正式引用请核对原版。

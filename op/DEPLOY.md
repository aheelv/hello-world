# 部署说明（GitHub Pages · op）

本站为 `aheelv/hello-world` 仓库的 `op/` 子目录，由本地项目
`D:\workbuddy\知识图谱\课程知识图谱系统\` 生成。

## 部署范围

为保证 Pages 站点轻量可维护，本地项目中体积较大的内容**不作为站点文件提交**：

| 未提交内容 | 原因 | 本地保留位置 |
| --- | --- | --- |
| `templates/_zips/*.zip`（5 个原始快照，约 70MB） | 二进制归档，无需浏览器加载 | `data/` 同源项目本地目录 |
| `templates/` 下 d3 / mermaid / echarts / quartz / markmap 完整上游源码（约 130MB） | 仅用于调研留档，运行时不加载 | 同上 |

## 已保留内容

- 16 个 HTML 页面、统一数据（JSON + JS）、全部本地化运行时库、超星示例文件、转换接口、项目文档；
- `templates/PROVENANCE.md` 与 `templates/_zips/download_manifest.json`：模板来源、星标、许可证与下载凭证；
- `templates/echarts/echarts-master/dist/echarts.min.js` 与 `LICENSE`：ECharts 演示页直接引用的原始模板运行时文件，未修改。

原始模板与完整校验链仍以本地项目为准；本目录是面向浏览器访问的只读发布副本。

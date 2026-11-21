# 原始模板下载凭证（Provenance）

> 下载时间：2026-11-10；下载方式：`https://codeload.github.com/{repo}/zip/refs/heads/{branch}`；解压时保持仓库原目录名与内部层级，**未修改任何文件**。
> 原始 ZIP 保留在 `templates/_zips/`，机器可读清单为 `templates/_zips/download_manifest.json`。
> 星标数 / 许可证为同日 `https://api.github.com/repos/{repo}` 实测值，详见 `docs/01_GitHub模板调研.md`。

| 模板 | 仓库 URL | 分支 | 快照提交 SHA（12 位） | 星标数 | 许可证 | ZIP | 解压文件数 | 本地目录 | 许可证原文 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D3 | https://github.com/d3/d3 | `main` | `db118c93a429` | 113,892 | ISC | 0.71 MB | 201 | `d3/d3-main/` | `d3/d3-main/LICENSE` |
| Mermaid | https://github.com/mermaid-js/mermaid | `develop` | `b7080e16a4ae` | 91,056 | MIT | 9.46 MB | 4,885 | `mermaid/mermaid-develop/` | `mermaid/mermaid-develop/LICENSE` |
| ECharts | https://github.com/apache/echarts | `master` | `34f4d927eafe` | 67,697 | Apache-2.0 | 24.88 MB | 2,343 | `echarts/echarts-master/` | `echarts/echarts-master/LICENSE` |
| Quartz | https://github.com/jackyzha0/quartz | `v5` | `beeeed45b82a` | 13,558 | MIT | 12.90 MB | 401 | `quartz/quartz-5/` | `quartz/quartz-5/LICENSE.txt` |
| markmap | https://github.com/markmap/markmap | `master` | `116bd2bdf1e5` | 13,229 | MIT | 0.27 MB | 240 | `markmap/markmap-master/` | `markmap/markmap-master/LICENSE` |

## 特色源文件索引（供进一步查阅）

| 模板 | 关键文件 |
| --- | --- |
| Quartz | `quartz/quartz-5/docs/features/graph view.md`（局部/全局图谱定义）、`docs/features/backlinks.md`、`docs/plugins/Graph.md` |
| Mermaid | `mermaid/mermaid-develop/demos/mindmap.html`、`docs/syntax/mindmap.md`、`e2e/diagrams/mindmap/` |
| ECharts | `echarts/echarts-master/dist/echarts.min.js`（演示页直接引用的运行时文件）、`echarts/echarts-master/test/`（graph/tree 用例） |
| markmap | `markmap/markmap-master/README.md`、`packages/markmap-view/`、`packages/markmap-lib/` |
| D3 | `d3/d3-main/README.md`、`d3/d3-main/package.json`（元包，依赖 `d3-force` / `d3-zoom` 等子包） |

## 本地化运行时库（非原始模板，注明来源）

| 文件 | 来源 | 版本 | 用途 |
| --- | --- | --- | --- |
| `assets/vendor/d3.min.js` | npm `d3@7.9.0/dist/d3.min.js`（jsDelivr） | 7.9.0 | D3 / Quartz / markmap 演示与 `app/graph.html` |
| `assets/vendor/mermaid.min.js` | npm `mermaid@10.9.5/dist/mermaid.min.js`（jsDelivr，UMD） | 10.9.5 | Mermaid 演示 |
| `assets/vendor/xlsx.full.min.js` | npm `xlsx@0.18.5/dist/xlsx.full.min.js`（jsDelivr） | 0.18.5 | 导入导出页读写 xlsx |
| （ECharts 不另复制） | 直接引用 `templates/echarts/echarts-master/dist/echarts.min.js` | 仓库快照 | ECharts 演示 |

> `markmap-autoloader` 运行时会从 CDN 拉取依赖，不适合纯离线交付，因此本项目未采用该加载器；markmap 演示以本地 D3 复刻其展示范式，并在页面与文档中明确标注。

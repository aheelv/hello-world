# -*- coding: utf-8 -*-
"""
生成 GitHub Pages 精简部署副本（aheelv/hello-world/op）。

只复制运行时必需文件，排除 7317 个上游模板源码文件与 5 个 ZIP（约 200MB），
但保留：模板来源凭证、下载清单、ECharts 演示直接引用的 dist/echarts.min.js 及其许可证。

用法：
    python tools/make_deploy.py
    python tools/make_deploy.py --dest "D:/.../hello-world/op"
"""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

SRC = Path(__file__).resolve().parents[1]
DEFAULT_DEST = SRC / "_deploy" / "hello-world" / "op"

ROOT_FILES = ["README.md", "index.html", "启动.bat"]
FULL_DIRS = ["assets", "app", "demos", "docs", "io", "tools", "data"]

TEMPLATE_FILES = [
    "templates/PROVENANCE.md",
    "templates/_zips/download_manifest.json",
    "templates/echarts/echarts-master/dist/echarts.min.js",
    "templates/echarts/echarts-master/LICENSE",
]

DEPLOY_NOTE = """# 部署说明（GitHub Pages · op）

本站为 `aheelv/hello-world` 仓库的 `op/` 子目录，由本地项目
`D:\\workbuddy\\知识图谱\\课程知识图谱系统\\` 生成。

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
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dest", default=str(DEFAULT_DEST))
    args = ap.parse_args()
    dest = Path(args.dest).resolve()

    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)

    for name in ROOT_FILES:
        src = SRC / name
        if src.is_file():
            shutil.copy2(src, dest / name)

    for name in FULL_DIRS:
        src = SRC / name
        if src.is_dir():
            shutil.copytree(src, dest / name)

    for rel in TEMPLATE_FILES:
        src = SRC / rel.replace("/", "\\")
        if not src.is_file():
            raise SystemExit(f"缺少必需文件：{rel}")
        out = dest / Path(rel)
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, out)

    (dest / "DEPLOY.md").write_text(DEPLOY_NOTE, encoding="utf-8")

    files = [p for p in dest.rglob("*") if p.is_file()]
    size = sum(p.stat().st_size for p in files)
    print(f"部署副本：{dest}")
    print(f"文件数：{len(files)}；体积：{size / 1048576:.2f} MB")


if __name__ == "__main__":
    main()

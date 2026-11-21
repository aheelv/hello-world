# -*- coding: utf-8 -*-
"""
浏览器运行时探针（可复跑）。

作用：
1. 在项目根目录启动一个只监听 127.0.0.1 的临时静态服务；
2. 在每个 HTML 响应里注入错误捕获脚本（window.onerror / unhandledrejection）；
3. 用 Chrome headless --dump-dom 逐页加载，读取 DOM 中的探针标记；
4. 生成 docs/06_浏览器运行时校验记录.md。

用法：
    python tools/runtime_probe.py
    PROBE_PORT=8770 python tools/runtime_probe.py     # 端口冲突时换端口

说明：注入与临时 profile 都在内存/系统临时目录中完成，不改动任何交付文件。
"""
from __future__ import annotations

import http.server
import os
import re
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("PROBE_PORT", "8769"))
TIMEOUT = 60

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Users\shiyu\AppData\Local\Google\Chrome\Application\chrome.exe",
]

PROBE_HEAD = (
    "<script>"
    "window.__PROBE_ERRORS__=[];"
    "window.addEventListener('error',function(e){"
    "window.__PROBE_ERRORS__.push('JS: '+String(e.message)+' @'+(e.filename||'')+':'+(e.lineno||0));"
    "},true);"
    "window.addEventListener('unhandledrejection',function(e){"
    "window.__PROBE_ERRORS__.push('REJECT: '+String(e.reason));"
    "});"
    "</script>"
).encode("utf-8")

PROBE_TAIL = (
    '<div id="__probe_result__">PROBE_PENDING</div>'
    "<script>"
    "setTimeout(function(){"
    "var d=document.getElementById('__probe_result__');"
    "if(d){d.textContent=window.__PROBE_ERRORS__.length"
    "?'PROBE_FAIL|'+window.__PROBE_ERRORS__.join(' || ')"
    ":'PROBE_OK|NO_ERRORS';}"
    "},1500);"
    "</script>"
).encode("utf-8")


def inject(raw: bytes) -> bytes:
    m = re.search(rb"<head[^>]*>", raw, re.I)
    if m:
        raw = raw[: m.end()] + PROBE_HEAD + raw[m.end() :]
    else:
        raw = PROBE_HEAD + raw
    m = re.search(rb"</body\s*>", raw, re.I)
    if m:
        raw = raw[: m.start()] + PROBE_TAIL + raw[m.start() :]
    else:
        raw += PROBE_TAIL
    return raw


class ProbeHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):  # noqa: N802
        path = self.translate_path(self.path)
        if path.lower().endswith(".html") and os.path.isfile(path):
            with open(path, "rb") as f:
                body = inject(f.read())
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass
            return
        super().do_GET()

    def log_message(self, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def find_chrome() -> str:
    for p in CHROME_CANDIDATES:
        if Path(p).is_file():
            return p
    for name in ("chrome", "google-chrome", "chromium"):
        p = shutil.which(name)
        if p:
            return p
    raise RuntimeError("未找到 Chrome，请安装 Chrome 或调整 CHROME_CANDIDATES")


def pages():
    return sorted(
        p.relative_to(ROOT).as_posix()
        for p in ROOT.rglob("*.html")
        if "templates" not in p.relative_to(ROOT).parts
    )


def probe_one(chrome: str, profile: str, rel: str):
    url = f"http://127.0.0.1:{PORT}/{rel}"
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--disable-extensions",
        "--disable-background-networking",
        "--user-data-dir=" + profile,
        "--virtual-time-budget=6000",
        "--dump-dom",
        url,
    ]
    try:
        r = subprocess.run(cmd, capture_output=True, timeout=TIMEOUT)
        html = r.stdout.decode("utf-8", "replace")
    except subprocess.TimeoutExpired:
        return "TIMEOUT", f"{TIMEOUT}s 内未返回"
    m = re.search(r"PROBE_(OK|FAIL)\|([^<]*)", html)
    if not m:
        tail = (r.stderr or b"").decode("utf-8", "replace")[-300:].replace("\n", " ")
        return "NO_MARKER", f"探针未执行；Chrome stderr: {tail}"
    return ("OK" if m.group(1) == "OK" else "FAIL"), m.group(2).strip()


def main() -> int:
    chrome = find_chrome()
    httpd = Server(("127.0.0.1", PORT), ProbeHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    profile = tempfile.mkdtemp(prefix="kg-probe-")
    results = []
    try:
        for rel in pages():
            status, detail = probe_one(chrome, profile, rel)
            results.append((rel, status, detail))
            print(f"{'PASS' if status == 'OK' else 'FAIL'} {rel}  | {detail[:160]}")
    finally:
        httpd.shutdown()
        httpd.server_close()
        shutil.rmtree(profile, ignore_errors=True)

    ok = sum(1 for _, s, _ in results if s == "OK")
    lines = [
        "# 浏览器运行时校验记录",
        "",
        f"- 生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"- 生成命令：`python tools/runtime_probe.py`（端口 {PORT}）",
        f"- 浏览器：`{chrome}`，headless `--dump-dom` + `--virtual-time-budget=6000`",
        "- 检查方式：在每个 HTML 响应中注入 `window.onerror` / `unhandledrejection` 捕获脚本，页面加载后由探针写入 DOM 标记",
        f"- 结论：**{ok}/{len(results)} 个页面 JS 运行时零错误**",
        "- 说明：本检查只验证运行时无异常，不替代 `tools/verify.py` 的静态一致性与 `tools/test_converter.js` 的接口测试",
        "",
        "| # | 页面 | 结果 | 详情 |",
        "| --- | --- | --- | --- |",
    ]
    for i, (rel, status, detail) in enumerate(results, 1):
        lines.append(f"| {i} | `{rel}` | {'✅ 通过' if status == 'OK' else '❌ ' + status} | {detail or '—'} |")
    lines += ["", "## 复跑", "", "```bash", "python tools/runtime_probe.py", "```", ""]
    out = ROOT / "docs" / "06_浏览器运行时校验记录.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n{ok}/{len(results)} 个页面零 JS 错误 -> {out.relative_to(ROOT).as_posix()}")
    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())

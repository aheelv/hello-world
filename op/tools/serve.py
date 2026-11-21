# -*- coding: utf-8 -*-
"""本地静态服务：python tools/serve.py  →  http://127.0.0.1:8765/
   仅监听回环地址，不对外暴露；按 Ctrl+C 结束。"""
import http.server
import os
import socketserver
import webbrowser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    os.chdir(ROOT)
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        url = f"http://127.0.0.1:{PORT}/"
        print("课程知识图谱系统已启动：" + url)
        print("按 Ctrl+C 结束。")
        webbrowser.open(url)
        httpd.serve_forever()

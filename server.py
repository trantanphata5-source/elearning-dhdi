import http.server
import socketserver
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js') or path.endswith('.mjs'):
            return 'application/javascript; charset=utf-8'
        if path.endswith('.css'):
            return 'text/css; charset=utf-8'
        if path.endswith('.html'):
            return 'text/html; charset=utf-8'
        if path.endswith('.json'):
            return 'application/json; charset=utf-8'
        return super().guess_type(path)

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

print(f"Starting E-Learning DHDI21AVL Server on http://localhost:{PORT}", flush=True)

with ThreadedTCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()

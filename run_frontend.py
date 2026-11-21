#!/usr/bin/env python3
"""
SentinelAI Multi-Threaded Frontend Server
Serves frontend_dist/ with SPA fallback and multi-threading for Chrome/Edge.
"""

import http.server
import os
import sys
import webbrowser
from pathlib import Path

PORT = 5173
DIRECTORY = Path(__file__).parent / "frontend_dist"

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def do_GET(self):
        clean_path = self.path.split('?')[0].split('#')[0].lstrip('/')
        target = (DIRECTORY / clean_path).resolve()
        
        # If requested path doesn't point to an existing file, serve index.html
        if not target.is_file():
            self.path = "/index.html"
            
        return super().do_GET()

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

def main():
    if not DIRECTORY.exists():
        print(f"Error: Frontend build directory not found at {DIRECTORY}")
        sys.exit(1)

    print("=" * 60)
    print("   🛡️  SENTINELAI MULTI-THREADED FRONTEND SERVER")
    print("=" * 60)
    print(f"✓ Frontend Server: http://127.0.0.1:{PORT}")
    print(f"✓ Connected to Backend API: http://127.0.0.1:8000")
    print(f"✓ Multi-threaded request handling enabled")
    print(f"✓ Press Ctrl+C to stop the server")
    print("=" * 60)

    # Use ThreadingHTTPServer so Chrome's concurrent asset requests never hang
    server_address = ("127.0.0.1", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, SPAHandler)
    httpd.daemon_threads = True

    try:
        print(f"\n[INFO] Opening browser at http://127.0.0.1:{PORT} ...")
        try:
            webbrowser.open(f"http://127.0.0.1:{PORT}")
        except Exception:
            pass
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Frontend server stopped.")
    except Exception as e:
        print(f"\n[ERROR] Server failed: {e}")

if __name__ == "__main__":
    main()

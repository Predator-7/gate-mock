#!/usr/bin/env python3
"""
GATE Civil Engineering Mock Exam Platform - Local Server
Serves static files and provides automatic persistence to userData.json.
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.parse
from datetime import datetime, timezone

PORT = int(os.environ.get("PORT", 8080))
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
USER_DATA_FILE = os.path.join(ROOT_DIR, "userData.json")

DEFAULT_USER_DATA = {
    "profile": None,
    "mockHistory": [],
    "practiceHistory": [],
    "attempts": {},
    "updatedAt": None
}

def get_or_init_user_data():
    try:
        if not os.path.exists(USER_DATA_FILE):
            with open(USER_DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_USER_DATA, f, indent=2)
            return DEFAULT_USER_DATA
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[server.py] Error reading userData.json: {e}")
        return DEFAULT_USER_DATA

def write_user_data(data):
    tmp_file = USER_DATA_FILE + ".tmp"
    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp_file, USER_DATA_FILE)

class GateRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/user-data":
            data = get_or_init_user_data()
            payload = json.dumps(data).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if parsed.path == "/api/health":
            payload = json.dumps({"ok": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/user-data":
            content_length = self.headers.get("Content-Length") or self.headers.get("content-length")
            if content_length:
                length = int(content_length)
                if length > 50 * 1024 * 1024:
                    self.send_response(413)
                    self.end_headers()
                    return
                body = self.rfile.read(length).decode("utf-8")
            elif self.headers.get("Transfer-Encoding", "").lower() == "chunked":
                body_parts = []
                while True:
                    line = self.rfile.readline().strip()
                    if not line:
                        break
                    chunk_size = int(line, 16)
                    if chunk_size == 0:
                        self.rfile.readline()
                        break
                    body_parts.append(self.rfile.read(chunk_size).decode("utf-8"))
                    self.rfile.readline()
                body = "".join(body_parts)
            else:
                body = ""

            try:
                data = json.loads(body)
                data["updatedAt"] = datetime.now(timezone.utc).isoformat()
                write_user_data(data)
                resp = json.dumps({"ok": True, "updatedAt": data["updatedAt"]}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                import traceback
                traceback.print_exc()
                resp = json.dumps({"ok": False, "error": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
            return

        self.send_response(404)
        self.end_headers()

def run():
    os.chdir(ROOT_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), GateRequestHandler) as httpd:
        print("\n==================================================")
        print(f"🚀 GATE Mock Server running with persistent file storage")
        print(f"👉 Open http://localhost:{PORT} in your browser")
        print(f"📁 User data will be automatically saved to: userData.json")
        print("==================================================\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    run()

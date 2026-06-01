"""
Servidor local para Finanzas personal.
- Sirve los archivos estáticos (HTML, JSX)
- Persiste los datos en finanzas_data.json
- Sin dependencias externas (solo stdlib de Python)

Uso:
    python server.py
    → abre http://localhost:8765 automáticamente
"""

import json
import os
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8765
DATA_FILE = os.path.join(os.path.dirname(__file__), "finanzas_data.json")
STATIC_DIR = os.path.dirname(__file__)

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".jsx":  "application/javascript; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png":  "image/png",
    ".ico":  "image/x-icon",
}


class Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        # Silenciar logs de acceso excepto errores
        if args and len(args) >= 2 and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)

    # ------------------------------------------------------------------ GET
    def do_GET(self):
        path = self.path.split("?")[0]  # quitar query strings

        # API: devuelve datos guardados
        if path == "/api/db":
            self._send_json_file()
            return

        # Página raíz → Finanzas.html
        if path in ("/", "/index.html"):
            path = "/Finanzas.html"

        file_path = os.path.join(STATIC_DIR, path.lstrip("/").replace("/", os.sep))

        if not os.path.isfile(file_path):
            self._send(404, "text/plain", b"404 Not found")
            return

        ext = os.path.splitext(file_path)[1].lower()
        mime = MIME.get(ext, "application/octet-stream")
        with open(file_path, "rb") as f:
            content = f.read()
        self._send(200, mime, content)

    # ----------------------------------------------------------------- POST
    def do_POST(self):
        if self.path == "/api/db":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                with open(DATA_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                self._send(200, "application/json", b'{"ok":true}')
            except Exception as e:
                self._send(500, "application/json", json.dumps({"error": str(e)}).encode())
            return

        self._send(404, "text/plain", b"Not found")

    # ----------------------------------------------------------------- CORS
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    # ---------------------------------------------------------------- utils
    def _send(self, code, content_type, body: bytes):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache")

    def _send_json_file(self):
        if os.path.isfile(DATA_FILE):
            with open(DATA_FILE, "rb") as f:
                body = f.read()
            self._send(200, "application/json; charset=utf-8", body)
        else:
            # Primera vez: no hay datos guardados → el frontend usará su seed
            self._send(404, "application/json", b'{"error":"no data"}')


def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")


if __name__ == "__main__":
    server = HTTPServer(("localhost", PORT), Handler)
    print(f"")
    print(f"  FinanzasOS arriba en:  http://localhost:{PORT}")
    print(f"  Datos guardados en:    finanzas_data.json")
    print(f"  Ctrl+C para cerrar")
    print(f"")
    # Abrir navegador después de 0.8s (dar tiempo al servidor de arrancar)
    threading.Timer(0.8, open_browser).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor cerrado.")

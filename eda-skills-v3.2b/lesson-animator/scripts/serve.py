#!/usr/bin/env python3
"""Local preview server that answers partial downloads (Range), like GitHub Pages does.

  python3 serve.py docs 8090        # then open http://127.0.0.1:8090/

`python3 -m http.server` does not: with it a browser cannot jump inside the audio (the lesson snaps back to 0:00
when you drag the bar, pick a chapter or switch language). Use this one to look at lessons and the player.
"""
import http.server, os, re, sys
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        rng = self.headers.get("Range"); path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path): return super().send_head()
        size = os.path.getsize(path); m = re.match(r"bytes=(\d*)-(\d*)", rng)
        a = int(m.group(1) or 0); b = int(m.group(2)) if m.group(2) else size - 1; b = min(b, size - 1)
        f = open(path, "rb"); f.seek(a)
        self.send_response(206); self.send_header("Content-Type", self.guess_type(path)); self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {a}-{b}/{size}"); self.send_header("Content-Length", str(b - a + 1)); self.end_headers()
        self._left = b - a + 1; return f
    def copyfile(self, src, dst):
        left = getattr(self, "_left", None)
        if left is None: return super().copyfile(src, dst)
        dst.write(src.read(left)); self._left = None
os.chdir(sys.argv[1]); http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[2])), H).serve_forever()

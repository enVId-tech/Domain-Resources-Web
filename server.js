// Minimal static file server (no dependencies). Used by the Dockerfile; any other static host works too.
// - Serves ./out (the output of `next build`)
// - Clean URLs: /foo -> foo.html, /dir -> dir/index.html
// - Any miss returns out/404.html with a real 404 status
// - /error shows the error page (status 200), handy for testing
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, process.env.ROOT || "out");
const PORT = Number(process.env.PORT) || 3090;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8"
};

const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

// Resolve a URL path to a real file inside ROOT, or null.
function resolveFile(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return null; }
  if (decoded.includes("\0")) return null;

  const base = path.join(ROOT, path.normalize(decoded));
  if (base !== ROOT && !base.startsWith(ROOT + path.sep)) return null; // path traversal

  const candidates = [base, base + ".html", path.join(base, "index.html")];
  for (const file of candidates) {
    try {
      if (fs.statSync(file).isFile()) return file;
    } catch { /* try next */ }
  }
  return null;
}

function send(req, res, file, status) {
  const ext = path.extname(file).toLowerCase();
  const headers = {
    ...SECURITY,
    "Content-Type": TYPES[ext] || "application/octet-stream",
    // links.json and pages are re-read every request so edits show up on refresh.
    "Cache-Control": ext === ".html" || ext === ".json" ? "no-cache" : "public, max-age=3600"
  };
  const stat = fs.statSync(file);
  headers["Content-Length"] = stat.size;
  res.writeHead(status, headers);
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", ...SECURITY });
    return res.end();
  }

  const { pathname } = new URL(req.url, "http://localhost");
  const errorPage = path.join(ROOT, "404.html");

  if (pathname === "/error") return send(req, res, errorPage, 200);

  const file = resolveFile(pathname);
  if (file) return send(req, res, file, 200);
  return send(req, res, errorPage, 404);
});

server.listen(PORT, "0.0.0.0", () => console.log(`Serving ${ROOT} on :${PORT}`));

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}

#!/usr/bin/env node
/**
 * Local dev: static files + /api/weather (same handler as Vercel).
 * Plain `serve` cannot run serverless routes; this matches production so weather works.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

function loadDotEnv() {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}

loadDotEnv();

const weatherHandler = require(path.join(root, "api", "weather.js"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".gpx": "application/gpx+xml",
  ".map": "application/json",
};

/** Vercel serverless uses res.status(n).json() / .end(); Node http does not. */
function wrapVercelResponse(nodeRes) {
  return {
    setHeader(name, value) {
      nodeRes.setHeader(name, value);
    },
    status(code) {
      nodeRes.statusCode = code;
      return {
        json(body) {
          if (!nodeRes.headersSent) {
            nodeRes.setHeader("Content-Type", "application/json; charset=utf-8");
          }
          nodeRes.end(JSON.stringify(body));
        },
        end(chunk) {
          nodeRes.end(chunk == null ? "" : chunk);
        },
      };
    },
  };
}

function safeFilePath(urlPathname) {
  const rel = urlPathname === "/" ? "index.html" : urlPathname.replace(/^\/+/, "");
  if (rel.includes("\0")) return null;
  const resolved = path.resolve(root, rel);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    return null;
  }
  return resolved;
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  try {
    const host = nodeReq.headers.host || "localhost";
    const url = new URL(nodeReq.url || "/", `http://${host}`);

    if (url.pathname === "/api/weather") {
      const mockReq = {
        method: nodeReq.method || "GET",
        query: Object.fromEntries(url.searchParams),
      };
      const res = wrapVercelResponse(nodeRes);
      try {
        await weatherHandler(mockReq, res);
      } catch (e) {
        if (!nodeRes.headersSent) {
          nodeRes.statusCode = 500;
          nodeRes.setHeader("Content-Type", "application/json; charset=utf-8");
          nodeRes.end(JSON.stringify({ error: "Weather handler failed", message: String(e?.message || e) }));
        }
      }
      return;
    }

    if (nodeReq.method !== "GET" && nodeReq.method !== "HEAD") {
      nodeRes.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      nodeRes.end("Method not allowed");
      return;
    }

    const filePath = safeFilePath(url.pathname);
    if (!filePath) {
      nodeRes.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      nodeRes.end("Forbidden");
      return;
    }

    fs.stat(filePath, (err, st) => {
      if (err || !st.isFile()) {
        nodeRes.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        nodeRes.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      nodeRes.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      nodeRes.setHeader("Cache-Control", "no-store");
      if (nodeReq.method === "HEAD") {
        nodeRes.writeHead(200);
        nodeRes.end();
        return;
      }
      const stream = fs.createReadStream(filePath);
      stream.on("error", () => {
        if (!nodeRes.headersSent) nodeRes.writeHead(500);
        nodeRes.end("Error reading file");
      });
      nodeRes.writeHead(200);
      stream.pipe(nodeRes);
    });
  } catch (e) {
    if (!nodeRes.headersSent) {
      nodeRes.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    nodeRes.end(String(e && e.message ? e.message : e));
  }
});

const port = parseInt(String(process.env.PORT || "8765"), 10) || 8765;
server.listen(port, () => {
  const keyOk = Boolean((process.env.GOOGLE_MAPS_API_KEY || "").trim());
  console.log(`Dev server http://127.0.0.1:${port}/  (static + /api/weather)`);
  if (!keyOk) {
    console.warn("GOOGLE_MAPS_API_KEY is empty — set .env and run npm run build for Maps + weather.");
  }
});

const http = require("http");

const PROXY_PORT = 8080;
const TARGET_HOST = "localhost";
const TARGET_PORT = 3000;
const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : "normal";
const validModes = new Set(["normal", "breach"]);

if (!validModes.has(mode)) {
  console.error(`[Proxy] Unsupported mode "${mode}". Use "normal" or "breach".`);
  process.exit(1);
}

function logInterceptedCookie(req) {
  if (mode !== "breach") {
    return;
  }

  console.log(
    `[Proxy][Breach] ${req.method} ${req.url} Cookie: ${req.headers.cookie || "(none)"}`
  );
}

const server = http.createServer((req, res) => {
  logInterceptedCookie(req);

  const proxyReq = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: `${TARGET_HOST}:${TARGET_PORT}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (error) => {
    console.error("[Proxy] Upstream request failed:", error.message);

    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    }

    res.end("Proxy error");
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(
    `Proxy running on http://localhost:${PROXY_PORT} -> http://${TARGET_HOST}:${TARGET_PORT} (mode=${mode})`
  );
  console.log(
    `Tip: if your browser treats localhost as secure, verify the Secure-flag demo at http://127.0.0.1.nip.io:${PROXY_PORT}`
  );
});

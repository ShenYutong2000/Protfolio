// Local-only test proxy: deterministic cold loads and recoverable asset failures.
// Run beside `next start --port 3100`; optional settings in .study-qa.json.
import http from "node:http";
import fs from "node:fs";

http.createServer((request, response) => {
  let settings = {};
  try { settings = JSON.parse(fs.readFileSync(".study-qa.json", "utf8")); } catch {}
  const url = new URL(request.url, "http://localhost:3120");
  const asset = url.pathname.startsWith("/models/study/") || url.pathname.startsWith("/assets/study-");
  const run = () => {
    if (settings.fail?.includes(url.pathname) && (!settings.recoverOnRetry || !url.searchParams.has("study-attempt"))) {
      response.writeHead(503, { "Cache-Control": "no-store" }); response.end("Simulated asset failure"); return;
    }
    const headers = { ...request.headers, host: "localhost:3100", "accept-encoding": "identity" };
    delete headers["if-none-match"]; delete headers["if-modified-since"];
    const upstream = http.request({ hostname: "127.0.0.1", port: 3100, path: request.url, method: request.method, headers }, (incoming) => {
      const responseHeaders = { ...incoming.headers, "cache-control": "no-store" };
      if ((settings.noWebGL || settings.reducedMotion) && incoming.headers["content-type"]?.includes("text/html")) {
        delete responseHeaders["content-length"];
        let body = "";
        incoming.setEncoding("utf8"); incoming.on("data", (chunk) => { body += chunk; });
        incoming.on("end", () => {
          const script = settings.noWebGL
            ? `<script>const originalContext = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/i.test(type) ? null : originalContext.call(this, type, ...args); };</script>`
            : `<script>const originalMatchMedia = window.matchMedia.bind(window); window.matchMedia = (q) => originalMatchMedia(q === '(prefers-reduced-motion: reduce)' ? 'all' : q);</script>`;
          response.writeHead(incoming.statusCode, responseHeaders); response.end(body.replace("<head>", "<head>" + script));
        });
      } else { response.writeHead(incoming.statusCode, responseHeaders); incoming.pipe(response); }
    });
    upstream.on("error", () => { response.writeHead(502); response.end("Start the local production server on port 3100."); });
    request.pipe(upstream);
  };
  if (asset && settings.delayMs) setTimeout(run, settings.delayMs); else run();
}).listen(3120, "127.0.0.1", () => console.log("Study QA proxy: http://127.0.0.1:3120"));

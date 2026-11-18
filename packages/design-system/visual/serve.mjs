// Serves the built Storybook (storybook-static/) for the visual tests (Task 2.3b). A few lines of
// node:http instead of a dependency: GET only, files under the folder only, no directory listing.
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import process from "node:process";
import { URL } from "node:url";

const ROOT = resolve(import.meta.dirname, "../storybook-static");
const PORT = Number(process.argv[2] ?? "6106");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  const file = normalize(join(ROOT, pathname === "/" ? "index.html" : pathname));
  if (request.method !== "GET" || !file.startsWith(ROOT + sep)) {
    response.writeHead(404).end();
    return;
  }
  try {
    if (!statSync(file).isFile()) {
      throw new Error("not a file");
    }
  } catch {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
}).listen(PORT, "127.0.0.1");

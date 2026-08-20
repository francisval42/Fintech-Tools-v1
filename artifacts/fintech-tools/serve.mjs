import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const port = process.env.PORT;

if (!port) {
  throw new Error("PORT environment variable is required.");
}

const publicDir = path.resolve(
  path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)),
  "dist/public",
);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function withinPublicDir(filePath) {
  return filePath === publicDir || filePath.startsWith(`${publicDir}${path.sep}`);
}

function toFilePath(requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split("?")[0]);
  const filePath = path.resolve(publicDir, `.${decodedPath}`);

  if (!withinPublicDir(filePath)) {
    return null;
  }

  return filePath;
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function sendFile(response, request, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const cacheControl = request.url.startsWith("/assets/")
    ? "public, max-age=31536000, immutable"
    : "no-cache";
  const stat = fs.statSync(filePath);

  response.writeHead(200, {
    "Cache-Control": cacheControl,
    "Content-Length": stat.size,
    "Content-Type": contentTypes[extension] ?? "application/octet-stream",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let requestedFile;
  try {
    requestedFile = toFilePath(request.url ?? "/");
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }

  if (!requestedFile) {
    response.writeHead(403);
    response.end();
    return;
  }

  if (fileExists(requestedFile)) {
    sendFile(response, request, requestedFile);
    return;
  }

  if (!path.extname(requestedFile)) {
    const routeIndex = path.join(requestedFile, "index.html");
    if (!withinPublicDir(routeIndex)) {
      response.writeHead(403);
      response.end();
      return;
    }

    if (fileExists(routeIndex)) {
      sendFile(response, request, routeIndex);
      return;
    }
  }

  sendFile(response, request, path.join(publicDir, "index.html"));
});

server.listen(Number(port), "0.0.0.0", () => {
  console.log(`Serving ${publicDir} on 0.0.0.0:${port}`);
});
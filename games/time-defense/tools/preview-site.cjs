const http = require("node:http"),
  fs = require("node:fs/promises"),
  path = require("node:path");
async function serveSite(root, prefix = "/", port = 0) {
  root = path.resolve(root);
  prefix = "/" + prefix.split("/").filter(Boolean).join("/");
  if (prefix !== "/") prefix += "/";
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript",
    ".png": "image/png",
    ".mp3": "audio/mpeg",
    ".json": "application/json",
  };
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (prefix !== "/" && url.pathname === prefix.slice(0, -1)) {
        response.writeHead(308, { Location: prefix }).end();
        return;
      }
      if (!url.pathname.startsWith(prefix)) {
        response.writeHead(404).end();
        return;
      }
      let file = path.resolve(
        root,
        decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html",
      );
      if (!file.startsWith(root + path.sep)) {
        response.writeHead(404).end();
        return;
      }
      if ((await fs.stat(file)).isDirectory()) {
        if (!url.pathname.endsWith("/")) {
          response
            .writeHead(308, { Location: url.pathname + "/" + url.search })
            .end();
          return;
        }
        file = path.join(file, "index.html");
      }
      const data = await fs.readFile(file);
      response.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(request.method === "HEAD" ? undefined : data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return {
    url: "http://127.0.0.1:" + server.address().port + prefix,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
module.exports = { serveSite };
if (require.main === module) {
  const root = path.resolve(
    __dirname,
    "..",
    process.argv[2] || "artifacts/site",
  );
  serveSite(root, "/", 4183)
    .then((server) => console.log("Local: " + server.url))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

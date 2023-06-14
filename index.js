const { readdirSync, createReadStream } = require("fs");
const { randomBytes } = require("crypto");
const http = require("http");

const files = readdirSync("./public");
const storeUrl = process.env.STORE_URL;
const storeId = process.env.STORE_ID;
const fileUrlFor = (fileId) => new URL(`${storeId}/files/${fileId}`, storeUrl);
const mimeTypes = {
  css: "text/css",
  js: "text/javascript",
};

async function readBody(req) {
  return new Promise((resolve) => {
    const a = [];
    req.on("data", (b) => a.push(b));
    res.on("end", () => resolve(Buffer.concat(a)));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/") {
    res.writeHead(302, {
      Location: "/p/" + randomBytes(16).toString("hex"),
    });
    res.end();
    return;
  }

  if (url.pathname.startsWith("/p/")) {
    res.writeHead(200, {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Content-Type": "text/html; charset=utf-8",
    });
    createReadStream("./public/index.html").pipe(res);
    return;
  }

  if (files.includes(url.pathname.slice(1))) {
    const ext = url.pathname.split(".").pop();
    res.writeHead(200, {
      "Cache-Control": "max-age=7200",
      "Content-Type": mimeTypes[ext] || "text/plain",
    });

    createReadStream("./public" + url.pathname).pipe(res);
    return;
  }

  if (url.pathname.startsWith("/f/")) {
    const [fileId = ""] = url.pathname.replace("/f/");
    const file = await fetch(fileUrlFor(fileId));

    if (file.ok) {
      res.writeHead(200);
      res.end(await file.json());
    } else {
      res.writeHead(404);
      res.end();
    }

    return;
  }

  if (url.pathname.startsWith("/u/") && req.method === "PUT") {
    const fileId = url.pathname.replace("/u/");
    const body = await readBody(req);
    const file = await fetch(fileUrlFor(fileId), {
      method: "PUT",
      body,
    });

    res.writeHead(file.ok ? 202 : 400);
    res.end();
  }

  res.writeHead(404);
  res.end();
});

server.listen(process.env.PORT);

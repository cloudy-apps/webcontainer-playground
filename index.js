const { readdir, createReadStream } = require("fs");
const { randomBytes } = require("crypto");
const http = require("http");

const files = readdir("./public");
const storeUrl = process.env.STORE_URL;
const storeId = process.env.STORE_ID;
const fileUrlFor = (fileId) => new URL(`${storeId}/files/${fileId}`, storeUrl);

async function readBody(req) {
  return new Promise((resolve) => {
    const a = [];
    req.on("data", (b) => a.push(b));
    res.on("end", () => resolve(Buffer.concat(a)));
  });
}

http.createServer(async (req, res) => {
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
    });
    createReadStream("./public/index.html").pipe(res);
    return;
  }

  if (files.includes(url.pathname.slice(1))) {
    res.writeHead(200, {
      "Cache-Control": "max-age=7200",
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

import http from "http";
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const ROOT = path.resolve(".");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const fp = path.join(ROOT, p);
  if (!fs.existsSync(fp)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 });
await page.goto(base + "/index.html", { waitUntil: "networkidle" });
await page.waitForSelector(".cart");

// seed some realistic progress across consoles via localStorage manipulation
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem("retroscaffale.v1"));
  const setStates = (name, owned, wish) => {
    const c = d.consoles.find((x) => x.name.startsWith(name));
    if (!c) return;
    c.games.forEach((g, i) => {
      if (i < owned) g.status = "owned";
      else if (i < owned + wish) g.status = "wishlist";
    });
  };
  setStates("NES", 7, 2);
  setStates("SNES", 10, 0);
  setStates("N64", 3, 1);
  setStates("GameCube", 5, 2);
  setStates("Wii", 2, 0);
  setStates("Switch", 8, 1);
  localStorage.setItem("retroscaffale.v1", JSON.stringify(d));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".cart");
await page.screenshot({ path: "scripts/demo-home.png" });

// open NES to show mixed statuses
await page.locator(".cart .cart-name", { hasText: "NES" }).first().click();
await page.waitForSelector(".game");
await page.screenshot({ path: "scripts/demo-console.png" });

// desktop wide view
const page2 = await browser.newPage({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 1.5 });
await page2.goto(base + "/index.html", { waitUntil: "networkidle" });
await page2.waitForSelector(".cart");
await page2.screenshot({ path: "scripts/demo-desktop.png" });

await browser.close();
server.close();
console.log("done");

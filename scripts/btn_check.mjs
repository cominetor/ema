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

const info = await page.evaluate(() => {
  const b = document.getElementById("themeBtn");
  const cs = getComputedStyle(b);
  const svg = b.querySelector("svg");
  const scs = svg ? getComputedStyle(svg) : null;
  return {
    exists: !!b,
    innerLen: b ? b.innerHTML.length : 0,
    hasSvg: !!svg,
    btnRect: b.getBoundingClientRect(),
    btnBg: cs.backgroundColor,
    btnBorder: cs.borderColor,
    svgStroke: scs ? scs.stroke : null,
    svgColor: scs ? scs.color : null,
    theme: document.documentElement.dataset.theme,
  };
});
console.log("LIGHT button info:", JSON.stringify(info, null, 2));

// crop of the top-right corner
await page.screenshot({ path: "scripts/btn-light.png", clip: { x: 250, y: 0, width: 140, height: 120 } });

// click it
await page.click("#themeBtn");
const after = await page.evaluate(() => document.documentElement.dataset.theme);
console.log("theme after click:", after);
await page.screenshot({ path: "scripts/btn-dark.png", clip: { x: 250, y: 0, width: 140, height: 120 } });

await browser.close();
server.close();

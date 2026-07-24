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
const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(base + "/index.html", { waitUntil: "networkidle" });
await page.waitForSelector(".cart");
// wait for SW to control the page
await page.evaluate(async () => { await navigator.serviceWorker.ready; });
await page.reload({ waitUntil: "networkidle" });
const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
console.log("page controlled by SW:", controlled);

// button present + works
const btn = await page.evaluate(() => {
  const b = document.getElementById("themeBtn");
  return { hasSvg: !!b.querySelector("svg"), label: b.getAttribute("aria-label") };
});
console.log("button:", JSON.stringify(btn));
const t0 = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click("#themeBtn");
const t1 = await page.evaluate(() => document.documentElement.dataset.theme);
console.log("theme click:", t0, "->", t1);

// OFFLINE: reload and ensure the app still loads from cache
await ctx.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
const offlineOk = await page.evaluate(() => document.querySelectorAll(".cart").length);
console.log("offline: consoles rendered =", offlineOk);
const offlineBtn = await page.evaluate(() => !!document.querySelector("#themeBtn svg"));
console.log("offline: theme button present =", offlineBtn);
await ctx.setOffline(false);

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
server.close();

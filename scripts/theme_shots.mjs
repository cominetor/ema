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
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await page.goto(base + "/index.html", { waitUntil: "networkidle" });
await page.waitForSelector(".cart");

// give some progress
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem("retroscaffale.v1"));
  const set = (n, o, w) => { const c = d.consoles.find(x => x.name.startsWith(n)); if (c) c.games.forEach((g, i) => { if (i < o) g.status = "owned"; else if (i < o + w) g.status = "wishlist"; }); };
  set("NES", 7, 2); set("SNES", 10, 0); set("N64", 3, 1); set("GameCube", 5, 2); set("Wii", 2, 0); set("Switch", 8, 1);
  localStorage.setItem("retroscaffale.v1", JSON.stringify(d));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".cart");

const theme0 = await page.evaluate(() => document.documentElement.dataset.theme);
console.log("initial theme:", theme0);

// toggle to dark
await page.click("#themeBtn");
const theme1 = await page.evaluate(() => document.documentElement.dataset.theme);
const meta1 = await page.getAttribute('meta[name="theme-color"]', "content");
console.log("after toggle theme:", theme1, "meta:", meta1);
await page.screenshot({ path: "scripts/theme-dark-home.png" });

// open a console in dark
await page.locator(".cart .cart-name", { hasText: "NES" }).first().click();
await page.waitForSelector(".game");
await page.screenshot({ path: "scripts/theme-dark-console.png" });

// persistence across reload
await page.reload({ waitUntil: "networkidle" });
const themePersist = await page.evaluate(() => document.documentElement.dataset.theme);
console.log("theme after reload (should be dark):", themePersist);

// toggle back to light
await page.goto(base + "/index.html#/", { waitUntil: "networkidle" });
await page.waitForSelector("#themeBtn");
await page.click("#themeBtn");
const theme2 = await page.evaluate(() => document.documentElement.dataset.theme);
console.log("after toggle back:", theme2);

console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
server.close();

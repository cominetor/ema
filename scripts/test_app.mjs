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
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" });
  fs.createReadStream(fp).pipe(res);
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 780 } });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(base + "/index.html", { waitUntil: "networkidle" });
await page.waitForSelector(".cart");

const consoleCount = await page.locator(".shelf-grid .cart:not(.add-tile)").count();
console.log("consoles rendered:", consoleCount);
await page.screenshot({ path: "scripts/shot-home.png" });

// open NES
await page.locator(".cart .cart-name", { hasText: "NES" }).first().click();
await page.waitForSelector(".game");
const gameCount = await page.locator(".game").count();
console.log("NES games:", gameCount);

// cycle first game 3 times: missing -> owned -> wishlist -> missing
const first = page.locator(".game").first();
const readStatus = () => first.getAttribute("data-status");
console.log("start status:", await readStatus());
await first.click(); console.log("after tap1:", await first.getAttribute("data-status"));
await first.click(); console.log("after tap2:", await first.getAttribute("data-status"));
await first.click(); console.log("after tap3:", await first.getAttribute("data-status"));

// set it to owned again and test wishlist filter
await first.click(); // owned
await page.locator('.seg button[data-f="wishlist"]').click();
const shownUnderWishlist = await page.locator(".game").count();
console.log("games shown under wishlist filter (owned first item):", shownUnderWishlist);
await page.locator('.seg button[data-f="missing"]').click();
const shownUnderMissing = await page.locator(".game").count();
console.log("games under missing filter:", shownUnderMissing);
await page.locator('.seg button[data-f="all"]').click();

// add a game
await page.fill("#newGame", "Zelda Test Title");
await page.click("#addGame");
await page.waitForSelector(".game .title >> text=Zelda Test Title").catch(()=>{});
const hasNew = await page.locator(".game .title", { hasText: "Zelda Test Title" }).count();
console.log("added game present:", hasNew);
await page.screenshot({ path: "scripts/shot-console.png" });

// persistence: reload (still on NES console hash) and check owned state kept
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".game");
const persistedStatus = await page.locator(".game").first().getAttribute("data-status");
console.log("persisted first-game status after reload:", persistedStatus);
const persistedNew = await page.locator(".game .title", { hasText: "Zelda Test Title" }).count();
console.log("persisted added game after reload:", persistedNew);
// back to home
await page.goto(base + "/index.html#/", { waitUntil: "networkidle" });
await page.waitForSelector(".cart");

// service worker registered?
const swReg = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return "no-sw-api";
  const r = await navigator.serviceWorker.getRegistration();
  return r ? "registered" : "not-registered";
});
console.log("service worker:", swReg);

// manifest reachable + parseable
const manifestOk = await page.evaluate(async () => {
  const res = await fetch("manifest.json"); const j = await res.json(); return j.name && j.icons.length;
});
console.log("manifest icons:", manifestOk);

console.log("CONSOLE ERRORS:", errors.length ? errors : "none");
await browser.close();
server.close();

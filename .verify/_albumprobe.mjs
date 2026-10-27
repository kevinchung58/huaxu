/* what appears on the album pages, and on what gesture */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const ROOMS = process.env.ROOMS || "index.html";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 800 } });
const page = await browser.newPage();
await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 60000 });
await sleep(1200);
const seen = () => page.evaluate(() => {
  const out = {};
  for (const s of ["#featured-modal", "#ig-plate", ".dot-game-panel", "[data-walk-card]"]) {
    const el = document.querySelector(s);
    if (!el) { out[s] = "absent"; continue; }
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const on = !el.hidden && cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05
      && r.width > 4 && r.height > 4 && el.classList.contains("is-open");
    out[s] = on ? "OPEN" : "closed";
  }
  out.tiles = document.querySelectorAll(".alb-tile, .ig-tile, .tile").length;
  return out;
});
console.log(ROOMS, "on arrival", JSON.stringify(await seen()));
const tiles = await page.evaluate(() => Array.from(document.querySelectorAll("a,button")).filter((el) => {
  const r = el.getBoundingClientRect();
  return r.width > 40 && r.height > 40 && r.top > 0 && r.bottom < innerHeight;
}).slice(0, 6).map((el) => {
  const r = el.getBoundingClientRect();
  return { tag: el.tagName, cls: (el.className || "").toString().slice(0, 30), txt: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30),
           x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
}));
for (const t of tiles) {
  await page.mouse.click(t.x, t.y);
  await sleep(700);
  console.log(`click ${t.tag}.${t.cls} "${t.txt}" ->`, JSON.stringify(await seen()), page.url().replace(BASE, ""));
  await page.keyboard.press("Escape");
  await sleep(400);
  if (!page.url().startsWith(BASE)) { await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0" }); await sleep(900); }
}
await browser.close();

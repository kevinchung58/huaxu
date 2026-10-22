/* What is on screen from a stop, by the page's own hit boxes.

   A hit box IS the prop's bounding rectangle on screen (`walk_object`: the button is the picture's
   box), so asking the document where the boxes are is the cheapest honest answer to "is the new
   thing actually in this frame, and where" — no re-implementation of the projection.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-fukuoka.html \
           STOPS='0,1,4,7,12' node .verify/_onscreen.mjs */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const ROOMS = process.env.ROOMS || "rooms.html";
const STOPS = (process.env.STOPS || "0").split(",").map(Number);
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"],
  headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 60000 });
await sleep(2500);
const state = () => page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  return w ? { x: w.x, z: w.depth, yaw: w.yaw } : null;
});
for (const i of STOPS) {
  const target = await page.evaluate((k) => Number.parseFloat(
    getComputedStyle(document.querySelectorAll("[data-walk-stop]")[k]).getPropertyValue("--z")), i);
  await page.evaluate((k) => document.querySelectorAll("[data-walk-stop]")[k].click(), i);
  for (let n = 0; n < 80; n++) {
    await sleep(250);
    const s = await state();
    if (s && Math.abs(s.z - target) < 4) break;
  }
  await sleep(900);
  const s = await state();
  const on = await page.evaluate(() => [...document.querySelectorAll("[data-obj]")].map((el) => {
    if (getComputedStyle(el).visibility === "hidden") return null;
    const b = el.getBoundingClientRect();
    if (b.width < 10 || b.height < 10) return null;
    if (b.right < 0 || b.left > 1024 || b.bottom < 0 || b.top > 768) return null;
    return { id: el.dataset.obj, x: Math.round(b.left), y: Math.round(b.top),
             w: Math.round(b.width), h: Math.round(b.height) };
  }).filter(Boolean));
  console.log(`stop ${i} at x${s.x.toFixed(0)} z${s.z.toFixed(0)} yaw${s.yaw.toFixed(0)}: ` +
    on.map((o) => `${o.id}[${o.x},${o.y} ${o.w}x${o.h}]`).join(" "));
}
await browser.close();

/* Real-browser eyes for the walk: boots the site over HTTP in a bundled headless Chromium
   (@sparticuz/chromium ships its binary inside the npm package, so no CDN is needed), stands at
   the mouth of a room, walks it with the same keys the e2e harness uses, and shoots the frames a
   visitor actually sees — images loaded, patterns transformed by a real canvas.

   Run:  ROOMS=rooms-toronto.html node .verify/browser-shot.mjs .preview/real/toronto
   Deps (dev-only, --no-save): puppeteer-core @sparticuz/chromium. If they are absent this script
   says so and exits 0 — it is an instrument, not a gate. */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const ROOMS = process.env.ROOMS || "rooms-toronto.html";
const OUT = process.argv[2] || ".preview/real";
const BASE = process.env.BASE || "http://127.0.0.1:8080";

let puppeteer, chromium;
try {
  puppeteer = require("puppeteer-core");
  chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
} catch (e) {
  console.log("browser-shot: puppeteer-core/@sparticuz/chromium not installed — skipped");
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"],
  headless: true,
  defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text()); });
page.on("requestfailed", (r) => console.log("REQFAIL", r.url(), r.failure()?.errorText));

await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 30000 });
await sleep(1200);   // let the plates arrive and the first frames settle
const imgs = await page.evaluate(() => Array.from(document.images).map((i) => [i.src.split("/").pop(), i.complete, i.naturalWidth]));
console.log("IMAGES", JSON.stringify(imgs));

const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
await shot("01-mouth");

// look left / right from the mouth
await page.mouse.move(512, 384);
await page.mouse.down(); await page.mouse.move(700, 384, { steps: 8 }); await page.mouse.up();
await sleep(400); await shot("02-mouth-yaw-right");
await page.mouse.down(); await page.mouse.move(300, 384, { steps: 10 }); await page.mouse.up();
await sleep(400); await shot("03-mouth-yaw-left");
await page.mouse.down(); await page.mouse.move(512, 384, { steps: 8 }); await page.mouse.up();
await sleep(300);

// walk in stages, shooting what a visitor meets on the way
await page.click("[data-walk-view]").catch(() => {});
for (const [name, ms] of [["04-walk-1", 1600], ["05-walk-2", 1600], ["06-walk-3", 1600], ["07-deep", 1600]]) {
  await page.keyboard.down("ArrowUp");
  await sleep(ms);
  await page.keyboard.up("ArrowUp");
  await sleep(350);
  await shot(name);
}
await browser.close();
console.log(`browser-shot: frames in ${OUT}`);

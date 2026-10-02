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

// the page's own station chips: stand where the room publishes stops, look three ways
const stops = await page.$$("[data-walk-stop]");
let n = 3;
for (let i = 0; i < stops.length; i++) {
  await stops[i].click();
  await sleep(1500);
  await shot(`${String(n).padStart(2, "0")}-stop-${i}-ahead`); n++;
  await page.mouse.move(512, 384);
  await page.mouse.down(); await page.mouse.move(700, 384, { steps: 6 }); await page.mouse.up();
  await sleep(400); await shot(`${String(n).padStart(2, "0")}-stop-${i}-right`); n++;
  await page.mouse.down(); await page.mouse.move(320, 384, { steps: 8 }); await page.mouse.up();
  await sleep(400); await shot(`${String(n).padStart(2, "0")}-stop-${i}-left`); n++;
  await page.mouse.down(); await page.mouse.move(512, 384, { steps: 6 }); await page.mouse.up();
  await sleep(300);
}
/* The one layout claim a real browser can make that jsdom cannot, so it is a gate and not a
   photograph: the reel shows one frame at a time, so the frame on screen has to be *on screen*.
   It failed here for a whole release — `[hidden]` was losing to the rail's own `display: grid`,
   six frames stayed in flow at thousands of pixels each, and every story opened on an empty
   field while the harness reported 166/166. Skipped (not passed) on a page with no reel. */
let layoutFail = 0;
const playBtn = await page.$("[data-play]");
if (playBtn) {
  await page.evaluate(() => document.querySelector("[data-play]").click());
  await sleep(1500);
  const shown = await page.evaluate(() => {
    const f = document.querySelector("#room-plate .story-frame:not([hidden])");
    if (!f) return null;
    const im = f.querySelector("img");
    const b = im.getBoundingClientRect();
    return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top),
             bottom: Math.round(b.bottom), vh: window.innerHeight, vw: window.innerWidth,
             inFlow: Array.from(document.querySelectorAll("#room-plate .story-frame"))
               .filter((el) => getComputedStyle(el).display !== "none").length,
             loaded: im.complete && im.naturalWidth > 0 };
  });
  await shot("99-story-plate");
  const onScreen = !!shown && shown.w > 40 && shown.h > 40 && shown.loaded
    && shown.top > -4 && shown.bottom <= shown.vh + 4;
  if (!onScreen || (shown && shown.inFlow !== 1)) {
    layoutFail++;
    console.log(`FAIL story reel: ${JSON.stringify(shown)}`);
  } else {
    console.log(`PASS story reel: one frame on screen ${shown.w}x${shown.h} at y=${shown.top}`);
  }
}
await browser.close();
console.log(`browser-shot: frames in ${OUT}`);
if (layoutFail) process.exit(1);

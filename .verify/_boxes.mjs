// Per-box luma by day-phase, for one room.
//
// `_night3.mjs` says whether a room has a day at all; this says *what* is not getting dark. It
// buckets a set of named regions by phase and prints NIGHT()/haze alongside them, so a box that
// refuses to darken can be told apart from a box that is simply close to the camera.
//
// Needs the phase hook (`globalThis.__dbg`) injected into js/site.js.
//
//   node .verify/_boxes.mjs [samples]     default 1300 at 180 ms ~= 234 s

import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NSAMP = Number(process.argv[2] || 1300), DT = 180, BINS = 20;

// stop 4, 1024x768 -- the far-bank buildings are the four the stagger was built for.
const BOX = {
  station: [421, 388, 560, 473],
  custom: [564, 395, 689, 473],
  osaka: [689, 416, 796, 474],
  dalian: [332, 431, 420, 472],
  sky: [40, 120, 300, 220],
  water: [430, 520, 620, 600],
};

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true,
  defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 160)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html", { waitUntil: "networkidle0" });
await sleep(1200);
await page.evaluate(() => {
  const s = document.querySelectorAll("[data-walk-stop]");
  s[s.length - 1].click();
});
await sleep(1500);

const rows = [];
for (let i = 0; i < NSAMP; i++) {
  const r = await page.evaluate((BOX) => {
    const d = globalThis.__dbg ? globalThis.__dbg() : null;
    if (!d) return null;
    const cv = [...document.querySelectorAll("canvas")].find((c) => c.width > 600 && c.height > 400);
    if (!cv) return null;
    const g = cv.getContext("2d", { willReadFrequently: true });
    const sc = cv.width / 1024;
    const o = { p: d.p, n: d.n, sun: d.sun, h15: d.h1500, h20: d.h2000 };
    for (const [k, [x0, y0, x1, y1]] of Object.entries(BOX)) {
      const D = g.getImageData(
        Math.round(x0 * sc), Math.round(y0 * sc),
        Math.max(1, Math.round((x1 - x0) * sc)), Math.max(1, Math.round((y1 - y0) * sc))).data;
      let L = 0, c = 0;
      for (let p = 0; p < D.length; p += 4) { L += 0.2126 * D[p] + 0.7152 * D[p + 1] + 0.0722 * D[p + 2]; c++; }
      o[k] = L / c;
    }
    return o;
  }, BOX);
  if (r) rows.push(r);
  await sleep(DT);
}

const keys = Object.keys(BOX);
const bins = Array.from({ length: BINS }, () => ({ n: 0, p: 0, s: {} }));
rows.forEach((r) => {
  const b = Math.min(BINS - 1, Math.floor(r.p * BINS));
  const o = bins[b];
  o.n++; o.p += r.p; o.h = r.h20;
  keys.forEach((k) => { o.s[k] = (o.s[k] || 0) + r[k]; });
});

console.log(`  p     NIGHT  haze2000 | ` + keys.map((k) => k.padStart(8)).join(""));
for (let b = 0; b < BINS; b++) {
  const o = bins[b];
  if (!o.n) continue;
  console.log(`  ${(b / BINS).toFixed(2)}   ${(1 - (o.p / o.n - 0.25 >= 0 ? Math.sin((o.p / o.n - 0.25) * Math.PI * 2) * 0.5 + 0.5 : 0)).toFixed(2)}` +
    `   ${o.h.toFixed(3)}  | ` + keys.map((k) => (o.s[k] / o.n).toFixed(0).padStart(8)).join(""));
}
console.log("\n  night-to-noon drop per box (a box with a real night falls a long way):");
for (const k of keys) {
  const col = bins.filter((o) => o.n).map((o) => o.s[k] / o.n);
  const night = Math.min(...col), noon = Math.max(...col);
  console.log(`    ${k.padEnd(9)} ${night.toFixed(0).padStart(4)} -> ${noon.toFixed(0).padStart(4)}` +
    `   drop ${(noon - night).toFixed(0).padStart(4)} luma  (${((noon - night) / noon * 100).toFixed(0)}%)`);
}
console.log(`\n  ${rows.length} samples`);
await browser.close();

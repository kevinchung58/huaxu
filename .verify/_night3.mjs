// The day-night swing, measured on all three rooms at once.
//
// A lamp's additive pool used to be painted at full strength at every hour and to ignore the `k`
// the record authored for it, which flattened the cycle into a brightness slider: every surface
// sat on a constant additive floor, so "night" was only ever a few luma darker than noon. This is
// the instrument for that -- it buckets the whole frame's mean luma by day-phase so the swing can
// be read as a number instead of argued about.
//
// Reads the canvas in page (a screenshot costs 20-35 s here) and needs the phase hook, so run it
// while `globalThis.__dbg` is injected into js/site.js.
//
//   node .verify/_night3.mjs [samples]        default 800 at 300 ms ~= 240 s per room

import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NSAMP = Number(process.argv[2] || 800), DT = 300, BINS = 10;

const ROOMS = [
  ["fukuoka", "rooms-fukuoka.html"],
  ["tokyo", "rooms.html"],
  ["toronto", "rooms-toronto.html"],
];

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true,
  defaultViewport: { width: 1024, height: 768 },
});

const table = {};
for (const [name, page_] of ROOMS) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 140)));
  await page.goto(`http://127.0.0.1:8080/${page_}`, { waitUntil: "networkidle0" });
  await sleep(1200);
  const n = await page.evaluate(() => {
    const s = document.querySelectorAll("[data-walk-stop]");
    s[s.length - 1].click();
    return s.length;
  });
  await sleep(1800);
  const rows = [];
  for (let i = 0; i < NSAMP; i++) {
    const r = await page.evaluate(() => {
      const d = globalThis.__dbg ? globalThis.__dbg() : null;
      if (!d) return null;
      const cv = [...document.querySelectorAll("canvas")].find((c) => c.width > 600 && c.height > 400);
      if (!cv) return null;
      const g = cv.getContext("2d", { willReadFrequently: true });
      const D = g.getImageData(0, 0, cv.width, cv.height).data;
      let L = 0, c = 0;
      for (let p = 0; p < D.length; p += 16) {          // every 4th pixel is plenty
        L += 0.2126 * D[p] + 0.7152 * D[p + 1] + 0.0722 * D[p + 2]; c++;
      }
      return { p: d.p, n: d.n, frame: L / c };
    });
    if (r) rows.push(r);
    await sleep(DT);
  }
  const bins = Array.from({ length: BINS }, () => ({ s: 0, n: 0 }));
  rows.forEach((r) => {
    const b = Math.min(BINS - 1, Math.floor(r.p * BINS));
    bins[b].s += r.frame; bins[b].n++;
  });
  table[name] = bins.map((o) => (o.n ? o.s / o.n : NaN));
  console.log(`  ${name}: ${rows.length} samples over ${n} stops`);
  await page.close();
}

console.log("\n  whole-frame mean luma by day-phase (0 midnight - 0.5 noon - 1 midnight)\n");
console.log("  phase  " + ROOMS.map(([n]) => n.padStart(10)).join(""));
for (let b = 0; b < BINS; b++) {
  console.log(`  ${(b / BINS).toFixed(2)}  ` +
    ROOMS.map(([n]) => (isNaN(table[n][b]) ? "         -" : table[n][b].toFixed(1).padStart(10))).join(""));
}
console.log("\n  swing (noon minus midnight) -- a room with a real day is big here:");
for (const [n] of ROOMS) {
  const v = table[n].filter((x) => !isNaN(x));
  const hi = Math.max(...v), lo = Math.min(...v);
  console.log(`    ${n.padEnd(9)} ${lo.toFixed(1)} -> ${hi.toFixed(1)}   swing ${(hi - lo).toFixed(1)} luma` +
    `  (${((hi - lo) / hi * 100).toFixed(0)}% of noon)`);
}
await browser.close();

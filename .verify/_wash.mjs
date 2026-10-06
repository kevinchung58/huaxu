// Is the brick washed?
//
// The four far-bank buildings are supposed to be dark masses with lit windows at night. They were
// measured reading rgb(235,209,161) and rgb(251,201,147) -- bright *and* warm, which is warm enough
// to pass the very pixel test that is meant to find a lit window (D>185 && D-B>45). So the lit-window
// columns for the station and the customhouse never fell, and the stagger could not be read off them.
//
// This walks a full cycle (~240 s) reading the canvas in page -- a screenshot costs 20-35 s here, so
// sampling by screenshot could never see this -- and reports, for each building box, the mean colour
// at the darkest frame of the cycle. Night is the only frame that matters: if a wall is still bright
// and warm when the port is supposed to have gone dark, it is washed, and the sources are the lamps
// and object glows in the district record, not the texture.
//
//   node .verify/_wash.mjs [samples]      default 1200 samples at 200 ms ~= 240 s

import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NSAMP = Number(process.argv[2] || 1200), DT = 200;

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
await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[4].click());
await sleep(2500);

// One read per sample, straight off the canvas the renderer already drew.
const rows = [];
for (let i = 0; i < NSAMP; i++) {
  const r = await page.evaluate((BOX) => {
    const cv = document.querySelector("canvas");
    const g = cv.getContext("2d", { willReadFrequently: true });
    const out = {};
    for (const [name, [x0, y0, x1, y1]] of Object.entries(BOX)) {
      const D = g.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1).data;
      let R = 0, G = 0, B = 0, n = 0, lit = 0;
      for (let p = 0; p < D.length; p += 4) {
        R += D[p]; G += D[p + 1]; B += D[p + 2]; n++;
        if (D[p] > 185 && D[p] - D[p + 2] > 45) lit++;
      }
      out[name] = { r: R / n, g: G / n, b: B / n, luma: (0.2126 * R + 0.7152 * G + 0.0722 * B) / n, lit: lit / n };
    }
    return out;
  }, BOX);
  rows.push(r);
  await sleep(DT);
}

const names = Object.keys(BOX);
const mean = (k, f) => rows.reduce((a, r) => a + f(r[k]), 0) / rows.length;
const dark = rows.reduce((a, r) => (r.osaka.luma + r.dalian.luma < a.osaka.luma + a.dalian.luma ? r : a), rows[0]);
const bright = rows.reduce((a, r) => (r.osaka.luma + r.dalian.luma > a.osaka.luma + a.dalian.luma ? r : a), rows[0]);

const fmt = (o) =>
  `rgb(${String(Math.round(o.r)).padStart(3)},${String(Math.round(o.g)).padStart(3)},` +
  `${String(Math.round(o.b)).padStart(3)})  luma ${o.luma.toFixed(0).padStart(3)}  lit ${(o.lit * 100).toFixed(0).padStart(3)}%`;

console.log(`${rows.length} samples over ~${Math.round((rows.length * DT) / 1000)} s at stop 4\n`);
console.log(`             ${"DARKEST frame".padEnd(34)}   brightest frame`);
console.log("             " + "-".repeat(34) + "   " + "-".repeat(34));
for (const k of names) console.log(`  ${k.padEnd(9)}  ${fmt(dark[k])}   ${fmt(bright[k])}`);

console.log("\n  A wall is washed if it is still bright AND warm at the darkest frame:");
for (const k of ["station", "custom", "osaka", "dalian"]) {
  const d = dark[k];
  const warm = d.r - d.b > 45, brightish = d.luma > 90;
  console.log(
    `    ${k.padEnd(9)} luma ${d.luma.toFixed(0).padStart(3)}  r-b ${(d.r - d.b).toFixed(0).padStart(4)}` +
      `  ${brightish && warm ? "WASHED (bright and warm in the dark)" : brightish ? "bright but not warm" : "dark"}`
  );
}
await browser.close();

/* How a table actually looks, measured on the pixels it occupies.

   Crop to the union of that table's own objects -- a fixed rectangle measures the dark hall
   around a small bright model and calls the model dim. Reports brightness spread, how much
   there is to look at (Sobel edge density), how many colours, and how much of it is warm
   window light, which is the one thing a Little Canada table is supposed to be full of.
   Run:  node .verify/verify-look.mjs   */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TABLES = {
  lake:   { stop: 1, deg: -90, ids: ["plinth-lake","pool-lake","planter-i1","planter-i2","boat-lake","tree-i1","tree-i2","tree-s1","tree-s2"] },
  falls:  { stop: 2, deg: 90,  ids: ["plinth-falls","falls-n","tree-f1","tree-f2"] },
  market: { stop: 3, deg: -90, ids: ["plinth-market","stall-m1","stall-m2","stall-m3","crate-m1","crate-m2","tree-m1"] },
  city:   { stop: 4, deg: 0,  ids: ["plinth-sky","tower-cn","skyline-cn","dome-rc","track-c","tram-t","tree-c1","tree-c2","tree-c3"] },
};
const page = await browser.newPage();
for (const [name, t] of Object.entries(TABLES)) {
  await page.goto("http://127.0.0.1:8080/rooms-toronto.html", { waitUntil: "networkidle0" });
  await sleep(1500);
  await page.evaluate((s) => document.querySelectorAll("[data-walk-stop]")[s].click(), t.stop);
  await sleep(2600);
  for (let k = 0; k < Math.round(Math.abs(t.deg)/7); k++) { await page.keyboard.press(t.deg<0?"ArrowLeft":"ArrowRight"); await sleep(80); }
  await sleep(1200);
  const box = await page.evaluate((ids) => {
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,n=0;
    for (const id of ids) {
      const el = document.querySelector(`[data-obj="${id}"]`);
      if (!el || getComputedStyle(el).visibility === "hidden") continue;
      const r = el.getBoundingClientRect(); n++;
      x0=Math.min(x0,r.left); y0=Math.min(y0,r.top); x1=Math.max(x1,r.right); y1=Math.max(y1,r.bottom);
    }
    if (!n) return null;
    x0=Math.max(0,Math.round(x0)); y0=Math.max(0,Math.round(y0));
    return { x:x0, y:y0, w:Math.min(1024-x0,Math.round(x1-x0)), h:Math.min(768-y0,Math.round(y1-y0)), n };
  }, t.ids);
  if (!box || box.w < 8 || box.h < 8) { console.log(`${name}: nothing on screen`); continue; }
  const f = `/tmp/look-${name}.png`;
  await page.screenshot({ path: f });
  const img = await loadImage(f);
  const c = createCanvas(box.w, box.h), g = c.getContext("2d");
  g.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  const d = g.getImageData(0, 0, box.w, box.h).data;
  const N = box.w * box.h;
  const lum = new Float32Array(N); const cols = new Set();
  let warm = 0, sat = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const R=d[i], G=d[i+1], B=d[i+2];
    lum[p] = 0.2126*R + 0.7152*G + 0.0722*B;
    cols.add((R>>3<<10)|(G>>3<<5)|(B>>3));
    const mx=Math.max(R,G,B), mn=Math.min(R,G,B);
    sat += mx ? (mx-mn)/mx : 0;
    if (R>165 && G>125 && B < R-25) warm++;
  }
  const mean = lum.reduce((a,b)=>a+b,0)/N;
  const sd = Math.sqrt(lum.reduce((a,b)=>a+(b-mean)**2,0)/N);
  let edges = 0;
  for (let y = 1; y < box.h-1; y++) for (let x = 1; x < box.w-1; x++) {
    const i = y*box.w+x;
    const gx = lum[i-box.w+1]+2*lum[i+1]+lum[i+box.w+1]-lum[i-box.w-1]-2*lum[i-1]-lum[i+box.w-1];
    const gy = lum[i+box.w-1]+2*lum[i+box.w]+lum[i+box.w+1]-lum[i-box.w-1]-2*lum[i-box.w]-lum[i-box.w+1];
    if (Math.hypot(gx,gy) > 24) edges++;
  }
  const sorted = [...lum].sort((a,b)=>a-b);
  console.log(`${name.padEnd(7)} ${String(box.w).padStart(3)}x${String(box.h).padStart(3)}px (${box.n} objs)  mean ${mean.toFixed(1).padStart(5)}  sd ${sd.toFixed(1).padStart(4)}  p05-p95 ${sorted[(N*0.05)|0].toFixed(0)}-${sorted[(N*0.95)|0].toFixed(0)}  colours ${String(cols.size).padStart(4)}  edge ${(edges/N*100).toFixed(1).padStart(4)}%  sat ${(sat/N).toFixed(2)}  warm ${(warm/N*100).toFixed(1)}%`);
}
await browser.close();

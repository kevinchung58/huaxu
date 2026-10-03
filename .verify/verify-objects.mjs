/* How each object looks, cropped to its own box.

   `verify-look.mjs` measures a table, which averages a good tower in with the flat block beside it
   and reports the pair as fine. This one measures the objects one at a time, at the heading where
   each table frames best, and reports what there is to look at: its size on screen, its contrast,
   its edge density (how much shape it has), and how many colours it is made of. An object that is
   really a flat card shows up here as a thin spread and a low edge count however it is dressed.
   Run:  node .verify/verify-objects.mjs   */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWS = [ {page:"rooms-toronto.html", stop:1, deg:-90}, {page:"rooms-toronto.html", stop:2, deg:90},
                {page:"rooms-toronto.html", stop:3, deg:-90}, {page:"rooms-toronto.html", stop:4, deg:0} ];
const page = await browser.newPage();
const rows = [];
for (const v of VIEWS) {
  await page.goto("http://127.0.0.1:8080/" + v.page, { waitUntil: "networkidle0" });
  await sleep(1500);
  await page.evaluate((s) => document.querySelectorAll("[data-walk-stop]")[s].click(), v.stop);
  await sleep(2500);
  for (let k = 0; k < Math.round(Math.abs(v.deg)/7); k++) { await page.keyboard.press(v.deg<0?"ArrowLeft":"ArrowRight"); await sleep(70); }
  await sleep(1000);
  const boxes = await page.evaluate(() => [...document.querySelectorAll("[data-obj]")].map((el) => {
    if (getComputedStyle(el).visibility === "hidden") return null;
    const b = el.getBoundingClientRect();
    if (b.width < 8 || b.height < 8) return null;
    if (b.right < 0 || b.left > 1024 || b.bottom < 0 || b.top > 768) return null;
    return { id: el.dataset.obj, x: Math.max(0,Math.round(b.left)), y: Math.max(0,Math.round(b.top)),
             w: Math.round(Math.min(1024,b.right)-Math.max(0,b.left)),
             h: Math.round(Math.min(768,b.bottom)-Math.max(0,b.top)) };
  }).filter(Boolean));
  await page.screenshot({ path: "/tmp/obj.png" });
  const img = await loadImage("/tmp/obj.png");
  for (const b of boxes) {
    if (b.w * b.h < 200) continue;
    const c = createCanvas(b.w, b.h), g = c.getContext("2d");
    g.drawImage(img, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    const d = g.getImageData(0,0,b.w,b.h).data;
    const N = b.w*b.h, lum = new Float32Array(N), cols = new Set();
    for (let i=0,p=0;i<d.length;i+=4,p++){ lum[p]=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2];
      cols.add((d[i]>>3<<10)|(d[i+1]>>3<<5)|(d[i+2]>>3)); }
    const mean = lum.reduce((a,x)=>a+x,0)/N;
    const sd = Math.sqrt(lum.reduce((a,x)=>a+(x-mean)**2,0)/N);
    let edges = 0;
    for (let y=1;y<b.h-1;y++) for (let x=1;x<b.w-1;x++){ const i=y*b.w+x;
      const gx=lum[i-b.w+1]+2*lum[i+1]+lum[i+b.w+1]-lum[i-b.w-1]-2*lum[i-1]-lum[i+b.w-1];
      const gy=lum[i+b.w-1]+2*lum[i+b.w]+lum[i+b.w+1]-lum[i-b.w-1]-2*lum[i-b.w]-lum[i-b.w+1];
      if (Math.hypot(gx,gy) > 24) edges++; }
    rows.push({ id: b.id, w: b.w, h: b.h, mean, sd, cols: cols.size, edge: edges/N*100, view: `${v.page.replace(".html","")}#${v.stop}` });
  }
}
await browser.close();
const best = new Map();
for (const r of rows) { const p = best.get(r.id); if (!p || r.w*r.h > p.w*p.h) best.set(r.id, r); }
const list = [...best.values()].sort((a,b)=>b.edge-a.edge);
console.log("object            size px    mean    sd   colours   edge%   (measured at its largest)\n");
for (const r of list)
  console.log(`${r.id.padEnd(17)} ${String(r.w).padStart(4)}x${String(r.h).padStart(3)}  ${r.mean.toFixed(0).padStart(5)}  ${r.sd.toFixed(0).padStart(4)}  ${String(r.cols).padStart(6)}  ${r.edge.toFixed(1).padStart(6)}   ${r.view}`);

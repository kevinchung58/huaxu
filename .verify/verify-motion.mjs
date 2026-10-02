/* Motion audit: two frames 1.6 s apart, diffed inside each moving object's own box.
   A whole-frame percentage hides a streetcar: it is 0.1% of the frame and 4-8% of its box.
   The static crate is the control — if it ever moves, the measurement is picking up noise.
   Run:  node .verify/verify-motion.mjs */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 } });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// stop, turn that frames the table, and the one thing on it that is supposed to move
const JOBS = [ {stop:1, deg:-90, id:"boat-lake", what:"the ferry crossing"},
               {stop:2, deg:90,  id:"falls-n",   what:"the falls running"},
               {stop:3, deg:-90, id:"crate-m1",  what:"the market (control: a crate)"},
               {stop:4, deg:30,  id:"tram-t",    what:"the streetcar"} ];
const diff = async (a, b, box) => {
  const ia = await loadImage(a), ib = await loadImage(b);
  const c = createCanvas(box.w, box.h), g = c.getContext("2d");
  g.drawImage(ia, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h); const A = g.getImageData(0,0,box.w,box.h).data;
  g.clearRect(0,0,box.w,box.h);
  g.drawImage(ib, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h); const B = g.getImageData(0,0,box.w,box.h).data;
  let n = 0; for (let i = 0; i < A.length; i += 4)
    if (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2]) > 8) n++;
  return +(n / (box.w*box.h) * 100).toFixed(2);
};
for (const j of JOBS) {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/rooms-toronto.html", { waitUntil: "networkidle0" });
  await sleep(1300);
  await page.evaluate((s) => document.querySelectorAll("[data-walk-stop]")[s].click(), j.stop);
  await sleep(2500);
  for (let k = 0; k < Math.round(Math.abs(j.deg)/7); k++) { await page.keyboard.press(j.deg<0?"ArrowLeft":"ArrowRight"); await sleep(80); }
  await sleep(900);
  const box = await page.evaluate((id) => {
    const el = document.querySelector(`[data-obj="${id}"]`);
    if (!el || getComputedStyle(el).visibility === "hidden") return null;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.round(r.left)), y = Math.max(0, Math.round(r.top));
    return { x, y, w: Math.min(1024-x, Math.round(r.width)), h: Math.min(768-y, Math.round(r.height)) };
  }, j.id);
  if (!box || box.w < 4 || box.h < 4) { console.log(`  ${j.what.padEnd(34)} off-screen`); await page.close(); continue; }
  const out = [];
  for (let k = 0; k < 4; k++) {
    await page.screenshot({ path: "/tmp/mv-a.png" }); await sleep(1600);
    await page.screenshot({ path: "/tmp/mv-b.png" });
    out.push(await diff("/tmp/mv-a.png", "/tmp/mv-b.png", box));
  }
  console.log(`  ${j.what.padEnd(34)} box ${box.w}x${box.h}px  2-frame diff: ${out.join("%  ")}%`);
  await page.close();
}
await browser.close();

/* Motion audit: how much of each object's own pixels change over a couple of seconds.

   A whole-frame percentage hides a streetcar -- it is 0.1% of the frame and 4-8% of its box -- so
   every object is diffed inside its own rectangle, at each table's best heading.

   Two things this gets wrong if you are careless, both of which cost a wrong answer here:

   - Sample at 0.7 s, not 1.2 s. The stall lamp flickers on a 1.2 s period, so a 1.2 s sample step
     lands on the same phase every time and measures the flicker as a still picture. Five frames
     and the max over adjacent pairs, so a slow cycle is not missed because two samples agreed.
   - Expect flat-coloured quads to read as still. A panel whose corner moves only changes the
     pixels near that corner; it is brightness across an area that registers. The market's awnings
     measured 2% when only their edge moved and 13% once the panels changed brightness too.

   A crate should sit at 0% -- it is the control.
   Run:  node .verify/verify-motion.mjs   */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const VIEWS = [[1,-90],[2,90],[3,-90],[4,0]];
const page = await browser.newPage();
const best = new Map();
for (const [stop, deg] of VIEWS) {
  await page.goto("http://127.0.0.1:8080/rooms-toronto.html",{waitUntil:"networkidle0"});
  await sleep(1400);
  await page.evaluate(s=>document.querySelectorAll("[data-walk-stop]")[s].click(), stop);
  await sleep(2400);
  for (let k=0;k<Math.round(Math.abs(deg)/7);k++){ await page.keyboard.press(deg<0?"ArrowLeft":"ArrowRight"); await sleep(70);}
  await sleep(1200);
  const boxes = await page.evaluate(()=>[...document.querySelectorAll("[data-obj]")].map(el=>{
    if (getComputedStyle(el).visibility==="hidden") return null;
    const b = el.getBoundingClientRect();
    if (b.width<10||b.height<10) return null;
    if (b.right<0||b.left>1024||b.bottom<0||b.top>768) return null;
    return { id: el.dataset.obj, x: Math.max(0,Math.round(b.left)), y: Math.max(0,Math.round(b.top)),
             w: Math.round(Math.min(1024,b.right)-Math.max(0,b.left)),
             h: Math.round(Math.min(768,b.bottom)-Math.max(0,b.top)) };
  }).filter(Boolean));
  /* Sample at 0.7 s, not 1.2 s: the stall lamp flickers on a 1.2 s period, so a 1.2 s sample step
     lands on the same phase every time and reads the flicker as a still picture. Five frames, max
     over adjacent pairs, so a slow cycle is not missed because two samples happened to agree. */
  const shots = [];
  for (let i=0;i<5;i++) {
    const f = `/tmp/mo${i}.png`;
    await page.screenshot({ path: f });
    shots.push(await loadImage(f));
    if (i<4) await sleep(700);
  }
  const c = createCanvas(1024,768), g = c.getContext("2d");
  const grab = async (img,b) => { g.clearRect(0,0,1024,768); g.drawImage(img,0,0);
    return g.getImageData(b.x,b.y,b.w,b.h).data; };
  for (const b of boxes) {
    if (b.w*b.h < 400) continue;
    const A = await grab(shots[0],b), B = await grab(shots[1],b), C = await grab(shots[2],b);
    const D = await grab(shots[3],b), E = await grab(shots[4],b);
    let m = 0;
    for (const [p,q] of [[A,B],[B,C],[C,D],[D,E],[A,E]]) {
      let ch = 0;
      for (let i=0;i<p.length;i+=4)
        if (Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]) > 14) ch++;
      m = Math.max(m, ch/(b.w*b.h)*100);
    }
    const prev = best.get(b.id);
    if (!prev || m > prev.m) best.set(b.id, { m, w:b.w, h:b.h, view:`#${stop}` });
  }
}
await browser.close();
const rows = [...best.entries()].sort((a,b)=>b[1].m-a[1].m);
console.log("object             size      moves   (max % of its own pixels changing over 2.4s)\n");
for (const [id,v] of rows)
  console.log(`${id.padEnd(18)} ${String(v.w).padStart(4)}x${String(v.h).padStart(3)}  ${v.m.toFixed(1).padStart(6)}%   ${v.view}`);

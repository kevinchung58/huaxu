/* Sweep a whole day-night cycle and report, for each sample, how much of the Blue Wing is on
   screen and how high it stands. Polling beats guessing the phase: the phase read off the page and
   the phase guessed from performance.now() disagreed by a third of a cycle, so every earlier
   "opening" sample was taken with the bridge shut. */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const N = Number(process.argv[2]||28), GAP = Number(process.argv[3]||8000);
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
const errs=[]; page.on("pageerror", e=>errs.push(String(e).slice(0,120)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
await page.evaluate(()=>document.querySelectorAll("[data-walk-stop]")[2].click());
await sleep(1500);
let best = {blue:0}, rows=[];
for (let i=0;i<N;i++){
  const ph = await page.evaluate(()=>globalThis.__PHASE);
  let buf;
  try { buf = await page.screenshot(); }
  catch(e){ console.log(`sample ${i}: screenshot failed (${String(e).slice(0,60)})`); break; }
  const im = await loadImage(buf);
  const c=createCanvas(1024,768), g=c.getContext("2d"); g.drawImage(im,0,0);
  const D=g.getImageData(0,0,1024,768).data;
  let n=0, miny=1e9, maxy=-1;
  for(let y=0;y<768;y++)for(let x=0;x<1024;x++){
    const p=(y*1024+x)*4, R=D[p],G=D[p+1],B=D[p+2];
    if(B>100 && B-R>35 && B-G>20 && G>R){ n++; if(y<miny)miny=y; if(y>maxy)maxy=y; }
  }
  const win = ph == null ? "      " : (ph>0.72&&ph<0.94 ? "OPEN  " : "shut  ");
  rows.push(`  ${String(i).padStart(2)}  ${ph==null?"      ":("p="+ph.toFixed(3))} ${win} blue ${String(n).padStart(5)}  y ${n?miny+".."+maxy:"--"}`);
  if(n>best.blue) best={blue:n, i, miny, maxy};
  await sleep(GAP);
}
console.log(rows.join("\n"));
console.log(`\n brightest sample: #${best.i} with ${best.blue} blue px` + (best.blue?`  spanning y ${best.miny}..${best.maxy}`:""));
console.log(errs.length? "PAGE ERRORS: "+errs[0] : " no page errors");
await browser.close();

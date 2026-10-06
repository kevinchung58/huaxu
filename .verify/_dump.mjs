import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
page.on("pageerror", e=>console.log("PAGEERROR:", String(e).slice(0,160)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
await page.evaluate(()=>document.querySelectorAll("[data-walk-stop]")[4].click());
await sleep(1800);
const rects = await page.evaluate(()=>[...document.querySelectorAll("[data-obj]")].map(e=>{
  const r=e.getBoundingClientRect();
  return {id:e.dataset.obj, x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height),
          vis:getComputedStyle(e).visibility}; }));
const im=await loadImage(await page.screenshot());
const c=createCanvas(1024,768),g=c.getContext("2d"); g.drawImage(im,0,0);
const D=g.getImageData(0,0,1024,768).data;
for (const r of rects) {
  if (r.w<4 || r.h<4) continue;
  let n=0, R=0,G=0,B=0, cy=0;
  for(let y=Math.max(0,r.y); y<Math.min(768,r.y+r.h); y++)
    for(let x=Math.max(0,r.x); x<Math.min(1024,r.x+r.w); x++){
      const p=(y*1024+x)*4; R+=D[p];G+=D[p+1];B+=D[p+2];n++;
      if(D[p+1]-D[p]>40 && D[p+2]-D[p]>40) cy++;
    }
  if(!n) continue;
  console.log(`${r.id.padEnd(18)} rect ${String(r.x).padStart(4)},${String(r.y).padStart(3)} ${String(r.w).padStart(4)}x${String(r.h).padStart(3)}  ${r.vis.padEnd(8)} mean rgb(${(R/n).toFixed(0)},${(G/n).toFixed(0)},${(B/n).toFixed(0)})  cyan ${(cy/n*100).toFixed(1)}%`);
}
await browser.close();

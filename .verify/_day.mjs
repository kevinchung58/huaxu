/* Sample the hall's day by simply waiting. No clock trickery: `performance.now` could not be
   overridden reliably from the driver, and a measurement that does not work is worse than a slow one. */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8080/rooms-toronto.html",{waitUntil:"networkidle0"});
await sleep(1400);
await page.evaluate(()=>document.querySelectorAll("[data-walk-stop]")[4].click());
await sleep(2300);
for(let k=0;k<13;k++){await page.keyboard.press("ArrowRight");await sleep(60);}
await sleep(900);
const b = await page.evaluate(()=>{const el=document.querySelector('[data-obj="skyline-cn"]');
  const r=el.getBoundingClientRect();
  return {x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};});
const t0 = await page.evaluate(()=>performance.now()/1000);
console.log("elapsed  phase   whole frame   skyline mean   frame p99.5   frame p99.9");
for (const wait of [0, 35, 35, 35, 35]) {
  if (wait) await sleep(wait*1000);
  const t = await page.evaluate(()=>performance.now()/1000);
  const ph = (((t)+78)/240)%1;
  await page.screenshot({path:"/tmp/day.png"});
  const img=await loadImage("/tmp/day.png");
  const c=createCanvas(1024,768),g=c.getContext("2d");g.drawImage(img,0,0);
  const D=g.getImageData(0,0,1024,768).data;
  let s=0,n=0,ws=0,wn=0,wb=0; const all=[];
  for(let p=0;p<D.length;p+=4){const l=(D[p]*299+D[p+1]*587+D[p+2]*114)/1000;s+=l;n++;all.push(l);}
  for(let y=Math.max(0,b.y);y<Math.min(768,b.y+b.h);y++)
    for(let x=Math.max(0,b.x);x<Math.min(1024,b.x+b.w);x++){
      const p=(y*1024+x)*4; const l=(D[p]*299+D[p+1]*587+D[p+2]*114)/1000;
      ws+=l; wn++; all.push(l);
    }
  console.log(`${(t-t0).toFixed(0).padStart(5)}s  ${ph.toFixed(3)}   ${(s/n).toFixed(1).padStart(6)}       ${(ws/wn).toFixed(1).padStart(6)}    ${(all.sort((a,b)=>a-b)[Math.floor(all.length*0.995)]).toFixed(0).padStart(6)}   ${(all[Math.floor(all.length*0.999)]).toFixed(0).padStart(6)}`);
}
await browser.close();

/* How big is the motion, not just how many pixels cross a line.

   verify-motion.mjs reports the best frame-pair at the best viewpoint, and that number lied to me.
   It said the market stalls moved 7 to 13 percent; measured honestly, as the average over every
   frame-pair, they moved 1.7 to 6.1 -- a still photograph. The max-over-pairs hid it, because even
   a dead object has one pair of frames that happens to differ.

   So this measures the magnitude of change: mean and p95 summed-RGB delta per pixel, out of 765,
   averaged over every consecutive pair. That is the number that decides whether something reads as
   moving. For scale, a swaying tree sits near 23 and a crate near 0.

   It is also the number that caught the real bug: I had hung the stall animation on `q.lit`, which
   only lays a warm wash over an unchanged base and is gated at lit > 0.55 -- a threshold the stalls
   never clear in a dim hall. Swinging it by a quarter moved nothing. The base colour has to change.

   Run:  node .verify/verify-motion-magnitude.mjs   */
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
const grab = async (img,b) => { const c=createCanvas(b.w,b.h),g=c.getContext("2d");
  g.drawImage(img, b.x, b.y, b.w, b.h, 0,0,b.w,b.h);
  return g.getImageData(0,0,b.w,b.h).data; };
const TARGETS=[["stall-m1",3,-90],["stall-m2",3,-90],["stall-m3",3,-90],["falls-n",2,90],["tower-cn",4,0],["tree-m1",3,-90]];
console.log("object        bbox       px      mean|d|   p95|d|   >14    >40");
for (const [id,stop,deg] of TARGETS) {
  await page.goto("http://127.0.0.1:8080/rooms-toronto.html",{waitUntil:"networkidle0"});
  await sleep(1400);
  await page.evaluate(s=>document.querySelectorAll("[data-walk-stop]")[s].click(), stop);
  await sleep(2400);
  const key=deg<0?"ArrowLeft":"ArrowRight";
  for(let k=0;k<Math.round(Math.abs(deg)/7);k++){await page.keyboard.press(key);await sleep(70);}
  await sleep(1000);
  const b = await page.evaluate(i=>{const el=document.querySelector(`[data-obj="${i}"]`);
    const r=el.getBoundingClientRect();
    return {x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};}, id);
  const frames=[];
  for(let i=0;i<6;i++){const f=`/tmp/mg${i}.png`;await page.screenshot({path:f});
    frames.push(await grab(await loadImage(f), b)); if(i<5) await sleep(700);}
  let sum=0,cnt=0,all=[];
  for(let i=0;i<frames.length-1;i++){
    const A=frames[i],B=frames[i+1];
    for(let p=0;p<A.length;p+=4){
      const d=Math.abs(A[p]-B[p])+Math.abs(A[p+1]-B[p+1])+Math.abs(A[p+2]-B[p+2]);
      sum+=d;cnt++;all.push(d);
    }
  }
  all.sort((x,y)=>x-y);
  const px=cnt/(frames.length-1);
  const over14=all.filter(d=>d>14).length/all.length*100;
  const over40=all.filter(d=>d>40).length/all.length*100;
  console.log(`${id.padEnd(13)} ${(b.w+"x"+b.h).padEnd(10)} ${String(px).padStart(6)}  ${(sum/cnt).toFixed(2).padStart(7)}  ${String(all[Math.floor(all.length*0.95)]).padStart(7)}  ${over14.toFixed(1).padStart(5)}%  ${over40.toFixed(1).padStart(5)}%`);
}
await browser.close();

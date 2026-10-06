/* Every prop, at the viewpoint that shows it best: how much of its own rectangle changes, how much
   contrast it carries, and how big it is. The "worst" column is what needs work. */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const VIEWS = [[0,-90],[1,-90],[2,90],[3,-90],[4,0],[4,90]];
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8080/rooms-toronto.html",{waitUntil:"networkidle0"});
await sleep(1400);
const ids = await page.evaluate(()=>Array.from(document.querySelectorAll("[data-obj]")).map(e=>e.dataset.obj));
const grab=(img,b)=>{const c=createCanvas(b.w,b.h),g=c.getContext("2d");
  g.drawImage(img,b.x,b.y,b.w,b.h,0,0,b.w,b.h); return g.getImageData(0,0,b.w,b.h).data;};
const rows=[];
for (const id of ids) {
  let best=null;
  for (const [stop,deg] of VIEWS) {
    await page.goto("http://127.0.0.1:8080/rooms-toronto.html",{waitUntil:"networkidle0"});
    await sleep(900);
    await page.evaluate(s=>document.querySelectorAll("[data-walk-stop]")[s].click(), stop);
    await sleep(1700);
    const key=deg<0?"ArrowLeft":"ArrowRight";
    for(let k=0;k<Math.round(Math.abs(deg)/7);k++){await page.keyboard.press(key);await sleep(60);}
    await sleep(800);
    const b=await page.evaluate(i=>{const el=document.querySelector(`[data-obj="${i}"]`);
      if(!el||getComputedStyle(el).visibility==="hidden")return null;
      const r=el.getBoundingClientRect();
      if(!(r.right>0&&r.left<1024&&r.bottom>0&&r.top<768))return null;
      return {x:Math.max(0,Math.round(r.left)),y:Math.max(0,Math.round(r.top)),
              w:Math.round(r.width),h:Math.round(r.height)};},id);
    if(!b||b.w<8||b.h<8) continue;
    const area=b.w*b.h;
    if(!best||area>best.b.w*best.b.h) best={b,stop,deg};
  }
  if(!best){ rows.push({id,note:"never clearly visible"}); continue; }
  const {b,stop,deg}=best;
  await page.goto("http://127.0.0.1:8080/rooms-toronto.html",{waitUntil:"networkidle0"});
  await sleep(900);
  await page.evaluate(s=>document.querySelectorAll("[data-walk-stop]")[s].click(), stop);
  await sleep(1700);
  const key=deg<0?"ArrowLeft":"ArrowRight";
  for(let k=0;k<Math.round(Math.abs(deg)/7);k++){await page.keyboard.press(key);await sleep(60);}
  await sleep(800);
  const fr=[];
  for(let i=0;i<4;i++){const f=`/tmp/au${i}.png`;await page.screenshot({path:f});
    fr.push(await grab(await loadImage(f),b)); if(i<3) await sleep(700);}
  let sum=0,cnt=0,over=0;
  for(let i=0;i<3;i++) for(let p=0;p<fr[i].length;p+=4){
    const d=Math.abs(fr[i][p]-fr[i+1][p])+Math.abs(fr[i][p+1]-fr[i+1][p+1])+Math.abs(fr[i][p+2]-fr[i+1][p+2]);
    sum+=d;cnt++; if(d>14) over++;
  }
  const A=fr[0]; let n=0,s=0,sq=0; const set=new Set();
  for(let p=0;p<A.length;p+=4){const l=(A[p]*299+A[p+1]*587+A[p+2]*114)/1000;
    s+=l;sq+=l*l;n++;set.add((A[p]>>3<<10)|(A[p+1]>>3<<5)|(A[p+2]>>3));}
  const mean=s/n, sd=Math.sqrt(sq/n-mean*mean);
  rows.push({id,bw:b.w,bh:b.h,px:n,mean:+mean.toFixed(0),sd:+sd.toFixed(0),col:set.size,
             mot:+(sum/cnt).toFixed(2),over:+(100*over/cnt).toFixed(1)});
  console.log(`${id.padEnd(16)} ${(b.w+"x"+b.h).padEnd(10)} mean ${String(Math.round(mean)).padStart(3)}  sd ${String(Math.round(sd)).padStart(3)}  col ${String(set.size).padStart(4)}  mot ${(sum/cnt).toFixed(1).padStart(5)}  ${(100*over/cnt).toFixed(1).padStart(5)}%`);
}
console.log("\n--- worst by motion (should-move things that do not) ---");
rows.filter(r=>r.mot!==undefined&&!/^plinth|^track$/.test(r.id))
  .sort((a,b)=>a.mot-b.mot).slice(0,10)
  .forEach(r=>console.log(`  ${r.id.padEnd(16)} mot ${String(r.mot).padStart(5)}  sd ${String(r.sd).padStart(3)}  col ${r.col}`));
console.log("--- worst by contrast (flattest) ---");
rows.filter(r=>r.sd!==undefined).sort((a,b)=>a.sd-b.sd).slice(0,10)
  .forEach(r=>console.log(`  ${r.id.padEnd(16)} sd ${String(r.sd).padStart(3)}  col ${String(r.col).padStart(4)}  ${r.bw}x${r.bh}`));
await browser.close();

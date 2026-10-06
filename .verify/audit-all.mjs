/* Audits every prop in the Toronto room.

   The previous harness reloaded the page once per prop per viewpoint -- 300 loads, half an hour for
   nine props. This one loads once per viewpoint and measures every prop on screen at that moment:
   ten viewpoints, and everything visible from each of them gets measured. */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const fs = require("fs");
const IDS = [...new Set((fs.readFileSync("rooms-toronto.html","utf8")
  .match(/data-obj="[^"]*"/g)||[]).map(s=>s.slice(10,-1)))];
const VIEWS = [[0,-90],[0,90],[1,-90],[1,90],[2,-90],[2,90],[3,-90],[3,90],[4,-90],[4,90]];
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const page = await browser.newPage();
const best = {};
for (const [stop,deg] of VIEWS) {
  await page.goto("http://127.0.0.1:8080/rooms-toronto.html",{waitUntil:"networkidle0"});
  await sleep(900);
  await page.evaluate(s=>document.querySelectorAll("[data-walk-stop]")[s].click(), stop);
  await sleep(1700);
  const key = deg<0?"ArrowLeft":"ArrowRight";
  for(let k=0;k<Math.round(Math.abs(deg)/7);k++){await page.keyboard.press(key);await sleep(55);}
  await sleep(800);
  const ph = await page.evaluate(()=>(((performance.now()/1000)+78)/240)%1);
  const boxes = await page.evaluate((ids)=>{
    const out={};
    for(const id of ids){const el=document.querySelector(`[data-obj="${id}"]`);
      if(!el) continue; const r=el.getBoundingClientRect();
      if(r.width<6||r.height<6) continue;
      if(r.right<0||r.left>1024||r.bottom<0||r.top>768) continue;
      out[id]={x:Math.max(0,Math.round(r.left)),y:Math.max(0,Math.round(r.top)),
               w:Math.min(1024-Math.max(0,Math.round(r.left)),Math.round(r.width)),
               h:Math.min(768-Math.max(0,Math.round(r.top)),Math.round(r.height))};}
    return out;}, IDS);
  const fr=[];
  for(let i=0;i<4;i++){ await page.screenshot({path:`/tmp/au${i}.png`}); if(i<3) await sleep(700); }
  const imgs=[];
  for(let i=0;i<4;i++) imgs.push(await loadImage(`/tmp/au${i}.png`));
  for (const [id,b] of Object.entries(boxes)) {
    if (b.w<6||b.h<6) continue;
    const px=[];
    for(const im of imgs){const c=createCanvas(b.w,b.h),g=c.getContext("2d");
      g.drawImage(im,b.x,b.y,b.w,b.h,0,0,b.w,b.h);
      px.push(g.getImageData(0,0,b.w,b.h).data);}
    const A=px[0];
    let s=0,n=0,s2=0; const seen=new Set();
    for(let p=0;p<A.length;p+=4){const l=(A[p]*299+A[p+1]*587+A[p+2]*114)/1000;
      s+=l;s2+=l*l;n++;seen.add(((A[p]>>3)<<10)|((A[p+1]>>3)<<5)|(A[p+2]>>3));}
    const mean=s/n, sd=Math.sqrt(Math.max(0,s2/n-mean*mean));
    let d=0,big=0;
    for(let i=1;i<4;i++){const B=px[i];
      for(let p=0;p<A.length;p+=4){const v=(Math.abs(A[p]-B[p])+Math.abs(A[p+1]-B[p+1])
        +Math.abs(A[p+2]-B[p+2]))/3; d+=v; if(v>14)big++;}}
    d/=(3*(A.length/4)); big=100*big/(3*(A.length/4));
    const rec={b,stop,deg,mean,sd,col:seen.size,mot:d,big};
    const area=b.w*b.h;
    if(!best[id]||area>best[id].b.w*best[id].b.h) best[id]=rec;
  }
  process.stderr.write(`  view ${stop}/${deg}: ${Object.keys(boxes).length} props\n`);
}
console.log("object            bbox        mean    sd   col     mot   px>14   best at      views>sd20");
for (const id of IDS) {
  const rs=(best[id]||[]).filter(r=>r.mean>18);   // drop regions the object is not painted in
  if(!rs.length){console.log(`${id.padEnd(18)} ${"—".padEnd(11)}  not painted in any of the ten views`);continue;}
  const r=rs.reduce((a,b)=>b.sd>a.sd?b:a);
  const good=rs.filter(v=>v.sd>20).length;
  console.log(`${id.padEnd(18)} ${(r.b.w+"x"+r.b.h).padEnd(11)} ${r.mean.toFixed(0).padStart(5)} ${r.sd.toFixed(0).padStart(5)} ${String(r.col).padStart(5)} ${r.mot.toFixed(1).padStart(7)} ${r.big.toFixed(1).padStart(6)}%  stop ${r.stop} ${String(r.deg).padStart(4)}   ${good}/${rs.length}`);
}
await browser.close();

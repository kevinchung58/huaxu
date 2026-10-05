/* Audits every Toronto prop from a slice of viewpoints, then exits.

   A single process over all ten viewpoints ran out of memory at the seventh of them and died, so
   the sweep is split into batches and each batch gets its own browser. Records are written to JSON
   and merged afterwards, because "which angle is best" is only answerable once every angle is in.

   Usage: node audit-views.mjs <firstViewIndex> <lastViewIndexExclusive> <outFile> */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const fs = require("fs");
const V0 = Number(process.argv[2] || 0), V1 = Number(process.argv[3] || 10);
const OUT = process.argv[4] || "/tmp/audit_part.json";
const IDS = [...new Set((fs.readFileSync("rooms-toronto.html","utf8")
  .match(/data-obj="[^"]*"/g)||[]).map(s=>s.slice(10,-1)))];
/* Every angle, not just the two extremes.

   This list used to be -90 and +90 only, and that alone produced two wrong conclusions in a row:
   at the full turn an object is edge-on, so the city table read 33 to 73 colours when from a
   frontal or oblique angle it reads 400 to 530. The honest set is the range of angles a visitor
   actually stops at. */
const VIEWS = [];
for (const st of [0,1,2,3,4]) for (const dg of [-90,-45,0,45,90]) VIEWS.push([st,dg]);
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out = {};
for (let vi=V0; vi<V1 && vi<VIEWS.length; vi++) {
  const [stop,deg] = VIEWS[vi];
  const page = await browser.newPage();
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
  const px=[];
  for(let i=0;i<4;i++){
    await page.screenshot({path:`/tmp/av${V0}.png`});
    const im=await loadImage(`/tmp/av${V0}.png`);
    const c=createCanvas(1024,768),g=c.getContext("2d"); g.drawImage(im,0,0);
    px.push(g.getImageData(0,0,1024,768).data);
    if(i<3) await sleep(700);
  }
  await page.close();
  for (const [id,b] of Object.entries(boxes)) {
    if (b.w<6||b.h<6) continue;
    const A=px[0];
    let s=0,n=0,s2=0; const seen=new Set();
    for(let y=b.y;y<b.y+b.h;y++) for(let x=b.x;x<b.x+b.w;x++){
      const p=(y*1024+x)*4; const l=(A[p]*299+A[p+1]*587+A[p+2]*114)/1000;
      s+=l;s2+=l*l;n++;seen.add(((A[p]>>3)<<10)|((A[p+1]>>3)<<5)|(A[p+2]>>3));}
    if(!n) continue;
    const mean=s/n, sd=Math.sqrt(Math.max(0,s2/n-mean*mean));
    let d=0,big=0,cnt=0;
    for(let i=1;i<4;i++){const B=px[i];
      for(let y=b.y;y<b.y+b.h;y++) for(let x=b.x;x<b.x+b.w;x++){
        const p=(y*1024+x)*4;
        const v=(Math.abs(A[p]-B[p])+Math.abs(A[p+1]-B[p+1])+Math.abs(A[p+2]-B[p+2]))/3;
        d+=v; if(v>14)big++; cnt++;}}
    (out[id]=out[id]||[]).push({b,stop,deg,ph,mean,sd,col:seen.size,
      mot:d/(3*cnt),big:100*big/(3*cnt)});
  }
  process.stderr.write(`  view ${vi} (${VIEWS[vi]}): ${Object.keys(boxes).length} props\n`);
  px.length = 0;
}
fs.writeFileSync(OUT, JSON.stringify(out));
await browser.close();
console.log(`wrote ${OUT}: ${Object.keys(out).length} props`);

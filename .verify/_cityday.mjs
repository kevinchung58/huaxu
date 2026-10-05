/* The city table across a whole day, all at one good angle.

   Every audit so far has landed at whatever hour it happened to run at, which is how the city
   table got blamed for a collapse that was really a viewpoint artifact. This watches five props
   through a full cycle so day and night can be compared against each other instead of against
   memory. */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const IDS = ["tower-cn","dome-rc","skyline-cn","tram-t","plinth-sky"];
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8080/rooms-toronto.html",{waitUntil:"networkidle0"});
await sleep(1000);
await page.evaluate(()=>document.querySelectorAll("[data-walk-stop]")[4].click());
await sleep(1800);
for(let k=0;k<6;k++){await page.keyboard.press("ArrowRight");await sleep(50);}  // ~42 deg
await sleep(900);
const B = await page.evaluate((ids)=>{const o={};
  for(const id of ids){const el=document.querySelector(`[data-obj="${id}"]`); if(!el)continue;
    const r=el.getBoundingClientRect();
    o[id]={x:Math.max(0,Math.round(r.left)),y:Math.max(0,Math.round(r.top)),
           w:Math.min(1024-Math.max(0,Math.round(r.left)),Math.round(r.width)),
           h:Math.min(768-Math.max(0,Math.round(r.top)),Math.round(r.height))};}
  return o;}, IDS);
console.log("phase  tod    " + IDS.map(i=>i.padStart(11)).join("") + "     (colours)");
for(let i=0;i<12;i++){
  const ph = await page.evaluate(()=>(((performance.now()/1000)+78)/240)%1);
  await page.screenshot({path:"/tmp/cd.png"});
  const im=await loadImage("/tmp/cd.png");
  const c=createCanvas(1024,768),g=c.getContext("2d"); g.drawImage(im,0,0);
  const D=g.getImageData(0,0,1024,768).data;
  const cells=[];
  for(const id of IDS){
    const b=B[id]; if(!b||b.w<6||b.h<6){cells.push("     --   ");continue;}
    let s=0,n=0,s2=0; const seen=new Set();
    for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){
      const p=(y*1024+x)*4;const l=(D[p]*299+D[p+1]*587+D[p+2]*114)/1000;
      s+=l;s2+=l*l;n++;seen.add(((D[p]>>3)<<10)|((D[p+1]>>3)<<5)|(D[p+2]>>3));}
    const mean=s/n,sd=Math.sqrt(Math.max(0,s2/n-mean*mean));
    cells.push(`${mean.toFixed(0).padStart(4)}/${sd.toFixed(0).padStart(2)}/${String(seen.size).padStart(3)}`);
  }
  console.log(`${ph.toFixed(3)}  ${(ph>0.25&&ph<0.75?"day ":"night")} ${cells.join("  ")}`);
  await sleep(19000);
}
await browser.close();

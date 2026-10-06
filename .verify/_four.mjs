/* Each building's volume is painted its own colour, so all four can be measured in one run and
   the DOM press-box is not trusted: the box is bigger than the prop and its mean is mostly
   whatever is behind the prop. */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const NAMES={red:"customhouse", grn:"osakashosen", blu:"dalianhall", yel:"stationfront"};
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
page.on("pageerror", e=>console.log("PAGEERROR:", String(e).slice(0,160)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
for (const st of [2,4]) {
  await page.evaluate(s=>document.querySelectorAll("[data-walk-stop]")[s].click(), st);
  await sleep(1700);
  const im=await loadImage(await page.screenshot());
  const c=createCanvas(1024,768),g=c.getContext("2d"); g.drawImage(im,0,0);
  const D=g.getImageData(0,0,1024,768).data;
  const acc={red:[0,1e9,-1,1e9,-1],grn:[0,1e9,-1,1e9,-1],blu:[0,1e9,-1,1e9,-1],yel:[0,1e9,-1,1e9,-1]};
  for(let y=0;y<768;y++)for(let x=0;x<1024;x++){
    const p=(y*1024+x)*4, R=D[p],G=D[p+1],B=D[p+2], mx=Math.max(R,G,B);
    let k=null;
    if(mx>90){
      if(R-Math.max(G,B)>55) k="red";
      else if(G-Math.max(R,B)>55) k="grn";
      else if(B-Math.max(R,G)>55) k="blu";
      else if(R>150&&G>150&&B<Math.min(R,G)-55) k="yel";
    }
    if(!k) continue;
    const a=acc[k]; a[0]++; a[1]=Math.min(a[1],x); a[2]=Math.max(a[2],x);
    a[3]=Math.min(a[3],y); a[4]=Math.max(a[4],y);
  }
  console.log(`stop ${st}:`);
  for(const k of ["red","grn","blu","yel"]){ const a=acc[k];
    console.log(`   ${NAMES[k].padEnd(13)} ${String(a[0]).padStart(5)} px` +
      (a[0]?`  ${a[1]},${a[3]} - ${a[2]},${a[4]}  (${a[2]-a[1]}x${a[4]-a[3]})`:"   <-- NOT DRAWN"));}
}
await browser.close();

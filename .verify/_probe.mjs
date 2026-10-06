/* Three props, three probe colours, one run. Each building is checked by the part that makes it
   the building it is -- not its box, which is the part least likely to be wrong.
   Colours are far apart in RGB so the counts cannot leak into each other. */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const LABEL = { M: "customhouse observation room", C: "Osaka Shosen octagonal tower",
                Y: "Dalian hall steeple" };
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
page.on("pageerror", e=>console.log("PAGEERROR:", String(e).slice(0,160)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
for (const st of [3,4]) {
  await page.evaluate(s=>document.querySelectorAll("[data-walk-stop]")[s].click(), st);
  await sleep(1700);
  const im=await loadImage(await page.screenshot());
  const c=createCanvas(1024,768),g=c.getContext("2d"); g.drawImage(im,0,0);
  const D=g.getImageData(0,0,1024,768).data;
  const acc={M:[0,1e9,-1,1e9,-1],C:[0,1e9,-1,1e9,-1],Y:[0,1e9,-1,1e9,-1]};
  for(let y=0;y<768;y++)for(let x=0;x<1024;x++){
    const p=(y*1024+x)*4, R=D[p],G=D[p+1],B=D[p+2];
    // score each hue, keep anything with a clear lean rather than a hard threshold
    const sc = { M: Math.min(R,B)-G, C: Math.min(G,B)-R, Y: Math.min(R,G)-B };
    const best = Object.keys(sc).reduce((a,b)=>sc[a]>=sc[b]?a:b);
    if (sc[best] < 30) continue;
    const a=acc[best]; a[0]++; a[1]=Math.min(a[1],x); a[2]=Math.max(a[2],x);
    a[3]=Math.min(a[3],y); a[4]=Math.max(a[4],y);
  }
  console.log(`stop ${st}:`);
  for(const k of ["M","C","Y"]){ const a=acc[k];
    console.log(`   ${k} ${LABEL[k].padEnd(32)} ${String(a[0]).padStart(5)} px` +
      (a[0]?`  bbox ${a[1]},${a[3]} - ${a[2]},${a[4]}  (${a[2]-a[1]}x${a[4]-a[3]})`:"   <-- NOT DRAWN"));}
}
await browser.close();

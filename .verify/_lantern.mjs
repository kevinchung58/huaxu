/* Are the lanterns on screen? Count the paper's warm glow over the whole frame at each stop.
   Read in the page: a screenshot costs 20-35 s and this only needs a number. */
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
page.on("pageerror", e=>console.log("PAGEERROR:", String(e).slice(0,140)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
const out=[];
for (const st of [0,1,2,3,4]) {
  await page.evaluate(s=>document.querySelectorAll("[data-walk-stop]")[s].click(), st);
  await sleep(1600);
  const r = await page.evaluate(()=>{
    const cv=[...document.querySelectorAll("canvas")].find(c=>c.width>600&&c.height>400);
    const g=cv.getContext("2d",{willReadFrequently:true});
    const D=g.getImageData(0,0,cv.width,cv.height).data;
    let warm=0, n=0, ysum=0, xsum=0;
    for(let p=0;p<D.length;p+=4){ n++;
      // the paper: bright, amber, and nothing else in this room is that orange
      if(D[p]>205 && D[p]-D[p+2]>70 && D[p+1]>110 && D[p+1]<215){ warm++;
        const i=p/4; xsum+=i%cv.width; ysum+=Math.floor(i/cv.width); } }
    return { warm, per1k: warm/n*1000, cx: warm?Math.round(xsum/warm):-1, cy: warm?Math.round(ysum/warm):-1 };
  });
  out.push(`  stop ${st}: ${String(r.warm).padStart(6)} warm px  (${r.per1k.toFixed(1)} per 1k)  centroid ${r.cx},${r.cy}`);
}
console.log(out.join("\n"));
await browser.close();

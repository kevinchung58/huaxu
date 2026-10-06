import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const [X0,Y0,X1,Y1]=process.argv.slice(2,6).map(Number);
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
page.on("pageerror", e=>console.log("PAGEERROR:", String(e).slice(0,160)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
await page.evaluate(()=>document.querySelectorAll("[data-walk-stop]")[4].click());
await sleep(1800);
const im=await loadImage(await page.screenshot());
const c=createCanvas(1024,768),g=c.getContext("2d"); g.drawImage(im,0,0);
const D=g.getImageData(0,0,1024,768).data;
const hist=new Map();
for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){
  const p=(y*1024+x)*4;
  const k=`${D[p]>>4},${D[p+1]>>4},${D[p+2]>>4}`;
  hist.set(k,(hist.get(k)||0)+1);
}
const top=[...hist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
const N=(X1-X0+1)*(Y1-Y0+1);
console.log(`region ${X0},${Y0} - ${X1},${Y1}  (${N} px)  top colours:`);
for(const [k,v] of top){ const [r,gg,b]=k.split(",").map(n=>n*16);
  console.log(`   rgb(${String(r).padStart(3)},${String(gg).padStart(3)},${String(b).padStart(3)}) x ~${String(v).padStart(4)}  ${(v/N*100).toFixed(1)}%`); }
await browser.close();

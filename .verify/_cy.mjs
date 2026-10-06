import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
page.on("pageerror", e=>console.log("PAGEERROR:", String(e).slice(0,160)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
await page.evaluate(()=>document.querySelectorAll("[data-walk-stop]")[4].click());
await sleep(1800);
const cy = await page.evaluate(()=>globalThis.__CY||[]);
console.log("cyan quads:"); cy.forEach(l=>console.log("   "+l));
const box = await page.evaluate(()=>{const e=[...document.querySelectorAll("[data-obj]")].find(e=>e.dataset.obj==="customhouse-mj");
  const r=e.getBoundingClientRect(); return `DOM rect ${r.x.toFixed(0)},${r.y.toFixed(0)} - ${r.right.toFixed(0)},${r.bottom.toFixed(0)}  vis=${getComputedStyle(e).visibility}`;});
console.log(box);
const im=await loadImage(await page.screenshot());
const c=createCanvas(1024,768),g=c.getContext("2d"); g.drawImage(im,0,0);
const D=g.getImageData(0,0,1024,768).data;
let n=0; for(let p=0;p<D.length;p+=4) if(D[p+1]-D[p]>40&&D[p+2]-D[p]>40) n++;
console.log("cyan-ish pixels anywhere on screen:", n);
await browser.close();

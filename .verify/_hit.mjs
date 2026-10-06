import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
page.on("pageerror", e=>console.log("PAGEERROR:", String(e).slice(0,200)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
await page.evaluate(()=>document.querySelectorAll("[data-walk-stop]")[4].click());
await sleep(2500);
console.log("branch entries:", JSON.stringify(await page.evaluate(()=>globalThis.__HIT||{})));
console.log("quads per prop:", JSON.stringify(await page.evaluate(()=>{
  const out={};
  document.querySelectorAll("[data-obj]").forEach(el=>{ out[el.dataset.obj]=el.dataset.kind||"?"; });
  return out; })));
await browser.close();

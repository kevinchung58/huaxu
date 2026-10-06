/* Bucket by phase instead of by wall-clock sample. Sampling every N seconds can only ever see the
   room's day-night swing, because the whole stagger lasts nine seconds of a sixty-seven second
   cycle. Reading the canvas in the page is nearly free, so this takes hundreds of samples and puts
   each one in the phase bin it belongs to. */
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const N = Number(process.argv[2]||420), BINS = 20;
const R = [["station",421,388,560,473], ["custom",564,395,689,473],
            ["osaka",689,416,796,474], ["dalian",332,431,420,472]];
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args:[...chromium.args,"--no-sandbox","--disable-dev-shm-usage"], headless:true,
  defaultViewport:{width:1024,height:768}});
const page = await browser.newPage();
page.on("pageerror", e=>console.log("PAGEERROR:", String(e).slice(0,140)));
await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html",{waitUntil:"networkidle0"});
await sleep(1200);
await page.evaluate(()=>document.querySelectorAll("[data-walk-stop]")[4].click());
await sleep(1500);
const bins = Array.from({length:BINS},()=>R.map(()=>({s:0,n:0})));
for(let i=0;i<N;i++){
  const r = await page.evaluate((R,bn)=>{
    const ph = globalThis.__PHASE; if (ph == null) return null;
    const cv=[...document.querySelectorAll("canvas")].find(c=>c.width>600&&c.height>400);
    if(!cv) return null;
    const g=cv.getContext("2d",{willReadFrequently:true}); const sc=cv.width/1024;
    return { b: Math.min(bn-1, Math.floor(ph*bn)),
      v: R.map(([n,x0,y0,x1,y1])=>{
        const X=Math.round(x0*sc),Y=Math.round(y0*sc),
              Wd=Math.max(1,Math.round((x1-x0)*sc)),Ht=Math.max(1,Math.round((y1-y0)*sc));
        const D=g.getImageData(X,Y,Wd,Ht).data; let lit=0,k=0;
        for(let p=0;p<D.length;p+=4){k++; if(D[p]>185 && D[p]-D[p+2]>45) lit++;}
        return lit/k*100; }) };
  }, R, BINS);
  if(r) r.v.forEach((v,k)=>{ bins[r.b][k].s+=v; bins[r.b][k].n++; });
  await sleep(20);
}
console.log("lit-window coverage by phase (20 bins over one cycle)\\n");
console.log("  phase  " + R.map(([n])=>n.padStart(8)).join(""));
for(let b=0;b<BINS;b++){
  const row=bins[b].map(o=>o.n?(o.s/o.n).toFixed(0).padStart(8):"       -").join("");
  console.log(`  ${(b/BINS).toFixed(2)}  ${row}`);
}
console.log("\\n  onset (first bin where coverage beats its own minimum by a third):");
R.forEach(([n],k)=>{
  const col=bins.map(o=>o.n?o.s/o.n:0); const lo=Math.min(...col), hi=Math.max(...col);
  let on=-1; for(let b=0;b<BINS;b++){ if(col[b] > lo + 0.33*(hi-lo)){ on=b; break; } }
  console.log(`     ${n.padEnd(8)} ${on<0?"never":(on/BINS).toFixed(2)}`);
});
await browser.close();

/* Do the buildings come alight one after another?

   Read the canvas in the page instead of screenshotting. A screenshot costs 20-35 s here, and the
   whole stagger lasts about nine seconds, so a screenshot every 35 s can only ever see the room's
   day-night swing and will report every building peaking together. getImageData costs nothing, so
   this samples every 1.4 s and can actually resolve the ordering. */
import { createRequire } from "node:module";
const require = createRequire("/home/user/huaxu/");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const N = Number(process.argv[2]||70);
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
const rows=[];
for(let i=0;i<N;i++){
  const r = await page.evaluate((R)=>{
    const cv=[...document.querySelectorAll("canvas")].find(c=>c.width>600&&c.height>400);
    if(!cv) return null;
    const g=cv.getContext("2d", {willReadFrequently:true});
    const sc=cv.width/1024;
    return R.map(([n,x0,y0,x1,y1])=>{
      const X=Math.round(x0*sc),Y=Math.round(y0*sc),
            Wd=Math.max(1,Math.round((x1-x0)*sc)),Ht=Math.max(1,Math.round((y1-y0)*sc));
      const D=g.getImageData(X,Y,Wd,Ht).data; let s=0,k=0,lit=0;
      for(let p=0;p<D.length;p+=4){s+=(D[p]*299+D[p+1]*587+D[p+2]*114)/1000;k++;
        // a lit window is bright and warm: this counts the windows, not the wall around them,
        // so the room's own day-night swing does not drown the thing being measured.
        if(D[p]>185 && D[p]-D[p+2]>45) lit++;}
      return [n, lit/k*100];
    });
  }, R);
  if(!r){ console.log("no canvas"); break; }
  rows.push(r);
  console.log(`  ${String(i).padStart(2)}  ` + r.map(([n,v])=>v.toFixed(0).padStart(5)).join("  "));
  await sleep(1400);
}
console.log("\n       station custom  osaka dalian");
/* Onset, not peak. A building that is bright all day peaks in the day; what the brief asks is that
   they come alight one after another, and that is the moment each one starts climbing out of its
   own darkest point. */
const onsets=[];
R.forEach(([n],k)=>{
  const col=rows.map(r=>r[k][1]); const lo=Math.min(...col), hi=Math.max(...col);
  const tr=col.indexOf(lo);
  let onset=-1;
  for(let i=tr;i<col.length;i++){ if(col[i] > lo + 0.35*(hi-lo)){ onset=i; break; } }
  onsets.push([n,onset,lo,hi,tr]);
  console.log(`   ${n.padEnd(8)} ${lo.toFixed(1)}%..${hi.toFixed(1)}%  darkest at ${String(tr).padStart(2)}` +
              `  climbs from sample ${String(onset).padStart(2)}`);
});
const ord=[...onsets].sort((a,b)=>a[1]-b[1]).map(o=>o[0]);
console.log("\n   order they come alight: " + ord.join("  ->  "));
console.log("   authored order should be: station  ->  custom  ->  osaka  ->  dalian");
await browser.close();

import { launch, openPage, sleep } from "./_aim.mjs";
const b = await launch({width:1024,height:768});
const p = await openPage(b, {rooms:"rooms-goat.html", hour:"day"});
await sleep(2500);
const o = await p.evaluate(()=>{
  const out={};
  for (const el of document.querySelectorAll("[data-obj]")) {
    const r=el.getBoundingClientRect();
    out[el.dataset.obj]=[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height),getComputedStyle(el).visibility, el.tabIndex];
  }
  return out;});
console.log(JSON.stringify(o,null,0).slice(0,1800));
await b.close();

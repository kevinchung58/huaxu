import { launch, openPage, arrive, aim, park } from "./_aim.mjs";
const b = await launch({width:1024,height:768});
const p = await openPage(b, {rooms:"rooms-goat.html", hour:"day"});
await arrive(p, 2); await aim(p, -30); await park(p, 1200);
console.log(JSON.stringify(await p.evaluate(()=>{
  const out={};
  for (const id of ["falls-american","falls-horseshoe","pool-lower","terrapin","channel-e"]) {
    const el=document.querySelector(`[data-obj="${id}"]`);
    if(!el){out[id]="MISSING";continue;}
    const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
    out[id]={l:Math.round(r.left),t:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),vis:cs.visibility,op:cs.opacity,dsp:cs.display};
  }
  return out;
}), null, 1));
await b.close();

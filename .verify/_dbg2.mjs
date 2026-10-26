import { launch, openPage, arrive, aim, sleep, state } from "./_aim.mjs";
const b = await launch({width:1024,height:768});
const p = await openPage(b, {rooms:"rooms-goat.html", hour:"day"});
await arrive(p, 2); await aim(p, -30);
for (const [label, mv] of [["hover centre", [512,384]], ["parked (2,2)", [2,2]]]) {
  await p.mouse.move(mv[0], mv[1]); await p.mouse.move(mv[0]+1, mv[1]); await sleep(900);
  const o = await p.evaluate(()=>{const out={};for(const id of ["falls-american","falls-horseshoe","terrapin"]){
    const el=document.querySelector(`[data-obj="${id}"]`); const r=el.getBoundingClientRect();
    out[id]=[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height),getComputedStyle(el).visibility];}
    return out;});
  console.log(label, JSON.stringify(o));
}
await b.close();

import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";
const IDS = ["falls-american","falls-horseshoe","terrapin","luna-bridge","plunge-w","pool-lower","boulders-e1","channel-e"];
const b = await launch({width:1024,height:768});
const p = await openPage(b, {rooms:"rooms-goat.html", hour:"day"});
for (const stop of [0,1,2,3]) {
  const a = await arrive(p, stop);
  if (!a.arrived && !a.blocked) { console.log(`stop ${stop}: ${a.why}`); continue; }
  for (let yaw=-180; yaw<180; yaw+=30) {
    const g = await aim(p, yaw);
    if (!g.aimed) continue;
    await park(p, 250);
    const box = await p.evaluate((ids)=>{
      const o={};
      for (const id of ids){const el=document.querySelector(`[data-obj="${id}"]`); if(!el) continue;
        const r=el.getBoundingClientRect(); const x=Math.max(0,r.left), y=Math.max(0,r.top);
        const w=Math.min(1024,r.right)-x, h=Math.min(768,r.bottom)-y;
        if (w>20&&h>20) o[id]=Math.round(w*h);}
      return o;}, IDS);
    console.log(`stop ${stop} yaw ${Math.round(g.yaw)}: ${JSON.stringify(box)}`);
  }
}
await b.close();

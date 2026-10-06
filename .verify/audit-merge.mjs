/* Merges the per-batch audit JSON into one table.

   Which angle is best is only answerable once every angle is in, so the batches are joined first
   and judged after. */
import fs from "node:fs";
const PAGE = process.env.PAGE || "rooms-toronto.html";
const IDS = [...new Set((fs.readFileSync(PAGE,"utf8")
  .match(/data-obj="[^"]*"/g)||[]).map(s=>s.slice(10,-1)))];
const all = {};
for (const f of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(f,"utf8"));
  for (const [id,rs] of Object.entries(j)) (all[id]=all[id]||[]).push(...rs);
}
const rows=[];
console.log("object            bbox        mean    sd   col     mot   px>14   best at     good/all");
for (const id of IDS) {
  const rs=(all[id]||[]).filter(r=>r.mean>18);   // drop regions nothing is painted in
  if(!rs.length){rows.push({id,note:"not painted in any of the ten views"});
    console.log(`${id.padEnd(18)} —            not painted in any of the ten views`); continue;}
  /* Choosing the single most detailed crop was its own trap: it prefers a tight crop of a small
     part of the object over a honest view of the whole thing, so track-c measured a 24x83 sliver.
     Only views seeing at least half of the best area are eligible, and detail picks among those. */
  const maxA=Math.max(...rs.map(v=>v.b.w*v.b.h));
  const wide=rs.filter(v=>v.b.w*v.b.h>=0.5*maxA);
  const r=(wide.length?wide:rs).reduce((a,b)=>b.sd>a.sd?b:a);
  const good=wide.filter(v=>v.sd>20).length;
  rows.push({id,sd:r.sd,col:r.col,mot:r.mot,good,all:(wide.length?wide:rs).length,mean:r.mean});
  console.log(`${id.padEnd(18)} ${(r.b.w+"x"+r.b.h).padEnd(11)} ${r.mean.toFixed(0).padStart(5)} ${r.sd.toFixed(0).padStart(5)} ${String(r.col).padStart(5)} ${r.mot.toFixed(1).padStart(7)} ${r.big.toFixed(1).padStart(6)}%  stop ${r.stop} ${String(r.deg).padStart(4)}  ${good}/${rs.length}`);
}
console.log("\n--- weakest by detail (sd) ---");
rows.filter(r=>r.sd!==undefined).sort((a,b)=>a.sd-b.sd).slice(0,12)
  .forEach(r=>console.log(`  ${r.id.padEnd(18)} sd ${r.sd.toFixed(1).padStart(5)}  ${String(r.col).padStart(4)} colours  motion ${r.mot.toFixed(1).padStart(5)}  good angles ${r.good}/${r.all}`));

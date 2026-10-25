/* _shot_at -- one frame, at a stop, a heading and a pitch, with all three read back.

   `_view.mjs` aims a heading but takes the pitch the stop authors. A near shot of something
   overhead -- the SkyWheel's pods, a chōchin's cord, a pagoda's sourin -- needs the head tipped, and
   tipping it by key hold is the same 14.4-degree minimum that made headings unreachable. So this is
   the small tool: same arrival, same drag aim, plus a vertical drag, and the frame is named for the
   head that was actually there.

   Usage:
     LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-niagara.html HOUR=day \
       VIEWS='7:90:-25,5:0:14' node .verify/_shot_at.mjs .preview/nia69k
   VIEWS is stop:yaw:pitch, comma separated. Pitch is positive DOWN (scene3d.js).
*/
import fs from "node:fs";
import { launch, openPage, arrive, aim, park, state, sleep } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms.html";
const OUT = process.argv[2] || ".preview/shot";
const HOUR = process.env.HOUR || "day";
const VW = Number(process.env.VIEW_W || 1024), VH = Number(process.env.VIEW_H || 768);
const VIEWS = (process.env.VIEWS || "0:0:0").split(",").map((v) => {
  const [s, y, p] = v.split(":").map(Number);
  return { stop: s, yaw: y, pitch: Number.isFinite(p) ? p : null };
}).filter((v) => Number.isFinite(v.stop));

fs.mkdirSync(OUT, { recursive: true });
const browser = await launch({ width: VW, height: VH });
const page = await openPage(browser, { rooms: ROOMS, hour: HOUR, width: VW, height: VH });

for (const view of VIEWS) {
  const a = await arrive(page, view.stop);
  if (!a.target) { console.log(`SKIP stop ${view.stop}: no such stop`); continue; }
  if (!a.arrived && !a.blocked) { console.log(`NOT THERE: ${a.why}`); continue; }
  if (a.blocked) console.log(`NOTE stop ${view.stop}: ${a.why}`);
  const g = await aim(page, view.yaw, { pitch: view.pitch, width: VW, height: VH });
  if (!g.aimed) {
    console.log(`NOT AIMED: stop ${view.stop} asked ${view.yaw}/${view.pitch} — at ${g.yaw.toFixed(1)}/${g.pitch.toFixed(1)}`);
    continue;
  }
  await park(page);
  const s = await state(page);
  const name = `stop${view.stop}-yaw${Math.round(s.yaw)}-p${Math.round(s.pitch)}-${VW}x${VH}`;
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`SHOT ${name} ${JSON.stringify({ x: Math.round(s.x), z: Math.round(s.z), yaw: +s.yaw.toFixed(1), pitch: +s.pitch.toFixed(1) })}`);
  await sleep(300);
}
await browser.close();
console.log(`_shot_at: frames in ${OUT}`);

/* _probe-box -- every prop's data-obj rectangle at one stop, several headings.

   The rectangles are the walk's own projection of a prop's drawn faces; `audit-all.mjs` and
   `verify-tables.mjs` both measure through them. Round 70 found one of them sitting on bare wall
   32 degrees away from its model, so the rectangle has to be checkable on its own, and cheaply.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-toronto.html STOP=4 YAWS='0,30,31,60' \
           node .verify/_probe-box.mjs
   Print every prop, or only the ones named in IDS='skyline-cn,tram-t'.
*/
import { launch, openPage, arrive, aim, park, state } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms.html";
const STOP = Number(process.env.STOP || 0);
const YAWS = (process.env.YAWS || "0,30,60").split(",").map(Number);
const IDS = (process.env.IDS || "").split(",").filter(Boolean);

const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: ROOMS, hour: process.env.HOUR || "day" });
const a = await arrive(page, STOP);
if (!a.arrived) { console.log(`SKIP stop ${STOP}: ${a.why || "not reached"}`); await browser.close(); process.exit(1); }
console.log(`STOP ${STOP} "${a.target.label}" at x ${a.target.x} z ${a.target.z} (cm)`);

for (const yaw of YAWS) {
  const g = await aim(page, yaw, { pitch: process.env.PITCH === undefined ? null : Number(process.env.PITCH) });
  if (!g.aimed) { console.log(`  yaw ${yaw}: NOT AIMED (${g.off.toFixed(1)} deg off)`); continue; }
  await park(page);
  const s = await state(page);
  const rects = await page.evaluate((ids) => {
    const out = [];
    for (const el of document.querySelectorAll("[data-obj]")) {
      const id = el.dataset.obj;
      if (ids.length && !ids.includes(id)) continue;
      const q = el.getBoundingClientRect();
      out.push([id, Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height),
                el.style.visibility === "hidden" ? "hidden" : "shown"]);
    }
    return out;
  }, IDS);
  console.log(`  yaw ${s ? s.yaw.toFixed(1) : "?"} pitch ${s ? s.pitch.toFixed(1) : "?"}`);
  for (const r of rects) console.log(`    ${r[0].padEnd(14)} ${String(r[1]).padStart(5)} ${String(r[2]).padStart(4)} ` +
                                      `${String(r[3]).padStart(5)} ${String(r[4]).padStart(4)}  ${r[5]}`);
}
await browser.close();

/* cull-probe -- is the frame's cost in what it submits, or in what it paints?

   TODO §3 P4 wants distance culling on `mrdoob/slop-newyork`'s numbers (500 m cells, CULL_MIN 300,
   CULL_MAX 2000). Before writing any of it, this measures whether the cost is where a distance cull
   could reach it: stand at one stop and read the renderer's own cost, its submitted triangles and
   its draw calls at headings that fill the frame with the transparent water/spray, and at headings
   that look away from it. If the cost collapses when the water leaves the frame while the triangle
   and draw-call counts stay put, the bill is fill rate — and a cull that only stops *submitting*
   geometry cannot pay it.

   Diagnostic, not a gate (it prints and exits 0). Run:
     LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-niagara.html STOP=3 YAWS='-109,71,161' \
       node .verify/cull-probe.mjs
*/
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms-niagara.html";
const STOP = Number(process.env.STOP || 3);
const YAWS = (process.env.YAWS || "-109,71,161").split(",").map(Number);
const VW = 1024, VH = 768;

const browser = await launch({ width: VW, height: VH });
const page = await openPage(browser, { rooms: ROOMS, hour: "day", width: VW, height: VH });
const a = await arrive(page, STOP);
console.log(`${ROOMS} stop ${STOP} "${a.target?.label}" ${a.arrived ? "arrived" : "MISSED"}`);
for (const yaw of YAWS) {
  const g = await aim(page, yaw, { width: VW, height: VH });
  await park(page);
  await sleep(700);
  const m = await page.evaluate(async () => {
    const api = document.querySelector("[data-walk]").__walk;
    const out = [];
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      out.push({ render: api.renderMs, calls: api.threeStats.drawCalls, tris: api.threeStats.frameTriangles });
    }
    out.sort((p, q) => p.render - q.render);
    return { render: out[5].render, calls: out[5].calls, tris: out[5].tris, all: out.map((o) => Math.round(o.render)) };
  });
  console.log(`  yaw ${String(Math.round(g.yaw)).padStart(5)}  render ${m.render.toFixed(1).padStart(7)} ms  ` +
              `calls ${String(m.calls).padStart(4)}  tris ${String(m.tris).padStart(6)}  frames ${m.all.join("/")}`);
}
await browser.close();

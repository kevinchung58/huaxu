/* _scenehash -- what the page asks the renderer to draw, as a number, for an A/B of a refactor.

   Frames are not bit-stable here: the same build differs against itself by ±1 on a few thousand
   pixels (measured 2026-10-30, Toronto stop 4), so "the pictures are identical" is not a claim this
   sandbox can support. What it CAN compare exactly is the programme's output: the list of quads the
   lane hands the renderer (`__walk.drawQuads`) -- each one's mode, colour/tile key, world corners and
   uv -- plus the camera and the renderer's counters. Two builds that produce the same list at the
   same stop and heading are the same scene, whatever the rasteriser does with it afterwards.

   Run: sh bin/gate node .verify/_scenehash.mjs                 (both builds, one table)
        BASE=/some/path/ PAGES=rooms-toronto.html:4:90 ...
*/
import crypto from "node:crypto";
import { launch, openPage, arrive, aim, park } from "./_aim.mjs";

/* path:stop:yaw -- `yaw -` for no aim (pages without a lane) */
const CASES = (process.env.CASES || [
  "rooms-toronto.html:4:90",
  "rooms-fukuoka.html:2:0",
  "rooms-niagara.html:3:-109",
  "rooms-goat.html:3:88",
  "street.html:0:0",
].join(",")).split(",").map((s) => {
  const [path, stop, yaw] = s.split(":");
  return { path, stop: Number(stop), yaw: yaw === "" || yaw === undefined ? null : Number(yaw) };
});
const AFTER = process.env.AFTER || "";
const BEFORE = process.env.BEFORE || ".preview/before/";

const digestOf = (page) => page.evaluate(() => {
  const w = document.querySelector("[data-walk]").__walk;
  const quads = w.drawQuads || [];
  const rows = quads.map((q) => [
    q.mode, q.textureKey || "", q.arg || "", q.fallback || "",
    (q.lit ?? 0).toFixed(3), (q.air ?? 0).toFixed(3), q.nolite ? 1 : 0,
    ...(q.world || []).flatMap((p) => p.map((v) => v.toFixed(2))),
    ...(q.uv || []).flatMap((p) => p.map((v) => v.toFixed(2))),
  ].join("|"));
  rows.sort();
  return {
    quads: quads.length, rows,
    camera: { x: +w.x.toFixed(2), z: +w.depth.toFixed(2), yaw: +w.yaw.toFixed(3), pitch: +w.pitch.toFixed(3) },
    stats: w.threeStats ? JSON.parse(JSON.stringify(w.threeStats)) : null,
  };
});

const browser = await launch({ width: 1024, height: 768 });
let same = 0, differ = 0;
for (const c of CASES) {
  const out = {};
  for (const [tag, prefix] of [["after", AFTER], ["before", BEFORE]]) {
    const page = await openPage(browser, { rooms: prefix + c.path, hour: "day", reduce: true });
    await arrive(page, c.stop);
    if (c.yaw !== null) await aim(page, c.yaw, { width: 1024, height: 768 });
    await park(page, 900);
    const d = await digestOf(page);
    const h = crypto.createHash("sha1").update(d.rows.join("\n")).digest("hex").slice(0, 12);
    out[tag] = { ...d, hash: h };
    await page.close();
  }
  const a = out.after, b = out.before;
  const eq = a.hash === b.hash && JSON.stringify(a.camera) === JSON.stringify(b.camera)
    && JSON.stringify(a.stats) === JSON.stringify(b.stats);
  if (eq) same++; else differ++;
  console.log(`${c.path} stop ${c.stop} yaw ${c.yaw ?? "-"}  quads ${a.quads}/${b.quads}  ` +
              `camera ${eq ? "same" : "DIFFERENT"}  digest ${a.hash}${eq ? "" : " vs " + b.hash}  ${eq ? "SAME" : "DIFFERENT"}`);
  if (!eq) {
    console.log(`   camera after ${JSON.stringify(a.camera)} before ${JSON.stringify(b.camera)}`);
    console.log(`   stats  after ${JSON.stringify(a.stats)} before ${JSON.stringify(b.stats)}`);
    const onlyA = a.rows.filter((r) => !b.rows.includes(r));
    const onlyB = b.rows.filter((r) => !a.rows.includes(r));
    console.log(`   quads only in after: ${onlyA.length}, only in before: ${onlyB.length}`);
    for (const r of onlyA.slice(0, 3)) console.log("   + " + r.slice(0, 140));
    for (const r of onlyB.slice(0, 3)) console.log("   - " + r.slice(0, 140));
  }
}
await browser.close();
console.log(`\n${same} same, ${differ} different`);

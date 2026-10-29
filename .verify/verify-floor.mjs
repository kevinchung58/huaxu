/* verify-floor -- the paving on every page is a size a person would recognise.

   `js/site.js` paints paving into a 128 px canvas and lays it down through each floor quad's uv, so
   a paver's size is `world span / uv span` and nothing in the painter says it. The painter is drawn
   for a stated feature -- `paintPavers` draws four 48 cm stones across a 192 cm tile -- and
   `FLOOR_PERIOD` is the one place that scales the tile to the floor it lies on. Get it wrong and the
   mipmap eats the paving at a grazing angle: the round-64 defect, where Clifton's plaza was drawn at
   64 cm, a 15 cm stone under a pixel, and the ground sampled (143,161,178) with no structure in it.

   That defect has a shape this gate can assert:
     - every page's floor is *textured* at all (an untextured floor is one flat colour by design
       nowhere in this repo);
     - one tile is square (a floor correct on one axis only lays its stones as stripes);
     - one tile is `64 x period` centimetres, with `period` read out of `FLOOR_PERIOD` in
       `js/site.js` -- DPM 2, so a 128 px canvas is 64 cm at period 1 and the pavers' 192 cm tile is
       period 3. A style with no entry is period 1, which is what "no entry" means in the painter.
   Read off the page, not restated: a new floor style, a changed period or a page whose uv was
   written by hand all show up here as a number.

   Measured 2026-10-30 (stop 0, 1024 x 768): street 64.0, rooms 64.0, fukuoka 64.0, toronto 64.0,
   journey 64.0, cntower 64.0, niagara 192.0 (three layers), goat 192.0 (three layers) -- 8/8.

   WHAT IT DOES NOT PROVE, measured by breaking it on purpose: `FLOOR_PERIOD` was changed from
   `{pavers: 3}` to `{pavers: 2}` and this gate stayed green 3/3, because the constant it compares
   against is the same constant the page read -- the tile went 192 cm to 128 cm and both sides moved
   together. So it holds the *wiring* (uv honours the table, tile square, floor textured) and cannot
   hold the *choice*: that a paver is 48 cm lives only in `paintPavers`'s four stones across 128 px,
   a number no table states. A wrong period is an art decision this gate cannot see
   (`skills/frame-evidence` section 6d).

   Run:  sh bin/gate node .verify/verify-floor.mjs   (PAGES=a.html,b.html to narrow)
*/
import fs from "node:fs";
import { launch, openPage, arrive, park } from "./_aim.mjs";

const PAGES = (process.env.PAGES || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html").split(",");
const STOP = Number(process.env.STOP || 0);
const DPM = 2;      // js/site.js: the tile canvas's pixels per centimetre
const TILE = 128;   // the tile canvas's side, in uv units
/* The periods are read out of the painter rather than kept here: a gate with its own copy of the
   table would pass while the code it is checking moved. */
const PERIOD = Object.fromEntries([...(fs.readFileSync("js/site.js", "utf8")
  .match(/const FLOOR_PERIOD = \{([^}]*)\}/) || [, ""])[1]
  .matchAll(/(\w+)\s*:\s*(\d+(?:\.\d+)?)/g)].map((m) => [m[1], Number(m[2])]));

let pass = 0;
const fails = [];

const browser = await launch({ width: 1024, height: 768 });
for (const file of PAGES) {
  const page = await openPage(browser, { rooms: file, hour: "day", reduce: true, width: 1024, height: 768 });
  const floorStyle = await page.evaluate(() => document.querySelector("[data-walk]")?.dataset.floor || "(none)");
  const style = floorStyle === "(none)" ? "" : floorStyle;
  await arrive(page, STOP);
  await park(page, 600);
  const rows = await page.evaluate(() => {
    const w = document.querySelector("[data-walk]").__walk;
    /* Only the floor layers: `js/site.js` keys a floor's texture `floor-<style>`, and the same
       horizontal plane at y 0 also carries plates and core walls (`galv`, `core` on the tower),
       whose uv is a metal sheet's and not a paving's. */
    const flat = (w.drawQuads || []).filter((q) => q.world && q.world.length >= 3
      && q.mode === "pat" && String(q.textureKey || "").startsWith("floor-")
      && q.world.every((p) => Math.abs(p[1]) < 0.01));
    /* The mapping, read off the page: uv is the tile canvas's own pixels, and the canvas is DPM 2,
       so a 128 px tile is 64 cm at period 1. U runs along world Z and V along world X (street,
       measured: a 16 cm strip carries 32 u; a 652 cm width carries 1304 v). Pairing the axes the
       other way round turns a corridor's long side into its short one and reports a paving metre
       for a paving centimetre -- the first version of this file did exactly that. */
    return flat.map((q) => {
      const xs = q.world.map((p) => p[0]), zs = q.world.map((p) => p[2]);
      const us = q.uv.map((p) => p[0]), vs = q.uv.map((p) => p[1]);
      return {
        key: q.textureKey || q.mode,
        wx: Math.max(...xs) - Math.min(...xs), wz: Math.max(...zs) - Math.min(...zs),
        du: Math.max(...us) - Math.min(...us), dv: Math.max(...vs) - Math.min(...vs),
      };
    });
  });
  await page.close();

  /* One tile's size per (key, axis): the median of the quads that have a non-zero uv span, so one
     degenerate quad cannot set the number. Both axes are reported because a floor that is only
     correct along one of them lays stones as stripes. */
  const byKey = new Map();
  for (const r of rows) {
    const e = byKey.get(r.key) || { n: 0, x: [], z: [] };
    e.n++;
    // One tile is 128 uv units; cm per tile on each axis is 128 x world / uv.
    if (r.dv > 0) e.x.push(TILE * r.wx / r.dv);
    if (r.du > 0) e.z.push(TILE * r.wz / r.du);
    byKey.set(r.key, e);
  }
  const med = (a) => { if (!a.length) return null; const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
  console.log(`\n${file}  floor style "${floorStyle}", ${rows.length} textured flat quads at stop ${STOP}`);
  if (!rows.length) fails.push(`${file}: no textured floor quad at stop ${STOP} — the paving is missing or untextured`);
  for (const [key, e] of [...byKey].sort((a, b) => b[1].n - a[1].n)) {
    const cx = med(e.x), cz = med(e.z);
    const both = cx !== null && cz !== null;
    const note = !both ? "" : Math.abs(cx - cz) > 1
      ? `ANISOTROPIC — ${(cx / cz).toFixed(2)}:1`
      : `~${(cx / 64).toFixed(2)} x 64 cm (period ${(cx / 64).toFixed(2)})`;
    console.log(`  ${String(key).padEnd(16)} ${String(e.n).padStart(3)} quads  tile ${cx === null ? "  n/a " : cx.toFixed(1).padStart(6)} x ${cz === null ? "  n/a " : cz.toFixed(1).padStart(6)} cm  ${note}`);
    if (cx === null || cz === null) { fails.push(`${file} ${key}: no measurable uv span`); continue; }
    if (Math.abs(cx - cz) > 1) { fails.push(`${file} ${key}: ${cx.toFixed(1)} x ${cz.toFixed(1)} cm — a floor is not a stripe`); continue; }
    const want = 64 * (PERIOD[style] || 1);
    if (Math.abs(cx - want) > 1) {
      fails.push(`${file} ${key}: ${cx.toFixed(1)} cm per tile, but floor style "${style}" is period ` +
                 `${PERIOD[style] || 1} of 64 cm = ${want} cm`);
    } else pass++;
  }
}
await browser.close();
if (fails.length) {
  console.log(`\n${fails.length} failure(s):`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  console.log("FAIL  verify-floor");
  process.exit(1);
}
console.log(`\nverify-floor: ${pass}/${pass} pass -- every page's paving is 64 x its floor's period in centimetres`);

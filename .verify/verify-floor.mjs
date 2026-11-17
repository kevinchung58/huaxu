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

   THE STONE. This gate used to hold only the wiring: `FLOOR_PERIOD` changed from `{pavers: 3}` to
   `{pavers: 2}` stayed green, because the constant it compared against was the constant the page
   had read, and "a paver is 48 cm" lived only in `paintPavers`'s four stones across 128 px. The
   stone is data now (`FLOOR_STONE = { pavers: { cm: 48, across: 4 } }`, the period derived from
   it), and this gate counts the stones in the painted tile and divides the measured tile by them:
   4 across a 192 cm tile is 48 cm. Broken on purpose two ways, each red: `across: 3` in the data
   while the painter still draws 4 ("painted 4 stones across, FLOOR_STONE says 3"), and a period
   written by hand as 2 ("a stone is 32.0 cm, FLOOR_STONE says 48 cm").

   Run:  sh bin/gate node .verify/verify-floor.mjs   (PAGES=a.html,b.html to narrow)
*/
import fs from "node:fs";
import { siteText } from "../bin/site-sources.mjs";
import { launch, openPage, arrive, park } from "./_aim.mjs";

const PAGES = (process.env.PAGES || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html").split(",");
const STOP = Number(process.env.STOP || 0);
const DPM = 2;      // js/site.js: the tile canvas's pixels per centimetre
const TILE = 128;   // the tile canvas's side, in uv units
/* The periods are read out of the painter rather than kept here: a gate with its own copy of the
   table would pass while the code it is checking moved. */
/* `FLOOR_STONE` is the datum: one stone's size in cm and how many the near tile is painted with.
   The period is derived from it in the painter (cm x across / 64) and re-derived here, so the two
   cannot be edited apart. */
const STONE = Object.fromEntries([...(siteText()
  .match(/const FLOOR_STONE = \{(.*)\};/) || [, ""])[1]
  .matchAll(/(\w+)\s*:\s*\{\s*cm:\s*(\d+(?:\.\d+)?),\s*across:\s*(\d+)\s*\}/g)]
  .map((m) => [m[1], { cm: Number(m[2]), across: Number(m[3]) }]));
if (!Object.keys(STONE).length) { console.log("FAIL  verify-floor: FLOOR_STONE was not found in the painter"); process.exit(1); }
const PERIOD = Object.fromEntries(Object.entries(STONE).map(([k, v]) => [k, (v.cm * v.across) / 64]));

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
      /* The stones the painter actually drew, counted off the tile itself: runs of stone along
         one row of the canvas, a quarter of a row-height down so the row is inside the first
         course whatever the count. This is the only place a paver's size exists as pixels. */
      let stones = null;
      try {
        const cv = q.textureSource;
        const row = cv.getContext("2d").getImageData(0, 12, cv.width, 1).data;
        /* Stone or joint is decided against the row's own range: the tile on the page has been
           through the hour's lift and the distance fade (measured: bed 101, stones 160-168 at
           noon, where the painter wrote 43 and 95), so no absolute level survives. */
        const ls = [];
        for (let i = 0; i < cv.width; i++) ls.push((row[i * 4] * 299 + row[i * 4 + 1] * 587 + row[i * 4 + 2] * 114) / 1000);
        const lo = Math.min(...ls), hi = Math.max(...ls), mid = (lo + hi) / 2;
        let runs = 0, inStone = false;
        for (const l of ls) { if (l > mid && !inStone) { runs++; inStone = true; } else if (l <= mid) inStone = false; }
        stones = hi - lo > 8 ? runs : null;
      } catch (e) { stones = null; }
      return {
        stones,
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
    const e = byKey.get(r.key) || { n: 0, x: [], z: [], stones: r.stones };
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
  /* The stone itself. The finest layer of a floor that states its stone must be painted with
     `across` stones and each must come out at `cm`: tile / stones counted. With this, a period
     edited on its own (3 -> 2 was the measured hole) is a 32 cm stone and a failure. */
  if (STONE[style]) {
    const layers = [...byKey].filter(([, e]) => e.stones && med(e.x) !== null);
    const finest = layers.sort((a, b) => b[1].stones - a[1].stones)[0];
    if (!finest) fails.push(`${file}: floor style "${style}" states a ${STONE[style].cm} cm stone but no painted tile could be read`);
    else {
      const [key, e] = finest, cm = med(e.x) / e.stones;
      console.log(`  stone: ${key} is painted ${e.stones} across a ${med(e.x).toFixed(1)} cm tile = ${cm.toFixed(1)} cm ` +
                  `(FLOOR_STONE says ${STONE[style].cm} cm, ${STONE[style].across} across)`);
      if (e.stones !== STONE[style].across) fails.push(`${file} ${key}: painted ${e.stones} stones across, FLOOR_STONE says ${STONE[style].across}`);
      else if (Math.abs(cm - STONE[style].cm) > 0.5) fails.push(`${file} ${key}: a stone is ${cm.toFixed(1)} cm, FLOOR_STONE says ${STONE[style].cm} cm`);
      else pass++;
    }
  }
}
await browser.close();
if (fails.length) {
  console.log(`\n${fails.length} failure(s):`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  console.log("FAIL  verify-floor");
  process.exit(1);
}
console.log(`\nverify-floor: ${pass}/${pass} pass -- every page's paving is 64 x its floor's period in centimetres, ` +
            `and a floor that states its stone is painted with stones of that size`);

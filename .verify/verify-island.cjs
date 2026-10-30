/* verify-island -- no authored stop may stand in front of nothing.

   The defect this exists for, found at round 69m: rooms-goat.html has no backdrop world at all --
   the record's own comment says the page "borrows" the Niagara world, and it never did. The island
   was a walk with props on it and empty air beyond. Two things had kept that hidden for many rounds:

     1. the lane's default plaster wall. `surfaces` only opened z 2150-3700 and 3900-4750, so from
        47.5 m on every stop stood inside a sealed corridor, and a wall where a landscape should be
        reads as "a wall", not as "a missing world";
     2. a click-box bug: a prop at or behind the near plane projected to 84326x99753 px, was culled
        for being out of bounds, and the thing filling the view was unpressable, so nothing reported
        the scene as empty either.

   The measure is the honest one: stand at every stop, look where the stop says to look, and count
   how many rays meet only the sky or nothing. The sky is a renderer mesh drawn first without depth
   testing or writing; geometry behind its sphere can still be visible. Ignore sky hits, light
   sprites/additive effects and geometry outside the camera's clip range. A view made mostly of sky
   at eye level is a hole. Ray hits are a geometric proxy, not a measurement of texture alpha.
   Round 69m measured stop 2 of Goat Island at 44 of 48 cells
   EMPTY (92%) while its frame's standard deviation was a healthy 50.2 -- brightness variation is not
   content, which is why this gate counts hits and not contrast.

   The bar: EMPTY <= 60% of the grid, sampled across the eye-level band (the middle 60% of the frame,
   which is where a landscape is). A page that is legitimately mostly sky -- a bridge approach, a
   parapet over a gorge -- still has its own far bank, its water or its rails in that band; the
   numbers below were taken from the pages as they stand, and the worst passing stop is recorded in
   the output so a regression is visible as a number moving.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-island.cjs
         PAGES=rooms-goat.html for one page.  COLS=10 ROWS=6 for a coarser grid.
*/
const { walkPages } = require("../bin/walk-pages.cjs");
const PAGES = process.env.PAGES === undefined ? walkPages()
  : process.env.PAGES.split(",").map((s) => s.trim()).filter(Boolean);
const COLS = Number(process.env.COLS || 10), ROWS = Number(process.env.ROWS || 6);
const MAX_EMPTY = Number(process.env.MAX_EMPTY || 60);   // percent of the sampled band
const VW = 1024, VH = 768;

(async () => {
  const { launch, openPage, arrive, aim, park, state } = await import("./_aim.mjs");
  const browser = await launch({ width: VW, height: VH });
  let fails = 0, checked = 0, expected = 0, worst = { pct: -1 };
  if (!PAGES.length) { console.log("FAIL: no pages requested"); fails++; }

  for (const rooms of PAGES) {
    /* The camera is a local in scene3d.js; it is published to the page for this page only. */
    const expose = async (req) => {
      if (!/\/js\/scene3d\.js(\?|$)/.test(req.url())) return req.continue();
      try {
        const body = (await (await fetch(req.url())).text())
          .replace("const scene = new THREE.Scene();",
                   "const scene = new THREE.Scene(); window.__threeScene = scene; window.__THREE = THREE;")
          .replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);",
                   "const camera = (window.__cam = new THREE.PerspectiveCamera(45, 1, 20, 600000));");
        req.respond({ status: 200, contentType: "application/javascript", body });
      } catch (e) { req.continue(); }
    };
    let page;
    try { page = await openPage(browser, { rooms, hour: "day", width: VW, height: VH, intercept: expose }); }
    catch (e) { console.log(`FAIL ${rooms}: ${e.message.split("\n")[0]}`); fails++; continue; }
    const ok = await page.evaluate(() => !!(window.__cam && window.__threeScene));
    if (!ok) { console.log(`FAIL ${rooms}: no camera published (does this page use scene3d?)`); fails++; await page.close(); continue; }

    const stops = await page.evaluate(() => [...document.querySelectorAll("[data-walk-stop]")].map((el, i) => {
      const read = (k) => { const v = Number.parseFloat(getComputedStyle(el).getPropertyValue(k)); return Number.isFinite(v) ? v : null; };
      return { i, z: read("--z"), x: read("--x"),
               yaw: el.dataset.viewYaw !== undefined ? Number(el.dataset.viewYaw) : null,
               pitch: el.dataset.viewPitch !== undefined ? Number(el.dataset.viewPitch) : null,
               label: el.getAttribute("aria-label") };
    }));
    if (!stops.length) { console.log(`FAIL ${rooms}: no stops`); fails++; await page.close(); continue; }
    expected += stops.length;

    console.log(`\n${rooms} — ${stops.length} stops`);
    for (const s of stops) {
      const a = await arrive(page, s.i);
      if (!a.arrived) { console.log(`  FAIL stop ${s.i}: ${a.why || "no arrival"}`); fails++; continue; }
      // Where the stop says to look; a stop with no authored view looks straight down the lane.
      const g = await aim(page, s.yaw === null ? 0 : s.yaw, { pitch: s.pitch === null ? 0 : s.pitch, width: VW, height: VH });
      if (!g.aimed) { console.log(`  FAIL stop ${s.i}: NOT AIMED (${Number.isFinite(g.off) ? `${g.off.toFixed(1)} deg` : "no state"})`); fails++; continue; }
      await park(page, 500);
      const st = await state(page);
      const empty = await page.evaluate(({ COLS, ROWS, VW, VH }) => {
        const T = window.__THREE, cam = window.__cam, scene = window.__threeScene, rc = new T.Raycaster();
        let miss = 0, n = 0;
        // the eye-level band: the middle 60% of the frame, where a landscape lives
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const y = VH * 0.2 + (r + 0.5) * (VH * 0.6) / ROWS;
            const x = (c + 0.5) * VW / COLS;
            rc.setFromCamera(new T.Vector2((x / VW) * 2 - 1, -(y / VH) * 2 + 1), cam);
            const hit = rc.intersectObjects(scene.children, true).find((candidate) => {
              const object = candidate.object;
              // The sky is painted first without depth testing/writing. Unlike an opaque mesh it
              // does not hide a farther surface, so ignore it rather than stopping the ray at it.
              if (object.name === "authored sky") return false;
              for (let node = object; node; node = node.parent) if (node.visible === false) return false;
              const material = Array.isArray(object.material)
                ? object.material[candidate.face?.materialIndex || 0] : object.material;
              if (material && (material.visible === false || (Number.isFinite(material.opacity) && material.opacity <= 0))) return false;
              // Glows, flares and additive light pools are overlays, not scene geometry. A halo can
              // span every ray while the actual frame behind it is still nothing but sky.
              if (object.isSprite || (material && material.blending === T.AdditiveBlending)) return false;
              // Raycaster itself has no camera near/far clipping. Projection tests the same clip
              // range as the renderer, including the longer diagonal rays at the frame edges.
              const clipZ = candidate.point.clone().project(cam).z;
              return clipZ >= -1 && clipZ <= 1;
            });
            n++;
            if (!hit) miss++;
          }
        }
        return { miss, n, pct: Math.round((miss / n) * 1000) / 10 };
      }, { COLS, ROWS, VW, VH });
      checked++;
      const pass = empty.pct <= MAX_EMPTY;
      if (!pass) fails++;
      if (empty.pct > worst.pct) worst = { pct: empty.pct, where: `${rooms} stop ${s.i} "${s.label}"` };
      console.log(`  ${pass ? "PASS" : "FAIL"}  stop ${s.i} yaw ${st.yaw.toFixed(0)} pitch ${st.pitch.toFixed(0)}  ` +
                  `empty ${String(empty.pct).padStart(5)}%  (${empty.miss}/${empty.n})  "${String(s.label).slice(0, 46)}"`);
    }
    await page.close();
  }

  await browser.close();
  console.log(checked ? `\nworst stop: ${worst.where} at ${worst.pct}%` : "\nno stops measured");
  console.log(fails ? `verify-island: ${fails} failure(s); ${checked}/${expected} stops measured`
                    : `verify-island: all ${checked} stops see something (bar: empty <= ${MAX_EMPTY}%)`);
  process.exit(fails ? 1 : 0);
})();

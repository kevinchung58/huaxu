/* bench -- one command that measures what a frame costs, so a refactor has a ruler.

   Why it exists (P5 in TODO.md). Every performance claim this repository has made was measured with
   a different probe, on a different page, in a different state: `_fps.mjs` counted rAF callbacks,
   `cost-probe.mjs` read `__walk.quads`, `verify-motion.mjs` compared pixel differences. None of them
   produced a number a later round could compare against, which is why P4 (distance culling) has been
   "measure first" for eleven rounds with no ruler to measure with.

   What this prints, per page and per state, all read from the page's own published values:

     frame    median and p90 of the gap between committed frames, ms (`__walk.frameMs`)
     render   median and p90 of the renderer's own cost, ms (`__walk.renderMs`)
     quads    the compiled quads `site.js` hands the renderer for that frame (`__walk.quads`)
     calls    draw calls the renderer submitted (`__walk.threeStats.drawCalls`)
     tris     triangles the renderer submitted this frame (`threeStats.frameTriangles`)
     batch    static world+water triangles staged at mount (`threeStats.triangles`), for context
     scale    the governor's render scale (`__walk.renderScale`)

   The three honest limits, stated where the numbers are read (same rules as `cost-probe.mjs`):
     - This machine rasterises in software (SwiftShader). The absolute frame gap is an environment
       property, NOT a device frame rate; only the difference between two runs here means anything.
     - `renderMs` is the picture's own cost and is the number a change should move; `frameMs` on a
       resting lane is the idle pulse's cadence and says nothing about the picture.
     - A run is one state. `bench.mjs` takes one sample per state, so a comparison needs the same
       page, the same stop, the same heading and the same hour.

   Baseline. `tools/bench-baseline.json` is the committed ruler. `--write` records the current run
   into it; `--check` (the default when the file exists) exits 1 when a page's draw calls, frame
   triangles or compiled quads GROW — those three are exact and identical on every run — or when its
   median render cost grows past the coarse guard below.

   Why the render cost is a coarse guard and not a threshold (measured while writing this file, same
   machine, three runs of street.html: 53.5 ms, 121.0 ms, 64.9 ms — a 2.3× spread with no code
   change). The sandbox rasterises in software and shares its CPU with whatever else is running, so a
   fine-grained render-time assertion here would be a coin flip. The counters do not move: every run
   reported 729 quads, 73 draw calls and 2,570 triangles on street.html. Gate on those; read the
   milliseconds; only a 3× jump means anything.

   Run:
     node tools/bench.mjs                       # every walkable page, one sample each (about 3 min)
     PAGES=rooms-toronto.html node tools/bench.mjs
     node tools/bench.mjs --write               # record today's numbers as the ruler
     TOLERANCE=0.25 node tools/bench.mjs        # allow a 25% render-time regression
*/
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
/* The sandbox's Chromium needs its own shared libraries; `bin/restore-env` unpacks them there.
   Set here rather than documented, because a bench that needs a shell incantation is a bench that
   gets run with the wrong one. */
if (fs.existsSync("/tmp/al2023/lib")) {
  process.env.LD_LIBRARY_PATH = `/tmp/al2023/lib:${process.env.LD_LIBRARY_PATH || ""}`;
}
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const BASELINE = process.env.BASELINE || "tools/bench-baseline.json";
const WRITE = process.argv.includes("--write");
const TOLERANCE = Number(process.env.TOLERANCE || 3);     // render-time guard: only an order-of-magnitude jump counts
const SAMPLES = Number(process.env.SAMPLES || 16);        // frames averaged per state
/* 40, not 8. `__walk.renderMs` is an exponential average (0.7 old + 0.3 new), so one shader
   compile or texture upload — 1.5 s on the first frame of a water page — keeps reading as a
   one-and-a-half-second frame for a dozen frames afterwards. Measured while probing culling:
   niagara at the Table Rock rail reads 1,611 ms through this bench's original 8-frame warm-up and
   3.4 ms once the average has settled (`.verify/cull-probe.mjs`), a 470× error invented by the
   instrument. The EMA needs ~35 frames to forget a spike; warm up past that. */
const WARMUP = Number(process.env.WARMUP || 40);          // frames dropped before sampling

const pages = process.env.PAGES ? process.env.PAGES.split(",") : fs.readdirSync(".")
  .filter((f) => (f === "street.html" || /^rooms.*\.html$/.test(f)))
  .filter((f) => fs.readFileSync(f, "utf8").includes('class="walk"'))
  .sort();
if (!pages.length) { console.error("bench: no walkable pages found"); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const p90 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]; };

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true, defaultViewport: { width: 1024, height: 768 },
});

const rows = [];
for (const file of pages) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${BASE}/${file}`, { waitUntil: "networkidle0", timeout: 120000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 60000 });
  await sleep(1200);
  /* Stand at the room's own first stop: a bench that measures wherever the page happened to open
     measures a different place on every run. */
  const stop = await page.evaluate(() => {
    const s = document.querySelector("[data-walk-stop]");
    if (s) s.click();
    return s ? s.dataset.walkStop || s.textContent.trim().slice(0, 40) : null;
  });
  await page.waitForFunction(() => !document.querySelector("[data-walk]").__walk.glide, { timeout: 120000 })
    .catch(() => {});
  await sleep(2500);

  /* Ask the page for the frames, then read what they cost.
     The lane draws when something changes; a resting lane may not draw at all, so a bench that just
     waits for animation frames reads whatever the *last* frame cost — on niagara that was the mount
     frame that compiled the shaders, 3,975 ms against a settled 3.4 ms (`.verify/cull-probe.mjs`).
     `__walk.draw()` is published for exactly this; every sample below is one real frame. */
  const sample = await page.evaluate(async (n, warm) => {
    const api = document.querySelector("[data-walk]").__walk;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < warm; i++) { api.draw(); await frame(); }
    const out = [];
    for (let i = 0; i < n; i++) {
      api.draw();
      out.push({ frameMs: api.frameMs, renderMs: api.renderMs, quads: api.quads,
                 scale: api.renderScale,
                 calls: api.threeStats && api.threeStats.drawCalls,
                 tris: api.threeStats && api.threeStats.frameTriangles });
      await frame();
    }
    return out;
  }, SAMPLES, WARMUP);

  const staged = await page.evaluate(() => {
    const s = document.querySelector("[data-walk]").__walk.threeStats || {};
    return { triangles: s.triangles, waterTriangles: s.waterTriangles, batches: s.batches,
             laneMeshes: s.laneMeshes, renderer: document.querySelector("[data-walk]").__walk.renderer };
  });

  const row = {
    page: file, stop: stop || "(first stop)",
    frameMs: median(sample.map((s) => s.frameMs)), frameMsP90: p90(sample.map((s) => s.frameMs)),
    renderMs: median(sample.map((s) => s.renderMs)), renderMsP90: p90(sample.map((s) => s.renderMs)),
    quads: median(sample.map((s) => s.quads)),
    calls: median(sample.map((s) => s.calls || 0)),
    tris: median(sample.map((s) => s.tris || 0)),
    stagedTriangles: staged.triangles || 0, waterTriangles: staged.waterTriangles || 0,
    batches: staged.batches || 0, laneMeshes: staged.laneMeshes || 0,
    renderScale: median(sample.map((s) => s.scale)),
    renderer: staged.renderer, errors: errors.length,
  };
  rows.push(row);
  const spread = `${Math.round(Math.min(...sample.map((s) => s.renderMs)))}–` +
                 `${Math.round(Math.max(...sample.map((s) => s.renderMs)))}`;
  console.log(`${row.page.padEnd(20)} frame ${row.frameMs.toFixed(0).padStart(5)} ms  ` +
              `render ${row.renderMs.toFixed(1).padStart(5)} ms (${spread})  quads ${String(row.quads).padStart(4)}  ` +
              `calls ${String(row.calls).padStart(4)}  tris ${String(row.tris).padStart(6)}  ` +
              `scale ${row.renderScale.toFixed(2)}${row.errors ? `  ERRORS ${row.errors}` : ""}`);
  await page.close();
}
await browser.close();

if (!rows.length) { console.error("bench: no page measured"); process.exit(2); }
if (rows.some((r) => r.renderer !== "three" || r.errors)) {
  console.error("bench: a page did not mount the renderer — these numbers describe nothing");
  process.exit(2);
}

if (WRITE) {
  const out = { machine: "sandbox SwiftShader (values are comparable only within this machine)",
                samples: SAMPLES, warmup: WARMUP,
                rows: rows.map(({ page, stop, frameMs, renderMs, quads, calls, tris,
                                 stagedTriangles, waterTriangles, batches, laneMeshes, renderScale }) =>
                  ({ page, stop, frameMs, renderMs, quads, calls, tris,
                     stagedTriangles, waterTriangles, batches, laneMeshes, renderScale })) };
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nbench: wrote ${BASELINE} (${rows.length} pages)`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.log(`\nbench: no baseline at ${BASELINE} — record one with --write`);
  process.exit(0);
}
const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
let bad = 0;
for (const row of rows) {
  const ref = base.rows.find((r) => r.page === row.page);
  if (!ref) { console.log(`  NEW   ${row.page}: no baseline row`); continue; }
  const dRender = (row.renderMs - ref.renderMs) / Math.max(0.1, ref.renderMs);
  const dQuads = row.quads - ref.quads;
  const dCalls = row.calls - ref.calls;
  const dTris = row.tris - ref.tris;
  /* The counters are the ruler (exact, reproducible); the milliseconds are context. Growing any of
     the three means the frame is asking the GPU for more than it used to, which is what P4 has to
     make smaller — and shrinking them is the win a culling round claims. */
  /* A little wobble is the lane's own: its dynamic props (a swaying crown, a moving car) are
     compiled into the frame and their quad count moves by a couple between runs — measured
     2,380 → 2,382 quads and 9,518 → 9,522 triangles on niagara with no change to the scene. So the
     counters are gated at 2 %, which is far below any real addition and above that noise. */
  const wobble = (now, was) => now - was > Math.max(5, was * 0.02);
  const grew = wobble(row.quads, ref.quads) || wobble(row.calls, ref.calls) || wobble(row.tris, ref.tris);
  const slow = dRender > TOLERANCE;
  const verdict = grew || slow ? "SLOW" : "ok";
  if (verdict === "SLOW") bad++;
  console.log(`  ${verdict.padEnd(4)} ${row.page.padEnd(20)} quads ${dQuads >= 0 ? "+" : ""}${dQuads}  ` +
              `calls ${dCalls >= 0 ? "+" : ""}${dCalls}  tris ${dTris >= 0 ? "+" : ""}${dTris}  ` +
              `render ${dRender >= 0 ? "+" : ""}${(dRender * 100).toFixed(0)}% (coarse guard ${(TOLERANCE * 100).toFixed(0)}%)`);
}
console.log(`bench: ${bad ? `${bad} page(s) asking more than ${BASELINE}` : `no regression against ${BASELINE}`}`);
process.exit(bad ? 1 : 0);

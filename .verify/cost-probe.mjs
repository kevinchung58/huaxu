/* What one frame submits, now that the lane has one renderer.
 *
 * This used to count 2D draw calls: the painter filled one quad per visible surface, so a 16 ms
 * window's fill count was the closest thing to a frame budget the sandbox could measure, and a
 * second depth pass showed up as a doubled number. Round 54 deleted that painter on the owner's
 * ruling, which left the instrument reading the tile raster and calling it the lane — the same
 * premise-death that retired `motion-magnitude`. It is not a gate (it always exits 0); it is the
 * instrument, and it now reads what the surviving renderer actually submits: the compiled quads
 * `site.js` publishes as `__walk.quads`, and the geometry counts `scene3d.js` publishes as
 * `__walk.threeStats` once the scene is mounted.
 *
 * Two honest limits, stated where the numbers are read:
 *   - frame times here are the sandbox's software rasteriser (swiftshader/llvmpipe), an
 *     environment property, never a device frame rate (AGENTS.md: "a harness timeout measures the
 *     harness");
 *   - the quads sampled while walking are what `site.js` hands over for the frame, i.e. the work
 *     the engine is asked to do, not what the GPU eventually culls.
 *
 *   node .verify/cost-probe.mjs                      # every walkable page on disk
 *   PAGES=rooms-niagara.html node .verify/cost-probe.mjs
 */
import fs from "node:fs";
if (fs.existsSync("/tmp/al2023/lib")) process.env.LD_LIBRARY_PATH = `/tmp/al2023/lib:${process.env.LD_LIBRARY_PATH || ""}`;
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const walkable = fs.readdirSync(".")
  .filter((f) => (f === "street.html" || /^rooms.*\.html$/.test(f)))
  .filter((f) => fs.readFileSync(f, "utf8").includes('class="walk"'))
  .sort();
const pages = process.env.PAGES ? process.env.PAGES.split(",") : walkable;

const browser = await puppeteer.launch({
  executablePath: "/tmp/chromium",
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true,
  defaultViewport: { width: 1024, height: 768 },
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const file of pages) {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (req) => (req.url().includes("127.0.0.1:8080") || req.url().startsWith("data:")
    ? req.continue().catch(() => {}) : req.abort().catch(() => {})));
  await page.goto(`http://127.0.0.1:8080/${file}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 30000 });
  // Three mounts asynchronously (module import, then attachThree); wait for the scene's own
  // published counts rather than for a timer, or the report reads an unmounted engine.
  try {
    await page.waitForFunction(() => document.querySelector("[data-walk]").__walk.threeStats,
      { timeout: 45000 });
  } catch { /* a page whose scene retired reports what it has below */ }
  await sleep(600);

  const mounted = await page.evaluate(() => {
    const w = document.querySelector("[data-walk]").__walk;
    const s = w.threeStats || null;
    return {
      renderer: w.renderer,
      quadsAtRest: w.quads,
      stats: s && {
        laneQuads: s.laneQuads, laneTriangles: s.laneTriangles, laneMeshes: s.laneMeshes,
        worldTriangles: s.triangles, waterTriangles: s.waterTriangles,
        waterSheets: s.waterSheets, mistLayers: s.mistLayers, batches: s.batches,
      },
    };
  });

  // Walk for a moment and sample what the frame is asked to draw, plus the frame interval.
  await page.evaluate(() => {
    window.__probe = { quads: [], frames: [], last: 0, on: true };
    const tick = (t) => {
      if (!window.__probe.on) return;
      const w = document.querySelector("[data-walk]").__walk;
      window.__probe.quads.push(w.quads);
      if (window.__probe.last) window.__probe.frames.push(t - window.__probe.last);
      window.__probe.last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const view = document.querySelector("[data-walk-view]");
    view.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, clientX: 512, clientY: 384 }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
  });
  await page.keyboard.down("w");
  await sleep(1600);
  await page.keyboard.up("w");
  const moving = await page.evaluate(() => {
    window.__probe.on = false;
    const q = window.__probe.quads.slice(4), f = window.__probe.frames.slice(4).sort((a, b) => a - b);
    const p = (v) => (f.length ? Math.round(f[Math.min(f.length - 1, Math.floor(v * f.length))]) : null);
    return {
      quadsMin: q.length ? Math.min(...q) : null,
      quadsMax: q.length ? Math.max(...q) : null,
      samples: q.length,
      frameMsP50: p(0.5), frameMsP95: p(0.95),
      depth: Math.round(document.querySelector("[data-walk]").__walk.depth),
    };
  });

  console.log(JSON.stringify({ page: file, ...mounted, walking: moving }));
  await page.close();
}

await browser.close();
console.log("\nframe times above are this sandbox's software rasteriser, not a device measurement");

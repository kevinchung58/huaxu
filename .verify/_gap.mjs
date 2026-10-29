/* _gap — where the world is missing, in the served frame, in place coordinates.

   Round 69e found a pale rectangle beside the falls at the Table Rock rail and `_ray.mjs` proved it
   was not a colour: five rays through it hit nothing at all. `_ray.mjs` answers "what is at this
   pixel"; it cannot answer "how big is the hole and which edge of which polygon ends there", and
   guessing the answer from the generator's coordinates is what produced the wrong rounds.

   What this prints, per heading (AIM_YAW, default = the rail stop's own):
     1. a coverage map of the falls half of the frame: `#` = geometry, `.` = nothing, on an
        8x6 grid of 128 px cells;
     2. for every miss, where the ray crosses the crest height and the river height, in the
        place's own metres (east, north) -- so the printed hull of the hole can be compared with
        the authored polygons directly;
     3. how many distinct meshes were hit at all, so "nothing" cannot be confused with "a mesh
        that failed to load".

   Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_gap.mjs
        AIM_YAW=-109 STOP=3 STEP=12 node .verify/_gap.mjs   (denser grid)
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const STOP = Number(process.env.STOP || 3);
const AIM = Number(process.env.AIM_YAW || 0);          // 0 = leave the stop's own heading
const STEP = Number(process.env.STEP || 16);           // px between samples
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => { console.log("PAGEERROR", String(e).slice(0, 160)); process.exitCode = 2; });
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (!/js\/scene3d\.js/.test(req.url())) return req.continue();
  try {
    const body = (await (await fetch(req.url())).text())
      .replace("const scene = new THREE.Scene();",
               "const scene = new THREE.Scene(); window.__threeScene = scene; window.__THREE = THREE;")
      .replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);",
               "const camera = (window.__cam = new THREE.PerspectiveCamera(45, 1, 20, 600000));");
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { console.log("FETCH FAIL", String(e).slice(0, 100)); req.continue(); }
});

await page.goto(`${BASE}/${FILE}`, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 90000 });
await sleep(2500);
await page.evaluate((i) => document.querySelectorAll("[data-walk-stop]")[i].click(), STOP);
await page.waitForFunction(() => {
  const w = document.querySelector("[data-walk]").__walk;
  if (!w.__gapT) w.__gapT = [];
  w.__gapT.push([w.depth, performance.now()]);
  if (w.__gapT.length > 12) w.__gapT.shift();
  const a = w.__gapT[0], b = w.__gapT[w.__gapT.length - 1];
  return Math.abs(b[0] - a[0]) < 40 && b[1] - a[1] > 900;
}, { timeout: 240000, polling: 500 }).catch(() => console.log("  (did not settle)"));
if (AIM) {
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => document.querySelector("[data-walk]").__walk.yaw);
    const d = AIM - y;
    if (Math.abs(d) < 2) break;
    const key = d > 0 ? "ArrowRight" : "ArrowLeft";
    await page.keyboard.down(key); await sleep(Math.min(400, Math.max(80, Math.abs(d) * 1.6)));
    await page.keyboard.up(key); await sleep(400);
  }
}
await sleep(800);

const out = await page.evaluate((step) => {
  const scene = window.__threeScene, cam = window.__cam, THREE = window.__THREE;
  const ray = new THREE.Raycaster();
  // The two heights that matter here: the crest the water leaves from, and the river at the foot.
  // Both are authored constants; they are read off the record so this file carries no numbers of
  // its own about a place.
  const world = Object.values(window.__HX_PLACES || {})[0]["data-walk-backdrop"].world.prims;
  const flat = world.filter((q) => q.q).map((q) => q.h).sort((a, b) => a - b);
  const NY = cam.position.constructor;
  const toPlace = (p) => {
    // Scene cm -> the place's own metres. niagara's lane frame is (0, 14, 0, 180), whose basis is
    // x = -east, z = -(north - 14): read from the served page rather than assumed.
    const f = window.__HX_FRAME || null;
    if (f) return [f.e0 - p.x / 100, f.n0 - p.z / 100];
    return [-p.x / 100, 14 - p.z / 100];
  };
  const cellW = 128, cellH = 128, cols = 8, rows = 6;
  const hit = Array.from({ length: rows }, () => Array(cols).fill(0));
  const total = Array.from({ length: rows }, () => Array(cols).fill(0));
  const sky = Array.from({ length: rows }, () => Array(cols).fill(0));
  const hole = Array.from({ length: rows }, () => Array(cols).fill(0));
  const misses = [];
  const names = new Set();
  for (let py = 0; py < 768; py += step) {
    for (let px = 0; px < 1024; px += step) {
      const ndc = new THREE.Vector2((px / 1024) * 2 - 1, -(py / 768) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      const h = ray.intersectObjects(scene.children, true);
      const cx = Math.min(cols - 1, Math.floor(px / cellW)), cy = Math.min(rows - 1, Math.floor(py / cellH));
      total[cy][cx]++;
      if (h.length) { hit[cy][cx]++; names.add(h[0].object.name || "?"); continue; }
      // A miss is only a *hole* if the ray is heading down into the world; a ray that leaves the
      // eye above the horizon is looking at sky and is supposed to hit nothing. Both are counted,
      // separately, because conflating them is how a hole gets mistaken for the sky it is next to.
      const o = cam.position, d = ray.ray.direction;
      if (!(d.y < -0.002)) { sky[cy][cx]++; continue; }
      hole[cy][cx]++;
      const cross = (y) => {
        const k = (y - o.y) / d.y;
        if (!(k > 0)) return null;
        const p = new NY(o.x + d.x * k, y, o.z + d.z * k);
        return toPlace(p).map((v) => Math.round(v));
      };
      misses.push({ px, py, river: cross(-5800), crest: cross(-100) });
    }
  }
  const map = hit.map((row, y) => row.map((n, x) => {
    const t = total[y][x] || 1, f = n / t;
    if (f > 0.98) return "#";
    if (hole[y][x] / t > 0.5) return "H";           // the ray went down and met nothing: a hole
    if (f > 0.6) return "+";
    if (f > 0.25) return "-";
    return ".";
  }).join(""));
  return { names: [...names].sort(), misses, map, camPos: [cam.position.x, cam.position.y, cam.position.z],
           yaw: document.querySelector("[data-walk]").__walk.yaw };
}, STEP);

console.log(`yaw ${out.yaw.toFixed(1)}  cam ${JSON.stringify(out.camPos)}  meshes hit: ${out.names.length}`);
console.log("coverage ('#' solid, '.' nothing), each cell 128 px, full frame:");
for (const [y, row] of out.map.entries()) console.log(`  y${String(y * 128).padStart(3)}-${y * 128 + 127}  ${row}`);
console.log(`downward misses (holes): ${out.misses.length}`);
const box = (key) => {
  const v = out.misses.map((m) => m[key]).filter(Boolean);
  if (!v.length) return null;
  const e = v.map((p) => p[0]), n = v.map((p) => p[1]);
  return { e: [Math.min(...e), Math.max(...e)], n: [Math.min(...n), Math.max(...n)] };
};
console.log("  hole's extent at the crest plane (place m):", JSON.stringify(box("crest")));
console.log("  hole's extent at the river plane (place m):", JSON.stringify(box("river")));
const px = out.misses.map((m) => m.px), py = out.misses.map((m) => m.py);
console.log("  in the frame: x", Math.min(...px), "-", Math.max(...px), " y", Math.min(...py), "-", Math.max(...py));
const buckets = {};
for (const m of out.misses) {
  if (!m.crest) continue;
  const k = `${Math.round(m.crest[0] / 100) * 100},${Math.round(m.crest[1] / 100) * 100}`;
  buckets[k] = (buckets[k] || 0) + 1;
}
console.log("  crest-plane crossings, 100 m buckets (e,n -> rays):");
console.log("   ", Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k}:${v}`).join("  "));
await browser.close();

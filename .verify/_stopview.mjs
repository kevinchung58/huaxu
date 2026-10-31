/* _stopview -- what each stop actually puts in the middle of the frame.

   A stop is a promise: the rail says "Terrapin Point" and the visitor arrives looking at
   *something*. Goat Island's stop 3 arrived looking at a 5 m stone wall (measured in round 76 and
   again below), and the question this file answers is whether that is one stop or a class: for every
   stop on every walkable page it rays the centre of the frame through the live scene and reports the
   nearest surface, its distance in metres, and whether a `[data-obj]` marker is in the frame at all.

   Diagnostic, exit 0. Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_stopview.mjs
                             PAGES=rooms-goat.html,rooms-journey.html
   `NEAR=12` is the threshold that calls a centre hit "something close" (a wall, a post, a sign) —
   not a defect by itself, but a stop whose centre hits something within 12 m and whose frame holds
   no authored marker is a stop looking at nothing in particular.
*/
import { launch, openPage, arrive, state } from "./_aim.mjs";

const PAGES = (process.env.PAGES || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html").split(",");
const NEAR = Number(process.env.NEAR || 12);
/* GRID=1 turns the single centre ray into a 16x12 grid (192 rays) and reports what share of the
   frame each class of surface fills. The centre ray finds *candidates*; only a share can say whether
   a wall is the subject of the frame or a corner of it. */
const GRID = process.env.GRID === "1";
const ONLY = process.env.STOPS ? process.env.STOPS.split(",").map(Number) : null;

/* Expose the scene and the camera, exactly as `_ray.mjs` does: the frame says where, the raycaster
   says what. */
const hook = (req) => {
  if (!/\/js\/scene3d\.js(\?|$)/.test(req.url())) return req.continue();
  fetch(req.url()).then((r) => r.text()).then((body) => {
    req.respond({ status: 200, contentType: "application/javascript", body: body
      .replace("const scene = new THREE.Scene();",
               "const scene = new THREE.Scene(); window.__threeScene = scene; window.__THREE = THREE;")
      .replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);",
               "const camera = (window.__cam = new THREE.PerspectiveCamera(45, 1, 20, 600000));") });
  }).catch(() => req.continue());
};

const browser = await launch({ width: 1024, height: 768 });
let closeHits = 0, total = 0, markerless = 0;
for (const file of PAGES) {
  const page = await openPage(browser, { rooms: file, hour: "day", reduce: true, intercept: hook });
  const stops = await page.evaluate(() => document.querySelectorAll("[data-walk-stop]").length);
  console.log(`\n${file} (${stops} stops)`);
  for (let i = 0; i < stops; i++) {
    if (ONLY && !ONLY.includes(i)) continue;
    const a = await arrive(page, i);
    if (!a.target) { console.log(`  stop ${i}: no such stop`); continue; }
    if (!a.arrived && !a.blocked) { console.log(`  stop ${i}: ${a.why}`); continue; }
    await new Promise((r) => setTimeout(r, 600));
    await page.evaluate((g) => { window.__GRIDMODE = g; }, GRID);
    const v = await page.evaluate(() => {
      const THREE = window.__THREE, scene = window.__threeScene, cam = window.__cam;
      if (!THREE || !scene || !cam) return { noScene: true };
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(0, 0), cam);
      /* A hit is not a wall. The first version counted the *first* intersection and therefore
         reported lamp halos (transparent effect billboards, 0-3 m from the eye) and the floor
         under the visitor's feet as "something close". What makes Goat Island's stop 3 wrong is a
         specific thing: an OPAQUE, VERTICAL surface filling the middle of the frame within 12 m.
         So each hit is classified -- transparent overlays are skipped, and a face whose normal is
         more than 60 degrees from horizontal is a wall, less is a floor or a roof. */
      if (window.__GRIDMODE) {
        /* Every ray classified, no first-hit guessing: near wall / near other / far / sky. */
        const counts = { wall: 0, near: 0, far: 0, sky: 0, none: 0 };
        for (let gy = 0; gy < 12; gy++) for (let gx = 0; gx < 16; gx++) {
          const ndc = new THREE.Vector2(((gx + 0.5) / 16) * 2 - 1, -((gy + 0.5) / 12) * 2 + 1);
          ray.setFromCamera(ndc, cam);
          const hs = ray.intersectObjects(scene.children, true);
          let first = null, wall = null;
          for (const h of hs) {
            if (h.object.material && h.object.material.transparent) continue;
            if (!first) first = h;
            if (h.face) {
              const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
              if (Math.abs(n.y) < 0.5) { wall = h; break; }
            }
          }
          if (!first) { counts.none += 1; continue; }
          const m = first.distance / 100;
          if (wall && wall.distance / 100 <= 12) counts.wall += 1;
          else if (m <= 12) counts.near += 1;
          else if (first.object.name === "authored sky") counts.sky += 1;
          else counts.far += 1;
        }
        const n = 192;
        return { grid: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.round(100 * v / n)])),
                 marks: 0, yaw: Math.round(document.querySelector("[data-walk]").__walk.yaw),
                 pitch: Math.round(document.querySelector("[data-walk]").__walk.pitch) };
      }
      const hits = ray.intersectObjects(scene.children, true);
      let hit = null, wall = null;
      for (const h of hits) {
        const opaque = !(h.object.material && h.object.material.transparent);
        if (!opaque) continue;
        if (!hit) hit = h;
        if (h.face) {
          const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
          if (Math.abs(n.y) < 0.5) { wall = h; break; }
        }
      }
      const marks = [];
      for (const el of document.querySelectorAll("[data-obj]")) {
        const r = el.getBoundingClientRect();
        if (r.width < 6 || r.height < 6) continue;
        if (r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight) marks.push(el.dataset.obj);
      }
      const s = document.querySelector("[data-walk]").__walk;
      return { mesh: hit ? hit.object.name || "(unnamed)" : null,
               dist: hit ? Math.round(hit.distance / 100) : null,
               wall: wall ? (wall.object.name || "(unnamed)") : null,
               wallDist: wall ? Math.round(wall.distance / 100) : null,
               yaw: Math.round(s.yaw), pitch: Math.round(s.pitch),
               marks: marks.length, first: marks.slice(0, 4) };
    });
    if (v.noScene) { console.log(`  stop ${i}: scene hook missing`); break; }
    if (v.grid) {
      total += 1;
      if (v.grid.wall >= 40) closeHits += 1;
      const g = v.grid;
      console.log(`  stop ${String(i).padStart(2)} yaw ${String(v.yaw).padStart(4)} pitch ${String(v.pitch).padStart(3)}  ` +
                  `near wall ${String(g.wall).padStart(3)}%  near other ${String(g.near).padStart(3)}%  ` +
                  `far ${String(g.far).padStart(3)}%  sky ${String(g.sky).padStart(3)}%  none ${String(g.none).padStart(3)}%` +
                  `${g.wall >= 40 ? "  <= WALL FILLS THE FRAME" : ""}`);
      continue;
    }
    total += 1;
    const near = v.wallDist !== null && v.wallDist <= NEAR;
    if (near) closeHits += 1;
    if (!v.marks) markerless += 1;
    console.log(`  stop ${String(i).padStart(2)} yaw ${String(v.yaw).padStart(4)} pitch ${String(v.pitch).padStart(3)}  ` +
                `first opaque ${String(v.mesh).padEnd(28)} ${String(v.dist).padStart(5)} m` +
                `  wall ${String(v.wall || "-").padEnd(28)} ${String(v.wallDist).padStart(5)} m` +
                `${near ? "  <= NEAR" : ""}  markers ${String(v.marks).padStart(2)}` +
                `${v.marks ? "" : "  NONE"}`);
  }
  await page.close();
}
console.log(`\n${total} stops measured: ${closeHits} put an OPAQUE VERTICAL surface within ${NEAR} m ` +
            `in the middle of the frame, ${markerless} have no authored marker in the frame at all`);
await browser.close();

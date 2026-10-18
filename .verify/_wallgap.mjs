/* _wallgap.mjs — instrument (not a gate): painted tall walls the walker can stand inside.

   The collision set is built from [data-solid] DOM props; the lane clamps the room's outer walls.
   A world quad that reads as a standing wall (height ≥ 130 cm, ground run ≥ 60 cm) inside the
   walkable box, with free standing positions against it, is a surface the visitor walks through.

   Run: node .verify/_wallgap.mjs   */
import fs from "node:fs";
import { JSDOM } from "jsdom";

const PAGES = ["street.html", "rooms.html", "rooms-fukuoka.html", "rooms-toronto.html",
               "rooms-cntower.html", "rooms-niagara.html", "rooms-journey.html"];
const R = 24;

for (const f of PAGES) {
  const doc = new JSDOM(fs.readFileSync(f, "utf8")).window.document;
  const layer = doc.querySelector("[data-walk]");
  if (!layer) { console.log(`${f}: no walk layer`); continue; }
  const attr = (k, d) => Number(layer.dataset[k] ?? d);
  const WALL = attr("laneW", 640) / 2, MIN_D = attr("laneStart", 0), MAX_D = attr("laneLen", 6000);
  const solids = [...doc.querySelectorAll("[data-obj][data-solid=\"true\"]")].map((el) => ({
    x: parseFloat(el.style.getPropertyValue("--x")) || 0, z: parseFloat(el.style.getPropertyValue("--z")) || 0,
    w: parseFloat(el.dataset.w) || 30, d: parseFloat(el.dataset.d) || 12, ry: parseFloat(el.dataset.ry || 0),
  }));
  const collides = (px, pz) => solids.some((b) => {
    const a = (b.ry * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const dx = px - b.x, dz = pz - b.z;
    const lx = dx * c + dz * s, ld = -dx * s + dz * c;
    const ox = Math.max(Math.abs(lx) - b.w / 2, 0), od = Math.max(Math.abs(ld) - b.d / 2, 0);
    return ox * ox + od * od < R * R;
  });
  const bdRaw = layer.querySelector("[data-walk-backdrop]");
  let prims = [];
  try { prims = (JSON.parse(bdRaw.textContent).world || {}).prims || []; } catch (e) {}
  // a wall quad: 3- or 4-point polygon with big y span and a small horizontal footprint run
  const walls = [];
  for (const p of prims) {
    if (p.t !== "f" && p.t !== "x") continue;
    const pts = p.p || [];
    if (pts.length < 3 || pts.some((c) => !Array.isArray(c) || c.length < 3)) continue;
    const ys = pts.map((c) => c[1]);
    const h = Math.max(...ys) - Math.min(...ys);
    const xz = pts.map((c) => [c[0], c[2]]);
    let run = 0;
    for (let i = 0; i < xz.length; i++) {
      const a = xz[i], b2 = xz[(i + 1) % xz.length];
      run = Math.max(run, Math.hypot(b2[0] - a[0], b2[1] - a[1]));
    }
    if (h < 130 || run < 60) continue;
    if (Math.max(...xz.map((c) => c[0])) < -WALL - 4 || Math.min(...xz.map((c) => c[0])) > WALL + 4) continue;
    if (Math.max(...xz.map((c) => c[1])) < MIN_D - 4 || Math.min(...xz.map((c) => c[1])) > MAX_D + 4) continue;
    walls.push({ pts: xz, y0: Math.min(...ys) });
  }
  const segDist = (x, z, a, b2) => {
    const abx = b2[0] - a[0], abz = b2[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * abx + (z - a[1]) * abz) / (abx * abx + abz * abz || 1)));
    return Math.hypot(x - a[0] - abx * t, z - a[1] - abz * t);
  };
  let gaps = 0, sample = null;
  const STEP = 8;
  for (let x = -WALL; x <= WALL; x += STEP) for (let z = MIN_D; z <= Math.min(MAX_D, 30000); z += STEP) {
    if (collides(x, z)) continue;                                  // already blocked: fine
    for (const wl of walls) {
      let dmin = 1e9;
      for (let i = 0; i < wl.pts.length; i++) dmin = Math.min(dmin, segDist(x, z, wl.pts[i], wl.pts[(i + 1) % wl.pts.length]));
      if (dmin < R * 0.6) {                                        // standing inside the surface
        gaps++; if (!sample) sample = { x, z, walls: walls.length };
        break;
      }
    }
  }
  console.log(`${f}: ${walls.length} tall wall quads in the box, ${gaps} free standing points inside them` + (sample ? `  first @(${sample.x},${sample.z})` : ""));
}

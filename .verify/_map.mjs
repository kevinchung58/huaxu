/* _map -- what is actually painted where, by prim, at a known stop and heading.

   The reason this exists: "the trees are too close to the shops" is a claim about which prim owns
   which pixels, and no amount of reading the record answers it. This raycasts a grid over the
   frame from the live camera and prints, for every cell, the name of the prim that owns it; then a
   legend with each prim's distance range and the materials it was painted with.

   Every distance is world units, which in this repo are CENTIMETRES. Both numbers are printed,
   because 19416 cm was once written down as 19.4 km and a whole round of TODO believed it.

   The camera is placed by `_aim.mjs`, so the frame's heading is read back and a miss is refused;
   the stop is the site's own `--z`, and a body that settles short of it says so.

   Run:
     LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-niagara.html STOP=6 YAW=90 \
       node .verify/_map.mjs
     ...COLS=24 ROWS=14 PITCH=2  for a finer grid or a pitched head.
*/
import { launch, openPage, arrive, aim, park, state } from "./_aim.mjs";

const ROOMS = process.env.ROOMS || "rooms.html";
const STOP = Number(process.env.STOP || 0);
const YAW = Number(process.env.YAW || 0);
const PITCH = process.env.PITCH === undefined ? null : Number(process.env.PITCH);
const COLS = Number(process.env.COLS || 16), ROWS = Number(process.env.ROWS || 12);
const HOUR = process.env.HOUR || "day";
const PROBE = (process.env.PROBE || "").split(";").filter(Boolean)
  .map((v) => v.split(",").map(Number)).filter((v) => v.length === 2 && v.every(Number.isFinite));
const VW = Number(process.env.VIEW_W || 1024), VH = Number(process.env.VIEW_H || 768);

const browser = await launch({ width: VW, height: VH });

/* The camera is a local in scene3d.js, so the map needs it on the page. One source file is rewritten
   in flight to publish the camera and the scene; nothing else about the page changes. */
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
const page = await openPage(browser, { rooms: ROOMS, hour: HOUR, width: VW, height: VH, intercept: expose });
const exposed = await page.evaluate(() => !!window.__cam && !!window.__threeScene);
if (!exposed) { console.log("NO CAMERA: scene3d.js did not give up its camera (did the source lines move?)"); process.exit(2); }

const a = await arrive(page, STOP);
if (!a.target) { console.log(`SKIP stop ${STOP}: no such stop`); if (out.probes.length) {
  console.log("\nprobe (first three hits at each point):");
  for (const hits of out.probes) for (const h of hits) {
    console.log(`  ${h.at.join(",").padEnd(10)} ${String(h.name).padEnd(34)} ${h.colour} op=${h.opacity} ` +
                `${String(h.d).padStart(7)} cm (${(h.d / 100).toFixed(1)} m) ${String(h.verts).padStart(5)} verts ` +
                `bbox ${h.bb ? JSON.stringify(h.bb) : "n/a"}`);
  }
}
await browser.close(); process.exit(2); }
console.log(`stop ${STOP} "${a.target.label}" target z=${a.target.z} x=${a.target.x} → body z=${Math.round(a.at.z)} x=${Math.round(a.at.x)}`);
if (!a.arrived && !a.blocked) { console.log(`NOT THERE: ${a.why}`); if (out.probes.length) {
  console.log("\nprobe (first three hits at each point):");
  for (const hits of out.probes) for (const h of hits) {
    console.log(`  ${h.at.join(",").padEnd(10)} ${String(h.name).padEnd(34)} ${h.colour} op=${h.opacity} ` +
                `${String(h.d).padStart(7)} cm (${(h.d / 100).toFixed(1)} m) ${String(h.verts).padStart(5)} verts ` +
                `bbox ${h.bb ? JSON.stringify(h.bb) : "n/a"}`);
  }
}
await browser.close(); process.exit(2); }
if (a.blocked) console.log(`NOTE: ${a.why} — mapping anyway, the frame is this place, not the authored one`);

const g = await aim(page, YAW, { pitch: PITCH, width: VW, height: VH });
if (!g.aimed) { console.log(`NOT AIMED: asked yaw ${YAW}, head at ${g.yaw} (${g.off.toFixed(1)} deg off)`); if (out.probes.length) {
  console.log("\nprobe (first three hits at each point):");
  for (const hits of out.probes) for (const h of hits) {
    console.log(`  ${h.at.join(",").padEnd(10)} ${String(h.name).padEnd(34)} ${h.colour} op=${h.opacity} ` +
                `${String(h.d).padStart(7)} cm (${(h.d / 100).toFixed(1)} m) ${String(h.verts).padStart(5)} verts ` +
                `bbox ${h.bb ? JSON.stringify(h.bb) : "n/a"}`);
  }
}
await browser.close(); process.exit(2); }
await park(page);
console.log(`head yaw ${g.yaw.toFixed(1)} pitch ${g.pitch.toFixed(1)}`);

const out = await page.evaluate(({ COLS, ROWS, VW, VH, PROBES }) => {
  const T = window.__THREE, cam = window.__cam, scene = window.__threeScene;
  const rc = new T.Raycaster();
  const cells = [], legend = new Map();
  /* A name alone is not an identity: the lane's scenery is merged per material, so forty plates
     share the name "walk lane: flat". The colour is part of the key, and the label carries it, so a
     green slab can be told from a grey wall. */
  const tail = (n) => String(n).replace(/^walk lane:\s*/, "").replace(/^surveyed world:\s*/, "");
  const keyOf = (h) => {
    if (!h) return "EMPTY";
    const m = h.object.material;
    return `${tail(h.object.name || h.object.type)} ${m?.color ? "#" + m.color.getHexString() : ""}`.trim();
  };
  const nameOf = (h) => {
    if (!h) return "EMPTY";
    return keyOf(h).slice(0, 13);
  };
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const x = (c + 0.5) * VW / COLS, y = (r + 0.5) * VH / ROWS;
      rc.setFromCamera(new T.Vector2((x / VW) * 2 - 1, -(y / VH) * 2 + 1), cam);
      const h = rc.intersectObjects(scene.children, true)[0];
      const key = keyOf(h);
      if (!legend.has(key)) legend.set(key, { n: 0, d: [], cols: new Set(), verts: 0, quads: 0 });
      const e = legend.get(key);
      e.n++;
      if (h) {
        e.d.push(h.distance);
        const g = h.object.geometry;
        e.verts = Math.max(e.verts, g?.attributes?.position?.count || 0);
        const m = h.object.material;
        e.cols.add("#" + (m?.color ? m.color.getHexString() : "?"));
      }
      row.push(key);
    }
    cells.push(row);
  }
  const probes = PROBES.map(([px, py]) => {
    rc.setFromCamera(new T.Vector2((px / VW) * 2 - 1, -(py / VH) * 2 + 1), cam);
    const hs = rc.intersectObjects(scene.children, true).slice(0, 3).map((h) => {
      const g = h.object.geometry || {};
      let bb = null;
      try {
        if (!g.boundingBox) g.computeBoundingBox();
        bb = g.boundingBox ? [g.boundingBox.min.toArray().map(Math.round), g.boundingBox.max.toArray().map(Math.round)] : null;
      } catch (e) { bb = null; }
      return { at: [px, py], name: h.object.name, colour: "#" + (h.object.material?.color?.getHexString() || "?"),
               opacity: h.object.material?.opacity, d: Math.round(h.distance), verts: g.attributes?.position?.count || 0, bb };
    });
    return hs;
  });
  return {
    probes,
    cells,
    legend: [...legend].map(([k, v]) => ({
      k, n: v.n, verts: v.verts, cols: [...v.cols].slice(0, 6),
      lo: v.d.length ? Math.min(...v.d) : 0, hi: v.d.length ? Math.max(...v.d) : 0,
    })),
  };
}, { COLS, ROWS, VW, VH, PROBES: PROBE });

for (const row of out.cells) console.log(row.map((c) => c.padEnd(14)).join(""));
console.log("\nlegend   cells  distance (cm)        (m)          geometry        materials");
for (const e of out.legend.sort((p, q) => q.n - p.n)) {
  console.log(`  ${e.k.padEnd(14)} ${String(e.n).padStart(3)}  ${String(e.lo).padStart(7)}..${String(e.hi).padEnd(7)} ` +
              `${(e.lo / 100).toFixed(1).padStart(7)}..${(e.hi / 100).toFixed(1).padEnd(7)} ` +
              `${String(e.verts).padStart(6)} verts  ${e.cols.join(" ")}`);
}
if (out.probes.length) {
  console.log("\nprobe (first three hits at each point):");
  for (const hits of out.probes) for (const h of hits) {
    console.log(`  ${h.at.join(",").padEnd(10)} ${String(h.name).padEnd(34)} ${h.colour} op=${h.opacity} ` +
                `${String(h.d).padStart(7)} cm (${(h.d / 100).toFixed(1)} m) ${String(h.verts).padStart(5)} verts ` +
                `bbox ${h.bb ? JSON.stringify(h.bb) : "n/a"}`);
  }
}
await browser.close();

/* _ray — raw ray intersections at a pixel, read from the live scene.
   A diagnostic, not a gate: prints the first three hits with the mesh, position, distance, clipping,
   visibility and vertex colours. A raw hit is not necessarily a painted pixel: it can be hidden,
   clipped, transparent or the sky drawn behind a farther surface. Refuses a missed stop or heading
   (exit 2); ALLOW_SHORT=1 explicitly permits a settled-short stop and labels the actual position.
   Run: sh bin/gate node .verify/_ray.mjs [stop] [px,py ...] */
import { launch, openPage, arrive, aim, park } from "./_aim.mjs";

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const STOP = Number(process.argv[2] || 3);
const YAW = Number(process.env.YAW || -90);
const PITCH = process.env.PITCH === undefined ? null : Number(process.env.PITCH);
const HOUR = process.env.HOUR || "day";
const ALLOW_SHORT = process.env.ALLOW_SHORT === "1";
const PX = (process.argv.slice(3).join(" ") || "300,340 560,330 800,330 900,600 700,700")
  .split(" ").map((s) => s.split(",").map(Number));
const browser = await launch({ width: 1024, height: 768 });
const expose = async (req) => {
  if (!/\/js\/scene3d\.js(\?|$)/.test(req.url())) return req.continue();
  try {
    const body = (await (await fetch(req.url())).text())
      .replace("const scene = new THREE.Scene();",
               "const scene = new THREE.Scene(); window.__threeScene = scene; window.__THREE = THREE;")
      .replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);",
               "const camera = (window.__cam = new THREE.PerspectiveCamera(45, 1, 20, 600000));")
      // A merged mesh records which prim owns each vertex range.
      .replace("colorBatches.push({ geometry, items: batch.items });",
               "colorBatches.push({ geometry, items: batch.items }); window.__colorBatches = colorBatches;");
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { req.continue(); }
};
const page = await openPage(browser, { rooms: FILE, base: BASE, hour: HOUR, intercept: expose });
const exposed = await page.evaluate(() => !!(window.__threeScene && window.__cam && window.__THREE));
if (!exposed) {
  console.log("REFUSED: scene or camera was not published");
  await browser.close(); process.exit(2);
}
const a = await arrive(page, STOP);
if (!a.target || (!a.arrived && !(ALLOW_SHORT && a.blocked))) {
  console.log(`REFUSED stop ${STOP}: ${a.why || "no arrival"}`);
  await browser.close(); process.exit(2);
}
const g = await aim(page, YAW, { pitch: PITCH });
if (!g.aimed) {
  console.log(`REFUSED heading: requested yaw ${YAW}, actual yaw ${g.yaw}, pitch ${g.pitch}`);
  await browser.close(); process.exit(2);
}
await park(page);
const renderer = await page.evaluate(() => document.querySelector("[data-walk]").__walk.renderer);
console.log(`REPORT (not a gate) raw ray hits — ${FILE} stop ${STOP}: target z=${a.target.z} x=${a.target.x}; ` +
  `body z=${Math.round(a.at.z)} x=${Math.round(a.at.x)}; yaw ${g.yaw.toFixed(1)} pitch ${g.pitch.toFixed(1)}; ${renderer}`);
if (a.blocked) console.log(`NOTE: ${a.why} — ALLOW_SHORT=1 reports the actual place, not the authored stop`);
const hits = await page.evaluate((pts) => {
  const scene = window.__threeScene, cam = window.__cam, THREE = window.__THREE;
  const ray = new THREE.Raycaster();
  const out = [];
  for (const [px, py] of pts) {
    const ndc = new THREE.Vector2((px / 1024) * 2 - 1, -(py / 768) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const h = ray.intersectObjects(scene.children, true).slice(0, 3).map((x) => {
      // What colour is the *triangle* that was hit? Its three vertex colours, read straight out of
      // the batch the mesh was built from: a white slab in the frame is otherwise guesswork between
      // twenty systems that all report their material colour as #ffffff.
      let prim = null;
      const cb = (window.__colorBatches || []).find((b) => b.geometry === x.object.geometry);
      if (cb && x.face) {
        const t = x.faceIndex;
        const v0 = x.object.geometry.index ? x.object.geometry.index.getX(t * 3) : t * 3;
        const it = cb.items.find((q) => v0 >= q.start && v0 < q.start + q.count);
        if (it) prim = it.prim;
      }
      let vc = null;
      const col = x.object.geometry && x.object.geometry.getAttribute("color");
      if (col && x.face) {
        // Raycaster.face already contains resolved vertex indices, including on indexed geometry.
        const tri = [x.face.a, x.face.b, x.face.c];
        vc = tri.map((i) => [col.getX(i), col.getY(i), col.getZ(i)].map((v) => +v.toFixed(3)));
      }
      const material = Array.isArray(x.object.material)
        ? x.object.material[x.face?.materialIndex || 0] : x.object.material;
      let visible = !material || material.visible !== false;
      for (let node = x.object; node; node = node.parent) if (node.visible === false) visible = false;
      return {
        mesh: x.object.name || "(unnamed)",
        mat: material && (material.name || material.type),
        p: x.point.toArray().map((v) => Math.round(v)),
        d: Math.round(x.distance), vc, prim, visible,
        clipZ: +x.point.clone().project(cam).z.toFixed(4),
        op: material && material.opacity,
      };
    });
    out.push({ px, py, h });
  }
  return out;
}, PX);
for (const r of hits) {
  console.log(`pixel ${r.px},${r.py}`);
  for (const h of r.h) console.log(`   ${String(h.d).padStart(6)} cm (${(h.d / 100).toFixed(1)} m)  ${h.mesh.padEnd(34)} at ${JSON.stringify(h.p)}` +
    (!h.visible ? "  hidden" : "") + (Math.abs(h.clipZ) > 1 ? `  clipped(z=${h.clipZ})` : "") +
    (h.vc ? `  vcol ${JSON.stringify(h.vc)}` : "") + (h.op !== undefined && h.op < 1 ? `  op ${h.op}` : "") +
    (h.prim ? `\n           prim ${JSON.stringify(h.prim).slice(0, 260)}` : ""));
}
await browser.close();
process.exit(0);

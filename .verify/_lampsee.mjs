/* _lampsee -- where every lamp halo of a page is, at a stop, and why it does or does not show.
   A night frame with no lights in it has four possible causes and a frame cannot tell them apart:
   the halo is switched off (opacity 0), it is outside the frame, it is behind something
   (the sprite is depth-tested), or it is lit, in frame, unoccluded and simply too faint to read.
   This prints one line per lamp with those four answers, read from the live scene.
   Run: FILE=rooms-niagara.html HOUR=night STOP=6 sh bin/gate node .verify/_lampsee.mjs
   REPORT, not a gate. */
import { launch, openPage, arrive, park, state } from "./_aim.mjs";
const FILE = process.env.FILE || "rooms-niagara.html";
const HOUR = process.env.HOUR || "night";
const STOPS = String(process.env.STOP || 6).split(",").map(Number);
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const browser = await launch({ width: 1024, height: 768 });
const expose = async (req) => {
  if (!/\/js\/scene3d\.js(\?|$)/.test(req.url())) return req.continue();
  try {
    const src = await (await fetch(req.url())).text();
    const body = src
      .replace("const scene = new THREE.Scene();",
               "const scene = new THREE.Scene(); window.__threeScene = scene; window.__THREE = THREE;")
      .replace("const camera = new THREE.PerspectiveCamera(45, 1, 20, 600000);",
               "const camera = (window.__cam = new THREE.PerspectiveCamera(45, 1, 20, 600000));");
    if (body === src) console.log("REFUSED: the anchors this instrument rewrites are gone");
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { req.continue(); }
};
const page = await openPage(browser, { rooms: FILE, base: BASE, hour: HOUR, intercept: expose, reduce: true });
if (!(await page.evaluate(() => !!(window.__threeScene && window.__cam && window.__THREE)))) {
  console.log("REFUSED: scene or camera was not published"); await browser.close(); process.exit(2);
}
for (const STOP of STOPS) {
  const a = await arrive(page, STOP);
  await park(page, 1200);
  const s = await state(page);
  const rows = await page.evaluate(() => {
    const scene = window.__threeScene, cam = window.__cam, THREE = window.__THREE;
    const ray = new THREE.Raycaster(), out = [];
    const solid = [];
    scene.traverse((o) => { if (o.isMesh && !/^3D /.test(o.name || "") && o.visible) solid.push(o); });
    scene.traverse((o) => {
      if (!o.isSprite || !/^3D lamp halo/.test(o.name || "")) return;
      const p = o.position.clone(), n = p.clone().project(cam);
      const px = Math.round((n.x * 0.5 + 0.5) * 1024), py = Math.round((-n.y * 0.5 + 0.5) * 768);
      const dist = p.distanceTo(cam.position);
      const inFrame = n.z < 1 && px >= 0 && px < 1024 && py >= 0 && py < 768;
      let behind = null;
      if (inFrame) {
        ray.set(cam.position, p.clone().sub(cam.position).normalize());
        const h = ray.intersectObjects(solid, false)[0];
        if (h && h.distance < dist - 1) behind = { d: Math.round(h.distance), name: h.object.name || h.object.type };
      }
      out.push({ name: o.name, x: Math.round(p.x), y: Math.round(p.y), z: Math.round(p.z), vis: o.visible,
        op: +o.material.opacity.toFixed(3), col: "#" + o.material.color.getHexString(),
        r: Math.round(o.scale.x / 2), dist: Math.round(dist), px, py, inFrame, behind });
    });
    return out;
  });
  console.log(`\n${FILE} ${HOUR} stop ${STOP} "${a.target.label}" body x=${Math.round(s.x)} z=${Math.round(s.z)} yaw ${s.yaw.toFixed(1)} pitch ${s.pitch.toFixed(1)}`);
  let shown = 0;
  for (const r of rows) {
    const why = !r.vis || r.op <= 0.002 ? "OFF" : !r.inFrame ? "out of frame"
      : r.behind ? `BEHIND ${r.behind.name} at ${r.behind.d} cm` : "shows";
    if (why === "shows") shown++;
    console.log(`  ${r.name.replace("3D lamp halo ", "#").padEnd(4)} at ${String(r.x).padStart(6)},${String(r.y).padStart(4)},${String(r.z).padStart(6)} ` +
                `r ${String(r.r).padStart(4)} op ${r.op.toFixed(2)} ${r.col} ${String(r.dist).padStart(6)} cm  ` +
                `px ${String(r.px).padStart(5)},${String(r.py).padStart(5)}  ${why}`);
  }
  console.log(`  ${rows.length} halos, ${shown} show`);
}
await browser.close();

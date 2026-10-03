/* Geometry audit in the space the renderer actually draws in.

   The emitter multiplies an object's z by Z_SCALE but not its depth, so a prop's distance from
   its table's centre counts 2.9x while the tabletop's own extent does not. A layout that is
   perfectly consistent on paper can therefore hang its contents off the edge, which is exactly
   what the Toronto hall did until this check existed.

   Read the attributes the renderer reads: --z (already scaled) and data-d (not scaled).
   Run:  node .verify/verify-geometry.mjs   */
import { JSDOM } from "jsdom";
import fs from "node:fs";

let bad = 0;
for (const f of ["rooms-toronto.html", "rooms.html", "rooms-fukuoka.html", "street.html"]) {
  if (!fs.existsSync(f)) continue;
  const doc = new JSDOM(fs.readFileSync(f, "utf8")).window.document;
  const objs = [...doc.querySelectorAll("[data-obj]")].map((el) => {
    const cs = el.style, n = (k) => parseFloat(cs.getPropertyValue(k)) || 0;
    return { id: el.dataset.obj, x: n("--x"), z: n("--z"), y: n("--y"), ry: n("--ry"),
             w: parseFloat(el.dataset.w) || 30, h: parseFloat(el.dataset.h) || 30,
             d: parseFloat(el.dataset.d) || 12 };
  });
  const foot = (o) => {
    const hx = (Math.abs(o.ry) > 45 ? o.d : o.w) / 2, hz = (Math.abs(o.ry) > 45 ? o.w : o.d) / 2;
    return { id: o.id, x0: o.x - hx, x1: o.x + hx, z0: o.z - hz, z1: o.z + hz, top: o.y + o.h, y: o.y };
  };
  const F = new Map(objs.map((o) => [o.id, foot(o)]));
  const inside = (p, s) => p.x0 >= s.x0 - 0.5 && p.x1 <= s.x1 + 0.5 && p.z0 >= s.z0 - 0.5 && p.z1 <= s.z1 + 0.5;
  const centre = (p, s) => (p.x0 + p.x1) / 2 >= s.x0 && (p.x0 + p.x1) / 2 <= s.x1
                        && (p.z0 + p.z1) / 2 >= s.z0 && (p.z0 + p.z1) / 2 <= s.z1;
  const problems = [];
  for (const o of objs) {
    const p = F.get(o.id);
    // a support is something whose top this prop stands on and whose footprint it sits within
    // "stands on" means resting on the top, not merely above something: an awning on a wall has a
    // camera underneath it and is not therefore a prop falling off a camera.
    // and a thing cannot rest on something smaller than itself: a wall awning over a wall camera
    // is two fittings on the same wall, not a prop falling off a bracket.
    const sup = objs.filter((s) => s.id !== o.id && s.y + s.h <= o.y + 1 && o.y - (s.y + s.h) <= 12
                                   && centre(p, F.get(s.id))
                                   && (s.w >= o.w && s.d >= o.d)).map((s) => F.get(s.id));
    for (const s of sup) {
      if (!inside(p, s)) {
        const over = [p.z0 < s.z0 ? `${Math.round(s.z0 - p.z0)}cm past the near edge` : "",
                      p.z1 > s.z1 ? `${Math.round(p.z1 - s.z1)}cm past the far edge` : "",
                      p.x0 < s.x0 ? `${Math.round(s.x0 - p.x0)}cm past the left edge` : "",
                      p.x1 > s.x1 ? `${Math.round(p.x1 - s.x1)}cm past the right edge` : ""].filter(Boolean);
        problems.push(`${o.id} hangs off ${s.id}: ${over.join(", ")}`);
      }
    }
  }
  console.log(`${f}: ${objs.length} props`);
  if (!problems.length) console.log("   every prop that stands on something is fully over its top");
  for (const p of problems) { console.log("   " + p); bad++; }
}
console.log(bad ? `\n${bad} prop(s) hanging off` : "\ngeometry OK");
process.exit(bad ? 1 : 0);

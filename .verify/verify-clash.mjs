/* Two props standing on the same surface may not occupy the same ground.

   `verify-geometry.mjs` asks whether a prop is over the thing it stands on; it never asks whether
   the prop next to it is standing in the same place. The market did exactly that -- two stalls at
   the same x, both turned a quarter turn so their 84 cm width ran along z, overlapping by 54 cm --
   and every containment check passed, because both were perfectly over the tabletop.

   A prop's footprint is turned by the general rotated-AABB rule (the same one geometry uses), and
   two props clash when they share a surface and their footprints overlap on both axes. Wall-mounted
   things are excluded: a wall carries a pipe, a vent and a sign at the same height on purpose.
   Run:  node .verify/verify-clash.mjs   */
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
    const t = (o.ry * Math.PI) / 180, ca = Math.abs(Math.cos(t)), sa = Math.abs(Math.sin(t));
    return { x0: o.x - (ca * o.w + sa * o.d) / 2, x1: o.x + (ca * o.w + sa * o.d) / 2,
             z0: o.z - (sa * o.w + ca * o.d) / 2, z1: o.z + (sa * o.w + ca * o.d) / 2, y: o.y };
  };
  const F = new Map(objs.map((o) => [o.id, foot(o)]));
  // Group by what each prop stands on, not by height: a wall carries a pipe, a vent and a sign at
  // the same height on purpose, and an earlier version of this check excluded everything above
  // y=40 to skip those -- which also skipped every table in the building, since tables are 80 up.
  const support = new Map();
  for (const o of objs) {
    const p = F.get(o.id);
    let sup = null;
    for (const s of objs) {
      if (s.id === o.id) continue;
      const q = F.get(s.id);
      // Water carries things rather than sharing ground with them: a ship floats in a basin and a
      // bridge spans one, so neither is a prop standing where the water stands.
      const isWater = (t) => t.id.startsWith("pool-") || t.id.startsWith("water-");
      if (!isWater(s) && s.y + s.h <= o.y + 1 && o.y - (s.y + s.h) <= 12
          && o.x >= q.x0 && o.x <= q.x1 && o.z >= q.z0 && o.z <= q.z1
          && s.w >= o.w && s.d >= o.d) { sup = s.id; break; }
    }
    if (sup) support.set(o.id, sup);
  }
  const clashes = [];
  const groups = new Map();
  for (const [id, sup] of support) (groups.get(sup) || groups.set(sup, []).get(sup)).push(id);
  // Water is a surface, not a prop that can be stood next to, so it never appears as a member.
  // A bridge is a machine that lifts: what passes under its raised leaves is timed to the opening
  // and is not standing where the bridge stands. The static footprint test cannot see the clock,
  // so it does not judge that pair -- the ships' timing is verified by the run-time probes instead.
  // A guideway is the same case as water: a tram stands on its track the way a ship floats in a
  // basin, and neither is a second prop competing for the same ground.
  const surface = (id) => id.startsWith("pool-") || id.startsWith("water-")
                       || id.startsWith("track-") || id.startsWith("rail-");
  const spans = (id) => id.startsWith("drawbridge") || id.startsWith("bridge-");
  for (const [sup, rawMembers] of groups) {
    const members = rawMembers.filter((id) => !surface(id));
    for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
      if (spans(members[i]) || spans(members[j])) continue;
      const pa = F.get(members[i]), pb = F.get(members[j]);
      const ox = Math.min(pa.x1, pb.x1) - Math.max(pa.x0, pb.x0);
      const oz = Math.min(pa.z1, pb.z1) - Math.max(pa.z0, pb.z0);
      if (ox > 2 && oz > 2)
        clashes.push(`    ${members[i]} x ${members[j]}: ${ox.toFixed(0)}cm across, ${oz.toFixed(0)}cm deep (both on ${sup})`);
    }
  }
  console.log(`${f}: ${objs.length} props, ${clashes.length} clashing`);
  clashes.forEach((c) => console.log(c));
  bad += clashes.length;
}
console.log(bad ? `\n${bad} clashing pair(s)` : "\nno two props occupy the same ground");
process.exit(bad ? 1 : 0);

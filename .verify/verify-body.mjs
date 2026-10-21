/* Body audit: can the walker stand inside a prop that is drawn at body height?

   The owner walked every room and said things were stuck on him. They were: the walker's body is a
   circle of radius 24 cm, and only props the *generator* marks `data-solid` push it away. That mark
   used to mean "a kind in WALK_SOLID_KINDS that starts on the floor" — `y <= 0 < y + h`. Every prop
   whose box begins above the floor was therefore scenery you walk straight through: the street's
   sandwich boards (y 150..236), the goldfish and mask stalls (kind `board`), Moji Port's High Mart
   base and basin edge, the bluff and the incline car at Niagara. Standing inside one is not a visual
   quirk — the camera ends up *inside* the box and the frame becomes a flat wash of its inner face,
   which is exactly what "物件卡在我身上" looks like.

   So this gate asks the question the collision gate cannot: not "does a solid stop the body" but
   "is there any place the body can stand that a drawn prop already occupies?" It reads the served
   HTML, rebuilds the walkable set by breadth-first search with the walker's own numbers (lane width,
   per-segment width clamps, every solid's expanded box), and then tests every prop that crosses the
   body band 25..180 cm against that set.

   Run:  node .verify/verify-body.mjs
*/
import fs from "node:fs";

const R = 24;                       // PLAYER_RADIUS, js/site.js
const STEP = 10;                    // the search grid, cm
const BODY_LO = 25, BODY_HI = 180;  // the cylinder a visitor occupies: floor to above the head
const MIN_THICK = 25;               // thinner than this is a floor graphic, walked over
/* A portal is an opening's press box (skills/lane-prop): you are meant to walk through it, so a
   body standing in it is the design, not a defect. Everything else that is drawn around the body
   must push the body away. */
const PASS_THROUGH = new Set(["portal"]);
const pages = fs.readdirSync(".").filter((f) => f.endsWith(".html")
  && fs.readFileSync(f, "utf8").includes('data-obj="')).sort();

const num = (tag, name, dflt = 0) => {
  const m = tag.match(new RegExp(`data-${name}="([-0-9.]+)"`));
  return m ? parseFloat(m[1]) : dflt;
};
// `--ry` is authored in deg and the rest in px; a px-only pattern read every rotation as 0 and
// turned the gate into a liar about every wall-mounted prop (measured: 36 findings, most of them
// boxes the gate had rotated wrong).
const style = (tag, prop) => {
  const m = tag.match(new RegExp(`--${prop}:(-?[0-9.]+)(?:px|deg)`));
  return m ? parseFloat(m[1]) : 0;
};

let failures = 0, checks = 0;
const say = (ok, what, detail) => {
  checks++;
  if (!ok) { failures++; console.log(`FAIL  ${what}  — ${detail}`); }
};

for (const file of pages) {
  const page = fs.readFileSync(file, "utf8");
  const lane = page.match(/<div class="walk"[^>]*>/);
  if (!lane) continue;
  const tag = lane[0];
  const half = Math.max(0, num(tag, "lane-w", 640) / 2 - R);
  const back = -30;   // MIN_D, js/site.js: the lane lets a body stand a little behind its start
  const maxD = num(tag, "lane-max-d", num(tag, "lane-d", 0));
  const segs = (() => { try { return JSON.parse((tag.match(/data-lane-wseg="([^"]*)"/) || [, "[]"])[1]); }
                        catch (_) { return []; } })();
  const halfAt = (z) => {
    let h = half;
    for (const s of segs) if (Array.isArray(s) && z >= s[0] && z <= s[1]) h = Math.max(h, s[2] - R);
    return h;
  };

  const props = [];
  for (const b of page.matchAll(/<button[^>]*class="walk-hit"[^>]*>/g)) {
    const t = b[0];
    const id = (t.match(/data-obj="([A-Za-z0-9-]+)"/) || [, ""])[1];
    const ry = style(t, "ry") * Math.PI / 180;
    const w = num(t, "w", 100), d = num(t, "d", 12), h = num(t, "h", 140);
    const y = style(t, "y");
    props.push({ id, kind: (t.match(/data-kind="([^"]*)"/) || [, ""])[1], solid: /data-solid="true"/.test(t),
      x: style(t, "x"), z: style(t, "z"), y, w, d, h,
      hx: (w * Math.abs(Math.cos(ry)) + d * Math.abs(Math.sin(ry))) / 2,
      hz: (w * Math.abs(Math.sin(ry)) + d * Math.abs(Math.cos(ry))) / 2 });
  }
  if (!props.length) continue;

  // The walkable set, exactly as the walker resolves it: lane band per depth, every solid's box
  // grown by the body radius.
  const solids = props.filter((p) => p.solid).map((p) => ({ ...p, hx: p.hx + R, hz: p.hz + R }));
  const free = (x, z) => {
    if (Math.abs(x) > halfAt(z) + 0.01) return false;
    for (const s of solids) if (Math.abs(x - s.x) <= s.hx && Math.abs(z - s.z) <= s.hz) return false;
    return true;
  };
  const start = [0, 60];
  if (!free(...start)) { say(false, `${file}: the walker's own start is inside a solid`, "0,60 blocked"); continue; }
  const seen = new Set(["0,60"]);
  const queue = [start];
  let far = 60;
  while (queue.length) {
    const [x, z] = queue.shift();
    far = Math.max(far, z);
    for (const [dx, dz] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
      const nx = x + dx, nz = z + dz;
      const key = `${nx},${Math.round(nz)}`;
      if (nz < back || nz > maxD || Math.abs(nx) > 2000 || seen.has(key)) continue;
      if (!free(nx, nz)) continue;
      seen.add(key); queue.push([nx, nz]);
    }
  }

  // 1. Nothing drawn across the body band may contain a place the body can stand.
  const intrusions = [];
  for (const p of props) {
    if (p.solid || PASS_THROUGH.has(p.kind)) continue;
    const lo = Math.max(p.y, BODY_LO), hi = Math.min(p.y + p.h, BODY_HI);
    if (hi - lo < MIN_THICK) continue;             // a drain, a glass floor, a painted line
    let n = 0, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const cell of seen) {
      const [cx, cz] = cell.split(",").map(Number);
      if (Math.abs(cx - p.x) < p.hx && Math.abs(cz - p.z) < p.hz) {
        n++; x0 = Math.min(x0, cx); x1 = Math.max(x1, cx);
        z0 = Math.min(z0, cz); z1 = Math.max(z1, cz);
      }
    }
    if (n) intrusions.push({ p, n, x0, x1, z0, z1 });
  }
  for (const i of intrusions) {
    say(false, `${file}: a body can stand inside ${i.p.id}`,
      `y ${i.p.y}..${i.p.y + i.p.h}, ${i.n} cells at x ${i.x0}..${i.x1} z ${i.z0}..${i.z1}`);
  }

  // 2. Every depth must leave a passage a visitor can actually steer through, and it must be wider
  //    than the sliver that made the Moji hall a dead end: at the table's flank that room offered
  //    22 cm of clear width for a 48 cm body, so the walk stopped at the table's near face and the
  //    old gate — which only asked for "an aisle of positive width" — blessed it. 60 cm is the
  //    narrowest gap a body of this radius can cross without scraping.
  let tightest = Infinity, tightZ = 0;
  for (let z = -20; z <= maxD; z += 20) {
    const h = halfAt(z);
    const blocked = solids.filter((s) => Math.abs(z - s.z) <= s.hz)
      .map((s) => [Math.max(-h, s.x - s.hx), Math.min(h, s.x + s.hx)])
      .filter(([lo, hi]) => hi > lo).sort((a, b) => a[0] - b[0]);
    let run = 0, cur = -h;
    for (const [lo, hi] of blocked) { if (lo > cur) run = Math.max(run, lo - cur); cur = Math.max(cur, hi); }
    run = Math.max(run, h - cur);
    if (run < tightest) { tightest = run; tightZ = z; }
  }
  say(tightest >= 60, `${file}: every depth leaves a passage to steer through`,
    `narrowest free run ${tightest.toFixed(0)} cm at z ${tightZ} (a 48 cm body)`);

  // 3. The authored walk must still be walkable end to end — solidity may not sever the route.
  say(far >= maxD - 60, `${file}: the lane still reaches its authored depth`,
    `reached ${far} cm of ${maxD}`);

  console.log(`${file}: ${seen.size} standable cells, route to ${Math.round(far)}/${Math.round(maxD)} cm, `
    + `narrowest run ${tightest.toFixed(0)} cm, ${intrusions.length} intrusion${intrusions.length === 1 ? "" : "s"}`);
}

console.log(`\n${checks - failures}/${checks} pass`);
process.exit(failures ? 1 : 0);

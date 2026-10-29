/* The lane's own invariants, asserted against the real `js/site.js` in jsdom.

   These are the three collision causes of round 68, expressed as properties rather than as a replay
   of `verify-collision` (which stays the end-to-end sweep: seven pages, every stop, every solid's
   corners, 24-frame rings). A property here is cheap enough to run on every edit, and each one names
   the mechanism it guards:

     1. the lane boundary is a face, and a step the clamp eats is not a clear step   (cause 2)
     2. a body braced on a prop's face still moves along it                          (cause 1)
     3. a contact resolves to legal floor, and the boundary is where the code says    (cause 3)
     4. no page spawns a visitor inside the geometry it would then be pushed out of

   Read them as "the solver's arithmetic still means what round 68 made it mean", not as "the site is
   walkable" — that question belongs to `.verify/verify-collision.cjs` plus `verify-rooms-e2e.cjs`,
   and nothing here replaces them.

   Each case walks to its geometry the way a visitor does: `toStop` rides the rail, `turnTo` holds
   A/D, `press` holds W. Nothing writes `x`, `depth` or `yaw` directly — a test that teleports is a
   test of its own arithmetic.

   Run: node --test        (from the repository root; discovers tests/*.test.cjs)
*/
const test = require("node:test");
const assert = require("node:assert/strict");
const { boot, solids, turnTo } = require("./helpers/boot.cjs");

const PAGES = ["street.html", "rooms.html", "rooms-toronto.html", "rooms-niagara.html"];

/* Boot a page, hand it to `fn`, and always close the window: jsdom's timers outlive the test and
   `node --test` waits for the process to drain. */
async function withPage(file, fn) {
  const env = await boot(file);
  try { return await fn(env); } finally { env.close(); }
}

/* A stop is a rail position: clicking it glides the body there. Wait for the lane to say it arrived
   (`__walk.glide`), never for a frame count — the glide's speed depends on the machine. */
async function toStop(env, index) {
  const btn = env.doc.querySelector(`[data-walk-stop="${index}"]`);
  assert.ok(btn, `stop ${index} exists`);
  btn.dispatchEvent(new env.w.MouseEvent("click", { bubbles: true }));
  for (let i = 0; i < 400; i++) {
    if (!env.walk().glide) return env.state();
    await env.pump(5);
  }
  throw new Error(`glide to stop ${index} never finished`);
}

/* Press a key and report what each frame did: the distance covered, and the longest run of frames
   under 2 cm/s — `verify-collision`'s own stillness threshold, because a 1.2 cm/s creep along a face
   is walking while a dead stop is the defect. */
async function press(env, key, frames) {
  env.key(key);
  const speeds = [];
  let prev = env.state();
  for (let i = 0; i < frames; i++) {
    await env.pump(1);
    const s = env.state();
    speeds.push(Math.hypot(s.x - prev.x, s.depth - prev.depth) / 0.017);
    prev = s;
  }
  env.keyUp(key);
  await env.pump(4);
  let worst = 0, run = 0;
  for (const v of speeds) { if (v < 2) { run += 1; worst = Math.max(worst, run); } else run = 0; }
  return { speeds, stillRun: worst, end: env.state() };
}

/* Signed clearance from a point to one solid's rotated rectangle, in cm — the same quantity the
   solver's push-out reads, so a test and the body agree about where the face is. */
function clearance(b, x, z) {
  const dx = x - b.x, dz = z - b.z;
  const lx = dx * b.c + dz * b.s, ld = -dx * b.s + dz * b.c;
  const ox = Math.max(Math.abs(lx) - b.w / 2, 0), od = Math.max(Math.abs(ld) - b.d / 2, 0);
  return Math.hypot(ox, od);
}

test("every page spawns the visitor on legal floor", async (t) => {
  for (const file of PAGES) {
    await t.test(file, () => withPage(file, (env) => {
      const W = env.walk();
      const s = env.state();
      assert.equal(env.errors.length, 0, `page errors: ${env.errors.slice(0, 2).join(" / ")}`);
      assert.ok(Math.abs(s.x) <= W.halfWidth, `spawn x ${s.x} inside half-width ${W.halfWidth}`);
      assert.ok(s.depth >= W.minDepth && s.depth <= W.maxDepth, `spawn depth ${s.depth} inside the lane`);
      assert.equal(W.blockedAt(s.x, s.depth), false, "spawn is not inside a solid");
      assert.ok(W.halfWidth < W.wallHalf, `walkable ${W.halfWidth} < wall ${W.wallHalf}`);
      assert.ok(W.radius < W.halfWidth, `body ${W.radius} fits the lane's half-width`);
      assert.ok(solids(env.doc).length > 0, "the page declares solids at all");
    }));
  }
});

test("the wall is a face: a clamped step is never reported as clear (cause 2)", () => withPage("street.html", async (env) => {
  /* Round 68, cause 2: `clear()` asked `collidesAt` only, so a creep the lane boundary had already
     clamped reported clear — the solver picked the wall side every frame, the clamp ate the whole
     step, and the body stood still beside a face it could walk along (`_wedge2` measured it at
     x = −431 with `clear:[1,1]` and a 0.51 cm hop that cancelled itself). The property: pressed
     against the wall at any angle, the body keeps walking along it. */
  const W = env.walk();
  await toStop(env, 7);
  await turnTo(env, 90);
  const into = await press(env, "w", 90);
  assert.ok(into.end.x > W.halfWidth * 0.5, `walking east reaches the wall, got x ${into.end.x.toFixed(1)}`);
  assert.ok(into.end.x <= W.halfWidth + 0.001, `the wall holds: x ${into.end.x.toFixed(2)} ≤ ${W.halfWidth}`);
  for (const yaw of [45, 60, 75]) {
    await turnTo(env, yaw);
    const from = env.state();
    const r = await press(env, "w", 90);
    const slide = Math.abs(r.end.depth - from.depth);
    assert.ok(slide > 20, `pressed ${yaw}° against the wall, the body slid ${slide.toFixed(1)} cm along it`);
    assert.ok(r.stillRun < 24, `pressed ${yaw}°: stalled ${r.stillRun} frames against the wall`);
    assert.ok(r.end.x <= W.halfWidth + 0.001, `pressed ${yaw}°: still inside the wall (x ${r.end.x.toFixed(2)})`);
    assert.equal(W.blockedAt(r.end.x, r.end.depth), false, `pressed ${yaw}°: body did not settle inside a solid`);
  }
}));

test("braced on a prop's face, the body still walks along it (cause 1)", () => withPage("street.html", async (env) => {
  /* Round 68, cause 1: `buzz` remembered the direction of the last accepted slide and outlived the
     face that taught it; the next face's only clear creep was 115 cm/s × a sub-sampled dt (0.96 cm),
     which can never pay the 1.2 cm reversal price — so a body between two faces stood still with a
     legal way out.

     The geometry is `bollard-s` at (−160, 70): a 16 × 16 post standing in open floor 160 cm west of
     the street's mouth, with no wall and no neighbour within a body's reach (measured: all four
     faces free at R + 6). The body is re-braced before each heading, because a single long press
     walks the body across the lane and into the far wall, where stopping *is* the answer.

     A first version of this test used `planter-s1` and failed on its −45° heading: the press walked
     the body into the corner between the planter's south face and the lane wall, where the only
     exits are backwards and sideways — `verify-collision`'s criterion asks for a *forward* exit and
     would call that stop legal, so the test was wrong, not the solver. The bollard has no such
     corner, which is why it is the fixture. */
  const W = env.walk();
  const post = solids(env.doc).find((b) => b.id === "bollard-s");
  assert.ok(post, "the street declares bollard-s");
  const brace = async () => {
    await toStop(env, 0);
    const heading = (Math.atan2(post.x - env.state().x, post.z - env.state().depth) * 180) / Math.PI;
    await turnTo(env, heading);
    env.key("w");
    for (let i = 0; i < 120 && clearance(post, env.state().x, env.state().depth) > W.radius + 4; i++) await env.pump(1);
    env.keyUp("w");
    await env.pump(4);
    assert.ok(clearance(post, env.state().x, env.state().depth) < W.radius + 8,
      `the body reached the post (clearance ${clearance(post, env.state().x, env.state().depth).toFixed(1)})`);
    return heading;
  };
  for (const off of [45, -45, 60, -60, 90, -90]) {
    const heading = await brace();
    await turnTo(env, heading + off);
    const from = env.state();
    const r = await press(env, "w", 40);
    const moved = Math.hypot(r.end.x - from.x, r.end.depth - from.depth);
    assert.ok(moved > 40, `${off}° off the post's face: moved ${moved.toFixed(1)} cm`);
    assert.ok(r.stillRun < 24, `${off}° off the post's face: stalled ${r.stillRun} frames`);
  }
}));

test("the collision boundary sits where the clearance rule says (cause 3)", () => withPage("street.html", (env) => {
  /* Round 68, cause 3: `pushAt` resolves by exactly `pen = R − dist`, so the resolved point sits ON
     the surface, and the accept test that follows is a strict `<`. Floating point decided that
     comparison and could refuse the only step the solver had found (`_wedge2`: ladder southeast
     corner, `h2.p` 0.07, `col:true`, move 0, a clear 45° exit). The fix adds 0.01 cm of clearance,
     which is worth having only if it is larger than the noise it defends against. Stated on the
     page's own predicate, per solid: touching at exactly R is legal, R + 0.01 cm is legal,
     R − 0.5 cm is inside.

     Faces are only tested where no *other* solid is within two body radii of the sample point:
     a planter standing beside a bench would otherwise measure the bench and call it this face. */
  const W = env.walk();
  const R = W.radius;
  const all = solids(env.doc);
  let faces = 0;
  for (const b of all) {
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const reach = (d) => {
        const lx = nx * (b.w / 2 + R + d), lz = nz * (b.d / 2 + R + d);
        return [b.x + lx * b.c - lz * b.s, b.z + lx * b.s + lz * b.c];
      };
      const [tx, tz] = reach(0);
      const others = all.filter((o) => o !== b && clearance(o, tx, tz) < 2 * R + 2);
      if (others.length) continue;                       // another solid owns this patch of floor
      faces += 1;
      assert.equal(W.blockedAt(tx, tz), false, `${b.id} (${nx},${nz}): touching at exactly R is legal`);
      assert.equal(W.blockedAt(...reach(0.01)), false, `${b.id} (${nx},${nz}): R + 0.01 cm is legal`);
      assert.equal(W.blockedAt(...reach(-0.5)), true, `${b.id} (${nx},${nz}): R − 0.5 cm is inside`);
    }
  }
  assert.ok(faces >= 8, `the street offered ${faces} unshared faces to test`);
}));

/* A resting lane has one redraw timer, whatever was pressed before it came to rest.

   The idle pulse is a `setTimeout` that calls the tick, and the tick arms the next one. Its handle
   has one owner (`startPulse` / `stopPulse`); a caller that writes its own timer into that handle
   without stopping the one in it leaves the old timer running, and when the old timer fires it
   zeroes the handle, so the new one can never be stopped either. From then on there are two chains,
   for the rest of the visit. The hour button did exactly that on every press (measured in a
   browser on the street: 9 ticks a second at rest, 19 after one press, 30 after two, and the
   browser's own frame rate down from 60 to 4), and the incline's pump shared the handle.

   A browser cannot count this reliably: on a heavy page one chain already fills the main thread and
   five chains tick no faster. So this is counted where time is a number -- the lane's timers run off
   a fake clock here, the way three.js freezes time for its own screenshot tests and the way
   `window.advanceTime(ms)` is meant in OpenAI's web-game skill -- and the answer is exact. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { boot, turnTo } = require("./helpers/boot.cjs");

/* Take over the page's timers after boot. The one real timer already pending (the first idle pulse)
   fires within 100 ms and re-arms through this, so after `settle` every lane timer is in `due`. */
async function clocked(file) {
  const env = await boot(file);
  const due = []; let at = 0, id = 1e6;
  const realClear = env.w.clearTimeout.bind(env.w);
  env.w.setTimeout = (fn, ms = 0) => { due.push({ id: ++id, at: at + (Number(ms) || 0), fn }); return id; };
  env.w.clearTimeout = (i) => { const k = due.findIndex((e) => e.id === i); if (k >= 0) due.splice(k, 1); else realClear(i); };
  await new Promise((r) => setTimeout(r, 260));
  const advance = async (ms) => {
    for (const end = at + ms; at < end;) {
      at += 17;
      for (;;) {
        due.sort((a, b) => a.at - b.at);
        if (!due.length || due[0].at > at) break;
        due.shift().fn();
      }
      await env.pump(1);
    }
  };
  const ticksIn = async (ms) => { const n = env.walk().ticks; await advance(ms); return env.walk().ticks - n; };
  return { env, advance, ticksIn, pending: () => due.length };
}

test("the hour button leaves the lane with the one idle timer it had", async () => {
  const { env, advance, ticksIn } = await clocked("street.html");
  try {
    await advance(1000);
    const rest = await ticksIn(3000);
    assert.ok(rest >= 20 && rest <= 40, `at rest: ${rest} ticks in 3 s (one 90 ms pulse is 33)`);
    const btn = env.doc.querySelector("[data-walk-hour]");
    assert.ok(btn, "the street has an hour button");
    for (let i = 0; i < 4; i++) { btn.click(); await advance(700); }
    await advance(5000);   // the hour's sentence is held for three seconds
    const after = await ticksIn(3000);
    assert.ok(Math.abs(after - rest) <= 2, `after four presses: ${after} ticks in 3 s, at rest it was ${rest} (one more chain per press would be ${rest * 5})`);
  } finally { env.close(); }
});

/* The other half of the same contract: a frame is one tick. `tick` is the animation-frame callback
   and is also called by timers (the idle pulse, a demonstration's pump, the ride's). It used to
   forget the frame it had already asked for whenever a timer called it, and asked for another: one
   more frame callback per timer firing, each a full redraw, for as long as the body kept moving.
   Walking during a 24-second demonstration ended at hundreds of redraws a frame. */
test("walking while a demonstration runs is still one tick a frame", async () => {
  const { env, advance } = await clocked("rooms-niagara.html");
  try {
    await advance(1000);
    env.doc.querySelector('[data-walk-stop="5"]').click();
    for (let i = 0; i < 60 && env.walk().glide; i++) await advance(500);
    await turnTo(env, 90);
    await advance(600);
    const reach = env.doc.querySelector(".walk-hit.is-reach");
    assert.equal(reach && reach.dataset.obj, "skywheel", "the wheel is the thing in reach at stop 5 facing 90");
    env.key("e"); env.keyUp("e");
    await advance(300);
    assert.ok(reach.__demoAt !== undefined, "the demonstration is running");
    const n0 = env.walk().ticks, frames = Math.round(2000 / 17);
    env.key("s");
    await advance(2000);
    env.keyUp("s");
    const ticks = env.walk().ticks - n0;
    assert.ok(ticks <= frames * 1.3, `${ticks} ticks in ${frames} frames of walking with the wheel's demonstration running`);
  } finally { env.close(); }
});

test("a ride on the incline leaves the lane with the one idle timer it had", async () => {
  const { env, advance, ticksIn } = await clocked("rooms-niagara.html");
  try {
    await advance(1000);
    const rest = await ticksIn(3000);
    env.doc.querySelector('[data-walk-stop="4"]').click();
    for (let i = 0; i < 60 && env.walk().glide; i++) await advance(500);
    assert.ok(!env.walk().glide, "arrived at the lower station");
    await turnTo(env, 90);
    await advance(600);
    const reach = env.doc.querySelector(".walk-hit.is-reach");
    assert.equal(reach && reach.dataset.obj, "falls-incline", "the incline is the thing in reach at stop 4 facing 90");
    const h0 = env.walk().height;
    const n0 = env.walk().ticks, frames = Math.round(4000 / 17);
    env.key("e"); env.keyUp("e");
    await advance(4000);
    assert.ok(env.walk().height > h0 + 100, `the car climbed (height ${h0} -> ${env.walk().height})`);
    assert.ok(env.walk().ticks - n0 <= frames * 1.3, `the ride is one tick a frame: ${env.walk().ticks - n0} ticks in ${frames} frames`);
    await advance(6000);
    const after = await ticksIn(3000);
    assert.ok(Math.abs(after - rest) <= 2, `after the ride: ${after} ticks in 3 s, at rest it was ${rest}`);
  } finally { env.close(); }
});

/* The turn key's ledger: what a press is owed, and when the debt is closed.

   The head turns in the visitor's own milliseconds (`js/site.js`, `tapState`): while a turn key is
   down each frame pays its share and banks it in `held`; at keyup the press's length -- never less
   than one nudge, `TURN_TAP_MS` -- is banked in `ms`; the first frame that sees the key up pays
   `ms - held` and clears both. Four properties follow, and each one was a defect:

     1. a tap whose down and up share a timestamp is still one nudge
     2. two taps that end inside one frame are two nudges
     3. a press that begins before the last release met a frame is paid in full (it used to inherit
        the earlier press's `held`, so its own release owed nothing)
     4. a key the page stopped hearing (the window lost focus; its keyup went elsewhere) owes
        nothing when it is next pressed (it used to bank the whole time away as one press)

   The clock is the harness's (17 ms a pump), so every expectation is arithmetic, not a tolerance:
   degrees = milliseconds owed x turnRate / 1000.

   Run: node --test        (from the repository root; discovers tests/*.test.cjs)
*/
const test = require("node:test");
const assert = require("node:assert/strict");
const { boot } = require("./helpers/boot.cjs");

const TURN_TAP_MS = 35;      // js/site.js
const FRAME_MS = 17;         // tests/helpers/boot.cjs: one pump

async function withStreet(fn) {
  const env = await boot("street.html");
  try {
    const rate = env.walk().turnRate;
    const turned = (from) => ((env.state().yaw - from + 540) % 360) - 180;
    const owes = (ms) => (ms * rate) / 1000;
    return await fn(env, { turned, owes });
  } finally { env.close(); }
}
const near = (got, want, what) =>
  assert.ok(Math.abs(got - want) < 0.01, `${what}: turned ${got.toFixed(3)} deg, owed ${want.toFixed(3)}`);

test("a turn tap whose down and up share a timestamp is one nudge", () => withStreet(async (env, { turned, owes }) => {
  const from = env.state().yaw;
  env.key("arrowright"); env.keyUp("arrowright");
  await env.pump(4);
  near(turned(from), owes(TURN_TAP_MS), "one tap");
}));

test("two turn taps that end inside one frame are two nudges", () => withStreet(async (env, { turned, owes }) => {
  const from = env.state().yaw;
  env.key("arrowleft"); env.keyUp("arrowleft");
  env.key("arrowleft"); env.keyUp("arrowleft");
  await env.pump(4);
  near(turned(from), -owes(2 * TURN_TAP_MS), "two taps");
}));

test("a press that begins before the last release met a frame is paid in full", () => withStreet(async (env, { turned, owes }) => {
  const from = env.state().yaw;
  env.key("arrowright");
  await env.pump(10);                       // a hold the frames paid as it went
  env.keyUp("arrowright");
  env.key("arrowright");                    // ...and the same key again before any frame settles it
  await env.pump(1);
  env.keyUp("arrowright");
  await env.pump(4);
  near(turned(from), owes(10 * FRAME_MS + TURN_TAP_MS), "a hold, then a tap on its heels");
}));

test("a turn key held through a lost window owes nothing when it is pressed again", () => withStreet(async (env, { turned, owes }) => {
  env.key("arrowright");
  await env.pump(5);
  env.w.dispatchEvent(new env.w.Event("blur"));   // the keyup goes to whatever took the focus
  await env.pump(4);
  const away = env.state().yaw;
  await env.pump(200);                             // 3.4 s somewhere else
  near(turned(away), 0, "while away");
  env.keyUp("arrowright");                         // a late keyup, if the visitor was still holding
  await env.pump(4);
  near(turned(away), 0, "the late keyup");
  env.key("arrowright"); env.keyUp("arrowright");
  await env.pump(4);
  near(turned(away), owes(TURN_TAP_MS), "the first tap after coming back");
}));

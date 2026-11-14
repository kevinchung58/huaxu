/* verify-feel.mjs — the control scheme, measured in a real browser.
 *
 * The owner's complaint is a felt one ("操作還是有明顯的問題並非流暢"), and round 56 found that two
 * of its causes are numbers, not opinions:
 *
 *   1. The simulation threw away every part of a frame longer than 120 ms. On a software
 *      rasteriser that is most frames, so the body walked at a fraction of its authored speed and
 *      turned at a fraction of its authored rate — the weaker the machine, the slower the walk.
 *   2. The 3D backing store was the display size. Measured on one street: 4 fps at 1024×640, 18 fps
 *      at 320×200, with 8 ms of JavaScript in the frame — a pure fill-rate bill.
 *
 * So this gate asserts what a visitor can feel, on the artefact the server serves:
 *
 *   speed     — four seconds of held W covers the authored 165 cm/s (±20%) when the machine keeps up
 *   lowfps    — the same held W on a frame the machine cannot afford still covers ≥55% of it, i.e.
 *               the walk is not slowed by the renderer (the 120 ms clamp measured ~32% here)
 *   turn      — a held arrow key turns at the lane's own rate (`__walk.turnRate`, ±10%), a tap is
 *               one nudge, and the key's ledger closes: a press on the heels of a release is paid in
 *               full, and a key held while the window was lost owes nothing afterwards
 *   governor  — render scale stays in [0.26, 1], the backing store never exceeds the display size,
 *               a slow viewport sheds resolution and a fast one takes it back
 *   geometry  — the display size never moves: the hit layer and the HUD are placed in display
 *               pixels, so trading resolution must not move a single target
 *
 * Run after `bin/preview` (a server on :8080), with LD_LIBRARY_PATH=/tmp/al2023/lib:
 *   node .verify/verify-feel.mjs                    # one page, the hub street
 *   GATE_PAGE=rooms-fukuoka node .verify/verify-feel.mjs
 */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const PAGE = process.env.GATE_PAGE || "street";
const out = [];
const ok = (name, cond, detail = "") => out.push(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SPEED = 165;   // js/site.js; the turn rate is read from the page (`__walk.turnRate`), because a
                     // copy of it here went stale at 120 while the lane turned at 85 and a ±35% window
                     // still passed it

const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true });

const open = async (width, height) => {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`${BASE}/${PAGE}.html`, { waitUntil: "networkidle0", timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.threeStats, { timeout: 60_000 });
  await sleep(900);
  await page.evaluate(() => document.querySelector("[data-walk-view]").focus());
  return page;
};
// distance covered by a held key over a wall-clock window, read from the committed state
const walkFor = async (page, seconds, key = "w") => {
  const d0 = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
  await page.keyboard.down(key);
  await sleep(seconds * 1000);
  await page.keyboard.up(key);
  const d1 = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
  return (d1 - d0) / seconds;
};
const state = (page) => page.evaluate(() => {
  const w = document.querySelector("[data-walk]").__walk;
  return { scale: w.renderScale, frameMs: w.frameMs, render: w.renderSize, display: w.displaySize,
           yaw: w.yaw, depth: w.depth, hits: document.querySelectorAll(".walk-hit").length };
});

// --- 1. a machine that keeps up walks at the authored speed ------------------------------------
{
  const page = await open(480, 300);
  const before = await state(page);
  await sleep(2500);                       // let the governor find its level at this size
  const measured = await walkFor(page, 4);
  const after = await state(page);
  ok("a cheap frame walks at the authored speed (165 cm/s ±20%)",
     Math.abs(measured - SPEED) <= SPEED * 0.2, `${measured.toFixed(0)} cm/s (frame ${after.frameMs.toFixed(0)} ms)`);
  ok("the display size does not move with the render scale",
     after.display[0] === before.display[0] && after.display[1] === before.display[1],
     `${before.display} → ${after.display}`);
  ok("the backing store never exceeds the display",
     after.render[0] <= after.display[0] && after.render[1] <= after.display[1],
     `${after.render} in ${after.display}`);
  /* Resolution is only owed back when the machine has frame time to spare. On a hardware GPU that
     is every size; on the sandbox's software rasteriser even 480×300 costs ~40 ms a frame, so the
     assertion is conditional on the measurement rather than on the viewport, and it says which
     case it ran in. A gate that demanded scale 1 here would fail the honest path. */
  if (after.frameMs < 30) {
    ok("a machine with frame time to spare keeps full resolution", after.scale >= 0.9,
       `scale ${after.scale.toFixed(2)} at ${after.frameMs.toFixed(0)} ms/frame`);
  } else {
    ok("a machine with frame time to spare keeps full resolution (not applicable here)",
       after.scale >= 0.35, `skipped: ${after.frameMs.toFixed(0)} ms/frame at 480×300, scale ${after.scale.toFixed(2)}`);
  }
  ok("the prop hit layer is still projected", after.hits > 0, `${after.hits} hits`);

  /* Turning is measured against the page's own key clock, not this script's sleeps: `owedSince`
     adds up what the presses the page actually received were worth (each press's length, never less
     than one nudge, at the lane's rate), and `settled` waits for the release to meet a frame -- the
     debt is paid inside a frame, so a yaw read the instant `keyboard.up` returns is a yaw from
     before the payment, and a baseline taken there hands that payment to the next measurement. */
  const TURN_RATE = await page.evaluate(() => document.querySelector("[data-walk]").__walk.turnRate);
  const TAP_MS = 35;   // js/site.js TURN_TAP_MS
  await page.evaluate(() => {
    window.__keys = [];
    for (const type of ["keydown", "keyup"]) window.addEventListener(type, (e) => {
      if (!e.repeat) window.__keys.push([type, performance.now()]);
    }, true);
  });
  const mark = () => page.evaluate(() => window.__keys.length);
  const owedSince = (from) => page.evaluate((from, rate, floor) => {
    let ms = 0, down = null;
    for (const [type, t] of window.__keys.slice(from)) {
      if (type === "keydown") down = t;
      else if (down !== null) { ms += Math.max(t - down, floor); down = null; }
    }
    return ms * rate / 1000;
  }, from, TURN_RATE, TAP_MS);
  const yawNow = () => page.evaluate(() => document.querySelector("[data-walk]").__walk.yaw);
  const settled = async () => {
    let prev = await yawNow();
    for (let i = 0; i < 40; i++) {
      const frame = await page.evaluate(() => document.querySelector("[data-walk]").__walk.frameMs || 0);
      await sleep(Math.max(150, 2 * frame));
      const y = await yawNow();
      if (y === prev) return y;
      prev = y;
    }
    return prev;
  };
  const arc = (a, b) => Math.abs(((b - a + 540) % 360) - 180);

  const y0 = await settled(), k0 = await mark();
  await page.keyboard.down("ArrowRight");
  await sleep(1500);
  await page.keyboard.up("ArrowRight");
  const y1 = await settled();
  const turned = arc(y0, y1) / 1.5;
  ok(`a held turn key turns at the lane's own rate (${TURN_RATE}°/s ±10%)`,
     Math.abs(turned - TURN_RATE) <= TURN_RATE * 0.1, `${turned.toFixed(1)}°/s`);
  ok("…and the hold is paid what the page's own clock says it was worth (±0.2°)",
     Math.abs(arc(y0, y1) - await owedSince(k0)) <= 0.2,
     `turned ${arc(y0, y1).toFixed(2)}°, owed ${(await owedSince(k0)).toFixed(2)}°`);

  /* A tap is never swallowed between two frames. The lane samples the keyboard once a frame, so
     on a machine that draws a frame every third of a second a forty-millisecond tap of the turn
     key begins and ends between two samples -- and the head does not move at all. The visitor
     presses, nothing happens, and the lane reads as broken. The input must not be tied to the
     picture's clock. */
  const yTap0 = await settled();
  await page.keyboard.down("ArrowRight");
  await sleep(40);
  await page.keyboard.up("ArrowRight");
  const yTap1 = await settled();
  const tapped = arc(yTap0, yTap1);
  ok("a tap of the turn key is never swallowed between two frames", tapped >= 3, `${tapped.toFixed(1)}°`);

  /* The key's ledger closes. Both cases were measured before they were fixed (`.verify/_turnprobe.mjs`
     prints them): a tap landing before the last release of the same key had met a frame was short by
     1.4-1.7° of its 3.4, because the new press inherited the old press's payments; and a key held
     while the window lost focus -- its keyup goes to whatever took the focus -- paid the whole time
     away as one press on its next release, 123° for one second away. */
  const yHeel0 = await settled(), kHeel = await mark();
  await page.keyboard.down("ArrowRight"); await sleep(300);
  /* The release and the next press are dispatched inside one task, so no frame can settle the
     release between them. Two separate `keyboard` calls are 1-2 ms apart and a frame sometimes lands
     in that gap -- the unfixed lane then passed this line two runs in four. */
  await page.evaluate(() => {
    const at = document.activeElement || document.documentElement;
    for (const type of ["keyup", "keydown"]) at.dispatchEvent(new KeyboardEvent(type, { key: "ArrowRight", bubbles: true }));
  });
  await sleep(40); await page.keyboard.up("ArrowRight");
  const yHeel1 = await settled();
  ok("a press on the heels of a release is paid in full (±0.2° of what the page's clock says)",
     Math.abs(arc(yHeel0, yHeel1) - await owedSince(kHeel)) <= 0.2,
     `turned ${arc(yHeel0, yHeel1).toFixed(2)}°, owed ${(await owedSince(kHeel)).toFixed(2)}°`);

  await page.keyboard.down("ArrowRight"); await sleep(300);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const yLost0 = await settled();
  await sleep(1000);
  await page.keyboard.up("ArrowRight");          // the late keyup, if the visitor was still holding
  await settled();                               // ...given its own frame: on the heels of a tap the
                                                 // first defect above used to hide this one
  await page.keyboard.down("ArrowRight"); await sleep(40); await page.keyboard.up("ArrowRight");
  const yLost1 = await settled();
  ok("a turn key held through a lost window owes only the tap that follows (≤ 6°)",
     arc(yLost0, yLost1) <= 6, `${arc(yLost0, yLost1).toFixed(1)}° after one second away`);

  const dTap0 = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
  await page.keyboard.down("w");
  await sleep(40);
  await page.keyboard.up("w");
  await sleep(1600);
  const dTap1 = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
  ok("a tap of the walk key is never swallowed between two frames",
     Math.abs(dTap1 - dTap0) >= 3, `${(dTap1 - dTap0).toFixed(1)} cm`);
  await page.close();
}

// --- 2. a machine that cannot afford the frame still walks, and sheds resolution ----------------
{
  const page = await open(1024, 640);
  await sleep(2500);
  const measured = await walkFor(page, 5);
  const after = await state(page);
  ok("a slow frame still walks (≥55% of 165 cm/s: the renderer must not slow the walk)",
     measured >= SPEED * 0.55, `${measured.toFixed(0)} cm/s at ${after.frameMs.toFixed(0)} ms/frame`);
  ok("the governor sheds resolution instead of the visitor's speed",
     after.scale < 0.95 && after.scale >= 0.26, `scale ${after.scale.toFixed(2)} → ${after.render.join("x")}`);
  ok("…and the picture it draws fits on the display it was given",
     after.render[0] <= after.display[0] + 1 && after.render[0] >= after.display[0] * 0.25,
     `${after.render} in ${after.display}`);
  await page.close();
}

// --- 3. a small window is not allowed to go soft ------------------------------------------------
// The governor's floor used to be one constant (0.35), which at 320×200 drew a 112×70 lane and let
// the browser stretch it across the window: measured in round 56, and it is mush. The floor now rides
// the display, so a window narrower than 360 physical pixels keeps its resolution.
{
  const page = await open(320, 200);
  await sleep(2500);
  await walkFor(page, 3);
  const small = await state(page);
  const floor = Math.min(320, 360) / Math.max(1, small.display[0]);
  ok("a small window keeps its resolution instead of upscaling a smear",
     small.render[0] >= Math.floor(small.display[0] * floor) - 1,
     `scale ${small.scale.toFixed(2)} → ${small.render.join("x")} in ${small.display.join("x")}`);
  await page.close();
}

await browser.close();
console.log(out.join("\n"));
const fail = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fail}/${out.length} pass`);
process.exit(fail ? 1 : 0);

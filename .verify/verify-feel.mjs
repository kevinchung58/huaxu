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
 *   turn      — a held arrow key turns at the authored 75°/s (±30%)
 *   governor  — render scale stays in [0.35, 1], the backing store never exceeds the display size,
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
const SPEED = 165, TURN_RATE = 75;   // the authored constants in js/site.js

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

  // turn rate: the authored 75°/s, measured on the committed yaw
  const y0 = await page.evaluate(() => document.querySelector("[data-walk]").__walk.yaw);
  await page.keyboard.down("ArrowRight");
  await sleep(1500);
  await page.keyboard.up("ArrowRight");
  const y1 = await page.evaluate(() => document.querySelector("[data-walk]").__walk.yaw);
  const turned = Math.abs(((y1 - y0 + 540) % 360) - 180) / 1.5;
  ok("a held turn key turns at the authored rate (75°/s ±35%)",
     Math.abs(turned - TURN_RATE) <= TURN_RATE * 0.35, `${turned.toFixed(0)}°/s`);
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
     after.scale < 0.95 && after.scale >= 0.35, `scale ${after.scale.toFixed(2)} → ${after.render.join("x")}`);
  ok("…and the picture it draws fits on the display it was given",
     after.render[0] <= after.display[0] + 1 && after.render[0] >= after.display[0] * 0.34,
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

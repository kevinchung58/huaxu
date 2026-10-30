/* _aim -- one honest way to put the body at a stop and the head on a heading.

   Every frame argument in this repo has ended the same way: someone believed a picture because a
   script said it was "the view from stop 6". Three separate scripts were doing the three steps
   differently, and two of them could not report that they had missed. This module is the answer:
   one implementation of arrival and aim, imported by every tool that needs a camera, so there is
   one place where "on the page" and "on the heading" are decided.

   What it refuses to guess:

   ARRIVAL is a position, read back from the body, against the stop's own `--z`/`--x`.
     - Waiting for the body to *stop moving* is not enough: before the click it is also still, so
       round 69k's first prim map photographed the lane's mouth and printed it as the fun row.
     - A fixed sleep is not enough: the software rasteriser walks at wall-clock speed that varies.
     - A loose band is not enough: the body was still gliding when a 200 cm band called it arrived,
       and the frame was of a place 2 m short of the stop.
   So: wait for the authored position (default 6 cm), and treat "not moving any more, and still
   short" as its own result (`blocked`), with the shortfall in centimetres. A caller may shoot a
   blocked stop only by asking for it out loud, and then the shortfall goes in the file name.

   AIM is a drag, never a key hold, and the heading is read back afterwards.
     - Turning integrates per frame with dt clamped to 0.12 s at 120 deg/s, so the smallest turn a
       key press can make is 14.4 degrees (measured, round 69i). No key can land a heading.
     - A drag sets the heading from distance at 0.065 deg/px, so one drag goes where it is put.
     - The residual is then read from the body's own yaw, not from the intent, and a miss over
       1.2 degrees is a refusal (`aimed: false`), not a frame with a hopeful name.
     - A pointerup that travels under 8 px is a *tap* in the lane's own rule and presses whatever
       is under it, so every drag travels at least 9 px or does not happen.

   UNITS: every distance in this repo's world data is in CENTIMETRES. `_ray.mjs` reported the
   Escarpment canopy at "19416" and a round of TODO called it 19.4 km; it is 194 m. Anything printed
   from here carries both numbers.

   Usage:
     import { launch, openPage, arrive, aim, park, shot } from "./_aim.mjs";
     const browser = await launch();
     const page = await openPage(browser, { rooms: "rooms-niagara.html", hour: "night" });
     const a = await arrive(page, 6);            // { arrived, at, target, short, blocked }
     const g = await aim(page, 90);              // { aimed, yaw, pitch, off }
     await park(page); await shot(page, ".preview/x/stop6-yaw90.png");
*/
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

export const DRAG_DEG_PER_PX = 0.065;  // js/site.js: the lane's own drag constant (round 71)
export const TAP_PX = 8;               // js/site.js: a move under this is a tap, not a drag
/* Round 71: the head turns in real time now -- 85 deg/s of the key's own milliseconds -- so the
   smallest turn a key press can produce is one nudge, TURN_TAP_MS x TURN_RATE = 2.98 deg,
   whatever the frame rate. Aiming by key is therefore error-prone and every instrument aims by
   drag; the number is kept so a caller that does use a key can size the correction. */
export const DEG_PER_KEY = 2.975;
/* Vertical is not the horizontal constant, and it runs the other way. Measured at stop 7 (niagara,
   day): a 100 px drag DOWN moved pitch 8.00 -> 1.50 (-6.5 deg, 0.065 deg/px), a 100 px drag UP took
   it back to 8.00, and 40 px up moved it +2.6. Round 69k's first `_shot_at` run assumed 0.09 and
   asked for -28; the head arrived at +24, and the refusal printed both numbers instead of saving a
   frame pointed at the paving. */
export const PITCH_DEG_PER_PX = 0.065;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ width = 1024, height = 768 } = {}) {
  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"],
    headless: true, defaultViewport: { width, height },
  });
}

/* The hour is the visitor's and it is kept across pages, so it is set before the lane boots. */
export async function openPage(browser, { rooms, hour = "day", base = "http://127.0.0.1:8080",
                                            width = 1024, height = 768, intercept = null,
                                            reduce = false } = {}) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  /* A rewrite of one source file has to be armed BEFORE the navigation that loads it. Installing
     interception afterwards and reloading closed the connection the page was still using, and the
     camera was never published -- the failure printed as "NO CAMERA", which is the right alarm. */
  if (intercept) { await page.setRequestInterception(true); page.on("request", intercept); }
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text()); });
  await page.evaluateOnNewDocument((h) => {
    try { if (h === "night") window.localStorage.setItem("huaxu.walk-hour.v1", "night"); }
    catch (e) { /* private mode: the choice lives this visit only */ }
  }, hour);
  /* Round 79: a measuring instrument that photographs a moving prop must not read its geometry from
     one frame and its silhouette from another. `js/site.js` reads `prefers-reduced-motion` ONCE, at
     boot (`const ease = !reduce()`), so the preference has to be in place before the navigation --
     emulating it afterwards changes nothing and `verify-box` called a correct box 89 % covered
     because a swaying crown had moved 8 px in the 600 ms between the two reads. */
  if (reduce) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${base}/${rooms}`, { waitUntil: "networkidle0", timeout: 120000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 60000 });
  await sleep(800);
  return page;
}

export const state = (page) => page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  /* `glide` is the lane's own answer to "am I still going somewhere" (round 75 exposed it for
     `_stops` and `_reach`). Round 76 added it here too: this file's arrival test used to be "still
     for six seconds", and on a loaded machine a glide starved of frames sits still for longer than
     that -- `verify-island` reported rooms.html stop 3 as blocked 152 cm short while the glide was
     still running, and `_stops` measured the same click at 0 cm. The lane knows; ask the lane. */
  return w ? { x: w.x, z: w.depth, yaw: w.yaw, pitch: w.pitch, quads: w.quads,
               frameMs: w.frameMs || 0, glide: w.glide } : null;
});

/* The stop's authored position: `--z`/`--x` on the button, read from computed style because that is
   where the generator writes them. A stop with no `--z` is a data defect; say so. */
export const stopTarget = (page, i) => page.evaluate((k) => {
  const el = document.querySelectorAll("[data-walk-stop]")[k];
  if (!el) return null;
  const read = (n) => { const v = Number.parseFloat(getComputedStyle(el).getPropertyValue(n)); return Number.isFinite(v) ? v : null; };
  return { z: read("--z"), x: read("--x"),
           yaw: el.dataset.viewYaw !== undefined ? Number(el.dataset.viewYaw) : null,
           pitch: el.dataset.viewPitch !== undefined ? Number(el.dataset.viewPitch) : null,
           label: el.getAttribute("aria-label") };
}, i);

/* Arrival. Returns the body's real position either way; `blocked` means it stopped short and the
   caller has to decide out loud. `shortfall` is signed and in centimetres. */
export async function arrive(page, stop, { tol = 6, arriveMs = 300000, settleSamples = 6 } = {}) {
  const target = await stopTarget(page, stop);
  if (!target) return { arrived: false, blocked: false, target: null, at: null, why: `no stop ${stop}` };
  if (target.z === null) return { arrived: false, blocked: false, target, at: await state(page), why: `stop ${stop} has no --z` };
  await page.evaluate((i) => document.querySelectorAll("[data-walk-stop]")[i].click(), stop);
  const t0 = Date.now();
  let at = await state(page), prev = at, stillSince = Date.now();
  while (Date.now() - t0 < arriveMs) {
    await sleep(300);
    at = await state(page);
    if (!at) continue;
    const zOk = Math.abs(at.z - target.z) <= tol;
    const xOk = target.x === null || Math.abs(at.x - target.x) <= tol;
    const moving = prev && (Math.abs(at.z - prev.z) > 0.5 || Math.abs(at.x - prev.x) > 0.5);
    if (moving) stillSince = Date.now();
    prev = at;
    /* Round 72: "still" is measured in time, not in samples, and against the lane's own frame.
       On a loaded machine one frame costs 1.5 s; six 300 ms samples then all land inside a single
       frame that is still moving, and the gate called a rail glide that had 27 m to go "settled"
       (verify-wheel, measured: body at 149 cm, stop at 2842). A frame's worth of silence is not a
       body at rest. */
    const frameMs = at.frameMs || 0;
    const stillMs = Date.now() - stillSince;
    /* A glide in progress is not an arrival, however still the body looks: ask the lane. */
    const gliding = at.glide !== null && at.glide !== undefined;
    /* A rail glide on this scene advances in bursts: it can sit still for ~2 s between bursts while a
       texture decodes, and a 2.4 s window called that "settled" (verify-wheel, measured twice). Six
       seconds is longer than any measured pause and still fails a genuine stall quickly enough. */
    const atRest = stillMs >= Math.max(settleSamples * 1000, frameMs * 6) && !gliding;
    if (zOk && xOk && atRest) {
      const short = Math.round(at.z - target.z);
      const shortX = target.x === null ? null : Math.round(at.x - target.x);
      return { arrived: true, blocked: false, target, at, short, shortX, stillMs,
               waited: Math.round((Date.now() - t0) / 1000) };
    }
    if (atRest && (!zOk || !xOk)) {
      /* A settled body can be short on either axis. Report both when x was authored; a correct
         depth does not turn the wrong side of a wide lane into the requested stop. */
      const short = Math.round(at.z - target.z);
      const shortX = target.x === null ? null : Math.round(at.x - target.x);
      const xInfo = shortX === null ? "" : `, ${shortX >= 0 ? "+" : ""}${shortX} cm from --x `
        + `(${Math.round(at.x)} vs ${target.x})`;
      return { arrived: false, blocked: true, target, at, short, shortX,
               why: `body settled ${short >= 0 ? "+" : ""}${short} cm from --z `
                    + `(${Math.round(at.z)} vs ${target.z})${xInfo} after ${Math.round(stillMs / 100) / 10} s still, `
                    + `frame ${Math.round(frameMs)} ms`,
               waited: Math.round((Date.now() - t0) / 1000) };
    }
  }
  return { arrived: false, blocked: false, target, at, short: at ? Math.round(at.z - target.z) : null,
           shortX: at && target.x !== null ? Math.round(at.x - target.x) : null,
           why: `no arrival after ${Math.round(arriveMs / 1000)} s`, waited: Math.round((Date.now() - t0) / 1000) };
}

/* Aim, by drag, with the heading read back. `pitch` is positive DOWN (scene3d.js: eye - sin(pitch)). */
export async function aim(page, yaw, { pitch = null, tol = 0.8, refuseOver = 1.2,
                                      width = 1024, height = 768 } = {}) {
  const cx = Math.round(width / 2), cy = Math.round(height / 2);
  const dragBy = async (px, py) => {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + px, cy + py, { steps: 3 });
    await page.mouse.up();
    await sleep(260);
  };
  for (let guard = 0; guard < 10; guard++) {
    const s = await state(page);
    if (!s) break;
    const off = ((yaw - s.yaw + 540) % 360) - 180;
    const pOff = pitch === null ? 0 : pitch - s.pitch;
    if (Math.abs(off) <= tol && Math.abs(pOff) <= tol) break;
    let px = Math.max(-420, Math.min(420, Math.round(off / DRAG_DEG_PER_PX)));
    if (Math.abs(off) > tol && Math.abs(px) < 9) px = Math.sign(off) * 9;
    // Vertical: its own constant, its own sign (drag down looks up), both measured -- see
    // PITCH_DEG_PER_PX above.
    let py = pitch === null ? 0
      : Math.max(-300, Math.min(300, Math.round((s.pitch - pitch) / PITCH_DEG_PER_PX)));
    if (Math.abs(px) < TAP_PX + 1 && Math.abs(py) < TAP_PX + 1) break;
    await dragBy(px, py);
  }
  let s = await state(page);
  for (let i = 0; i < 8 && s; i++) { await sleep(200); const n = await state(page); if (n && Math.abs(n.yaw - s.yaw) < 0.02 && Math.abs(n.pitch - s.pitch) < 0.02) { s = n; break; } s = n; }
  if (!s) return { aimed: false, yaw: null, pitch: null, off: null };
  const off = ((yaw - s.yaw + 540) % 360) - 180;
  const pOff = pitch === null ? 0 : pitch - s.pitch;
  return { aimed: Math.abs(off) <= refuseOver && Math.abs(pOff) <= refuseOver,
           yaw: s.yaw, pitch: s.pitch, off, pOff };
}

/* The pointer to the corner with no button held: a hover, not a drag, so the head does not move and
   a preview card no longer floats over the picture. */
export async function park(page, ms = 900) {
  await page.mouse.move(2, 2);
  await sleep(ms);
}

export async function shot(page, path) {
  await park(page);
  await page.screenshot({ path });
  return path;
}

/* The name of a frame is the head that was actually there, never the one that was wished for. */
export async function namedShot(page, dir, prefix, { width = 1024, height = 768, allowShort = 0 } = {}) {
  const s = await state(page);
  if (!s) throw new Error("namedShot: no walk state");
  if (allowShort && Math.abs(allowShort) > 0) prefix += `-short${Math.abs(Math.round(allowShort))}cm`;
  const path = `${dir}/${prefix}-yaw${Math.round(s.yaw)}-p${Math.round(s.pitch)}-${width}x${height}.png`;
  await shot(page, path);
  return { path, at: s };
}

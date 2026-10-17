/* Real-browser eyes for the walk: boots the site over HTTP in a bundled headless Chromium
   (@sparticuz/chromium ships its binary inside the npm package, so no CDN is needed), stands at
   the mouth of a room, walks it with the same keys the e2e harness uses, and shoots the frames a
   visitor actually sees — images loaded, patterns transformed by a real canvas.

   Run:  ROOMS=rooms-toronto.html node .verify/browser-shot.mjs .preview/real/toronto
   Deps (dev-only, --no-save): puppeteer-core @sparticuz/chromium. If they are absent this script
   says so and exits 0 — it is an instrument, not a gate. */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const ROOMS = process.env.ROOMS || "rooms-toronto.html";
const OUT = process.argv[2] || ".preview/real";
const BASE = process.env.BASE || "http://127.0.0.1:8080";

let puppeteer, chromium;
try {
  puppeteer = require("puppeteer-core");
  chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
} catch (e) {
  console.log("browser-shot: puppeteer-core/@sparticuz/chromium not installed — skipped");
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"],
  headless: true,
  defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text()); });
page.on("requestfailed", (r) => console.log("REQFAIL", r.url(), r.failure()?.errorText));

await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 30000 });
await sleep(1200);   // let the plates arrive and the first frames settle
const imgs = await page.evaluate(() => Array.from(document.images).map((i) => [i.src.split("/").pop(), i.complete, i.naturalWidth]));
console.log("IMAGES", JSON.stringify(imgs));

const diffPct = async (a, b) => {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const ia = await loadImage(a), ib = await loadImage(b);
  const c = createCanvas(ia.width, ia.height), g = c.getContext("2d");
  g.drawImage(ia, 0, 0); const A = g.getImageData(0, 0, ia.width, ia.height).data;
  g.clearRect(0, 0, ia.width, ia.height); g.drawImage(ib, 0, 0);
  const B = g.getImageData(0, 0, ia.width, ia.height).data;
  let n = 0;
  for (let i = 0; i < A.length; i += 4)
    if (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2]) > 8) n++;
  return +(n / (A.length / 4) * 100).toFixed(2);
};
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
await shot("01-mouth");

// look left / right from the mouth
await page.mouse.move(512, 384);
await page.mouse.down(); await page.mouse.move(700, 384, { steps: 8 }); await page.mouse.up();
await sleep(400); await shot("02-mouth-yaw-right");
await page.mouse.down(); await page.mouse.move(300, 384, { steps: 10 }); await page.mouse.up();
await sleep(400); await shot("03-mouth-yaw-left");
await page.mouse.down(); await page.mouse.move(512, 384, { steps: 8 }); await page.mouse.up();
await sleep(300);

// The mouth turn is a gesture test, not part of a station's view. Reload before taking station
// frames so neither that gesture nor the previous station's left/right look can leak yaw into the
// next "ahead" image. Each station is a real chip click from the authored spawn; the separate
// movement gates cover continuous walking between places.
await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer,
  { timeout: 20000 });
await sleep(500);

// The page's own station chips: stand where the room publishes stops, look three ways. A fixed
// delay is not arrival: the software renderer may advance only a few centimetres per second in
// headless Chromium, so wait for the authored depth and lateral position (and any authored view)
// before calling the screenshot a stop frame.
let stops = await page.$$("[data-walk-stop]");
const stopCount = stops.length;
const stopTarget = (button) => button.evaluate((el) => {
  const read = (key) => {
    const value = Number.parseFloat(getComputedStyle(el).getPropertyValue(key));
    return Number.isFinite(value) ? value : null;
  };
  const view = (key) => {
    const value = Number(el.dataset[key]);
    return el.dataset[key] !== undefined && Number.isFinite(value) ? value : null;
  };
  return { z: read("--z"), x: read("--x"), yaw: view("viewYaw"), pitch: view("viewPitch"),
           label: el.getAttribute("aria-label") || "unnamed stop" };
});
const waitForStop = async (target, index, timeoutMs) => {
  if (!Number.isFinite(target.z)) throw new Error(`stop ${index} has no numeric --z target`);
  await page.waitForFunction((want) => {
    const state = document.querySelector("[data-walk]")?.__walk;
    if (!state) return false;
    const near = (actual, value, tolerance) => value === null
      || (Number.isFinite(actual) && Math.abs(actual - value) <= tolerance);
    return near(state.depth, want.z, 2) && near(state.x, want.x, 2)
      && near(state.yaw, want.yaw, 0.5) && near(state.pitch, want.pitch, 0.5);
  }, { timeout: timeoutMs, polling: 100 }, target);
  // Let the final movement tick clear its glide and paint the settled camera transform.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const state = await page.evaluate(() => {
    const s = document.querySelector("[data-walk]")?.__walk || {};
    return { depth: s.depth, x: s.x, yaw: s.yaw, pitch: s.pitch, renderer: s.renderer };
  });
  console.log(`STOP ${index}: ${target.label} → ${JSON.stringify(state)}`);
};
let n = 3;
for (let i = 0; i < stopCount; i++) {
  const target = await stopTarget(stops[i]);
  const before = await page.evaluate(() => {
    const s = document.querySelector("[data-walk]")?.__walk || {};
    return { depth: s.depth, x: s.x, yaw: s.yaw, pitch: s.pitch, renderer: s.renderer };
  });
  // Long authored lanes can take longer in software WebGL than the walker's nominal speed
  // suggests. Budget the real source-to-stop distance (the Journey deck reaches ~168 s here),
  // with a hard four-minute cap so a broken movement gate never becomes an unbounded wait.
  const targetX = Number.isFinite(target.x) ? target.x : before.x;
  const travelCm = Math.hypot(target.z - before.depth, targetX - before.x);
  const timeoutMs = Math.min(240000, Math.max(120000, Math.ceil(30000 + travelCm * 28)));
  console.log(`TARGET ${i}: ${JSON.stringify({ ...target, before, travelCm: Math.round(travelCm), timeoutMs })}`);
  await stops[i].click();
  try {
    await waitForStop(target, i, timeoutMs);
  } catch (error) {
    const state = await page.evaluate(() => {
      const s = document.querySelector("[data-walk]")?.__walk || {};
      return { depth: s.depth, x: s.x, yaw: s.yaw, pitch: s.pitch, renderer: s.renderer };
    });
    console.log(`STOP ${i} TIMEOUT: ${JSON.stringify({ target, state })}`);
    throw error;
  }
  await shot(`${String(n).padStart(2, "0")}-stop-${i}-ahead`); n++;
  await page.mouse.move(512, 384);
  await page.mouse.down(); await page.mouse.move(700, 384, { steps: 6 }); await page.mouse.up();
  await sleep(400); await shot(`${String(n).padStart(2, "0")}-stop-${i}-right`); n++;
  await page.mouse.down(); await page.mouse.move(320, 384, { steps: 8 }); await page.mouse.up();
  await sleep(400); await shot(`${String(n).padStart(2, "0")}-stop-${i}-left`); n++;
  await page.mouse.down(); await page.mouse.move(512, 384, { steps: 6 }); await page.mouse.up();
  await sleep(300);
  if (i + 1 < stopCount) {
    // Make the next ahead frame independent of any pointer drift in the three-view sample above.
    // The target remains a real click-to-glide from this newly booted spawn.
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer,
      { timeout: 20000 });
    await sleep(500);
    stops = await page.$$("[data-walk-stop]");
    if (stops.length !== stopCount) throw new Error("walk-stop count changed after page reload");
  }
}
/* The one layout claim a real browser can make that jsdom cannot, so it is a gate and not a
   photograph: the reel shows one frame at a time, so the frame on screen has to be *on screen*.
   It failed here for a whole release — `[hidden]` was losing to the rail's own `display: grid`,
   six frames stayed in flow at thousands of pixels each, and every story opened on an empty
   field while the harness reported 166/166. Skipped (not passed) on a page with no reel. */
let layoutFail = 0;

/* Turning is the one verb with no keyboard twin that a click cannot fake, and it is the one jsdom
   cannot test: it has no hit-testing, so a pointerdown dispatched at an element always lands on
   that element. In a real browser the centre of a dressed room is usually a thing — an object's
   press box — and for a whole release the turn bailed out on exactly that, so grabbing the middle
   of the screen did nothing: no drag was created and no tap was left to press with either. The
   measurement is deliberately crude (how much of the frame moved) because any real turn moves
   almost all of it; 0.33% is what a swallowed gesture looks like. */
{
  /* A card left open sits in the middle of the screen and is the right thing to grab-proof; the
     turn under test is the space's, so unwind first. Esc closes one layer at a time and only then
     leaves, which is the contract the walk keeps. */
  /* Esc unwinds one level and only then leaves (site.js): with no card and no list open it walks
     you out of the space entirely, and there is no view left to turn. So only press it when there
     is something to unwind -- a card left open is the right thing to grab-proof, but pressing the
     key blind used to navigate the harness off the page mid-test. */
  const had = await page.evaluate(() => {
    const c = document.querySelector("[data-walk-card]");
    const l = document.querySelector(".walk-list");
    return { card: !!(c && !c.hidden), list: !!(l && !l.classList.contains("is-closed")) };
  });
  if (had.card || had.list) { await page.keyboard.press("Escape"); await sleep(500); }
  /* Clicking a walk-stop scrolls it into view -- a real browser does that to any element you
     click, and the stop chips sit below the space -- so by now the middle of the window can be a
     content block rather than the room. The turn under test is the space's, so bring the space
     back and aim at the middle of *it*, not of the window. Without this the street reported
     4-5% on one run and 5.46% on the next, which is the gesture landing on a block title. */
  const pt = await page.evaluate(() => {
    const v = document.querySelector("[data-walk-view]");
    if (!v) return null;
    v.scrollIntoView({ block: "center", inline: "center" });
    const r = v.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  await sleep(500);
  if (!pt) { layoutFail++; console.log("FAIL turn from the centre: no walk view left to turn"); }
  const before = `${OUT}/90-turn-before.png`, after = `${OUT}/90-turn-after.png`;
  const centre = await page.evaluate((p) => {
    const e = document.elementFromPoint(p.x, p.y);
    return e ? (e.dataset && e.dataset.obj) || e.className || e.tagName : "nothing";
  }, pt);
  await page.screenshot({ path: before });
  await page.mouse.move(pt.x, pt.y); await page.mouse.down();
  await page.mouse.move(pt.x + 188, pt.y, { steps: 6 }); await page.mouse.up();
  await sleep(700);
  await page.screenshot({ path: after });
  const d = await diffPct(before, after);
  if (!(d > 5)) { layoutFail++; console.log(`FAIL turn from the centre: only ${d}% moved (grabbed ${centre})`); }
  else console.log(`PASS turn from the centre: ${d}% moved (grabbed ${centre})`);
  await page.mouse.move(512, 384); await page.mouse.down();
  await page.mouse.move(324, 384, { steps: 6 }); await page.mouse.up(); await sleep(500);
}

const playBtn = await page.$("[data-play]");
if (playBtn) {
  await page.evaluate(() => document.querySelector("[data-play]").click());
  await sleep(1500);
  const shown = await page.evaluate(() => {
    const f = document.querySelector("#room-plate .story-frame:not([hidden])");
    if (!f) return null;
    const im = f.querySelector("img");
    const b = im.getBoundingClientRect();
    return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top),
             bottom: Math.round(b.bottom), vh: window.innerHeight, vw: window.innerWidth,
             inFlow: Array.from(document.querySelectorAll("#room-plate .story-frame"))
               .filter((el) => getComputedStyle(el).display !== "none").length,
             loaded: im.complete && im.naturalWidth > 0 };
  });
  await shot("99-story-plate");
  const onScreen = !!shown && shown.w > 40 && shown.h > 40 && shown.loaded
    && shown.top > -4 && shown.bottom <= shown.vh + 4;
  if (!onScreen || (shown && shown.inFlow !== 1)) {
    layoutFail++;
    console.log(`FAIL story reel: ${JSON.stringify(shown)}`);
  } else {
    console.log(`PASS story reel: one frame on screen ${shown.w}x${shown.h} at y=${shown.top}`);
  }
}
await browser.close();
console.log(`browser-shot: frames in ${OUT}`);
if (layoutFail) process.exit(1);

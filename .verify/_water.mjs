/* _water — what the falls actually look like on the served frame, as numbers.
   An instrument, not a gate (exit 0 always; read the table).

   Why it exists: the owner said the falls "感覺不好" and every earlier round argued about it in
   adjectives. This measures the two things the eye is actually reacting to, at the visitor's own
   stops, on frames taken from the served page:

     band contrast  the curtain's own tonal range (mean, sd, p05-p95). A sheet of water reads as
                    water because strands disagree with the water between them; a wall of one value
                    is a wall no matter how correct its colour is.
     mist presence  the same frame rendered twice — once with the spray billboards hidden — so the
                    plume's contribution is a delta, not an impression. White mist over a white
                    sheet over a pale sky can be 100% "present" in the geometry and invisible in
                    the picture, which is exactly what round 68 measured (20.7% of the frame
                    covered, 1.1 luma of change).

   Usage
     LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_water.mjs
     STOP=3 YAW=-90 SCENE=/tmp/scene3d-before.js OUT=.preview/water/before node .verify/_water.mjs
   SCENE serves an alternative js/scene3d.js (a saved copy, or a variant) without touching the repo.
*/
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const STOP = Number(process.env.STOP || 3);
const YAW = Number(process.env.YAW || -90);
const HOUR = process.env.HOUR || "day";
const SCENE = process.env.SCENE || null;
const OUT = process.env.OUT || ".preview/water/now";
const LANG = process.env.LANG_ || "en";
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => { pageErrors.push(String(e)); console.log("PAGEERROR", String(e).slice(0, 200)); });

await page.setRequestInterception(true);
page.on("request", async (req) => {
  const url = req.url();
  if (!/\/js\/scene3d\.js(\?|$)/.test(url)) return req.continue();
  // Publish the scene: the module keeps it private, and "hide the spray and shoot the same frame"
  // is the only way to turn the plume's contribution into a number instead of an opinion.
  try {
    const body = (SCENE ? fs.readFileSync(SCENE, "utf8") : await (await fetch(url)).text())
      .replace("const scene = new THREE.Scene();",
               "const scene = new THREE.Scene(); window.__threeScene = scene;");
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { req.continue(); }
});

await page.evaluateOnNewDocument((hour) => {
  try { window.localStorage.setItem("huaxu.walk-hour.v1", hour); } catch (e) {}
}, HOUR);

await page.goto(`${BASE}/${FILE}`, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 90000 });
await sleep(2500);

// Arrive at the stop's authored depth, not at "it stopped moving": a click that lands before the
// rail is live leaves the body where it spawned, and a frame of the wrong place reads as evidence.
const target = await page.evaluate((i) => {
  const el = document.querySelectorAll("[data-walk-stop]")[i];
  if (!el) return null;
  const z = parseFloat(el.style.getPropertyValue("--z")) || 0;
  el.click();
  return z;
}, STOP);
for (let i = 0; i < 600; i++) {
  const d = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
  if (target !== null && Math.abs(d - target) < 8) break;
  await sleep(300);
}
const arrived = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
if (target !== null && Math.abs(arrived - target) > 12) {
  console.log(`!! did not arrive: at ${arrived.toFixed(0)}, stop is ${target} — the numbers below are that frame`);
}

// aim the head: the rail's own stops author a yaw, the instrument turns to the one asked for
const at = await page.evaluate(async (yaw) => {
  const w = document.querySelector("[data-walk]").__walk;
  const view = document.querySelector("[data-walk]");
  const step = () => { const err = ((yaw - w.yaw + 540) % 360) - 180; return err; };
  for (let i = 0; i < 600 && Math.abs(step()) > 1.5; i++) {
    const key = step() > 0 ? "arrowright" : "arrowleft";
    view.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    await new Promise((r) => setTimeout(r, 16));
    view.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
    await new Promise((r) => setTimeout(r, 24));
  }
  return { x: w.x, depth: w.depth, yaw: w.yaw };
}, YAW);
console.log(`at x=${at.x.toFixed(0)} z=${at.depth.toFixed(0)} yaw=${at.yaw.toFixed(0)} (asked ${YAW})`);
await sleep(1500);

const shot = async (name) => {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  return file;
};

const withSpray = async (visible) => {
  await page.evaluate((v) => {
    const scene = window.__threeScene;
    if (!scene) return;
    scene.traverse((o) => { if (o.name === "surveyed spray billboards") o.visible = v; });
  }, visible);
  await sleep(900);
};

/* Round 69: the plume is animated, and a single frame of it is a sample, not a measurement.
   Two runs of the same build reported 6.9 and 0.6 luma in the same band because the billboards had
   drifted between them. So each state is sampled FRAMES times and every band is reported as its
   median — and the frame-to-frame spread is printed beside it, so a band whose spread is larger than
   the effect says so instead of looking like a result. */
const FRAMES = Number(process.env.FRAMES || 5);
const on = [], off = [];
for (let i = 0; i < FRAMES; i++) {
  on.push(await shot(i === 0 ? "plume-on" : `plume-on-${i}`));
  await sleep(450);
}
await withSpray(false);
for (let i = 0; i < FRAMES; i++) {
  off.push(await shot(i === 0 ? "plume-off" : `plume-off-${i}`));
  await sleep(450);
}
await withSpray(true);

const stats = async (file) => {
  const img = await loadImage(fs.readFileSync(file));
  const W = img.width, H = img.height;
  const c = createCanvas(W, H).getContext("2d");
  c.drawImage(img, 0, 0);
  return { W, H, data: c.getImageData(0, 0, W, H).data };
};
const A = await stats(off[0]), B = await stats(on[0]);
const luma = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
const region = (d, y0, y1) => {
  const vals = [];
  let r = 0, g = 0, b = 0;
  for (let y = y0; y < y1; y += 2) for (let x = 0; x < A.W; x += 2) {
    const i = (A.W * y + x) << 2;
    vals.push(luma(d, i)); r += d[i]; g += d[i + 1]; b += d[i + 2];
  }
  vals.sort((p, q) => p - q);
  const n = vals.length, mean = vals.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  return { mean: +mean.toFixed(1), sd: +sd.toFixed(1), p05: vals[(n * 0.05) | 0] | 0, p95: vals[(n * 0.95) | 0] | 0,
           rgb: `${(r / n) | 0},${(g / n) | 0},${(b / n) | 0}` };
};
const deltaOf = (dA, dB, y0, y1) => {
  let s = 0, n = 0;
  for (let y = y0; y < y1; y += 2) for (let x = 0; x < A.W; x += 2) {
    const i = (A.W * y + x) << 2;
    s += Math.abs(luma(dA, i) - luma(dB, i)); n++;
  }
  return s / n;
};
const median = (xs) => {
  const a = xs.slice().sort((p, q) => p - q);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};
/* Round 69, second correction: averaging, not sampling.
   The two states are captured seconds apart, and the sheet's own shader animates — so a frame-paired
   difference is measuring the water's motion as much as the mist. Five frames of each state are
   averaged into one image first; the plume is then what survives the average, and the band table
   below reads a stabilised picture instead of one that flickers between 0.4 and 22. */
const avg = async (files) => {
  const imgs = [];
  for (const f of files) imgs.push(await stats(f));
  const out = { W: imgs[0].W, H: imgs[0].H, data: new Float32Array(imgs[0].data.length) };
  for (const im of imgs) for (let i = 0; i < im.data.length; i++) out.data[i] += im.data[i] / imgs.length;
  return out;
};
const MEAN_OFF = await avg(off), MEAN_ON = await avg(on);
const FR = [{ on: MEAN_ON, off: MEAN_OFF }];
/* How much the scene moves on its own between two frames of the SAME state: if this is comparable to
   a band's Δ, that band cannot tell the mist from the water's animation and says so. */
const SELF = [];
{
  const d0 = await stats(on[0]);
  for (const f of on.slice(1)) SELF.push(await stats(f));
  var selfNoise = async (y0, y1) => {
    const ds = SELF.map((im) => deltaOf(d0.data, im.data, y0, y1));
    return median(ds);
  };
}
const regionOver = (key, y0, y1) => {
  const rs = FR.map((f) => region(f[key].data, y0, y1));
  return { mean: median(rs.map((r) => r.mean)), sd: median(rs.map((r) => r.sd)),
           p05: median(rs.map((r) => r.p05)), p95: median(rs.map((r) => r.p95)), rgb: rs[0].rgb };
};
const deltaOver = (y0, y1) => {
  const ds = FR.map((f) => deltaOf(f.off.data, f.on.data, y0, y1));
  return { med: median(ds), lo: Math.min(...ds), hi: Math.max(...ds) };
};

// Fixed 40 px bands, so a before/after pair is read on the same ruler whatever moved in the frame.
const BANDS = [];
for (let y = 240; y < 720; y += 40) BANDS.push([y, y + 40, `y ${y}-${y + 40}`]);
console.log("");
console.log("band                     no mist (mean/sd/p05-p95/rgb)      with mist                    mist Δ   (frame-to-frame noise, same state)");
console.log(`(${FRAMES} frames per state, median; Δ is median [min..max] across frames)`);
for (const [y0, y1, label] of BANDS) {
  const a = regionOver("off", y0, y1), b = regionOver("on", y0, y1);
  const d = deltaOver(y0, y1);
  const f = (s) => `${s.mean}/${s.sd}/${s.p05}-${s.p95}/${s.rgb}`;
  const noise = await selfNoise(y0, y1);
  console.log(label.padEnd(24), f(a).padEnd(36), f(b).padEnd(30),
              d.med.toFixed(1).padStart(6), `   scene moves ±${noise.toFixed(1)}`);
}
console.log("\nframes:", path.join(OUT, "plume-on.png"), path.join(OUT, "plume-off.png"));
// A broken shader still renders a background and a HUD, and every band below would be measured
// off that empty frame — which is exactly how two round-69 runs reported "no mist" about a scene
// that had thrown before drawing anything. So: no numbers from a page that errored.
if (pageErrors.length) {
  console.log(`FFAIL  ${pageErrors.length} page error(s) — the numbers below are not the scene; not printing them`);
  await browser.close();
  process.exit(2);
}
await browser.close();
process.exit(0);

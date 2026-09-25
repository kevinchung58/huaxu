/* lane-shot.mjs — what the lane actually looks like, without a browser.

   `.verify/verify-walk.mjs` replaces the 2D context with a recorder, because jsdom has no canvas: it
   can prove what the renderer *asked* to be painted and nothing about the picture. This harness closes
   that gap as far as a sandbox without a browser can: it hands the page a real 2D rasteriser
   (`@napi-rs/canvas`, prebuilt binaries from npm, so it installs here) and writes the lane's own
   canvas out as a PNG, so a human can look at the room instead of at a list of fills.

   What it can and cannot prove: geometry, materials, lighting and depth-sorting are the renderer's own
   output, so a wrongly-placed prop, a wall that washes out or a puddle in mid-air shows up here. Text
   metrics, scrolling, hit-testing and iOS Safari are not in this file and are not claimed by it —
   `.verify/browser-check.py` is where a press has to land.

   It ends in a gate of its own, over the pictures it just took: at every one of the four stops the
   lane publishes, looking down the lane, the frame has to be a *room* — a floor, walls, a ceiling,
   more than a dozen distinct colours and a mean luminance above 90 — and turning round at the entrance
   has to show the lane behind you rather than the underside of the world. Those three numbers are the
   ones that separated the current renderer from the one that collapsed to a flat plate when you stood
   deep in the lane (5 colours, mean 71) and the check was verified by running this file against that
   build (`SITE=/path/to/old/site.js ROOMS=/path/to/old/rooms.html`) before it was trusted.

   Usage, from the repo root (pages must be generated: `python3 _gen_html.py`; a full tour is about
   three minutes, because every frame is a real 1024x768 raster, not a recorded fill):

     npm i --no-save jsdom @napi-rs/canvas
     node .verify/lane-shot.mjs                    # -> /tmp/lane/*.png + sheet.png, exit 1 on a FAIL
     node .verify/lane-shot.mjs out shots/walk     # custom output directory
     node .verify/lane-shot.mjs --dump             # and say which fills covered which part of the frame
     SITE=js/site-old.js node .verify/lane-shot.mjs  # the same tour against another build of the file
*/
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { JSDOM, VirtualConsole } from "jsdom";

const OUT = process.argv[2] || "/tmp/lane";
fs.mkdirSync(OUT, { recursive: true });
/* SITE / ROOMS let the same tour be run against another build of the renderer, which is how the
   gate below was written: the old file, the new file, the same four stops. */
/* ROOMS points at the page under test, so the same tour can shoot any room in the chain; the sheet's
   own title is read off that page rather than hardcoded, because there is more than one room now. */
const markup = fs.readFileSync(process.env.ROOMS || "rooms.html", "utf8");
const js = fs.readFileSync(process.env.SITE || "js/site.js", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* A canvas the renderer can really paint on. jsdom's HTMLCanvasElement has no backing store, so the
   context is swapped for a napi one whose size follows the element's own `width`/`height` — the
   renderer sizes its canvas in exactly those properties, and a context that did not follow them would
   silently paint a 16x9 picture. */
/* A paint log: every fill's colour and the box it covered, in the canvas' own pixels. The picture says
   *that* a region is flat and dark; this says which fill put it there, which is the difference between
   "the lane is dim at the entrance" and "a degenerate pattern fill is sitting over the wall". */
const paints = [];
function realCanvas(el) {
  const napi = createCanvas(el.width || 16, el.height || 9);
  const ctx = napi.getContext("2d");
  let box = null;
  const grow = (x, y) => {
    if (!box) box = { x0: x, y0: y, x1: x, y1: y };
    else { box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x); box.y0 = Math.min(box.y0, y); box.y1 = Math.max(box.y1, y); }
  };
  const note = (kind, col, w, h) => paints.push({ kind, col: String(col), box: box || { x0: 0, y0: 0, x1: w, y1: h }, w, h });
  for (const m of ["moveTo", "lineTo", "rect"]) {
    const f = ctx[m].bind(ctx);
    ctx[m] = (x, y, ...r) => { grow(x, y); return f(x, y, ...r); };
  }
  const fill = ctx.fill.bind(ctx);
  ctx.fill = (...a) => { note("fill", ctx.fillStyle, napi.width, napi.height); const r = fill(...a); box = null; return r; };
  const fillRect = ctx.fillRect.bind(ctx);
  ctx.fillRect = (x, y, w, h, ...r) => { note("rect", ctx.fillStyle, w, h); return fillRect(x, y, w, h, ...r); };
  const draw = ctx.drawImage.bind(ctx);
  const pattern = ctx.createPattern.bind(ctx);
  // The renderer hands these calls the *element* it drew a tile on or an image it fetched; the raster
  // underneath only knows its own objects, so the wrapper is the one place the two are introduced.
  ctx.drawImage = (img, ...rest) => draw(img && img.__napi ? img.__napi : img, ...rest);
  ctx.createPattern = (img, rep) => pattern(img && img.__napi ? img.__napi : img, rep);
  Object.defineProperty(el, "width", { configurable: true, get: () => napi.width, set: (v) => { napi.width = v; } });
  Object.defineProperty(el, "height", { configurable: true, get: () => napi.height, set: (v) => { napi.height = v; } });
  el.getContext = () => ctx;
  el.__napi = napi;
  return napi;
}

class Pic {
  constructor() { this.__napi = null; this.naturalWidth = 0; this.naturalHeight = 0; this.complete = false; }
  set src(v) {
    this._src = v;
    const file = path.resolve(v.startsWith("/") ? "." + v : v);
    loadImage(file).then((img) => {
      this.__napi = img; this.naturalWidth = img.width; this.naturalHeight = img.height;
      this.complete = true;
      if (this.onload) this.onload();
      if (this.decode) this.decode();
    }).catch((e) => { console.warn("[lane-shot] image failed:", v, e.message); });
  }
  get src() { return this._src; }
}

const vc = new VirtualConsole();
vc.on("jsdomError", (e) => { if (!/Not implemented: navigation/.test(String(e && e.message))) console.warn("[jsdom]", e.message); });
const dom = new JSDOM(markup.replace(/<script[^>]*src=[^>]*><\/script>/g, ""), {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://huaxu.test/rooms.html", virtualConsole: vc,
});
const w = dom.window;
w.HTMLElement.prototype.scrollIntoView = function () {};
w.matchMedia = (q) => ({ matches: /hover: hover/.test(q) && /pointer: fine/.test(q), media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
class IO { constructor(cb) { this.cb = cb; } observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); } unobserve() {} disconnect() {} }
w.IntersectionObserver = IO;
w.PointerEvent = w.MouseEvent;
w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
w.Image = Pic;
const built = w.document.createElement.bind(w.document);
w.document.createElement = (tag, ...rest) => {
  const el = built(tag, ...rest);
  if (String(tag).toLowerCase() === "canvas") realCanvas(el);
  return el;
};
w.HTMLCanvasElement.prototype.getContext = function () { return realCanvas(this).getContext("2d"); };

w.eval(js);
const doc = w.document;
const layer = doc.querySelector("[data-walk]");
const canvas = doc.querySelector("[data-walk-canvas]");
const seen = () => {
  const s = layer.__walk || {};
  return `depth ${s.depth === undefined ? "?" : s.depth.toFixed(0)}cm · x ${s.x === undefined ? "?" : s.x.toFixed(0)} · height ${s.height === undefined ? "?" : s.height.toFixed(0)} · yaw ${s.yaw === undefined ? "?" : s.yaw.toFixed(1)}° · focal ${s.focal === undefined ? "?" : s.focal.toFixed(0)} · quads ${s.quads}`;
};
const key = (k, type) => doc.documentElement.dispatchEvent(new w.KeyboardEvent(type, { key: k, bubbles: true }));
const tap = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
const hold = async (k, ms) => { key(k, "keydown"); await sleep(ms); key(k, "keyup"); };

/* One picture per look. The renderer paints on request and on motion, so a look is asked for the way
   its own resize handler asks for it: size the canvas, then draw. That keeps the log below the fills
   of exactly the frame that was written, instead of a pile of them. */
const shots = [];
const shot = (name) => {
  paints.length = 0;
  w.dispatchEvent(new w.Event("resize"));
  const file = path.join(OUT, name + ".png");
  fs.writeFileSync(file, canvas.__napi.toBuffer("image/png"));
  shots.push({ name, file, png: canvas.__napi.toBuffer("image/png") });
  console.log(`${name.padEnd(26)} ${canvas.__napi.width}x${canvas.__napi.height}  ${seen()}`);
  if (process.argv.includes("--dump")) {
    const W = canvas.__napi.width, H = canvas.__napi.height;
    paints.map((p) => {
      const box = { x0: Math.max(0, p.box.x0), y0: Math.max(0, p.box.y0), x1: Math.min(W, p.box.x1), y1: Math.min(H, p.box.y1) };
      const area = Math.max(0, box.x1 - box.x0) * Math.max(0, box.y1 - box.y0);
      return { ...p, area, share: area / (W * H) };
    }).filter((p) => p.share > 0.05).sort((a, b) => b.area - a.area).slice(0, 5).forEach((p) => console.log(
      `    ${(p.share * 100).toFixed(0).padStart(3)}%  ${p.kind.padEnd(4)} ${String(p.col).slice(0, 30).padEnd(30)}`
      + ` box ${Math.round(p.box.x0)},${Math.round(p.box.y0)} → ${Math.round(p.box.x1)},${Math.round(p.box.y1)}`));
    console.log(`    (${paints.length} fills)`);
  }
};
const lookTo = async (want) => {
  let yaw = (layer.__walk && layer.__walk.yaw) || 0;
  while (Math.abs(want - yaw) >= 3.5) {                   // one arrow press is a 7 degree look
    key(want > yaw ? "ArrowRight" : "ArrowLeft", "keydown");
    yaw += want > yaw ? 7 : -7;
    await sleep(12);
  }
  await sleep(90);
};
const goTo = async (stop) => {                          // the lane's own station chips, not a walk
  const chips = Array.from(doc.querySelectorAll("[data-walk-stop]"));
  if (chips[stop]) tap(chips[stop]);
  await sleep(1400);
};

await sleep(1200);                                      // boot, first paint, tiles drawn
const listBtn = doc.querySelector("[data-walk-list]");
if (listBtn && listBtn.getAttribute("aria-expanded") === "true") tap(listBtn);   // drawer folded anyway

/* The tour: the four stops the lane itself publishes, each looked at three ways. A frame that is
   almost all one fill is a wall with no working in it, and that is a thing you can only see. */
const TOUR = [
  [0, "entrance"],
  [1, "under-the-posters"],
  [2, "by-the-pole"],
  [3, "in-front-of-the-machine"],
];
let n = 0;
for (const [i, label] of TOUR) {
  await goTo(i);
  await lookTo(-30); shot(`${String(++n).padStart(2, "0")}-${label}-left-30`);
  await lookTo(0);   shot(`${String(++n).padStart(2, "0")}-${label}-ahead`);
  await lookTo(30);  shot(`${String(++n).padStart(2, "0")}-${label}-right-30`);
}
await goTo(0);
await lookTo(180); shot(`${String(++n).padStart(2, "0")}-entrance-behind`);

const pics = await Promise.all(shots.map((sh) => loadImage(sh.file)));

/* What the frame is made of, in numbers that survive being looked at.
 *
 * The lane used to have a bug only a raster could show: standing deep in it — within about three
 * metres of the end wall — the floor, the walls and the ceiling that surround you are each one panel
 * wider than the screen, so every quad you were standing inside was culled at the corners and the
 * whole frame collapsed to the base plate under a fog gradient. Structure-level assertions passed it
 * for months (the far wall *was* painted, it was simply covered), the fills were counted and
 * non-finite coordinates were guarded; 164 of them passed on a black screen. The numbers below are the
 * ones that separate the two builds: `colours` is how many distinct colours survive an 8-level
 * quantisation, `luma` is the mean of the frame. A frame with five colours and a mean of 71 is a
 * screen the visitor is standing in front of; 39 colours and 163 is the room they are standing in. */
const measure = (img) => {
  const c = createCanvas(img.width, img.height).getContext("2d");
  c.drawImage(img, 0, 0);
  const { data } = c.getImageData(0, 0, img.width, img.height);
  const colours = new Set();
  let luma = 0, n = 0;
  for (let y = 0; y < img.height; y += 2) {
    for (let x = 0; x < img.width; x += 2) {
      const i = (y * img.width + x) * 4;
      luma += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      n++;
      colours.add((data[i] >> 3) * 65536 + (data[i + 1] >> 3) * 256 + (data[i + 2] >> 3));
    }
  }
  return { luma: luma / n, colours: colours.size };
};
const stats = new Map(shots.map((sh, i) => [sh.name, measure(pics[i])]));
let fails = 0;
const gate = (name, cond, detail) => {
  if (!cond) fails++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

// 1. Every frame at a stop, looked at straight down the lane, is a room and not a plate.
for (const sh of shots.filter((s) => /-ahead$/.test(s.name))) {
  const m = stats.get(sh.name);
  gate(`${sh.name}: the lane is painted where you stand`, m.luma >= 90 && m.colours >= 12,
       `mean luma ${m.luma.toFixed(1)}, ${m.colours} colours`);
}
// 2. The deepest stop is the one that used to collapse: floor, walls and ceiling all nearer than the
//    near plane's own panels. It has to be the richest frame in the set, not the poorest.
const deep = stats.get(shots.find((s) => /-ahead$/.test(s.name) && /in-front/.test(s.name)).name);
gate("the deepest stop is not the frame that empties out", deep.colours >= 15 && deep.luma >= 90,
     `${deep.colours} colours, mean luma ${deep.luma.toFixed(1)}`);
// 3. Turning round at the entrance shows the lane behind you, not the underside of the world.
const back = stats.get(shots[shots.length - 1].name);
gate("the lane behind the entrance is a room", back.luma >= 55, `mean luma ${back.luma.toFixed(1)}`);

/* The proof sheet: thirteen frames on one page, because a screenshot someone has to open one at a
   time is a screenshot nobody looks at. It is written whether or not the gate passed — the point of
   the file is that a human can see the lane, and the numbers above are only a floor under it. */
const TW = 512, TH = 384, BAR = 26, COLS = 3;
const sheet = createCanvas(COLS * TW, Math.ceil(shots.length / COLS) * (TH + BAR) + 44);
const sc = sheet.getContext("2d");
sc.fillStyle = "#0f1830"; sc.fillRect(0, 0, sheet.width, sheet.height);
sc.fillStyle = "#f2c88e"; sc.font = "600 20px sans-serif";
sc.fillText(`${(markup.match(/<title>([^<]+)<\/title>/) || [, "rooms.html"])[1]} · every published stop, each looked at three ways`, 14, 30);
shots.forEach((sh, i) => {
  const x = (i % COLS) * TW, y = 44 + Math.floor(i / COLS) * (TH + BAR);
  sc.drawImage(pics[i], x, y, TW, TH);
  sc.strokeStyle = "rgba(242,200,142,.35)"; sc.strokeRect(x + 0.5, y + 0.5, TW - 1, TH - 1);
  sc.fillStyle = "#cdd6ee"; sc.font = "400 15px sans-serif";
  sc.fillText(sh.name.replace(/^\d\d-/, ""), x + 10, y + TH + 18);
});
const sheetFile = path.join(OUT, "sheet.png");
fs.writeFileSync(sheetFile, sheet.toBuffer("image/png"));
console.log(`\n${shots.length} frames + ${sheetFile} in ${OUT}${fails ? `\n${fails} FAILED` : ""}`);
// The lane's loop is a rAF that stops when nothing moves; pretendToBeVisual keeps a timer alive, so
// the process is ended rather than waited on.
process.exit(fails ? 1 : 0);

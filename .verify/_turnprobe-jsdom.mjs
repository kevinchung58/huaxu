/* _turnprobe-jsdom.mjs -- the same turn measurement as _turnprobe.mjs, without a browser.

   `_turnprobe.mjs` is the one to quote: it drives real Chromium events at a real frame cadence.
   This one exists for the case the sandbox library path (`/tmp/al2023/lib`) is missing: jsdom with
   `pretendToBeVisual` serves rAF at ~60 Hz and no WebGL, so it measures the model rather than the
   machine. Round 71 read D held for 600 ms as 46.5 degrees here (77 deg/s, the rate minus the
   frames jsdom did not serve) against 85.2 in the browser probe -- good enough to say "the model
   turns at 85 deg/s and a tap is ~3 degrees", not good enough to say what a visitor's machine does.

   Run from the repo root: `node .verify/_turnprobe-jsdom.mjs`.
*/
import fs from "node:fs";
const { JSDOM, VirtualConsole } = await import("jsdom");
const html = fs.readFileSync("rooms.html", "utf8");
const js = fs.readFileSync("js/site.js", "utf8");
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => console.log("JSDOM ERROR:", String(e && e.message).slice(0, 300)));
vc.forwardTo(console, { omitJSDOMErrors: true });
const dom = new JSDOM(html.replace(/<script[^>]*src=[^>]*><\/script>/g, ""), {
  runScripts: "dangerously", pretendToBeVisual: true, url: "https://huaxu.test/rooms.html", virtualConsole: vc,
});
const w = dom.window;
w.HTMLElement.prototype.scrollIntoView = function () {};
w.HTMLElement.prototype.setPointerCapture = function () {};
w.HTMLElement.prototype.hasPointerCapture = () => false;
w.matchMedia = (q) => ({ matches: /hover: hover/.test(q), media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
class IO { constructor(cb) { this.cb = cb; } observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); } unobserve() {} disconnect() {} }
w.IntersectionObserver = IO;
w.PointerEvent = w.MouseEvent;
w.Element.prototype.animate = () => ({ cancel() {} });
const rec = () => ({ canvas: { width: 1024, height: 768 }, fillStyle: "", strokeStyle: "", save() {}, restore() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {}, ellipse() {}, rect() {}, fillRect() {}, strokeRect() {}, translate() {}, scale() {}, rotate() {}, clip() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, drawImage() {}, setTransform() {}, transform() {}, createPattern: () => ({}), createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }) });
w.HTMLCanvasElement.prototype.getContext = function () { return this.__c || (this.__c = rec()); };
w.Image = class { constructor() { this.naturalWidth = 640; this.naturalHeight = 427; } set src(v) { setTimeout(() => this.onload && this.onload(), 5); } get complete() { return true; } };
w.eval(js);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(1200);
const doc = w.document;
const layer = doc.querySelector("[data-walk]");
const walk = () => layer.__walk;
const key = (k, type = "keydown") => (doc.activeElement || doc.documentElement).dispatchEvent(new w.KeyboardEvent(type, { key: k, bubbles: true }));
const st = (tag) => console.log(tag, "yaw", walk().yaw.toFixed(2), "x", walk().x.toFixed(1), "d", walk().depth.toFixed(1), "glide", !!walk().gliding, "reach", (doc.querySelector("[data-walk-open]")||{}).hidden);
st("start");
key("d"); for (let i = 0; i < 6; i++) { await sleep(100); st("hold d " + (i + 1) * 100); } key("d", "keyup");
await sleep(300); st("after d");
key("w"); for (let i = 0; i < 5; i++) { await sleep(100); st("hold w " + (i + 1) * 100); } key("w", "keyup");
await sleep(300); st("after w");
process.exit(0);

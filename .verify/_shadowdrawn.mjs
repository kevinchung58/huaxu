/* _shadowdrawn.mjs — are the day's shadow quads actually painted?

   `drawRoom()` builds its quads into `quads`, sorts them and paints them with one
   `quads.forEach(emit)`. Anything `add()`ed *after* that pass is pushed into the array and never
   painted, which is invisible in every harness: the fill count goes up by nothing, the picture does
   not change, and the code reads as a shadow system. This probe boots the served page in jsdom with
   the recorder `verify-walk.mjs` uses and reports, per fill colour, whether the shadow quads'
   colours were ever asked for — which is the only claim a sandbox without a browser can make, and
   the one that decides whether the shadows are a feature or a rumour.

     node .verify/_shadowdrawn.mjs [street.html]
*/
import fs from "node:fs";

const file = process.argv[2] || "street.html";
const markup = fs.readFileSync(file, "utf8");
const js = fs.readFileSync(process.env.SITE || "js/site.js", "utf8");

const ctx = { fills: 0, counts: new Map(), bad: 0 };
function recorder() {
  const fin = (a) => { for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) ctx.bad++; };
  const op = () => () => {};
  return {
    canvas: { width: 1024, height: 768 },
    fillStyle: "", strokeStyle: "", lineWidth: 1, globalCompositeOperation: "source-over",
    save: op(), restore: op(), beginPath: op(), closePath: op(), moveTo: op(), lineTo: op(),
    arc: op(), ellipse: op(), rect: op(), strokeRect: op(), translate: op(), scale: op(), rotate: op(),
    fillRect(x, y, w, h) { fin([x, y, w, h]); ctx.fills++; },
    clip: op(),
    fill() {
      ctx.fills++;
      const c = String(this.fillStyle);
      ctx.counts.set(c, (ctx.counts.get(c) || 0) + 1);
    },
    stroke: op(), drawImage: op(), setTransform: op(), transform: op(),
    createPattern: () => ({ p: 1 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
}

const { JSDOM, VirtualConsole } = await import("jsdom");
const vc = new VirtualConsole();
vc.on("jsdomError", () => {});
const dom = new JSDOM(markup.replace(/<script[^>]*src=[^>]*><\/script>/g, ""), {
  runScripts: "dangerously", pretendToBeVisual: true, url: `https://huaxu.test/${file}`,
  virtualConsole: vc,
});
const w = dom.window;
w.HTMLElement.prototype.scrollIntoView = function () {};
w.HTMLElement.prototype.setPointerCapture = function () {};
w.HTMLElement.prototype.hasPointerCapture = () => false;
w.matchMedia = (q) => ({ matches: /hover: hover/.test(q), media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
class IO { constructor(cb) { this.cb = cb; } observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); } unobserve() {} disconnect() {} }
w.IntersectionObserver = IO;
w.PointerEvent = w.MouseEvent;
w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
w.HTMLCanvasElement.prototype.getContext = function () { return this.__c || (this.__c = recorder()); };
w.Image = class {
  constructor() { this.naturalWidth = 640; this.naturalHeight = 427; }
  set src(v) { this._s = v; setTimeout(() => { try { if (this.onload) this.onload(); } catch (e) {} }, 5); }
  get src() { return this._s; }
  get complete() { return !!this._s; }
};
w.eval(js);
await new Promise((r) => setTimeout(r, 1200));

const named = [
  ["wall shadow (umbra/penumbra)", /^rgba\(12,18,34,/],
  ["per-prop floor shadow", /^rgba\(8,12,24,/],
  ["contact shadow", /^rgba\(4,8,18,/],
  ["night darkening (air)", /^rgba\(22,34,60,/],
  ["warm wash (lit)", /^rgba\(255,228,186,/],
];
console.log(`${file}: ${ctx.fills} fills over the frames drawn, ${ctx.counts.size} distinct fill styles`);
for (const [label, re] of named) {
  let n = 0, styles = 0;
  for (const [c, k] of ctx.counts) if (re.test(c)) { n += k; styles++; }
  console.log(`  ${n ? "PAINTED " : "NEVER   "}  ${label}: ${n} fills across ${styles} styles`);
}
process.exit(0);

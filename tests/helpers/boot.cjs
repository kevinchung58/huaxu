/* boot -- one page, in jsdom, with the real lane running, for `node --test`.

   This is the same boot `verify-collision.cjs` and `verify-rooms-e2e.cjs` use, lifted into a helper
   rather than copied a third time. It is deliberately NOT a re-implementation of anything: it strips
   the page's <script> tags, inlines `js/places/*.js` the way a browser would run them, evaluates the
   real `js/site.js`, and pumps `requestAnimationFrame` off a fake clock. Every number a test reads
   comes from the page's own published `__walk` object.

   Why the boot lives here and the gates do not move: `tests/` answers "is this *property* still
   true" (cheap, targeted, one call per case); `.verify/` answers "does this *page* still hold up"
   (browser, pixels, screenshots). The 27 gates are not rewritten — TODO.md §3 P5 is explicit about
   that — and this helper is what lets a new property be added without shipping a 28th gate.

   Usage:
     const { boot } = require("./helpers/boot.cjs");
     const env = await boot("street.html");
     await env.pump(60);
     const W = env.walk();            // the live __walk object: read every getter twice, not once
*/
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const { siteText } = require("../../bin/site-sources.cjs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const SITE = siteText(ROOT);   // every part, in load order (bin/site-sources.json)

function boot(file) {
  return new Promise((resolve, reject) => {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => {
      const m = String((e && e.message) || e);
      if (!/navigation/.test(m)) errors.push(m);
    });
    /* A place's world data is its own file, loaded by a plain <script> in a real browser. jsdom does
       not fetch external scripts, so they are inlined before the strip — skipping this boots a big
       page into a lane with no world, and every assertion below would then be about an empty room. */
    const html = fs.readFileSync(path.join(ROOT, file), "utf8")
      .replace(/<script src="(js\/places\/[a-z0-9-]+\.js)(\?[^"]*)?"><\/script>/g,
        (_m, src) => `<script>${fs.readFileSync(path.join(ROOT, src), "utf8")}</script>`)
      .replace(/<script src="[^"]*"><\/script>/g, "");
    const dom = new JSDOM(html, {
      runScripts: "dangerously", pretendToBeVisual: true,
      url: "https://huaxu.test/" + file, virtualConsole: vc,
    });
    const w = dom.window;
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.HTMLElement.prototype.setPointerCapture = () => {};
    w.HTMLElement.prototype.hasPointerCapture = () => false;
    w.HTMLElement.prototype.releasePointerCapture = () => {};
    w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
    w.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); }
      unobserve() {} disconnect() {}
    };
    w.PointerEvent = w.MouseEvent;
    w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
    w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    const noop = () => {};
    const grad = { addColorStop: noop };
    w.HTMLCanvasElement.prototype.getContext = function () {
      return this.__c || (this.__c = {
        canvas: { width: 1024, height: 768 },
        fillStyle: "", strokeStyle: "", lineWidth: 1, globalCompositeOperation: "source-over",
        save() {}, restore() {}, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
        arc: noop, ellipse: noop, rect: noop, fillRect() {}, strokeRect: noop, translate: noop,
        scale: noop, rotate: noop, clip() {}, fill() {}, stroke() {}, drawImage() {}, setTransform() {},
        transform() {}, createPattern: () => ({}), createRadialGradient: () => grad,
        createLinearGradient: () => grad, measureText: () => ({ width: 0 }), fillText() {}, strokeText() {},
      });
    };
    w.innerWidth = 1024; w.innerHeight = 768; w.devicePixelRatio = 1;
    Object.defineProperty(w.HTMLElement.prototype, "clientWidth", {
      configurable: true, get() { return this.className && String(this.className).includes("walk-view") ? 1024 : 0; } });
    Object.defineProperty(w.HTMLElement.prototype, "clientHeight", {
      configurable: true, get() { return this.className && String(this.className).includes("walk-view") ? 768 : 0; } });
    w.Image = class {
      constructor() { this.naturalWidth = 640; this.naturalHeight = 427; }
      set src(v) { this._s = v; setTimeout(() => { if (this.onload) this.onload(); }, 5); }
      get src() { return this._s; } get complete() { return !!this._s; }
    };
    let now = 1000;
    const queue = [];
    let rafId = 1;
    w.requestAnimationFrame = (cb) => { queue.push({ id: rafId, cb }); return rafId++; };
    w.cancelAnimationFrame = (id) => { const i = queue.findIndex((q) => q.id === id); if (i >= 0) queue.splice(i, 1); };
    Object.defineProperty(w.performance, "now", { configurable: true, value: () => now });
    async function pump(n) {
      for (let i = 0; i < n; i++) {
        now += 17;
        const snapshot = queue.slice();
        queue.length = 0;
        for (const e of snapshot) { try { e.cb(now); } catch (err) { errors.push("tick: " + err.message); } }
      }
    }
    try { w.eval(SITE); } catch (err) { reject(err); return; }
    setTimeout(async () => {
      await pump(40);
      resolve({
        w, doc: w.document, errors, pump,
        /* jsdom keeps its timers (images, the lane's own `setTimeout`s) alive after the test that
           used it, and `node --test` waits for the process to drain — without this the suite runs,
           passes, and then hangs. Close every window a test opens. */
        close: () => { try { w.close(); } catch (e) { /* already closed */ } },
        walk: () => w.document.querySelector("[data-walk]").__walk,
        /* `__walk` is ONE live object: two reads are the same reference. Snapshot the numbers. */
        state: () => { const a = w.document.querySelector("[data-walk]").__walk;
          return { x: a.x, depth: a.depth, yaw: a.yaw, pitch: a.pitch }; },
        key: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })),
        keyUp: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keyup", { key: k, bubbles: true })),
      });
    }, 30);
  });
}

/* The solids a page declares, read the way the solver reads them: the same CSS custom properties
   and the same `data-w`/`data-d`, rotated by `--ry`. A test that measured a different rectangle
   than the body collides with would be measuring a picture of the room, not the room. */
function solids(doc) {
  const px = (el, p) => { const v = el.style.getPropertyValue(p); return v ? parseFloat(v) : 0; };
  return Array.from(doc.querySelectorAll('[data-obj][data-solid="true"]')).map((el) => {
    const m = (p) => parseFloat(el.dataset[p]) || 0;
    const a = ((px(el, "--ry") || parseFloat(el.dataset.ry || 0)) * Math.PI) / 180;
    return { id: el.dataset.obj, x: px(el, "--x"), z: px(el, "--z"), w: m("w"), d: m("d"),
             c: Math.cos(a), s: Math.sin(a) };
  });
}

/* Turn the head to a heading by holding A/D, the way a visitor does — never by writing `yaw`.
   Held, not tapped: the turn rate is ~1.5°/frame and a key has to stay down for the ramp to be
   worth anything, so this presses once, pumps one frame at a time, and lets go as soon as the next
   frame would overshoot. The first version tapped two frames then released, and its 3° steps
   against a 2.8° window stepped over the target and spent the whole budget oscillating — measured
   while writing the P5 tests, and the reason the tests' headings were 30° off. Returns the heading
   it actually reached, which callers should assert on rather than assume. */
async function turnTo(env, target, budget = 600) {
  const errAt = (yaw) => ((target - yaw + 540) % 360) - 180;
  let dir = 0;
  for (let i = 0; i < budget; i++) {
    const yaw = env.state().yaw;
    const err = errAt(yaw);
    if (Math.abs(err) <= 1.5) break;
    const want = err > 0 ? 1 : -1;
    if (want !== dir) {
      if (dir) env.keyUp(dir > 0 ? "arrowright" : "arrowleft");
      env.key(want > 0 ? "arrowright" : "arrowleft");
      dir = want;
    }
    await env.pump(1);
    /* Stop before the frame that would cross the target: the turn is not reversible in mid-air. */
    const after = env.state().yaw;
    if (Math.sign(errAt(after)) !== Math.sign(err) || Math.abs(errAt(after)) > Math.abs(err)) break;
  }
  if (dir) { env.keyUp(dir > 0 ? "arrowright" : "arrowleft"); await env.pump(3); }
  return env.state().yaw;
}

module.exports = { boot, solids, turnTo, ROOT };

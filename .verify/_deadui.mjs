/* _deadui -- every control on a walkable page, and whether pressing it does anything.
   Round 75. A control that answers nothing is the same defect as a prop that answers nothing, and it
   is invisible to a gate that only asserts the controls exist. jsdom, deterministic clock.

   What it cannot see, and says so rather than pretending: an anchor that navigates (jsdom logs the
   navigation and stops), a control inside a closed panel whose job is to close it (correctly a no-op),
   and a control whose effect is a sound or a timer beyond 30 pumped frames. Every remaining "DEAD" line
   on this build is one of those three, checked by hand:
     - `a.walk-icon[Leave the lane]`, the source anchors, `story-enter`  -> navigation
     - `walk-drawer-close` / `modal-close`                              -> closing an already-closed panel
     - `walk-tutor-act[done]`                                           -> dismisses a guide already dismissed

   Run: node .verify/_deadui.mjs */
import fs from "node:fs";
const { JSDOM, VirtualConsole } = await import("jsdom");
const PAGES = ["street.html", "rooms.html", "rooms-fukuoka.html", "rooms-toronto.html",
  "rooms-niagara.html", "rooms-goat.html", "rooms-journey.html", "rooms-cntower.html"];
const js = fs.readFileSync("js/site.js", "utf8");
const games = fs.readFileSync("js/games.js", "utf8");

function boot(file) {
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => { if (!/navigation/.test(String(e && e.message))) console.log("ERR", e.message); });
  const html = fs.readFileSync(file, "utf8")
    .replace(/<script[^>]*src="(js\/places\/[a-z0-9-]+\.js)(\?[^"]*)?"[^>]*><\/script>/g,
      (_m, src) => `<script>${fs.readFileSync(src, "utf8")}</script>`)
    .replace(/<script[^>]*src=[^>]*><\/script>/g, "");
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true,
    url: `https://huaxu.test/${file}`, virtualConsole: vc });
  const w = dom.window;
  for (const k of ["scrollIntoView", "setPointerCapture", "releasePointerCapture"]) w.HTMLElement.prototype[k] = () => {};
  w.HTMLElement.prototype.hasPointerCapture = () => false;
  w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
  w.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); } unobserve() {} disconnect() {} };
  w.PointerEvent = w.MouseEvent;
  w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  const noop = () => {};
  const grad = { addColorStop: noop };
  w.HTMLCanvasElement.prototype.getContext = function () {
    return this.__c || (this.__c = { canvas: { width: 1024, height: 768 }, fillStyle: "", strokeStyle: "", lineWidth: 1,
      globalCompositeOperation: "source-over", save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop,
      lineTo: noop, arc: noop, ellipse: noop, rect: noop, fillRect: noop, strokeRect: noop, translate: noop, scale: noop,
      rotate: noop, clip: noop, fill: noop, stroke: noop, drawImage: noop, setTransform: noop, transform: noop,
      createPattern: () => ({}), createRadialGradient: () => grad, createLinearGradient: () => grad,
      measureText: () => ({ width: 0 }), fillText: noop, strokeText: noop });
  };
  let now = 1000; const q = []; let id = 1;
  w.requestAnimationFrame = (cb) => { q.push({ id, cb }); return id++; };
  w.cancelAnimationFrame = (i) => { const k = q.findIndex((a) => a.id === i); if (k >= 0) q.splice(k, 1); };
  Object.defineProperty(w, "performance", { configurable: true, value: { now: () => now } });
  const pump = (n) => { for (let i = 0; i < n; i++) { now += 17; const s = q.slice(); q.length = 0; for (const e of s) { try { e.cb(now); } catch (err) {} } } };
  try { w.eval(games); w.eval(js); } catch (e) { console.log("boot", file, e.message); }
  pump(40);
  return { w, pump };
}

const SEL = [
  ".walk-hud button", ".walk-hud a", "[data-walk-stop]", "[data-walk-open]", "[data-walk-list]",
  "[data-walk-list-close]", "[data-walk-card-close]", "[data-walk-fov]", "[data-walk-jump]",
  "[data-walk-to]", "[data-walk-tutor-skip]", "[data-walk-tutor-done]", "[data-walk-tutor-replay]",
  "[data-walk-hour]", "[data-walk-listpanel] a, [data-walk-listpanel] button", "[data-walk-card] button",
];
for (const file of PAGES) {
  const { w, pump } = boot(file);
  const doc = w.document;
  const seen = new Set();
  const dead = [];
  for (const sel of SEL) {
    for (const el of doc.querySelectorAll(sel)) {
      if (seen.has(el)) continue;
      seen.add(el);
      const key = `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`
        + (el.dataset.obj ? `#${el.dataset.obj}` : "") + (el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : "");
      /* The signature has to name everything a control can plausibly change, or every control that
         changes something else reads as dead. Round 75's first run reported 11 "dead" controls on the
         CN Tower; ten of them were the probe's own blind spots (the zoom changes `focal`, the jump
         changes `height`, the guide changes `tutorEl.hidden`, a drawer's close does nothing when the
         drawer is already shut). */
      const W = () => doc.querySelector("[data-walk]").__walk;
      const sig = () => [
        W().x.toFixed(1), W().depth.toFixed(1), W().yaw.toFixed(2), W().pitch.toFixed(2),
        W().height.toFixed(1), W().focal.toFixed(2), W().glide ? "g" : "-",
        String(doc.querySelector(".walk-list").className),
        doc.querySelector("[data-walk-card]").hidden,
        doc.querySelector("[data-walk-card]").dataset.mode || "",
        doc.querySelector("#room-plate").className,
        String(doc.querySelector("[data-walk-tutor]").hidden),
        doc.querySelector("[data-walk-tutor-text]").textContent.slice(0, 20),
        doc.body.innerHTML.length,
      ].join("|");
      const before = sig();
      try { el.click(); } catch (e) { dead.push(`${key} threw ${e.message}`); continue; }
      pump(30);
      const after = sig();
      if (before === after) dead.push(key);
      /* fold whatever opened, so the next control is measured from the same state */
      doc.querySelector("[data-walk-card-close]")?.click();
      doc.querySelector("[data-walk-list-close]")?.click();
      doc.querySelector("#room-plate.is-open [data-room-close]")?.click();
      pump(10);
    }
  }
  console.log(`${file}: ${seen.size} controls, ${dead.length} did nothing`);
  for (const d of dead) console.log(`   DEAD ${d}`);
  w.close();
}

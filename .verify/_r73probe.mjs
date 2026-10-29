/* _r73probe.mjs — the two numbers round 73 has to know: how close a print hangs to the lane's
   middle, and what a CN Tower lift press actually changes in the scene.

   Run: node .verify/_r73probe.mjs
*/
import fs from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";

function boot(file) {
  const html = fs.readFileSync(file, "utf8")
    .replace(/<script[^>]*src="(js\/places\/[a-z0-9-]+\.js)(\?[^"]*)?"[^>]*><\/script>/g,
             (_m, src) => `<script>${fs.readFileSync(src, "utf8")}</script>`)
    .replace(/<script[^>]*src=[^>]*><\/script>/g, "");
  const vc = new VirtualConsole();
  vc.on("jsdomError", () => {});
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true,
    url: `https://huaxu.test/${file}`, virtualConsole: vc });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLElement.prototype.setPointerCapture = () => {};
  w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
  w.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); } unobserve() {} disconnect() {} };
  w.PointerEvent = w.MouseEvent;
  w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  const grad = { addColorStop() {} };
  w.HTMLCanvasElement.prototype.getContext = function () {
    return this.__c || (this.__c = new Proxy({ canvas: { width: 1024, height: 768 } }, {
      get(t, k) { if (k in t) return t[k];
        if (/Gradient|Pattern/.test(k)) return () => grad; return () => {}; },
      set(t, k, v) { t[k] = v; return true; } }));
  };
  w.Image = class { constructor(){ this.naturalWidth = 640; this.naturalHeight = 427; }
    set src(v){ this._s = v; setTimeout(() => { if (this.onload) this.onload(); }, 5); } get src(){ return this._s; } get complete(){ return !!this._s; } };
  w.innerWidth = 1024; w.innerHeight = 768; w.devicePixelRatio = 1;
  for (const k of ["clientWidth", "clientHeight"]) {
    Object.defineProperty(w.HTMLElement.prototype, k, { configurable: true, get() {
      return this.className && String(this.className).includes("walk-view") ? (k === "clientWidth" ? 1024 : 768) : 0;
    }});
  }
  let now = 1000;
  const queue = []; let rafId = 1;
  w.requestAnimationFrame = (cb) => { queue.push({ id: rafId, cb }); return rafId++; };
  w.cancelAnimationFrame = (id) => { const i = queue.findIndex((q) => q.id === id); if (i >= 0) queue.splice(i, 1); };
  Object.defineProperty(w, "performance", { configurable: true, value: { now: () => now } });
  const pump = async (n) => {
    for (let i = 0; i < n; i++) {
      now += 17;
      const snap = queue.slice(); queue.length = 0;
      for (const e of snap) { try { e.cb(now); } catch (err) {} }
    }
  };
  w.eval(fs.readFileSync("js/site.js", "utf8"));
  return { w, doc: w.document, pump };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- Tokyo: where are the prints, and what is in reach at the test's own spot? ---- */
{
  const { w, doc, pump } = boot("rooms.html");
  await sleep(300); await pump(40);
  const frames = [...doc.querySelectorAll(".walk-hit")].filter((el) => el.dataset.frame !== undefined);
  console.log("tokyo prints:", frames.map((el) => `${el.dataset.obj} x=${el.style.getPropertyValue("--x")} z=${el.style.getPropertyValue("--z")}`).join(" | "));
  const walk = doc.querySelector("[data-walk]").__walk;
  console.log("tokyo body at boot:", Math.round(walk.x), Math.round(walk.depth));
  w.close();
}

/* ---- CN Tower: what does a press change? ---- */
{
  const { w, doc, pump } = boot("rooms-cntower.html");
  await sleep(300); await pump(40);
  const walk = () => doc.querySelector("[data-walk]").__walk;
  const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
  for (const id of ["lift-cn", "glassfloor-cn", "lift-skypod"]) {
    const el = doc.querySelector(`[data-obj="${id}"]`);
    const before = { q: walk().quads, st: el.dataset.state, aria: el.getAttribute("aria-label") };
    click(el);
    await pump(20); await sleep(80);
    const after = { q: walk().quads, st: el.dataset.state, aria: el.getAttribute("aria-label") };
    console.log(`cntower ${id}: quads ${before.q} -> ${after.q}; state ${before.st}->${after.st}`);
    console.log("   record:", doc.querySelector("[data-walk-record]").textContent.slice(0, 90));
    click(el); await pump(10); await sleep(40);
  }
  w.close();
}

/* ---- what does opening and closing a print's reel do to the hit boxes? ---- */
{
  const { w, doc, pump } = boot("rooms.html");
  await sleep(300); await pump(60);
  const walk = () => doc.querySelector("[data-walk]").__walk;
  const vis = () => [...doc.querySelectorAll(".walk-hit")].filter((e) => e.style.visibility === "visible").length;
  const key = (k, t = "keydown") => (doc.activeElement || doc.body)
    .dispatchEvent(new w.KeyboardEvent(t, { key: k, bubbles: true }));
  const turn = async (deg) => {
    const d = ((deg - walk().yaw + 540) % 360) - 180;
    if (Math.abs(d) < 1.2) return;
    key(d < 0 ? "a" : "d");
    await sleep(Math.abs(d) / 85 * 1000);
    key(d < 0 ? "a" : "d", "keyup");
    await sleep(80);
  };
  const print = doc.querySelector('[data-obj="frame-scramble"]');
  const tx = parseFloat(print.style.getPropertyValue("--x")), tz = parseFloat(print.style.getPropertyValue("--z"));
  console.log("boot:", Math.round(walk().x), Math.round(walk().depth), "visible", vis(), "quads", walk().quads);
  for (let i = 0; i < 10; i++) {
    if ((doc.querySelector(".walk-hit.is-reach") || {}).dataset) break;
    await turn(Math.atan2(tx - walk().x, tz - walk().depth) * 180 / Math.PI);
    key("w"); await sleep(420); key("w", "keyup"); await sleep(90);
  }
  console.log("at print:", Math.round(walk().x), Math.round(walk().depth), "yaw", walk().yaw.toFixed(1),
              "visible", vis(), "reach", (doc.querySelector(".walk-hit.is-reach") || {}).dataset?.obj);
  key("e"); await sleep(150);
  console.log("reel open:", doc.querySelector("#room-plate").className, "visible", vis(), "quads", walk().quads,
              "body", Math.round(walk().x), Math.round(walk().depth));
  doc.querySelector("#room-plate").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await sleep(400);
  console.log("reel closed:", doc.querySelector("#room-plate").className, "visible", vis(), "quads", walk().quads,
              "body", Math.round(walk().x), Math.round(walk().depth), "yaw", walk().yaw.toFixed(1),
              "reach", (doc.querySelector(".walk-hit.is-reach") || {}).dataset?.obj);
  w.close();
}

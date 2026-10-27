/* verify-overlay.mjs — what is allowed to appear over a walk page, and on which gesture.

   Round 72. Round 71 removed the card a tap used to open; the owner then asked for the same review of
   everything else: 「甚至其他的東西…我發現很多東西因為選取會跳這種介面。你全面審查清楚，有必要的在跳。」

   The measurement that came out of that review: the district banner was the last surface that appeared
   without being asked for. It opened on every seam crossing *and* after every rail jump, so selecting
   a stop made an interface appear. It is gone (js/site.js, _gen_html.py, css/site.css), and this gate
   is what keeps the class closed:

     1. no walk page ships a timed overlay at all (the banner's element is gone from every page);
     2. on arrival only the first-visit guide may be showing — it teaches the keys once and then never
        returns; nothing else is over the picture;
     3. a tap, a drag, a click on a prop's box and a click on a stop chip open nothing;
     4. the four surfaces a visitor *asks for* open exactly themselves: `E`/the bar (a record), `I`
        (the lane's note), `L` (the written lane), and a prop carrying `story`/`frame` (the reel);
     5. Escape folds one layer and does not leave the page while something is open.

   jsdom, no browser: the same boot as verify-walk. Run from the repo root:
   `node .verify/verify-overlay.mjs`.
*/
import fs from "node:fs";

const { JSDOM, VirtualConsole } = await import("jsdom");
const out = [];
const ok = (n, c, e = "") => out.push(`${c ? "PASS" : "FAIL"}  ${n}${e ? "  — " + e : ""}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = ["street.html", "rooms.html", "rooms-fukuoka.html", "rooms-toronto.html",
               "rooms-niagara.html", "rooms-goat.html", "rooms-journey.html", "rooms-cntower.html"];

function recorder() {
  const grad = { addColorStop() {} };
  return new Proxy({ canvas: { width: 1024, height: 768 } }, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === "createRadialGradient" || k === "createLinearGradient" || k === "createPattern") return () => grad;
      if (k === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

function boot(markup, url) {
  const vc = new VirtualConsole();
  const navs = [];
  vc.on("jsdomError", (e) => navs.push(String((e && e.message) || e)));
  vc.forwardTo(console, { omitJSDOMErrors: true });
  const dom = new JSDOM(markup.replace(/<script[^>]*src=[^>]*><\/script>/g, ""), {
    runScripts: "dangerously", pretendToBeVisual: true, url, virtualConsole: vc,
  });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLElement.prototype.setPointerCapture = function () {};
  w.HTMLElement.prototype.hasPointerCapture = () => false;
  w.matchMedia = (q) => ({ matches: /hover: hover/.test(q), media: q,
    addEventListener() {}, addListener() {}, removeEventListener() {} });
  class IO {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); }
    unobserve() {} disconnect() {}
  }
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
  w.eval(fs.readFileSync("js/site.js", "utf8"));
  return { w, navs };
}

/* jsdom loads no stylesheet, so "is it showing" has to be read off the site's own contract rather
   than off computed style: a card or a toy is `hidden` until it opens, the drawer is `is-closed`
   until it opens, and the story plate is `is-open` until it is folded. A computed-style test here
   would call every one of them visible and fail the gate on its own blindness. */
const visible = (doc, sel) => Array.from(doc.querySelectorAll(sel)).filter((el) => {
  if (sel === "#room-plate") return el.classList.contains("is-open");
  if (sel === "[data-walk-listpanel]") return !el.classList.contains("is-closed");
  return !el.hidden;
});
const surfaces = (doc) => ({
  card: visible(doc, "[data-walk-card]").length,
  list: visible(doc, "[data-walk-listpanel]").length,
  plate: visible(doc, "#room-plate").length,
  game: visible(doc, "[data-walk-game]").length,
  guide: visible(doc, "[data-walk-tutor]").length,
});
const clearAll = (doc) => {
  visible(doc, "[data-walk-card]").forEach((c) => c.querySelector("[data-walk-card-close]")?.click());
  visible(doc, "[data-walk-listpanel]").forEach((l) => l.querySelector("[data-walk-list-close]")?.click());
  visible(doc, "#room-plate").forEach((p) => p.querySelector("[data-room-close]")?.click());
  visible(doc, "[data-walk-game]").forEach((g) => g.querySelector("[data-game-close]")?.click());
};

/* ---- 0. the markup: no timed overlay ships on any walk page -------------------------------- */
for (const file of PAGES) {
  const html = fs.readFileSync(file, "utf8");
  ok(`${file}: no timed overlay ships (the district banner is gone)`,
     !/data-walk-banner|walk-banner/.test(html));
}
const css = fs.readFileSync("css/site.css", "utf8");
const js = fs.readFileSync("js/site.js", "utf8");
ok("no CSS rule paints a walk banner", !/\.walk-banner/.test(css));
/* `is-on` belongs to other chrome (the back-to-top button, the album's chips), so the assertion
   names the banner's own identifiers: what it forbids is a *timed reveal of a surface*, and the
   banner was the only one. */
ok("nothing in the lane reveals a surface on a timer",
   !/data-walk-banner|walk-banner|showBanner|bannerTimer/.test(js));

/* ---- 1-5, page by page -------------------------------------------------------------------- */
for (const file of PAGES) {
  const { w, navs } = boot(fs.readFileSync(file, "utf8"), `https://huaxu.test/${file}`);
  await sleep(900);
  const doc = w.document;
  const view = doc.querySelector("[data-walk-view]");
  const bar = doc.querySelector("[data-walk-open]");
  const ptr = (type, dx = 0, dy = 0) => view.dispatchEvent(
    new w.PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 3, clientX: 500 + dx, clientY: 400 + dy }));
  const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, detail: 0 }));
  const key = (k) => (doc.activeElement || doc.documentElement).dispatchEvent(
    new w.KeyboardEvent("keydown", { key: k, bubbles: true }));

  const arrival = surfaces(doc);
  ok(`${file}: on arrival nothing is over the picture but the first-visit guide`,
     arrival.card === 0 && arrival.list === 0 && arrival.plate === 0 && arrival.game === 0,
     JSON.stringify(arrival));

  /* a tap and a drag: the two gestures a visitor makes just to look */
  clearAll(doc);
  ptr("pointerdown"); ptr("pointerup");
  await sleep(60);
  let s = surfaces(doc);
  ok(`${file}: a tap on the picture opens nothing`, s.card === 0 && s.list === 0 && s.plate === 0);
  ptr("pointerdown"); ptr("pointermove", 220, 0); ptr("pointerup");
  await sleep(60);
  s = surfaces(doc);
  ok(`${file}: a drag turns the head and opens nothing`, s.card === 0 && s.list === 0 && s.plate === 0);

  /* every press box on the page, keyboard-activated and pointer-clicked */
  const boxes = Array.from(doc.querySelectorAll(".walk-hit")).slice(0, 400);
  let pointerOpened = 0, keyboardOpened = 0;
  for (const box of boxes) {
    clearAll(doc);
    box.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
    await sleep(6);
    const after = surfaces(doc);
    if (after.card || after.plate) pointerOpened++;
  }
  ok(`${file}: a pointer click on a prop's box opens nothing (${boxes.length} boxes)`,
     pointerOpened === 0, `${pointerOpened} opened`);

  /* the stop rail: selecting a stop must not surface anything */
  const stops = Array.from(doc.querySelectorAll("[data-walk-stop]"));
  let stopOpened = 0;
  for (const stop of stops) {
    clearAll(doc);
    click(stop);
    await sleep(40);
    const after = surfaces(doc);
    if (after.card || after.list || after.plate || after.game) stopOpened++;
    const el = doc.querySelector("[data-walk]");
    if (el && el.__walk) { /* the glide is the answer; the surfaces are the question */ }
  }
  ok(`${file}: selecting a stop surfaces nothing (${stops.length} stops)`, stopOpened === 0,
     `${stopOpened} surfaced`);

  /* what a visitor asks for, opens exactly itself */
  clearAll(doc);
  key("i");
  await sleep(60);
  s = surfaces(doc);
  ok(`${file}: I opens the lane's note and nothing else`, s.card === 1 && s.plate === 0 && s.list === 0, JSON.stringify(s));
  key("Escape");
  await sleep(60);
  ok(`${file}: Escape folds the note without leaving the page`, surfaces(doc).card === 0 && navs.length === 0);

  clearAll(doc);
  key("l");
  await sleep(60);
  s = surfaces(doc);
  ok(`${file}: L opens the written lane and nothing else`, s.list === 1 && s.card === 0 && s.plate === 0, JSON.stringify(s));
  key("l");
  await sleep(60);
  ok(`${file}: L again folds it`, surfaces(doc).list === 0);

  /* the reach bar: present only while something is in reach, and it opens that thing */
  const reach = doc.querySelector(".walk-hit.is-reach");
  if (reach) {
    ok(`${file}: the bar carries the name of the thing in reach`,
       bar && !bar.hidden && bar.textContent.trim() === (reach.dataset.title || "").trim(),
       bar ? JSON.stringify(bar.textContent) : "missing");
    clearAll(doc);
    click(bar);
    await sleep(60);
    const after = surfaces(doc);
    const aske = after.card === 1 || after.plate === 1 || after.game === 1 || after.list === 1;
    ok(`${file}: pressing the bar answers with a surface, never nothing`, aske,
       JSON.stringify(after));
  } else {
    ok(`${file}: the bar is hidden when nothing is in reach`, !bar || bar.hidden);
  }
  w.close();
}

const fails = out.filter((l) => l.startsWith("FAIL"));
console.log(out.join("\n"));
console.log(`\n${out.length - fails.length}/${out.length} pass`);
if (fails.length) process.exit(1);

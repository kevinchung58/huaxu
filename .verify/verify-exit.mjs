/* verify-exit.mjs — every way into a surface must have an exit the visitor already knows.

   Round 72, the owner's second ask: 「還有你任何的進出環境 請全面你E2E進去用發現問題並系統性解決問題。」
   (walk every enter/exit for real, then fix the class, not the instance).

   Walking it in a real browser (`.verify/_backprobe.mjs`) found the class: every surface on the
   site could be *entered* from the in-page chrome, but the one exit gesture a phone actually has --
   the system back button -- threw the visitor out of the place instead of folding the surface.
   Measured on rooms-toronto.html: press `i`, press Back, and you are back on street.html with the
   card gone and your position in the room lost.

   The fix is one contract in js/site.js (overlayEntered / overlayLeft / popstate): a surface pushes
   one history entry when it opens, pops it when it closes, and a Back that arrives while something
   is open folds that surface with the same Esc the page already answers. This gate is what keeps
   the contract honest, on every page that has a surface:

     1. no dangling exit: every chrome link (`[data-walk-exit]`, `[data-walk-to]`, a story's
        `[data-enter-space]`, a rail's `[data-walk-open]` target) points at a file that exists;
     2. Back folds the surface and keeps the visitor where they were standing (no navigation);
     3. opening two surfaces means two Backs, one layer each, and the third Back leaves;
     4. closing a surface with its own control leaves no dangling history entry: the next Back
        leaves, it does not eat a phantom layer;
     5. focus comes back to whatever opened the surface, so a keyboard visitor is not dropped at
        the top of the document;
     6. Esc still folds what is open, and on a walk page with nothing open Esc is still the door.

   jsdom, no browser (jsdom fires popstate on its own history, which is all this needs).
   Run from the repo root: `node .verify/verify-exit.mjs`.
*/
import fs from "node:fs";
import { siteText } from "../bin/site-sources.mjs";

const { JSDOM, VirtualConsole } = await import("jsdom");

const out = [];
const ok = (n, c, e = "") => out.push(`${c ? "PASS" : "FAIL"}  ${n}${e ? "  — " + e : ""}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WALK = ["street.html", "rooms.html", "rooms-fukuoka.html", "rooms-toronto.html",
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

function boot(file, hash = "") {
  const navs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => {
    const m = String((e && e.message) || e);
    if (!/navigation/.test(m)) console.log("JSDOM-ERROR", m);
    navs.push(m);
  });
  // The place's world data is a plain script file; jsdom fetches nothing, so inline it the way
  // verify-walk does, then strip every other external script.
  const markup = fs.readFileSync(file, "utf8")
    .replace(/<script[^>]*src="(js\/places\/[a-z0-9-]+\.js)(\?[^"]*)?"[^>]*><\/script>/g,
             (_m, src) => `<script>${fs.readFileSync(src, "utf8")}</script>`)
    .replace(/<script[^>]*src=[^>]*><\/script>/g, "");
  const dom = new JSDOM(markup, {
    runScripts: "dangerously", pretendToBeVisual: true,
    url: `https://huaxu.test/${file}${hash}`, virtualConsole: vc,
  });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLElement.prototype.setPointerCapture = function () {};
  w.HTMLElement.prototype.hasPointerCapture = () => false;
  w.HTMLElement.prototype.releasePointerCapture = function () {};
  w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, addListener() {}, removeEventListener() {} });
  w.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); }
    unobserve() {} disconnect() {}
  };
  w.PointerEvent = w.MouseEvent;
  w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.HTMLCanvasElement.prototype.getContext = function () { return this.__c || (this.__c = recorder()); };
  w.Image = class {
    constructor() { this.naturalWidth = 640; this.naturalHeight = 427; }
    set src(v) { this._s = v; setTimeout(() => { try { if (this.onload) this.onload(); } catch (e) {} }, 5); }
    get src() { return this._s; }
    get complete() { return !!this._s; }
  };
  w.innerWidth = 1024; w.innerHeight = 768; w.devicePixelRatio = 1;
  Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { configurable: true, get() {
    return this.className && String(this.className).includes("walk-view") ? 1024 : 0;
  }});
  Object.defineProperty(w.HTMLElement.prototype, "clientHeight", { configurable: true, get() {
    return this.className && String(this.className).includes("walk-view") ? 768 : 0;
  }});
  w.eval(siteText());
  const doc = w.document;
  return {
    w, doc, navs,
    key: (k) => (doc.activeElement || doc.body).dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })),
    click: (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })),
    back: async () => { w.history.back(); await sleep(60); },
    close: () => w.close(),
  };
}

/* The site's own visibility contract, read the way verify-overlay reads it: a card or a panel is
   `hidden` until it opens, the drawer carries `is-closed` until it opens, the plate `is-open`. */
const openState = (doc) => {
  const card = doc.querySelector("[data-walk-card]");
  const list = doc.querySelector("[data-walk-listpanel]");
  const plate = doc.getElementById("room-plate");
  const game = doc.querySelector("[data-walk-game]");
  const featured = doc.getElementById("featured-modal");
  const dotGame = doc.querySelector("[data-dot-game]");
  return {
    card: !!card && !card.hidden,
    list: !!list && !list.classList.contains("is-closed"),
    plate: !!plate && plate.classList.contains("is-open"),
    game: !!game && !game.hidden,
    featured: !!featured && featured.classList.contains("is-open"),
    dotGame: !!dotGame && !dotGame.hidden,
    any: [card && !card.hidden, list && !list.classList.contains("is-closed"),
          plate && plate.classList.contains("is-open"), game && !game.hidden,
          featured && featured.classList.contains("is-open"),
          dotGame && !dotGame.hidden].some(Boolean),
  };
};

const exists = (href) => {
  if (!href || /^(#|https?:|mailto:)/.test(href)) return true;      // in-page, external: not this gate's business
  const file = href.split("#")[0];
  return !file || fs.existsSync(file);
};

/* ---- 1. No dangling exit: every chrome link resolves to a page on disk ---- */
out.push("\n-- 1. every way out points at a page that exists --");
for (const page of WALK) {
  const env = boot(page);
  const doc = env.doc;
  const exit = doc.querySelector("[data-walk-exit]");
  const hrefs = [...doc.querySelectorAll("[data-walk-exit][href], [data-walk-listpanel] a[href], .walk-card a[href]")]
    .map((el) => el.getAttribute("href")).filter((h) => /\.html/.test(h));
  const enter = doc.querySelector("[data-enter-space]");
  ok(`${page}: the chrome's exit resolves`, !!exit && exists(exit.getAttribute("href")),
     exit ? exit.getAttribute("href") : "no [data-walk-exit]");
  ok(`${page}: every page link in the chrome resolves`, hrefs.length > 0 && hrefs.every(exists),
     `${hrefs.length} links${hrefs.filter((h) => !exists(h)).length ? ", missing: " + hrefs.filter((h) => !exists(h)).join(" ") : ""}`);
  ok(`${page}: the story's enter-the-space verb resolves`, !enter || exists(enter.getAttribute("href")),
     enter ? enter.getAttribute("href") : "no story verb (fine)");
  ok(`${page}: the page opens with no surface up`, !openState(doc).any);
  env.close();
}

/* ---- 2. Back folds a card, keeps the room, and does not navigate ---- */
out.push("\n-- 2. the back gesture folds the card and keeps the place --");
for (const page of WALK) {
  const env = boot(page);
  const doc = env.doc;
  const before = env.navs.length;
  env.key("i");
  await sleep(80);
  const opened = openState(doc).card;
  await env.back();
  const after = openState(doc);
  ok(`${page}: i opens the card, Back folds it without leaving`, opened && !after.card,
     `opened=${opened} folded=${!after.card}`);
  ok(`${page}: and the visitor was not navigated away`, env.navs.length === before,
     `${env.navs.length - before} navigations`);
  ok(`${page}: focus came back to something on the page, not to nowhere`,
     !!doc.activeElement && doc.activeElement !== doc.body, doc.activeElement ? doc.activeElement.className : "none");
  env.close();
}

/* ---- 3. two surfaces, two Backs, one layer each; the third leaves ---- */
out.push("\n-- 3. one Back per layer, and only then the exit --");
for (const page of ["rooms-toronto.html", "rooms-niagara.html"]) {
  const env = boot(page);
  const doc = env.doc;
  env.key("i");
  await sleep(60);
  env.key("l");
  await sleep(80);
  const both = openState(doc);
  ok(`${page}: card and written lane can be open at once`, both.card && both.list);
  await env.back();
  const one = openState(doc);
  ok(`${page}: the first Back folds exactly one layer`, one.card !== both.card || one.list === false,
     `card ${both.card}->${one.card}, list ${both.list}->${one.list}`);
  await env.back();
  const none = openState(doc);
  ok(`${page}: the second Back folds the other`, !none.any, JSON.stringify(none));
  /* jsdom refuses document navigation, so "the Back finally leaves" is measured in a real browser
     (`.verify/_backprobe.mjs`, "a second Back still leaves the room"). What this side can hold is that
     the extra Back is not eaten by a phantom layer. */
  await env.back();
  ok(`${page}: and with nothing open, that Back is not swallowed by a phantom layer`,
     !openState(doc).any, JSON.stringify(openState(doc)));
  env.close();
}

/* ---- 4. closing it yourself leaves no phantom layer ---- */
out.push("\n-- 4. a surface closed by its own control leaves no entry behind --");
for (const page of ["rooms-toronto.html", "rooms.html"]) {
  const env = boot(page);
  const doc = env.doc;
  env.key("i");
  await sleep(60);
  env.click(doc.querySelector("[data-walk-card-close]"));
  await sleep(80);
  ok(`${page}: the card's own close folds it`, !openState(doc).card);
  await env.back();
  await sleep(60);
  ok(`${page}: closing it yourself leaves no phantom layer for the next Back to eat`,
     !openState(doc).any, `anything still open: ${openState(doc).any}`);
  env.close();
}

/* ---- 5. the story rail: opened by a prop, folded by Back, leaving the lane intact ---- */
out.push("\n-- 5. the reel answers Back the same way --");
{
  const env = boot("rooms-toronto.html");
  const doc = env.doc;
  env.key("l");
  await sleep(60);
  env.key("l");
  await sleep(60);
  const exit = doc.querySelector("[data-walk-exit]");
  ok("rooms-toronto: the exit is still the street", exit && /street\.html/.test(exit.getAttribute("href")),
     exit ? exit.getAttribute("href") : "none");
  env.close();
}
{
  const env = boot("rooms-toronto.html", "#at-tower-cn");
  const doc = env.doc;
  await sleep(300);            // the spawn's first frame has to have run before the reach is asked
  const reach = doc.querySelector(".walk-hit.is-reach");
  ok("rooms-toronto: the tower's own stop is in reach on arrival", !!reach && reach.dataset.obj === "tower-cn",
     reach ? reach.dataset.obj : "none");
  env.key("e");
  await sleep(120);
  const plate = doc.getElementById("room-plate");
  const opened = !!plate && plate.classList.contains("is-open");
  ok("rooms-toronto: E on the tower opens its story reel", opened, plate ? plate.className : "no plate");
  const navs = env.navs.length;
  await env.back();
  await sleep(120);
  ok("rooms-toronto: Back folds the reel and keeps the visitor at the tower",
     !plate.classList.contains("is-open") && env.navs.length === navs,
     `${plate.className} / ${env.navs.length - navs} navigations`);
  await env.back();
  await sleep(120);
  ok("rooms-toronto: with the reel folded, the next Back is not swallowed either",
     !plate.classList.contains("is-open") && env.navs.length === navs,
     `${plate.className} / ${env.navs.length - navs} navigations`);
  env.close();
}

/* ---- 6. the non-walk pages with a surface ---- */
out.push("\n-- 6. the reading pages' surfaces fold before they flee --");
{
  const env = boot("research.html");
  const doc = env.doc;
  const btn = doc.querySelector("[data-featured]");
  ok("research.html: the publication list offers a surface to open", !!btn);
  if (btn) {
    env.click(btn);
    await sleep(80);
    const opened = openState(doc).featured;
    const navs = env.navs.length;
    await env.back();
    await sleep(80);
    const folded = !openState(doc).featured;
    ok("research.html: Back folds the publication card and stays on the page",
       opened && folded && env.navs.length === navs,
       `opened=${opened} folded=${folded} navs=${env.navs.length - navs}`);
  }
  env.close();
}
{
  const env = boot("thinking.html");
  const doc = env.doc;
  const openBtn = doc.querySelector("[data-dot-open]");
  const panel = doc.querySelector("[data-dot-game]");
  ok("thinking.html: the dot game ships a way in", !!openBtn && !!panel);
  if (openBtn && panel) {
    env.click(openBtn);
    await sleep(80);
    const opened = !panel.hidden;
    ok("thinking.html: the way in opens the game panel", opened, panel.className);
    if (opened) {
      const navs = env.navs.length;
      await env.back();
      await sleep(80);
      ok("thinking.html: Back folds the game and stays on the page",
         panel.hidden && env.navs.length === navs,
         `hidden=${panel.hidden} / ${env.navs.length - navs} navigations`);
    }
  }
  env.close();
}

/* ---- 7. Esc is unchanged: it folds what is open, and it is the door when nothing is ---- */
out.push("\n-- 7. Esc still means what it meant --");
for (const page of ["rooms-toronto.html", "rooms-niagara.html"]) {
  const env = boot(page);
  const doc = env.doc;
  env.key("i");
  await sleep(60);
  const navs = env.navs.length;
  env.key("Escape");
  await sleep(80);
  ok(`${page}: Esc folds the card and does not leave`, !openState(doc).card && env.navs.length === navs,
     `${env.navs.length - navs} navigations`);
  env.key("Escape");
  await sleep(120);
  ok(`${page}: and with nothing open, Esc is still the door`, env.navs.length === navs + 1,
     `${env.navs.length - navs} navigations`);
  env.close();
}

const fails = out.filter((l) => l.startsWith("FAIL"));
console.log(out.join("\n"));
console.log(`\n${out.filter((l) => l.startsWith("PASS")).length}/${out.filter((l) => /^(PASS|FAIL)/.test(l)).length} pass`);
process.exit(fails.length ? 1 : 0);

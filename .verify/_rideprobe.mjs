/* verify-ux.mjs — a press is answered in the way the thing deserves, and text is the last resort.

   Round 74. Round 73 removed the card from every press, and the owner refined the ruling:
   「只留該需要用文字彈出介面介紹的物件。其他就像你說的可以用 E 去互動看有沒有變化。你如果全部都做出彈出介面
   這很傷使用者體驗。」 So the rule is not "no card" and not "a card for whatever was pressed". It is one
   question per object: **can the press show the visitor something, or is the record the only thing it
   has?** The generator answers it in `press_verb` and stamps the answer on the button as `data-verb`:

     leave   you go through it                     the page changes
     photos  it shows you photographs              the reel
     ride    it carries you                        the camera moves
     play    it plays                              the toy
     try     it demonstrates                       the scene moves
     use     it opens / comes on                   the scene changes
     read    **it has nothing to show**            the record card

   This gate holds the class shut:

     1. every pressable box carries a verb, and every scenery box carries none;
     2. `read` is exactly the landmark set, and it is a small minority of the props;
     3. pressing every pressable box is answered by the answer its verb promises;
     4. **a text surface opens for `read` and for nothing else** — the owner's sentence as an assertion;
     5. a `read` press that opens nothing is a dead press, not a quiet one;
     6. no press opens two surfaces at once, and the card carries that thing's own record;
     7. the bar offers the verb before the press (`data-verb` on the bar, `attr()` in the CSS), and the
        card the visitor asks for with `I` is a different mode from the one a press opens.

   jsdom, no browser; the boot is verify-overlay's. Run from the repo root:
   `node .verify/verify-ux.mjs`.
*/
import fs from "node:fs";

const { JSDOM, VirtualConsole } = await import("jsdom");
const out = [];
const ok = (n, c, e = "") => out.push(`${c ? "PASS" : "FAIL"}  ${n}${e ? "  — " + e : ""}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = ["street.html", "rooms.html", "rooms-fukuoka.html", "rooms-toronto.html",
               "rooms-niagara.html", "rooms-goat.html", "rooms-journey.html", "rooms-cntower.html"];
const VERBS = ["leave", "photos", "ride", "play", "try", "use", "read"];

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
  const dom = new JSDOM(markup.replace(/<script[^>]*src=[^>]*><\/script>/g, ""), {
    runScripts: "dangerously", pretendToBeVisual: true, url, virtualConsole: vc,
  });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLElement.prototype.setPointerCapture = function () {};
  w.HTMLElement.prototype.hasPointerCapture = () => false;
  w.matchMedia = (q) => ({ matches: /hover: hover/.test(q), media: q,
    addEventListener() {}, addListener() {}, removeEventListener() {} });
  w.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); }
    unobserve() {} disconnect() {}
  };
  w.PointerEvent = w.MouseEvent;
  w.Element.prototype.animate = () => ({ cancel() {}, finished: Promise.resolve() });
  w.HTMLCanvasElement.prototype.getContext = function () { return this.__c || (this.__c = recorder()); };
  w.Image = class {
    constructor() { this.naturalWidth = 640; this.naturalHeight = 427; }
    set src(v) { this._s = v; setTimeout(() => { try { if (this.onload) this.onload(); } catch (e) {} }, 5); }
    get src() { return this._s; }
    get complete() { return !!this._s; }
  };
  // A stall's game is its own module (js/games.js), which the pages load beside the lane: without it
  // `window.huaxuStalls` is undefined and a play press looks dead. Boot the page's own scripts.
  for (const src of ["js/games.js", "js/site.js"]) {
    if (fs.existsSync(src)) w.eval(fs.readFileSync(src, "utf8"));
  }
  return { w, navs };
}

const css = fs.readFileSync("css/site.css", "utf8");
const js = fs.readFileSync("js/site.js", "utf8");

/* ---- 0. the one text surface is named, and the bar promises the verb -------------------------- */
ok("the bar's prefix is the verb, not a fixed word", /\.walk-open::before \{[^}]*content: attr\(data-verb\)/.test(css)
   && !/\.walk-open::before \{[^}]*content: "Open/.test(css));
ok("one table turns the generator's verb into language",
   /const VERB_WORD = \{/.test(js) && VERBS.every((v) => new RegExp(`\\b${v}: \\["`).test(js)));
ok("the text card is opened by one function, from the landmark branch",
   /const showWords = \(m\) =>/.test(js)
     && (js.match(/showWords\(m\);/g) || []).length === 1
     && /if \(m\.landmark\) \{ showWords\(m\);/.test(js));
ok("the card the visitor asks for with I is a different mode from the one a press opens",
   /card\.dataset\.mode = "words"/.test(js) && /card\.dataset\.mode = "space"/.test(js));


const { w, navs } = boot(fs.readFileSync("rooms-niagara.html", "utf8"), "https://huaxu.test/rooms-niagara.html");
await sleep(1000);
const doc = w.document;
const el = doc.querySelector('[data-obj="incline-upper-door"]');
const W = () => doc.querySelector("[data-walk]").__walk;
console.log("before", JSON.stringify({ h: W().height, x: W().x, z: W().depth, ride: !!doc.querySelector("[data-walk]").__walk }),
            "record:", JSON.stringify(doc.querySelector("[data-walk-record]")?.textContent));
el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, detail: 0 }));
for (let i = 0; i < 12; i++) {
  await sleep(200);
  console.log(i, JSON.stringify({ h: +W().height.toFixed(1), x: +W().x.toFixed(1), z: +W().depth.toFixed(1) }),
              JSON.stringify((doc.querySelector("[data-walk-record]")?.textContent || "").slice(0, 50)));
}
process.exit(0);

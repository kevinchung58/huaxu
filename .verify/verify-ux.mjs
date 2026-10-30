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
        card the visitor asks for with `I` is a different mode from the one a press opens;
     8. the one text surface is readable and its exit is visible (custom properties resolve, and the
        close control is not the card's own colour).

   jsdom, no browser; the boot is verify-overlay's. Run from the repo root:
   `node .verify/verify-ux.mjs`.
*/
import fs from "node:fs";
import { siteText } from "../bin/site-sources.mjs";

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

const sheet = fs.readFileSync("css/site.css", "utf8");
const js = siteText();
const css = sheet;   // the pre-round-74 assertions below read `css`; one read of the file, two names

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

/* ---- 1-6, page by page ----------------------------------------------------------------------- */
const totals = { boxes: 0, pressable: 0, byVerb: {} };
for (const file of PAGES) {
  const { w, navs } = boot(fs.readFileSync(file, "utf8"), `https://huaxu.test/${file}`);
  await sleep(900);
  const doc = w.document;
  const boxes = Array.from(doc.querySelectorAll(".walk-hit"));
  const pressable = boxes.filter((el) => el.dataset.quiet === undefined);
  const scenery = boxes.filter((el) => el.dataset.quiet !== undefined);

  ok(`${file}: every pressable box says what a press will do, in a word the site knows`,
     pressable.every((el) => VERBS.includes(el.dataset.verb)),
     pressable.filter((el) => !VERBS.includes(el.dataset.verb)).map((el) => el.dataset.obj).join(", "));
  ok(`${file}: scenery carries no verb at all (it is not a button, and it does not pretend to be)`,
     scenery.every((el) => el.dataset.verb === undefined),
     scenery.filter((el) => el.dataset.verb).map((el) => `${el.dataset.obj}=${el.dataset.verb}`).join(", "));
  const reads = pressable.filter((el) => el.dataset.verb === "read");
  ok(`${file}: the things that must be read are exactly the things the place is named for`,
     reads.every((el) => el.dataset.landmark === "1")
       && pressable.filter((el) => el.dataset.landmark === "1").every((el) => el.dataset.verb === "read"),
     `${reads.length} read of ${pressable.length} pressable`);

  /* press every pressable box the way a keyboard does (detail === 0), and read the answer back */
  const card = doc.querySelector("[data-walk-card]");
  const plate = doc.querySelector("#room-plate");
  const list = doc.querySelector("[data-walk-listpanel]");
  const game = doc.querySelector("[data-walk-game]");
  const record = doc.querySelector("[data-walk-record]");
  const fold = async () => {
    card?.querySelector("[data-walk-card-close]")?.click();
    if (plate?.classList.contains("is-open")) plate.querySelector("[data-room-close]")?.click();
    if (list && !list.classList.contains("is-closed")) doc.querySelector("[data-walk-list]")?.click();
    if (game && !game.hidden) game.querySelector("[data-game-close]")?.click();
    await sleep(10);
  };
  const wrong = [], dead = [], both = [], unread = [];
  for (const el of pressable) {
    await fold();
    const verb = el.dataset.verb;
    const nav0 = navs.length;
    const state0 = el.dataset.state;
    const quads0 = doc.querySelector("[data-walk]").__walk.quads;
    const record0 = record ? record.textContent : "";
    const height0 = doc.querySelector("[data-walk]").__walk.height;
    el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, detail: 0 }));
    await sleep(60);
    /* A car leaves the deck over seconds, and a second press while one is already running keeps the
       car it is in (`boardRide` returns true) -- so "did this press put the visitor on a ride" is
       measured as movement of the body over a window, not as a flag that only the first press sets. */
    const rideMoved = async () => {
      for (let i = 0; i < 15; i++) {
        if (Math.abs(doc.querySelector("[data-walk]").__walk.height - height0) > 2) return true;
        await sleep(120);
      }
      return false;
    };
    const rode = verb === "ride" ? await rideMoved() : false;
    const opened = {
      card: card && !card.hidden,
      plate: plate && plate.classList.contains("is-open"),
      game: game && !game.hidden,
      list: list && !list.classList.contains("is-closed"),
      left: navs.length > nav0,
      state: el.dataset.state !== state0,
      quads: doc.querySelector("[data-walk]").__walk.quads !== quads0,
      demo: el.__demoAt !== undefined,
      rose: rode,
      said: record ? record.textContent !== record0 : false,
    };
    const surfaceCount = ["card", "plate", "game", "list"].filter((k) => opened[k]).length;
    if (surfaceCount > 1) both.push(`${el.dataset.obj}: ${JSON.stringify(opened)}`);
    /* The rule the owner gave, as an assertion: text only where there is nothing to show. */
    if (opened.card && verb !== "read") wrong.push(`${el.dataset.obj}(${verb})`);
    if (!opened.card && verb === "read") unread.push(el.dataset.obj);
    const answered = opened.plate || opened.game || opened.left || opened.state || opened.quads
      || opened.demo || opened.rose || opened.said;
    if (!answered && verb !== "read") dead.push(`${el.dataset.obj}(${verb})`);
    if (verb === "photos" && !opened.plate) dead.push(`${el.dataset.obj}(photos but no reel)`);
    /* a `read` press must carry that thing's own words, not the lane's note */
    if (verb === "read" && opened.card) {
      const t = (card.querySelector("[data-walk-title]")?.textContent || "").trim();
      const body = (card.querySelector("[data-walk-hint]")?.textContent || "").trim();
      if (t !== (el.dataset.title || "").trim() || body !== (el.dataset.hint || "").trim())
        wrong.push(`${el.dataset.obj}: card says "${t}" / "${body.slice(0, 30)}"`);
    }
  }
  ok(`${file}: a press opens text only where the thing has nothing else to show`,
     wrong.length === 0, wrong.join("; "));
  ok(`${file}: every press is answered by the thing its verb promises`,
     dead.length === 0, dead.join("; "));
  ok(`${file}: a thing that must be read is never a dead press`,
     unread.length === 0, unread.join("; "));
  ok(`${file}: nothing opens two surfaces at once`, both.length === 0, both.join("; "));

  /* the bar: it offers the reach's own verb, so the promise is visible before the press */
  const reach = doc.querySelector(".walk-hit.is-reach");
  const bar = doc.querySelector("[data-walk-open]");
  if (reach) {
    ok(`${file}: the bar says what the press will do before it is pressed`,
       bar.dataset.verb && bar.dataset.verb.trim().startsWith(
         ({ leave: "Walk through", photos: "Photographs", ride: "Ride", play: "Play",
            try: "Try", use: "Use", read: "Read" })[reach.dataset.verb] || "\u0000"),
       `${reach.dataset.obj}(${reach.dataset.verb}) -> bar "${bar.dataset.verb || ""}"`);
  }

  totals.boxes += boxes.length;
  totals.pressable += pressable.length;
  pressable.forEach((el) => { totals.byVerb[el.dataset.verb] = (totals.byVerb[el.dataset.verb] || 0) + 1; });
  w.close();
}

ok("text is the exception on the whole site, not the rule",
   totals.byVerb.read / totals.pressable < 0.25,
   `${totals.pressable} pressable of ${totals.boxes} boxes: ${JSON.stringify(totals.byVerb)}`);

/* ---------------------------------------------------------------------------------------------
   The other half of "the exit is visible": the only text surface on the site has to be readable and
   closeable. Both failures found here on the round-74 head were silent ones -- a declaration that
   drops is not an error, it is a colour that never applied.

   `.walk-card` is `rgba(11, 20, 48, 0.94)` and its text said `color: var(--paper)`, a custom property
   that was used five times and defined nowhere; it only looked right because an ancestor HUD set a
   light colour. `.modal-close` says `color: var(--navy)` because every other surface it closes is
   paper -- so the X on the card was navy on navy, focusable, in the tab order, and invisible.
   --------------------------------------------------------------------------------------------- */
const defined = new Set([...sheet.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const used = [...sheet.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/g)];
const undefinedVars = [...new Set(used.filter((m) => m[2] === ")" && !defined.has(m[1])).map((m) => m[1]))];
ok("every custom property is defined or has a fallback", undefinedVars.length === 0,
   undefinedVars.length ? `undefined: ${undefinedVars.join(", ")}` : `${defined.size} defined`);

const cardRule = sheet.match(/\.walk-card\s*\{[^}]*\}/);
const closeOnCard = sheet.match(/\.walk-card[^{]*\.modal-close[^{]*\{[^}]*\}/);
ok("the card's close control is not painted in the card's own fill",
   Boolean(closeOnCard) && /color:\s*var\(--paper\)/.test(closeOnCard[0]),
   closeOnCard ? closeOnCard[0].replace(/\s+/g, " ").trim() : "no .walk-card .modal-close rule");
ok("the card declares a text colour its own fill cannot swallow",
   Boolean(cardRule) && /color:\s*var\(--paper\)/.test(cardRule[0]),
   cardRule ? "rgba(11, 20, 48, 0.94) on --paper #fdf6ec" : "no .walk-card rule");

const fails = out.filter((l) => l.startsWith("FAIL"));
console.log(out.join("\n"));
console.log(`\n${out.length - fails.length}/${out.length} pass`);
if (fails.length) process.exit(1);

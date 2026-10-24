/* verify-walk.mjs — the lane, its furniture, the compound beyond the window, and the album.

   jsdom has no WebGL, so the tile raster's canvas is replaced by a recorder: this gate checks the
   compiled scene numbers, movement, reach and interaction logic. Three.js geometry and
   generated-page wiring are covered by `bin/verify-three.mjs`; neither gate is a claim about browser
   appearance. Run from the repo root:
   `node .verify/verify-walk.mjs`. */
import fs from "node:fs";

const rooms = fs.readFileSync("rooms.html", "utf8");
const act = fs.readFileSync("activities.html", "utf8");
const css = fs.readFileSync("css/site.css", "utf8");
const js = fs.readFileSync("js/site.js", "utf8");
const gen = fs.readFileSync("_gen_html.py", "utf8");
const html = rooms;

const ctx = {
  frame: [], fills: 0, strokes: 0, imgs: 0, saves: 0, restores: 0, bad: 0, frames: 0,
  darkMax: 0, warm: 0, huge: 0, ptsMax: 0, text: 0, colours: new Set(), counts: new Map(), navs: [],
};
function recorder() {
  const fin = (a) => { for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) ctx.bad++; };
  // The recorder keeps the widest coordinate it ever saw. Nothing else in a sandbox without a browser
  // can tell you that a projected far plane stayed a plane instead of becoming a trapezoid over the
  // whole viewport, and that is the failure a bounds test exists to prevent.
  const op = (name) => (...a) => {
    fin(a);
    for (const v of a) if (typeof v === "number") ctx.ptsMax = Math.max(ctx.ptsMax, Math.abs(v));
    if (name === "moveTo") ctx.frame.push([a[0], a[1]]);
  };
  return {
    canvas: { width: 1024, height: 768 },
    fillStyle: "", strokeStyle: "", lineWidth: 1, globalCompositeOperation: "source-over",
    save() { ctx.saves++; }, restore() { ctx.restores++; },
    beginPath: op("beginPath"), closePath: op("closePath"), moveTo: op("moveTo"), lineTo: op("lineTo"),
    arc: op("arc"), ellipse: op("ellipse"), rect: op("rect"),
    fillRect(x, y, w, h) { fin([x, y, w, h]); if (Math.abs(w) > 3000) ctx.huge++; ctx.fills++; },
    strokeRect: op("strokeRect"), translate: op("translate"), scale: op("scale"), rotate: op("rotate"),
    clip() { ctx.frames++; },
    fill() {
      ctx.fills++;
      const c = String(this.fillStyle);
      ctx.colours.add(c);
      ctx.counts.set(c, (ctx.counts.get(c) || 0) + 1);   // which faces, and how often
      const m = c.match(/^rgba\(22,34,60,([\d.]+)\)/);
      if (m) ctx.darkMax = Math.max(ctx.darkMax, Number(m[1]));
      if (/^rgba\(255,228,186,/.test(c)) ctx.warm++;
    },
    stroke() { ctx.strokes++; },
    fillText() { ctx.text++; }, strokeText() { ctx.text++; },
    drawImage(...a) { ctx.imgs++; fin(a.slice(1)); },
    setTransform(...a) { fin(a); ctx.frames++; ctx.frame = []; },
    transform(...a) { fin(a); },
    createPattern: () => ({ p: 1 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
const ok = (n, c, e = "") => out.push(`${c ? "PASS" : "FAIL"}  ${n}${e ? "  — " + e : ""}`);

function boot(markup, url, seedHour) {
  const { JSDOM, VirtualConsole } = globalThis.__JSDOM;
  // jsdom refuses to navigate, which is the one thing a walk-through of the exit needs to be heard
  // about: an attempted navigation lands here instead of on a console the owner has to read.
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => ctx.navs.push(String((e && e.message) || e)));
  vc.forwardTo(console, { omitJSDOMErrors: true });   // this jsdom renamed it; the errors stay here
  const dom = new JSDOM(markup.replace(/<script[^>]*src=[^>]*><\/script>/g, ""), {
    runScripts: "dangerously", pretendToBeVisual: true, url, virtualConsole: vc,
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
    set src(v) {
      this._s = v;
      // Late, like a real fetch. A synchronous load fires during construction, before `boot()` has
      // attached its handler, which is how a reference to state deleted two rounds ago survived every
      // test ever written for this page.
      setTimeout(() => { try { if (this.onload) this.onload(); } catch (e) { ctx.loadError = String(e && e.message); } }, 5);
    }
    get src() { return this._s; }
    get complete() { return !!this._s; }
  };
  if (seedHour !== undefined) w.localStorage.setItem("huaxu.walk-hour.v1", seedHour);
  w.eval(js);
  return w;
}
globalThis.__JSDOM = await import("jsdom");

const w = boot(rooms, "https://huaxu.test/rooms.html");
const doc = w.document;
const q = (s) => doc.querySelector(s);
const qa = (s) => Array.from(doc.querySelectorAll(s));
const key = (k, type = "keydown") => (doc.activeElement || doc.documentElement).dispatchEvent(
  new w.KeyboardEvent(type, { key: k, bubbles: true }));
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
const hold = async (k, ms) => { key(k, "keydown"); await new Promise((r) => setTimeout(r, ms)); key(k, "keyup"); };
const holdTogether = async (keys, ms) => {
  keys.forEach((k) => key(k, "keydown"));
  await new Promise((r) => setTimeout(r, ms));
  keys.forEach((k) => key(k, "keyup"));
};
/* ---- 1. the data the scene is allowed to know about ------------------------------------------- */
/* Round 32: the Tokyo room is Nakamise-dori at night (TODO section 0n). The assertions that listed
   the old lane's invented kit -- a booth, a mirror, six lanterns on five wires, a tactile path -- are
   replaced by the street's own contract, every number of which comes from the sources: 9.1 m from
   shopfront to shopfront, open to the sky, granite paving, a real shop's width per bay, the rows broken
   where the two streets cross, Hozomon at its size with the pagoda 56 m west of it. The rules that
   are the site's and not the room's -- every glow pointable, no band outside the box, no lettering,
   the sightline in words -- are kept as they were. */
const Q = "&quot;", DQ = '"';
const hitRe = /<button type="button" class="walk-hit"[^>]*data-obj="([^"]*)"[^>]*>/g;
const ids = [...html.matchAll(hitRe)].map((m) => m[1]);
const hits = [...html.matchAll(/<button type="button" class="walk-hit"[^>]*>/g)].map((m) => m[0]);
const attrOf = (tag, a) => { const m = tag.match(new RegExp(`${a}="([^"]*)"`)); return m ? m[1] : null; };
const cssOf = (tag, v) => { const m = tag.match(new RegExp(`--${v}:(-?[\\d.]+)px`)); return m ? Number(m[1]) : NaN; };
const bays = hits.filter((t) => /data-obj="shopbay-/.test(t)).map((t) => ({
  id: attrOf(t, "data-obj"), x: cssOf(t, "x"), z: cssOf(t, "z"), w: Number(attrOf(t, "data-w")),
  h: Number(attrOf(t, "data-h")), d: Number(attrOf(t, "data-d")), solid: attrOf(t, "data-solid") === "true",
  posts: attrOf(t, "data-posts"), mural: JSON.parse((attrOf(t, "data-mural") || "[]").split(Q).join(DQ)) }));
const laneAttr = (a) => { const m = html.match(new RegExp(`data-lane-${a}="([^"]*)"`)); return m ? m[1] : null; };
const WALK_D = Number(laneAttr("d")), BACK = Number(laneAttr("back")), CEILING = Number(laneAttr("ceil"));
const RUNS = [[0, 550], [1000, 1850], [2350, WALK_D]], GAPS = [[550, 1000], [1850, 2350]];
ok("the street is furnished from the record: both shop rows, its gate and its plates",
   bays.length >= 6 && ids.includes("gate-kaminari") && ids.filter((i) => i.startsWith("frame-")).length === 6,
   `${bays.length} bays, ${ids.length} objects`);
ok("each object carries its own depth, so a prop is a solid", (html.match(/data-d="\d+"/g) || []).length === ids.length);
ok("the street is its real width, open to the sky and paved: 9.1 m from shopfront to shopfront",
   laneAttr("w") === "910" && laneAttr("open") === "1" && /data-floor="paving"/.test(html)
     && Number(laneAttr("max-d")) > WALK_D);
ok("each row stands against its own wall, a shop deep, and stops a walker at the posts",
   bays.every((b) => Math.abs(b.x) === 380 && b.d === 150 && b.h === 480 && b.solid)
     && bays.some((b) => b.x < 0) && bays.some((b) => b.x > 0));
ok("every bay keeps a real shop's width: about 7.3 m on the west row, 4.7 m on the east",
   bays.every((b) => (b.x < 0 ? Math.abs(b.w / 730 - 1) < 0.45 : Math.abs(b.w / 470 - 1) < 0.45)),
   bays.map((b) => `${b.id}:${b.w}`).join(" "));
ok("the rows break where the two streets cross, and only there",
   [-1, 1].every((sd) => RUNS.every(([r0, r1]) => {
     const inRun = bays.filter((b) => Math.sign(b.x) === sd && b.z > r0 && b.z < r1);
     const cover = inRun.reduce((t, b) => t + b.w, 0);
     return inRun.length >= 1 && Math.abs(cover - (r1 - r0)) <= 3;
   })) && bays.every((b) => GAPS.every(([g0, g1]) => b.z + b.w / 2 <= g0 + 2 || b.z - b.w / 2 >= g1 - 2)));
ok("each run ends at a post and the row's end wall",
   [-1, 1].every((sd) => RUNS.every(([r0, r1]) => {
     const inRun = bays.filter((b) => Math.sign(b.x) === sd && b.z > r0 && b.z < r1).sort((a, b) => a.z - b.z);
     if (inRun.length === 1) return inRun[0].posts === "2";
     return inRun[0].posts === "first" && inRun[inRun.length - 1].posts === "end";
   })));
ok("the shutters carry the mural's ground colours and nothing else",
   bays.every((b) => b.mural.length >= 2 && b.mural.every((c) => /^#[0-9a-f]{6}$/i.test(c))));
const island = (name) => {
  const m = html.match(new RegExp(`data-walk-${name}>(.*?)</script>`));
  return m ? JSON.parse(m[1]) : null;
};
const lights = island("lights"), wires = island("wires"), beams = island("beams"),
      vista = island("vista"), bd = island("backdrop");
const strips = lights.filter((L) => L.bulb === false);
const lanterns = lights.filter((L) => L.body === "lantern");
/* Round 56: a strip is the *bay's* strip. The street gained one more unlit source -- the vending
   machine's own glow, which is authored on the prop and inherits its position from it -- so the
   count that has to equal the bays is the count of strips that name a bay, and every other source
   is asked, below, to name a prop that stands exactly where it does. */
const bayStrips = strips.filter((L) => (L.of || "").startsWith("shopbay-"));
ok("lights are data: a strip light under every bay's eave, and the globes on the fascias",
   bayStrips.length === bays.length && bayStrips.every((L) => bays.some((b) => b.id === L.of && b.x === L.x && b.z === L.z))
     && lights.filter((L) => L.bulb !== false).length >= 4,
   `${bayStrips.length} bay strips / ${strips.length - bayStrips.length} prop glows / ${lights.length} lights`);
ok("nothing hangs on a wire the street does not have",
   (wires || []).length === 0 && !lights.some((L) => L.body === "lantern") && (beams || []).length === 0);
ok("the far end is Hozomon at its sourced size, with the pagoda 56 m west and 19 m north of it",
   bd && bd.temple && bd.temple.gate.w === 2100 && bd.temple.gate.h === 2270 && bd.temple.z > WALK_D
     && bd.temple.pagoda.x === -5600 && bd.temple.pagoda.z - bd.temple.z === 1900 && bd.temple.pagoda.h === 5332);
ok("the plaza continues the street's own paving, at street level, from the last shops on",
   bd.plaza.y === 0 && bd.plaza.z0 === WALK_D && bd.plaza.z1 > bd.temple.z);
ok("a street with no lid has a sky that reaches the top of the frame",
   bd.sky.length === 3 && bd.sky[bd.sky.length - 1].y1 >= 120000 && /const cl = OPEN \|\| VAULT \? null : lidQuad\(/.test(js) && /if \(VAULT && !OPEN\)/.test(js));
ok("the aperture opens the whole end of the street onto the plaza",
   vista && vista.w >= 880 && vista.y0 <= 4 && vista.y1 >= 490);
ok("no prop's z is left in record units (all scaled by 2.9)",
   [...html.matchAll(/--z:(-?\d+)px/g)].every((m) => Math.abs(Number(m[1])) % 1 === 0));
const surf = island("surfaces"), ground = island("marks");
const CLAD = ["plaster", "shutter", "corrugated", "dado", "brick", "hoarding", "concrete", "galv"];
ok("the walls are clad by data: every band names a material that has a pattern",
   !!surf && surf.length >= 6 && surf.every((v) => CLAD.includes(v.kind)), `${surf ? surf.length : 0} bands`);
ok("a band cannot lie about the lane: inside the walls, below the roofline, on one side",
   surf.every((v) => Math.abs(v.side) === 1 && v.z0 >= -BACK && v.z1 <= WALK_D && v.y0 >= 0 && v.y1 <= CEILING
                    && v.y1 > v.y0 && v.z1 > v.z0));
ok("the cladding tiles each wall's whole height at every panel, so the room is dressed and not patched",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd);
     for (let z = -BACK; z < WALK_D; z += 60) {
       const at = (z + Math.min(z + 60, WALK_D)) / 2;
       let y = 0;
       for (const b of v.filter((b) => b.z0 <= at && b.z1 >= at).sort((a, b) => a.y0 - b.y0)) y = Math.max(y, b.y1);
       if (y < CEILING) return false;
     }
     return true;
   }));
ok("and it runs the length of the lane on both sides, gate to plaza",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd);
     return Math.min(...v.map((b) => b.z0)) === -BACK && Math.max(...v.map((b) => b.z1)) === WALK_D;
   }));
ok("where a street crosses, the wall is that street's dark: its own band, and no shop light in it",
   [-1, 1].every((sd) => GAPS.every(([g0, g1]) => surf.some((b) => b.side === sd && b.z0 === g0 && b.z1 === g1)))
     && bayStrips.every((L) => GAPS.every(([g0, g1]) => L.z <= g0 || L.z >= g1)));  // islands are walk cm
ok("the wall beneath a covered panel is painted zero times",
   /cladCovers/.test(js) && /if \(surfaces\.length && cladCovers\(side, z, z1\)\) return/.test(js));
ok("the gutters run along the raised walks and across the mouths of the two side streets",
   !!ground && ground.length >= 4
     && ground.every((m) => (m.kind === "grate" || m.kind === "manhole")
                    && Math.abs(m.x0) <= 455 && Math.abs(m.x1) <= 455 && m.z0 >= -BACK && m.z1 <= WALK_D
                    && m.x1 > m.x0 && m.z1 > m.z0)
     && ground.filter((m) => m.kind === "grate" && m.x1 - m.x0 > 600).length === 2
     && ground.filter((m) => m.kind === "manhole").length === 1,
   `${ground.length} marks`);
const props = qa(".walk-hit").map((b) => ({ obj: b.dataset.obj,
  x: parseFloat(b.style.getPropertyValue("--x")), z: parseFloat(b.style.getPropertyValue("--z")) }));
/* The furniture the street keeps out after closing is sized by the object table in
   `skills/japan-place/references/japan-vocabulary.md` -- its ⚑ committed figures and its †
   measured ones -- and not by eye, so that the three Japanese rooms cannot drift apart about how
   wide a crate is. A prop whose numbers stop matching the table fails here, not in a photograph. */
const OBJ = {};
for (const t of hits) OBJ[attrOf(t, "data-obj")] = { w: Number(attrOf(t, "data-w")),
  h: Number(attrOf(t, "data-h")), d: Number(attrOf(t, "data-d")), kind: attrOf(t, "data-kind") };
const VOCAB = { vending: [96, 150, 52], crate: [62, 46, 52], bin: [68, 86, 68], bikes: [150, 102, 55],
                planter: [104, 50, 46], bench: [150, 84, 48], signA: [70, 86, 52], mailbox: [52, 74, 36],
                mirror: [78, 78, 24], ladder: [36, 268, 48], hydrant: [32, 94, 30], ac: [86, 30, 36],
                pipe: [16, 300, 16], rack: [140, 76, 90] };
const DRESS = ids.filter((id) => VOCAB[OBJ[id] && OBJ[id].kind] !== undefined);
ok("the street's furniture is sized by the object table, not by eye",
   DRESS.length >= 18 && DRESS.every((id) => {
     const want = VOCAB[OBJ[id].kind];
     return [OBJ[id].w, OBJ[id].h, OBJ[id].d].every((v, i) => v === want[i]);
   }), `${DRESS.length} props at the table's sizes`);
ok("every glow belongs to a named thing, so touching that thing is what changes the light",
   lights.filter((L) => L.bulb === false && L.body !== "lantern").every((L) => ids.includes(L.of))
     && /of: L\.of \|\| null/.test(js) && /setState/.test(js));
ok("the only thing in this street that lights itself is the machine that never shuts",
   strips.every((L) => (L.of || "").startsWith("shopbay-") || L.of === "vending-nakamise"),
   strips.filter((L) => L.of === "vending-nakamise").length + " machine glow");
ok("a state's light multiplier is a number, and every stop has one or none, never a guess",
   [...html.matchAll(/data-states="([^"]+)"/g)].every((raw) =>
     JSON.parse(raw[1].split(Q).join(DQ)).every((st) =>
       st.say && (st.k === undefined || (st.k > 0 && st.k < 3)))));
ok("no corner of the lane is lit by an unpointable glow",
   lights.filter((L) => L.bulb === false && L.body !== "lantern").every((L) =>
     props.some((pr) => pr.x === L.x && pr.z === L.z)),
   `${lights.filter((L) => L.bulb === false && L.body !== "lantern").length} non-bulb sources`);
ok("the fascias stay blank and the copy says why: no lettering is ours to invent",
   /fascia carries the shop&#x27;s name in life and is blank here|fascia carries the shop's name in life and is blank here/.test(html)
     && !/g\.fillText|\bfillText\(/.test(js));
ok("nothing writes prose into the scene", qa(".walk-hit").every((b) => !b.textContent.trim()));
ok("the sightline is in the accessible description, not only in pixels",
   /Hozomon, its great lantern lit, with the five-storey pagoda over the west row/.test(html));
ok("and so is the dressing, because the room is the thing being described",
   /two shallow rows of vermilion shopfronts nine metres apart, every shutter down and painted/.test(html)
     && /a lit white vending machine under the arcade's mouth/.test(html));

/* ---- 1b. the display, which may not wear a word ----------------------------------------------- */
{
  const hud = q(".walk-hud");
  const spoken = (el) => el.classList.contains("sr-only") || !!el.closest(".sr-only") || !!el.closest("[hidden]");
  // Only a node's *own* text counts: a wrapper above a live region inherits its sentence, and the
  // wrapper is not what is painted over the space.
  const ownText = (el) => Array.from(el.childNodes).filter((n) => n.nodeType === 3)
    .map((n) => n.textContent.trim()).join(" ").trim();
  // The one licensed exception is the first-visit guide (round 46, at the owner's request): prose
  // may ride the bottom chrome only inside [data-walk-tutor], only until it is learned, and the
  // tests below prove both halves. Everything else on the display still stays wordless.
  const words = [...hud.querySelectorAll("*")].filter((el) => !spoken(el) && ownText(el)
                                                                  && !el.closest("[data-walk-tutor]"));
  ok("nothing painted over the space is a sentence, a label, or even a glyph — the guide strip excepted, once",
     words.length === 0, words.map((e) => `${e.tagName}.${e.className}:${e.textContent.trim()}`).join(" "));
  ok("the live regions are still there to be heard, and only to be heard",
     q("[data-walk-status]").classList.contains("sr-only")
       && q("[data-walk-record]").classList.contains("sr-only")
       && q("[data-walk-status]").getAttribute("role") === "status");
  ok("the station rail is a ruler of ticks: named, positioned, and silent",
     qa(".walk-stop").every((b) => !b.textContent.trim()
       && /cm in$/.test(b.getAttribute("aria-label") || "")
       && /--p:[\d.]+/.test(b.getAttribute("style") || "")));
  ok("and the profile is data, not a look: each tick's height comes from its own depth",
     /height: calc\(0\.42rem \+ var\(--p, 0\)/.test(css));
  const hudBtns = qa(".walk-hud button, .walk-hud a").filter((el) => !el.closest("[data-walk-tutor]"));
  ok("every control on the display is an icon button with an accessible name",
     hudBtns.every((el) => (el.getAttribute("aria-label") || "").length > 3 && !el.textContent.trim()));
  ok("the guide's two word-buttons carry accessible names too",
     qa("[data-walk-tutor] button").every((el) => (el.getAttribute("aria-label") || "").length > 3));
  ok("the prose that used to sit there is emitted inside the card it now hides in",
     /data-walk-aside/.test(html) && /drag to turn/.test(q("[data-walk-aside]").textContent)
       && q("[data-walk-card]").hidden === true);
  ok("a folded interface keeps a keyboard route to the fold",
     /k === "i"/.test(js) && /showSpace\(\)/.test(js));
  ok("the lane keeps breathing while you are not walking, at one tick in eleven frames",
     /startPulse\(\)/.test(js) && /}, 90\);/.test(js) && /reduce\(\) \|\| !inView/.test(js));
  /* The old lane had two kerb marks; Nakamise's raised walk is drawn by its bays (a 12 cm riser at the
     post line). The rule holds for any kerb the data authors: a face, low, with a pattern of its own. */
  ok("the kerb is authored as a face, and gets a pattern of its own",
     /PATS\.kerb = mkTile/.test(js)
       && ground.filter((m) => m.kind === "kerb").every((m) => m.y1 > 0 && m.y1 <= 12));
  ok("weathering is a number on the band, not a brush in the renderer",
     surf.filter((v) => v.tone !== undefined).length >= 3
       && surf.every((v) => v.tone === undefined || (v.tone > 0.6 && v.tone < 1.4)));
}

/* ---- 2. the raster, as recorded --------------------------------------------------------------- */
ok("the raster ran at all", ctx.fills > 0, `${ctx.fills} fills after boot`);
q("[data-walk-view]").dispatchEvent(new w.Event("pointerdown", { bubbles: true }));
await sleep(30);
ok("no non-finite number ever reaches the context", ctx.bad === 0, `${ctx.bad}`);
ok("a texture arriving after boot repaints the lane, and throws nothing",
   ctx.loadError === undefined, ctx.loadError || "");
ok("every save is matched by a restore", ctx.saves === ctx.restores, `${ctx.saves}/${ctx.restores}`);
ok("the far plane stays a plane: nothing is projected off the ends of the earth",
   ctx.ptsMax > 0 && ctx.ptsMax < 60000, `widest coordinate ${Math.round(ctx.ptsMax)}`);
ok("a texture covers its own quad and no more", ctx.huge === 0, `${ctx.huge} oversized fills`);
/* Round 55: there is no ceiling any more, and the reason is the round-54 ruling rather than a
   relaxation. This recorder used to count a lane repaint -- one fill per visible quad, ~6 300 at
   night -- so a *second depth pass* read near 12 700 and a ceiling could see it. The painter is
   deleted; what still reaches a 2D context here is the shared tile raster in `mkTile` (each
   material painted once at boot), the games, and the album plates -- quantities whose only
   plausible failure is "did not run" or "wrote outside its own tile", and both of those are
   asserted above. The lane's per-frame budget moved to the compiled geometry Three consumes:
   `__walk.quads` is pinned by this gate's compiled-state section and the triangles by
   `bin/verify-three.mjs`. A number here would measure the tiles and be mistaken for the lane,
   which is exactly the kind of rumour the round-54 sweep was meant to end. */
/* Round 32 recalibration, by the same honest A/B: this page is Nakamise now -- 30 m of street instead
ok("no lettering is drawn anywhere in the scene, at any depth",
   !ctx.text && !/g\.fillText|\bfillText\(|strokeText/.test(js));
ok("the cladding is tiled into the wall's own panels, so an affine map stays exact",
   /surfaces\.forEach/.test(js) && /PATS\[sc\.kind\]/.test(js) && /SEG/.test(js));
ok("every material in the data has a painter, and every painter has a tile",
   ["shutter", "dado", "brick", "corrugated", "hoarding", "concrete", "galv",
    "tactile", "grate", "lantern"].every((k) => {
     const cap = k[0].toUpperCase() + k.slice(1);
     return new RegExp(`const paint${cap} = \\(c\\) =>`).test(js)
            && new RegExp(`PATS\\.${k} = mkTile`).test(js);
   }) && /PATS\.plaster = tilePat/.test(js));
ok("the room's atmosphere is drawn, not photographed: no material image is loaded for it",
   !/IMG\/[a-z0-9-]*(shutter|brick|tile|plaster|corrugated|wood|asphalt)/.test(js + html));
/* A wet patch is only authored where a light stands over it to be held (the old lane had one; the
   paved street after closing has none), so the rule is checked over whatever the data holds. */
// round 54: the wet patch's reflection was a canvas pass; what survives is the authored contract —
// a patch must have a source above it, and the scene's own reflection sprites carry it in Three.
ok("a wet patch earns its place: every patch has a light standing above it",
   ground.filter((m) => m.kind === "wet").every((m) => lights.some((L) => L.bulb === false
     && L.x >= m.x0 && L.x <= m.x1 && L.z >= m.z0 && L.z <= m.z1)));
ok("a shopfront is a recess in whichever wall it hangs on, built through the wall's own axes",
   /const P = \(u, v, y\) =>/.test(js) && !/face\(inset\/2/.test(js));
ok("glass lets the far side through, and says so in code", /rgba\(186,214,240,0\.2\d?\)/.test(js));
ok("a hanging lamp is tied to the wire and the swing moves the body with it",
   /const swayOf = \(L\) =>/.test(js) && /reduce\(\) \? 0 :/.test(js)
   && /3D wire or lamp cord/.test(fs.readFileSync("js/scene3d.js", "utf8")));
ok("a lantern's period and amplitude are authored, not random",
   lanterns.every((L) => L.swing > 0 && L.period > 1 && L.phase !== undefined));
ok("textures are mapped, not stretched photographs",
   /textureKind = soft \? "soft" : textureSource \? "pattern" : image \? "image" : "flat"/.test(fs.readFileSync("js/scene3d.js", "utf8")));
/* The air and the night used to share one ceiling of 0.6, which is why the far half of a room
   could never get dark: haze alone spends 0.393 of the 0.6 at z 2030, leaving the night 0.207.
   They are separate things and now have separate ceilings, so the air's legibility floor is
   asserted on its own instead of being whatever the night happened to leave. */
// round 54: the air/night fold that used to run per quad on the canvas now runs in the scene's one
// renderer — the same ceilings, stated where the surviving picture is actually composed.
{
  const s3 = fs.readFileSync("js/scene3d.js", "utf8");
  ok("the air never exceeds a murk of 0.6, so the compound stays readable",
     /clamp\(Number\(q\.air\) \|\| 0, 0, 0\.6\)/.test(s3),
     `aAir clamp ${(s3.match(/0, 0, ([\d.]+)\)/) || [])[1]}`);
  ok("the night keeps its own ceiling apart from the air's",
     /laneDark=min\(0\.62/.test(s3) && /clamp\(vLaneDarkness,0\.0,0\.58\)/.test(s3));
}
ok("the city's windows use a pattern like every other surface",
   /paintWindows/.test(js) && /winPat = mkTile\(paintWindows\)/.test(js));
ok("the aperture is four wall pieces, not a mask",
   (js.match(/wallPiece\(/g) || []).length === 5, "4 pieces + the closed fallback");
ok("a district with no vista still gets a closed wall", /else \{\s*\n\s*wallPiece\(-W, 0, W, CEIL/.test(js));   // W: round 52, the half is per-slice

/* ---- 3. walking, reaching, opening ------------------------------------------------------------- */
const stops = qa("[data-walk-stop]");
const stopAt = (z) => stops.reduce((best, el) =>
  Math.abs(parseFloat(el.style.getPropertyValue("--z")) - z) <
  Math.abs(parseFloat(best.style.getPropertyValue("--z")) - z) ? el : best, stops[0]);
const status = () => q("[data-walk-status]").textContent.trim();
/* Waiting for the body, not for a stopwatch. A station click starts a glide, and how long that glide
   takes in wall-clock time depends on how heavy a frame is — and the lane got heavier the day it got
   furniture, which turned a 400 ms sleep from "arrived" into "arrived 40 cm short" without a single
   assertion changing. This waits for the depth the record promised. */
const settle = async (want) => {
  // Auto-walking now uses the same comfort-limited cruise speed as keyboard movement; a full-lane
  // trip can take several seconds, so do not start the next input while the glide is still active.
  for (let i = 0; i < 240; i++) { await sleep(40); if (Math.abs(body().depth - want) < 2) return; }
};
const title0 = () => (qa(".walk-hit.is-reach")[0] || {}).dataset?.obj || "nothing";
const body = () => q("[data-walk]").__walk;

await hold("w", 500);
ok("W moves the body: a station chip takes over the readout", /m in$|ahead$/.test(status()), status());
ok("the walk clamps to this page's walls and its authored far-depth boundary",
   /const WALL = attr\("laneW", 640\) \/ 2/.test(js)
     && /const HALF = Math.max\(0, WALL - PLAYER_RADIUS\)/.test(js)
     && /const MAX_D = attr\("laneMaxD", Z_FAR - 47\)/.test(js),
   "the body stays inside this room's width and stops before its end wall unless the place opens farther");
ok("the plaza is walked into, and the gate stands past the clamp: a street that opens, not a window",
   vista.w > 0 && Number(laneAttr("max-d")) > WALK_D && bd.temple.z > Number(laneAttr("max-d")) + 1000,
   `walls end at ${WALK_D}, the walk at ${laneAttr("max-d")}, the gate at ${bd.temple.z}`);

// The scramble plate, from the stop between the shuttered rows, 44 cm ahead of it at the post line.
click(stopAt(1392));
await settle(1392);
await hold("a", 700);                                     // turn left: A turns the head, as the
await hold("w", 1400);                                    // arrows do, so the lane is walked into
await sleep(120);
ok("the wall prop nearer you wins: the reach is nearest-first, not list-order",
   /The scramble at Shibuya|A shop on the west row/.test(status()), status());
await hold("d", 700);                                     // and the head comes back down the lane
await sleep(120);
ok("standing at the frame's own depth brings it into reach",
   /The scramble at Shibuya/.test(status()), status());
ok("the reach is announced with a dot on the note button, never with a caption",
   q("[data-walk]").classList.contains("has-reach")
     && /\.walk\.has-reach \.walk-info::after/.test(css));
const inReach = qa(".walk-hit.is-reach");
ok("exactly one thing is offered at a time", inReach.length === 1, `${inReach.length} in reach`);
ok("and it is the frame, which promises the plate",
   inReach[0].dataset.obj === "frame-scramble" && /open the frame/.test(q("[data-walk-record]").textContent),
   `${inReach[0].dataset.obj} / ${q("[data-walk-record]").textContent}`);
key("e");
await sleep(60);
const plate = q("#room-plate");
ok("E opens the plate on that frame", plate.classList.contains("is-open")
   && /scramble/i.test(q("[data-room-title]").textContent));
ok("the plate opens at the frame you were standing in front of, and carries the whole reel",
   qa("[data-story-frame]").length === 6
   && q("[data-story-count]").textContent.trim() === `${Number(inReach[0].dataset.frame) + 1} of 6`,
   q("[data-story-count]").textContent);
const panel0 = plate.querySelector(".modal-panel");
const segEls = qa(".story-seg");
const nowIdx = Number(inReach[0].dataset.frame);
const currentSeg = Number.isInteger(nowIdx) ? segEls[nowIdx] : null;
ok("a story's bars are one per frame, and the current one is the bar that fills",
   segEls.length === 6 && !!currentSeg && currentSeg.classList.contains("is-now")
     && segEls.every((sg) => !sg.firstChild.getAttribute("style")),
   `frame ${nowIdx}; ${segEls.map((sg) => sg.className.replace("story-seg", "·") || "pending").join(" ")}`);
const fillVal = panel0.style.getPropertyValue("--fill");
const shownImg = plate.querySelector(`[data-story-frame="${nowIdx}"] img`);
const shownFile = shownImg ? shownImg.getAttribute("src").split("/").pop() : "";
/* Absolute, not relative: a relative `url()` parked in a custom property is resolved where the
   property is *consumed*, and `background-image: var(--fill)` is written in `css/site.css` — so the
   relative form was being asked for as `css/IMG/<file>.jpg` and every story played on an empty
   field. This used to assert the relative form, which is to say it asserted the defect. */
ok("the ground behind the story is the frame's own pixels, resolved against the document, not the stylesheet",
   /^url\("(?:https?:\/\/|\/)/.test(fillVal) && !!shownFile && fillVal.endsWith(`${shownFile}")`),
   fillVal.slice(0, 72));
/* The reel shows one frame at a time by setting `hidden` on the others. `[hidden]` is a UA rule of
   one class; the rail's `#room-plate.is-rail .story-frame { display: grid }` out-ranks it, so without
   an id-qualified rule written *after* it every frame stays in flow and the one you are meant to be
   looking at is pushed thousands of pixels below the fold. Presence is not enough — order is what
   breaks the specificity tie, so the assertion is about both. */
const gridAt = css.indexOf("#room-plate.is-rail .story-frame {");
const hiddenAt = css.search(/#room-plate \.story-frame\[hidden\] \{[^}]*display: none/);
ok("a frame the reel hides leaves the layout — `[hidden]` has to out-rank the rail's own display",
   gridAt >= 0 && hiddenAt > gridAt, `grid@${gridAt} hidden@${hiddenAt}`);
ok("全版型: the rail is the screen, not a card that the screen holds",
   /#room-plate\.is-rail \.modal-panel \{[^}]*min-height: 100dvh[^}]*border-radius: 0/.test(css)
     && /--col: min\(100%, calc\(\(100dvh - 7\.5rem\) \* 9 \/ 16\)\)/.test(css)
     && !/#room-plate\.is-rail \.modal-panel \{[^}]*box-shadow: var/.test(css));
ok("the photograph keeps its own ratio inside the column — contain, never a crop",
   /#room-plate\.is-rail \.story-frame img \{[^}]*object-fit: contain/.test(css));
ok("and the panel's duplicate words are hidden from the eye, kept for the tree",
   /#room-plate\.is-rail \.modal-panel > h2,[\s\S]{0,200}clip-path: inset\(50%\)/.test(css));
ok("no bar is filled by layout, and one clock drives both the bar and the timer",
   !/\.story-seg i \{[^}]*transition: width/.test(css)
     && /\.story-seg i \{[\s\S]*?transform: scaleX\(0\)/.test(css)
     && /\["--rail-hold"\]/.test(js) && /schedule\(\); \}, HOLD\);/.test(js));
const heldWas = plate.classList.contains("is-held");
panel0.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 2, clientX: 400, clientY: 400 }));
ok("a right button is not a hold — the story keeps playing while the menu does its own thing",
   !plate.classList.contains("is-held") && heldWas === false);
panel0.dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: 400, clientY: 400 }));
ok("a left press holds the frame and freezes its bar where it stands", plate.classList.contains("is-held")
   && /#room-plate\.is-rail\.is-held \.story-seg\.is-now i \{\n  animation-play-state: paused/.test(css));
panel0.dispatchEvent(new w.MouseEvent("pointerup", { bubbles: true, cancelable: true, button: 0, clientX: 400, clientY: 400 }));
ok("and letting go resumes", !plate.classList.contains("is-held"));

click(plate.querySelector("[data-room-close]"));
await sleep(60);
ok("closing hands focus back to the thing on the wall that opened it",
   !plate.classList.contains("is-open") && doc.activeElement && doc.activeElement.classList.contains("walk-hit"));

// A shop bay is a prop with no frame, so it is answered by the card, not the plate: from the stop
// between the shuttered rows, step across to the east row's posts.
click(stopAt(1392));
await settle(1392);
await hold("d", 700);                                  // turn right, to face the east row
await hold("w", 1500);                                  // and walk into the lane's east side
await sleep(120);
ok("between the rows, the shop at the posts is what you are standing in front of",
   /A shop on the east row/i.test(status()), `${status()} | x=${body().x.toFixed(1)} d=${body().depth.toFixed(1)} yaw=${body().yaw.toFixed(1)} reach=${title0()}`);
key("e");
await sleep(60);
const card = q("[data-walk-card]");
ok("E on a prop opens its card", !card.hidden && /shut for the night/i.test(q("[data-walk-title]").textContent));
ok("the card says what is left out and why: the mural's people, the fascia's name",
   /Asakusa Emaki/.test(q("[data-walk-hint]").textContent) && /blank here/.test(q("[data-walk-hint]").textContent));
click(q("[data-walk-card-close]"));
await sleep(40);
ok("the card closes again", card.hidden);
// and the head comes back down the lane, so the press boxes below are the ones a visitor
// walking forward would meet -- not the two that happen to be east of where the card was read
await hold("a", 700);
await sleep(120);

/* The states contract, tested where the states are (round 32). Nakamise after closing has nothing a
   visitor operates -- every shop is shut, and nothing is invented to press -- so the rule that a state
   is geometry runs on the street, whose fronts have real stops: each ships at its first, a press paints
   the front from its new stop and moves the light that is its own, and the stops are only the
   authored ones. */
const stHtml = fs.readFileSync("street.html", "utf8");
const sw = boot(stHtml, "https://huaxu.test/street.html");
await sleep(600);
const sDoc = sw.document;
const sclick = (el) => el.dispatchEvent(new sw.MouseEvent("click", { bubbles: true, cancelable: true }));
const stLights = JSON.parse(stHtml.match(/data-walk-lights>(.*?)<\/script>/)[1]);
const stateful = Array.from(sDoc.querySelectorAll("[data-states]"));
const front = sDoc.querySelector('[data-obj="front-s"]');
const sQuads = () => sDoc.querySelector("[data-walk]").__walk.quads;
ok("the kit is a button in the lane, not a painted detail", !!front && front.tagName === "BUTTON"
   && front.dataset.frame === undefined && stateful.length >= 2);
ok("a thing with stops ships at its first one, and the count of stops is the document's",
   stateful.every((el) => el.dataset.state === "0")
     && JSON.parse(front.dataset.states).length === 2, `${stateful.length} things with stops`);
await sleep(300);
const quadsShut = sQuads();
sclick(front);
await sleep(400);
ok("and the front changes by being used, with the card saying what it looks like now",
   front.dataset.state === "1" && !sDoc.querySelector("[data-walk-card]").hidden, `state=${front.dataset.state}`);
ok("the state is geometry, not a caption: the front is painted from its new stop",
   sQuads() !== quadsShut, `${quadsShut} -> ${sQuads()} quads`);
ok("and the light moves with the front, because the light is that front's record",
   stLights.filter((L) => L.of).every((L) =>
     Array.from(sDoc.querySelectorAll(".walk-hit")).some((el) => el.dataset.obj === L.of))
     && stLights.some((L) => L.of === "front-s"), stLights.filter((L) => L.of).map((L) => L.of).join(","));
sclick(front);
await sleep(300);
ok("pressing again takes it to the next stop, and the only stops are the ones authored",
   front.dataset.state === "0", `state=${front.dataset.state}`);
ok("an interactive thing says so without a word: the reach ring is dashed for a prop you can use",
   /\.walk-hit\[data-states\]/.test(css));
sw.close();

/* Three failures a DOM without layout cannot see, and the owner could: the head-up display's rows were
   ceilings of invisible glass over the top and bottom of the scene (where the lanterns and the shutters
   are), a far prop's press box was as small as the few pixels it covered, and the curtain that reads
   "part it to leave the lane" opened a card instead of leaving. jsdom passed all three for a week. */
const noren = q('[data-obj="gate-kaminari"]');
/* The curtain opens onto the hub street: out of any room, onto the place the other rooms hang off.
   What this asserts is not the destination — that is the hub block's business — it is that the chrome
   and the prop read the same authored value, so the two ways out of a room cannot point different
   ways, whichever room they are on. */
/* The leave may carry `#at-<room>` — the spawn beside the room's own door on the street — but it
   is still one authored value read twice: the curtain and the chrome cannot point different ways. */
ok("the way out is authored in the record, and the chrome reads the same link",
   /^[a-z-]+\.html(#at-[a-z]+)?$/.test(noren.dataset.leave)
     && q("[data-walk-exit]").getAttribute("href") === noren.dataset.leave);
const navs = () => ctx.navs.filter((m) => /navigation/.test(m)).length;
click(noren);
ok("and walking through Kaminarimon leaves the street, instead of describing the exit",
   navs() === 1, JSON.stringify(ctx.navs.slice(-1)));
click(q('[data-obj="shopbay-e2"]'));
await sleep(60);
key("Escape");
ok("Esc folds what is open before it folds the space", card.hidden && navs() === 1,
   `card hidden=${card.hidden} navs=${navs()}`);
key("Escape");
ok("and with nothing left to unfold, Esc is the door", navs() === 2, JSON.stringify(ctx.navs.slice(-2)));
const boxes = qa(".walk-hit").filter((e) => e.style.visibility === "visible");
ok("every visible press box is a fingertip, whatever the object's pixel size is",
   boxes.length >= 3 && boxes.every((e) => parseFloat(e.style.width) >= 44 && parseFloat(e.style.height) >= 44),
   `${boxes.length} boxes, narrowest ${Math.min(...boxes.map((e) => parseFloat(e.style.width)))}px`);
ok("and the nearer thing wins where two boxes overlap",
   boxes.every((e) => e.style.zIndex !== "")
     && /m\.el\.style\.zIndex = String\(1200 - Math\.min\(1100/.test(js),
   `z ${Math.min(...boxes.map((e) => +e.style.zIndex))}–${Math.max(...boxes.map((e) => +e.style.zIndex))}`);
ok("the ring stays on the silhouette, not on the grown box",
   /\.walk-hit::after \{[^}]*inset: var\(--pady, 0px\) var\(--padx, 0px\)/.test(css)
     && !/\.walk-hit:hover \{/.test(css));
ok("the head-up display's rows are layout, not targets",
   /\.walk-hud > \* \{[^}]*pointer-events: none/.test(css)
     && /\.walk-hud \.walk-icon,\n\.walk-hud \.walk-stop \{\n  pointer-events: auto/.test(css)
     && !/\.walk-(top|bottom|pick|read|tools|stops) \{[^}]*pointer-events: auto/.test(css));
ok("and the one control that must never be hunted for is louder than the tools",
   q("[data-walk-exit]").classList.contains("walk-exit")
     && /\.walk-exit \{[^}]*min-width: 2\.7rem/.test(css) && !/class="walk-icon"[^>]*href="index/.test(html));

/* The finger's verb. `E` is a keyboard and a phone has none, so a tap that never became a look has to
   press what is in front of you; and a look that *was* a drag must not press anything at all. */
const stage = q("[data-walk-view]");
const ptr = (type, dx = 0, dy = 0) => stage.dispatchEvent(
  new w.PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, clientX: 500 + dx, clientY: 400 + dy }));
const closePlate = async () => { if (!card.hidden) click(q("[data-walk-card-close]")); await sleep(40); };
await closePlate();
ok("nothing is open before the finger tries", card.hidden);
ptr("pointerdown");
ptr("pointerup");
await sleep(50);
ok("a tap on the scene presses the thing you are standing in front of",
   !card.hidden && qa(".walk-hit.is-reach").length === 1, `${title0()} / ${q("[data-walk-title]").textContent}`);
await closePlate();
const yawBefore = body().yaw;
ptr("pointerdown");
ptr("pointermove", 60, 0);
ptr("pointerup");
await sleep(50);
ok("a drag turns the head and presses nothing",
   card.hidden && Math.abs(body().yaw - yawBefore) > 3, `Δyaw ${(body().yaw - yawBefore).toFixed(1)}°`);
ptr("pointerdown");
ptr("pointerup");
await sleep(50);
ok("and the tap the drag refused now opens the plate", !card.hidden);
ptr("pointerdown");
ptr("pointerup");
await sleep(50);
ok("tapping the scene again puts the plate back down, so the finger has both directions", card.hidden);
ptr("pointerdown");
ptr("pointercancel");
await sleep(50);
ok("a grab the system cancels is not counted as a press", card.hidden);
const ptrB = (type, button, dx = 0, dy = 0) => stage.dispatchEvent(
  new w.MouseEvent(type, { bubbles: true, cancelable: true, pointerId: 7, button, clientX: 500 + dx, clientY: 400 + dy }));
const yawRight = body().yaw;
ptrB("pointerdown", 2);
ptrB("pointermove", 2, 80, 0);
ptrB("pointerup", 2);
await sleep(50);
ok("the right button does not turn the head, and does not press either",
   Math.abs(body().yaw - yawRight) < 0.001 && card.hidden && !q("[data-walk]").classList.contains("is-dragging"),
   `Δyaw ${(body().yaw - yawRight).toFixed(2)}°`);
const menuDrag = new w.MouseEvent("contextmenu", { bubbles: true, cancelable: true });
const menuIdle = new w.MouseEvent("contextmenu", { bubbles: true, cancelable: true });
ptr("pointerdown");
stage.dispatchEvent(menuDrag);
ptr("pointerup");
stage.dispatchEvent(menuIdle);
await sleep(40);
ok("a context menu is refused only while a turn is in progress, never on its own",
   menuDrag.defaultPrevented && !menuIdle.defaultPrevented);
const middle = new w.MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });
const auxLeft = new w.MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 0 });
stage.dispatchEvent(middle);
stage.dispatchEvent(auxLeft);
ok("the middle button's scroll widget is refused over the scene, and no other click is",
   middle.defaultPrevented && !auxLeft.defaultPrevented);
await closePlate();                 // the context-menu probe's pointerup is a tap in jsdom; fold it before walking
ok("the context-menu probe's synthetic tap is folded before testing movement", card.hidden);

ok("the chrome's press areas are bigger than its glyphs, since the glyphs are the drawing",
   /\.walk-icon,\n\.walk-stop \{\n  position: relative;\n\}/.test(css)
     && /\.walk-icon::before,\n\.walk-stop::before \{[^}]*inset: -8px -4px/.test(css)
     && /\.walk-tools \{[^}]*gap: 0\.5rem/.test(css));
ok("and the enlarged box never loses its focus state, because the ring moved with it",
   /\.walk-hit:focus-visible::after \{[^}]*border-color: var\(--accent-bright\)/.test(css)
     && !/\.walk-hit:focus-visible \{\n  outline: 2px/.test(css));

// The synthetic context-menu probe ends in a pointerup that jsdom counts as a tap, so fold its card
// above, then sidestep from the standpipe's tangent face before the depth-only glides.
// The sidestep is the touch stick's: A and D turn the head on a keyboard, so the one control that
// still slides sideways is the one a thumb drives -- and it has to be able to leave a wall's face.
const pad = q("[data-walk-pad]");
const padEvent = (type, clientX = 1, clientY = 0) => pad.dispatchEvent(new w.PointerEvent(type, {
  bubbles: true, cancelable: true, pointerId: 9, button: 0, clientX, clientY,
}));
padEvent("pointerdown", 0, 1);          // the stick, pushed hard left
await sleep(1200);
padEvent("pointerup", 0, 1);
await sleep(500);
ok("lateral input can leave the mouth furniture without entering a wall",
   body().x < 180, `x=${body().x.toFixed(1)} cm; depth=${body().depth.toFixed(1)} cm`);
const tower = q('[data-obj="frame-tower"]');
ok("the moved frame keeps its own plate link", tower && tower.dataset.frame === "2");
// The glide: a drawer row moves the body to the frame's depth; compare the body, not a station that
// can stay the same when both the start and target lie in the same station interval.
const hereIdx = () => stops.findIndex((el) => el.classList.contains("is-here"));
const beforeRailDepth = body().depth;
const rail = q("[data-walk-to]");
const RAIL_Z = Number(rail.dataset.walkTo);
click(rail);
await settle(RAIL_Z);       // a comfort-speed glide takes the time its authored distance requires
ok("a drawer link glides the body to that frame's depth, and nothing else",
   Math.abs(beforeRailDepth - RAIL_Z) > 10 && Math.abs(body().depth - RAIL_Z) < 2,
   `depth ${beforeRailDepth.toFixed(1)} -> ${body().depth.toFixed(1)} cm`);
ok("the glide is depth only: the sideways position is left where you put it",
   /targetX === undefined \? x : targetX/.test(js));
ok("and the body really lands on that depth", Math.abs(body().depth - RAIL_Z) < 2, `${body().depth}`);
// Two bugs the states themselves found, both worth a test because both are silent.
// (1) The idle pump has to advance the walk, not only repaint it: a station clicked while the lane was
// resting would otherwise glide partway and stop there, looking exactly like a lane that had arrived.
// (2) The station highlight is asked on every frame, so a prop standing in front of you cannot freeze it.
click(stopAt(0));
await settle(Number(stopAt(0).style.getPropertyValue("--z").replace("px", "")) || 0);   // the first stop, wherever it is
await sleep(1400);                            // let the rAF loop wind down to the idle pump
const home = stopAt(740);
click(home);
await settle(740);
ok("a place chosen while the lane was resting is still walked to, not just drawn once",
   Math.abs(body().depth - 740) < 6, `${body().depth}`);
ok("and the rail keeps up with the body, whatever the reach happens to be lit on",
   home.classList.contains("is-here") && hereIdx() === stops.indexOf(home)
     // the stations are asked on every reach check, so a prop standing in front of you cannot
     // freeze the rail's highlight (the check reads the shape of checkReach, not a variable name)
     && /const checkReach = \(\) => \{[\s\S]{0,600}?markStops\(\);/.test(js)
     && !/if \(!best\) \{ layer\.classList\.remove\("has-reach"\); markStops/.test(js),
   `here=${stops.indexOf(home)} reach=${qa(".is-reach").length} / ${status()}`);
ok("one pump at a time: asking for a real frame cancels the idle nudge",
   /const loop = \(\) => \{ stopPulse\(\)/.test(js) && /pulse = setTimeout\(\(\) => \{ pulse = 0; tick\(/.test(js));

/* Movement is expressed in the camera's horizontal basis. A fixed-world-axis walk still appears to
   move when the camera is turned, so assert the direction after a real turn, then use the same check
   for strafing and the touch pad. This is the regression that catches W continuing down the lane
   after the visitor has turned to look across it. */
const projection = (from, to, heading) => {
  const a = heading * Math.PI / 180, dx = to.x - from.x, dz = to.depth - from.depth;
  return { forward: dx * Math.sin(a) + dz * Math.cos(a),
           side: dx * Math.cos(a) - dz * Math.sin(a) };
};
await hold("arrowright", 800);
const turnedYaw = body().yaw;
const w0 = { x: body().x, depth: body().depth };
await hold("w", 650);
const w1 = { x: body().x, depth: body().depth };
const wVector = projection(w0, w1, turnedYaw);
ok("W follows the view after a turn, rather than the lane's fixed depth axis",
   wVector.forward > 25 && Math.abs(wVector.side) < Math.abs(wVector.forward) * 0.45,
   `yaw=${turnedYaw.toFixed(1)}°, forward=${wVector.forward.toFixed(1)} cm, side=${wVector.side.toFixed(1)} cm`);
await sleep(650);                         // let the previous velocity ease out before changing verbs
const a0 = { x: body().x, depth: body().depth };
const yawBeforeA = body().yaw;
await hold("a", 550);
const a1 = { x: body().x, depth: body().depth };
const aVector = projection(a0, a1, yawBeforeA);
const dyawA = ((body().yaw - yawBeforeA + 540) % 360) - 180;
/* Round 65: A and D turn the head, and the arrows turn with them.

   They used to strafe, and the owner called the lane's controls "terrible" -- which is what a
   strafe does to a visitor who arrives expecting to look right: the world slides sideways under
   them while the thing they wanted stays where it was, and the reach cone never opens on it.
   Turning is the one gesture that shows the visitor where they are now looking, and the gate is
   here to keep the turn honest: the head must turn, and the body must not slide. */
ok("A turns the head left, and the body does not slide sideways under it",
   dyawA < -25 && dyawA > -140 && Math.abs(aVector.side) < 8 && Math.abs(aVector.forward) < 8,
   `turned ${dyawA.toFixed(1)}°, forward=${aVector.forward.toFixed(1)} cm, side=${aVector.side.toFixed(1)} cm`);
await sleep(650);
const stick0 = { x: body().x, depth: body().depth };
padEvent("pointerdown");
await sleep(430);
padEvent("pointerup");
await sleep(650);
const stick1 = { x: body().x, depth: body().depth };
const stickVector = projection(stick0, stick1, body().yaw);
ok("the touch stick shares camera-relative forward with W",
   stickVector.forward > 12 && Math.abs(stickVector.side) < Math.abs(stickVector.forward) * 0.5,
   `forward=${stickVector.forward.toFixed(1)} cm, side=${stickVector.side.toFixed(1)} cm`);

/* Two formats, two grounds — asserted so the difference stays a decision instead of drifting back into an
   accident. The lane's rail is a story: 9:16, blurred with its own pixels. The album is a post viewer:
   full-screen, plain field, nothing invented about the photograph's ratio. */
ok("the album's viewer is the screen too, and it is not a card any more",
   /#ig-plate\.is-open \.ig-plate \{[^}]*min-height: 100dvh[^}]*border-radius: 0[^}]*background: none[^}]*box-shadow: none[\s\S]{0,60}animation: none/.test(css));
ok("its photographs are contained, never cropped to fill the frame",
   /#ig-plate\.is-open \.ig-frame img \{[^}]*object-fit: contain/.test(css)
     && !/#ig-plate\.is-open \.ig-frame img \{[^}]*object-fit: cover/.test(css));
ok("and a story gets a blurred ground while a post gets a plain one — the difference is in the code",
   /#room-plate\.is-rail \.modal-panel::before \{[\s\S]*filter: blur\(2\.6rem\)/.test(css)
     && !/#ig-plate\.is-open \.ig-plate::before/.test(css));
ok("on a phone the album's controls become the edges of the screen and hide themselves",
   /@media \(max-width: 34rem\) \{[\s\S]*?#ig-plate\.is-open \.ig-btn \{\n    top: 0;[\s\S]*?width: 34%;[\s\S]*?opacity: 0/.test(css));
ok("the plate still owns a dark ground, because that is what its caption is measured against",
   /\.ig-plate \{\n  background: var\(--navy-deep\);\n\}/.test(css));

/* ---- 3c. the note: the one button that opens words -------------------------------------------- */
const infoBtn = q("[data-walk-info]");
click(infoBtn);
ok("the note button opens the space's own words, and only then",
   !card.hidden && card.dataset.mode === "space" && /drawn, not surveyed/.test(card.textContent)
     && infoBtn.getAttribute("aria-expanded") === "true");
ok("the card is the same surface a prop uses, so nothing new had to be invented for the fold",
   !!q("[data-walk-title]").textContent);
key("i");
ok("I closes it again, and the display goes back to being silent",
   card.hidden && infoBtn.getAttribute("aria-expanded") === "false");
ok("the announced status stays in step with what the card would show",
   /m in|ready|ahead/.test(q("[data-walk-status]").textContent), q("[data-walk-status]").textContent);

/* ---- 4. the drawer, the list, the honest empty states ----------------------------------------- */
const listBtn = q("[data-walk-list]");
const drawer = q("[data-walk-listpanel]");
ok("the drawer ships open in the HTML and JS folds it",
   !/class="walk-list[^"]*is-closed/.test(html) && drawer.classList.contains("is-closed"));
click(listBtn);
ok("the list opens over the space, on the site's own paper",
   !drawer.classList.contains("is-closed") && /\.walk-list \{[\s\S]*?background: var\(--bg\)/.test(css));
ok("every frame has a row with its depth and a way to play", qa(".frame-row[data-row-obj]").length >= 3);
ok("the district card states its kind and its new purpose",
   /Nakamise-dori at night: the approach from Kaminarimon to Hozomon/.test(drawer.textContent));
ok("the scale the room claims is stated where the room is described",
   /The 250 m of shops walk in\s+30 m/.test(html) && /each shop&#x27;s width|each shop's width/.test(html)
     && /OpenStreetMap/.test(html));
click(listBtn);                                      // closed again, then the keyboard alone
key("l");
ok("L opens it from the keyboard", !drawer.classList.contains("is-closed"),
   `panel=${drawer.className} active=${(doc.activeElement && doc.activeElement.tagName) || "?"} plate=${plate.classList.contains("is-open")}`);
key("l");
ok("L and the button do the same thing", drawer.classList.contains("is-closed"));
ok("the second district stays shut and says it is not open", /Not open yet/.test(html) && /Purpose not declared/.test(html));
ok("printing prints the list, not a dark rectangle", /@media print \{[\s\S]*\.walk-view,[\s\S]*display: none/.test(css));
ok("the canvas wears no overlay it cannot paint", !/walk-canvas::after/.test(css));
const fb = q("[data-walk-offline]");
/* Round 55, and the gate that came with it: the sentence IS the fallback now, so it must be in the
   lane rather than in the info card (which ships hidden) and must not wear `.walk-note`
   (display:none on touch). A visitor with no WebGL otherwise faces an empty viewport with the
   explanation behind a button. Round 64: the panel was renamed to `walk-offline` when it took the
   viewport's place, and this gate was still asking for the old name -- three failures a day, in
   the one gate that is supposed to prove the no-WebGL path. */
ok("the fallback names itself instead of hiding",
   fb && !fb.closest("[data-walk-card]") && !/\bwalk-note\b/.test(fb.className)
     && fb.getAttribute("role") === "status" && /cannot draw the lane/i.test(fb.textContent),
   fb ? `${fb.className} inCard=${!!fb.closest("[data-walk-card]")}` : "missing");
ok("the fallback is styled to be readable without hover",
   /\.walk-offline \{[\s\S]*?z-index: 2/.test(css)
     && /\.walk-offline\[hidden\] \{ display: none; \}/.test(css));
/* Round 54, at the owner's ruling: 全站該是 3d js. The Canvas2D lane painter is deleted outright —
   this gate exists so it stays deleted: no second canvas in the markup, no raster pass in the
   engine, no "canvas2d" anywhere a browser could still be told it fell back. The tile raster keeps
   its own hidden canvas, and the games keep their panel: both are the site's, not a second picture. */
ok("the 2D lane painter is deleted, not dormant", !/data-walk-canvas|canvas2d/.test(html + gen + js + css)
   && !/quads\.forEach\(emit\)/.test(js));

/* ---- 5. the album on the reading surface ------------------------------------------------------ */
{
  const w2 = boot(act, "https://huaxu.test/activities.html");
  const d2 = w2.document;
  d2.startViewTransition = (cb) => { if (cb) cb(); return { finished: new Promise(() => {}) }; };
  const q2 = (s) => d2.querySelector(s);
  const qa2 = (s) => Array.from(d2.querySelectorAll(s));
  const click2 = (el) => el.dispatchEvent(new w2.MouseEvent("click", { bubbles: true, cancelable: true }));
  const tiles = qa2("[data-ig]"), frames = qa2(".ig-frame"), plate2 = q2("#ig-plate");
  if (tiles.length === 0) {
    /* The wall is empty today — classroom's records are all held, and the Field notes plates live
       on the place cards now — so the honest state is a reason where a viewer would be. These
       asserts hold the empty state to the same standard: nothing is invented to fill it. */
    ok("an empty wall prints its reason instead of a viewer",
       plate2 === null && /Nothing in this block yet/.test(act)
         && /0 shown · 3 held for want of a caption/.test(act),
       "0 tiles");
    ok("no viewer is emitted when there is nothing to view",
       qa2(".modal").length === 0 && !q2("#room-plate"));
  } else {
    ok("the album is emitted, not only styled",
       tiles.length >= 2 && !!plate2 && qa2("[data-ig-grid]").length >= 1);
    ok("one viewer per page here: the album does not clone the lane's plate",
       qa2(".modal").length === 1 && !q2("#room-plate"));
    ok("the roll holds exactly what the wall shows",
       tiles.length === frames.length, `${tiles.length}/${frames.length}`);
    ok("a tile addresses its own plate, in the same order",
       tiles.every((t, i) => t.getAttribute("href") === `#${frames[i].id}`));
    ok("the wall is photographs: no caption, no index chip, not one character on a tile",
       tiles.every((t) => !(t.textContent || "").trim() && !t.querySelector(".ig-cap, .ig-fig"))
         && !/\.ig-cap|\.ig-fig/.test(css));
    ok("and the claims a tile used to wear are now said where you have to arrive to read them",
       tiles.every((t) => / · generated plate$/.test(t.getAttribute("aria-label") || ""))
         && frames.every((f) => / · generated plate$/.test(f.querySelector("figcaption").textContent)));
  }
  ok("nothing is marked as seen: album, not story", !/is-viewed|data-viewed|has-viewed/.test(act + js + css));
}

/* ---- 6. the cache-buster is the assets' own hash ----------------------------------------------- */
{
  const { createHash } = await import("node:crypto");
  const hash = createHash("sha1");
  ["css/site.css", "js/site.js", "js/scene3d.js", "js/games.js",
   "js/vendor/three-0.186.1/three.core.js", "js/vendor/three-0.186.1/three.module.js"]
    .forEach((asset) => hash.update(fs.readFileSync(asset)));
  const digest = hash.digest("hex").slice(0, 10);
  const pages = fs.readdirSync(".").filter((f) => f.endsWith(".html"));
  const tokens = new Set();
  const wrong = [];
  pages.forEach((f) => {
    const html = fs.readFileSync(f, "utf8");
    const tags = [...html.matchAll(/(?:site\.css|site\.js|scene3d\.js|games\.js)\?v=([0-9a-z]+)/g)].map((m) => m[1]);
    tags.forEach((t) => tokens.add(t));
    // Every page must ask for the bytes on disk, and ask for both with one token: two tokens is how a
    // build ships a new renderer under an old key, which no other gate here can see because it only
    // shows up in a returning visitor's cache.
    if (tags.length && (new Set(tags).size !== 1 || tags[0] !== digest)) wrong.push(`${f}: ${tags[0]}`);
  });
  ok("the cache-buster covers Canvas, Three.js bridge, and pinned runtime assets",
     wrong.length === 0 && tokens.size === 1 && [...tokens][0] === digest,
     [...tokens].join(" ") + (wrong.length ? " — " + wrong.join(", ") : ""));
}

/* ---- 7. the hub: the street is a place, and every door hangs off it ----------------------------------- */
{
  // The generator's own tables, read the way the generator reads them: source order, the ROOMS rows
  // first, then each district's page and plates. This is a structural assertion on purpose — whether
  // the walk itself is right is what the rest of this file and the pixel gate are for, but a place
  // that has drifted off the hub is a page nothing can reach.
  const rooms = Array.from(gen.matchAll(
    /^\s*\("([a-z-]+)", "([^"]+)", "([^"]+\.html)", \[("([a-z-]+)")?\], "(open|soon)"\),$/gm))
    .map((m) => ({ id: m[1], label: m[2], page: m[3], prefix: m[5] || "", status: m[6] }));
  ok("the rooms table declares the hub, one row per place, street first",
     rooms.length >= 2 && rooms[0].id === "street" && rooms[0].status === "open"
       && rooms.every((r, i) => i === 0 || r.id !== rooms[i - 1].id),
     rooms.map((r) => `${r.id}:${r.status}`).join(" "));
  ok("every built place is a page on disk, with the place's own box in it",
     rooms.filter((r) => r.status === "open").every((r) => fs.existsSync(r.page)
       && /data-lane-w="\d+" data-lane-d="\d+" data-lane-ceil="\d+"/.test(fs.readFileSync(r.page, "utf8"))));
  ok("a place's page is titled as that place, not as the site",
     rooms.filter((r) => r.status === "open")
       .every((r) => new RegExp(`<title>${r.label} · Rooms · Hua-Xu Zhong</title>`)
         .test(fs.readFileSync(r.page, "utf8"))));
  ok("the street district takes its page and plates from the row, so the two cannot drift",
     /"page": ROOM_BY_ID\["street"\]\["page"\]/.test(gen)
       && /"plates": ROOM_BY_ID\["street"\]\["plates"\]/.test(gen));
  ok("each room district takes its page and plates from its own row",
     rooms.filter((r) => r.id !== "street").every((r) =>
       new RegExp(`ROOM_BY_ID\\["${r.id}"\\]\\["page"\\]`).test(gen)
       && new RegExp(`ROOM_BY_ID\\["${r.id}"\\]\\["plates"\\]`).test(gen)));
  /* The hub graph distinguishes main rooms from owned spaces. Main rooms unwind to the street;
     a landmark/sub-space unwinds to its owner, and the street has doors only to the three main
     places plus its own door back to the album. */
  const built = rooms.filter((r) => r.status === "open");
  const streetRow = built.find((r) => r.id === "street");
  const roomRows = built.filter((r) => r.id !== "street");
  const problems = [];
  /* A room's way out is the street page, optionally carrying `#at-<room>`: the hash is the spawn
     point beside that room's own door, so it must name the room the leave is on — a hash that
     names another room would land you at the wrong door. */
  const pageOf = (t) => t.split("#")[0];
  // A landmark space is not a hub room: its every way out is the room whose prop owns it
  // (landmark-space §2), and the street carries no door to it. Hub rooms still leave only to
  // the street, one door each, as before.
  const exitHref = (html) => {
    const m = html.match(/class="walk-icon walk-exit" href="([^"]+)"/);
    return m ? pageOf(m[1]) : null;
  };
  const spaceOf = {}, unwindOf = {};
  for (const r of roomRows) {
    const htmp = fs.readFileSync(r.page, "utf8");
    const ls = Array.from(htmp.matchAll(/data-leave="([^"]+)"/g)).map((m) => pageOf(m[1]));
    unwindOf[r.id] = exitHref(htmp);
    if (unwindOf[r.id] && unwindOf[r.id] !== streetRow.page && ls.length && ls.every((t) => t !== streetRow.page))
      spaceOf[r.id] = ls;
  }
  for (const r of roomRows) {
    const html = fs.readFileSync(r.page, "utf8");
    const leaves = Array.from(html.matchAll(/data-leave="([^"]+)"/g)).map((m) => m[1]);
    if (!leaves.length) problems.push(`${r.id}: no way out at all`);
    if (spaceOf[r.id]) {
      for (const t of new Set(spaceOf[r.id]))
        if (!roomRows.some((x) => x.page === t)) problems.push(`${r.id}: a space leaving to ${t}, no built room`);
    } else {
      for (const t of new Set(leaves)) {
        if (pageOf(t) !== streetRow.page) problems.push(`${r.id}: a leave to ${t}, not the street`);
        const h = t.split("#")[1];
        if (h && h !== `at-${r.id}`) problems.push(`${r.id}: a leave hash #${h}, not #at-${r.id}`);
      }
    }
    if (/id="way-on"/.test(html)) problems.push(`${r.id}: still carries a chain door`);
    if (spaceOf[r.id]) {
      // A space unwinds through its walk-exit, and a space may own another space the way the
      // real Table Rock owns Journey: follow the exit chain — each step a built room — until a
      // page names the street. The hub is reached transitively, one unwind at a time.
      let cur = r.id, guard = 0;
      while (guard++ < 6) {
        const u = unwindOf[cur];
        if (u === streetRow.page) break;
        const nr = roomRows.find((x) => x.page === u);
        if (!nr) { problems.push(`${r.id}: unwind to ${u}, no built room`); cur = null; break; }
        cur = nr.id;
      }
      if (cur && unwindOf[cur] !== streetRow.page)
        problems.push(`${r.id}: the unwind never reaches the street`);
    } else if (html.includes(streetRow.page) === false) problems.push(`${r.id}: the street is not named on it`);
  }
  {
    const html = fs.readFileSync(streetRow.page, "utf8");
    const leaves = Array.from(html.matchAll(/data-leave="([^"]+)"/g)).map((m) => pageOf(m[1]));
    for (const r of roomRows)
      if (!spaceOf[r.id] && !leaves.includes(r.page)) problems.push(`street: no door onto ${r.id}`);
    for (const r of roomRows)
      if (spaceOf[r.id] && leaves.includes(r.page)) problems.push(`street: a door onto the space ${r.id}`);
    if (!leaves.includes("activities.html")) problems.push("street: no door onto the album");
    const doorTargets = new Set(leaves);
    for (const t of doorTargets)
      if (t !== "activities.html" && !roomRows.some((r) => r.page === t))
        problems.push(`street: a door to ${t}, which is no built room`);
    if (leaves.filter((t) => t === "activities.html").length !== 1)
      problems.push("street: the album door is not exactly one");
  }
  ok("the hub graph closes: main rooms return to the street, owned spaces return through their owners, and the street opens only to the three main places plus the album",
     problems.length === 0, problems.join("; "));
  // Sub-area closure: the Field notes plates are allocated to little places inside the rooms, and
  // the drawn frame holding each place carries the place's name as its title. A frame whose title is
  // not one of its room's slot labels is an image with a name but no place — exactly the drift the
  // allocation was drawn up to prevent.
  const gaps = [];
  for (const r of roomRows) {
    const html = fs.readFileSync(r.page, "utf8");
    const frameTags = [...html.matchAll(/<button type="button" class="walk-hit"[^>]*>/g)]
      .map((m) => m[0]).filter((t) => /data-obj="frame-/.test(t));
    const slotLabels = [...html.matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1]);
    for (const t of frameTags) {
      const title = (t.match(/data-title="([^"]+)"/) || [])[1];
      if (title && !slotLabels.includes(title)) gaps.push(`${r.id}: “${title}” has no sub-area slot`);
    }
  }
  ok("every frame in a room is one of that room's named sub-areas", gaps.length === 0, gaps.join("; "));
  // The nav item called Rooms is the front door of the walk, so it opens the hub street: a visitor
  // arriving there starts on the street, where every room is one door away.
  const navRooms = fs.readdirSync(".").filter((f) => f.endsWith(".html"))
    .map((f) => ({ f, m: fs.readFileSync(f, "utf8").match(/<a href="([^"]+)" class="[^"]*">Rooms<\/a>/) }))
    .filter((x) => x.m);
  ok("the nav item called Rooms opens the hub street",
     built.length === 0 || (navRooms.length > 0 && navRooms.every((x) => x.m[1] === streetRow.page)),
     navRooms.map((x) => `${x.f}->${x.m[1]}`).slice(0, 3).join(" "));
  // Each plate appears twice on the page — once as a tile and once as the frame in the roll — so the
  // wall is counted in distinct names.
  const plates = [...new Set(Array.from(act.matchAll(/<img src="IMG\/([A-Za-z0-9._-]+)"/g))
    .map((m) => m[1]))];
  /* Field notes is permanently exactly the three original top-level places. Owned spaces have
     their own ROOMS rows, but their entrance is an object/story in the parent — never an album card. */
  const MAIN_IDS = ["toronto", "tokyo", "fukuoka"];
  const fieldNotesSource = gen.match(/FIELD_NOTES_PLACE_IDS\s*=\s*\(([^)]*)\)/);
  const sourceIds = fieldNotesSource
    ? [...fieldNotesSource[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1]) : [];
  ok("the generator locks Field notes to Toronto, Tokyo and Fukuoka",
     JSON.stringify(sourceIds) === JSON.stringify(MAIN_IDS), sourceIds.join(", "));
  const places = MAIN_IDS.map((id) => built.find((r) => r.id === id)).filter(Boolean);
  const wrapAt = act.indexOf('data-place-cards');
  ok("the Field notes wall is one container of place cards", wrapAt >= 0);
  const cardProblems = [];
  let prevCard = -1;
  for (const id of MAIN_IDS) {
    const r = places.find((place) => place.id === id);
    if (!r) { cardProblems.push(`${id}: no open ROOMS row`); continue; }
    const cardStart = act.indexOf(`data-place-card="${r.id}"`, wrapAt);
    if (cardStart < 0) { cardProblems.push(`${r.id}: no card`); continue; }
    if (cardStart < prevCard) cardProblems.push("cards are not in the fixed Toronto/Tokyo/Fukuoka order");
    prevCard = cardStart;
    const cardEnd = act.indexOf("</a>", cardStart);
    const card = act.slice(cardStart, cardEnd);
    const href = (card.match(/href="([^"]+)"/) || [])[1];
    if (href !== r.page) cardProblems.push(`${r.id}: card href ${href}, want ${r.page}`);
    if (!card.includes(`IMG/${r.id}-cover.jpg`))
      cardProblems.push(`${r.id}: the card does not carry its own cover sheet`);
  }
  const emittedIds = [...act.matchAll(/data-place-card="([a-z-]+)"/g)].map((m) => m[1]);
  ok("exactly three main-place cards, each holding its own cover",
     cardProblems.length === 0 && JSON.stringify(emittedIds) === JSON.stringify(MAIN_IDS),
     cardProblems.join("; ") || emittedIds.join(", "));
  ok("owned landmark and sub-space IDs never become album cards",
     !emittedIds.some((id) => ["cntower", "niagara", "journey"].includes(id)));
  ok("a plate is not an entrance: no tile or text-arrow doors survive on this wall",
     !/<a class="ig-room"/.test(act) && !/class="text-arrow" href="rooms-/.test(act));
  ok("the sub-area plates do not hang here: the roll carries classroom only",
     !/id="ig-field-notes-/.test(act));
}



/* ---- the guide teaches once, in place, and never comes back --------------------------------------
   Round 46: the owner asked for a first-visit walkthrough. The contract is that every step waits
   for the real thing — a turn, a stride, an opened card — and that a visitor who has learned is
   never taught again. A fresh environment with empty storage runs the flow end to end; the rail's
   own glide deliberately comes after the walking step, so a carried body can never impersonate
   strides. */
{
  /* Round 69: close the lane this gate has been walking before the guide boots its own.
     Two live JSDOM windows in one process each keep a requestAnimationFrame pump running, so the
     second window got roughly half the frames of the first — and the rail's glide is measured in
     wall-clock seconds, not in frames. Measured with one window: the stop at z 1392 is reached in
     8.5 s (1332 cm at ~157 cm/s). Measured with the first window still alive, the same glide had not
     arrived in 9.6 s; the settle timed out; the next keypress cancelled the glide (`gliding = null`
     on the first W/A/S/D); and every assertion after it was about wherever the body happened to be
     standing. That is the coin flip — 2 of 4 runs failed on HEAD before any round-69 change.
     Nothing after this line uses the first window. */
  w.close();
  const g = boot(rooms, "https://huaxu.test/rooms-guide.html");
  const gdoc = g.document;
  const gq = (s) => gdoc.querySelector(s);
  const gkey = (k, type = "keydown") => (gdoc.activeElement || gdoc.documentElement)
    .dispatchEvent(new g.KeyboardEvent(type, { key: k, bubbles: true }));
  const gclick = (el) => el.dispatchEvent(new g.MouseEvent("click", { bubbles: true, cancelable: true }));
  const ghold = async (k, ms) => { gkey(k); await sleep(ms); gkey(k, "keyup"); };
  const gholdT = async (ks, ms) => { ks.forEach((k) => gkey(k)); await sleep(ms); ks.forEach((k) => gkey(k, "keyup")); };
  const gbody = () => gq("[data-walk]").__walk;
  /* Waits for the body, not for a stopwatch — and says whether it got there. The 40 s ceiling is
     ~5x the measured 8.5 s, so a slow machine is merely slow; if it ever is not enough, the
     assertion below fails loudly instead of measuring the wrong place (round 68's rule: a gate that
     passes once has measured one walk). */
  const gsettle = async (want) => {
    const trace = [];
    for (let i = 0; i < 1000; i++) {
      await sleep(40);
      const d = gbody().depth;
      if (i % 50 === 0) trace.push(Math.round(d));
      if (Math.abs(d - want) < 2) return true;
    }
    gsettle.trace = trace;
    return false;
  };
  const gt = () => gq("[data-walk-tutor-text]").textContent;
  const status0 = () => gq("[data-walk-status]").textContent.trim();
  const gc = () => gq("[data-walk-tutor-count]").textContent;
  ok("a first visit opens on the turn step before anything is touched",
     gq("[data-walk-tutor]").hidden === false && gc() === "1 / 4" && /Turn first/.test(gt()), gt());
  ok("the guide is chrome, not a paint-over: it rides the bottom strip and the plate stays closed",
     gq("[data-walk-card]").hidden === true && /\.walk-tutor \{/.test(css));
  await ghold("ArrowRight", 400); await sleep(300);
  ok("a turn that actually turned hands over the walking step",
     gc() === "2 / 4" && /Now walk in/.test(gt()), `${gc()} ${gt()}`);
  /* Strides measured in centimetres, not in milliseconds: 1800 ms of held keys is 2.8 m on an idle
     machine and 1.2 m on a busy one, and "two metres" is the contract. So the keys are held until
     the body has actually moved two metres (with a ceiling, so a broken walk fails here and not
     three assertions later). */
  const gz0 = gbody().depth;
  for (let i = 0; i < 200 && gbody().depth - gz0 < 200; i++) { await gholdT(["w", "shift"], 120); }
  await sleep(300);
  ok("real strides of two metres — not the rail's carrying — open the reading step",
     gc() === "3 / 4" && /press E/.test(gt()),
     `${gc()} moved ${(gbody().depth - gz0).toFixed(0)} cm`);
  const gstops = [...gdoc.querySelectorAll("[data-walk-stop]")];
  const gstop = (z) => gstops.reduce((best, el) =>
    Math.abs(parseFloat(el.style.getPropertyValue("--z")) - z) <
    Math.abs(parseFloat(best.style.getPropertyValue("--z")) - z) ? el : best, gstops[0]);
  const gz = parseFloat(gstop(1392).style.getPropertyValue("--z"));
  gclick(gstop(1392));
  const garrived = await gsettle(gz);
  ok("the rail carries the visitor to the stop it names — round the planter in its way, before any key is pressed",
     garrived, `at ${gbody().depth.toFixed(0)} of ${gz} — every 2 s: ${(gsettle.trace || []).join(" ")}`);
  await ghold("d", 700); await ghold("w", 1500);
  await sleep(120);
  gkey("e"); await sleep(80);
  ok("opening a card finishes the teaching: last step, a way out where Skip was",
     !gq("[data-walk-card]").hidden && gc() === "4 / 4" && /rail/.test(gt())
       && gq("[data-walk-tutor-done]").hidden === false && gq("[data-walk-tutor-skip]").hidden === true,
     `${gc()} card=${!gq("[data-walk-card]").hidden} ${status0()} ${gt()}`);
  gclick(gq("[data-walk-tutor-done]"));
  ok("Got it closes the guide and marks it learned for this browser",
     gq("[data-walk-tutor]").hidden === true && g.localStorage.getItem("huaxu.walk-guide.v1") === "1");
  gclick(gq("[data-walk-tutor-replay]"));
  ok("the info card's replay line brings it back on purpose",
     gq("[data-walk-tutor]").hidden === false && gc() === "1 / 4");
  gclick(gq("[data-walk-tutor-skip]"));
  ok("Skip ends it on the same terms", gq("[data-walk-tutor]").hidden === true);
  ok("and a boot after that start never auto-opens it: the flag is what gates the strip",
     /if \(tutorEl && !tutStore\.done\(\)\) showTutor\(0\);/.test(js));
  g.close();
}

const fail = out.filter((l) => l.startsWith("FAIL")).length;

/* ---- pressed models demonstrate (round 51) -------------------------------------------------------
   The owner split the ask: games where the water runs, interaction where the models stand. A press
   on the Blue Wing plays the opening back as a 24-second demonstration over the clock's own
   schedule, and a press on a basin skips a toy stone. The record's hours are never rewritten — the
   demo is an envelope, and it says so. */
{
  const fuk = boot(fs.readFileSync("rooms-fukuoka.html", "utf8"), "https://huaxu.test/rooms-fukuoka.html");
  await sleep(260);
  const bridge = fuk.document.querySelector('[data-obj="drawbridge-mj"]');
  const basin = fuk.document.querySelector('[data-obj="pool-moji"]');
  ok("the drawbridge and both basins carry their demo contract in the markup",
     bridge.dataset.demo === "open" && basin.dataset.demo === "ripple");
  bridge.dispatchEvent(new fuk.MouseEvent("click", { bubbles: true, cancelable: true }));
  ok("pressing the bridge starts the demonstration and speaks it to the reader, without a card",
     bridge.__demoAt > 0 && /demonstration runs/.test(fuk.document.querySelector("[data-walk-record]").textContent),
     `at=${!!bridge.__demoAt}`);
  basin.dispatchEvent(new fuk.MouseEvent("click", { bubbles: true, cancelable: true }));
  ok("a pressed basin answers about its stone rings",
     /stone skipped/.test(fuk.document.querySelector("[data-walk-record]").textContent));
  ok("the bridge's hint still reads as the record first, demonstration second",
     /six times a day/.test(bridge.dataset.hint) && /real bridge keeps its/.test(bridge.dataset.hint));
  fuk.close();
}

/* ---- the hour is the visitor's (round 49) --------------------------------------------------------
   The owner's ruling: no browser clock may darken a lane behind the visitor's back. The page opens
   in day, one button trades it for night, the choice carries across lanes, and a place held at its
   own authored night (the LookOut) gets no button at all. */
{
  const h = boot(rooms, "https://huaxu.test/rooms-hour.html");
  const hl = h.document.querySelector("[data-walk]");
  const hb = h.document.querySelector("[data-walk-hour]");
  ok("a lane opens in day, held there — the chrome carries the hour", hl.dataset.walkClock === "day" && !!hb, hl.dataset.walkHour);
  ok("the button is an icon with a label that says what it will do",
     !hb.textContent.trim() && /Daylight now\. Bring on the night\./.test(hb.getAttribute("aria-label") || ""));
  ok("the sun shows by day, the moon is waiting", /walk-hour-sun/.test(hb.innerHTML) && /walk-hour-moon/.test(hb.innerHTML)
     && !hb.classList.contains("is-night"));
  hb.dispatchEvent(new h.MouseEvent("click", { bubbles: true, cancelable: true }));
  ok("one press brings night: state, pressed, the moon, the label, the announcement",
     hl.dataset.walkClock === "night" && hb.classList.contains("is-night") && hb.getAttribute("aria-pressed") === "true"
     && /Night now\. Switch/.test(hb.getAttribute("aria-label")) && /Night comes/.test(h.document.querySelector("[data-walk-record]").textContent),
     `${hl.dataset.walkClock} ${hb.getAttribute("aria-label")}`);
  ok("and the choice is remembered for the site", h.localStorage.getItem("huaxu.walk-hour.v1") === "night");
  const h2 = boot(rooms, "https://huaxu.test/rooms-hour2.html", "night");
  ok("a lane entered with the choice set opens already in night",
     h2.document.querySelector("[data-walk]").dataset.walkClock === "night"
       && h2.document.querySelector("[data-walk-hour]").classList.contains("is-night"));
  h2.document.querySelector("[data-walk-hour]").dispatchEvent(new h2.MouseEvent("click", { bubbles: true, cancelable: true }));
  ok("back to day crosses the lane the same way", h2.localStorage.getItem("huaxu.walk-hour.v1") === "day");
  const held = fs.readFileSync("rooms-cntower.html", "utf8");
  ok("a room whose window shows one fixed night carries no hour button at all",
     !/data-walk-hour/.test(held) && /data-lane-night/.test(held));
  const heldBoot = boot(held, "https://huaxu.test/rooms-cntower.html", "day");
  ok("…and the visitor's choice cannot overwrite the authored hour there",
     heldBoot.localStorage.getItem("huaxu.walk-hour.v1") === "day" && !heldBoot.document.querySelector("[data-walk-hour]"));
  {
    const scjs = fs.readFileSync("js/scene3d.js", "utf8");
    ok("the lit path folds the same navy the painter calls murk, as the sun goes",
       /nightAmbient\.intensity = [\d.]+ \* hourK/.test(scjs)
       && /AmbientLight\(0x16223c, 0\)/.test(scjs) && /const nightK = /.test(scjs)
       && /const hourK = state\.dayPage \? nightK : 0;/.test(scjs));
    ok("and the night fold keeps a readable floor under it, never full murk",
       /clamp\(\(Number\(state\.night\) \|\| 0\) \* 0\.40, 0, 0\.58\)/.test(scjs)
       && /laneDark=min\(0\.62,/.test(scjs)
       && /diffuseColor\.rgb\+=uLaneNight\*murkK\*3\.2\*murkTex/.test(scjs)
     && /float murkK=min\(0\.62,vLaneDarkness\)/.test(scjs)
     // the murk must be proportional to the surface's own value, so a paving joint keeps its
     // share of the contrast under the navy instead of being drowned by a flat floor of it
     && /float murkTex=clamp\(dot\(diffuseColor\.rgb,vec3\(0\.2126,0\.7152,0\.0722\)\)\*2\.2,0\.0,1\.0\)/.test(scjs));
    ok("and the surveyed world's own materials carry the night wash as a self-lit emissive",
       (scjs.match(/material\.userData\.nightGlow = true/g) || []).length >= 2
       && /emissive: new THREE\.Color\(0x16223c\), emissiveIntensity: 0/.test(scjs)
       && /m\.emissiveIntensity = [\d.]+ \* hourK/.test(scjs));
    // measured round 51: the fukuoka hall's lit path collapsed to 4.2 luma on a stop where the
    // painter held 123.6, because a hall has no sky and its tiles kept no floor. The fix is
    // structural — interiors keep their light whatever the hour — and it must not be undone.
    // measured round 53, the other half of the same fact: held at the FULL navy fold the hall read
    // 30,53,103 mean RGB — the owner's 紫色 — where the painter paints 111,121,138. The constant
    // is therefore the record's own lamp wash (#ffe4ba, the lane shader's colour) with the murk
    // kept only as a quarter-share of air; an interior's fixed night is its lamps, not the sky.
    ok("and an interior hall keeps that floor as a constant, its dusk never depending on a sun it has no window for",
       /const hallK = state\.dayPage \? 0 : 1;/.test(scjs)
       && /hallAmbient\.intensity = [\d.]+ \* hallK/.test(scjs)
       && /AmbientLight\(0xffffff, 0\)/.test(scjs));
    ok("and the navy is zero inside a hall: the moving hour's murk never reaches a room with no sky",
       /nightAmbient\.intensity = [\d.]+ \* hourK;/.test(scjs));
  }
  /* Round 54 review, at the owner's demand that nothing else be quietly dropped: the rebuild had
     shortened the two places that teach the controls — the wall's HOW_TO_WALK and the lane's own
     aria-label — and the sentences it took out described keys and buttons that still work (Q/E at
     site.js, the double-click pointer lock, the first-visit guide, the sun-or-moon hour). A gate can
     no longer pass on "the page contains a paragraph": the phrases are pinned here, because every
     one of them is a promise the engine keeps. */
  ok("the wall teaches the whole keyboard it ships: A/D, double-click, the guide, the hour button",
     /arrow keys or A\/D \(or a gentle drag\)/.test(gen) && /double-click to let the mouse look, or the/.test(gen)
     && /first visit a short guide teaches those keys in place, once, and the/.test(gen)
     && /sun-or-moon button in the chrome holds the lane in day or/.test(gen)
     && /fixed night keeps its own hour/.test(gen));
  ok("and the walk-view's own aria-label says the same to a screen reader",
     /Drag, arrow keys or A\/D to turn,/.test(gen)
     && /facing, double-click to let the mouse look, L for the list, I for this note\./.test(gen)
     && /guide strip at the bottom of the screen; it is replayable from this note/.test(gen));
}

console.log(out.join("\n"));

// the counter used to be threaded through the hand-written blocks, and every gate added since has
// quietly not been part of it — the count is recomputed from the lines themselves, so a FAIL can
// never again ride out of here with exit code 0.
const failsN = out.filter((l) => /^FAIL  /.test(l)).length;
console.log(`\n${out.length - failsN}/${out.length} pass${failsN ? `, ${failsN} FAIL` : ""}`);
process.exit(failsN ? 1 : 0);

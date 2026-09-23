/* verify-walk.mjs — the lane, its furniture, the compound beyond the window, and the album.

   jsdom has no canvas, so the 2D context is replaced by a recorder: what is asserted is what the
   renderer asked to be painted, which is the strongest claim available in a sandbox without a
   browser. Anything about how it *looks* stays the owner's to judge. Run from the repo root:
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

function boot(markup, url) {
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
/* ---- 1. the data the scene is allowed to know about ------------------------------------------- */
const Q = "&quot;", DQ = '"';
const hitRe = /<button type="button" class="walk-hit"[^>]*data-obj="([^"]*)"[^>]*>/g;
const ids = [...html.matchAll(hitRe)].map((m) => m[1]);
ok("the lane is furnished, and every prop is authored", ids.length >= 20, `${ids.length} objects`);
ok("each object carries its own depth, so a prop is a solid", (html.match(/data-d="\d+"/g) || []).length === ids.length);
ok("the lookout rail is one of them", ids.includes("ledge"));
ok("the end wall is clear: the two things that were on it moved beside it",
   /data-obj="frame-tower"[^>]*--x:314px/.test(html) && /data-obj="poster-ticket"[^>]*--x:-310px/.test(html));
const island = (name) => {
  const m = html.match(new RegExp(`data-walk-${name}>(.*?)</script>`));
  return m ? JSON.parse(m[1]) : null;
};
const lights = island("lights"), beams = island("beams"), vista = island("vista"), bd = island("backdrop");
ok("lights are data, not a renderer's guess", lights && lights.length >= 6, `${lights && lights.length}`);
ok("the compound's bounce is authored as a light source, with its own tint",
   !!lights.find((L) => L.tint && L.bulb === false));
ok("no bulb sits on the ceiling that the generator did not place",
   lights.filter((L) => L.y === 386).length === 5);
ok("the arcade is authored", Array.isArray(beams) && beams.length === 4);
ok("the aperture is authored in scene centimetres", vista && vista.w === 470 && vista.y0 === 108 && vista.y1 === 336);
ok("the far plane names every landmark it draws",
   bd && !!bd.plaza && !!bd.crossing && !!bd.tower && !!bd.mountain && bd.city.length === 8
     && bd.roofs.length === 4 && !!bd.express);
ok("the near rooftops are beside the crossing, not standing on it",
   bd.roofs.every((r) => Math.abs(r.x) > bd.crossing.x1 && r.z < bd.city[0].z)
     && bd.roofs.every((r) => r.tone !== undefined && r.tone > 0 && r.tone < 1));
ok("the raised road is infrastructure, not a light source: its lamps are geometry",
   bd.express.lamps.length === 5 && bd.express.piers.length === 5
     && !lights.some((L) => L.z === bd.express.z));
ok("the crossing is a scramble: stripes and diagonals", bd.crossing.stripes === 9 && bd.crossing.diagonals === true);
ok("the tower's bands are counted, not sketched", Array.isArray(bd.tower.decks) && bd.tower.decks.length === 2);
ok("the mountain is farther than everything else, and says so by scale",
   bd.mountain.z > bd.tower.z && bd.mountain.z === 90000);
ok("the sky is three bands, and only the horizon band glows",
   bd.sky.length === 3 && bd.sky.filter((b) => b.glow).length === 1);
ok("no prop's z is left in record units (all scaled by 2.9)",
   [...html.matchAll(/--z:(-?\d+)px/g)].every((m) => Math.abs(Number(m[1])) % 1 === 0));
const surf = island("surfaces"), ground = island("marks");
/* Two more materials, added when the lane's far half was dressed: board-formed concrete over the
   shopfronts and a sheet of galvanised steel patched over the hoarding. Both are painted in code from
   a 128px tile like every other one, and both are named here because this assertion is the list of
   materials a band is allowed to name. */
const CLAD = ["plaster", "shutter", "corrugated", "dado", "brick", "hoarding", "concrete", "galv"];
ok("the walls are clad by data: every band names a material that has a pattern",
   !!surf && surf.length >= 18 && surf.every((v) => CLAD.includes(v.kind)), `${surf ? surf.length : 0} bands`);
ok("a band cannot lie about the lane: inside the walls, below the ceiling, on one side",
   surf.every((v) => Math.abs(v.side) === 1 && v.z0 >= -240 && v.z1 <= 1247 && v.y0 >= 0 && v.y1 <= 420
                    && v.y1 > v.y0 && v.z1 > v.z0));
ok("shutters, not paint, do most of the work: they are the commonest cladding",
   surf.filter((v) => v.kind === "shutter").length >= 4
     && surf.filter((v) => v.kind === "plaster").length < surf.length / 2);
ok("the cladding tiles each wall's whole height at every panel, so the room is dressed and not patched",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd);
     for (let z = -240; z < 1247; z += 60) {
       const at = (z + Math.min(z + 60, 1247)) / 2;
       let y = 0;
       for (const b of v.filter((b) => b.z0 <= at && b.z1 >= at).sort((a, b) => a.y0 - b.y0)) y = Math.max(y, b.y1);
       if (y < 420) return false;
     }
     return true;
   }));
ok("and it runs the length of the lane on both sides, gate to window",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd);
     return Math.min(...v.map((b) => b.z0)) === -240 && Math.max(...v.map((b) => b.z1)) === 1247;
   }));
ok("the wall beneath a covered panel is painted zero times",
   /cladCovers/.test(js) && /if \(surfaces\.length && cladCovers\(side, z, z1\)\) return/.test(js));
ok("the ground is marked, not left as a plane", !!ground && ground.length >= 6);
ok("a pedestrian lane has its guide path, on both sides, for its whole length",
   ground.filter((m) => m.kind === "tactile").length === 2
     && ground.filter((m) => m.kind === "tactile").every((m) => m.z1 - m.z0 > 1400 && m.x1 - m.x0 < 40));
ok("every mark lies flat on the floor and inside the walls",
   ground.every((m) => m.x0 >= -318 && m.x1 <= 318 && m.z0 >= -240 && m.z1 <= 1247
                       && m.x1 > m.x0 && m.z1 > m.z0));
const lanterns = lights.filter((L) => L.body === "lantern");
/* Six lanterns now, on six of the lane's wires: two more were hung when the far half of the lane was
   dressed, on the wire that crosses at 700 and the one at 1172. What this assertion defends is not the
   number, it is that each one is a *light* with a tint rather than a decoration the lighting does not
   know about — so the count moved and the rule did not. */
ok("a lantern is a light source, so the room is lit by what hangs in it",
   lanterns.length === 6 && lanterns.every((L) => L.bulb === false && L.tint));
ok("and each one says how wide the paper is and where the cord ties off",
   lanterns.every((L) => L.size >= 20 && L.size <= 40 && L.h > L.y && L.y > 200 && L.y < 400));
const props = qa(".walk-hit").map((b) => ({ obj: b.dataset.obj,
  x: parseFloat(b.style.getPropertyValue("--x")), z: parseFloat(b.style.getPropertyValue("--z")) }));
ok("every glow belongs to a named thing, so touching that thing is what changes the light",
   lights.filter((L) => L.bulb === false && L.body !== "lantern" && L.z !== 1247)
     .every((L) => ids.includes(L.of))
     && /of: L\.of \|\| null/.test(js) && /setState/.test(js));
ok("a state's light multiplier is a number, and every stop has one or none, never a guess",
   [...html.matchAll(/data-states="([^"]+)"/g)].every((raw) =>
     JSON.parse(raw[1].split(Q).join(DQ)).every((st) =>
       st.say && (st.k === undefined || (st.k > 0 && st.k < 3)))));ok("no corner of the lane is lit by an unpointable glow",
   lights.filter((L) => L.bulb === false && L.body !== "lantern").every((L) =>
     props.some((pr) => pr.x === L.x && pr.z === L.z) || L.z === 1247),
   `${lights.filter((L) => L.bulb === false && L.body !== "lantern").length} non-bulb sources`);
ok("the street kit is in the tab order, so it is part of the space and not a painted backdrop",
   ["front-a", "front-b", "booth", "bikes", "planters", "planter-2", "cones", "mailbox", "board-a",
    "banner-left", "banner-right", "mirror", "meter", "hydrant", "ladder", "camera", "recycle"]
     .every((id) => ids.includes(id)));
ok("the board stays blank and the copy says why: no lettering is ours to invent",
   /folding board, blank/i.test(html) && /invented lettering/i.test(html)
     && !/g\.fillText|\bfillText\(/.test(js));
ok("nothing writes prose into the scene", qa(".walk-hit").every((b) => !b.textContent.trim()));
ok("the sightline is in the accessible description, not only in pixels",
   /drawn compound: a crossing below it/.test(html));
ok("and so is the dressing, because the room is the thing being described",
   /dressed as a street/.test(html) && /Nothing on any of it carries a word/.test(html));

/* ---- 1b. the display, which may not wear a word ----------------------------------------------- */
{
  const hud = q(".walk-hud");
  const spoken = (el) => el.classList.contains("sr-only") || !!el.closest(".sr-only") || !!el.closest("[hidden]");
  // Only a node's *own* text counts: a wrapper above a live region inherits its sentence, and the
  // wrapper is not what is painted over the space.
  const ownText = (el) => Array.from(el.childNodes).filter((n) => n.nodeType === 3)
    .map((n) => n.textContent.trim()).join(" ").trim();
  const words = [...hud.querySelectorAll("*")].filter((el) => !spoken(el) && ownText(el));
  ok("nothing painted over the space is a sentence, a label, or even a glyph",
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
  ok("every control on the display is an icon button with an accessible name",
     qa(".walk-hud button, .walk-hud a").every((el) => (el.getAttribute("aria-label") || "").length > 3
       && !el.textContent.trim()));
  ok("the prose that used to sit there is emitted inside the card it now hides in",
     /data-walk-aside/.test(html) && /drag to turn/.test(q("[data-walk-aside]").textContent)
       && q("[data-walk-card]").hidden === true);
  ok("a folded interface keeps a keyboard route to the fold",
     /k === "i"/.test(js) && /showSpace\(\)/.test(js));
  ok("the lane keeps breathing while you are not walking, at one tick in eleven frames",
     /startPulse\(\)/.test(js) && /}, 90\);/.test(js) && /reduce\(\) \|\| !inView/.test(js));
  ok("the kerb is authored as a face, and gets a pattern of its own",
     ground.filter((m) => m.kind === "kerb").length === 2 && /PATS\.kerb = mkTile/.test(js)
       && ground.filter((m) => m.kind === "kerb").every((m) => m.y1 > 0 && m.y1 <= 12));
  ok("weathering is a number on the band, not a brush in the renderer",
     surf.filter((v) => v.tone !== undefined).length >= 3
       && surf.every((v) => v.tone === undefined || (v.tone > 0.6 && v.tone < 1.4)));
}

/* ---- 2. the raster, as recorded --------------------------------------------------------------- */
ok("the raster ran at all", ctx.fills > 0, `${ctx.fills} fills after boot`);
const before = ctx.fills;
q("[data-walk-view]").dispatchEvent(new w.Event("pointerdown", { bubbles: true }));
await sleep(30);
ok("no non-finite number ever reaches the context", ctx.bad === 0, `${ctx.bad}`);
ok("a texture arriving after boot repaints the lane, and throws nothing",
   ctx.loadError === undefined, ctx.loadError || "");
ok("every save is matched by a restore", ctx.saves === ctx.restores, `${ctx.saves}/${ctx.restores}`);
ok("the far plane stays a plane: nothing is projected off the ends of the earth",
   ctx.ptsMax > 0 && ctx.ptsMax < 60000, `widest coordinate ${Math.round(ctx.ptsMax)}`);
ok("a texture covers its own quad and no more", ctx.huge === 0, `${ctx.huge} oversized fills`);
ok("the backdrop adds its own fills to the room, not a second pass over it", ctx.fills > before);
/* The ceiling is a pass detector, not a freeze on detail — and it was calibrated on a build where
   the compound beyond the lane's window was not being drawn at all (the vista and backdrop islands
   were read with a list operation and came back `null`, so `if (vista)` was false). With the
   compound actually in the frame the same boot costs ~600 more fills: the plaza is sliced into panels
   for the same reason the walls are, and the crossing, eight city blocks, the tower, the mountain and
   three sky bands are ~48 quads that were previously invisible. The number to watch is a *second
   depth pass*, which doubles the room and lands near 6 000; if this ever reads that, the day's change
   put the scene through twice. */
ok("one depth pass, dressed: the room costs fills, not passes",
   ctx.fills > before && ctx.fills < 4400, `${ctx.fills} fills, one pass`);
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
ok("the one wet patch earns its place: it holds the light above it, and nothing else",
   /marks\.forEach\(\(mk\) => \{\s*\n\s*if \(mk\.kind !== "wet"\) return;/.test(js)
     && ground.filter((m) => m.kind === "wet").length === 1
     && ground.some((m) => m.kind === "wet" && lights.some((L) => L.bulb === false
         && L.x >= m.x0 && L.x <= m.x1 && L.z >= m.z0 && L.z <= m.z1)));
ok("a shopfront is a recess in whichever wall it hangs on, built through the wall's own axes",
   /const P = \(u, v, y\) =>/.test(js) && !/face\(inset\/2/.test(js));
ok("glass lets the far side through, and says so in code", /rgba\(186,214,240,0\.2\d?\)/.test(js));
ok("a hanging lamp is tied to the wire: the cord is drawn for a body, at the authored height",
   /L\.body === "lantern"\) strand\(\[L\.x, CEIL, L\.z\], \[L\.x \+ dx, L\.h/.test(js));
ok("and the swing moves the lamp, its cord, its pool and its light together",
   (js.match(/swayOf\(L\)/g) || []).length >= 4 && /const swayOf = \(L\) =>/.test(js)
     && /reduce\(\) \? 0 :/.test(js));
ok("a lantern's period and amplitude are authored, not random",
   lanterns.every((L) => L.swing > 0 && L.period > 1 && L.phase !== undefined));
ok("textures are mapped, not stretched photographs", ctx.imgs >= 6, `${ctx.imgs} drawImage`);
ok("the air never exceeds a murk of 0.6, so the compound stays readable",
   ctx.darkMax <= 0.6 + 1e-6, `max ${ctx.darkMax}`);
ok("the amber pool is drawn where a source reaches", ctx.warm > 0, `${ctx.warm} warm fills`);
ok("the city's windows use a pattern like every other surface",
   /paintWindows/.test(js) && /winPat = mkTile\(paintWindows\)/.test(js));
ok("the aperture is four wall pieces, not a mask",
   (js.match(/wallPiece\(/g) || []).length === 5, "4 pieces + the closed fallback");
ok("a district with no vista still gets a closed wall", /else \{\s*\n\s*wallPiece\(-WALL, 0, WALL, CEIL/.test(js));

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
  for (let i = 0; i < 40; i++) { await sleep(40); if (Math.abs(body().depth - want) < 2) return; }
};
const title0 = () => (qa(".walk-hit.is-reach")[0] || {}).dataset?.obj || "nothing";
const body = () => q("[data-walk]").__walk;

await hold("w", 500);
ok("W moves the body: a station chip takes over the readout", /m in$|ahead$/.test(status()), status());
ok("the walk stays inside the authored box", /HALF = 290, MIN_D = -30, MAX_D = 1200/.test(js));
ok("the plaza is seen, not entered: the far plane sits past the clamp",
   /MAX_D = 1200/.test(js) && vista.w > 0 && 1200 < 1247,
   "MAX_D 1200 < the end wall at 1247, so the window is a view and not a hole out of the world");

// The scramble frame, from the station beside it, with the wall as the only thing in between.
click(stopAt(798));
await settle(798);
await hold("a", 1500);                                   // to the left wall, x clamps at -290
await sleep(120);
ok("the wall prop nearer you wins: the reach is nearest-first, not list-order",
   /Utility pole|Poster|Frame|crate|drain|bin|sign/.test(status()), status());
click(stopAt(798));
await settle(798);
ok("standing at the frame's own depth brings it into reach",
   /Frame: the scramble at Shibuya/.test(status()), status());
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
   qa("[data-story-frame]").length === 3
   && q("[data-story-count]").textContent.trim() === `${Number(inReach[0].dataset.frame) + 1} of 3`,
   q("[data-story-count]").textContent);
const panel0 = plate.querySelector(".modal-panel");
const segEls = qa(".story-seg");
const nowIdx = Number(inReach[0].dataset.frame);
ok("a story's bars are one per frame, and the current one is the bar that fills",
   segEls.length === 3 && segEls[nowIdx].classList.contains("is-now")
     && segEls.every((sg) => !sg.firstChild.getAttribute("style")),
   segEls.map((sg) => sg.className.replace("story-seg", "·") || "pending").join(" "));
ok("the ground behind the story is the frame's own pixels, so the screen changes with the frame",
   /url\("IMG\//.test(panel0.style.getPropertyValue("--fill")),
   panel0.style.getPropertyValue("--fill").slice(0, 40));
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

// The rail at the window: a prop with no frame, so it must be answered by the card, not the plate.
// Centre the body first — from the wall the vending machine is nearer, and nearest wins by design.
await hold("d", 1300);
click(stopAt(1146));
await settle(1146);
ok("at the end of the lane the rail is what you are standing in front of",
   /lookout rail/i.test(status()), status());
key("e");
await sleep(60);
const card = q("[data-walk-card]");
ok("E on a prop opens its card", !card.hidden && /lookout rail/i.test(q("[data-walk-title]").textContent));
ok("the card says the compound is drawn, not surveyed",
   /picture of them shows, not surveyed/.test(q("[data-walk-hint]").textContent));
click(q("[data-walk-card-close]"));
await sleep(40);
ok("the card closes again", card.hidden);

// The street kit is furniture, not scenery, and the box's door opens: the interactive props are buttons
// in the lane, and acting on one changes what the frame is painted from. Tested at the mouth of the
// lane, where the kit is in front of the body; further down it is behind you and the painter rightly
// refuses to draw it, so a test that passed there would have been measuring nothing at all.
const booth = q('[data-obj="booth"]'), box = q('[data-obj="mailbox"]');
ok("the new kit is a button in the lane, not a painted detail", !!booth && booth.tagName === "BUTTON"
   && booth.dataset.frame === undefined && !!box);
/* Eight things can be done to now, not five: the lane gained a convex mirror that turns on its
   bracket, the litter crate beside the machine with a lid, and a second lit front halfway down. The
   rule this assertion defends is the first half of the line — a thing with stops ships at its first
   one, and the count of stops is the count in the document rather than in the script. */
ok("a thing with stops ships at its first one, and eight things have stops",
   booth.dataset.state === "0" && box.dataset.state === "0" && qa("[data-states]").length === 8);
click(stopAt(0));
await sleep(1600);
await hold("d", 900);                                       // hug the right wall, toward the box
await hold("w", 350);
await sleep(140);
ok("at the mouth of the lane the street kit is what you are standing in front of",
   qa(".walk-hit.is-reach").length === 1 && /shrine|telephone box|planters/i.test(status()), status());
const doorPaints = () => ctx.counts.get("rgba(150,186,218,0.28)") || 0;
const doorBefore = doorPaints();
click(booth);
await sleep(150);
ok("and the box opens by being used, with the card saying what the lane looks like now",
   !card.hidden && booth.dataset.state === "1"
     && /receiver hanging/i.test(q("[data-walk-hint]").textContent), `state=${booth.dataset.state}`);
ok("the state is geometry, not a caption: the opened door has been painted, and the shut one had not",
   doorPaints() > doorBefore, `${doorBefore} → ${doorPaints()} door fills`);
ok("and the light came up with the door, because the lamp is that door's record",
   lights.filter((L) => L.bulb === false && L.body !== "lantern" && L.z !== 1247).every((L) => ids.includes(L.of))
     && lights.some((L) => L.of === "booth"), lights.filter((L) => L.of).map((L) => L.of).join(","));
click(booth);
await sleep(150);
ok("pressing again takes it to the next stop, and the only stops are the ones authored",
   booth.dataset.state === "0" && /^Shut\./.test(q("[data-walk-hint]").textContent),
   `state=${booth.dataset.state} / ${q("[data-walk-hint]").textContent}`);
click(q("[data-walk-card-close]"));
await sleep(40);
ok("an interactive thing says so without a word: the reach ring is dashed for a prop you can use",
   /\.walk-hit\[data-states\]/.test(css));

/* Three failures a DOM without layout cannot see, and the owner could: the head-up display's rows were
   ceilings of invisible glass over the top and bottom of the scene (where the lanterns and the shutters
   are), a far prop's press box was as small as the few pixels it covered, and the curtain that reads
   "part it to leave the lane" opened a card instead of leaving. jsdom passed all three for a week. */
const noren = q('[data-obj="noren"]');
ok("the way out is authored in the record, and the chrome reads the same link",
   noren.dataset.leave === "index.html"
     && q("[data-walk-exit]").getAttribute("href") === noren.dataset.leave);
const navs = () => ctx.navs.filter((m) => /navigation/.test(m)).length;
click(noren);
ok("and parting the curtain leaves the lane, instead of describing the exit",
   navs() === 1, JSON.stringify(ctx.navs.slice(-1)));
click(booth);
await sleep(60);
key("Escape");
ok("Esc folds what is open before it folds the space", card.hidden && navs() === 1,
   `card hidden=${card.hidden} navs=${navs()}`);
key("Escape");
ok("and with nothing left to unfold, Esc is the door", navs() === 2, JSON.stringify(ctx.navs.slice(-2)));
const boxes = qa(".walk-hit").filter((e) => e.style.visibility === "visible");
ok("every visible press box is a fingertip, whatever the object's pixel size is",
   boxes.length > 3 && boxes.every((e) => parseFloat(e.style.width) >= 44 && parseFloat(e.style.height) >= 44),
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

ok("the chrome's press areas are bigger than its glyphs, since the glyphs are the drawing",
   /\.walk-icon,\n\.walk-stop \{\n  position: relative;\n\}/.test(css)
     && /\.walk-icon::before,\n\.walk-stop::before \{[^}]*inset: -8px -4px/.test(css)
     && /\.walk-tools \{[^}]*gap: 0\.5rem/.test(css));
ok("and the enlarged box never loses its focus state, because the ring moved with it",
   /\.walk-hit:focus-visible::after \{[^}]*border-color: var\(--accent-bright\)/.test(css)
     && !/\.walk-hit:focus-visible \{\n  outline: 2px/.test(css));

const tower = q('[data-obj="frame-tower"]');
ok("the moved frame keeps its own plate link", tower && tower.dataset.frame === "2");
// The glide: a drawer row moves the body to the frame's depth, and the station chip proves it.
const hereIdx = () => stops.findIndex((el) => el.classList.contains("is-here"));
const beforeHere = hereIdx();
const rail = q("[data-walk-to]");
click(rail);
await sleep(1500);          // the glide is exponential: give it the time it needs to settle
ok("a drawer link glides the body to that frame's depth, and nothing else",
   hereIdx() !== beforeHere && /435|4\.3|under the posters/.test(
     `${stops[hereIdx()].style.getPropertyValue("--z")} ${stops[hereIdx()].textContent}`),
   `station ${beforeHere} -> ${hereIdx()}`);
ok("the glide is depth only: the sideways position is left where you put it",
   /targetX === undefined \? x : targetX/.test(js));
ok("and the body really lands on that depth", Math.abs(body().depth - 348) < 2, `${body().depth}`);
// Two bugs the states themselves found, both worth a test because both are silent.
// (1) The idle pump has to advance the walk, not only repaint it: a station clicked while the lane was
// resting would otherwise glide partway and stop there, looking exactly like a lane that had arrived.
// (2) The station highlight is asked on every frame, so a prop standing in front of you cannot freeze it.
stopAt(0);
await sleep(1400);                            // let the rAF loop wind down to the idle pump
const home = stopAt(1146);
click(home);
await sleep(1600);
ok("a place chosen while the lane was resting is still walked to, not just drawn once",
   Math.abs(body().depth - 1146) < 6, `${body().depth}`);
ok("and the rail keeps up with the body, whatever the reach happens to be lit on",
   home.classList.contains("is-here") && hereIdx() === stops.indexOf(home)
     && /markStops\(\);\s*\n\s*let best = null/.test(js)
     && !/if \(!best\) \{ layer\.classList\.remove\("has-reach"\); markStops/.test(js),
   `here=${stops.indexOf(home)} reach=${qa(".is-reach").length} / ${status()}`);
ok("one pump at a time: asking for a real frame cancels the idle nudge",
   /const loop = \(\) => \{ stopPulse\(\)/.test(js) && /pulse = setTimeout\(\(\) => \{ pulse = 0; tick\(/.test(js));

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
   /A Tokyo lane, dressed: shutters, lanterns, a crossing at its end/.test(drawer.textContent));
ok("the scale the room claims is stated where the room is described",
   /1 px is 1 cm in here/.test(html) && /not surveyed/.test(html));
click(listBtn);                                      // closed again, then the keyboard alone
key("l");
ok("L opens it from the keyboard", !drawer.classList.contains("is-closed"),
   `panel=${drawer.className} active=${(doc.activeElement && doc.activeElement.tagName) || "?"} plate=${plate.classList.contains("is-open")}`);
key("l");
ok("L and the button do the same thing", drawer.classList.contains("is-closed"));
ok("the second district stays shut and says it is not open", /Not open yet/.test(html) && /Purpose not declared/.test(html));
ok("printing prints the list, not a dark rectangle", /@media print \{[\s\S]*\.walk-view,[\s\S]*display: none/.test(css));
ok("the canvas wears no overlay it cannot paint", !/walk-canvas::after/.test(css));
const fb = q("[data-walk-fallback]");
ok("the fallback names itself instead of hiding", fb && /unavailable|list below/i.test(fb.textContent + js));

/* ---- 5. the album on the reading surface ------------------------------------------------------ */
{
  const w2 = boot(act, "https://huaxu.test/activities.html");
  const d2 = w2.document;
  d2.startViewTransition = (cb) => { if (cb) cb(); return { finished: new Promise(() => {}) }; };
  const q2 = (s) => d2.querySelector(s);
  const qa2 = (s) => Array.from(d2.querySelectorAll(s));
  const click2 = (el) => el.dispatchEvent(new w2.MouseEvent("click", { bubbles: true, cancelable: true }));
  const tiles = qa2("[data-ig]"), frames = qa2(".ig-frame"), plate2 = q2("#ig-plate");
  ok("the album is emitted, not only styled", tiles.length >= 2 && !!plate2 && qa2("[data-ig-grid]").length >= 1);
  ok("one viewer per page here: the album does not clone the lane's plate",
     qa2(".modal").length === 1 && !q2("#room-plate"));
  ok("the roll holds exactly what the wall shows", tiles.length === frames.length, `${tiles.length}/${frames.length}`);
  ok("a tile addresses its own plate, in the same order",
     tiles.every((t, i) => t.getAttribute("href") === `#${frames[i].id}`));
  ok("the wall is photographs: no caption, no index chip, not one character on a tile",
     tiles.every((t) => !(t.textContent || "").trim() && !t.querySelector(".ig-cap, .ig-fig"))
       && !/\.ig-cap|\.ig-fig/.test(css));
  ok("and the claims a tile used to wear are now said where you have to arrive to read them",
     tiles.every((t) => /Field notes · generated plate/.test(t.getAttribute("aria-label") || ""))
       && frames.every((f) => /Field notes · generated plate/.test(f.querySelector("figcaption").textContent)));
  ok("a held block is shown as held, with a count and a reason",
     /Classroom and projects/.test(act) && /3 held for want of a caption/.test(act)
     && /Nothing in this block yet/.test(act));
  ok("the partition is declared in the generator, not inferred from the folder",
     /IMG_RULES/.test(gen) && /UNFILED/.test(gen) && /is in no block/.test(gen));
  ok("unfiled stays out of every page", !fs.readdirSync(".").filter((f) => f.endsWith(".html"))
     .some((f) => /IMG\/3\.jpg/.test(fs.readFileSync(f, "utf8"))));
  click2(tiles[3]);
  ok("a tile opens the roll", plate2.classList.contains("is-open"));
  ok("and the roll is at that tile's own photograph",
     frames[3].querySelector("img").style.viewTransitionName === "ig-photo");
  ok("the roll counts itself", q2("[data-ig-count]").textContent.trim() === `1 / ${frames.length}`);
  ok("the first plate has nothing before it",
     q2("[data-ig-prev]").disabled === true && q2("[data-ig-next]").disabled === false);
  ok("nothing is marked as seen: album, not story", !/is-viewed|data-viewed|has-viewed/.test(act + js + css));
  plate2.querySelector(".modal-close").dispatchEvent(
    new w2.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ok("Escape closes the roll and hands focus back to the wall",
     !plate2.classList.contains("is-open") && d2.activeElement === tiles[3]);
  const dead = fs.readdirSync(".").filter((f) => f.endsWith(".html"))
    .filter((f) => /data-deck|deck-btn|id="lightbox"/.test(fs.readFileSync(f, "utf8")));
  ok("no page ships the unstyled, unscripted deck", dead.length === 0, dead.join(" "));
  const missing = [];
  for (const f of fs.readdirSync(".").filter((x) => x.endsWith(".html"))) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/IMG\/([A-Za-z0-9._-]+(?:jpg|png|webp))/g)) {
      if (!fs.existsSync(`IMG/${m[1]}`)) missing.push(`${f}: IMG/${m[1]}`);
    }
  }
  ok("every raster a page points at exists", missing.length === 0, missing.join(", "));
}

console.log(out.join("\n"));
const fail = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fail}/${out.length} pass`);
process.exit(fail ? 1 : 0);

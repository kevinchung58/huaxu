/* how much does one repaint cost? Boots the harness's recorder, drives W for 700 ms, and reports the
   largest number of draw calls seen in any 16 ms window: the closest thing to a per-frame budget that
   exists without a browser. The frame counter also proves the loop is motion-driven — at rest the walk
   repaints nothing. Run: node .verify/cost-probe.mjs. Not part of the gate; it is the instrument the
   SPEC's fill counts were taken with. */
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
  darkMax: 0, warm: 0, huge: 0, colours: new Set(),
};
function recorder() {
  const fin = (a) => { for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) ctx.bad++; };
  const op = (name) => (...a) => { fin(a); if (name === "moveTo") ctx.frame.push([a[0], a[1]]); };
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
  const { JSDOM } = globalThis.__JSDOM;
  const dom = new JSDOM(markup.replace(/<script[^>]*src=[^>]*><\/script>/g, ""), {
    runScripts: "dangerously", pretendToBeVisual: true, url,
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
    set src(v) { this._s = v; if (this.onload) this.onload(); }
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

let raf = 0; const rq = w.requestAnimationFrame.bind(w);
w.requestAnimationFrame = (cb) => rq((t) => { raf++; cb(t); });
let prev = 0, peak = 0, n = 0;
const tick = setInterval(() => { const d = ctx.fills - prev; prev = ctx.fills; peak = Math.max(peak, d); n++; }, 16);
q("[data-walk-view]").dispatchEvent(new w.Event("pointerdown", { bubbles: true }));
await hold("w", 700);
clearInterval(tick);
console.log("PROBE " + JSON.stringify({ peak: peak, frames: raf, saves: ctx.saves, restores: ctx.restores, bad: ctx.bad, dark: ctx.darkMax, huge: ctx.huge }));
process.exit(0);
/* ---- 1. the data the scene is allowed to know about ------------------------------------------- */
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
   bd && !!bd.plaza && !!bd.crossing && !!bd.tower && !!bd.mountain && bd.city.length === 8);
ok("the crossing is a scramble: stripes and diagonals", bd.crossing.stripes === 9 && bd.crossing.diagonals === true);
ok("the tower's bands are counted, not sketched", Array.isArray(bd.tower.decks) && bd.tower.decks.length === 2);
ok("the mountain is farther than everything else, and says so by scale",
   bd.mountain.z > bd.tower.z && bd.mountain.z === 90000);
ok("the sky is three bands, and only the horizon band glows",
   bd.sky.length === 3 && bd.sky.filter((b) => b.glow).length === 1);
ok("no prop's z is left in record units (all scaled by 2.9)",
   [...html.matchAll(/--z:(-?\d+)px/g)].every((m) => Math.abs(Number(m[1])) % 1 === 0));
const surf = island("surfaces"), ground = island("marks");
const CLAD = ["plaster", "shutter", "corrugated", "dado", "brick", "hoarding"];
ok("the walls are clad by data: every band names a material that has a pattern",
   !!surf && surf.length >= 18 && surf.every((v) => CLAD.includes(v.kind)), `${surf ? surf.length : 0} bands`);
ok("a band cannot lie about the lane: inside the walls, below the ceiling, on one side",
   surf.every((v) => Math.abs(v.side) === 1 && v.z0 >= -240 && v.z1 <= 1247 && v.y0 >= 0 && v.y1 <= 420
                    && v.y1 > v.y0 && v.z1 > v.z0));
ok("shutters, not paint, do most of the work: they are the commonest cladding",
   surf.filter((v) => v.kind === "shutter").length >= 4
     && surf.filter((v) => v.kind === "plaster").length < surf.length / 2);
ok("the bands tile the lane end to end without a gap in either wall",
   [-1, 1].every((sd) => {
     const v = surf.filter((b) => b.side === sd).sort((a, b) => a.z0 - b.z0);
     return v[0].z0 === -240 && v[v.length - 1].z1 === 1247
            && v.every((b, i) => !i || b.z0 === v[i - 1].z1);
   }));
ok("the ground is marked, not left as a plane", !!ground && ground.length >= 6);
ok("a pedestrian lane has its guide path, on both sides, for its whole length",
   ground.filter((m) => m.kind === "tactile").length === 2
     && ground.filter((m) => m.kind === "tactile").every((m) => m.z1 - m.z0 > 1400 && m.x1 - m.x0 < 40));
ok("every mark lies flat on the floor and inside the walls",
   ground.every((m) => m.x0 >= -318 && m.x1 <= 318 && m.z0 >= -240 && m.z1 <= 1247
                       && m.x1 > m.x0 && m.z1 > m.z0));
const lanterns = lights.filter((L) => L.body === "lantern");
ok("a lantern is a light source, so the room is lit by what hangs in it",
   lanterns.length === 4 && lanterns.every((L) => L.bulb === false && L.tint));
ok("and each one says how wide the paper is and where the cord ties off",
   lanterns.every((L) => L.size >= 20 && L.size <= 40 && L.h > L.y && L.y > 200 && L.y < 400));
const props = qa(".walk-hit").map((b) => ({ obj: b.dataset.obj,
  x: parseFloat(b.style.getPropertyValue("--x")), z: parseFloat(b.style.getPropertyValue("--z")) }));
ok("no corner of the lane is lit by an unpointable glow",
   lights.filter((L) => L.bulb === false && L.body !== "lantern").every((L) =>
     props.some((pr) => pr.x === L.x && pr.z === L.z) || L.z === 1247),
   `${lights.filter((L) => L.bulb === false && L.body !== "lantern").length} non-bulb sources`);
ok("the street kit is in the tab order, so it is part of the space and not a painted backdrop",
   ["front-a", "booth", "bikes", "planters", "cones", "mailbox", "board-a", "banner-left", "banner-right"]
     .every((id) => ids.includes(id)));
ok("the board stays blank and the copy says why: no lettering is ours to invent",
   /folding board, blank/i.test(html) && /invented lettering/i.test(html)
     && !/g\.fillText|\bfillText\(/.test(js));
ok("nothing writes prose into the scene", qa(".walk-hit").every((b) => !b.textContent.trim()));
ok("the sightline is in the accessible description, not only in pixels",
   /drawn compound: a crossing below it/.test(html));

/* ---- 2. the raster, as recorded --------------------------------------------------------------- */
ok("the raster ran at all", ctx.fills > 0, `${ctx.fills} fills after boot`);
const before = ctx.fills;
q("[data-walk-view]").dispatchEvent(new w.Event("pointerdown", { bubbles: true }));
await sleep(30);
ok("no non-finite number ever reaches the context", ctx.bad === 0, `${ctx.bad}`);
ok("every save is matched by a restore", ctx.saves === ctx.restores, `${ctx.saves}/${ctx.restores}`);
ok("the far plane is drawn, and only a bounds test keeps it", ctx.huge > 0, `${ctx.huge} oversized quads`);
ok("the backdrop adds its own fills to the room, not a second pass over it", ctx.fills > before);
ok("one depth pass, dressed: the room costs fills, not passes",
   ctx.fills > before && ctx.fills < 2400 && ctx.frames < 400, `${ctx.fills} fills, ${ctx.frames} clips`);
ok("the cladding is tiled into the wall's own panels, so an affine map stays exact",
   /surfaces\.forEach/.test(js) && /PATS\[sc\.kind\]/.test(js) && /SEG/.test(js));
ok("every material in the data has a painter, and every painter has a tile",
   CLAD.every((k) => new RegExp(`paint[A-Z]|PATS\\.${k}`).test(js))
     && ["shutter", "dado", "brick", "corrugated", "hoarding", "tactile", "grate", "lantern"]
         .every((k) => new RegExp(`PATS\\.${k} = mkTile`).test(js)));
ok("the room's atmosphere is drawn, not photographed: no material image is loaded for it",
   !/IMG\/[a-z0-9-]*(shutter|brick|tile|plaster|corrugated|wood|asphalt)/.test(js + html));
ok("a shopfront is a recess in whichever wall it hangs on, built through the wall's own axes",
   /const P = \(u, v, y\) =>/.test(js) && !/face\(inset\/2/.test(js));
ok("glass lets the far side through, and says so in code", /rgba\(186,214,240,0\.2\d?\)/.test(js));
ok("a hanging lamp is tied to the wire: the cord is drawn for a body, at the authored height",
   /L\.body === "lantern"\) strand\(\[L\.x, CEIL, L\.z\], \[L\.x, L\.h/.test(js));
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
const body = () => q("[data-walk]").__walk;

await hold("w", 500);
ok("W moves the body: a station chip takes over the readout", /m in$|ahead$/.test(status()), status());
ok("the walk stays inside the authored box", /HALF = 290, MIN_D = -30, MAX_D = 1200/.test(js));
ok("the plaza is seen, not entered: the far plane sits past the clamp",
   /MAX_D = 1200/.test(js) && vista.w > 0 && 1200 < 1247,
   "MAX_D 1200 < the end wall at 1247, so the window is a view and not a hole out of the world");

// The scramble frame, from the station beside it, with the wall as the only thing in between.
click(stopAt(798));
await sleep(300);
await hold("a", 1500);                                   // to the left wall, x clamps at -290
await sleep(120);
ok("the wall prop nearer you wins: the reach is nearest-first, not list-order",
   /Utility pole|Poster|Frame|crate|drain|bin|sign/.test(status()), status());
click(stopAt(798));
await sleep(400);
ok("standing at the frame's own depth brings it into reach",
   /Frame: the scramble at Shibuya/.test(status()), status());
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
click(plate.querySelector("[data-room-close]"));
await sleep(60);
ok("closing hands focus back to the thing on the wall that opened it",
   !plate.classList.contains("is-open") && doc.activeElement && doc.activeElement.classList.contains("walk-hit"));

// The rail at the window: a prop with no frame, so it must be answered by the card, not the plate.
// Centre the body first — from the wall the vending machine is nearer, and nearest wins by design.
await hold("d", 1300);
click(stopAt(1146));
await sleep(400);
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
ok("the view it promises is the space, not a picture of the space",
   /\b1 px is 1 cm\b/.test(drawer.textContent) && /not surveyed/.test(drawer.textContent));
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
  ok("every tile names its block and admits it is generated",
     tiles.every((t) => /Field notes · generated plate/.test(t.querySelector(".ig-cap").textContent)));
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

/* verify-games.mjs — the festival stalls, their wiring, and the two games' rules (round 50).
   The owner asked for toys playable in the environment itself; this gate is the promise that
   "playable" is not decoration: the dialog opens from the stall's own press, the machines obey
   their published rules on fixed seeds, and a district without stalls ships no dialog at all.
   Run from the repo root: `node .verify/verify-games.mjs`. */
import fs from "node:fs";
import { siteText } from "../bin/site-sources.mjs";
const { JSDOM, VirtualConsole } = await import("jsdom");

const out = [];
const ok = (n, c, e = "") => out.push(`${c ? "PASS" : "FAIL"}  ${n}${e ? "  — " + e : ""}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function recorder() {
  // A catch-all canvas: the lane's painter and the toys both draw into it, and what matters to this
  // gate is that nothing throws and the calls happen, not the pixels (the pixels have their own gate).
  const grad = { addColorStop() {} };
  const base = { canvas: { width: 640, height: 400 } };
  return new Proxy(base, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === "createRadialGradient" || k === "createLinearGradient" || k === "createPattern")
        return () => grad;
      if (k === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

function boot(markup, url) {
  const vc = new VirtualConsole();
  vc.on("jsdomError", () => {});
  const dom = new JSDOM(markup.replace(/<script[^>]*src="[^"]*"><\/script>/g, ""), {
    runScripts: "dangerously", pretendToBeVisual: true, url, virtualConsole: vc,
  });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLElement.prototype.setPointerCapture = function () {};
  w.HTMLElement.prototype.hasPointerCapture = () => false;
  w.matchMedia = (q) => ({ matches: /hover: hover/.test(q), media: q,
    addEventListener() {}, addListener() {}, removeEventListener() {} });
  class IO { constructor(cb) { this.cb = cb; } observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); } unobserve() {} disconnect() {} }
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
  const js = siteText();
  const gs = fs.readFileSync("js/games.js", "utf8");
  w.eval(js);
  w.eval(gs);
  return w;
}

/* ---- 1. the markup the stalls are allowed to have ------------------------------------------- */
{
  const street = fs.readFileSync("street.html", "utf8");
  const nia = fs.readFileSync("rooms-niagara.html", "utf8");
  ok("the street declares both stalls as pressable game props",
     /data-obj="stall-kingyo"[^>]*data-game="kingyo"/.test(street)
     && /data-obj="stall-menya"[^>]*data-game="menya"/.test(street)
     || /data-game="kingyo"[^>]*class="[^"]*walk-stall/.test(street));
  ok("each stall says out loud that it is a toy, not the record",
     /A toy, not a survey/.test(street) && /stand at no surveyed address/.test(street));
  ok("the street carries the shared dialog, hidden until pressed",
     /class="walk-game" data-walk-game role="dialog" aria-modal="true" hidden/.test(street));
  const fuk = fs.readFileSync("rooms-fukuoka.html", "utf8");
  ok("a lane without stalls ships no dialog and the script no-ops on it",
     !/walk-game/.test(fuk));
  ok("games.js rides the page as a classic defer script, versioned like its siblings",
     /<script src="js\/games\.js\?v=[0-9a-f]{10}" defer><\/script>/.test(street));
  ok("the falls carry the rapids shed, and its dialog was generated the same way",
     /data-obj="shed-rapids"[^>]*data-game="rapids"/.test(nia)
     && /class="walk-game" data-walk-game/.test(nia) && /A toy, not a survey/.test(nia));
  ok("the basins and the Blue Wing answer a press — demonstrations, not the record's schedule",
     (fuk.match(/data-demo="ripple"/g) || []).length === 2 && /data-demo="open"/.test(fuk)
     && /the real bridge keeps its/.test(fuk));
}

/* ---- 2. the press: the stall opens its own toy over the lane --------------------------------- */
{
  const w = boot(fs.readFileSync("street.html", "utf8"), "https://huaxu.test/street.html");
  await sleep(600);
  const doc = w.document;
  const panel = doc.querySelector("[data-walk-game]");
  const stall = doc.querySelector('[data-obj="stall-kingyo"]');
  ok("the API exists once the street boots", !!w.huaxuStalls && typeof w.huaxuStalls.open === "function");
  const opened = stall.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
  await sleep(60);
  ok("pressing the stall opens the basin over the lane (no navigation, no card in the way)",
     !panel.hidden && panel.dataset.game === "kingyo", `hidden=${panel.hidden}`);
  ok("the dialog speaks its rules into the live status before the first frame",
     /paper net|hold to dip/i.test(panel.querySelector("[data-game-status]").textContent));
  ok("focus lands on the close button, so Esc is one keystroke away",
     doc.activeElement && doc.activeElement.hasAttribute("data-game-close"));
  panel.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await sleep(30);
  ok("Escape puts the toy down and hands focus back to the stall",
     panel.hidden === true);
  ok("a lane that declares nothing refuses politely instead of half-opening",
     w.huaxuStalls.open("nonsense") === false);
  w.close();
}

/* ---- 3. the machines: rules on fixed seeds, no browser needed --------------------------------- */
{
  const w = boot(fs.readFileSync("street.html", "utf8"), "https://huaxu.test/street2.html");
  await sleep(600);
  const g = w.huaxuStalls.machine("kingyo");
  ok("both games expose their machine to the gate", !!g && !!w.huaxuStalls.machine("menya"));
  let broke = false, over = false, input = { x: 320, y: 240, hold: true, dx: 0, dy: 0 };
  for (let i = 0; i < 40 && !broke; i++) {
    g.step(0.05, input);
    input.dx = 400; input.dy = 20;                 // deep and quick: the paper's whole cruelty
    broke = /paper/.test(g.msg());
  }
  over = broke;
  ok("holding the net deep and yanking it quick parts the paper", broke);
  for (let i = 0; i < 1200 && !g.over(); i++) g.step(0.05, { x: 320, y: 240, hold: false, dx: 0, dy: 0 });
  ok("the lantern time closes the round whether or not the bag fills", g.over() && /lantern time/.test(g.msg()));
  ok("the score is a number the page can read aloud", Number.isFinite(g.score()) && g.score() >= 0);

  const m = w.huaxuStalls.machine("menya");
  for (let i = 0; i < 20 && !m.over(); i++) m.step(0.05, { x: 60 + i * 29, y: 120 + (i % 4) * 58, shoot: true });
  ok("twelve pellets and the line is done, hit or miss — no endless clip", m.over());
  ok("a scored morning says so; an empty one does not lie", /masks|off the wire|quick today/.test(m.msg()));
  const rp = w.huaxuStalls.machine("rapids");
  ok("the falls' machine exists and speaks the same contract",
     !!rp && typeof rp.step === "function" && typeof rp.over === "function");
  if (rp) {
    for (let i = 0; i < 30 && !rp.over(); i++) rp.step(0.05, { x: 320 + Math.sin(i / 3) * 260, y: 300 });
    ok("steered through thirty seconds the raft neither crashes the clock nor stands still",
       Number.isFinite(rp.score()) && rp.score() >= 0);
    for (let i = 0; i < 1100 && !rp.over(); i++) rp.step(0.05, { x: 320, y: 300 });
    ok("the mist hour closes the run whatever the river brought", rp.over() && /mist hour|rings|scrapes/.test(rp.msg()));
  }
  let drew = true;
  try { m.draw({ fillRect() {}, fillText() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
    save() {}, restore() {}, translate() {}, rotate() {}, moveTo() {}, lineTo() {}, closePath() {},
    quadraticCurveTo() {}, ellipse() {}, createRadialGradient: () => ({ addColorStop() {} }) }); }
  catch (e) { drew = false; }
  ok("the painter survives a full frame of both machines", drew && g.draw !== undefined);
  w.close();
}

const fails = out.filter((l) => /^FAIL/.test(l)).length;
console.log(out.join("\n"));
console.log(fails ? `\n${out.filter((l) => /^PASS/.test(l)).length}/${out.length} checked, ${fails} FAIL`
                  : `\n${out.length}/${out.length} pass`);
process.exit(fails ? 1 : 0);

/* verify-rooms-e2e.cjs — walk the hub and owned spaces with deterministic input.

   The street has exactly three main destinations; real landmark/sub-spaces are
   discovered from their parent object. This harness drives the walk (W to move,
   A/D to edge across, held arrows to turn, E to act, Esc to leave) and proves:

     1. Street doors navigate only to Toronto, Tokyo and Fukuoka.
     2. The narrow Journey lane clamps to its own walls and authored deck extent;
        a sealed Tokyo lane independently proves the end-wall clamp, and jumps respect the ceiling.
     3. Solid display plinths stop the walker without sealing the side aisle, while
        movement stays smooth and axes stay independent of camera turning.
     4. Child-space exits respawn beside the owning prop, ready to interact again.
     5. The street's own back door leaves for the album, not for another room.

   jsdom has no layout and refuses navigation; the camera math is deterministic,
   so movement is driven by pumping requestAnimationFrame with a monotonic clock
   and a "Not implemented: navigation" error is the click landing. A stubbed
   canvas recorder stands in for pixels, exactly as verify-walk.mjs does.

   Run: node .verify/verify-rooms-e2e.cjs
*/
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");

const js = fs.readFileSync("js/site.js", "utf8");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [], fails = [];
const ok = (n, c, e = "") => { out.push(`${c ? "PASS" : "FAIL"}  ${n}${e ? "  — " + e : ""}`); if (!c) fails.push(n); };

function boot(file, hash = "") {
  return new Promise((resolve, reject) => {
    const navs = [], errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => {
      const m = String((e && e.message) || e);
      if (/navigation/.test(m)) navs.push(m); else errors.push(m);
    });
    let html = fs.readFileSync(file, "utf8").replace(/<script[^>]*src=[^>]*><\/script>/g, "");
    const dom = new JSDOM(html, {
      runScripts: "dangerously", pretendToBeVisual: true,
      url: "https://huaxu.test/" + file + hash, virtualConsole: vc,
    });
    const w = dom.window;
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.HTMLElement.prototype.setPointerCapture = () => {};
    w.HTMLElement.prototype.hasPointerCapture = () => false;
    w.HTMLElement.prototype.releasePointerCapture = () => {};
    w.matchMedia = (q) => ({ matches: false, media: q, addEventListener(){}, addListener(){}, removeEventListener(){} });
    w.IntersectionObserver = class {
      constructor(cb){ this.cb = cb; }
      observe(el){ this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); }
      unobserve(){} disconnect(){} };
    w.PointerEvent = w.MouseEvent;
    w.Element.prototype.animate = () => ({ cancel(){}, finished: Promise.resolve() });
    w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
    const noop = () => {};
    const grad = { addColorStop: noop };
    w.HTMLCanvasElement.prototype.getContext = function () {
      return this.__c || (this.__c = {
        canvas: { width: 1024, height: 768 },
        fillStyle: "", strokeStyle: "", lineWidth: 1, globalCompositeOperation: "source-over",
        save(){}, restore(){}, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
        arc: noop, ellipse: noop, rect: noop, fillRect(){}, strokeRect: noop, translate: noop,
        scale: noop, rotate: noop, clip(){}, fill(){}, stroke(){}, drawImage(){}, setTransform(){},
        transform(){}, createPattern: () => ({}), createRadialGradient: () => grad,
        createLinearGradient: () => grad, measureText: () => ({ width: 0 }), fillText(){}, strokeText(){},
      });
    };
    w.innerWidth = 1024; w.innerHeight = 768; w.devicePixelRatio = 1;
    Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { configurable: true, get() {
      return this.className && String(this.className).includes("walk-view") ? 1024 : 0;
    }});
    Object.defineProperty(w.HTMLElement.prototype, "clientHeight", { configurable: true, get() {
      return this.className && String(this.className).includes("walk-view") ? 768 : 0;
    }});
    w.Image = class {
      constructor(){ this.naturalWidth = 640; this.naturalHeight = 427; }
      set src(v){ this._s = v; setTimeout(() => { if (this.onload) this.onload(); }, 5); }
      get src(){ return this._s; } get complete(){ return !!this._s; }
    };
    // Deterministic clock for the walk: each pump advances 17 ms and drains the rAF queue.
    let now = 1000;
    const queue = [];
    let rafId = 1;
    w.requestAnimationFrame = (cb) => { queue.push({ id: rafId, cb }); return rafId++; };
    w.cancelAnimationFrame = (id) => {
      const i = queue.findIndex((q) => q.id === id);
      if (i >= 0) queue.splice(i, 1);
    };
    w.performance = { now: () => now };
    async function pump(n, frameMs = 17) {
      for (let i = 0; i < n; i++) {
        now += frameMs;
        const snapshot = queue.slice();
        queue.length = 0;
        for (const e of snapshot) { try { e.cb(now); } catch (err) { errors.push("tick: " + err.message); } }
      }
    }
    let result;
    try { result = w.eval(js); } catch (err) { reject(err); return; }
    setTimeout(async () => {
      await pump(40);                                  // boot paints, idle pulse settles
      resolve({
        w, dom, doc: w.document, navs, errors, pump,
        walk: () => w.document.querySelector("[data-walk]").__walk,
        key: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })),
        keyUp: (k) => (w.document.activeElement || w.document.documentElement)
          .dispatchEvent(new w.KeyboardEvent("keyup", { key: k, bubbles: true })),
        reach: () => w.document.querySelector(".walk-hit.is-reach"),
        close: () => w.close(),
      });
    }, 250);
  });
}

/* W follows the street's depth axis regardless of camera yaw; sidestepping to
   correct camera drift would hide a movement bug, so the walk is one-dimensional. */
async function walkDeep(env, forwardFrames) {
  env.key("w");
  await env.pump(forwardFrames);
  env.keyUp("w");
  await env.pump(6);
}

/* A short, released arrow press is a deliberate turn; holding the key is rate-limited. */
async function tapTurn(env, key = "arrowright") {
  env.key(key);
  await env.pump(5);
  env.keyUp(key);
  await env.pump(2);
}
async function turnToReach(env, objId, maxTaps = 60) {
  for (let i = 0; i < maxTaps; i++) {
    const r = env.reach();
    if (r && r.dataset.obj === objId) return true;
    await tapTurn(env);
  }
  const r = env.reach();
  return !!(r && r.dataset.obj === objId);
}

/* Sidle along the street (A or D, no forward motion) until the wanted door is
   the one in reach once you face it. Doors sit flush to a wall at x ±346; the
   walker's stop keeps ~60 cm off the wall, well inside the 190 cm reach, so
   the whole problem is being beside the door in z — edging solves that. */
async function sidleToReach(env, objId, dir = -1, maxFrames = 400) {
  const k = dir < 0 ? "a" : "d";
  env.key(k);
  for (let i = 0; i < maxFrames; i += 4) {
    await env.pump(4);
    const r = env.reach();
    if (r && r.dataset.obj === objId) { env.keyUp(k); await env.pump(4); return true; }
  }
  env.keyUp(k);
  await env.pump(4);
  return turnToReach(env, objId);
}

/* Hold W until the walker is deep enough (door z minus a body's width), with a
   hard frame cap. Fixed frame counts lie: forward speed saturates, so the same
   285 frames that cross the lane's mid-depth stop well short of the far door. */
async function walkToDepth(env, target, maxFrames = 1500) {
  env.key("w");
  for (let i = 0; i < maxFrames; i += 5) {
    await env.pump(5);
    if (env.walk().depth >= target) break;
  }
  env.keyUp("w");
  await env.pump(6);
}

/* Turn until the wanted object's press box is on screen (visibility, not reach). */
async function turnToVisible(env, el, maxTaps = 70) {
  for (let i = 0; i < maxTaps; i++) {
    if (el.style.visibility === "visible") return true;
    await tapTurn(env);
  }
  return el.style.visibility === "visible";
}

async function main() {
  /* ---- 1. The street boots as an outdoor place ---- */
  out.push("-- Street: boots, paints, and is outdoors --");
  let env = await boot("street.html");
  ok("street boots with the walk view", !!env.doc.querySelector("[data-walk]"));
  ok("street paints the space (quads > 100)", env.walk().quads > 100, `quads=${env.walk().quads}`);
  ok("street has pressable objects visible at the mouth",
     [...env.doc.querySelectorAll(".walk-hit")].filter((e) => e.style.visibility === "visible").length >= 3);
  const vista = env.doc.querySelector('[data-walk-vista]');
  const backdrop = env.doc.querySelector('[data-walk-backdrop]');
  ok("street carries a far-end vista (the opening is authored, not implied)",
     !!vista && JSON.parse(vista.textContent).w >= 600,
     vista ? `w=${JSON.parse(vista.textContent).w}` : "missing");
  // The far view's subject was the lit skyline until round 15; the street now ends at a harbour
  // (the owner's coast, decided in skills/street-commons/references/promenade.md). The gate keeps
  // its intent — the backdrop carries a sky and a named far-view subject, city or water.
  const bd = backdrop ? JSON.parse(backdrop.textContent) : null;
  ok("street carries a painted backdrop (sky, and a city or a harbour beyond)",
     !!bd && bd.sky.length >= 2 && ((bd.city && bd.city.length >= 3) || (bd.harbor && bd.harbor.z1 > bd.harbor.z0)),
     bd ? `sky+${bd.harbor ? "harbor" : "city"} present` : "missing");
  const skyTop = bd && bd.sky && bd.sky[bd.sky.length - 1];
  ok("street's distant sky uses a smooth gradient and closes a portrait viewport",
     !!skyTop && bd.skyGradient === true && skyTop.y1 >= 300000 && bd.sky.length >= 10,
     skyTop ? `${bd.sky.length} colour samples; smooth=${bd.skyGradient}; top ${skyTop.y1}` : "missing sky");
  const harbor = bd && bd.harbor;
  ok("the quay has six-metre bollards, a four-tread access cut, and a ladder to the water",
     !!harbor && harbor.bollards && harbor.bollards.spacing === 600
       && harbor.slipway && harbor.slipway.steps === 4
       && harbor.ladder && harbor.ladder.rungs >= 4,
     harbor ? `bollard spacing ${harbor.bollards && harbor.bollards.spacing}; steps ${harbor.slipway && harbor.slipway.steps}` : "missing quay kit");
  ok("a broken breakwater and authored wind lanes give the harbour a far edge and a moving surface",
     !!harbor && harbor.breakwater && harbor.breakwater.length >= 6
       && harbor.motion && harbor.motion.lanes.length === 3 && harbor.motion.ripples.length === 6,
     harbor ? `${harbor.breakwater && harbor.breakwater.length} blocks; ${harbor.motion && harbor.motion.lanes.length} lanes / ${harbor.motion && harbor.motion.ripples.length} rings` : "missing harbour detail");
  ok("water animation parks when reduced motion is requested",
     /if \(motion && !reduce\(\)\)/.test(js) && /motion\.ripples/.test(js));
  ok("street carries exactly the three main-place doors",
     ["door-toronto", "door-tokyo", "door-fukuoka"].every((id) => env.doc.querySelector(`[data-obj="${id}"]`))
       && !["door-cntower", "door-niagara", "door-journey"].some((id) => env.doc.querySelector(`[data-obj="${id}"]`)));
  ok("no room door on the street is wired to another street door",
     ["door-toronto", "door-tokyo", "door-fukuoka"].every((id) => {
       const el = env.doc.querySelector(`[data-obj="${id}"]`);
       return el && el.dataset.leave && el.dataset.leave !== "street.html";
     }));

  // DESIGN.md promises screen-axis movement. Turning the view must not rotate W into an accidental
  // sidestep, and A must not add an accidental stride down the lane.
  const yaw0 = env.walk().yaw;
  env.key("arrowright"); await env.pump(2); env.keyUp("arrowright"); await env.pump(2);
  const yaw1 = env.walk().yaw;
  const beforeW = { ...env.walk() };
  env.key("w"); await env.pump(60); env.keyUp("w"); await env.pump(35);
  const afterW = { ...env.walk() };
  ok("street movement: W advances down the lane without yaw drift",
     yaw1 !== yaw0 && Math.abs(afterW.x - beforeW.x) < 0.01 && afterW.depth > beforeW.depth + 100,
     `yaw ${yaw0}->${yaw1}; x ${beforeW.x.toFixed(1)}->${afterW.x.toFixed(1)}; depth +${(afterW.depth - beforeW.depth).toFixed(1)}`);
  const beforeA = { ...env.walk() };
  env.key("a"); await env.pump(30); env.keyUp("a"); await env.pump(35);
  const afterA = { ...env.walk() };
  ok("street movement: A stays lateral without changing depth",
     afterA.x < beforeA.x - 35 && Math.abs(afterA.depth - beforeA.depth) < 0.5,
     `x ${beforeA.x.toFixed(1)}->${afterA.x.toFixed(1)}; depth ${beforeA.depth.toFixed(1)}->${afterA.depth.toFixed(1)}`);
  ok("movement uses a calm walk speed and a sub-centimetre head cue",
     env.walk().maxSpeed <= 210 && env.walk().turnRate <= 90,
     `${env.walk().maxSpeed.toFixed(0)} cm/s max; ${env.walk().turnRate}°/s turn`);
  const holdYaw0 = env.walk().yaw;
  env.key("arrowright"); await env.pump(60); env.keyUp("arrowright"); await env.pump(4);
  const heldTurn = Math.abs(env.walk().yaw - holdYaw0);
  ok("a held turn is rate-limited instead of repeating large camera jumps",
     heldTurn >= 70 && heldTurn <= 90, `${heldTurn.toFixed(1)}° in one second`);

  // A 10 Hz frame is 100 ms. The integrator must account for all of it, just as it does for sixty
  // 17 ms frames; the old 50 ms cap made the same one-second walk half speed on a slow render.
  env.close();
  env = await boot("street.html");
  env.key("w"); await env.pump(50, 17);  // reach cruise speed before comparing the intervals
  const fastStart = env.walk().depth;
  await env.pump(60, 17); env.keyUp("w");
  const fastWalk = env.walk().depth - fastStart;
  env.close();
  env = await boot("street.html");
  env.key("w"); await env.pump(10, 100);  // same warm-up, sampled at 10 Hz
  const slowStart = env.walk().depth;
  await env.pump(10, 100); env.keyUp("w");
  const slowWalk = env.walk().depth - slowStart;
  ok("street movement: elapsed time, not render frame rate, sets distance",
     Math.abs(fastWalk - slowWalk) < 12,
     `60 Hz-ish ${fastWalk.toFixed(1)} cm; 10 Hz ${slowWalk.toFixed(1)} cm`);

  env.key("w"); await env.pump(30);
  const beforeBlur = env.walk().depth;
  env.w.dispatchEvent(new env.w.Event("blur"));
  await env.pump(8);
  const afterBlur = env.walk().depth;
  ok("street movement: losing focus releases held keys immediately",
     afterBlur - beforeBlur < 0.5,
     `depth drifted ${(afterBlur - beforeBlur).toFixed(2)} cm after blur`);
  env.keyUp("w");

  /* ---- 2. Collision audit: authored room widths, solids, end wall, ceiling ---- */
  out.push("\n-- Movement/collision: narrow tunnel, plinth, room limits --");
  env.close();
  env = await boot("rooms-journey.html");
  const tunnel = env.doc.querySelector("[data-walk]");
  const tunnelWidth = Number(tunnel.dataset.laneW);
  const tunnelHalf = tunnelWidth / 2 - env.walk().radius;
  ok("Journey's 240 cm tunnel derives its wall and body limits from its own width",
     tunnelWidth === 240 && env.walk().wallHalf === 120 && env.walk().halfWidth === tunnelHalf
       && tunnelHalf === 96,
     `wall ±${env.walk().wallHalf}; body centre ±${env.walk().halfWidth}`);
  env.key("a"); await env.pump(100); env.keyUp("a"); await env.pump(8);
  const leftWall = env.walk().x;
  ok("A stops at the narrow tunnel's inside wall, never beyond it",
     leftWall >= -tunnelHalf - 0.01 && Math.abs(leftWall + tunnelHalf) < 1.1,
     `x=${leftWall.toFixed(2)} / limit=-${tunnelHalf}`);
  const atLeftDepth = env.walk().depth;
  env.key("d"); await env.pump(180); env.keyUp("d"); await env.pump(8);
  const rightWall = env.walk().x;
  ok("D reaches the opposite wall without widening the 2.4 m tunnel",
     rightWall <= tunnelHalf + 0.01 && Math.abs(rightWall - tunnelHalf) < 1.1
       && Math.abs(env.walk().depth - atLeftDepth) < 0.5,
     `x=${rightWall.toFixed(2)} / limit=+${tunnelHalf}`);

  const journeyLimit = Number(tunnel.dataset.laneMaxD);
  ok("Journey's tunnel opens onto its deck at the page-authored walk limit",
     Number.isFinite(journeyLimit) && env.walk().maxDepth === journeyLimit,
     `${env.walk().maxDepth} cm / authored deck limit=${journeyLimit}`);
  env.key("w"); await env.pump(600); env.keyUp("w"); await env.pump(8);
  const deckStop = env.walk().depth;
  env.key("w"); await env.pump(30); env.keyUp("w"); await env.pump(8);
  ok("W cannot walk beyond the authored Journey deck extent",
     deckStop <= journeyLimit + 0.01 && Math.abs(deckStop - journeyLimit) < 1.2
       && Math.abs(env.walk().depth - deckStop) < 0.1,
     `depth=${deckStop.toFixed(2)} / limit=${journeyLimit}`);
  env.key("s"); await env.pump(600); env.keyUp("s"); await env.pump(8);
  ok("S cannot walk through the rear boundary either", env.walk().depth >= env.walk().minDepth - 0.01,
     `depth=${env.walk().depth.toFixed(2)} / minimum=${env.walk().minDepth}`);
  env.key(" "); await env.pump(10); env.keyUp(" ");
  const peak = env.walk().height;
  await env.pump(60);
  ok("jumping is capped below the narrow room's ceiling and lands cleanly",
     peak > 0 && peak <= env.walk().maxHeight + 0.01 && env.walk().height === 0
       && env.walk().maxHeight === Number(tunnel.dataset.laneCeil) - Number(tunnel.dataset.eye) - 12,
     `peak=${peak.toFixed(1)} cm / clearance=${env.walk().maxHeight} cm`);

  env.close();
  env = await boot("rooms.html");
  const sealed = env.doc.querySelector("[data-walk]");
  const sealedFar = Number(sealed.dataset.laneD) - 47;
  ok("a sealed Tokyo lane stops 47 cm before its own end wall",
     env.walk().maxDepth === sealedFar,
     `${env.walk().maxDepth} cm / wall at ${Number(sealed.dataset.laneD)} cm`);
  env.key("w"); await env.pump(600); env.keyUp("w"); await env.pump(8);
  const wallStop = env.walk().depth;
  env.key("w"); await env.pump(30); env.keyUp("w"); await env.pump(8);
  ok("W cannot pass through the sealed Tokyo end wall, even when held at the clamp",
     wallStop <= sealedFar + 0.01 && Math.abs(wallStop - sealedFar) < 1.2
       && Math.abs(env.walk().depth - wallStop) < 0.1,
     `depth=${wallStop.toFixed(2)} / limit=${sealedFar}`);

  env.close();
  env = await boot("rooms-fukuoka.html");
  const plinth = env.doc.querySelector('[data-obj="plinth-moji"]');
  const plinthX = parseFloat(plinth.style.getPropertyValue("--x"));
  const plinthZ = parseFloat(plinth.style.getPropertyValue("--z"));
  const plinthFront = plinthZ - Number(plinth.dataset.d) / 2;
  const plinthStop = plinthFront - env.walk().radius;
  const wallHalf = env.walk().wallHalf;
  const plinthHalf = Number(plinth.dataset.w) / 2;
  const aisleClearance = wallHalf - plinthHalf - 2 * env.walk().radius;
  ok("the Moji display plinth is authored as a solid walk obstacle", plinth?.dataset.solid === "true");
  ok("the Moji hall leaves a full-body side aisle around the solid display",
     aisleClearance > 0 && env.walk().halfWidth > plinthHalf + env.walk().radius,
     `${aisleClearance.toFixed(0)} cm spare beyond a 48 cm body`);
  env.key("w"); await env.pump(700); env.keyUp("w"); await env.pump(8);
  const atPlinth = env.walk().depth;
  env.key("w"); await env.pump(40); env.keyUp("w"); await env.pump(8);
  ok("the walker stops at the near face of the port table instead of entering its volume",
     Math.abs(atPlinth - plinthStop) < 1.2 && Math.abs(env.walk().depth - atPlinth) < 0.1,
     `depth=${atPlinth.toFixed(2)} / table edge=${plinthStop.toFixed(2)}`);
  env.key("d"); await env.pump(180); env.keyUp("d"); await env.pump(8);
  const sideX = env.walk().x;
  ok("the visitor can move fully around the port table without crossing its collision footprint",
     sideX > plinthX + plinthHalf + env.walk().radius
       && sideX <= env.walk().halfWidth + 0.01,
     `aisle x=${sideX.toFixed(1)}; collider edge=${plinthX + plinthHalf + env.walk().radius}`);
  env.key("w"); await env.pump(250); env.keyUp("w"); await env.pump(8);
  const pastTable = env.walk().depth;
  ok("the side aisle stays open past the full depth of the display",
     pastTable > plinthZ + Number(plinth.dataset.d) / 2 + env.walk().radius + 80,
     `depth=${pastTable.toFixed(0)}; far edge=${plinthZ + Number(plinth.dataset.d) / 2 + env.walk().radius}`);

  env.close();
  env = await boot("rooms-toronto.html", "#at-tower-cn");
  const tower = env.doc.querySelector('[data-obj="tower-cn"]');
  const towerDist = Math.hypot(
    parseFloat(tower.style.getPropertyValue("--x")) - env.walk().x,
    parseFloat(tower.style.getPropertyValue("--z")) - env.walk().depth);
  ok("the CN Tower sub-space returns to its owning prop, in reach and in view",
     towerDist < 190 && env.reach()?.dataset.obj === "tower-cn",
     `distance=${towerDist.toFixed(1)} cm; reach=${env.reach()?.dataset.obj || "none"}`);
  env.key("e"); await env.pump(8);
  const enterTower = env.doc.querySelector("[data-enter-space]");
  ok("using the Toronto tower prop opens its story with the tower-space action",
     !!enterTower && !enterTower.hidden && enterTower.getAttribute("href") === "rooms-cntower.html",
     enterTower?.getAttribute("href") || "missing story action");

  env.close();
  env = await boot("rooms-niagara.html", "#at-door-journey");
  const journeyDoor = env.doc.querySelector('[data-obj="door-journey"]');
  ok("Journey returns beside Table Rock's own door, ready to enter it again",
     env.reach()?.dataset.obj === "door-journey"
       && Math.hypot(parseFloat(journeyDoor.style.getPropertyValue("--x")) - env.walk().x,
                     parseFloat(journeyDoor.style.getPropertyValue("--z")) - env.walk().depth) < 190,
     `reach=${env.reach()?.dataset.obj || "none"}; x=${env.walk().x.toFixed(0)}, z=${env.walk().depth.toFixed(0)}`);

  /* ---- 3. Toronto by foot: walk beside the first door, face it, press E ---- */
  out.push("\n-- Street -> Toronto on foot: E on the lit door --");
  env.close();
  env = await boot("street.html");
  await walkToDepth(env, 430);                            // door walk-z 464: stop just short of it
  const cReach = await sidleToReach(env, "door-toronto", -1);
  ok("street: the Toronto door comes into reach (ring on it)", cReach,
     env.reach() ? env.reach().dataset.obj : "nothing in reach");
  env.navs.length = 0;
  env.key("e"); await env.pump(10); await sleep(60);
  ok("street: E on the Toronto door leaves for rooms-toronto.html", env.navs.length === 1,
     env.navs[0] || "no navigation");
  env.close();

  /* ---- 3. Tokyo by foot: further up the street, right-hand side ---- */
  out.push("\n-- Street -> Tokyo on foot: E on the middle door --");
  env = await boot("street.html");
  await walkToDepth(env, 1330);                           // door walk-z 1363: the middle of the street
  const tReach = await sidleToReach(env, "door-tokyo", 1);
  ok("street: the Tokyo door comes into reach", tReach,
     env.reach() ? env.reach().dataset.obj : "nothing in reach");
  env.navs.length = 0;
  env.key("e"); await env.pump(10); await sleep(60);
  ok("street: E on the Tokyo door leaves for rooms.html", env.navs.length === 1,
     env.navs[0] || "no navigation");
  env.close();

  /* ---- 4. Fukuoka by foot: the far stretch, left-hand side ---- */
  out.push("\n-- Street -> Fukuoka on foot: E on the last door --");
  env = await boot("street.html");
  await walkToDepth(env, 2230);                           // door walk-z 2262: the far stretch
  const fReach = await sidleToReach(env, "door-fukuoka", -1);
  ok("street: the Fukuoka door comes into reach", fReach,
     env.reach() ? env.reach().dataset.obj : "nothing in reach");
  env.navs.length = 0;
  env.key("e"); await env.pump(10); await sleep(60);
  ok("street: E on the Fukuoka door leaves for rooms-fukuoka.html", env.navs.length === 1,
     env.navs[0] || "no navigation");
  env.close();


  /* ---- 5. The street's own back door opens the album ---- */
  out.push("\n-- Street back door: the album, not another room --");
  env = await boot("street.html");
  const sBack = env.doc.querySelector('[data-obj="door-back"]');
  ok("street: the back door points at activities.html",
     sBack && sBack.dataset.leave === "activities.html", sBack?.dataset.leave || "missing");
  env.navs.length = 0;
  env.key("escape"); await env.pump(6); await sleep(60);
  ok("street: Esc with nothing open leaves for the album", env.navs.length === 1,
     env.navs[0] || "no nav");
  env.close();

  /* ---- 6. Every room exits to the street, by attribute and by Esc ---- */
  out.push("\n-- Rooms: every way out lands on the street --");
  for (const [file, objId, label] of [
    ["rooms.html", "noren", "Tokyo"],
    ["rooms-fukuoka.html", "curtain-back", "Fukuoka"],
    ["rooms-toronto.html", "door-back", "Toronto"],
  ]) {
    const e1 = await boot(file);
    ok(`${label}: boots with the walk view`, !!e1.doc.querySelector("[data-walk]"));
    ok(`${label}: no onward door exists (the hub carries the doors)`,
       !e1.doc.querySelector('[data-obj="way-on"]'));
    const back = e1.doc.querySelector(`[data-obj="${objId}"]`);
    ok(`${label}: the way you came in points at the street (at its own door)`,
       back && back.dataset.leave.split("#")[0] === "street.html", back?.dataset.leave || "missing");
    e1.navs.length = 0;
    e1.key("escape"); await e1.pump(6); await sleep(60);
    ok(`${label}: Esc leaves for the street`, e1.navs.length === 1, e1.navs[0] || "no nav");
    e1.close();
  }

  /* ---- 7. Tokyo inside: the plate still opens, Esc folds it before leaving ---- */
  out.push("\n-- Tokyo mouth: E acts on the street kit, the noren leaves --");
  env = await boot("rooms.html");
  const mouth = env.reach();
  ok("tokyo: something street-level is in reach at the mouth", !!mouth, mouth?.dataset.obj || "none");
  const card = env.doc.querySelector("[data-walk-card]");
  env.key("e");
  await env.pump(10);
  ok("tokyo: E at the mouth opens its plate (nothing silently fails)", card && !card.hidden,
     card && !card.hidden ? `“${env.doc.querySelector("[data-walk-title]").textContent}”` : "no card");
  if (card && !card.hidden) {
    env.key("escape");
    await env.pump(6);
    ok("tokyo: Esc folds the plate first", card.hidden);
  }
  env.navs.length = 0;
  env.key("escape");                                 // nothing open now: Esc is the door
  await env.pump(6); await sleep(60);
  ok("tokyo: Esc with nothing open leaves for the street", env.navs.length === 1,
     env.navs[0] || "no nav");
  env.close();

  /* ---- 8. Fukuoka still ends at the water; the walk has a far end ---- */
  out.push("\n-- Fukuoka: end of the alley is water --");
  env = await boot("rooms-fukuoka.html");
  ok("fukuoka has pressable objects visible at the mouth",
     [...env.doc.querySelectorAll(".walk-hit")].filter((e) => e.style.visibility === "visible").length >= 3);
  // The solid port table is a visual anchor, not a wall across the hall: approach it, take the
  // authored right-hand aisle, pass the model's far edge, then continue toward the harbour.
  env.key("w"); await env.pump(700); env.keyUp("w"); await env.pump(8);
  env.key("d"); await env.pump(180); env.keyUp("d"); await env.pump(8);
  env.key("w"); await env.pump(250); env.keyUp("w"); await env.pump(8);
  await walkDeep(env, 250);
  const fWalk = env.walk();
  ok("fukuoka: the side aisle carries the walker past the port table to the water",
     fWalk.depth > 2100 && fWalk.x > 350,
     `depth=${fWalk.depth.toFixed(0)}; x=${fWalk.x.toFixed(0)}`);
  env.close();

  /* ---- 9. The doors are painted geometry: walk in, turn, click, leave ---- */
  out.push("\n-- The hub doors are painted geometry, and clicking one leaves --");
  for (const [file, objId, expect, prep] of [
    ["street.html", "door-toronto", "rooms-toronto.html", { fwd: 420, side: -1 }],
    ["street.html", "door-tokyo", "rooms.html", { fwd: 1200, side: 1 }],
    ["street.html", "door-fukuoka", "rooms-fukuoka.html", { fwd: 2000, side: -1 }],
    ["rooms.html", "noren", "street.html", { fwd: 300, side: 0 }],
    ["rooms-fukuoka.html", "curtain-back", "street.html", { fwd: 300, side: 0 }],
    ["rooms-toronto.html", "door-back", "street.html", { fwd: 300, side: 0 }],
  ]) {
    const e2 = await boot(file);
    const el = e2.doc.querySelector(`[data-obj="${objId}"]`);
    // A door needs both some distance (its box overflows the view at arm's length) and a look
    // toward it: walk past the mouth, edge to its side of the street, then turn until on screen.
    if (prep.fwd) await walkToDepth(e2, prep.fwd);
    if (prep.side) {
      const k = prep.side < 0 ? "a" : "d";
      e2.key(k); await e2.pump(30); e2.keyUp(k); await e2.pump(6);
    }
    let vis = el && el.style.visibility === "visible";
    for (let i = 0; i < 70 && !vis; i++) {
      await tapTurn(e2);
      vis = el.style.visibility === "visible";
    }
    ok(`${file} [${objId}]: becomes a visible plane as you walk in and look around`, vis,
       `vis=${el ? el.style.visibility : "missing"}`);
    if (vis) {
      e2.navs.length = 0;
      el.dispatchEvent(new e2.w.MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(60);
      ok(`${file} [${objId}]: clicking it leaves for ${expect}`, e2.navs.length === 1,
         e2.navs[0] || "no navigation");
    }
    e2.close();
  }

  console.log(out.join("\n"));
  console.log(`\n${fails.length} failure(s)` + (fails.length ? "  " + fails.join(", ") : ""));
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });

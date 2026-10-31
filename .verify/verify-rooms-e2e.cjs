/* verify-rooms-e2e.cjs — walk the hub and owned spaces with deterministic input.

   The street has exactly three main destinations; real landmark/sub-spaces are
   discovered from their parent object. This harness drives the walk (W to move,
   A/D to edge across, held arrows to turn, E to act, Esc to leave) and proves:

     1. Street doors navigate only to Toronto, Tokyo and Fukuoka.
     2. The narrow Journey lane clamps to its own walls and authored deck extent;
        a sealed Tokyo lane independently proves the end-wall clamp, and jumps respect the ceiling.
     3. Solid display plinths stop the walker without sealing the side aisle, while
        camera-relative movement stays smooth and world-space collision bounds stay fixed.
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
const { siteText } = require("../bin/site-sources.cjs");

const js = siteText();

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
    // P2 (round 69): the place's world data is a plain script file now; jsdom fetches nothing, so it
    // is inlined here before the external-script strip, the same bytes the browser loads.
    let html = fs.readFileSync(file, "utf8")
      .replace(/<script[^>]*src="(js\/places\/[a-z0-9-]+\.js)(\?[^"]*)?"[^>]*><\/script>/g,
               (_m, src) => `<script>${fs.readFileSync(src, "utf8")}</script>`)
      .replace(/<script[^>]*src=[^>]*><\/script>/g, "");
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
    Object.defineProperty(w.performance, "now", { configurable: true, value: () => now });
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

/* W follows the camera's floor-projected forward direction. Straight lane walks
   below begin at the authored default heading; angled movement is tested by projection. */
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
const wrapYaw = (degrees) => ((degrees + 180) % 360 + 360) % 360 - 180;
async function turnToYaw(env, target) {
  const delta = wrapYaw(target - env.walk().yaw);
  if (Math.abs(delta) < 0.4) return;
  const key = delta < 0 ? "arrowleft" : "arrowright";
  const frames = Math.max(1, Math.round(Math.abs(delta) / (env.walk().turnRate * 0.017)));
  env.key(key);
  await env.pump(frames);
  env.keyUp(key);
  await env.pump(3);
}
async function turnToReach(env, objId, maxTaps = 60) {
  const el = env.doc.querySelector(`[data-obj="${objId}"]`);
  for (let i = 0; i < maxTaps; i++) {
    const r = env.reach();
    if (r && r.dataset.obj === objId) return true;
    if (!el) return false;
    const targetX = parseFloat(el.style.getPropertyValue("--x"));
    const targetZ = parseFloat(el.style.getPropertyValue("--z"));
    const targetYaw = Math.atan2(targetX - env.walk().x, targetZ - env.walk().depth) * 180 / Math.PI;
    await tapTurn(env, wrapYaw(targetYaw - env.walk().yaw) < 0 ? "arrowleft" : "arrowright");
  }
  const r = env.reach();
  return !!(r && r.dataset.obj === objId);
}

/* Walk up to a thing the way a visitor does now: turn to its own bearing, then walk in.

   This replaced a `sidleToReach` that held A and slid sideways toward a door. Round 65 made A/D turn
   the head instead of strafing, so a gate that still holds A spins the walker on the spot and then
   walks it into a wall: every door, print and aisle below reported the neighbouring shopfront as the
   thing in reach, which read as a reach bug and was a gate bug. The walk is repeated in rounds
   because a wall between the body and the thing needs a new bearing once the body has slid along it. */
async function walkToReach(env, objId, maxFrames = 600, rounds = 6) {
  const el = env.doc.querySelector(`[data-obj="${objId}"]`);
  if (!el) return false;
  const tx = () => parseFloat(el.style.getPropertyValue("--x"));
  const tz = () => parseFloat(el.style.getPropertyValue("--z"));
  for (let round = 0; round < rounds; round++) {
    const r = env.reach();
    if (r && r.dataset.obj === objId) return true;
    const bearing = Math.atan2(tx() - env.walk().x, tz() - env.walk().depth) * 180 / Math.PI;
    await turnToYaw(env, bearing);
    env.key("w");
    for (let i = 0; i < maxFrames; i += 5) {
      await env.pump(5);
      const now = env.reach();
      if (now && now.dataset.obj === objId) break;
      if (Math.hypot(tx() - env.walk().x, tz() - env.walk().depth) < 90) break;
    }
    env.keyUp("w");
    await env.pump(6);
  }
  const r = env.reach();
  return !!(r && r.dataset.obj === objId);
}

/* Hold W until the body stops moving — the honest way to meet a wall, now that walking goes where the
   head points rather than down the lane's own axis. Returns the resting position. */
/* Hold W until the body stops moving along the axis it is being pushed into.

   Round 77: this used to watch `depth + x`. A body pushed at a wall at a heading a degree or two
   off square keeps sliding *along* the wall, so the sum never settles, the loop ran its full 900
   frames, and the caller's "you crossed the tunnel, you did not walk down it" drift bound measured
   how long the harness had been holding W rather than how straight the crossing was. Pass the axis
   the wall is on: x for a side wall, depth for an end wall. */
async function walkUntilBlocked(env, maxFrames = 900, axis = null) {
  env.key("w");
  const at = () => (axis === "x" ? env.walk().x : axis === "depth" ? env.walk().depth
    : env.walk().depth + env.walk().x);
  let last = at(), still = 0;
  for (let i = 0; i < maxFrames; i += 5) {
    await env.pump(5);
    const now = at();
    if (Math.abs(now - last) < 0.05) { if (++still >= 3) break; } else { still = 0; }
    last = now;
  }
  env.keyUp("w");
  await env.pump(6);
  return { ...env.walk() };
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

  // Turning the view rotates movement in the floor plane. W must have no rightward component;
  // A must have no forward component, even though both now change world x and depth together.
  const yaw0 = env.walk().yaw;
  env.key("arrowright"); await env.pump(2); env.keyUp("arrowright"); await env.pump(2);
  const yaw1 = env.walk().yaw, angle = yaw1 * Math.PI / 180;
  const beforeW = { ...env.walk() };
  env.key("w"); await env.pump(60); env.keyUp("w"); await env.pump(35);
  const afterW = { ...env.walk() };
  const wX = afterW.x - beforeW.x, wD = afterW.depth - beforeW.depth;
  const wForward = wX * Math.sin(angle) + wD * Math.cos(angle);
  const wRight = wX * Math.cos(angle) - wD * Math.sin(angle);
  ok("street movement: W follows the turned camera without yaw drift",
     yaw1 !== yaw0 && Math.abs(afterW.yaw - yaw1) < 0.01 && wForward > 100 && Math.abs(wRight) < 1.5,
     `yaw ${yaw0.toFixed(1)}->${afterW.yaw.toFixed(1)}; forward ${wForward.toFixed(1)} cm, side ${wRight.toFixed(1)} cm`);
  /* Round 65 made A turn the head rather than strafe, and this gate still asserted a strafe until
     round 72 — which is why it was the oldest red line in the repository. What the lane promises now
     is the opposite: the key turns, and the body does not slide sideways under it. */
  const beforeA = { ...env.walk() };
  env.key("a"); await env.pump(30); env.keyUp("a"); await env.pump(35);
  const afterA = { ...env.walk() };
  const aTurn = wrapYaw(afterA.yaw - beforeA.yaw);
  const aSlide = Math.hypot(afterA.x - beforeA.x, afterA.depth - beforeA.depth);
  ok("street movement: A turns the head left and the body does not slide sideways under it",
     aTurn < -20 && aSlide < 3,
     `turned ${aTurn.toFixed(1)}°; body moved ${aSlide.toFixed(1)} cm`);
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
  /* Turn into the wall and walk into it: with A/D turning, this is the gesture that meets the
     tunnel's side, and the promise is unchanged — the body stops at its own half-width, not at the
     wall's line, and it never passes through. */
  await turnToYaw(env, -90);                       // head pointed at the −x wall
  const leftStop = await walkUntilBlocked(env, 900, "x");
  ok("walking into the narrow tunnel's left wall stops at the body's limit, never beyond it",
     leftStop.x >= -tunnelHalf - 0.01 && Math.abs(leftStop.x + tunnelHalf) < 1.1,
     `x=${leftStop.x.toFixed(2)} / limit=-${tunnelHalf}`);
  await turnToYaw(env, 90);                        // across to the other wall
  const rightStop = await walkUntilBlocked(env, 900, "x");
  ok("and the opposite wall is reached without widening the 2.4 m tunnel",
     rightStop.x <= tunnelHalf + 0.01 && Math.abs(rightStop.x - tunnelHalf) < 1.1
       && Math.abs(rightStop.depth - leftStop.depth) < 400,
     `x=${rightStop.x.toFixed(2)} / limit=+${tunnelHalf}; `
       + `forward drift=${(rightStop.depth - leftStop.depth).toFixed(2)} cm (a diagonal crossing may advance)`);

  const journeyLimit = Number(tunnel.dataset.laneMaxD);
  ok("Journey's tunnel opens onto its deck at the page-authored walk limit",
     Number.isFinite(journeyLimit) && env.walk().maxDepth === journeyLimit,
     `${env.walk().maxDepth} cm / authored deck limit=${journeyLimit}`);
  /* Walk until the clamp holds, not for a fixed number of frames: the tunnel is its real 56 m now
     (round 33), and the 600 frames that used to reach the deck stopped 17 m in -- the same lie
     walkToDepth's note describes. The cap scales with the authored limit. */
  await turnToYaw(env, 0);                         // down the tunnel, toward the deck
  env.key("w");
  for (let i = 0, last = -1; i < Math.ceil(journeyLimit / 2) + 600; i += 20) {
    await env.pump(20);
    if (Math.abs(env.walk().depth - last) < 0.01) break;
    last = env.walk().depth;
  }
  env.keyUp("w"); await env.pump(8);
  const deckStop = env.walk().depth;
  env.key("w"); await env.pump(30); env.keyUp("w"); await env.pump(8);
  ok("W cannot walk beyond the authored Journey deck extent",
     deckStop <= journeyLimit + 0.01 && Math.abs(deckStop - journeyLimit) < 1.2
       && Math.abs(env.walk().depth - deckStop) < 0.1,
     `depth=${deckStop.toFixed(2)} / limit=${journeyLimit}`);
  // And back the whole way, until the rear clamp holds -- a fixed 600 frames now ends mid-tunnel,
  // where "not through the rear boundary" would be true without ever meeting it.
  await turnToYaw(env, 180);                       // turn round; S still walks backwards as well
  env.key("w");
  for (let i = 0, last = -1; i < Math.ceil(journeyLimit / 2) + 600; i += 20) {
    await env.pump(20);
    if (Math.abs(env.walk().depth - last) < 0.01) break;
    last = env.walk().depth;
  }
  env.keyUp("w"); await env.pump(8);
  ok("S cannot walk through the rear boundary either",
     env.walk().depth >= env.walk().minDepth - 0.01 && env.walk().depth - env.walk().minDepth < 1.2,
     `depth=${env.walk().depth.toFixed(2)} / minimum=${env.walk().minDepth}`);
  env.key(" "); await env.pump(10); env.keyUp(" ");
  const peak = env.walk().height;
  await env.pump(60);
  ok("jumping is capped below the narrow room's ceiling and lands cleanly",
     peak > 0 && peak <= env.walk().maxHeight + 0.01 && env.walk().height === 0
       && env.walk().maxHeight === Number(tunnel.dataset.laneCeil) - Number(tunnel.dataset.eye) - 12,
     `peak=${peak.toFixed(1)} cm / clearance=${env.walk().maxHeight} cm`);

  env.close();
  // Tokyo is Nakamise now and opens onto its plaza (round 32), so the sealed-lane clamp is proved on
  // the CN Tower's LookOut, a sealed room with a clear walk to its end wall.
  env = await boot("rooms-cntower.html");
  const sealed = env.doc.querySelector("[data-walk]");
  const sealedFar = Number(sealed.dataset.laneD) - 47;
  ok("a sealed lane (the LookOut) stops 47 cm before its own end wall",
     env.walk().maxDepth === sealedFar,
     `${env.walk().maxDepth} cm / wall at ${Number(sealed.dataset.laneD)} cm`);
  env.key("w"); await env.pump(900); env.keyUp("w"); await env.pump(8);   // the LookOut is 18.6 m deep
  const wallStop = env.walk().depth;
  env.key("w"); await env.pump(30); env.keyUp("w"); await env.pump(8);
  ok("W cannot pass through the sealed LookOut end wall, even when held at the clamp",
     wallStop <= sealedFar + 0.01 && Math.abs(wallStop - sealedFar) < 1.2
       && Math.abs(env.walk().depth - wallStop) < 0.1,
     `depth=${wallStop.toFixed(2)} / limit=${sealedFar}`);

  env.close();
  env = await boot("rooms-fukuoka.html");
  // The aisle route is authored along world x/z, so face the lane axis before walking it.
  await turnToYaw(env, 0);
  const plinth = env.doc.querySelector('[data-obj="plinth-moji"]');
  const plinthX = parseFloat(plinth.style.getPropertyValue("--x"));
  const plinthZ = parseFloat(plinth.style.getPropertyValue("--z"));
  const plinthFront = plinthZ - Number(plinth.dataset.d) / 2;
  const plinthStop = plinthFront - env.walk().radius;
  const wallHalf = env.walk().wallHalf;
  const plinthHalf = Number(plinth.dataset.w) / 2;
  const aisleClearance = wallHalf - plinthHalf - 2 * env.walk().radius;
  ok("the Moji display plinth is authored as a solid walk obstacle", plinth?.dataset.solid === "true");
  /* Round 57: this used to assert `aisleClearance > 0` and call it "a full-body side aisle". It was
     22 cm — measured — and a visitor steering with keys cannot thread 22 cm, so the room ended dead
     at the table's near face and the gate blessed it. A side aisle is a passage a body can actually
     walk down, so the assertion asks for one: a metre of clear width beyond the body. */
  ok("the Moji hall leaves a walkable side aisle around the solid display",
     aisleClearance >= 100 && env.walk().halfWidth > plinthHalf + env.walk().radius,
     `${aisleClearance.toFixed(0)} cm of aisle beyond a 48 cm body`);
  env.key("w"); await env.pump(900); env.keyUp("w"); await env.pump(8);   // the table stands 22 m in now
  const atPlinth = env.walk().depth;
  env.key("w"); await env.pump(40); env.keyUp("w"); await env.pump(8);
  ok("the walker stops at the near face of the port table instead of entering its volume",
     Math.abs(atPlinth - plinthStop) < 1.2 && Math.abs(env.walk().depth - atPlinth) < 0.1,
     `depth=${atPlinth.toFixed(2)} / table edge=${plinthStop.toFixed(2)}`);
  /* Step into the right-hand aisle: head for the hall's own wall and let the table's corner slide the
     body along it. (Before round 65 this was a held D; D turns the head now, so the walk is aimed.) */
  await turnToYaw(env, 90);
  env.key("w");
  for (let i = 0; i < 40 && env.walk().x < env.walk().halfWidth - env.walk().radius - 1; i++) await env.pump(20);
  env.keyUp("w"); await env.pump(8);
  const sideX = env.walk().x;
  ok("the visitor can move fully around the port table without crossing its collision footprint",
     sideX > plinthX + plinthHalf + env.walk().radius
       && sideX <= env.walk().halfWidth + 0.01,
     `aisle x=${sideX.toFixed(1)}; collider edge=${plinthX + plinthHalf + env.walk().radius}`);
  /* round 54 review: the fixed pump was budgeted for the hall as R32 authored it — since the lane
     runs on to the quay (d 900→1100), 250 frames no longer reaches the far clamp. What the gate
     guards is the aisle's OPENNESS, so let it walk until it arrives or the budget (3× the old) runs. */
  await turnToYaw(env, 0);                         // and on down the hall, past the display
  env.key("w");
  for (let i = 0; i < 40 && env.walk().depth < env.walk().maxDepth - 1.5; i++) await env.pump(20);
  env.keyUp("w"); await env.pump(8);
  const pastTable = env.walk().depth;
  /* Round 32: the true-scale table meets the hall's far wall, where the strait carries on at the same
     scale, so there is no floor beyond it to walk onto. What this defends is that the table is not a
     wall across the hall: the aisle beside it stays open for the hall's whole depth, to its clamp. */
  ok("the side aisle stays open beside the display for the hall's whole depth",
     pastTable > plinthFront && pastTable >= env.walk().maxDepth - 1.5,
     `depth=${pastTable.toFixed(0)}; clamp=${env.walk().maxDepth}`);

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
  const cReach = await walkToReach(env, "door-toronto");
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
  const tReach = await walkToReach(env, "door-tokyo");
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
  const fReach = await walkToReach(env, "door-fukuoka");
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
    ["rooms.html", "gate-kaminari", "Tokyo"],
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

  /* ---- 7. Tokyo inside: a press answers, Esc folds it before leaving -- */
  out.push("\n-- Tokyo, inside Kaminarimon: E answers at the west row, the gate leaves --");
  env = await boot("rooms.html");
  // Nakamise is 9.1 m wide, so nothing stands within arm's reach of the gate's centre line: take a
  // step in and sidle to the west row. Round 56: the walk used to overshoot this stop by about two
  // metres, because the first frame after the rest replayed its whole gap; which is why this test
  // used to arrive beside a shutter where the shop bay happened to be nearest, by accident. The stop
  // is now derived from the row itself.
  const bayW1 = env.doc.querySelector('[data-obj="shopbay-w1"]');
  const bayZ = parseFloat(bayW1.style.getPropertyValue("--z"));
  await turnToYaw(env, 0);
  await walkToDepth(env, bayZ - 60);
  await walkToReach(env, "frame-sensoji");
  const rowReach = env.reach();
  // What is nearest at this row is the print hung on the shutter, not the 5.5 m-wide bay behind it:
  // the bay's centre is a metre and a half away while the print is an arm's length (measured at this
  // stop: print 31 cm, bay 99 cm). The test asserts exactly that, so a change of reach ranking cannot
  // silently start opening something else.
  ok("tokyo: a step inside the gate, the print on the westernmost shutter is in reach",
     rowReach?.dataset.obj === "frame-sensoji", rowReach?.dataset.obj || "none");
  env.key("e");
  await env.pump(10); await sleep(120);
  const plateEl = env.doc.getElementById("room-plate");
  ok("tokyo: E on the print opens its own rail (a press never goes unanswered)",
     !!plateEl && plateEl.classList.contains("is-rail") && plateEl.classList.contains("is-open"),
     plateEl ? plateEl.className : "no rail");
  // The rail's own Esc sits on the plate, so that leaving a frame is not leaving the lane. Dispatch
  // it where a browser would have put it: on the plate the press just opened.
  if (plateEl && plateEl.classList.contains("is-open")) {
    plateEl.dispatchEvent(new env.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await env.pump(6); await sleep(60);
    ok("tokyo: Esc folds the frame before it touches the lane",
       !plateEl.classList.contains("is-open") && env.navs.length === 0,
       `${plateEl.className} / navs ${env.navs.length}`);
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
  // authored right-hand aisle, pass the model's far edge, then continue toward the harbour. The
  // test path is world-axis aligned; visitors can approach it at any heading in the actual scene.
  await turnToYaw(env, 0);
  env.key("w"); await env.pump(700); env.keyUp("w"); await env.pump(8);
  await turnToYaw(env, 90);                        // into the right-hand aisle beside the table
  await walkUntilBlocked(env, 400);
  await turnToYaw(env, 0);                         // and down it, toward the water
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
    ["street.html", "door-toronto", "rooms-toronto.html", { fwd: 420 }],
    ["street.html", "door-tokyo", "rooms.html", { fwd: 1200 }],
    ["street.html", "door-fukuoka", "rooms-fukuoka.html", { fwd: 2000 }],
    ["rooms.html", "gate-kaminari", "street.html", { fwd: 300 }],
    ["rooms-fukuoka.html", "curtain-back", "street.html", { fwd: 300 }],
    ["rooms-toronto.html", "door-back", "street.html", { fwd: 300 }],
  ]) {
    const e2 = await boot(file);
    const el = e2.doc.querySelector(`[data-obj="${objId}"]`);
    /* A door needs both some distance (its box overflows the view at arm's length) and a look toward
       it: walk in to the depth, then turn to the door's own bearing. This used to edge sideways with
       A/D, which turned the head instead of the body after round 65 and left the door off screen. */
    if (prep.fwd) await walkToDepth(e2, prep.fwd);
    if (el) {
      const bearing = Math.atan2(parseFloat(el.style.getPropertyValue("--x")) - e2.walk().x,
                                 parseFloat(el.style.getPropertyValue("--z")) - e2.walk().depth) * 180 / Math.PI;
      await turnToYaw(e2, bearing);
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

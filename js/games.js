/* js/games.js — the two festival stalls, playable over the lane (round 50).
 *
 * The owner asked, in the street's own words: 「做一些有趣的日本攤販遊戲在那環境裡面可以直接玩」.
 * These are toys, not records: nothing here claims Nakamise hosted a stall at a measured address —
 * the markup says so on every button, and the geometry never enters the surveyed world. What the
 * games borrow from the street is its palette and its physics of attention: the basin is the same
 * murk navy the painter folds its nights into, the fish and masks are the lamp colours
 * (NIGHT_LAMPS' amber and vermilion), and the hour button reaches them: at night the stalls' own
 * lanterns are lit, in daylight the toys keep a gentler floor.
 *
 * Two games share one panel and one loop:
 *   kingyo — goldfish scooping. A paper net rides the pointer; holding it under the water scoops,
 *            and holding too deep or too long parts the paper (the real stall's whole cruelty).
 *   menya  — the mask targets. Blank masks slide along a beaded line; twelve pellets, a breathing
 *            aim. Hit three on a row and the line speeds up, like it does.
 *
 * The rules live in plain state machines (step(dt, input)) that the headless gates can drive with a
 * fixed seed; the renderer here is thin on purpose. Reduced motion slows the fish and stills the
 * beads; the spoken status is one aria-live region the reader already watches. No dependencies.
 */
(function () {
  "use strict";
  if (window.huaxuStalls) return;

  /* the street's own colours — every one of them authored before this file existed */
  var INK = "#141d30", NAVY = "#16223c", WATER = "#1b3247", PAPER = "#eef4f7";
  var AMBER = "#e0a13f", VERMIL = "#e0435c", BLUE = "#3f7de0", GLOW = "#ffd9a0";
  var W = 640, H = 400;

  function rng(seed) {                                  // xorshift32: deterministic, for the gates
    var s = (seed | 0) || 88172645;
    return function () {
      s ^= s << 13; s |= 0; s ^= s >>> 17; s ^= s << 5; s |= 0;
      return ((s >>> 0) % 100000) / 100000;
    };
  }
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ---- goldfish scooping --------------------------------------------------------- */
  function kingyo(reduced) {
    var r = rng(20261019), slow = reduced ? 0.45 : 1;
    var basin = { x: 40, y: 120, w: W - 80, h: H - 170 };
    var fishes = [], net = { x: W / 2, y: basin.y + 40 }, t = 0, left = 45, caught = 0, broke = 0;
    var dip = 0, held = false, torn = 0, over = false, msg = "";
    var COLOURS = [AMBER, VERMIL, BLUE];
    for (var i = 0; i < 7; i++) {
      fishes.push({ x: basin.x + 30 + r() * (basin.w - 60), y: basin.y + 26 + r() * (basin.h - 52),
                    a: r() * Math.PI * 2, sp: 34 + r() * 26, tail: r() * 6, c: COLOURS[i % 3], big: r() < 0.3 });
    }
    function step(dt, input) {
      if (over) return;
      t += dt; left = Math.max(0, left - dt);
      net.x = clamp(input.x, basin.x + 12, basin.x + basin.w - 12);
      net.y = clamp(input.y, basin.y + 12, basin.y + basin.h - 12);
      held = !!input.hold;
      dip += held ? dt : -dt * 2.2;
      dip = clamp(dip, 0, 1);
      // the paper's cruelty: deep and still is safe; deep and *moving* is what parts it
      var speed = Math.hypot(input.dx || 0, input.dy || 0);
      if (held && dip > 0.62 && (dip > 0.9 || speed > 220 * dt)) {
        torn += dt * (1.6 + dip * 2);
        if (torn > 0.5) { torn = 0; dip = 0; broke++; msg = "the paper parts — a new net, quick"; }
      } else torn = Math.max(0, torn - dt);
      var fx = 0, fy = 0;
      for (i = 0; i < fishes.length; i++) {
        var f = fishes[i];
        f.a += (r() - 0.5) * 2.4 * dt; f.tail += dt * 9 * slow;
        f.x += Math.cos(f.a) * f.sp * dt * slow; f.y += Math.sin(f.a) * f.sp * 0.55 * dt * slow;
        if (f.x < basin.x + 20) { f.x = basin.x + 20; f.a = Math.PI - f.a; }
        if (f.x > basin.x + basin.w - 20) { f.x = basin.x + basin.w - 20; f.a = Math.PI - f.a; }
        if (f.y < basin.y + 18) { f.y = basin.y + 18; f.a = -f.a; }
        if (f.y > basin.y + basin.h - 18) { f.y = basin.y + basin.h - 18; f.a = -f.a; }
        if (dip > 0.34 && Math.hypot(f.x - net.x, f.y - net.y) < 20) { fx = f.x; fy = f.y; }
      }
      if (dip > 0.34 && fx) {                                // what a submerged net touches, it keeps
        fishes.splice(fishes.indexOf(fishes.filter(function (g) { return g.x === fx && g.y === fy; })[0]), 1);
        caught++; dip = 0; msg = "a goldfish — " + caught + " to the bag";
        if (caught >= 4) { over = true; msg = "the vendor nods: four, and the string of them is yours"; }
      }
      if (left <= 0 && !over) { over = true; msg = "the lantern time is up — " + caught + " caught, " + broke + " nets lost"; }
    }
    function draw(g) {
      g.fillStyle = INK; g.fillRect(0, 0, W, H);
      // the basin: the painter's water, one navy brighter; the stall's lantern lands as a warm wash
      g.fillStyle = NAVY; g.fillRect(12, 84, W - 24, H - 96);
      var gr = g.createRadialGradient(W / 2, 20, 8, W / 2, 20, 260);
      gr.addColorStop(0, "rgba(255,217,160,0.30)"); gr.addColorStop(1, "rgba(255,217,160,0)");
      g.fillStyle = gr; g.fillRect(12, 84, W - 24, H - 96);
      g.fillStyle = WATER; g.fillRect(basin.x, basin.y, basin.w, basin.h);
      for (var i = 0; i < fishes.length; i++) {
        var f = fishes[i], s = f.big ? 1.35 : 1;
        g.save(); g.translate(f.x, f.y); g.rotate(Math.cos(f.a) < 0 ? Math.PI : 0);
        g.fillStyle = f.c; g.globalAlpha = 0.92;
        g.beginPath(); g.ellipse(0, 0, 11 * s, 6 * s, 0, 0, 7); g.fill();
        g.beginPath(); g.moveTo(-10 * s, 0); g.lineTo(-17 * s, -5 * s + Math.sin(f.tail) * 2);
        g.lineTo(-17 * s, 5 * s + Math.sin(f.tail) * 2); g.closePath(); g.fill();
        g.restore(); g.globalAlpha = 1;
      }
      // the net: a ring and a paper dish; dipped it sinks, tearing it shows
      var dy = dip * 26;
      g.strokeStyle = "rgba(238,244,247," + (0.5 + 0.45 * (1 - dip)) + ")";
      g.lineWidth = 2;
      g.beginPath(); g.arc(net.x, net.y + dy * 0.4, 17, 0, 7); g.stroke();
      g.fillStyle = torn > 0 ? "rgba(238,244,247," + (0.5 - torn * 0.5) + ")" : "rgba(238,244,247,0.5)";
      g.beginPath(); g.arc(net.x, net.y + dy * 0.4, 16 * (1 - dip * 0.18), 0, 7); g.fill();
      if (torn > 0.2) { g.strokeStyle = VERMIL; g.beginPath();
        g.moveTo(net.x - 9, net.y + dy * 0.4 - 4); g.lineTo(net.x + 6, net.y + dy * 0.4 + 7); g.stroke(); }
      // the counter rail: the stall's own board with the day's two numbers
      g.fillStyle = "#241b12"; g.fillRect(12, 8, W - 24, 62);
      g.fillStyle = PAPER; g.font = "16px Georgia, serif";
      g.fillText("goldfish " + caught + " / 4", 30, 44);
      g.fillText("nets lost " + broke, 200, 44);
      g.fillStyle = AMBER;
      g.fillText("lantern time " + Math.ceil(left) + " s", 392, 44);
      if (msg) { g.fillStyle = GLOW; g.fillText(msg, 30, H - 14); }
    }
    return { step: step, draw: draw, over: function () { return over; },
             score: function () { return caught; }, msg: function () { return msg; } };
  }

  /* ---- the mask targets ----------------------------------------------------------- */
  function menya(reduced) {
    var r = rng(773311);
    var shots = 12, hits = 0, streak = 0, over = false, msg = "", t = 0;
    var aim = { x: W / 2, y: H / 2 + 30 }, breath = reduced ? 0 : 1, kick = 0;
    var ROWS = [120, 178, 236, 294];
    var masks = [];
    for (var i = 0; i < 9; i++) {
      masks.push({ x: 60 + r() * (W - 120), row: ROWS[i % ROWS.length], dir: r() < 0.5 ? -1 : 1,
                  sp: 26 + r() * 30, hit: false, c: [PAPER, AMBER, VERMIL][i % 3], tilt: 0 });
    }
    function step(dt, input) {
      if (over) return;
      t += dt; kick = Math.max(0, kick - dt * 3);
      aim.x = clamp(input.x + (breath ? Math.sin(t * 1.7) * 6 : 0), 14, W - 14);
      aim.y = clamp(input.y + (breath ? Math.cos(t * 1.3) * 4 : 0), 96, H - 16);
      var speed = 1 + Math.min(2, streak * 0.5);
      for (i = 0; i < masks.length; i++) {
        var m = masks[i];
        if (m.hit) { m.tilt += dt * 4; continue; }
        m.x += m.dir * m.sp * speed * dt * (reduced ? 0.5 : 1);
        if (m.x < 26 || m.x > W - 26) { m.dir = -m.dir; m.x = clamp(m.x, 26, W - 26); }
      }
      if (input.shoot && shots > 0) {
        shots--; kick = 1;
        var landed = false;
        for (i = 0; i < masks.length; i++) {
          var mm = masks[i];
          if (!mm.hit && Math.abs(mm.x - aim.x) < 22 && Math.abs(mm.row - aim.y) < 17) {
            mm.hit = true; hits++; streak++; landed = true;
            msg = "off the wire — " + hits + (streak >= 3 ? ", and the line runs faster" : "");
            if (hits >= 6) { over = true; msg = "the vendor bags a mask for you: six off, a fair morning"; }
            break;
          }
        }
        if (!landed) streak = 0;                    // a miss breaks the run; the line stops speeding
        if (shots <= 0 && !over) { over = true; msg = hits >= 3 ? hits + " off the wire — the stall approves"
          : hits + " of twelve: the masks were quick today"; }
      }
    }
    function draw(g) {
      g.fillStyle = "#1a1424"; g.fillRect(0, 0, W, H);
      g.fillStyle = NAVY; g.fillRect(12, 84, W - 24, H - 96);
      // the beaded curtain behind the row, and a warm lantern across the tops
      g.strokeStyle = "rgba(238,244,247,0.14)"; g.lineWidth = 1;
      for (var bx = 24; bx < W - 12; bx += 26) { g.beginPath(); g.moveTo(bx, 92); g.lineTo(bx, H - 20); g.stroke(); }
      var gr = g.createRadialGradient(W / 2, 30, 6, W / 2, 30, 300);
      gr.addColorStop(0, "rgba(255,217,160,0.26)"); gr.addColorStop(1, "rgba(255,217,160,0)");
      g.fillStyle = gr; g.fillRect(12, 84, W - 24, H - 96);
      for (i = 0; i < masks.length; i++) {
        var m = masks[i];
        g.save(); g.translate(m.x, m.row + (m.hit ? 26 * Math.min(1, m.tilt) : 0));
        if (m.hit) g.rotate(Math.min(1.35, m.tilt));
        g.fillStyle = m.c; g.globalAlpha = m.hit ? 0.4 : 1;
        g.beginPath(); g.moveTo(-18, -14); g.quadraticCurveTo(0, -22, 18, -14);
        g.quadraticCurveTo(16, 12, 0, 16); g.quadraticCurveTo(-16, 12, -18, -14); g.closePath(); g.fill();
        g.restore(); g.globalAlpha = 1;
      }
      // the aim: two ticks and a dot, never a crosshair pretending to be a gun sight
      var k = kick * 4;
      g.strokeStyle = kick > 0.02 ? GLOW : PAPER; g.lineWidth = 2;
      g.beginPath(); g.moveTo(aim.x - 12 - k, aim.y); g.lineTo(aim.x - 4, aim.y);
      g.moveTo(aim.x + 4, aim.y); g.lineTo(aim.x + 12 + k, aim.y);
      g.moveTo(aim.x, aim.y - 12 - k); g.lineTo(aim.x, aim.y - 4);
      g.moveTo(aim.x, aim.y + 4); g.lineTo(aim.x, aim.y + 12 + k); g.stroke();
      g.fillStyle = "#241b12"; g.fillRect(12, 8, W - 24, 62);
      g.fillStyle = PAPER; g.font = "16px Georgia, serif";
      g.fillText("pellets " + shots, 30, 44);
      g.fillStyle = AMBER; g.fillText("masks off the wire " + hits + " / 6", 180, 44);
      if (msg) { g.fillStyle = GLOW; g.fillText(msg, 30, H - 14); }
    }
    return { step: step, draw: draw, over: function () { return over; },
             score: function () { return hits; }, msg: function () { return msg; } };
  }

  /* ---- the rapids bell (Niagara, round 51) ------------------------------------------------------
     A toy ride, not a survey: the boat is the street's own canvas raft, the water is NIA_RIVER's
     teal, the rocks are the kerb's dark. The bell hangs on a wire the way the street's bulbs do —
     ring it three times within the lantern time and the current lets you go; take it apart on the
     rocks three times and the morning is over. The rules are deterministic on a fixed seed. */
  function rapids(reduced) {
    var r = rng(9182733), slow = reduced ? 0.55 : 1;
    var t = 0, left = 45, bells = 0, bumps = 0, over = false, msg = "";
    var boat = { x: W / 2, y: H - 92 }, vy = 0, tilt = 0, inv = 0;
    var cur = 0, things = [], spawn = 0;
    function step(dt, input) {
      if (over) return;
      t += dt; left = Math.max(0, left - dt); inv = Math.max(0, inv - dt);
      cur = Math.sin(t * 0.6) * 46 + Math.sin(t * 0.19) * 26;      // the current, two swells deep
      var push = (input.x || boat.x) - boat.x;
      boat.x = clamp(boat.x + clamp(push, -1, 1) * 190 * dt * slow + cur * dt, 26, W - 26);
      if (input.y) boat.y = clamp(boat.y + (input.y - boat.y) * 2.4 * dt, H - 170, H - 46);
      tilt += ((clamp(push, -1, 1) * 0.22 + cur * 0.0016) - tilt) * dt * 5;
      spawn -= dt;
      if (spawn <= 0) {
        spawn = 0.62 / slow;
        var kind = r() < 0.34 ? "bell" : "rock";
        things.push({ kind: kind, x: 50 + r() * (W - 100), y: -30, sp: (108 + r() * 70) * slow,
                      spin: r() * 6, gone: false });
      }
      for (var i = things.length - 1; i >= 0; i--) {
        var o = things[i];
        o.y += o.sp * dt; o.spin += dt * 2.2;
        if (o.y > H + 30) { things.splice(i, 1); continue; }
        var d = Math.hypot(o.x - boat.x, o.y - boat.y);
        if (o.kind === "bell" && d < 30) {
          o.gone = true; things.splice(i, 1); bells++;
          msg = bells >= 3 ? "the bell speaks for you: three rings, the run is yours"
              : "a ring on the wire — " + bells + " of 3";
          if (bells >= 3) over = true;
        } else if (o.kind === "rock" && d < 22 && inv <= 0) {
          o.gone = true; things.splice(i, 1); bumps++; inv = 1.6;
          if (bumps >= 3) { over = true; msg = "the raft hangs on the rocks — three scrapes, a swimmer's morning"; }
          else msg = "off the rock, " + (3 - bumps) + " scrape" + (3 - bumps === 1 ? "" : "s") + " left";
        }
      }
      if (left <= 0 && !over) { over = true; msg = "the mist closes the hour — " + bells + " rings, " + bumps + " scrapes"; }
    }
    function draw(g) {
      g.fillStyle = "#12202e"; g.fillRect(0, 0, W, H);
      // the river, scrolling: the teal the falls' own pool is authored in, streaked with the night navy
      g.fillStyle = "#1b3247"; g.fillRect(0, 60, W, H - 60);
      g.fillStyle = "rgba(61,112,108,0.55)";
      for (var i = 0; i < 9; i++) {
        var wy = 60 + ((t * 90 + i * 44) % (H - 60));
        g.fillRect(0, wy, W, 8);
      }
      g.fillStyle = "rgba(221,239,246,0.16)";
      for (i = 0; i < 5; i++) {
        var fy = 60 + ((t * 130 + i * 71) % (H - 60));
        g.fillRect((Math.sin(i * 2.3) * 0.5 + 0.5) * W - 40, fy, 90, 3);
      }
      // the wire and its bells
      g.strokeStyle = "rgba(205,214,238,0.25)"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, 74); g.quadraticCurveTo(W / 2, 96, W, 74); g.stroke();
      for (i = 0; i < things.length; i++) {
        var o = things[i];
        if (o.kind === "bell") {
          g.fillStyle = AMBER;
          g.beginPath(); g.moveTo(o.x - 9, o.y); g.quadraticCurveTo(o.x, o.y - 16, o.x + 9, o.y);
          g.lineTo(o.x + 11, o.y + 6); g.lineTo(o.x - 11, o.y + 6); g.closePath(); g.fill();
          g.strokeStyle = "rgba(255,217,160,0.5)"; g.beginPath(); g.arc(o.x, o.y + 3, 15 + Math.sin(o.spin) * 2, 0, 7); g.stroke();
        } else {
          g.save(); g.translate(o.x, o.y); g.rotate(Math.sin(o.spin) * 0.2);
          g.fillStyle = "#241b12";
          g.beginPath(); g.moveTo(-13, 8); g.lineTo(-6, -8); g.lineTo(6, -10); g.lineTo(14, 6); g.closePath(); g.fill();
          g.fillStyle = "rgba(221,239,246,0.20)"; g.fillRect(-14, 6, 28, 4);   // foam shouldered past it
          g.restore();
        }
      }
      // the raft: a square boat with a bow wake, tilted by the current, pale while it recovers
      g.save(); g.translate(boat.x, boat.y); g.rotate(tilt);
      g.globalAlpha = inv > 0 ? 0.45 : 1;
      g.fillStyle = "#6b4b2c"; g.beginPath();
      g.moveTo(-16, 20); g.lineTo(-16, -14); g.lineTo(0, -24); g.lineTo(16, -14); g.lineTo(16, 20); g.closePath(); g.fill();
      g.fillStyle = "#3f5170"; g.fillRect(-11, -8, 22, 22);
      g.strokeStyle = PAPER; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-4, -18); g.lineTo(4, 12); g.stroke();            // one paddle, mid-stroke
      g.restore(); g.globalAlpha = 1;
      // the counter
      g.fillStyle = "#241b12"; g.fillRect(12, 8, W - 24, 46);
      g.fillStyle = PAPER; g.font = "16px Georgia, serif";
      g.fillText("bell rings " + bells + " / 3", 30, 38);
      g.fillStyle = VERMIL; g.fillText("scrapes " + bumps + " / 3", 220, 38);
      g.fillStyle = AMBER; g.fillText("mist hour " + Math.ceil(left) + " s", 392, 38);
      if (msg) { g.fillStyle = GLOW; g.fillText(msg, 30, H - 14); }
    }
    return { step: step, draw: draw, over: function () { return over; },
             score: function () { return bells; }, msg: function () { return msg; } };
  }

  var GAMES = { kingyo: { make: kingyo, name: "The goldfish basin",
              help: "Move the net with the pointer or the arrows; hold to dip. Deep and quick parts the paper. Four goldfish before the lantern time is up." },
                rapids: { make: rapids, name: "The rapids bell",
              help: "Steer the raft with the pointer or the arrows against the current. Ring the hanging bell three times before the mist hour is up; three scrapes on the rocks ends the ride." },
                menya: { make: menya, name: "The mask targets",
              help: "Move the aim with the pointer or the arrows; press or Space fires a pellet. Twelve pellets; six masks off the wire is a fair morning." } };

  /* ---- the panel: one dialog over the lane, opened by the stalls' own buttons ------- */
  var panel = document.querySelector("[data-walk-game]");
  var api = { open: function () { return false; } };
  if (!panel) { window.huaxuStalls = api; return; }   // every other lane: no stalls, no game
  var canvas = panel.querySelector("canvas");
  var statusEl = panel.querySelector("[data-game-status]");
  var titleEl = panel.querySelector("[data-game-title]");
  var gctx = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = null, raf = 0, last = 0, back = null, playing = null, keys = {};

  function status(text) { if (statusEl) statusEl.textContent = text; }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.12, (ts - last) / 1000 || 0.016); last = ts;
    if (!cur) return;
    var ix = cur.pointer || { x: W / 2, y: H / 2, hold: false, dx: 0, dy: 0, shoot: false };
    ix.x = clamp(ix.x + ((keys.left ? -7 : 0) + (keys.right ? 7 : 0)), 0, W);
    ix.y = clamp(ix.y + ((keys.up ? -7 : 0) + (keys.down ? 7 : 0)), 0, H);
    ix.hold = ix.hold || !!keys.space;
    cur.step(dt, ix);
    cur.draw(gctx);
    ix.dx = 0; ix.dy = 0; ix.shoot = false; ix.hold = !!(keys.space);
    if (cur.over && cur.over()) { status(cur.msg()); stop(); }
  }
  function begin(id) {
    stop();
    var spec = GAMES[id]; if (!spec) return false;
    playing = id; cur = spec.make(reduced);
    cur.pointer = { x: W / 2, y: H / 2 + 40, hold: false, dx: 0, dy: 0, shoot: false };
    if (titleEl) titleEl.textContent = spec.name;
    status(spec.help);
    panel.hidden = false;
    panel.dataset.game = id;
    last = performance.now(); raf = requestAnimationFrame(frame);
    return true;
  }
  function end() {
    stop(); cur = null; panel.hidden = true; playing = null;
    if (back && back.focus) back.focus();
    back = null;
  }
  api = {
    open: function (id, fromEl) {
      if (!begin(id)) return false;
      back = fromEl || document.activeElement;
      var close = panel.querySelector("[data-game-close]");
      if (close) close.focus();
      return true;
    },
    close: end,
    // the gates drive one frame's math without a browser: the machine is the contract, not the film
    machine: function (id) { return GAMES[id] ? GAMES[id].make(false) : null; }
  };
  window.huaxuStalls = api;

  panel.querySelector("[data-game-close]").addEventListener("click", end);
  var inputPos = function (event) {
    var box = canvas.getBoundingClientRect();
    var px = (event.clientX - box.left) * (W / box.width), py = (event.clientY - box.top) * (H / box.height);
    var p = cur && cur.pointer; if (!p) return;
    p.dx = px - p.x; p.dy = py - p.y; p.x = px; p.y = py;
  };
  canvas.addEventListener("pointermove", inputPos);
  canvas.addEventListener("pointerdown", function (event) {
    inputPos(event);
    if (!cur) return;
    if (playing === "menya") cur.pointer.shoot = true;
    else if (playing === "rapids") { if (cur.over && cur.over()) begin(playing); }
    else cur.pointer.hold = true;
    if (cur.over && cur.over()) begin(playing); else canvas.setPointerCapture && canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", function () { if (cur) { cur.pointer.hold = false; } });
  panel.addEventListener("keydown", function (event) {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); end(); return; }
    var k = event.key;
    if (k === "ArrowLeft" || k === "a") keys.left = 1;
    if (k === "ArrowRight" || k === "d") keys.right = 1;
    if (k === "ArrowUp" || k === "w") keys.up = 1;
    if (k === "ArrowDown" || k === "s") keys.down = 1;
    if (k === " ") { keys.space = 1; if (playing === "menya" && cur) cur.pointer.shoot = true; }
    if (k === "Enter" && cur && cur.over && cur.over()) { begin(playing); return; }
    if (/^( |Arrow)/.test(k)) event.preventDefault();
  });
  panel.addEventListener("keyup", function (event) {
    var k = event.key;
    if (k === "ArrowLeft" || k === "a") keys.left = 0;
    if (k === "ArrowRight" || k === "d") keys.right = 0;
    if (k === "ArrowUp" || k === "w") keys.up = 0;
    if (k === "ArrowDown" || k === "s") keys.down = 0;
    if (k === " ") keys.space = 0;
  });
  document.addEventListener("keydown", function (event) {
    // a stall button that already carries focus plays from the keyboard too
    if (event.key === "Enter" || event.key === " ") {
      var el = document.activeElement;
      if (el && el.dataset && el.dataset.game) { event.preventDefault(); api.open(el.dataset.game, el); }
    }
  });
})();

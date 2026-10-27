/* Drive the lane with the keyboard and measure how it answers.

   The owner's complaint (round 65): "the movement is still terrible, not the normal kind" and
   "every small thing is clickable, and I cannot click the waterfall". A complaint like that is a
   measurement request, so this measures instead of arguing:

     - how long the body takes to start moving after the key goes down (the latency),
     - how far it travels per second while the key is held (the cruise), against the model's own
       velocity, because those two are different numbers and the difference is the complaint,
     - whether W moves along the view and A/D turn (the scheme),
     - how fast the head turns -- measured over a SHORT window, because 120 degrees a second
       wraps the yaw inside a three-second hold and a net yaw cannot tell a turn from no turn,
     - the frame time, because a scheme can be right and still feel bad if the picture cannot keep
       up with it,
     - how many things are clickable, and how big their press boxes are (the other half of the
       owner's complaint), and
     - what a tap on the scenery does, and what a tap on the landmark does (the waterfall).

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib ROOMS=rooms-niagara.html node .verify/_keys.mjs
         KEYS=w,a,d,arrowleft HOLD=1500 TURN_MS=400 node .verify/_keys.mjs
*/
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const ROOMS = process.env.ROOMS || "rooms-niagara.html";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const HOLD = Number(process.env.HOLD || 2000);
const TURN_MS = Number(process.env.TURN_MS || 400);   // short enough that the yaw cannot wrap
const KEYS = (process.env.KEYS || "w,s,a,d,arrowleft").split(",").filter(Boolean);
const TAP = process.env.TAP !== "0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(`${BASE}/${ROOMS}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
/* Wait for the lane itself, not for the renderer: the scene builds after the renderer exists, and
   a probe that measures a half-built lane reports empty boxes and misses every click. */
await page.waitForFunction(() => {
  const st = document.querySelector("[data-walk-status]")?.textContent || "";
  const hits = Array.from(document.querySelectorAll(".walk-hit"))
    .filter((el) => el.style.visibility !== "hidden");
  return !/Building|Loading/i.test(st) && hits.length > 0;
}, { timeout: 60000 });
await sleep(1200);

const state = () => page.evaluate(() => {
  const w = document.querySelector("[data-walk]")?.__walk;
  if (!w) return null;
  const status = document.querySelector("[data-walk-status]")?.textContent?.trim() || "";
  return { x: w.x, z: w.depth, yaw: w.yaw, pitch: w.pitch, quads: w.quads,
           vel: w.velocity, maxSpeed: w.maxSpeed, turnRate: w.turnRate,
           frameMs: w.frameMs, renderMs: w.renderMs, tickMs: w.tickMs,
           scale: w.renderScale, size: w.renderSize,
           status };
});

// how many things are clickable at all, and how big are the press boxes
const census = await page.evaluate(() => {
  const hits = Array.from(document.querySelectorAll(".walk-hit"));
  const live = hits.filter((el) => el.style.visibility !== "hidden" && el.tabIndex >= 0);
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { id: el.dataset.obj, w: Math.round(r.width), h: Math.round(r.height),
             quiet: el.dataset.quiet === "1" || el.dataset.quiet === "true" };
  };
  const areas = live.map(rect).sort((a, b) => (a.w * a.h) - (b.w * b.h));
  return {
    buttons: hits.length, live: live.length,
    liveTiny: areas.filter((a) => a.w * a.h < 1600).length,
    liveHuge: areas.filter((a) => a.w * a.h > 250000).length,
    smallest: areas.slice(0, 6), biggest: areas.slice(-6),
  };
});
console.log("hotspots:", JSON.stringify(census, null, 1));

const hold = async (key, ms = HOLD) => {
  const before = await state();
  const t0 = Date.now();
  await page.keyboard.down(key);
  let latency = null, modelVel = 0, frameMs = 0, renderMs = 0;
  let turnFirst = null;                       // the yaw and the clock at the short window's start
  for (let i = 0; i < ms / 40; i++) {
    await sleep(40);
    const s = await state();
    if (!s) continue;
    modelVel = Math.max(modelVel, s.vel);
    frameMs = s.frameMs;
    renderMs = s.renderMs;
    if (turnFirst === null && Date.now() - t0 >= TURN_MS) turnFirst = { yaw: s.yaw, at: Date.now() - t0 };
    if (latency === null && (Math.abs(s.z - before.z) > 0.5 || Math.abs(s.x - before.x) > 0.5
                             || Math.abs(s.yaw - before.yaw) > 0.2)) {
      latency = Date.now() - t0;
    }
  }
  const mid = await state();
  await page.keyboard.up(key);
  await sleep(300);
  const after = await state();
  const dt = (Date.now() - t0) / 1000;
  const dz = after.z - before.z, dx = after.x - before.x;
  const wrap = (v) => { let d = v; while (d > 180) d -= 360; while (d < -180) d += 360; return d; };
  const dyaw = wrap(after.yaw - before.yaw);
  // The short window: from the first sample after TURN_MS to the last one before the key came up.
  // A turn of 120 degrees a second covers 48 degrees in 400 ms -- far inside a single turn, so the
  // number says what the head did rather than how far it came round.
  const short = turnFirst && mid
    ? +(wrap(mid.yaw - turnFirst.yaw) / ((Date.now() - t0 - turnFirst.at) / 1000)).toFixed(1)
    : null;
  return {
    key, seconds: +dt.toFixed(2), latencyMs: latency,
    dz: Math.round(dz), dx: Math.round(dx), dyaw: +dyaw.toFixed(1),
    actualCmPerSec: Math.round(Math.hypot(dx, dz) / dt),
    modelCmPerSec: Math.round(modelVel),
    shortWindowDegPerSec: short,
    frameMs: Math.round(frameMs), renderMs: Math.round(renderMs),
    tickMs: Math.round(after ? after.tickMs : 0), renderScale: after ? after.scale : null,
    status: after ? after.status : "",
  };
};

for (const key of KEYS) {
  const r = await hold(key);
  console.log(`key ${key.padEnd(10)} ${JSON.stringify(r)}`);
}

/* The other half of the owner's complaint: what a tap does.

   Round 71 changed the answer, so this measures the new one. The owner: "many unnecessary objects
   pop this window; it disrupts operating the scene". A tap on the picture now presses nothing at
   all -- it only folds what is open -- and the finger's one press is the bar at the foot of the
   picture, which appears only while something is in reach and carries that thing's own name. So a
   tap is reported as "opens nothing", and the bar is pressed afterwards to show that the thing the
   tap refused is still reachable. The waterfall has to stay findable and openable: it is the thing
   the owner could not click in round 65, and the bar is what answers it now. */
if (TAP) {
  /* A tap is a finger on the screen, so the box has to be *in the picture* for the tap to mean
     anything. The probe therefore looks around -- small turns, the way a visitor does -- until the
     thing it is looking for is actually on the glass, and then it taps that. */
  const boxes = () => page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".walk-hit").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return;
      if (!(r.left > 0 && r.top > 0 && r.right < innerWidth && r.bottom < innerHeight)) return;
      out.push({ obj: el.dataset.obj, title: el.dataset.title || "", kind: el.dataset.kind, quiet: el.dataset.quiet === "1",
                 landmark: el.dataset.landmark === "1", leave: el.dataset.leave || "",
                 x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
                 w: Math.round(r.width), h: Math.round(r.height) });
    });
    return out;
  });
  const turn = async (key, ms) => {
    await page.keyboard.down(key); await sleep(ms); await page.keyboard.up(key); await sleep(170);
  };
  const tap = async (label, t) => {
    if (!t) { console.log(`tap ${label.padEnd(9)} nothing on the screen`); return; }
    const under = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      const hit = el && el.closest ? el.closest(".walk-hit") : null;
      return { tag: el ? el.tagName.toLowerCase() : "none",
               obj: hit ? hit.dataset.obj : null,
               quiet: hit ? hit.dataset.quiet === "1" : null,
               landmark: hit ? hit.dataset.landmark === "1" : null };
    }, t);
    console.log(`     under the finger: ${under.tag} ${under.obj || ""} quiet=${under.quiet} landmark=${under.landmark}`);
    await page.mouse.click(t.x, t.y);
    await sleep(340);
    const after = await page.evaluate(() => {
      const card = document.querySelector("[data-walk-card]");
      return { cardOpen: !card.hidden,
               title: card.hidden ? "" : (document.querySelector("[data-walk-title]")?.textContent || ""),
               status: document.querySelector("[data-walk-status]")?.textContent?.trim() || "" };
    });
    const bar = await page.evaluate(() => {
      const b = document.querySelector("[data-walk-open]");
      return b && !b.hidden ? b.textContent.trim() : null;
    });
    console.log(`tap ${label.padEnd(9)} ${t.obj} (${t.w}x${t.h}) -> card=${after.cardOpen} ${JSON.stringify(after.title)} `
      + `| bar=${JSON.stringify(bar)} | ${after.status}`);
    if (after.cardOpen) {
      await page.evaluate(() => document.querySelector("[data-walk-card-close]")?.click());
      await sleep(160);
    }
    /* The bar is the finger's verb now: it must carry this thing's name before it is pressed, and
       pressing it must open exactly that. A bar that is missing, or that names something else, is
       the waterfall becoming unclickable again by a different route. */
    await pressBar(label, t);
  };
  const pressBar = async (label, t) => {
    const label0 = await page.evaluate(() => {
      const b = document.querySelector("[data-walk-open]");
      return b && !b.hidden ? b.textContent.trim() : null;
    });
    if (!label0) { console.log(`bar ${label.padEnd(9)} nothing in reach, so no bar`); return; }
    await page.evaluate(() => document.querySelector("[data-walk-open]").click());
    await sleep(340);
    const after = await page.evaluate(() => {
      const card = document.querySelector("[data-walk-card]");
      return { cardOpen: !card.hidden,
               title: card.hidden ? "" : (document.querySelector("[data-walk-title]")?.textContent || "") };
    });
    const want = (t && t.title) || "";
    const ok = after.cardOpen && (!want || after.title.trim() === want.trim());
    console.log(`bar ${label.padEnd(9)} names ${JSON.stringify(label0)} -> card=${after.cardOpen} `
      + `${JSON.stringify(after.title)}${ok ? "" : ` (expected ${JSON.stringify(want)})`}`);
    if (after.cardOpen) {
      await page.evaluate(() => document.querySelector("[data-walk-card-close]")?.click());
      await sleep(160);
    }
  };

  /* Walk in a little, so the lane has anything in the picture at all. */
  await page.keyboard.down("w"); await sleep(2600); await page.keyboard.up("w"); await sleep(500);

  let seen = [], turns = 0;
  for (let i = 0; i < 40; i++) {
    seen = await boxes();
    const quiet = seen.find((b) => b.quiet);
    const live = seen.find((b) => !b.quiet && !b.landmark && !b.leave && b.kind !== "door");
    if (quiet && live) break;
    await turn(i % 20 < 10 ? "ArrowRight" : "ArrowLeft", 260);
    turns++;
  }
  const quiet = seen.find((b) => b.quiet);
  const live = seen.find((b) => !b.quiet && !b.landmark && !b.leave && b.kind !== "door");
  console.log(`after ${turns} turns the picture holds ${seen.length} boxes; ` +
              `scenery: ${quiet ? quiet.obj : "none"}; a verb: ${live ? live.obj : "none"}`);
  console.log("diag:", JSON.stringify(await page.evaluate(() => {
    const w = document.querySelector("[data-walk]")?.__walk;
    const reachEl = document.querySelector(".walk-hit.is-reach");
    return { x: w ? Math.round(w.x) : null, z: w ? Math.round(w.depth) : null,
             yaw: w ? +w.yaw.toFixed(1) : null, reach: reachEl ? reachEl.dataset.obj : null };
  })));
  await tap("scenery", quiet);
  await tap("verb", live);

  /* And the waterfall: the falls are three hundred and ninety metres away, so the mark is only
     in the picture once the head is turned to them. */
  for (let i = 0; i < 40; i++) {
    const found = await page.evaluate(() => {
      const el = document.querySelector('[data-landmark="1"]');
      const w = document.querySelector("[data-walk]")?.__walk;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const on = r.left > 0 && r.top > 0 && r.right < innerWidth && r.bottom < innerHeight;
      return { on, yaw: w ? +w.yaw.toFixed(1) : null, vis: el.style.visibility,
               rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
               status: document.querySelector("[data-walk-status]")?.textContent || "" };
    });
    if (i % 8 === 0) console.log(`  turn ${i}:`, JSON.stringify(found));
    if (found && found.on) { console.log("the falls are in the picture after", i, "turns:", found.status); break; }
    await turn("ArrowLeft", 220);
  }
  const mark = (await boxes()).find((b) => b.landmark);
  await tap("landmark", mark);
}

await browser.close();

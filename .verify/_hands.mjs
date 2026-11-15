/* _hands -- three things only a hand finds, as one probe (not a gate).

   PART=1  the sun/moon button by a real mouse click at Niagara stop 6: where it is, how big, what the
           record line says, and frames at 150 / 600 / 2500 ms.
   PART=2  walking into the side walls of the night street from stop 1 (the door glows at arm's length).
   PART=3  a 390 x 844 touch phone on the street and at Niagara: how far a 180 px drag turns the head
           (12 degrees at `DRAG_DEG_PER_PX` 0.065 -- a full-width swipe is 25), where the pad is and
           how far 2.5 s of it walks, and the hour button's size under a thumb (30 x 30 px).

   PART=4  every button a visitor can see, each by one real mouse click (`PAGE4=street.html:1`):
           what the page says changed (aria, a panel opening, the record line, the camera) and what the
           picture did -- `px idle>press`, the same measure as `_uxwalk`. A control with nothing in
           either column is the dead one. `_deadui` asks the same in jsdom and cannot see a picture.

   Frames go to .preview/play/hands. Run it ALONE: with another browser pass on the same machine the
   software rasteriser drops to a frame every few seconds and a "walked 28 cm" reading is the frame
   rate, not a wall (that is how PART=2's first reading was wrong).

     PART=3 sh bin/gate node .verify/_hands.mjs
*/
import fs from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { launch, openPage, arrive, aim, park, sleep, state } from "./_aim.mjs";
const OUT = ".preview/play/hands"; fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
const browser = await launch({ width: 1024, height: 768 });
const part = process.env.PART || "1,2,3";
const clickEl = async (page, sel) => {
  const r = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2, q.width, q.height, getComputedStyle(e).visibility, e.hidden]; }, sel);
  if (!r) { log("  NO ELEMENT", sel); return null; }
  await page.mouse.click(r[0], r[1]);
  return r;
};
const info = (page) => page.evaluate(() => {
  const L = document.querySelector("[data-walk]"); const w = L.__walk;
  return { clock: L.dataset.walkClock, record: (document.querySelector("[data-walk-record]")?.textContent || "").trim().slice(0, 90),
           x: Math.round(w.x), z: Math.round(w.depth), yaw: Math.round(w.yaw), quads: w.quads,
           bar: document.querySelector("[data-walk-open]")?.hidden ? "" : (document.querySelector("[data-walk-open]")?.textContent || "").trim() };
});
if (part.includes("1")) {
  log("== 1. the hour button, by a real click (rooms-niagara stop 6)");
  const page = await openPage(browser, { rooms: "rooms-niagara.html", hour: "day" });
  const a = await arrive(page, 6); log("  arrived", a.arrived);
  // close the tutor so the frame is the scene
  await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  await park(page); await page.screenshot({ path: `${OUT}/hour-1-day.png` }); log("  day", JSON.stringify(await info(page)));
  const r = await clickEl(page, "[data-walk-hour]"); log("  hour button at", JSON.stringify(r));
  await sleep(150); await page.screenshot({ path: `${OUT}/hour-2-night-150ms.png` });
  await sleep(450); await page.screenshot({ path: `${OUT}/hour-2-night-600ms.png` });
  await sleep(1900); await page.screenshot({ path: `${OUT}/hour-2-night-2500ms.png` }); log("  night", JSON.stringify(await info(page)));
  await clickEl(page, "[data-walk-hour]");
  await sleep(2500); await page.screenshot({ path: `${OUT}/hour-3-day-again.png` }); log("  day again", JSON.stringify(await info(page)));
  await page.close();
}
if (part.includes("2")) {
  log("== 2. standing in a halo (street, night, by the Toronto door)");
  const page = await openPage(browser, { rooms: "street.html", hour: "night" });
  await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  const a = await arrive(page, 1); log("  arrived", a.arrived, JSON.stringify(await info(page)));
  for (const yaw of [-90, 90]) {
    const g = await aim(page, yaw); await park(page);
    await page.screenshot({ path: `${OUT}/halo-yaw${yaw}-a-centre.png` });
    await page.keyboard.down("w"); await sleep(2500); await page.keyboard.up("w"); await park(page);
    log(`  yaw ${yaw} aimed ${g.aimed}; after walking at the wall:`, JSON.stringify(await info(page)));
    await page.screenshot({ path: `${OUT}/halo-yaw${yaw}-b-at-wall.png` });
    await aim(page, 0); await park(page);
    await page.screenshot({ path: `${OUT}/halo-yaw${yaw}-c-along-wall.png` });
    await arrive(page, 1);
  }
  await page.close();
}
if (part.includes("3")) {
  log("== 3. a phone (390 x 844, touch), street then niagara, night");
  for (const rooms of ["street.html", "rooms-niagara.html"]) {
    const page = await browser.newPage();
    page.on("pageerror", (e) => log("PAGEERROR", e.message));
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("huaxu.walk-hour.v1", "night"); } catch (e) {} });
    await page.goto(`http://127.0.0.1:8080/${rooms}`, { waitUntil: "networkidle0", timeout: 120000 });
    await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 60000 });
    await sleep(1500);
    const n = rooms.replace(".html", "");
    await page.screenshot({ path: `${OUT}/phone-${n}-1-arrive.png` }); log(`  ${rooms} arrive`, JSON.stringify(await info(page)));
    await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
    await sleep(400);
    // look: a touch drag across the picture
    await page.touchscreen.touchStart(300, 300); for (let i = 1; i <= 12; i++) { await page.touchscreen.touchMove(300 - i * 15, 300); await sleep(16); } await page.touchscreen.touchEnd();
    await sleep(900); await page.screenshot({ path: `${OUT}/phone-${n}-2-dragged.png` }); log("   after a 180 px drag", JSON.stringify(await info(page)));
    // walk: the pad
    const pad = await page.evaluate(() => { const e = document.querySelector("[data-walk-pad]"); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left, q.top, q.width, q.height, getComputedStyle(e).display]; });
    log("   pad", JSON.stringify(pad));
    if (pad && pad[2] > 0) {
      const cx = pad[0] + pad[2] / 2, cy = pad[1] + pad[3] / 2;
      await page.touchscreen.touchStart(cx, cy); for (let i = 1; i <= 8; i++) { await page.touchscreen.touchMove(cx, cy - i * 6); await sleep(16); }
      await sleep(2500); await page.touchscreen.touchEnd();
      await sleep(900); await page.screenshot({ path: `${OUT}/phone-${n}-3-walked.png` }); log("   after pushing the pad 2.5 s", JSON.stringify(await info(page)));
    }
    // the hour button by a tap
    const hb = await page.evaluate(() => { const e = document.querySelector("[data-walk-hour]"); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2, q.width, q.height]; });
    if (hb) { await page.touchscreen.tap(hb[0], hb[1]); await sleep(2500); await page.screenshot({ path: `${OUT}/phone-${n}-4-day-by-tap.png` }); log("   hour tapped", JSON.stringify(hb), JSON.stringify(await info(page))); }
    await page.close();
  }
}
if (part.includes("4")) {
  const px = async (buf) => { const im = await loadImage(buf); const c = createCanvas(im.width, im.height).getContext("2d"); c.drawImage(im, 0, 0); return { n: im.width * im.height, d: c.getImageData(0, 0, im.width, im.height).data }; };
  const differ = (a, b) => { let n = 0; for (let i = 0; i < a.n * 4; i += 4) if (Math.abs(a.d[i] - b.d[i]) + Math.abs(a.d[i + 1] - b.d[i + 1]) + Math.abs(a.d[i + 2] - b.d[i + 2]) > 24) n++; return (100 * n / a.n).toFixed(1); };
  const told = (page) => page.evaluate(() => {
    const L = document.querySelector("[data-walk]"), w = L.__walk;
    const open = Array.from(document.querySelectorAll("[aria-expanded='true'],dialog[open],[data-walk-card]:not([hidden]),[data-walk-listpanel]:not([hidden]),[data-walk-tutor]:not([hidden])")).map((e) => e.getAttribute("aria-label") || e.className || e.tagName).join("|").slice(0, 80);
    return { open, clock: L.dataset.walkClock || "", record: (document.querySelector("[data-walk-record]")?.textContent || "").trim().slice(0, 50), pos: [w.x, w.depth, w.yaw, w.pitch].map((v) => Math.round(v)).join(","), focus: (document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName || "").slice(0, 34) };
  });
  let stage = "", last = ""; let stuck = 0;
  const dog = setInterval(() => { if (stage === last) { if (++stuck >= 5) { log(`  HUNG 25 s at "${stage}"`); process.exit(3); } } else { last = stage; stuck = 0; } }, 5000);
  for (const spec of (process.env.PAGE4 || "street.html:1,rooms-niagara.html:2").split(",")) {
    const [file, stop] = spec.split(":");
    log(`== 4. every visible button by a real click (${file} stop ${stop})`);
    const page = await openPage(browser, { rooms: file, hour: "day" });
    await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
    await arrive(page, Number(stop)); await park(page);
    const count = await page.evaluate(() => {
      window.__btns = Array.from(document.querySelectorAll("[data-walk] button, [data-walk] a[href]")).filter((e) => { const q = e.getBoundingClientRect(); return q.width > 4 && q.height > 4 && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden]") && !e.matches("[data-walk-stop], [data-obj]"); });   // props answer E, not a pointer (walk-input)
      return window.__btns.length;
    });
    for (let i = 0; i < count; i++) {
      const b = await page.evaluate((k) => { const e = window.__btns[k]; if (!e || !e.isConnected) return null; const q = e.getBoundingClientRect(); const top = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { name: e.getAttribute("aria-label") || e.textContent.trim().slice(0, 30), tag: e.tagName.toLowerCase(), x: q.left + q.width / 2, y: q.top + q.height / 2, w: Math.round(q.width), h: Math.round(q.height), covered: !(top === e || e.contains(top)), nav: e.tagName === "A" }; }, i);
      if (!b || b.w < 5) { log(`  ${String(i).padStart(2)}  (gone or hidden by an earlier click)`); continue; }
      if (b.nav) { log(`  ${String(i).padStart(2)}  ${b.name.padEnd(44)} ${b.w}x${b.h}  a link (leaves the page; verify-exit owns it)`); continue; }
      stage = `${b.name}: before`; const t0 = await told(page), f0 = await px(await page.screenshot());
      await sleep(900); const f1 = await px(await page.screenshot());
      stage = `${b.name}: click`; await page.mouse.click(b.x, b.y);
      stage = `${b.name}: frames after`; await sleep(250); const fq = await px(await page.screenshot());   // a jump is over in 900 ms
      await sleep(650);
      if (!page.url().includes(file)) { log(`  ${String(i).padStart(2)}  ${b.name.padEnd(44)} ${b.w}x${b.h}  LEFT -> ${page.url().split("/").pop()}`); break; }
      const f2 = await px(await page.screenshot()), t1 = await told(page);
      const said = Object.keys(t0).filter((k) => k !== "focus" && t0[k] !== t1[k]).map((k) => `${k}: "${t0[k]}" -> "${t1[k]}"`).join("; ");
      const idle = differ(f0, f1), press = Math.max(Number(differ(f1, fq)), Number(differ(f1, f2))).toFixed(1);
      const verdict = said || Number(press) > Number(idle) + 0.5 ? "" : "   <-- NOTHING";
      log(`  ${String(i).padStart(2)}  ${b.name.padEnd(44)} ${b.w}x${b.h}${b.covered ? " COVERED" : ""}  px ${idle}>${press}  ${said}${verdict}`);
      if (verdict || process.env.SHOTS === "1") await page.screenshot({ path: `${OUT}/btn-${file.replace(".html", "")}-${i}.png` });
      // put things back with the control's own second click (Escape is the way out of the lane)
      if (t1.open !== t0.open || t1.clock !== t0.clock) {
        stage = `${b.name}: second click`; await page.mouse.click(b.x, b.y); await sleep(t1.clock !== t0.clock ? 2500 : 600);
        const t2 = await told(page);
        if (t2.open !== t0.open) log(`        a second click does not undo it: open is "${t2.open}"`);
        await page.evaluate(() => { document.querySelector("[data-walk-tutor-skip]")?.click(); document.querySelector("[data-walk-list-close]")?.click(); });
        await sleep(300);
      }
    }
    await page.close();
  }
  clearInterval(dog);
}
await browser.close();

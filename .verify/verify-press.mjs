// verify-press.mjs -- the lane's own controls, pressed the way a visitor presses them.
//
//   sh bin/gate node .verify/verify-press.mjs          (ROOMS=street.html,rooms.html  SHOTS=1  BASE=)
//
// Every press here is `page.mouse.click` or `page.touchscreen.tap` at the middle of the control,
// after asking `elementFromPoint` who owns that point. `element.click()` is not used to press
// anything: it reaches a control that has no area, or one that something else is lying on, and
// that is exactly how the written lane kept a close button 0 px wide for as long as it existed
// while every instrument "closed" it.
//
// On each walkable page, on a desk (1280 x 800, mouse) and on a phone (390 x 844, finger):
//   0  the stop ticks are each wide enough to be pressed, and a press on the last one walks there
//   1  the list button opens the written lane
//   2  its close button is a thing a finger can find (>= 40 px on a phone, >= 24 on a desk)
//   3  pressing it closes the lane
//   4  after the list is scrolled to its end the close button is still there and still closes it
//   5  the note button opens the note, and the note's close button closes it
//   6  the open lane does not scroll sideways, and no frame in it is drawn as a ribbon
// and once, on the street: a district card in the list is a way into that district.
import { launch, openPage, sleep } from "./_aim.mjs";

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const ROOMS = (process.env.ROOMS || "street.html,rooms.html,rooms-fukuoka.html,rooms-toronto.html,rooms-niagara.html,rooms-goat.html,rooms-journey.html,rooms-cntower.html").split(",");
const SHOTS = process.env.SHOTS === "1";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`${c ? "ok  " : "FAIL"} ${m}`); };

/* where a control is, how big, and whether the middle of it is its own */
const at = (page, sel) => page.evaluate((sel) => {
  const e = document.querySelector(sel); if (!e) return null;
  const q = e.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2;
  const top = q.width && q.height ? document.elementFromPoint(x, y) : null;
  return { x, y, w: Math.round(q.width), h: Math.round(q.height),
    seen: x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight,
    own: !!top && (top === e || e.contains(top)),
    under: top ? `${top.tagName.toLowerCase()}.${(top.getAttribute("class") || "").split(" ")[0]}` : "nothing" };
}, sel);
const listOpen = (page) => page.evaluate(() => { const l = document.querySelector("[data-walk-listpanel]"); return !!l && !l.classList.contains("is-closed"); });
/* the lane slides open and shut over 320 ms of the browser's own time, and a software rasteriser under load
   takes longer than that on the wall clock: wait for the slide itself, not for a guess at it */
const gone = async (page) => { for (let i = 0; i < 40; i++) { if (await page.evaluate(() => { const l = document.querySelector("[data-walk-listpanel]"); return l.classList.contains("is-closed") && getComputedStyle(l).visibility === "hidden"; })) return true; await sleep(100); } return false; };
const still = async (page) => { let was = null; for (let i = 0; i < 40; i++) { const x = await page.evaluate(() => { const l = document.querySelector("[data-walk-listpanel]"); return l.classList.contains("is-closed") ? null : Math.round(l.getBoundingClientRect().right - innerWidth); }); if (x !== null && x <= 1 && x === was) return true; was = x; await sleep(120); } return false; };
const cardOpen = (page) => page.evaluate(() => { const c = document.querySelector("[data-walk-card]"); return !!c && !c.hidden; });

const browser = await launch();
for (const phone of [false, true]) {
  const how = phone ? "phone" : "desk ";
  for (const rooms of ROOMS) {
    const page = await openPage(browser, { rooms, hour: "day", base: BASE });
    if (phone) { await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(800); }
    const press = async (sel) => {
      const c = await at(page, sel);
      if (!c || !c.seen || !c.own) return c || { missing: true, under: "nothing", w: 0, h: 0 };
      if (phone) await page.touchscreen.tap(c.x, c.y); else await page.mouse.click(c.x, c.y);
      await sleep(700);
      return { ...c, pressed: true };
    };
    const why = (c) => c.pressed ? "pressed" : c.missing ? "not in the page" : `${c.w}x${c.h}, the point belongs to ${c.under}`;
    await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());   // staging, not a press under test
    await sleep(300);
    const tag = `${how} ${rooms.replace(".html", "")}:`;

    // the rail of stops: wide enough to be one stop and not its neighbour, and a press goes there
    const rail = await page.evaluate(() => [...document.querySelectorAll(".walk-stop")].map((b) => Math.round(b.getBoundingClientRect().width)));
    const thin = Math.min(...rail), last = rail.length;
    const tick = await press(`.walk-stops .walk-stop:nth-child(${last})`);
    let there = false;
    for (let i = 0; i < 100 && tick.pressed && !there; i++) { there = await page.evaluate((n) => document.querySelector(`.walk-stops .walk-stop:nth-child(${n})`).classList.contains("is-here"), last); if (!there) await sleep(200); }
    ok(thin >= 16 && there, `${tag} ${last} stop ticks, the narrowest ${thin} px (needs 16); a press on the last one ${there ? "walks there" : `does not arrive (${why(tick)})`}`);

    const o = await press("[data-walk-list]");
    ok(o.pressed && await listOpen(page), `${tag} the list button opens the written lane (${why(o)})`);
    if (!(await listOpen(page))) await page.evaluate(() => document.querySelector("[data-walk-list]").click());
    await still(page);

    const shut = await at(page, "[data-walk-list-close]");
    const floor = phone ? 40 : 24;
    ok(!!shut && shut.w >= floor && shut.h >= floor && shut.own, `${tag} its close button is ${shut ? `${shut.w}x${shut.h}` : "missing"} px and its own (needs ${floor}; the point belongs to ${shut ? shut.under : "nothing"})`);
    if (SHOTS) await page.screenshot({ path: `.preview/play/hands/press-${phone ? "phone" : "desk"}-${rooms.replace(".html", "")}.png` });
    const fit = await page.evaluate(() => {
      const l = document.querySelector("[data-walk-listpanel]");
      const thin = [...l.querySelectorAll(".frame-fig img")].map((i) => Math.round(i.getBoundingClientRect().width)).filter((w) => w > 0).sort((a, b) => a - b)[0];
      return { wide: l.scrollWidth - l.clientWidth, thin: thin === undefined ? null : thin };
    });
    ok(fit.wide <= 1 && (fit.thin === null || fit.thin >= 120), `${tag} the lane fits its own width (${fit.wide} px sideways${fit.thin === null ? "" : `; its narrowest frame is drawn ${fit.thin} px wide`})`);
    const c1 = await press("[data-walk-list-close]");
    ok(c1.pressed && !(await listOpen(page)), `${tag} pressing it closes the lane (${why(c1)})`);

    if (await listOpen(page)) await page.evaluate(() => document.querySelector("[data-walk-list]").click());
    await gone(page);
    await press("[data-walk-list]");
    if (!(await listOpen(page))) await page.evaluate(() => document.querySelector("[data-walk-list]").click());
    await still(page);
    await page.evaluate(() => { const l = document.querySelector("[data-walk-listpanel]"); l.scrollTop = l.scrollHeight; });
    await sleep(300);
    if (SHOTS) await page.screenshot({ path: `.preview/play/hands/press-${phone ? "phone" : "desk"}-${rooms.replace(".html", "")}-end.png` });
    const c2 = await press("[data-walk-list-close]");
    ok(c2.pressed && !(await listOpen(page)), `${tag} scrolled to its end, the lane still closes by its button (${why(c2)})`);
    if (await listOpen(page)) await page.evaluate(() => document.querySelector("[data-walk-list]").click());
    await gone(page);

    if (SHOTS) await page.screenshot({ path: `.preview/play/hands/press-${phone ? "phone" : "desk"}-${rooms.replace(".html", "")}-note.png` });
    if (process.env.DEBUG) console.log("  before the note:", JSON.stringify(await page.evaluate(() => { const c = document.querySelector("[data-walk-card]"); return { card: !c.hidden, mode: c.dataset.mode, title: c.querySelector("h2").textContent, live: c.querySelector("[data-walk-live]").textContent.slice(0, 80), w: window.__walk && { z: Math.round(__walk.depth || 0), stop: __walk.stop } }; })));
    const n = await press("[data-walk-info]");
    const opened = await cardOpen(page);
    const x = opened ? await press("[data-walk-card-close]") : { under: "no card" };
    ok(n.pressed && opened && x.pressed && !(await cardOpen(page)), `${tag} the note opens by its button (${why(n)}) and closes by its own (${why(x)})`);
    await page.close();
  }
}

// a district card is a way into the district
{
  const page = await openPage(browser, { rooms: "street.html", hour: "day", base: BASE });
  await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
  const c = await at(page, "[data-walk-list]"); await page.mouse.click(c.x, c.y); await sleep(700); await still(page);
  const cards = await page.evaluate(() => [...document.querySelectorAll("[data-walk-listpanel] .district-card")].map((li) => ({
    name: li.querySelector("h2").textContent, soon: li.classList.contains("is-soon"),
    href: li.querySelector("a[href]")?.getAttribute("href") || "", here: /You are standing in it/.test(li.textContent) })));
  const here = cards.filter((k) => k.here);
  ok(here.length === 1 && here[0].name === "The street", `the street's list says "You are standing in it" on one card, its own (${here.map((k) => k.name).join(", ") || "none"})`);
  const dead = cards.filter((k) => !k.soon && !k.here && !k.href);
  ok(dead.length === 0, `every other open district card carries a link to its page (${dead.length ? "without one: " + dead.map((k) => k.name).join(", ") : cards.filter((k) => k.href).length + " links"})`);
  const link = await page.evaluate(() => {
    const a = document.querySelector('[data-walk-listpanel] .district-card a[href="rooms.html"]'); if (!a) return null;
    a.scrollIntoView({ block: "center", behavior: "instant" });
    const q = a.getClientRects()[0], x = q.left + q.width / 2, y = q.top + q.height / 2, top = document.elementFromPoint(x, y);
    return { x, y, own: top === a || a.contains(top) };
  });
  let went = "";
  if (link && link.own) { await Promise.all([page.waitForNavigation({ timeout: 20000 }).catch(() => {}), page.mouse.click(link.x, link.y)]); went = new URL(page.url()).pathname; }
  ok(went.endsWith("/rooms.html"), `a click on Tokyo's card in the street's list walks into Tokyo (${went || "no link to press"})`);
  await page.close();
}
await browser.close();
console.log(`\nverify-press: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

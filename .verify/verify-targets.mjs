/* verify-targets -- every control a visitor can see, on every page, asked two questions: if a
   pointer comes down on its centre, does the control get it -- and over how much area does it
   answer?

   `element.click()` and `dispatchEvent` do not hit-test, so a control that is covered, that has
   `pointer-events: none`, that has no area, or that sits off the screen answers them and answers
   no visitor. That is how the lane's bar shipped unpressable and its list shipped unclosable. This
   asks `document.elementFromPoint` at the centre of every visible link, button, input and summary
   on all 19 pages, at a desk (1280 x 800) and at a 390 x 844 touch phone, and on the walkable
   pages again with each panel opened BY A REAL CLICK (the note, the written lane, the guide).

   Then the size. The target is the area that answers, not the box that is drawn (WCAG 2.2
   SC 2.5.8; `skills/ux-walkthrough` section 5c has the four rule sets this was checked against):
   it walks outward from the centre a pixel at a time and stops where the point stops being the
   control's own. That reads the pad a small glyph carries (`::before`), and it reads a pad that a
   neighbour's pad lies on -- which a bounding box cannot.

   One line per control that fails:
     COVERED   the point belongs to something else            -> nobody can press it
               (a control behind an open drawer, card or dialog is not counted: that is the drawer's job)
     ZERO      displayed and visible, with no area             -> nobody can see it or press it
     WIDE      the page or the open list scrolls sideways      -> something sticks out of the window
     IMAGE     one of the site's own pictures did not load
     OFFSCREEN its centre is outside the viewport and the page cannot scroll to it
     SMALL     answers over less than 24 x 24 px at a desk, or 44 x 44 on the phone
   and, counted but not failed (DENSE=1 prints them):
     DENSE     a control on the DENSE list that answers over at least 24 x 24: the largest area its
               row allows without lying on its neighbour (the stop rail with nine or more stops)
   A link inside a sentence is exempt from the size rule (2.5.8, "inline"). In-scene hit boxes
   (`[data-obj]`) are skipped: they answer the keyboard only, by design.

     sh bin/gate node .verify/verify-targets.mjs          [PAGES=a.html,b.html] [VIEW=desk|phone] [DENSE=1]
   Exit 1 on any line above except DENSE, or if a page logs an error of its own. */
import fs from "node:fs";
import { launch, sleep } from "./_aim.mjs";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const PAGES = (process.env.PAGES || fs.readdirSync(".").filter((f) => f.endsWith(".html")).join(",")).split(",");
const VIEWS = { desk: { width: 1280, height: 800 }, phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const WANT = (process.env.VIEW || "desk,phone").split(",");
const WALK = /^(street|rooms(-\w+)?)\.html$/;

const sweep = (page, min) => page.evaluate(async (minSize) => {
  const out = { n: 0, bad: [], small: [], dense: [] };
  const DENSE = [{ sel: ".walk-stop", why: "nine or more stops share one row of a phone" }];
  const OVER = "[data-walk-listpanel]:not(.is-closed), dialog[open], .modal.is-open, [data-walk-card]:not([hidden])";
  const name = (e) => `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}.${String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(" ").filter(Boolean).slice(0, 2).join(".")} "${(e.getAttribute("aria-label") || e.textContent || e.value || "").trim().replace(/\s+/g, " ").slice(0, 34)}"`;
  const els = Array.from(document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex]:not([tabindex='-1'])"))
    .filter((e) => !e.matches("[data-obj], [data-walk-view], [disabled]") && !e.closest("[hidden], [inert], [aria-hidden='true']"));
  for (const e of els) {
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
    let q = e.getBoundingClientRect();
    if (e.matches(".skip, .skip-link")) continue;   // off the screen until it is focused: a keyboard control
    // displayed, visible, and no area: the declaration that sized it was dropped or outweighed
    if (!e.getClientRects().length) continue;        // inside something that is not displayed (a folded menu)
    if (q.width < 2 || q.height < 2) { out.n++; out.bad.push(`ZERO      ${name(e)} ${Math.round(q.width)}x${Math.round(q.height)} at ${Math.round(q.left)},${Math.round(q.top)}`); continue; }
    // a visually-hidden skip link is a control for the keyboard only
    if (cs.position === "absolute" && (q.width <= 2 || q.height <= 2 || cs.clip === "rect(0px, 0px, 0px, 0px)")) continue;
    const mid = () => { const f = e.getClientRects()[0] || q; return [f.left + f.width / 2, f.top + f.height / 2]; };
    let [mx, my] = mid();
    // judged by the point a press lands on, not by the box's edge -- and with room around that
    // point, because the area is measured by walking outward and the window's edge (or the fixed
    // header) would end the walk early
    if (mx < 0 || my < 110 || mx > innerWidth || my > innerHeight - 70) {
      e.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });   // the site scrolls smoothly; a measure mid-glide is of nowhere
      await new Promise((r) => setTimeout(r, 120));   // sticky headers and reveal transitions settle
      q = e.getBoundingClientRect();
      if (q.top < 0 || q.bottom > innerHeight) { e.scrollIntoView({ block: "center", behavior: "instant" }); await new Promise((r) => setTimeout(r, 400)); q = e.getBoundingClientRect(); }
    }
    out.n++;
    // a link that wraps is several boxes, and the middle of their bounding rectangle can be a gap
    const first = e.getClientRects()[0] || q;
    const x = first.left + first.width / 2, y = first.top + first.height / 2;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { out.bad.push(`OFFSCREEN ${name(e)} centre ${Math.round(x)},${Math.round(y)}`); continue; }
    const top = document.elementFromPoint(x, y);
    const label = e.id ? document.querySelector(`label[for="${e.id}"]`) : null;
    const owns = top && (top === e || e.contains(top) || top.contains(e) && top.closest("label") || (label && (label === top || label.contains(top))));
    // an open drawer or dialog is allowed to cover what is behind it -- that is what it is for
    const over = top && top.closest(OVER);
    if (!owns && over && !over.contains(e)) continue;
    if (!owns) out.bad.push(`COVERED   ${name(e)} ${Math.round(q.width)}x${Math.round(q.height)} at ${Math.round(x)},${Math.round(y)} -> ${top ? name(top) : "nothing"}${cs.pointerEvents === "none" ? " (pointer-events: none)" : ""}`);
    else if (!document.querySelector(OVER) || e.closest(OVER)) {   // with a drawer open, only what is in it is measured: the rest is partly under it
      // The target is the area that answers, not the box that is drawn: a control may stay small
      // and carry a pad (`::before`), and a pad that a neighbour's pad lies on is not its own. So
      // walk outward from the centre a pixel at a time and stop where the point stops being this
      // control's -- that is the pad, the collisions and the clipping, all in one read.
      const mine = (px, py) => { const t = document.elementFromPoint(px, py); return !!t && (t === e || e.contains(t) || (!!label && (t === label || label.contains(t)))); };
      const reach = (dx, dy, most) => { let n = 0; while (n < most && mine(x + dx * (n + 1), y + dy * (n + 1))) n++; return n; };
      // no further than the floor needs: past it the answer is already "big enough"
      const span = (dx, dy) => { const a = reach(-dx, -dy, minSize); return 1 + a + reach(dx, dy, Math.max(0, minSize - 1 - a)); };
      const hw = span(1, 0), hh = span(0, 1);
      if (hw < minSize || hh < minSize) {
        // an inline link inside a sentence is exempt from the target-size rule (WCAG 2.5.8, "inline")
        const inline = e.tagName === "A" && cs.display.startsWith("inline") && e.parentElement && /^(P|LI|SPAN|DD|TD|FIGCAPTION|SMALL|EM|CITE|H[1-6])$/.test(e.parentElement.tagName) && e.parentElement.textContent.trim().length > e.textContent.trim().length + 3;
        // where the room runs out, the rule is the largest area that does not collide, and never under AA's 24
        const dense = DENSE.find((d) => e.matches(d.sel));
        const size = `${hw < minSize ? hw : hw + "+"}x${hh < minSize ? hh : hh + "+"} (drawn ${Math.round(q.width)}x${Math.round(q.height)})`;
        if (inline) { /* exempt */ }
        else if (dense && hw >= 24 && hh >= 24) out.dense.push(`DENSE     ${name(e)} answers over ${size} -- ${dense.why}`);
        else out.small.push(`SMALL     ${name(e)} answers over ${size}`);
      }
    }
  }
  // the page, or the open list, wider than what holds it: a sideways scroll nobody asked for
  const root = document.scrollingElement || document.documentElement;
  if (root.scrollWidth > innerWidth + 1) {
    const wide = [...document.querySelectorAll("body *")].filter((e) => { const q = e.getBoundingClientRect(); return q.width > 0 && q.right > innerWidth + 1 && getComputedStyle(e).position !== "fixed" && !e.closest(".walk, [data-walk-listpanel]"); }).slice(0, 3).map(name);
    out.bad.push(`WIDE      the page is ${root.scrollWidth} px in a ${innerWidth} px window (${wide.join("; ") || "no element names itself"})`);
  }
  const lane = document.querySelector("[data-walk-listpanel]:not(.is-closed)");
  if (lane && lane.scrollWidth > lane.clientWidth + 1) out.bad.push(`WIDE      the written lane is ${lane.scrollWidth} px in ${lane.clientWidth}`);
  // a picture that was asked for and did not arrive
  for (const im of document.images) if (im.complete && im.naturalWidth === 0 && im.currentSrc && im.currentSrc.startsWith(location.origin)) out.bad.push(`IMAGE     ${im.currentSrc.slice(location.origin.length)} did not load`);
  window.scrollTo(0, 0);
  return out;
}, min);

const clickAt = async (page, sel) => {
  const r = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return q.width > 2 ? [q.left + q.width / 2, q.top + q.height / 2] : null; }, sel);
  if (!r) return false;
  await page.mouse.click(r[0], r[1]); await sleep(700);
  return true;
};

const browser = await launch({ width: 1280, height: 800 });
let failed = 0, controls = 0, smalls = 0, dense = 0;
for (const view of WANT) {
  for (const file of PAGES) {
    const page = await browser.newPage();
    await page.setViewport(VIEWS[view]);
    const errs = [];
    page.on("pageerror", (e) => errs.push("pageerror " + String(e).slice(0, 120)));
    page.on("console", (m) => { if (m.type() === "error" && !/ERR_CONNECTION_CLOSED|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/.test(m.text())) errs.push("console " + m.text().slice(0, 120)); });
    // the site's own files only: the sandbox has no route to the font host, and that is not the page
    const own = (u) => u.startsWith(BASE);
    page.on("requestfailed", (r) => { if (own(r.url())) errs.push("failed " + r.url().slice(BASE.length, BASE.length + 80)); });
    page.on("response", (r) => { if (own(r.url()) && r.status() >= 400) errs.push(r.status() + " " + r.url().slice(BASE.length, BASE.length + 80)); });
    await page.goto(`${BASE}/${file}`, { waitUntil: "networkidle2", timeout: 120000 });
    await sleep(WALK.test(file) ? 2500 : 600);
    const min = view === "phone" ? 44 : 24;
    const states = [["as loaded", null]];
    if (WALK.test(file)) states.push(["guide dismissed", async () => page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click())],
      ["note open", () => clickAt(page, "[data-walk-info]")], ["note closed, written lane open", async () => { await clickAt(page, "[data-walk-card-close]"); return clickAt(page, "[data-walk-list]"); }],
      ["lane closed, guide replayed", async () => {
        await clickAt(page, "[data-walk-list-close]");
        // the lane slides shut on the browser's clock, and under a software rasteriser that is longer than any fixed wait
        for (let i = 0; i < 40; i++) { if (await page.evaluate(() => { const l = document.querySelector("[data-walk-listpanel]"); return l.classList.contains("is-closed") && getComputedStyle(l).visibility === "hidden"; })) break; await sleep(100); }
        return clickAt(page, "[data-walk-tutor-replay]"); }]);
    const seen = new Set();
    for (const [label, enter] of states) {
      if (enter) { const ok = await enter(); await sleep(500); if (ok === false) { console.log(`  ${view} ${file} [${label}] could not be reached by a real click`); failed++; continue; } }
      const r = await sweep(page, min);
      controls += r.n;
      for (const line of r.bad) { if (!seen.has(line)) { seen.add(line); failed++; console.log(`  ${view} ${file} [${label}] ${line}`); } }
      for (const line of r.small) { if (!seen.has(line)) { seen.add(line); smalls++; failed++; console.log(`  ${view} ${file} [${label}] ${line}`); } }
      for (const line of r.dense) { if (!seen.has(line)) { seen.add(line); dense++; if (process.env.DENSE) console.log(`  ${view} ${file} [${label}] ${line}`); } }
    }
    for (const e of [...new Set(errs)]) { failed++; console.log(`  ${view} ${file} ERROR ${e}`); }
    await page.close();
  }
}
await browser.close();
console.log(`\nverify-targets: ${controls} control-states on ${PAGES.length} pages x ${WANT.length} views; ${failed - smalls} unreachable or erroring, ${smalls} under the size floor, ${dense} at the largest size their row allows (DENSE=1 lists them)`);
console.log(failed ? `verify-targets: ${failed} failed` : `verify-targets: pass -- every visible control owns its point and answers over at least 24 x 24 px at a desk and 44 x 44 on a phone${dense ? `, except ${dense} on a crowded row that answer over at least 24 x 24` : ""}`);
process.exit(failed ? 1 : 0);

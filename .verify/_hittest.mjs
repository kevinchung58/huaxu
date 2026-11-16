/* _hittest -- every control a visitor can see, on every page, asked one question: if a pointer
   comes down on its centre, does the control get it?

   `element.click()` and `dispatchEvent` do not hit-test, so a control that is covered, that has
   `pointer-events: none`, or that sits off the screen answers them and answers no visitor. That is
   how the lane's bar shipped unpressable (`verify-demo` 6). This asks `document.elementFromPoint`
   at the centre of every visible link, button, input and summary on all 19 pages, at a desktop and
   at a 390 x 844 touch phone, and on the walkable pages again with each panel opened BY A REAL
   CLICK (the note, the written lane, the guide) and at a stop where the bar is showing.

   Prints one line per control that fails, and a count per page:
     COVERED   the point belongs to something else            -> nobody can press it
               (a control behind an open drawer, card or dialog is not counted: that is the drawer's job)
     ZERO      displayed and visible, with no area             -> nobody can see it or press it
     WIDE      the page or the open list scrolls sideways      -> something sticks out of the window
     IMAGE     one of the site's own pictures did not load
     OFFSCREEN its centre is outside the viewport and the page cannot scroll to it
     SMALL     under 24 x 24 px (WCAG 2.2 target size), or under 44 on the phone (reported, not failed)
   In-scene hit boxes (`[data-obj]`) are skipped: they answer the keyboard only, by design.

     sh bin/gate node .verify/_hittest.mjs          [PAGES=a.html,b.html] [VIEW=desk|phone]
   Exit 1 if anything is COVERED, ZERO or OFFSCREEN, or a page logs an error. */
import fs from "node:fs";
import { launch, sleep } from "./_aim.mjs";
const BASE = process.env.BASE || "http://127.0.0.1:8080";
const PAGES = (process.env.PAGES || fs.readdirSync(".").filter((f) => f.endsWith(".html")).join(",")).split(",");
const VIEWS = { desk: { width: 1280, height: 800 }, phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const WANT = (process.env.VIEW || "desk,phone").split(",");
const WALK = /^(street|rooms(-\w+)?)\.html$/;

const sweep = (page, min) => page.evaluate(async (minSize) => {
  const out = { n: 0, bad: [], small: [] };
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
    if (mx < 0 || my < 0 || mx > innerWidth || my > innerHeight) {   // judged by the point a press lands on, not by the box's edge
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
    const over = top && top.closest("[data-walk-listpanel]:not(.is-closed), dialog[open], .modal.is-open, [data-walk-card]:not([hidden])");
    if (!owns && over && !over.contains(e)) continue;
    if (!owns) out.bad.push(`COVERED   ${name(e)} ${Math.round(q.width)}x${Math.round(q.height)} at ${Math.round(x)},${Math.round(y)} -> ${top ? name(top) : "nothing"}${cs.pointerEvents === "none" ? " (pointer-events: none)" : ""}`);
    else if (q.width < minSize - 0.5 || q.height < minSize - 0.5) {
      // an inline link inside a sentence is exempt from the target-size rule
      const inline = e.tagName === "A" && cs.display.startsWith("inline") && e.parentElement && /^(P|LI|SPAN|DD|TD|FIGCAPTION|SMALL|EM|CITE|H[1-6])$/.test(e.parentElement.tagName) && e.parentElement.textContent.trim().length > e.textContent.trim().length + 8;
      if (!inline) out.small.push(`SMALL     ${name(e)} ${Math.round(q.width)}x${Math.round(q.height)}`);
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
let failed = 0, controls = 0, smalls = 0;
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
      ["lane closed, guide replayed", async () => { await clickAt(page, "[data-walk-list-close]"); return clickAt(page, "[data-walk-tutor-replay]"); }]);
    const seen = new Set();
    for (const [label, enter] of states) {
      if (enter) { const ok = await enter(); await sleep(500); if (ok === false) { console.log(`  ${view} ${file} [${label}] could not be reached by a real click`); failed++; continue; } }
      const r = await sweep(page, min);
      controls += r.n;
      for (const line of r.bad) { if (!seen.has(line)) { seen.add(line); failed++; console.log(`  ${view} ${file} [${label}] ${line}`); } }
      for (const line of r.small) { if (!seen.has(line)) { seen.add(line); smalls++; console.log(`  ${view} ${file} [${label}] ${line}`); } }
    }
    for (const e of [...new Set(errs)]) { failed++; console.log(`  ${view} ${file} ERROR ${e}`); }
    await page.close();
  }
}
await browser.close();
console.log(`\n_hittest: ${controls} control-states on ${PAGES.length} pages x ${WANT.length} views; ${failed} unreachable or erroring, ${smalls} under the size floor`);
process.exit(failed ? 1 : 0);

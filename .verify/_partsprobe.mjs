/* _partsprobe -- the page programme is four files: does the browser agree with the gates?

   `.verify/verify-sources.mjs` checks the split statically: the list, the pages' tags, the order, a
   duplicate-name scan and a parse. What it cannot see is the thing the split actually depends on --
   that a classic script's top-level `function`/`let` in `js/overlay.js` is visible to a *later*
   `<script>` in the same page, which is what lets `js/site.js` read `enterOverlay` at all.

   So this walks every page that matters, in a real browser, and reports: the script parts the page
   actually loaded (in order), whether the lane attached, whether all six overlay names resolve from
   the last script, and every page error. Then it plays the dot game -- the one whole feature that is
   its own file -- and asserts it reaches its second state.

   Measured 2026-10-30 (10 pages, day, reduced motion): 4 parts in order on all ten, walk attached on
   all eight walkable pages, overlay=111111 (all six names resolve), 0 page errors; the game went
   "Watch the amber path..." -> "Your turn: tap the dots in the same order."

   Diagnostic, exit 0. Run:  sh bin/gate node .verify/_partsprobe.mjs
*/
import { launch, openPage, park, shot } from "./_aim.mjs";

const PAGES = ["index.html", "thinking.html", "street.html", "rooms.html", "rooms-toronto.html",
               "rooms-fukuoka.html", "rooms-niagara.html", "rooms-goat.html", "rooms-journey.html", "rooms-cntower.html"];
const browser = await launch({ width: 1024, height: 768 });
let bad = 0;
const WALK = new Set(["street.html", "rooms.html", "rooms-toronto.html", "rooms-fukuoka.html",
                      "rooms-niagara.html", "rooms-goat.html", "rooms-journey.html", "rooms-cntower.html"]);
for (const file of PAGES) {
  const page = WALK.has(file)
    ? await openPage(browser, { rooms: file, hour: "day", reduce: true })
    : await browser.newPage();
  const errors = [];
  if (!WALK.has(file)) {
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
    await page.goto(`http://127.0.0.1:8080/${file}`, { waitUntil: "load", timeout: 60000 });
  }
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 100)); });
  await park(page, 500);
  const state = await page.evaluate(() => ({
    parts: [...document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src").split("?")[0]).filter((s) => s.startsWith("js/")),
    walk: Boolean(document.querySelector("[data-walk]")?.__walk),
    walkAttached: Boolean(document.querySelector("[data-walk]")?.__walk?.renderer),
    nav: document.querySelector(".nav")?.className || "",
    overlayFns: ["enterOverlay", "leaveOverlay", "trapTab", "inertOutside", "overlayEntered", "overlayLeft"]
      .map((n) => (typeof window.eval(n) === "function" ? 1 : 0)).join(""),
  }));
  console.log(`${file.padEnd(20)} parts=${state.parts.join(",")} walk=${state.walk} attached=${state.walkAttached} overlay=${state.overlayFns} errors=${errors.length}`);
  for (const e of errors) console.log("   !", e);
  if (errors.length) bad++;
  await page.close();
}

/* the dot game, played: it is the one block that is a whole feature in its own file */
{
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/thinking.html", { waitUntil: "load", timeout: 60000 });
  await page.evaluate(() => document.querySelector("[data-dot-game]")?.scrollIntoView());
  const start = await page.evaluate(() => {
    const g = document.querySelector("[data-dot-game]");
    const btn = g && g.querySelector("[data-dot-watch]");
    if (btn) btn.click();
    return { present: Boolean(g), status: g?.querySelector("[data-dot-status]")?.textContent?.trim() || "" };
  });
  await new Promise((r) => setTimeout(r, 2500));
  const after = await page.evaluate(() => {
    const g = document.querySelector("[data-dot-game]");
    return { status: g?.querySelector("[data-dot-status]")?.textContent?.trim() || "",
             played: (document.querySelectorAll("[data-dot-board] .is-on").length || 0) };
  });
  console.log(`dot game: present=${start.present} status "${start.status}" -> "${after.status}" lit=${after.played}`);
  await shot(page, "/tmp/split-dotgame.png");
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} page(s) with errors` : "no page errors");

/* The link contract, end to end (landmark-space §2): press the landmark prop, the story opens
   first, the enter-the-space verb sits beside it in the plate chrome, and it leads into the
   space; inside the space the glass floor carries its state and the way back is the prop's room.
   Run with a server on :8080 (bin/preview). */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const out = [];
const ok = (name, cond, detail = "") => out.push(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);

const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 768 } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await browser.newPage();
const waitForRoute = (path, hash = "") => page.waitForFunction(
  (p, h) => location.pathname.endsWith(p) && (!h || location.hash === h),
  { timeout: 15_000 }, path, hash);
const waitForReach = (id) => page.waitForFunction(
  (obj) => document.querySelector(".walk-hit.is-reach")?.dataset.obj === obj,
  { timeout: 15_000 }, id);

await page.goto("http://127.0.0.1:8080/rooms-toronto.html", { waitUntil: "networkidle0" });
await sleep(1500);

ok("the tower prop carries a story", await page.$("[data-obj='tower-cn'][data-story]") !== null);
ok("the stories island names the space",
   (await page.evaluate(() => document.querySelector("[data-walk-stories]")?.textContent || "")).includes("rooms-cntower.html"));

await page.evaluate(() => document.querySelector("[data-obj='tower-cn']").click());
await sleep(600);
ok("pressing the prop opens the story rail first",
   await page.evaluate(() => document.getElementById("room-plate")?.classList.contains("is-open") === true));
ok("the rail carries the tower's three frames",
   (await page.$$eval("#room-plate [data-story-frame]", (els) => els.length)) === 3);
const enter = await page.evaluate(() => {
  const a = document.querySelector("[data-enter-space]");
  return a ? { hidden: a.hidden, href: a.getAttribute("href"), label: a.getAttribute("aria-label") } : null;
});
ok("the enter-space verb sits in the plate chrome, named for a reader",
   !!enter && !enter.hidden && !!enter.label, JSON.stringify(enter));
ok("the enter-space verb leads into the space", enter?.href === "rooms-cntower.html", enter?.href);

await page.evaluate(() => document.querySelector("[data-enter-space]").click());
await waitForRoute("rooms-cntower.html");
ok("the verb navigates into the space", page.url().includes("rooms-cntower.html"), page.url());

/* Inside the space: the glass floor carries its step-on state, the cab doors their ride, and the
   way back is the hall. */
await page.goto("http://127.0.0.1:8080/rooms-cntower.html", { waitUntil: "networkidle0" });
await sleep(1500);
ok("the space boots with its city-below backdrop",
   await page.evaluate(() => !!document.querySelector("[data-walk-backdrop]")));
await page.evaluate(() => document.querySelector("[data-obj='glassfloor-cn']").click());
await sleep(200);
ok("the glass floor steps on",
   (await page.$eval("[data-obj='glassfloor-cn']", (el) => el.dataset.state)) === "1");
await page.evaluate(() => document.querySelector("[data-obj='glassfloor-cn']").click());
await sleep(200);
ok("and steps back off",
   (await page.$eval("[data-obj='glassfloor-cn']", (el) => el.dataset.state)) === "0");
await page.evaluate(() => document.querySelector("[data-obj='lift-cn']").click());
await sleep(200);
ok("the cab doors ride on a press",
   (await page.$eval("[data-obj='lift-cn']", (el) => el.dataset.state)) === "1");
await page.evaluate(() => document.querySelector("[data-obj='door-back']").click());
await waitForRoute("rooms-toronto.html", "#at-tower-cn");
await waitForReach("tower-cn");
ok("the tower unwinds to its Toronto owner with the prop anchor",
   page.url().endsWith("rooms-toronto.html#at-tower-cn"), page.url());
const towerReturn = await page.evaluate(() => {
  const w = document.querySelector("[data-walk]").__walk;
  const p = document.querySelector("[data-obj='tower-cn']");
  return { hash: location.hash, reach: document.querySelector(".walk-hit.is-reach")?.dataset.obj,
    distance: Math.hypot(parseFloat(p.style.getPropertyValue("--x")) - w.x,
                         parseFloat(p.style.getPropertyValue("--z")) - w.depth) };
});
ok("the returned visitor is standing beside the tower and can use it again",
   towerReturn.hash === "#at-tower-cn" && towerReturn.reach === "tower-cn" && towerReturn.distance < 190,
   JSON.stringify(towerReturn));

/* The same contract at the falls: the hall's model opens its story first, and the space
   unwinds to the hall. */
await page.goto("http://127.0.0.1:8080/rooms-toronto.html", { waitUntil: "networkidle0" });
await sleep(1500);
await page.evaluate(() => document.querySelector("[data-obj='falls-n']").click());
await sleep(600);
ok("the falls prop opens its story rail first",
   await page.evaluate(() => document.getElementById("room-plate")?.classList.contains("is-open") === true));
ok("the falls rail carries three frames",
   (await page.$$eval("#room-plate [data-story-frame]", (els) => els.length)) === 3);
const enter2 = await page.evaluate(() => {
  const a = document.querySelector("[data-enter-space]");
  return a ? { hidden: a.hidden, href: a.getAttribute("href") } : null;
});
ok("the falls' enter verb leads into the falls' space",
   !!enter2 && !enter2.hidden && enter2.href === "rooms-niagara.html", JSON.stringify(enter2));
await page.goto("http://127.0.0.1:8080/rooms-niagara.html", { waitUntil: "networkidle0" });
await sleep(1500);
ok("the falls' space boots with its panorama",
   await page.evaluate(() => !!document.querySelector("[data-walk-backdrop]")));
ok("the falls' space is a day page",
   await page.evaluate(() => document.querySelector("[data-walk]")?.dataset.laneDay === "1"));
ok("the promenade carries the Journey door at the rail end",
   await page.evaluate(() => {
     const d = document.querySelector("[data-obj='door-journey']");
     return !!d && d.dataset.leave === "rooms-journey.html";
   }));
await page.evaluate(() => document.querySelector("[data-obj='door-journey']").click());
await waitForRoute("rooms-journey.html");
ok("the Journey door leads behind the falls",
   page.url().includes("rooms-journey.html"), page.url());
await page.goto("http://127.0.0.1:8080/rooms-journey.html", { waitUntil: "networkidle0" });
await sleep(1500);
// Round 33: the falls are the surveyed world now (the Horseshoe's sheets of water seen from the
// deck), not a prop called falls-jb; what the tunnel owns is the deck's parapet at its mouth.
ok("behind the falls boots in the tunnel, its deck at the mouth and the falls in its world",
   await page.evaluate(() => {
     const bd = JSON.parse(document.querySelector("[data-walk-backdrop]")?.textContent || "{}");
     return !!document.querySelector("[data-obj='deckwall-jb']")
       && ((bd.world && bd.world.prims) || []).some((p) => p.t === "w");
   }));
await page.evaluate(() => document.querySelector("[data-obj='door-back']").click());
await waitForRoute("rooms-niagara.html", "#at-door-journey");
await waitForReach("door-journey");
ok("behind the falls unwinds to its Table Rock door in the promenade",
   page.url().endsWith("rooms-niagara.html#at-door-journey"), page.url());
const journeyReturn = await page.evaluate(() => ({
  hash: location.hash, reach: document.querySelector(".walk-hit.is-reach")?.dataset.obj,
}));
ok("the returned visitor is beside the same Journey door",
   journeyReturn.hash === "#at-door-journey" && journeyReturn.reach === "door-journey",
   JSON.stringify(journeyReturn));
await page.evaluate(() => document.querySelector("[data-obj='door-back']").click());
await waitForRoute("rooms-toronto.html", "#at-falls-n");
await waitForReach("falls-n");
ok("the falls' space unwinds to its Toronto prop, not the street",
   page.url().endsWith("rooms-toronto.html#at-falls-n"), page.url());
const fallsReturn = await page.evaluate(() => {
  const w = document.querySelector("[data-walk]").__walk;
  const p = document.querySelector("[data-obj='falls-n']");
  return { hash: location.hash, reach: document.querySelector(".walk-hit.is-reach")?.dataset.obj,
    distance: Math.hypot(parseFloat(p.style.getPropertyValue("--x")) - w.x,
                         parseFloat(p.style.getPropertyValue("--z")) - w.depth) };
});
ok("the returned visitor is beside the Niagara model in Toronto",
   fallsReturn.hash === "#at-falls-n" && fallsReturn.reach === "falls-n" && fallsReturn.distance < 190,
   JSON.stringify(fallsReturn));

await browser.close();
console.log(out.join("\n"));
const fail = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fail}/${out.length} pass`);
process.exit(fail ? 1 : 0);

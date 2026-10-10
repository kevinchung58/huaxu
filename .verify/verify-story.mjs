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
const navs = [];
page.on("framenavigated", (f) => { if (f === page.mainFrame()) navs.push(f.url()); });

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

navs.length = 0;
await page.evaluate(() => document.querySelector("[data-enter-space]").click());
await sleep(300);
ok("the verb navigates into the space", navs.some((u) => u.includes("rooms-cntower.html")), navs.join(","));

/* Inside the space: the glass floor carries its step-on state, the cab doors their ride, and the
   way back is the hall. */
await page.goto("http://127.0.0.1:8080/rooms-cntower.html", { waitUntil: "networkidle0" });
await sleep(1500);
ok("the space boots with its city-below backdrop",
   await page.evaluate(() => !!document.querySelector("[data-walk-backdrop]")));
await page.evaluate(() => document.querySelector("[data-obj='glass-cn']").click());
await sleep(200);
ok("the glass floor steps on",
   (await page.$eval("[data-obj='glass-cn']", (el) => el.dataset.state)) === "1");
await page.evaluate(() => document.querySelector("[data-obj='glass-cn']").click());
await sleep(200);
ok("and steps back off",
   (await page.$eval("[data-obj='glass-cn']", (el) => el.dataset.state)) === "0");
await page.evaluate(() => document.querySelector("[data-obj='lift-cn']").click());
await sleep(200);
ok("the cab doors ride on a press",
   (await page.$eval("[data-obj='lift-cn']", (el) => el.dataset.state)) === "1");
navs.length = 0;
await page.evaluate(() => document.querySelector("[data-obj='door-back']").click());
await sleep(300);
ok("the space unwinds to the prop's room, not the street",
   navs.some((u) => u.includes("rooms-toronto.html")), navs.join(","));

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
navs.length = 0;
await page.evaluate(() => document.querySelector("[data-obj='door-back']").click());
await sleep(300);
ok("the falls' space unwinds to the hall",
   navs.some((u) => u.includes("rooms-toronto.html")), navs.join(","));

await browser.close();
console.log(out.join("\n"));
const fail = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fail}/${out.length} pass`);
process.exit(fail ? 1 : 0);

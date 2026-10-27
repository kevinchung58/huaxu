/* _backprobe.mjs — what does the browser's own back button do while a surface is open?

   The site's exits are all in-page controls: Esc, a close button, a door. A phone has no Esc, and
   its back gesture is the one exit every visitor already knows, so it should mean what the Esc
   contract means: fold what is open, and leave the place only when nothing is.

   This probe drives a real browser through the case the jsdom gates cannot see (jsdom refuses
   navigation): enter a room from the street, open a surface, press Back, and report whether the
   surface folded, whether the visitor is still in the room, and whether a second Back still leaves.

   Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_backprobe.mjs
*/
import { launch, openPage, sleep } from "./_aim.mjs";

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const ROOM = process.env.ROOM || "rooms-toronto.html";

const browser = await launch({ width: 1280, height: 800 });
const page = await openPage(browser, { rooms: "street.html", base: BASE });
const state = () => page.evaluate(() => ({
  at: location.pathname,
  card: (() => { const c = document.querySelector(".walk-card");
                 return !!c && !c.hidden; })(),
  list: (() => { const l = document.querySelector("[data-walk-listpanel]");
                 return !!l && !l.classList.contains("is-closed"); })(),
  plate: (() => { const p = document.querySelector("#room-plate");
                  return !!p && p.classList.contains("is-open"); })(),
  walkPage: !!document.querySelector("[data-walk]"),
}));
const enterRoom = async () => {
  await page.goto(`${BASE}/${ROOM}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-walk]");
  await sleep(1100);
};
const back = async () => { await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {}); await sleep(1100); };

const out = {};
await sleep(700);

/* 1. a card, opened with i, and Back. */
await enterRoom();
await page.keyboard.press("i");
await sleep(500);
out.cardOpened = (await state()).card;
await page.goBack();                      // no waitUntil: the fix means there is no navigation
await sleep(1100);
const afterCardBack = await state();
out.cardBack = afterCardBack;
await back();                             // and a second Back really does leave
out.secondBack = await state();

/* 2. the written lane, opened with l, and Back. */
await enterRoom();
await page.keyboard.press("l");
await sleep(400);
out.listOpened = (await state()).list;
out.listRaw = await page.evaluate(() => {
  const l = document.querySelector("[data-walk-listpanel]");
  return l ? { cls: l.className, hidden: l.hidden, focus: document.activeElement?.className || document.activeElement?.tagName } : "missing";
});
await page.goBack();
await sleep(1100);
out.listBack = await state();

/* 3. Esc, with nothing open, is still the exit. */
await enterRoom();
await page.keyboard.press("Escape");
await sleep(1200);
out.escapeWithNothingOpen = await state();

console.log(JSON.stringify(out, null, 2));
const verdict = {
  "a card folds on Back and the room is kept": out.cardOpened && !out.cardBack.card && out.cardBack.at === `/${ROOM}`,
  "a second Back still leaves the room": out.secondBack.at === "/street.html",
  "the written lane folds on Back": out.listOpened && !out.listBack.list && out.listBack.at === `/${ROOM}`,
  "Esc with nothing open is still the door": out.escapeWithNothingOpen.at === "/street.html",
};
console.log(JSON.stringify(verdict, null, 2));
console.log(Object.values(verdict).every(Boolean) ? "BACK CONTRACT OK" : "BACK CONTRACT BROKEN");
await browser.close();

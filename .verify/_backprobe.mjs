/* _backprobe.mjs — what does the browser's own back button do while a surface is open?

   The site's exits are all in-page controls: Esc, a close button, a door. A phone has no Esc, and
   its back gesture is the one exit every visitor already knows, so it should mean what the Esc
   contract means: fold what is open, and leave the place only when nothing is.

   This probe drives a real browser through the case the jsdom gates cannot see (jsdom refuses
   navigation): enter a room from the street, open a surface, press Back, and report whether the
   surface folded, whether the visitor is still in the room, and whether a second Back still leaves.

   It also reports where focus is after each fold, because that is the other thing only a browser
   knows: a control that stops being rendered cannot keep focus, the browser hands it to <body>, and
   the keyboard visitor's next Tab starts from the top of the document. jsdom before 31 kept
   `document.activeElement` on the hidden close button, so `verify-exit`'s "focus came back" passed on
   a button nobody could see; measured here, the card folded by Esc, by Back and by a second `i` all
   left focus on BODY while its own close button and every fold of the written lane did not.

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

/* 4. where focus is after every fold: on something drawn, never on <body>. */
const focusAt = () => page.evaluate(() => {
  const a = document.activeElement;
  const drawn = !!a && a !== document.body && a.getClientRects().length > 0;
  return { on: a ? `${a.tagName.toLowerCase()}.${String(a.className || "").split(" ")[0]}` : "none", drawn };
});
out.focus = {};
for (const [name, open, fold] of [
  ["card, Esc", "i", () => page.keyboard.press("Escape")],
  ["card, Back", "i", () => page.goBack()],
  ["card, i again", "i", () => page.keyboard.press("i")],
  ["card, its close button", "i", () => page.keyboard.press("Enter")],
  ["written lane, Esc", "l", () => page.keyboard.press("Escape")],
  ["written lane, Back", "l", () => page.goBack()],
  ["written lane, l again", "l", () => page.keyboard.press("l")],
]) {
  await enterRoom();
  await page.keyboard.press(open);
  await sleep(400);
  await fold();
  await sleep(700);
  out.focus[name] = await focusAt();
}

console.log(JSON.stringify(out, null, 2));
const verdict = {
  "a card folds on Back and the room is kept": out.cardOpened && !out.cardBack.card && out.cardBack.at === `/${ROOM}`,
  "a second Back still leaves the room": out.secondBack.at === "/street.html",
  "the written lane folds on Back": out.listOpened && !out.listBack.list && out.listBack.at === `/${ROOM}`,
  "Esc with nothing open is still the door": out.escapeWithNothingOpen.at === "/street.html",
  "every fold leaves focus on something drawn": Object.values(out.focus).every((f) => f.drawn),
};
console.log(JSON.stringify(verdict, null, 2));
console.log(Object.values(verdict).every(Boolean) ? "BACK CONTRACT OK" : "BACK CONTRACT BROKEN");
await browser.close();

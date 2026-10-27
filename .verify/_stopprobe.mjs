import { launch, openPage, sleep, park } from "./_aim.mjs";
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: process.env.ROOMS || "rooms-niagara.html", hour: "day" });
await park(page); await sleep(600);
const seen = () => page.evaluate(() => {
  const pick = (s) => Array.from(document.querySelectorAll(s)).filter((el) => {
    const r = el.getBoundingClientRect();
    return !el.hidden && !el.classList.contains("is-closed") && r.width > 4 && r.height > 4;
  }).length;
  return { card: pick("[data-walk-card]"), list: pick("[data-walk-listpanel]"),
           plate: pick("#room-plate"), banner: pick("[data-walk-banner].is-on"),
           tutorial: pick("[data-walk-tutor]"),
           bannerText: (document.querySelector("[data-walk-banner]")?.innerText || "").replace(/\s+/g, " ").slice(0, 40),
           zoneHud: (document.querySelector("[data-walk-status]")?.textContent || "").slice(0, 50) };
});
console.log("on arrival", JSON.stringify(await seen()));
// dismiss the guide the way a visitor does
await page.evaluate(() => { const s = document.querySelector("[data-walk-tutor-skip]"); if (s && !s.hidden) s.click(); });
await page.evaluate(() => document.querySelector("[data-walk-tutor-done]")?.click());
await page.evaluate(() => document.querySelector("[data-walk-tutor-skip]")?.click());
await sleep(300);
console.log("guide folded", JSON.stringify(await seen()));
for (const i of [2, 5, 6]) {
  const box = await page.evaluate((i) => {
    const el = document.querySelectorAll("[data-walk-stop]")[i];
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), label: el.getAttribute("aria-label") };
  }, i);
  await page.mouse.click(box.x, box.y);
  await sleep(1200);
  console.log(`stop ${i} "${(box.label||"").slice(0, 14)}" ->`, JSON.stringify(await seen()));
  await sleep(3000);
  console.log(`  +3 s`, JSON.stringify(await seen()));
}
await browser.close();

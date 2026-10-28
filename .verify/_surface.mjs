/* _surface -- how much of the screen each surface takes, and how much of *that* is the thing the
   press promised. Round 75.

   Round 74 settled which objects may open text. This is the next question, and it is the same one
   one level down: a surface that covers the screen is only justified if its content fills it. The
   measurement that started it: pressing a print on rooms-toronto opened a plate over **100 %** of the
   viewport to show a **366 × 190 px** illustration -- the story rail's column is the width of a 9:16
   frame (`--col`), and every picture in this record is landscape, so `object-fit: contain` fit it by
   width inside a portrait column and left the rest of the screen to a blur of itself.

   For every surface this probe opens, it reports:
     cover    the surface's box as a % of the viewport
     content  the box of the thing the press promised (the <img>, the <canvas>, the card's text)
     fill     content area / surface area -- "is the surface a frame for this, or a room around it"
     measure  the widest line of prose in it, in characters (a 992 px caption line is unreadable)

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_surface.mjs
         ROOMS=rooms-toronto.html,rooms-goat.html node .verify/_surface.mjs
*/
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";

const PAGES = (process.env.ROOMS || "rooms-toronto.html,rooms-goat.html,street.html").split(",");
const WANT = (process.env.VERBS || "photos,read,play,try").split(",");
const HEADINGS = [0, 45, 90, 135, 180, 225, 270, 315];

const measure = (page, surface, pick) => page.evaluate((sel, pickSel) => {
  const area = (r) => Math.max(0, r.width) * Math.max(0, r.height);
  const vp = innerWidth * innerHeight;
  /* Not `offsetParent`: the plate is `position: fixed`, and a fixed element's offsetParent is null --
     which made the photo surface read as "opened nothing" on the first run. Rects are the honest test. */
  const shown = (el) => {
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && el.getClientRects().length > 0;
  };
  const el = document.querySelector(sel);
  if (!el || !shown(el)) return null;
  const box = el.getBoundingClientRect();
  /* The content is whatever the press promised, and the honest way to find it is the largest box
     the surface actually shows -- a `hidden` attribute sits on the frame, not on the <img> inside
     it, so the first `img:not([hidden])` in a reel is a frame nobody is looking at (measured 1x1). */
  const cands = [...el.querySelectorAll(pickSel || "img, canvas, p, h2, figcaption")].filter(shown);
  let c = null;
  for (const k of cands) {
    const r = k.getBoundingClientRect();
    /* The box an <img> gets is not the picture: `object-fit: contain` fits by the width or the
       height, whichever binds first, and the rest of the box is letterbox. A surface judged by its
       element boxes reports a picture that is not on the screen -- measured 365x525 for a 365x190
       drawing. The painted size is derived from the file's own ratio. */
    let w = r.width, h = r.height;
    if (k.tagName === "IMG" && k.naturalWidth && k.naturalHeight) {
      const fit = Math.min(r.width / k.naturalWidth, r.height / k.naturalHeight);
      w = k.naturalWidth * fit; h = k.naturalHeight * fit;
    }
    const box = { width: w, height: h };
    if (!c || area(box) > area(c)) c = box;
  }
  /* Prose measure: the widest rendered text block, in characters, from its box and its font. */
  let measure = 0, measureBy = "";
  for (const k of [...el.querySelectorAll("p, figcaption, li, h2")].filter(shown)) {
    const cs = getComputedStyle(k);
    /* The painted text, not the box. A centred "1 of 3" in a 704 px column has a 704 px box and a
       40 px line, and the first run of this probe reported the counter as the widest prose on the
       screen (113 ch, `p.story-count`). A Range over the contents is the width the words occupy. */
    const range = document.createRange();
    range.selectNodeContents(k);
    const inner = range.getBoundingClientRect().width || (k.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0));
    const fs = parseFloat(cs.fontSize) || 16;
    const ch = Math.round(inner / (fs * 0.5));
    /* The number has to be attributable: a measure with no element is a rumour. */
    if (ch > measure) { measure = ch; measureBy = k.tagName.toLowerCase() + (k.className ? "." + String(k.className).split(" ")[0] : ""); }
  }
  const text = (el.textContent || "").replace(/\s+/g, " ").trim();
  return {
    cover: Math.round((area(box) / vp) * 100),
    content: c ? [Math.round(c.width), Math.round(c.height)] : null,
    fill: c ? Math.round((area(c) / area(box)) * 100) : null,
    measure, measureBy,
    words: text ? text.split(" ").length : 0,
    sample: text.slice(0, 60),
  };
}, surface, pick);

/* The bar speaks the *label* (`Photographs · `), not the generator's key (`photos`). One table, the
   same one `VERB_WORD` holds, so the probe cannot drift from the site's own words. */
const KEY = { "walk through": "leave", photographs: "photos", ride: "ride", play: "play",
              try: "try", use: "use", read: "read" };
const bar = (page) => page.evaluate(() => {
  const b = document.querySelector("[data-walk-open]");
  return b && !b.hidden ? { verb: (b.dataset.verb || "").trim(), title: b.textContent.trim() } : null;
});

const fold = async (page) => {
  await page.evaluate(() => {
    const c = document.querySelector("[data-walk-card]:not([hidden]) [data-walk-card-close]");
    if (c) c.click();
    const d = document.querySelector("#room-plate.is-open [data-room-close]");
    if (d) d.click();
    const g = document.querySelector("[data-walk-game]:not([hidden]) [data-game-close]");
    if (g) g.click();
    const l = document.querySelector("[data-walk-listpanel]:not(.is-closed)");
    if (l) document.querySelector("[data-walk-list]")?.click();
  });
  await sleep(250);
};

/* Which selector a verb's answer puts on the screen. One table, so a new surface has to be declared
   here before it can be measured -- and a surface that is not measured is not reviewed. */
const PICK = { photos: "img, figcaption", read: "p, h2", play: "canvas, p", "key I": "p, h2", "key L": "li, p" };
const SURFACE = {
  photos: "#room-plate.is-open",
  read: "[data-walk-card]:not([hidden])",
  play: "[data-walk-game]:not([hidden])",
  try: null,      // `try` answers in the scene: there is no surface to measure
  use: null,
  ride: null,
  leave: null,
};

const browser = await launch({ width: 1024, height: 768 });
const rows = [];
const note = (r) => {
  rows.push(r);
  console.log(`${(r.rooms + " " + r.verb).padEnd(32)} ${String(r.cover ?? "-").padStart(4)}% cover  `
    + `${r.content ? r.content.join("×") : "-"} content  ${String(r.fill ?? "-").padStart(4)}% fill  `
    + `${String(r.measure ?? "-").padStart(4)} ch ${String(r.measureBy || "").padEnd(10)} ${r.sample || r.note || ""}`);
};
for (const rooms of PAGES) {
  const page = await openPage(browser, { rooms, hour: "day" });
  /* The keys first: they are surfaces too, and they cost nothing to measure. */
  for (const [key, sel, name] of [["i", "[data-walk-card]:not([hidden])", "key I"], ["l", "[data-walk-listpanel]:not(.is-closed)", "key L"]]) {
    await fold(page);
    await page.keyboard.press(key);
    await sleep(400);
    const m = await measure(page, sel, PICK[name]);
    note(m ? { rooms, verb: name, ...m } : { rooms, verb: name, note: "did not open" });
    await fold(page);
  }
  const seen = new Set();
  const stopCount = await page.evaluate(() => document.querySelectorAll("[data-walk-stop]").length);
  for (let si = 0; si < stopCount && seen.size < WANT.length; si++) {
    const a = await arrive(page, si);
    if (!a.arrived) continue;
    for (const h of HEADINGS) {
      await fold(page);
      await aim(page, h);
      await park(page, 420);
      const b = await bar(page);
      const label = b && b.verb.replace(/\s*·\s*$/, "").trim().toLowerCase();
      const verb = label && (KEY[label] || label);
      if (!verb || seen.has(verb) || !WANT.includes(verb)) continue;
      const sel = SURFACE[verb];
      if (!sel) continue;
      seen.add(verb);
      await page.keyboard.press("e");
      await sleep(900);
      const m = await measure(page, sel, PICK[verb]);
      note(m ? { rooms, verb, title: b.title, ...m } : { rooms, verb, title: b.title, note: "opened nothing" });
      await fold(page);
    }
  }
  await page.close();
}
await browser.close();

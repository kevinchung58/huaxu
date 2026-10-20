/* What a visitor without WebGL actually sees.
 *
 * Round 54 deleted the Canvas2D painter on the owner's ruling, so the no-WebGL path is now a
 * sentence rather than a second picture. This probe asks the served page whether that sentence is
 * visible: it returns `null` for every webgl context request, waits for `walkRenderer="off"`, and
 * reports the note's own box, computed style and ancestor chain — not the fact that the element
 * exists in the DOM (a hidden paragraph in a closed card "exists" too).
 *
 *   node .verify/_nogl.mjs            # desktop viewport
 *   TOUCH=1 node .verify/_nogl.mjs    # a coarse pointer, where `.walk-note` is display:none
 */
import fs from "node:fs";
if (fs.existsSync("/tmp/al2023/lib")) process.env.LD_LIBRARY_PATH = `/tmp/al2023/lib:${process.env.LD_LIBRARY_PATH || ""}`;
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const PAGES = process.env.PAGES
  ? process.env.PAGES.split(",")
  : ["street.html", "rooms.html", "rooms-niagara.html", "rooms-cntower.html"];
const OUT = ".preview/nogl";
fs.mkdirSync(OUT, { recursive: true });

// A phone is the case the sentence is most likely to lose: `.walk-note` is `display: none` under a
// coarse pointer, so a fallback wearing that class is invisible on exactly the device that has no
// second renderer to fall back on. Emulating the media query is how it is measured rather than
// assumed.
const TOUCH = process.env.TOUCH === "1";
const GL = process.env.GL === "1";
const failed = [];
const browser = await puppeteer.launch({
  executablePath: "/tmp/chromium",
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true,
  defaultViewport: TOUCH ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1024, height: 768 },
});

for (const file of PAGES) {
  const page = await browser.newPage();
  // This puppeteer build cannot emulate `hover`/`pointer` as media features, so the phone case is
  // emulated the way Chromium does it: a mobile viewport with touch enabled. The report carries
  // what the browser itself says about the queries and whether the note is painted under them.
  if (TOUCH) await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  // GL=1 runs the same report against the healthy path: the sentence is the fallback, so it must
  // stay hidden while the lane renders — otherwise "WebGL is unavailable" becomes a lie told to
  // every visitor with a working GPU.
  if (!GL) await page.evaluateOnNewDocument(() => {
    const real = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (/webgl/i.test(String(type))) return null;
      return real.call(this, type, ...rest);
    };
  });
  await page.goto(`http://127.0.0.1:8080/${file}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 30000 });
  let settled = true;
  try {
    await page.waitForFunction(
      (want) => document.querySelector("[data-walk]").dataset.walkRenderer === want,
      { timeout: 20000 }, GL ? "three" : "off");
  } catch {
    settled = false;
  }
  await new Promise((r) => setTimeout(r, 600));
  const report = await page.evaluate(() => {
    const layer = document.querySelector("[data-walk]");
    const note = layer.querySelector("[data-walk-fallback]");
    const card = note && note.closest("[data-walk-card]");
    const view = layer.querySelector("[data-walk-view]");
    const rect = note && note.getBoundingClientRect();
    const cs = note && getComputedStyle(note);
    const chain = [];
    for (let el = note; el && el !== document.body; el = el.parentElement) {
      const s = getComputedStyle(el);
      chain.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className || "",
        hidden: el.hidden,
        display: s.display,
        visibility: s.visibility,
        opacity: s.opacity,
      });
    }
    return {
      media: {
        hoverNone: matchMedia("(hover: none)").matches,
        pointerCoarse: matchMedia("(pointer: coarse)").matches,
        noteQuery: matchMedia("(hover: hover) and (pointer: fine)").matches,
      },
      renderer: layer.dataset.walkRenderer,
      canvasHidden: layer.querySelector("[data-walk-three]")?.hidden,
      note: note ? {
        text: note.textContent.replace(/\s+/g, " ").trim().slice(0, 160),
        hidden: note.hidden,
        rect: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } : null,
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        fontSize: cs.fontSize,
        inCard: !!card,
        cardHidden: card ? card.hidden : null,
      } : null,
      chain,
      viewBox: view ? { w: view.clientWidth, h: view.clientHeight } : null,
    };
  });
  console.log(`\n== ${file} ==`);
  console.log(JSON.stringify(report, null, 2));
  console.log(`settled=${settled}`);
  // The gate half. In the no-WebGL state the sentence must be *painted*: `hidden` off, a real box,
  // display not none, and outside the info card (which ships collapsed). In GL mode the same
  // sentence must not appear at all, or every visitor with a working GPU is told a lie.
  const n = report.note;
  const painted = n && !n.hidden && n.display !== "none" && n.rect && n.rect.w > 0 && n.rect.h > 0 && !n.inCard;
  const failures = [];
  if (!settled) failures.push(`renderer never reported ${GL ? "three" : "off"} (got ${report.renderer})`);
  if (GL) {
    if (n && !n.hidden) failures.push("the lane renders, yet the unavailable sentence is shown");
  } else if (!painted) {
    failures.push(`the sentence is not painted over the empty lane: ${JSON.stringify(n)}`);
  }
  if (failures.length) { failed.push(`${file}: ${failures.join("; ")}`); console.log(`FAIL ${failures.join("; ")}`); }
  else console.log(GL ? "PASS  the sentence stays hidden while the lane renders" : "PASS  the sentence is painted over the empty lane");
  await page.screenshot({ path: `${OUT}/${file.replace(/\.html$/, "")}-${GL ? "gl" : "nogl"}${TOUCH ? "-touch" : ""}.png` });
  await page.close();
}

await browser.close();
if (failed.length) { console.log(`\n${failed.length} page(s) FAILED`); process.exit(1); }
console.log(`\n${PAGES.length}/${PAGES.length} pages pass (${GL ? "WebGL present" : "WebGL refused"})`);

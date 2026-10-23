/* verify-nowebgl.mjs — the lane with no renderer, in a real browser.
 *
 * Round 54 deleted the second picture (owner ruling), and round 55 rendered what a visitor
 * without WebGL actually gets: an empty navy viewport with the only explanation three
 * interactions away inside the info card. That is a state nobody looked at, so nobody gated it.
 * This harness is the thing that looks at it.
 *
 * Both directions are asserted, because a panel that is always shown would pass a one-sided test:
 *   - WebGL refused  → the lane says so in the viewport, the prop buttons retire (they are a
 *     projection onto a picture that does not exist), and the compiled state still answers:
 *     a stop chip moves the walker, the list opens with this lane's own writing.
 *   - WebGL present  → no panel, renderer "three" (the control).
 *
 * Run after `bin/preview` (a server on :8080), with LD_LIBRARY_PATH=/tmp/al2023/lib:
 *   node .verify/verify-nowebgl.mjs
 */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const PAGES = process.env.PAGES ? process.env.PAGES.split(",") : ["street.html", "rooms-niagara.html", "rooms-fukuoka.html"];
const out = [];
const ok = (name, cond, detail = "") => out.push(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"], headless: true,
  defaultViewport: { width: 1024, height: 720 } });

const refuseWebGL = () => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    return String(kind).startsWith("webgl") ? null : orig.call(this, kind, ...rest);
  };
};

// --- 1. the no-WebGL path, page by page -------------------------------------------------------
for (const file of PAGES) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await page.evaluateOnNewDocument(refuseWebGL);
  await page.goto(`${BASE}/${file}`, { waitUntil: "networkidle0", timeout: 60_000 });
  await page.waitForFunction(() => {
    const layer = document.querySelector("[data-walk]");
    return layer && layer.dataset.walkRenderer === "off";
  }, { timeout: 30_000 });
  await sleep(600);

  const state = await page.evaluate(() => {
    const layer = document.querySelector("[data-walk]");
    const panel = layer.querySelector("[data-walk-offline]");
    const where = layer.querySelector("[data-walk-offline-where]");
    const hits = layer.querySelector(".walk-hits");
    const note = layer.querySelector("[data-walk-fallback]");
    const card = layer.querySelector("[data-walk-card]");
    return {
      renderer: layer.dataset.walkRenderer,
      panelShown: !!panel && !panel.hidden && panel.getBoundingClientRect().height > 100,
      panelText: panel ? panel.innerText.replace(/\s+/g, " ").trim() : "",
      where: where ? where.textContent.trim() : "",
      status: layer.querySelector("[data-walk-status]").textContent.trim(),
      isOfflineClass: layer.classList.contains("is-offline"),
      hitsShown: !!hits && getComputedStyle(hits).display !== "none",
      noteShown: !!note && !note.hidden,
      staleNote: !!note,
      cardText: card ? card.innerText.replace(/\s+/g, " ").trim() : "",
      canvasHidden: layer.querySelector("canvas[data-walk-three]").hidden,
    };
  });

  ok(`${file}: the lane reports itself renderer-less`, state.renderer === "off", state.renderer);
  ok(`${file}: the viewport says why it is empty`, state.panelShown, JSON.stringify(state.panelText.slice(0, 80)));
  ok(`${file}: the panel admits no picture and names what still works`,
     /cannot draw the lane/.test(state.panelText) && /list/.test(state.panelText) && /stops/.test(state.panelText));
  ok(`${file}: the panel carries the lane's own standing position`,
     state.where.length > 3 && state.where === state.status, `${state.where} vs ${state.status}`);
  ok(`${file}: the projected prop buttons retire`, state.isOfflineClass && !state.hitsShown);
  /* Round 55 moved the sentence about the missing picture into the viewport, where a visitor with no
     WebGL can read it without opening anything. Round 64: this gate was still asking for the old
     `[data-walk-fallback]` element inside the info card -- an element the page has not carried since
     round 55 -- so it failed on every page while proving nothing. The sentence must be on the page
     and not behind a card, and no dead element may be left behind claiming to be it. */
  ok(`${file}: the sentence about the missing picture is on the page, not behind a button`,
     /cannot draw the lane/.test(state.panelText) && !/cannot draw the lane/.test(state.cardText)
       && !state.staleNote,
     `card=${state.cardText.slice(0, 60)} stale=${state.staleNote}`);
  ok(`${file}: the dead canvas is hidden`, state.canvasHidden);
  ok(`${file}: no page error on the way to the panel`, errors.length === 0, errors.join(" | "));

  // The compiled state must still answer: a stop chip is a ride, not a picture.
  const before = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
  await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[2]?.click());
  await sleep(2500);
  const after = await page.evaluate(() => ({
    depth: document.querySelector("[data-walk]").__walk.depth,
    where: document.querySelector("[data-walk-offline-where]").textContent.trim(),
    status: document.querySelector("[data-walk-status]").textContent.trim(),
  }));
  ok(`${file}: a stop still carries the walker`, Math.abs(after.depth - before) > 200,
     `${before.toFixed(0)} → ${after.depth.toFixed(0)} cm`);
  ok(`${file}: the printed position follows the walker`, after.where === after.status, after.where);

  await page.evaluate(() => document.querySelector("[data-walk-list]").click());
  await sleep(500);
  const list = await page.evaluate(() => {
    const panel = document.querySelector("[data-walk-listpanel]");
    return { width: panel.getBoundingClientRect().width, text: panel.innerText.replace(/\s+/g, " ") };
  });
  ok(`${file}: the reading material is intact with no renderer`, list.width > 200 && list.text.length > 400,
     `w=${list.width} chars=${list.text.length}`);
  await page.close();
}

// --- 2. the control: with WebGL, none of the above happens -------------------------------------
{
  const page = await browser.newPage();
  await page.goto(`${BASE}/${PAGES[0]}`, { waitUntil: "networkidle0", timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector("[data-walk]")?.dataset.walkRenderer === "three",
    { timeout: 60_000 });
  const state = await page.evaluate(() => {
    const layer = document.querySelector("[data-walk]");
    return {
      renderer: layer.dataset.walkRenderer,
      panelHidden: !!layer.querySelector("[data-walk-offline]").hidden,
      hitsShown: getComputedStyle(layer.querySelector(".walk-hits")).display !== "none",
      offlineClass: layer.classList.contains("is-offline"),
    };
  });
  ok("with WebGL the panel stays out of the way",
     state.renderer === "three" && state.panelHidden && state.hitsShown && !state.offlineClass,
     JSON.stringify(state));
  await page.close();
}

await browser.close();
// A run that inspected nothing must not report a pass.
ok("the harness actually had pages to inspect", PAGES.length > 0);
console.log(out.join("\n"));
const fail = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fail}/${out.length} pass`);
process.exit(fail ? 1 : 0);

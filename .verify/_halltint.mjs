/* Round 53 — the hall colour audit.
 *
 * The R51 "near-black hall" fix folded the night's navy murk into the halls at full strength
 * (night ambient 0.62 + a 4.5× navy emissive on every lit material, forced on by hallK). That
 * lifted luma past the blackout floor but pushed blue over warm lamp colours: the owner's word
 * for it was 紫色 ("everything went purple"). Luma alone could not see this — a purple frame and
 * an amber frame share a luma — so this instrument reports the channels and the hue buckets.
 *
 * Measures the SCREENSHOT (what a real browser composites: the WebGL canvas with tone mapping,
 * plus any DOM chrome on top), not a canvas readback — the lit path is the thing on trial.
 * Halls are clicked to their last stop (the same port-table stop the R51 floor was measured at);
 * the street's night is chosen the way a visitor chooses it (the hour button, and it waits for
 * `walkClock` to say so); the 2D painter's reference for a hall is taken by aborting scene3d.js
 * and letting the documented no-WebGL path paint, which is the look the tint must come back to.
 *
 *   node .verify/_halltint.mjs
 */
import fs from "node:fs";
// a sandbox-wiped /tmp/al2023 (bin/restore-env unpacks it there) is invisible to chromium unless the
 // harness carries it; setting it inside the script beats remembering the env prefix each call
if (fs.existsSync("/tmp/al2023/lib")) process.env.LD_LIBRARY_PATH = `/tmp/al2023/lib:${process.env.LD_LIBRARY_PATH || ""}`;
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const { loadImage } = await import("@napi-rs/canvas");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWS = [
  // [label, page, clickLastStop, mode]  mode: "" | "night" (press the hour)
  ["toronto", "rooms-toronto.html", true, ""],
  ["fukuoka", "rooms-fukuoka.html", true, ""],
  ["tokyo-hall", "rooms.html", true, ""],
  ["cntower", "rooms-cntower.html", false, ""],
  ["journey", "rooms-journey.html", false, ""],
  ["niagara-day", "rooms-niagara.html", false, ""],
  ["niagara-night", "rooms-niagara.html", false, "night"],
  ["goat-day", "rooms-goat.html", false, ""],
  ["street-noon", "street.html", false, ""],
  ["street-night", "street.html", false, "night"],
];

const browser = await puppeteer.launch({
  executablePath: "/tmp/chromium",
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true, defaultViewport: { width: 1024, height: 640 },
});
// The sandbox has no route to the font hosts, and chromium's retries on an unreachable css2 request
// can outlast `load` itself; every non-local request is aborted at the page level below.
const arm = async (p) => {
  await p.setRequestInterception(true);
  p.on("request", (req) => (req.url().includes("127.0.0.1:8080") || req.url().startsWith("data:")
    ? req.continue().catch(() => {}) : req.abort().catch(() => {})));
  p.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 140)));
};

for (const [label, url, clickStop, mode] of VIEWS) {
  // Round 54: one fresh page per view. A painter-era probe, this; the same-tab carryover it used
  // to survive is not worth debugging now that the second renderer it compared is gone.
  const page = await browser.newPage();
  await arm(page);
  await page.evaluateOnNewDocument((v) => { try { localStorage.setItem("huaxu.walk-hour.v1", v); } catch (e) {} },
    mode === "night" ? "night" : "day");
  // domcontentloaded, not load: a same-tab nav away from the previous view leaves its subresource
  // requests abandoned, and `load` can wait on them; the boot wait below is the real gate.
  await page.goto(`http://127.0.0.1:8080/${url}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
  if (mode === "night") {
    await page.evaluate(() => {
      const b = document.querySelector("[data-walk-hour]");
      if (document.querySelector("[data-walk]").dataset.walkClock !== "night") b.click();
    });
    await page.waitForFunction("document.querySelector('[data-walk]').dataset.walkClock === 'night'", { timeout: 25000 });
  }
  if (clickStop) {
    await page.evaluate(() => {
      const s = document.querySelectorAll("[data-walk-stop]");
      s[s.length - 1].click();
    });
    // settle on state, not a stopwatch: same depth twice in a row, teleport done
    let prev = -1;
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      const d = await page.evaluate(() => document.querySelector("[data-walk]").__walk.depth);
      if (d === prev && d > 0) break;
      prev = d;
    }
  }
  await sleep(1200);
  // read the renderer right before the shot: attachThree happens after the module's import settles
  const renderer = await page.evaluate(() => document.querySelector("[data-walk]").__walk.renderer);
  const png = await page.screenshot({ type: "png" });
  const img = await loadImage(png);
  const { createCanvas } = await import("@napi-rs/canvas");
  const c = createCanvas(img.width, img.height);
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const D = g.getImageData(0, 0, img.width, img.height).data;
  let sr = 0, sg = 0, sb = 0, sl = 0, n = 0, purple = 0, violetSky = 0, cold = 0;
  for (let i = 0; i < D.length; i += 8) { // every other pixel
    const r = D[i], gg = D[i + 1], b = D[i + 2];
    sr += r; sg += gg; sb += b; sl += 0.2126 * r + 0.7152 * gg + 0.0722 * b; n++;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
    const sat = mx ? (mx - mn) / mx : 0;
    let h = 0;
    if (mx !== mn) {
      if (mx === r) h = 60 * (((gg - b) / (mx - mn)) % 6);
      else if (mx === gg) h = 60 * ((b - r) / (mx - mn) + 2);
      else h = 60 * ((r - gg) / (mx - mn) + 4);
      if (h < 0) h += 360;
    }
    if (h >= 250 && h <= 330 && sat > 0.15 && mx > 40) purple++;
    if (h >= 225 && h < 250 && sat > 0.15 && mx > 40) violetSky++;
    if (b > r + 12 && b > gg + 12) cold++;
  }
  console.log(`${label.padEnd(13)} [${renderer}] luma ${(sl / n).toFixed(1).padStart(5)}  mean RGB ${(sr / n).toFixed(0)},${(sg / n).toFixed(0)},${(sb / n).toFixed(0)}` +
    `  purple ${(100 * purple / n).toFixed(1).padStart(5)}%  violet ${(100 * violetSky / n).toFixed(1).padStart(5)}%  cold ${(100 * cold / n).toFixed(1).padStart(5)}%`);
  await page.close();
}
await browser.close();

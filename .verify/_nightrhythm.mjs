/* _nightrhythm.mjs — is the street's night a rhythm, or one flat dark?

   The day system is measured (mean luma at noon, at dusk, at night — `_lumacheck.mjs`). A whole-frame
   mean cannot see the thing the night's light is supposed to make: *pools*. A lantern's pool on the
   asphalt, a shop's window light spilled across the pavement, the dark stretch between two of them —
   those are local, and they average away. So this probe measures the pavement:

   - `floor luma` — mean over the bottom band of the frame, where the asphalt is;
   - `warm share`  — how much of that band is warm (a sodium/lantern pool is warm, night asphalt is
                     navy), so "light on the ground" is counted and not inferred;
   - `p‑p`         — the spread of the band's column means, max minus min over 64 columns. A flat
                     dark street has almost none; a street with pools alternating with dark pavement
                     has a lot. This is the number that says "rhythm" out loud.
   - `cols`        — distinct colours in the band, so a wash is not mistaken for texture.

   It walks the street to the lantern pair (z≈470 record / 1363 walk) and to the shops, at whatever
   `data-lane-day-start` it is handed, and prints one line per stop. Run it before and after any
   change to the night's light, and keep the whole-frame numbers from `_lumacheck.mjs` beside it:
   the pools are the point, and the frame's mean is the constraint.

     node .verify/_nightrhythm.mjs            # night (start 0.98) and noon, as served
     DAY_START=0.80 node .verify/_nightrhythm.mjs   # one moment only
*/
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const { createCanvas, loadImage } = await import("@napi-rs/canvas");

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(), headless: true,
  args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 200)));
await page.setViewport({ width: 1024, height: 640 });

const intercept = (start) => {
  page.removeAllListeners("request");
  if (start === null) { page.setRequestInterception(false); return; }
  page.setRequestInterception(true);
  page.on("request", async (req) => {
    if (!req.url().endsWith("street.html")) return req.continue();
    const res = await fetch(req.url());
    const body = (await res.text())
      .replace('data-lane-day-start="0.45"', `data-lane-day-start="${start}"`);
    req.respond({ status: 200, contentType: "text/html", body });
  });
};

/* The pavement band: the bottom fifth of the frame, minus the 12% either edge where the walls and
   the kerbs are. Nothing about the renderer is trusted here — this is the served page's own pixels. */
const band = async (label) => {
  const img = await loadImage(await page.screenshot({ type: "png" }));
  const c = createCanvas(img.width, img.height), g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const y0 = Math.round(img.height * 0.80), y1 = img.height;
  const x0 = Math.round(img.width * 0.12), x1 = Math.round(img.width * 0.88);
  const d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data;
  const W = x1 - x0, H = y1 - y0;
  let sum = 0, warm = 0, n = 0;
  const cols = new Set();
  const colSum = new Float64Array(64), colN = new Int32Array(64);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      const l = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
      sum += l; n++;
      cols.add((r >> 3) << 10 | (gg >> 3) << 5 | (b >> 3));
      if (r > b + 18 && r > 46) warm++;
      const ci = Math.min(63, Math.floor((x / W) * 64));
      colSum[ci] += l; colN[ci]++;
    }
  }
  const means = [];
  for (let i = 0; i < 64; i++) if (colN[i]) means.push(colSum[i] / colN[i]);
  means.sort((a, b) => a - b);
  const p10 = means[Math.floor(means.length * 0.1)], p90 = means[Math.floor(means.length * 0.9)];
  console.log(`${label}: floor luma ${(sum / n).toFixed(1)}  warm ${(100 * warm / n).toFixed(1)}%  `
    + `p10 ${p10.toFixed(1)} / p90 ${p90.toFixed(1)} (spread ${(p90 - p10).toFixed(1)})  `
    + `${cols.size} colours`);
};

const walk = async (secs) => {
  await page.keyboard.down("w");
  await new Promise((r) => setTimeout(r, secs * 1000));
  await page.keyboard.up("w");
  await new Promise((r) => setTimeout(r, 500));
};

for (const [label, start] of [["night", process.env.DAY_START || "0.98"], ["noon", null]]) {
  await intercept(start === "null" ? null : start);
  await page.goto("http://localhost:8080/street.html", { waitUntil: "load", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2500));
  await band(`${label} · the mouth`);
  await walk(3.2);
  await band(`${label} · the Canadian half`);
  await walk(3.0);
  await band(`${label} · under the lanterns (z≈470)`);
  await walk(3.4);
  await band(`${label} · the shops (z≈780)`);
  await walk(2.6);
  await band(`${label} · the end of the street`);
}
await browser.close();

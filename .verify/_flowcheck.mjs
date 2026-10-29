/* Does the foam actually move, and only the foam? Two PNG frames one second apart, diffed in the
   near-water band and in the sky band. Run: node .verify/_flowcheck.mjs */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";
/* A/B: `OFF=1` serves scene3d.js with the flow keys emptied, so the same view under the same
   instrument shows what the water does when nothing scrolls. Without the control, "the near water
   differs between two frames" could be the walker's shadow, the plume, or the instrument. */
const OFF = process.env.OFF === "1";
const hook = (req) => {
  if (!OFF || !/\/js\/scene3d\.js(\?|$)/.test(req.url())) return req.continue();
  fetch(req.url()).then((r) => r.text()).then((body) => req.respond({ status: 200,
    contentType: "application/javascript",
    body: body.replace('const FLOW_KEYS = new Set(["foam", "rapids"]);', "const FLOW_KEYS = new Set([]);") }))
    .catch(() => req.continue());
};
const browser = await launch({ width: 1024, height: 768 });
const page = await openPage(browser, { rooms: process.env.FILE || "rooms-goat.html", hour: "day",
                                       reduce: false, intercept: OFF ? hook : null });
await arrive(page, Number(process.env.STOP || 3));
await aim(page, Number(process.env.YAW || 88), { pitch: Number(process.env.PITCH || -2) });
await park(page);
const a = "/tmp/flow-a.png", b = "/tmp/flow-b.png";
await page.screenshot({ path: a }); await sleep(1200); await page.screenshot({ path: b });
await browser.close();
const A = await loadImage(a), B = await loadImage(b);
const band = (y0, y1) => {
  const c = createCanvas(1024, 768), g = c.getContext("2d");
  g.drawImage(A, 0, 0); const da = g.getImageData(0, y0, 1024, y1 - y0).data;
  g.drawImage(B, 0, 0); const db = g.getImageData(0, y0, 1024, y1 - y0).data;
  let sum = 0, n = 0, moved = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3;
    sum += d; n++; if (d > 6) moved++;
  }
  return { mean: +(sum / n).toFixed(2), movedPct: +(100 * moved / n).toFixed(1) };
};
console.log(`near water  y 640-767: ${JSON.stringify(band(640, 767))}`);
console.log(`sheet+plume y 300-620: ${JSON.stringify(band(300, 620))}`);
console.log(`sky         y  60-200: ${JSON.stringify(band(60, 200))}`);

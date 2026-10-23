/* Sample a frame's pixels: the measure behind "the plaza is one pale sheet".

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_pix.mjs .preview/r64/day3/stop6-yaw78-640x480.png
*/
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const file = process.argv[2];
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 640, height: 480 },
});
const page = await browser.newPage();
const b64 = fs.readFileSync(file).toString("base64");
const out = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = "data:image/png;base64," + b64;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const res = { size: [img.width, img.height] };
  // a grid of samples over the lower half (the ground) and a few named points
  const at = (px, py) => { const d = x.getImageData(px, py, 1, 1).data; return [d[0], d[1], d[2]]; };
  for (const [name, px, py] of [["sky", 320, 40], ["groundNear", 320, 440], ["groundMid", 160, 340],
                              ["groundLeft", 60, 310], ["groundRight", 560, 320], ["farGround", 200, 250]]) {
    res[name] = at(px, py);
  }
  // the contrast of the ground: the spread of a 200x60 patch on the near ground
  const d = x.getImageData(220, 400, 200, 60).data;
  let min = 255, max = 0, sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
    min = Math.min(min, l); max = Math.max(max, l); sum += l; n++;
  }
  res.groundPatch = { min: Math.round(min), max: Math.round(max), mean: Math.round(sum / n) };
  return res;
}, b64);
console.log(JSON.stringify(out, null, 1));
await browser.close();

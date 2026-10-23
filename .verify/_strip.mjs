/* Dump a vertical and a horizontal strip of a frame's pixels.

   The measure behind "the plaza floor is one pale sheet": if the paving were reaching the
   screen at all, a column down the near ground would step darker at every joint, and a row
   across the middle distance would show the tiles' periodicity. A strip that is a smooth
   ramp in one direction and flat in the other says the texture is not on those pixels.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_strip.mjs .preview/r64/day4/stop6-yaw78-640x480.png
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
  const at = (px, py) => { const d = x.getImageData(px, py, 1, 1).data; return `${d[0]},${d[1]},${d[2]}`; };
  const col = [], row = [];
  for (let py = 240; py < 480; py += 12) col.push(`y${py}=${at(320, py)}`);
  for (let px = 40; px < 640; px += 40) row.push(`x${px}=${at(px, 300)}`);
  return { col, row };
}, b64);
console.log("column x=320:\n  " + out.col.join("\n  "));
console.log("row y=300:\n  " + out.row.join("\n  "));
await browser.close();

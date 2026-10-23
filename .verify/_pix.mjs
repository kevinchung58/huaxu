/* Sample a frame's pixels: the measure behind "the plaza is one pale sheet".

   Round 65: the tool grew a second job. It used to know six fixed sample points for a 640x480
   frame and nothing else, so every question about any other frame -- a hotel tower's value, a
   signboard's, a gondola's -- had no instrument at all. Now the points come from the command
   line, so the same measure reads any frame:

     node .verify/_pix.mjs <frame.png> 'name:x,y name:x,y ...' [patchX,patchY,patchW,patchH]

   The patch (the spread of a rectangle) is what tells "a flat sheet" from "a surface with
   structure": its min/max is the structure, its mean is the tone.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_pix.mjs .preview/r65/funrow/stop6-yaw90-1024x768.png \
           'tower:270,120 sky:512,40 ground:512,700' 400,600,200,120
*/
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");

const file = process.argv[2];
const PTS = (process.argv[3] || "").trim();
const PATCH = (process.argv[4] || "").split(",").map(Number).filter((n) => Number.isFinite(n));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 640, height: 480 },
});
const page = await browser.newPage();
const b64 = fs.readFileSync(file).toString("base64");
const out = await page.evaluate(async (b64, pts, patch) => {
  const img = new Image();
  img.src = "data:image/png;base64," + b64;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const res = { size: [img.width, img.height] };
  const at = (px, py) => {
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) return null;
    const d = x.getImageData(px, py, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  // the named points the caller asked for; the old six are the default set for a 640x480 frame
  const list = pts.length ? pts : ["sky:320,40", "groundNear:320,440", "groundMid:160,340",
                                   "groundLeft:60,310", "groundRight:560,320", "farGround:200,250"];
  for (const item of list) {
    const i = item.indexOf(":");
    const name = item.slice(0, i), xy = item.slice(i + 1).split(",").map(Number);
    res[name] = at(xy[0], xy[1]);
  }
  // the spread of a rectangle: the structure of a surface, and its tone
  const p = patch.length === 4 ? patch : [220, 400, Math.min(200, img.width - 220), 60];
  const d = x.getImageData(p[0], p[1], p[2], p[3]).data;
  let min = 255, max = 0, sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
    min = Math.min(min, l); max = Math.max(max, l); sum += l; n++;
  }
  res.patch = { at: p, min: Math.round(min), max: Math.round(max), mean: Math.round(sum / n) };
  return res;
}, b64, PTS ? PTS.split(/\s+/).filter(Boolean) : [], PATCH);
console.log(JSON.stringify(out, null, 1));
await browser.close();

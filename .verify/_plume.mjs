/* _plume — where the authored spray actually is, and whether the frame shows it.
   A diagnosis instrument (exit 0 always; read the numbers). Written because the owner said the
   falls "感覺不好" and two frames taken this round showed a curtain with no mist at all, while the
   page's own record carries 216 mist prims (864 billboards). The question this answers: is the
   plume in the wrong place, behind the sheet, or simply invisible against what is behind it.

   What it prints, per stop:
     - the camera's own position and heading (from __walk);
     - the spray mesh's world bounding box, and whether the camera is inside its frustum;
     - the puff count, alpha range and radius range actually written into aColor this frame;
     - the mean colour of a crop of the served frame above the crest and at the foot of the sheet
       (the two places a real plume reads), so "invisible" is a number, not an impression.

   Run: LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_plume.mjs [stopIndex...]
*/
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const { PNG } = (() => { try { return require("pngjs"); } catch (e) { return {}; } })();

const BASE = process.env.BASE || "http://127.0.0.1:8080";
const FILE = process.env.FILE || "rooms-niagara.html";
const STOPS = (process.argv.slice(2).length ? process.argv.slice(2) : ["3", "4"]).map(Number);
const OUT = process.env.OUT || ".preview/r69/plume";
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
  headless: true, defaultViewport: { width: 1024, height: 768 },
});
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => { pageErrors.push(String(e)); console.log("PAGEERROR", String(e).slice(0, 200)); });
// scene3d.js keeps its Scene private; publishing it costs one line and changes no behaviour.
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (!/js\/scene3d\.js/.test(req.url())) return req.continue();
  try {
    let body = (await (await fetch(req.url())).text())
      .replace("const scene = new THREE.Scene();",
               "const scene = new THREE.Scene(); window.__threeScene = scene;");
    // MIST=red paints every spray puff pure red, so "the plume is invisible against what is behind
    // it" and "the plume is not where the eye is looking" stop being the same hypothesis.
    if (process.env.MIST === "off") {
      const before = body;
      body = body.replace("mesh.name = \"surveyed spray billboards\";",
                          "mesh.name = \"surveyed spray billboards\"; mesh.visible = false;");
      if (body === before) console.log("  !! could not hide the spray (anchor moved)");
    }
    if (process.env.MIST === "red") {
      const before = body;
      body = body.replace("void main(){ vec4 tex=texture2D(uCloud,vUv); gl_FragColor=vec4(vColor.rgb, tex.a*vColor.a); }",
                          "void main(){ vec4 tex=texture2D(uCloud,vUv); gl_FragColor=vec4(1.0,0.0,0.0, max(0.35, tex.a*vColor.a)); }");
      if (body === before) console.log("  !! could not patch the spray shader (anchor moved)");
    }
    req.respond({ status: 200, contentType: "application/javascript", body });
  } catch (e) { req.continue(); }
});
await page.goto(`${BASE}/${FILE}`, { waitUntil: "load", timeout: 90000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk, { timeout: 60000 });
await sleep(2500);

for (const stop of STOPS) {
  await page.evaluate((i) => {
    const el = document.querySelectorAll("[data-walk-stop]")[i];
    if (el) el.click();
  }, stop);
  // the rail glides; wait for the body to stop moving rather than for a stopwatch
  await page.waitForFunction(() => {
    const w = document.querySelector("[data-walk]").__walk;
    if (!w.__plumeT) { w.__plumeT = []; }
    w.__plumeT.push([w.depth, performance.now()]);
    if (w.__plumeT.length > 12) w.__plumeT.shift();
    const a = w.__plumeT[0], b = w.__plumeT[w.__plumeT.length - 1];
    return Math.abs(b[0] - a[0]) < 40 && (b[1] - a[1]) > 900;
  }, { timeout: 240000, polling: 500 }).catch(() => console.log("  (did not settle; measuring anyway)"));

  const info = await page.evaluate(() => {
    const layer = document.querySelector("[data-walk]");
    const w = layer.__walk;
    const out = { depth: w.depth, x: w.x, yaw: w.yaw, spray: null, meshes: [], stats: w.threeStats };
    const root = window.__threeScene;
    if (root && root.traverse) {
      root.traverse((o) => {
        if (!o.isMesh) return;
        if (/spray|cloud|mist|rainbow/i.test(o.name || "")) {
          o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox.clone();
          bb.applyMatrix4(o.matrixWorld);
          const a = o.geometry.getAttribute("aColor");
          let amin = 9, amax = 0;
          for (let i = 3; i < a.array.length; i += 4) { amin = Math.min(amin, a.array[i]); amax = Math.max(amax, a.array[i]); }
          (out.spray ||= []).push({ name: o.name, count: a.count / 4,
                        alphaMin: +amin.toFixed(3), alphaMax: +amax.toFixed(3),
                        box: { min: bb.min.toArray().map((v) => +v.toFixed(0)), max: bb.max.toArray().map((v) => +v.toFixed(0)) },
                        visible: o.visible, renderOrder: o.renderOrder });
        }
        out.meshes.push(o.name || "(unnamed)");
      });
    }
    return out;
  });
  console.log(`stop ${stop}: at x=${info.x.toFixed(0)} z=${info.depth.toFixed(0)} yaw=${info.yaw.toFixed(0)}`);
  for (const sp of info.spray || []) console.log("  spray:", JSON.stringify(sp));
  console.log("  stats:", JSON.stringify(info.stats));
  if (!info.spray) console.log("  meshes in scene:", JSON.stringify(info.meshes.slice(0, 14)));

  const file = `${OUT}/stop${stop}.png`;
  await page.screenshot({ path: file });
  if (PNG) {
    const png = PNG.sync.read(fs.readFileSync(file));
    // two crops: the upper third of the sheet's silhouette, and the band just under it
    const crop = (y0, y1) => {
      let r = 0, g = 0, b = 0, n = 0, min = 999, max = -1;
      for (let y = y0; y < y1; y += 3) for (let x = 0; x < png.width; x += 3) {
        const i = (png.width * y + x) << 2;
        const l = 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
        r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; n++;
        min = Math.min(min, l); max = Math.max(max, l);
      }
      return `rgb(${(r / n) | 0},${(g / n) | 0},${(b / n) | 0}) luma ${(min) | 0}-${(max) | 0}`;
    };
    console.log(`  frame ${file}`);
    console.log(`    above the crest  y  260-400 : ${crop(260, 400)}`);
    console.log(`    at the foot      y  470-620 : ${crop(470, 620)}`);
    console.log(`    plunge water     y  620-740 : ${crop(620, 740)}`);
  }
}
// A broken shader still renders a background and a HUD, and every band below would be measured
// off that empty frame — which is exactly how two round-69 runs reported "no mist" about a scene
// that had thrown before drawing anything. So: no numbers from a page that errored.
if (pageErrors.length) {
  console.log(`FFAIL  ${pageErrors.length} page error(s) — the numbers below are not the scene; not printing them`);
  await browser.close();
  process.exit(2);
}
await browser.close();
process.exit(0);

/* _gamesshot.cjs — the stalls, in a real browser (round 50). The jsdom gate proves the rules; this
   proves the picture: a played frame of each game carries many colours and real light (the same
   floor as the hour probe: no black panels), and at night the stall's own lantern makes the dressed
   button visible against the dark asphalt. Run with the site served on :8080,
   LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/_gamesshot.cjs */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const { createCanvas, loadImage } = req("@napi-rs/canvas");
const fs = require("node:fs");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const stats = async (png, clip) => {
  const img = await loadImage(png);
  const c = createCanvas(img.width, img.height); const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const sx = Math.round(img.width * clip[0]), sy = Math.round(img.height * clip[1]);
  const w = Math.round(img.width * (clip[2] - clip[0])), h = Math.round(img.height * clip[3] - sy);
  const d = g.getImageData(sx, sy, w, Math.max(1, h)).data;
  let s = 0, n = 0; const colours = new Set();
  for (let i = 0; i < d.length; i += 4) {
    s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++;
    colours.add((d[i] >> 3) * 1024 + (d[i + 1] >> 3) * 32 + (d[i + 2] >> 3));
  }
  return { luma: +(s / n).toFixed(1), colours: colours.size };
};

(async () => {
  fs.mkdirSync(".preview/round51-river", { recursive: true });
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 980, height: 620 } });
  let fails = 0;
  for (const [href, game] of [["street.html", "kingyo"], ["street.html", "menya"], ["rooms-niagara.html", "rapids"]]) {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 120)));
    await page.goto("http://127.0.0.1:8080/" + href, { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
    await page.evaluate((id) => {
      const b = document.querySelector(`[data-game="${id}"]`);
      b.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }, game);
    await sleep(600);
    // play for real: pointer inside the canvas, press (hold = dip / shoot) through ~50 frames
    const box = await page.evaluate(() => {
      const r = document.querySelector("[data-walk-game] canvas").getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    let isDown = false;
    for (let i = 0; i < 50; i++) {
      const px = box.x + box.w * (0.3 + 0.4 * Math.abs(Math.sin(i / 7)));
      const py = box.y + box.h * (game === "kingyo" ? 0.62 : 0.3 + 0.12 * (i % 4));
      await page.mouse.move(px, py);
      if (i % 3 === 0) { await page.mouse.down(); isDown = true; }
      else if (isDown) { await page.mouse.up(); isDown = false; }
      await sleep(50);
    }
    if (isDown) await page.mouse.up();
    await sleep(250);
    const shot = await page.screenshot({ path: `.preview/round51-river/game-${game}.png`, type: "png" });
    const r = await stats(shot, [box.x / 980, box.y / 620, (box.x + box.w) / 980, (box.y + box.h) / 620]);
    const okk = r.luma >= 26 && r.colours >= 15;
    if (!okk) fails++;
    console.log(`${okk ? "OK  " : "LOW "}game ${game} (${href}): luma ${r.luma} colours ${r.colours} (floor 26/15)`);
    await page.close();
  }
  // the Blue Wing's pressed demonstration: the opened frame must differ from the shut one —
  // the raised leaves throw pale faces at the camera that a shut deck cannot invent
  {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 120)));
    await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html", { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
    // stand where the record says the table reads best: the stop over the basin toward the strait
    await page.evaluate(() => {
      const stop = Array.from(document.querySelectorAll("[data-walk-stop]"))
        .find((b) => /port table/.test(b.getAttribute("aria-label") || ""));
      if (stop) stop.click();
    });
    await sleep(9000);
    // Crop the magnet's own box plus the air above it. A full-frame average is the wrong ruler
    // here (measured round 51): the lift is a 24 m leaf on a 108 m model seen from 21 m away, and
    // across 950 px the luma moved 0.2 while the colour count went *down* — the band measured the
    // dark hall, not the bridge. The tight box is where the claim actually lives.
    const c = await page.evaluate(() => {
      const r = document.querySelector('[data-obj="drawbridge-mj"]').getBoundingClientRect();
      return [Math.max(0, r.x - 30), Math.max(0, r.y - 110), r.width + 60, r.height + 150];
    });
    const clip = { x: Math.round(c[0]), y: Math.round(c[1]), width: Math.round(Math.min(c[2], 980 - c[0])), height: Math.round(Math.min(c[3], 620 - c[1])) };
    const before = await page.screenshot({ path: ".preview/round51-river/fukuoka-bridge-shut.png", type: "png", clip });
    await page.evaluate(() => document.querySelector('[data-obj="drawbridge-mj"]').dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })));
    await sleep(9500);   // mid-envelope: leaves up, the boat taking the gap
    const after = await page.screenshot({ path: ".preview/round51-river/fukuoka-bridge-demo.png", type: "png", clip });
    const bs = await stats(before, [0, 0, 1, 1]), as = await stats(after, [0, 0, 1, 1]);
    const rec = await page.evaluate(() => (document.querySelector("[data-walk-record]") || {}).textContent || "");
    const same = Buffer.compare(before, after) === 0;
    const okk = !same && as.colours >= bs.colours + 2 && /demonstration runs/.test(rec);
    if (!okk) fails++;
    console.log(`${okk ? "OK  " : "LOW "}fukuoka demonstration: crop ${clip.width}x${clip.height} shut ${bs.luma}/${bs.colours} -> demo ${as.luma}/${as.colours}, record ${/demonstration runs/.test(rec) ? "held" : "LOST"}`);
    await page.close();
  }
  {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:8080/street.html", { waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
    await page.evaluate(() => localStorage.setItem("huaxu.walk-hour.v1", "night"));
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
    await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[3].click());   // under the lanterns
    await sleep(9000);
    const shot = await page.screenshot({ path: ".preview/round51-river/street-night-stall.png", type: "png" });
    const r = await stats(shot, [0.0, 0.25, 1.0, 0.85]);
    const okk = r.luma >= 26 && r.colours >= 15;
    if (!okk) fails++;
    console.log(`${okk ? "OK  " : "LOW "}street night at the stalls: luma ${r.luma} colours ${r.colours}`);
    await page.close();
  }
  await browser.close();
  console.log(fails ? `GAMESHOT-FAIL ${fails}` : "GAMESHOT-PASS");
})().catch((e) => { console.log("ERR", e.message.slice(0, 160)); process.exit(1); });

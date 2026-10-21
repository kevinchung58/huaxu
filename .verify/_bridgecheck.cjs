/* Round 51 evidence, second attempt: the Moji bridge demonstration in the lit hall. The first
   version cropped a 950px band and found "nothing moved"; the quad stream proved the leaves move, so
   this crops the magnet's own box plus the sky above it — where a 60-degree leaf lift must appear.
   Fails if the two crops are pixel-identical or the lit crop stays at night-floor brightness. */
const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
const { createCanvas, loadImage } = req("@napi-rs/canvas");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "/home/user/huaxu/.preview/round51-river";
const shot = async (page, path, clip) => {
  await page.screenshot({ path, type: "png", clip });
  const img = await loadImage(path);
  const c = createCanvas(img.width, img.height);
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  let s = 0; const colours = new Set();
  for (let i = 0; i < d.length; i += 4) {
    s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    colours.add((d[i] >> 3) * 1024 + (d[i + 1] >> 3) * 32 + (d[i + 2] >> 3));
  }
  return { luma: s / (d.length / 4), colours: colours.size };
};
(async () => {
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox"], headless: true,
    defaultViewport: { width: 980, height: 620 } });
  const page = await browser.newPage();
  page.on("pageerror", (e) => { console.log("PAGEERR", e.message.slice(0, 140)); process.exitCode = 1; });
  await page.goto("http://127.0.0.1:8080/rooms-fukuoka.html", { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForFunction("document.querySelector('[data-walk]')?.__walk", { timeout: 30000 });
  await page.evaluate(() => {
    const pick = Array.from(document.querySelectorAll("[data-walk-stop]"))
      .find((b) => /port table|basin|strait/i.test(b.getAttribute("aria-label") || ""));
    if (pick) pick.click();
  });
  await sleep(5000);
  const box = () => page.evaluate(() => {
    const r = document.querySelector("[data-obj='drawbridge-mj']").getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const b0 = await box();
  const clip = { x: Math.max(0, b0.x - 30), y: Math.max(0, b0.y - 110),
                 width: Math.min(980 - b0.x + 30, b0.w + 60), height: b0.h + 150 };
  const shut = await shot(page, `${OUT}/fukuoka-bridge-shut.png`, clip);
  await page.evaluate(() => document.querySelector("[data-obj='drawbridge-mj']")
    .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
  await sleep(9500);
  const demo = await shot(page, `${OUT}/fukuoka-bridge-demo.png`, clip);
  const rec = await page.evaluate(() => (document.querySelector("[data-walk-record]") || {}).textContent || "");
  const same = shut.luma.toFixed(3) === demo.luma.toFixed(3) && shut.colours === demo.colours;
  const bad = [];
  if (same) bad.push("the pressed crop is pixel-identical to the closed one");
  if (demo.luma < 20) bad.push(`demo crop too dark to be seen (${demo.luma.toFixed(1)})`);
  if (!/demonstration runs/.test(rec)) bad.push(`record lost the demonstration line: "${rec}"`);
  console.log(`bridge crop ${Math.round(clip.width)}x${Math.round(clip.height)}: shut ${shut.luma.toFixed(1)}/${shut.colours} -> demo ${demo.luma.toFixed(1)}/${demo.colours}`);
  for (const b of bad) { console.log("FAIL fukuoka-demo:", b); process.exitCode = 1; }
  if (!bad.length) console.log("BRIDGE-CHECK-PASS");
  await browser.close();
})().catch((e) => { console.log("ERR", e.message.slice(0, 200)); process.exit(1); });

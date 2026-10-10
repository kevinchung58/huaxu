/* Mean luma of the served pages at the moments that matter: the street at noon and at night, and
   rooms.html (no day flag) as the no-regression witness. */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const { createCanvas, loadImage } = await import("@napi-rs/canvas");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: true,
  args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 640 });
const stats = async (label) => {
  const img = await loadImage(await page.screenshot({ type: "png" }));
  const c = createCanvas(img.width, img.height); const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  let s = 0, n = img.width * img.height, blown = 0;
  for (let i = 0; i < d.length; i += 4) {
    s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    if (d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250) blown++;
  }
  console.log(`${label}: luma ${(s / n).toFixed(1)}  near-white ${(100 * blown / n).toFixed(2)}%`);
};
const intercept = (start) => {
  page.removeAllListeners("request");
  if (start === null) { page.setRequestInterception(false); return; }
  page.setRequestInterception(true);
  page.on("request", async (req) => {
    if (!req.url().endsWith("street.html")) return req.continue();
    const res = await fetch(req.url());
    const body = (await res.text()).replace('data-lane-day-start="0.45"', `data-lane-day-start="${start}"`);
    req.respond({ status: 200, contentType: "text/html", body });
  });
};
await intercept(null);
await page.goto("http://localhost:8080/street.html", { waitUntil: "load" });
await new Promise((r) => setTimeout(r, 2500));
await stats("street noon");
await intercept("0.98");
await page.goto("http://localhost:8080/street.html", { waitUntil: "load" });
await new Promise((r) => setTimeout(r, 2500));
await stats("street night");
await intercept(null);
await page.goto("http://localhost:8080/rooms.html", { waitUntil: "load" });
await new Promise((r) => setTimeout(r, 2500));
await stats("rooms (no day flag)");
await browser.close();

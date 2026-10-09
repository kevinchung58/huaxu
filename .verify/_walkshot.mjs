/* One walk, one screenshot:  node .verify/_walkshot.mjs <out-name> <walk-seconds> [day-start]
   Intercepts the served HTML only when a day-start override is asked for. */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "node:fs";
const [name, walkS, start] = [process.argv[2], Number(process.argv[3] || 0), process.argv[4]];
fs.mkdirSync(".preview/day", { recursive: true });
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: true,
  args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 200)));
await page.setViewport({ width: 1024, height: 560 });
if (start) {
  await page.setRequestInterception(true);
  page.on("request", async (req) => {
    if (!req.url().endsWith("street.html")) return req.continue();
    const res = await fetch(req.url());
    const body = (await res.text()).replace('data-lane-day-start="0.45"', `data-lane-day-start="${start}"`);
    req.respond({ status: 200, contentType: "text/html", body });
  });
}
await page.goto("http://localhost:8080/street.html", { waitUntil: "load", timeout: 45000 });
await new Promise((r) => setTimeout(r, 1500));
if (walkS > 0) {
  await page.keyboard.down("w");
  await new Promise((r) => setTimeout(r, walkS * 1000));
  await page.keyboard.up("w");
  await new Promise((r) => setTimeout(r, 500));
}
const yaw = Number(process.argv[5] || 0);
if (yaw) {
  await page.mouse.move(512, 300);
  await page.mouse.down();
  await page.mouse.move(512 + yaw, 300, { steps: 8 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 400));
}
await page.screenshot({ path: `.preview/day/${name}.png` });
console.log("shot", name);
await browser.close();

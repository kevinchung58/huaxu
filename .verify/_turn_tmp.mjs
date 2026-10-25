import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 } });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8080/rooms.html", { waitUntil: "networkidle0", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("[data-walk]")?.__walk?.renderer, { timeout: 30000 });
const read = () => page.evaluate(() => { const w = document.querySelector("[data-walk]").__walk; return [w.yaw, w.pitch]; });
console.log("start", await read());
await page.evaluate(() => document.querySelectorAll("[data-walk-stop]")[5].click());
await sleep(5000);
console.log("after stop", await read());
await page.evaluate(() => document.querySelector("[data-walk-view]").focus());
await page.keyboard.down("ArrowRight");
await sleep(150);
await page.keyboard.up("ArrowRight");
for (let i = 0; i < 10; i++) { await sleep(200); console.log("  t+" + (i + 1) * 200, JSON.stringify(await read())); }
await browser.close();

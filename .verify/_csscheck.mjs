/* Does the stylesheet still parse? A dropped rule can leave a dangling selector, and a browser
   does not complain about that — it just swallows the next rule. Count what the browser made. */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default || require("@sparticuz/chromium");
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox"], headless: true, defaultViewport: { width: 1024, height: 768 } });
const page = await browser.newPage();
const bad = [];
page.on("pageerror", (e) => bad.push("pageerror: " + e.message));
await page.goto("http://127.0.0.1:8080/street.html", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
const out = await page.evaluate(() => {
  const sheet = [...document.styleSheets].find((s) => (s.href || "").includes("site.css"));
  const rules = [...sheet.cssRules];
  const flat = [];
  const walk = (list) => { for (const r of list) { flat.push(r.selectorText || r.cssText.slice(0, 40)); if (r.cssRules) walk(r.cssRules); } };
  walk(rules);
  return {
    top: rules.length, total: flat.length,
    authors: !!sheet.cssRules && [...sheet.cssSheets ? [] : []].length,
    hasAuthors: flat.some((s) => s && s.includes(".authors")),
    hasTitleBtn: flat.some((s) => s && s.includes(".title-btn")),
    hasWallTile: flat.some((s) => s && s.includes(".ig-tile")),
    hasHidden: flat.some((s) => s && s.includes(".walk-tutor-act[hidden]")),
    bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 40),
  };
});
console.log(JSON.stringify(out, null, 1), "pageerrors:", bad.length ? bad : "none");
await browser.close();

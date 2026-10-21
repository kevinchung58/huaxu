const { createRequire } = require("module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium0 = req("@sparticuz/chromium");
const chromium = chromium0.default || chromium0;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox", "--allow-file-access-from-files"],
    headless: true, defaultViewport: { width: 1024, height: 700 },
  });
  const p = await b.newPage();
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await p.goto("http://127.0.0.1:8080/rooms.html", { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1500);
  await p.screenshot({ path: ".preview/round47-guide/guide-1.png" });
  await p.keyboard.down("ArrowRight"); await sleep(650); await p.keyboard.up("ArrowRight");
  await sleep(500);
  await p.screenshot({ path: ".preview/round47-guide/guide-2.png" });
  await p.keyboard.down("w"); await sleep(1700); await p.keyboard.up("w"); await sleep(500);
  await p.screenshot({ path: ".preview/round47-guide/guide-3.png" });
  const st = async () => p.evaluate(() => ({ n: document.querySelector("[data-walk-tutor-count]").textContent, h: document.querySelector("[data-walk-tutor]").hidden }));
  console.log("after-walk", JSON.stringify(await st()));
  await p.evaluate(() => {
    const s = [...document.querySelectorAll("[data-walk-stop]")];
    const t = s.reduce((best, el) => Math.abs(parseFloat(el.style.getPropertyValue("--z")) - 1392) < Math.abs(parseFloat(best.style.getPropertyValue("--z")) - 1392) ? el : best, s[0]);
    t.click();
  });
  await p.waitForFunction(() => Math.abs(document.querySelector("[data-walk]").__walk.depth - 1392) < 3, { timeout: 40000, polling: 250 }).catch(() => console.log("settle-timeout"));
  await p.keyboard.down("d"); await p.keyboard.down("Shift"); await sleep(4200); await p.keyboard.up("Shift"); await p.keyboard.up("d");
  await p.keyboard.down("ArrowRight"); await sleep(250); await p.keyboard.up("ArrowRight");
  await p.keyboard.down("w"); await sleep(950); await p.keyboard.up("w"); await sleep(400);
  console.log("body", JSON.stringify(await p.evaluate(() => { const b = document.querySelector("[data-walk]").__walk; return { x: b.x.toFixed(0), d: b.depth.toFixed(0), yaw: b.yaw.toFixed(0), reach: document.querySelectorAll(".walk-hit.is-reach").length, status: document.querySelector("[data-walk-status]").textContent.trim() }; })));
  await p.keyboard.press("e"); await sleep(700);
  await p.screenshot({ path: ".preview/round47-guide/guide-4.png" });
  console.log("after-E", JSON.stringify(await st()));
  const opened = await p.evaluate(() => !document.querySelector("[data-walk-card]").hidden);
  if (opened) await p.evaluate(() => document.querySelector("[data-walk-tutor-done]").click());
  await sleep(400);
  await p.screenshot({ path: ".preview/round47-guide/guide-5-after-done.png" });
  console.log("final", JSON.stringify(await p.evaluate(() => ({ h: document.querySelector("[data-walk-tutor]").hidden, flag: localStorage.getItem("huaxu.walk-guide.v1") }))));
  await b.close();
  console.log("GUIDESHOT-DONE");
})().catch(e => { console.error(e.message); process.exit(1); });

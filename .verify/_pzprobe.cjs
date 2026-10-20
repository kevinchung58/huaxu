const { createRequire } = require("node:module");
const req = createRequire("/home/user/huaxu/package.json");
const puppeteer = req("puppeteer-core");
const chromium = req("@sparticuz/chromium").default || req("@sparticuz/chromium");
(async () => {
  const b = await puppeteer.launch({ executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    headless: true, defaultViewport: { width: 980, height: 620 } });
  for (const page of ["rooms-niagara.html", "street.html", "rooms-fukuoka.html"]) {
    const p = await b.newPage();
    p.on("pageerror", (e) => console.log(`${page} PAGEERROR:`, (e.stack || e.message).split("\n").slice(0, 5).join(" | ")));
    await p.goto(`http://127.0.0.1:8080/${page}`, { waitUntil: "load", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 4000));
    console.log(page, "renderer:", await p.evaluate(() => document.querySelector("[data-walk]").dataset.walkRenderer || "n/a"));
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });

import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/usr/bin/chrome", headless: "new",
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.stack || e.message));
p.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 200)); });
await p.goto("http://127.0.0.1:8080/rooms-niagara.html", { waitUntil: "load", timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));
// force the 2D fallback the same way collision does, if it exposes a switch
console.log("threeMode:", await p.evaluate(() => document.querySelector("[data-walk]").dataset.walkRenderer || "n/a"));
await b.close();

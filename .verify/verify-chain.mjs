/* verify-chain.mjs — every open room boots, its onward and back doors both leave,
   and the chain (Canada → Tokyo → Fukuoka) is traversable forward from the album
   and backward by Esc/HUD exit. jsdom has no real navigation; an attempted
   location change is captured as a jsdom "Not implemented: navigation" error,
   exactly as verify-walk.mjs does for the Tokyo lane.

   Run: node .verify/verify-chain.mjs
*/
import fs from "node:fs";

const css = fs.readFileSync("css/site.css", "utf8");
const js  = fs.readFileSync("js/site.js", "utf8");

// Lightweight recorder ctx — we don't assert paint here, just boot + navigation.
function makeCtx() {
  return {
    canvas: { width: 1024, height: 768 },
    fillStyle: "", strokeStyle: "", lineWidth: 1, globalCompositeOperation: "source-over",
    save(){}, restore(){}, beginPath(){}, closePath(){}, moveTo(){}, lineTo(){}, arc(){}, ellipse(){},
    rect(){}, fillRect(){}, strokeRect(){}, translate(){}, scale(){}, rotate(){}, clip(){},
    fill(){}, stroke(){}, drawImage(){}, setTransform(){}, transform(){},
    createPattern: () => ({ addColorStop(){} }),
    createRadialGradient: () => ({ addColorStop(){} }),
    createLinearGradient: () => ({ addColorStop(){} }),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [], fails = [];
const ok = (name, cond, extra = "") => {
  out.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
  if (!cond) fails.push(name);
};

function bootRoom(file) {
  return new Promise((resolve) => {
    import("jsdom").then(({ JSDOM, VirtualConsole }) => {
      const navs = [];
      const errors = [];
      const vc = new VirtualConsole();
      vc.on("jsdomError", (e) => {
        const msg = String((e && e.message) || e);
        if (/navigation/.test(msg)) navs.push(msg);
        else errors.push(msg);
      });
      vc.on("error", (...a) => errors.push(a.map(String).join(" ")));
      let html = fs.readFileSync(file, "utf8");
      html = html.replace(/<script[^>]*src=[^>]*><\/script>/g, "");
      const dom = new JSDOM(html, {
        runScripts: "dangerously",
        pretendToBeVisual: true,
        url: "https://huaxu.test/" + file,
        virtualConsole: vc,
      });
      const w = dom.window;
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.HTMLElement.prototype.setPointerCapture = () => {};
      w.HTMLElement.prototype.hasPointerCapture = () => false;
      w.HTMLElement.prototype.releasePointerCapture = () => {};
      w.matchMedia = (q) => ({ matches: /hover: hover/.test(q), media: q, addEventListener(){}, addListener(){}, removeEventListener(){} });
      w.IntersectionObserver = class { constructor(cb){this.cb=cb;} observe(el){this.cb([{target:el,isIntersecting:true,intersectionRatio:1}],this);} unobserve(){} disconnect(){} };
      w.PointerEvent = w.MouseEvent;
      w.Element.prototype.animate = () => ({ cancel(){}, finished: Promise.resolve() });
      w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
      w.HTMLCanvasElement.prototype.getContext = function(){ return this.__c || (this.__c = makeCtx()); };
      w.Image = class {
        constructor(){ this.naturalWidth = 640; this.naturalHeight = 427; }
        set src(v){ this._s = v; setTimeout(() => { if (this.onload) this.onload(); }, 5); }
        get src(){ return this._s; }
        get complete(){ return !!this._s; }
      };
      w.eval(js);
      setTimeout(() => resolve({ w, dom, doc: w.document, navs, errors }), 120);
    });
  });
}

const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));

const ROOMS = [
  { file: "rooms-canada.html", id: "canada",  backObj: "door-back",    onwardObj: "way-on" },
  { file: "rooms.html",      id: "tokyo",   backObj: "noren",        onwardObj: "way-on" },
  { file: "rooms-fukuoka.html", id: "fukuoka", backObj: "curtain-back", onwardObj: null    },
];

async function main() {
  ok("css and js exist on disk", fs.existsSync("css/site.css") && fs.existsSync("js/site.js"));

  for (const r of ROOMS) {
    out.push(`\n-- ${r.id} (${r.file}) --`);
    const { w, doc, navs, errors } = await bootRoom(r.file);
    ok(`${r.id}: boots without console errors`, errors.length === 0, errors.slice(0,2).join(" | "));

    const hud = doc.querySelector("[data-walk-exit]");
    ok(`${r.id}: HUD exit button exists and has an href`, !!hud && /\.html$/.test(hud?.getAttribute("href") || ""),
       hud ? hud.getAttribute("href") : "missing");

    const back = doc.querySelector(`[data-obj="${r.backObj}"]`);
    ok(`${r.id}: back prop "${r.backObj}" exists and has data-leave`,
       !!back && /\.html$/.test(back?.dataset.leave || ""),
       back ? back.dataset.leave : "missing");

    if (hud && back) {
      ok(`${r.id}: HUD exit href matches back curtain leave`,
         hud.getAttribute("href") === back.dataset.leave,
         `${hud.getAttribute("href")} vs ${back.dataset.leave}`);
    }

    if (r.onwardObj) {
      const onward = doc.querySelector(`[data-obj="${r.onwardObj}"]`);
      ok(`${r.id}: onward door "${r.onwardObj}" exists with data-leave`,
         !!onward && /\.html$/.test(onward?.dataset.leave || ""),
         onward ? onward.dataset.leave : "missing");
      if (onward) {
        navs.length = 0;
        click(w, onward);
        await sleep(80);
        ok(`${r.id}: clicking onward door navigates`, navs.length === 1, JSON.stringify(navs.slice(-1)));
      }
    } else {
      ok(`${r.id}: last room has NO onward door (chain ends)`,
         !doc.querySelector('[data-obj="way-on"]'),
         "dead-end is correct");
    }

    // Click back curtain
    if (back) {
      navs.length = 0;
      click(w, back);
      await sleep(80);
      ok(`${r.id}: clicking back curtain navigates`, navs.length === 1, JSON.stringify(navs.slice(-1)));
    }

    // HUD exit click
    if (hud) {
      // Reset by re-booting cleanly to avoid dirty state after curtain click
      const fresh = await bootRoom(r.file);
      fresh.navs.length = 0;
      click(fresh.w, fresh.doc.querySelector("[data-walk-exit]"));
      await sleep(80);
      ok(`${r.id}: clicking HUD exit navigates`, fresh.navs.length === 1, JSON.stringify(fresh.navs.slice(-1)));
    }

    w.close();
  }

  // Album: every field-notes plate has a door link into its room
  out.push("\n-- activities album --");
  const act = fs.readFileSync("activities.html", "utf8");
  // Count how many ig-room links exist per room
  const rooms = { canada: 0, tokyo: 0, fukuoka: 0 };
  const m = act.match(/<div class="ig-cell"[\s\S]*?<\/div>/g) || [];
  let doors = 0;
  for (const cell of m) {
    const door = cell.match(/class="ig-room"[^>]*href="([^"]+)"/);
    if (!door) continue;
    doors++;
    const href = door[1];
    if (href.includes("canada")) rooms.canada++;
    else if (href === "rooms.html") rooms.tokyo++;
    else if (href.includes("fukuoka")) rooms.fukuoka++;
  }
  ok(`album offers a door under every built room's plates`, doors === 15, `doors=${doors}`);
  ok(`album has 4 Canada doors (3 plates + cover)`, rooms.canada === 4, `${rooms.canada}`);
  ok(`album has 7 Tokyo doors`, rooms.tokyo === 7, `${rooms.tokyo}`);
  ok(`album has 4 Fukuoka doors`, rooms.fukuoka === 4, `${rooms.fukuoka}`);

  // Nav "Rooms" points to CHAIN_ENTRY (rooms-canada.html). Only check nav links, not album doors.
  out.push("\n-- site nav --");
  for (const page of ["index.html", "about.html", "research.html", "activities.html", "service.html", "links.html", "teaching.html"]) {
    const html = fs.readFileSync(page, "utf8");
    // The primary <nav> is the first nav on the page; pull the href from the link whose text is "Rooms"
    const navBlock = html.match(/<nav class="nav-links"[\s\S]*?<\/nav>/);
    let roomsHref = null;
    if (navBlock) {
      const m = navBlock[0].match(/<a[^>]*href="([^"]+)"[^>]*>\s*Rooms\s*<\/a>/);
      if (m) roomsHref = m[1];
    }
    ok(`${page}: "Rooms" nav points to the near end of the chain (rooms-canada.html)`,
       roomsHref === "rooms-canada.html", roomsHref || "missing");
  }

  console.log(out.join("\n"));
  console.log(`\n${fails.length} failure(s)` + (fails.length ? "  " + fails.join(", ") : ""));
  process.exit(fails.length ? 1 : 0);
}

main();

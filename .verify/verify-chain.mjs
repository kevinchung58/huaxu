/* verify-chain.mjs — the hub door graph. The street is the hub and the three
   rooms hang off it, so every open room must leave for the street and only the
   street (its back curtain, its HUD exit, Esc — same target, three controls),
   and the street must carry exactly one door per room plus its own door to the
   album. Nothing may still wire the old linear chain: no room has an onward
   door, and the site nav's "Rooms" points at the street, not at Canada.
   jsdom has no real navigation; an attempted location change is captured as a
   jsdom "Not implemented: navigation" error, exactly as verify-walk.mjs does.

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

const STREET = "street.html";
const ROOMS = [
  { file: "rooms-canada.html",   id: "canada",  backObj: "door-back" },
  { file: "rooms.html",          id: "tokyo",   backObj: "noren" },
  { file: "rooms-fukuoka.html",  id: "fukuoka", backObj: "curtain-back" },
];
const STREET_DOORS = [
  { obj: "door-canada",   expect: "rooms-canada.html" },
  { obj: "door-tokyo",    expect: "rooms.html" },
  { obj: "door-fukuoka",  expect: "rooms-fukuoka.html" },
];

async function main() {
  ok("css and js exist on disk", fs.existsSync("css/site.css") && fs.existsSync("js/site.js"));
  ok("the street page exists", fs.existsSync(STREET));

  /* ---- the street: one door per room, and its own door to the album ---- */
  out.push(`\n-- street (${STREET}) --`);
  {
    const { w, doc, navs, errors } = await bootRoom(STREET);
    ok("street: boots without console errors", errors.length === 0, errors.slice(0, 2).join(" | "));

    const hud = doc.querySelector("[data-walk-exit]");
    ok("street: HUD exit button exists and has an href", !!hud && /\.html$/.test(hud?.getAttribute("href") || ""),
       hud ? hud.getAttribute("href") : "missing");

    const back = doc.querySelector('[data-obj="door-back"]');
    ok("street: back door exists and leaves for the album",
       !!back && back.dataset.leave === "activities.html", back?.dataset.leave || "missing");

    if (hud && back) {
      ok("street: HUD exit href matches the back door leave",
         hud.getAttribute("href") === back.dataset.leave,
         `${hud.getAttribute("href")} vs ${back.dataset.leave}`);
    }

    for (const d of STREET_DOORS) {
      const door = doc.querySelector(`[data-obj="${d.obj}"]`);
      ok(`street: ${d.obj} exists and leaves for ${d.expect}`,
         !!door && door.dataset.leave === d.expect, door?.dataset.leave || "missing");
      if (door) {
        navs.length = 0;
        click(w, door);
        await sleep(80);
        ok(`street: clicking ${d.obj} navigates to ${d.expect}`, navs.length === 1,
           JSON.stringify(navs.slice(-1)));
      }
    }

    ok("street: no onward door on the street (the chain is retired)",
       !doc.querySelector('[data-obj="way-on"]'), "hub is correct");
    w.close();
  }

  /* ---- every room: all three exits land on the street, and nothing else ---- */
  for (const r of ROOMS) {
    out.push(`\n-- ${r.id} (${r.file}) --`);
    const { w, doc, navs, errors } = await bootRoom(r.file);
    ok(`${r.id}: boots without console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));

    const hud = doc.querySelector("[data-walk-exit]");
    ok(`${r.id}: HUD exit button exists and has an href`, !!hud && /\.html$/.test(hud?.getAttribute("href") || ""),
       hud ? hud.getAttribute("href") : "missing");

    const back = doc.querySelector(`[data-obj="${r.backObj}"]`);
    ok(`${r.id}: back prop "${r.backObj}" exists and leaves for the street`,
       !!back && back.dataset.leave === STREET, back?.dataset.leave || "missing");

    if (hud && back) {
      ok(`${r.id}: HUD exit href matches back curtain leave`,
         hud.getAttribute("href") === back.dataset.leave,
         `${hud.getAttribute("href")} vs ${back.dataset.leave}`);
    }

    ok(`${r.id}: no onward door (the hub carries the doors)`,
       !doc.querySelector('[data-obj="way-on"]'), "hub is correct");

    // Every leave on the page must be the street: one wrong target breaks the
    // "walk out of any room, you are on the street" guarantee.
    const leaves = [...doc.querySelectorAll("[data-leave]")].map((e) => e.dataset.leave);
    ok(`${r.id}: every leave on the page is the street`,
       leaves.length > 0 && leaves.every((t) => t === STREET), [...new Set(leaves)].join(", "));

    if (back) {
      navs.length = 0;
      click(w, back);
      await sleep(80);
      ok(`${r.id}: clicking back curtain navigates`, navs.length === 1, JSON.stringify(navs.slice(-1)));
    }

    if (hud) {
      const fresh = await bootRoom(r.file);
      fresh.navs.length = 0;
      click(fresh.w, fresh.doc.querySelector("[data-walk-exit]"));
      await sleep(80);
      ok(`${r.id}: clicking HUD exit navigates`, fresh.navs.length === 1, JSON.stringify(fresh.navs.slice(-1)));
      fresh.w.close();
    }

    w.close();
  }

  // Album: every field-notes plate has a door link into its room, and the block
  // door under the heading opens the street.
  out.push("\n-- activities album --");
  const act = fs.readFileSync("activities.html", "utf8");
  /* The Field notes wall is three places, one door each; the plates under a place are that place's
     sub-areas, and no plate carries a door of its own. */
  const WANT = { canada: ["rooms-canada.html", 4], tokyo: ["rooms.html", 7],
                 fukuoka: ["rooms-fukuoka.html", 4] };
  for (const [id, [page, count]] of Object.entries(WANT)) {
    const at = act.indexOf(`data-place-group="${id}"`);
    ok(`album: the ${id} place group exists`, at >= 0);
    if (at < 0) continue;
    const next = Math.min(...Object.keys(WANT).map((k) => act.indexOf(`data-place-group="${k}"`))
      .filter((p) => p > at).concat([act.length]));
    const seg = act.slice(at, next);
    // The last group's tail runs into the classroom block, so count this place's own prefixes only.
    const tiles = [...new Set(Array.from(seg.matchAll(/<img src="IMG\/([A-Za-z0-9._-]+)"/g))
      .map((m) => m[1]))].filter((n) => n.startsWith(`${id}-`));
    ok(`album: ${id} group holds ${count} plates`, tiles.length === count, `${tiles.length}`);
    const door = seg.match(/class="text-arrow" href="([^"]+)"/);
    ok(`album: ${id} group's door is ${page}`, !!door && door[1] === page,
       door ? door[1] : "missing");
  }
  ok("album: plates carry no doors of their own", !/<a class="ig-room"/.test(act));

  // Nav "Rooms" points at the hub street. Only check nav links, not album doors.
  out.push("\n-- site nav --");
  for (const page of ["index.html", "about.html", "research.html", "activities.html", "service.html", "links.html", "teaching.html"]) {
    const html = fs.readFileSync(page, "utf8");
    const navBlock = html.match(/<nav class="nav-links"[\s\S]*?<\/nav>/);
    let roomsHref = null;
    if (navBlock) {
      const m = navBlock[0].match(/<a[^>]*href="([^"]+)"[^>]*>\s*Rooms\s*<\/a>/);
      if (m) roomsHref = m[1];
    }
    ok(`${page}: "Rooms" nav points at the hub street (${STREET})`,
       roomsHref === STREET, roomsHref || "missing");
  }

  // The street is a published page: the sitemap must list it.
  const sm = fs.readFileSync("sitemap.xml", "utf8");
  ok("sitemap lists the street", sm.includes(`/${STREET}<`));

  console.log(out.join("\n"));
  console.log(`\n${fails.length} failure(s)` + (fails.length ? "  " + fails.join(", ") : ""));
  process.exit(fails.length ? 1 : 0);
}

main();

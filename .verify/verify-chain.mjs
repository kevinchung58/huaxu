/* verify-chain.mjs — the hub and owned-space graph. The street has exactly the
   three main places; landmark/sub-spaces are reached from their owning object,
   never as street doors or album cards. Exits unwind to the owning room, then
   the hub; nothing may turn a child space into a top-level destination.
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
  { file: "rooms.html",          id: "tokyo",   backObj: "gate-kaminari" },   // Nakamise is left through Kaminarimon (round 32)
  { file: "rooms-fukuoka.html",  id: "fukuoka", backObj: "curtain-back" },
  { file: "rooms-toronto.html",  id: "toronto", backObj: "door-back" },
  // A landmark space owns its way back to the prop that owns it (landmark-space §2), not to
  // the street: the hall is the hub route in, the space returns to the hall.
  { file: "rooms-cntower.html",  id: "cntower", backObj: "door-back", home: "rooms-toronto.html",
    returnHash: "at-tower-cn" },
  { file: "rooms-niagara.html",  id: "niagara", backObj: "door-back", home: "rooms-toronto.html",
    returnHash: "at-falls-n", sub: ["rooms-journey.html"] },
  // The space the real Table Rock owns: entered by the door at the rail end of the promenade,
  // unwinding to that same door in the promenade, not the street.
  { file: "rooms-journey.html",  id: "journey", backObj: "door-back", home: "rooms-niagara.html",
    returnHash: "at-door-journey" },
];
const STREET_DOORS = [
  { obj: "door-toronto", expect: "rooms-toronto.html" },
  { obj: "door-tokyo",   expect: "rooms.html" },
  { obj: "door-fukuoka", expect: "rooms-fukuoka.html" },
];

async function main() {
  ok("css and js exist on disk", fs.existsSync("css/site.css") && fs.existsSync("js/site.js"));
  ok("the street page exists", fs.existsSync(STREET));

  /* ---- the street: three main-place doors, plus its own door to the album ---- */
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
    // Rooms on the hub street leave for the street; a landmark space leaves for its prop's room.
    const HOME = r.home || STREET;
    ok(`${r.id}: boots without console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));

    const hud = doc.querySelector("[data-walk-exit]");
    ok(`${r.id}: HUD exit button exists and has an href`,
       !!hud && /\.html(#at-[a-z0-9-]+)?$/.test(hud?.getAttribute("href") || ""),
       hud ? hud.getAttribute("href") : "missing");

    const back = doc.querySelector(`[data-obj="${r.backObj}"]`);
    const expectedExit = r.home ? `${HOME}#${r.returnHash}` : `${HOME}#at-${r.id}`;
    ok(`${r.id}: back prop "${r.backObj}" returns to its owner at the correct anchor`,
       !!back && back.dataset.leave === expectedExit, back?.dataset.leave || "missing");

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
    // A space may also own the door to a space beneath it — the way the real Table Rock owns
    // Journey Behind the Falls — so a leave is right when it is the unwind home or an owned sub-space.
    ok(`${r.id}: every leave on the page is ${HOME} or an owned sub-space`,
       leaves.length > 0 && leaves.every((t) => t.split("#")[0] === HOME || (r.sub || []).includes(t.split("#")[0])),
       [...new Set(leaves)].join(", "));
    const badAnchors = leaves.filter((t) => {
      const [page, hash] = t.split("#");
      if (r.home && page === HOME) return hash !== r.returnHash;
      if (!r.home && page === STREET) return !!hash && hash !== `at-${r.id}`;
      return (r.sub || []).includes(page) && !!hash;
    });
    ok(`${r.id}: every return anchor names the actual parent prop`, badAnchors.length === 0,
       badAnchors.join(", ") || [...new Set(leaves)].join(", "));

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
  /* Field notes is permanently the original three main destinations. */
  const WANT = { toronto: "rooms-toronto.html", tokyo: "rooms.html",
                 fukuoka: "rooms-fukuoka.html" };
  const wrapAt = act.indexOf("data-place-cards");
  ok("album: the place-card container exists", wrapAt >= 0);
  const cardIds = [...act.matchAll(/data-place-card="([a-z-]+)"/g)].map((m) => m[1]);
  ok("album: exactly Toronto, Tokyo and Fukuoka appear, in the fixed order",
     JSON.stringify(cardIds) === JSON.stringify(Object.keys(WANT)), cardIds.join(", "));
  for (const [id, page] of Object.entries(WANT)) {
    const at = act.indexOf(`data-place-card="${id}"`, wrapAt);
    ok(`album: the ${id} card exists`, at >= 0);
    if (at < 0) continue;
    const card = act.slice(at, act.indexOf("</a>", at));
    const href = (card.match(/href="([^"]+)"/) || [])[1];
    ok(`album: the ${id} card is the door to ${page}`, href === page, href || "missing");
    ok(`album: the ${id} card carries its cover sheet`, card.includes(`IMG/${id}-cover.jpg`));
  }
  ok("album: no owned landmark or sub-space appears as a top-level card",
     !/data-place-card="(?:cntower|niagara|journey)"/.test(act));
  ok("album: one card per main place in one container", cardIds.length === 3);
  ok("album: plates carry no doors of their own", !/<a class="ig-room"/.test(act));

  // Child spaces are owned by props inside their real parent, not by the album or street.
  const OWNED = [
    { parent: "rooms-toronto.html", prop: "tower-cn", child: "rooms-cntower.html",
      story: true, returnHash: "at-tower-cn" },
    { parent: "rooms-toronto.html", prop: "falls-n", child: "rooms-niagara.html",
      story: true, returnHash: "at-falls-n" },
    { parent: "rooms-niagara.html", prop: "door-journey", child: "rooms-journey.html",
      story: false, returnHash: "at-door-journey" },
  ];
  for (const edge of OWNED) {
    const parentHtml = fs.readFileSync(edge.parent, "utf8");
    const prop = parentHtml.match(new RegExp(`<button[^>]*data-obj="${edge.prop}"[^>]*>`));
    const childHtml = fs.readFileSync(edge.child, "utf8");
    const backProp = childHtml.match(/<button[^>]*data-obj="door-back"[^>]*>/);
    if (edge.story) {
      const storiesTag = parentHtml.match(/<script type="application\/json" data-walk-stories>([\s\S]*?)<\/script>/);
      const stories = storiesTag ? JSON.parse(storiesTag[1]) : {};
      ok(`${edge.prop}: parent object opens a real story before its owned space`,
         !!prop && prop[0].includes(`data-story="${edge.prop}"`)
           && stories[edge.prop]?.space === edge.child && stories[edge.prop]?.frames?.length > 0,
         stories[edge.prop]?.space || "story/space missing");
    } else {
      ok(`${edge.prop}: the owned entry is the door object inside its parent`,
         !!prop && prop[0].includes(`data-leave="${edge.child}"`), prop?.[0] || "door missing");
    }
    ok(`${edge.child}: leaving returns to its owning object in ${edge.parent}`,
       !!backProp && backProp[0].includes(`data-leave="${edge.parent}#${edge.returnHash}"`),
       backProp?.[0].match(/data-leave="([^"]+)"/)?.[1] || "return anchor missing");
  }
  ok("album: no field-notes frames in the roll (the cards replaced them)",
     !/id="ig-field-notes-/.test(act));

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

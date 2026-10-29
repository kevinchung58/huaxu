/* verify-box -- the `[data-obj]` rectangle must sit on the pixels its prop paints, and a press on
   those pixels must reach that prop (or something legitimately in front of it).

   Why this gate exists (round 79). Round 70 left two claims in TODO.md that cannot both be true:

     (a) "the picture was the model's mirror; after the flip, `skyline-cn`'s rectangle [582,191,312,552]
          at yaw 0 frames the four towers";
     (b) "P6-8: at yaw 0 the rectangle is at 582 while the towers paint at 130-420, so the box sits on
          bare wall — the visitor sees the model and presses the wall."

   Both quote the same rectangle. The difference is the paint each was compared against, and both
   paint readings came from colour heuristics ("the warmest cluster", "the box's own crop"). This gate
   replaces the guess: it asks the renderer to paint ONE prop flat magenta, reads the bounding box of
   the magenta pixels, and reads the rectangle from the live DOM in the same parked state. Then it
   presses the middle of that paint through the document's own hit test.

   The tint is an in-memory patch of the served `js/site.js` — the idiom `_plume.mjs` and `_wedge2.cjs`
   already use. Nothing on disk changes, and the anchor is asserted to match exactly once before it
   fires: a patch that silently matches nothing would leave the gate comparing the scene to itself.
   The page is opened under `prefers-reduced-motion: reduce`, which is the lane's own freeze: the
   streetcar parks, the crowns stop swaying and the wheel stops, so the rectangle and the paint
   describe the same frame (measured without it: `tree-c3` moved 8 px between the two reads).

   The three verdicts, per prop, and why each is the property a visitor cares about:

     cover   share of the prop's own painted pixels that land inside its rectangle. A box that has
             drifted off its paint covers nothing; this is the mirror defect's signature (0 %).
     fill    share of the rectangle's on-screen area that is that prop's own paint. Prints only:
             a prop's lower faces are legitimately hidden behind the table it stands on
             (`skyline-cn` measures 61 px of rectangle below its visible paint), and a prop half out
             of the viewport has a rectangle three times its visible width.
     press   where `elementFromPoint` at the paint's centre lands. PASSes for that prop, or for a
             NEARER prop — the lane's own rule is "of two overlapping boxes the nearer one wins the
             press" (`js/site.js`), and the z-index encodes that depth (1200 - depth/4). Scenery
             (`data-quiet`) is skipped by design: CSS gives it `pointer-events: none`, so the finger
             goes through a bin to whatever is behind it (round 65).

   Two pages are in the default set because they are green and they cover the two kinds of prop the
   other instruments lean on (a diorama model and its trees; a hall of built models and framed
   photographs). Two measured defects are NOT yet in it, because the gate must be usable before it is
   widened -- both are written up in TODO.md with the command that reproduces them:

     ROOMS=street.html STOP=0      `stall-menya` (and `stall-kingyo`) are 170x128 cards standing
                                   parallel to the wall: edge-on, a 12 px sliver at 19 m, and menya's
                                   own faces paint nothing at two headings while its press box sits on
                                   the shopfront behind it.
     ROOMS=rooms-niagara.html STOP=3 YAWS=-109
                                   `falls-horseshoe`'s disc projects at x 1128 of a 1024-wide frame:
                                   the falls the stop exists to look at cannot be pressed without
                                   turning the head.

   Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node .verify/verify-box.mjs
         ROOMS=rooms-toronto.html STOP=4 YAWS=0,30 IDS=skyline-cn node .verify/verify-box.mjs  # one prop
         SHIFT=40 node .verify/verify-box.mjs    # antitest: every prop must now fail
*/
import fs from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { launch, openPage, arrive, aim, park, sleep } from "./_aim.mjs";

/* The gate's pages: `PAGES="rooms-toronto.html:4:0,30|rooms-fukuoka.html:2:0,45"`. Overridable by
   ROOMS/STOP/YAWS for one page, which is how a diagnosis of one prop is run. */
const PAGES = (process.env.ROOMS
  ? `${process.env.ROOMS}:${process.env.STOP || 4}:${process.env.YAWS || "0,30"}`
  : process.env.PAGES || "rooms-toronto.html:4:0,30|rooms-fukuoka.html:2:0,45")
  .split("|").map((p) => {
    const [rooms, stop, yaws] = p.split(":");
    return { rooms, stop: Number(stop), yaws: yaws.split(",").map(Number).filter(Number.isFinite) };
  });
/* The gate measures every prop the lane is showing at that heading: a curated list is how P6-8 got
   its answer for one prop and no gate. `IDS=skyline-cn` narrows a diagnosis to one prop. */
const IDS = !process.env.IDS || process.env.IDS === "*" ? []
  : process.env.IDS.split(",").filter(Boolean);
const OUT = process.env.OUT || ".preview/box-gate";
const COV = Number(process.env.COV || 0.97);   // share of the paint that must land inside the rect
const EDGE = Number(process.env.EDGE || 3);    // px: the silhouette's own antialiased rim
const SHIFT = Number(process.env.SHIFT || 0);  // antitest: deliberately move the served rectangle

fs.mkdirSync(OUT, { recursive: true });

/* The anchor is the one place the emitter has finished pushing a prop's quads and has not yet asked
   where its box is. Asserted unique: two matches mean the tint lands on another prop's faces. */
const ANCHOR = "      m.shown = false;";
const TINT = `      if (window.__boxTint && m.el.dataset.obj === window.__boxTint && drawn.length) {
        drawn.forEach((q) => { q.mode = "flat"; q.arg = "#ff00ff"; q.textureSource = null;
                              q.textureKey = null; q.imageKey = null; q.fallback = null;
                              q.air = 0; q.nolite = true; q.lit = 0; });
      }
`;

const browser = await launch({ width: 1024, height: 768 });
let rows = 0, fails = 0, tapRows = 0, tapFails = 0, scenery = 0, hidden = 0;
const covered = [];      // [rooms, stop, prop, owner] -- props drawn by a neighbour's faces
const failures = [];

for (const { rooms, stop, yaws } of PAGES) {
  const page = await openPage(browser, {
    rooms, hour: "day", reduce: true,
    intercept: async (req) => {
      if (!/\/js\/site\.js(\?|$)/.test(req.url())) return req.continue();
      const body = await (await fetch(req.url())).text();
      const hits = body.split(ANCHOR).length - 1;
      if (hits !== 1) {
        console.log(`FAIL  tint anchor matched ${hits} times in js/site.js (expected 1) — the gate would measure nothing`);
        return req.abort();
      }
      req.respond({ status: 200, contentType: "text/javascript", body: body.replace(ANCHOR, TINT + ANCHOR) });
    },
  });

  const a = await arrive(page, stop);
  if (!a.target || !a.arrived) {
    console.log(`FAIL  ${rooms}: stop ${stop} not reached (${a.why || "no such stop"})`);
    fails++; await page.close(); continue;
  }
  console.log(`\n${rooms} stop ${stop} "${a.target.label}" at z ${a.target.z} cm (${(a.target.z / 100).toFixed(1)} m)`);

  for (const yaw of yaws) {
    const g = await aim(page, yaw);
    if (!g.aimed) {
      /* A heading the lane cannot reach is refused by name, never photographed under a false name
         (frame-evidence section 2). */
      console.log(`  yaw ${yaw}: NOT AIMED (${g.off.toFixed(1)} deg off) — no frame with a false name`);
      fails++; continue;
    }
    await park(page);
    const heading = await page.evaluate(() => document.querySelector("[data-walk]").__walk.yaw);
    console.log(`  yaw ${heading.toFixed(1)}`);

    /* Every prop on screen at this heading, with the numbers this gate needs: the rectangle, its
       depth-encoded z-index, whether it is scenery, and whether it is a landmark (no paint). */
    const props = await page.evaluate((ids, shift) => Array.from(document.querySelectorAll("[data-obj]"))
      .filter((el) => el.style.visibility !== "hidden" && getComputedStyle(el).visibility !== "hidden")
      .filter((el) => !ids.length || ids.includes(el.dataset.obj))
      .map((el) => {
        const b = el.getBoundingClientRect();
        return { id: el.dataset.obj, x: b.left + shift, y: b.top, w: b.width, h: b.height,
                 z: Number(el.style.zIndex) || 0, quiet: el.hasAttribute("data-quiet"),
                 landmark: el.hasAttribute("data-landmark") };
      }), IDS, SHIFT);

    for (const rect of props) {
      const id = rect.id;
      /* A landmark draws nothing by design (round 65): it stands for something the world already
         paints, and its box is a fixed disc at its own point in the world. There is no paint to
         compare it with, so only the press is measured -- from the middle of the disc. */
      if (rect.landmark) {
        const at = await page.evaluate((x, y) => {
          const el = document.elementFromPoint(x, y);
          const hit = el && el.closest && el.closest("[data-obj]");
          return hit ? hit.dataset.obj : (el ? el.tagName.toLowerCase() : "nothing");
        }, Math.round(rect.x + rect.w / 2), Math.round(rect.y + rect.h / 2));
        const ok = at === id;
        rows++; if (!ok) fails++; tapRows++; if (!ok) tapFails++;
        if (!ok) failures.push(`${rooms} stop ${stop} yaw ${Math.round(heading)} ${id}: landmark press answered ${at}`);
        console.log(`    ${id.padEnd(20)} ${ok ? "ok  " : "FAIL"}  marker ${Math.round(rect.w)}x${Math.round(rect.h)} ` +
                    `at ${Math.round(rect.x)},${Math.round(rect.y)}  press ${ok ? "itself" : `WRONG:${at}`}  ` +
                    `(a landmark draws no geometry; its disc is the whole of it)`);
        continue;
      }
      const shot = `${OUT}/${rooms.replace(/\.html$/, "")}-stop${stop}-yaw${Math.round(heading)}-${id}` +
                   `${SHIFT ? `-shift${SHIFT}` : ""}.png`;
      await page.evaluate((id) => { window.__boxTint = id; window.dispatchEvent(new Event("resize")); }, id);
      await sleep(600);                       // the lane's repaint path: size(); draw()
      await page.screenshot({ path: shot });

      const img = await loadImage(shot);
      const W = img.width, H = img.height;
      const canvas = createCanvas(W, H), ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0, inside = 0;
      for (let p = 0, i = 0; i < px.length; i += 4, p++) {
        const r = px[i], g2 = px[i + 1], b = px[i + 2];
        if (r < 140 || b < 140 || g2 > Math.min(r, b) * 0.8 || Math.abs(r - b) > 70) continue;
        const x = p % W, y = (p - x) / W;
        n++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x >= rect.x - EDGE && x <= rect.x + rect.w + EDGE
         && y >= rect.y - EDGE && y <= rect.y + rect.h + EDGE) inside++;
      }
      await page.evaluate(() => { window.__boxTint = null; });

      const where = `rect ${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.w)}x${Math.round(rect.h)}`;
      /* A pressable prop whose own faces paint nothing here. Two very different worlds look like
         this, and the gate must not merge them: the prop is behind another prop that covers it
         (occlusion), or the prop's silhouette is painted by a NEIGHBOUR's faces -- measured on the
         hub street: `stall-menya`'s box sits on a stall that the shopfront `front-n` draws, so the
         stall is visible and its own tint paints nothing. Ask the pixels: tint the props whose
         rectangle contains this box's centre and see which one owns them. */
      if (!n && !rect.quiet) {
        const cx = Math.round((rect.x + rect.w) / 2), cy = Math.round((rect.y + rect.h) / 2);
        /* Scenery is a candidate owner too: a bin is not pressable, but it paints, and a silhouette
           that belongs to one is the same data-model fact as one that belongs to a shopfront. */
        const candidates = props.filter((o) => o.id !== id
                                          && cx >= o.x && cx <= o.x + o.w && cy >= o.y && cy <= o.y + o.h)
                                 .sort((a, b) => b.z - a.z)   // the nearest box wins the press: try it first
                                 .slice(0, 6);
        for (const other of candidates) {
          const probe = `${OUT}/_probe-${rooms.replace(/\.html$/, "")}-${other.id}.png`;
          await page.evaluate((id) => { window.__boxTint = id; window.dispatchEvent(new Event("resize")); }, other.id);
          await sleep(400);
          await page.screenshot({ path: probe });
          const im = await loadImage(probe);
          const cnv = createCanvas(im.width, im.height), g2 = cnv.getContext("2d");
          g2.drawImage(im, 0, 0);
          const d = g2.getImageData(Math.max(0, Math.min(im.width - 1, cx)), Math.max(0, Math.min(im.height - 1, cy)), 1, 1).data;
          fs.unlinkSync(probe);
          if (d[0] > 140 && d[2] > 140 && d[1] < Math.min(d[0], d[2]) * 0.8) {
            rows++;
            covered.push(rooms, stop, id, other.id);
            console.log(`    ${id.padEnd(20)} ok    ${where}  painted by another prop (${other.id}) — the box is on a ` +
                        `visible object whose faces belong to its neighbour`);
            n = -1;                     // "already counted and judged", not "nothing painted"
            break;
          }
        }
        await page.evaluate(() => { window.__boxTint = null; });
        if (n === -1) continue;
      }
      if (!n) {
        /* The box is placed but nothing of the prop is painted at this heading: every face it drew
           is behind the world (measured at Fukuoka stop 2: the crates and the ladder stand 70 cm
           behind the Retro High Mart's plinth, which is nearer and covers them), or it drew no face
           at all (a landmark draws none by design). For scenery that is an occlusion and is reported.
           For a TARGET it is a defect: the lane is showing a press box on something nobody can see. */
        rows++;
        if (rect.quiet) { hidden++; console.log(`    ${id.padEnd(20)} ok    ${where}  hidden behind the world at this heading (scenery)`); }
        else {
          fails++;
          failures.push(`${rooms} stop ${stop} yaw ${Math.round(heading)} ${id}: pressable box, nothing painted`);
          console.log(`    ${id.padEnd(20)} FAIL  ${where}  pressable box but nothing of it is painted — ${shot}`);
        }
        continue;
      }

      const cov = inside / n;
      const ok = cov >= COV;
      rows++; if (!ok) { fails++; failures.push(`${rooms} stop ${stop} yaw ${Math.round(heading)} ${id}: cover ${(cov * 100).toFixed(1)}%`); }

      /* The press, at the middle of the prop's own paint. The answer must be the prop, or something
         NEARER (a larger z-index): the lane's own press rule for overlapping boxes. */
      let press = "scenery";
      if (rect.quiet) scenery++;
      else {
        const at = await page.evaluate((x, y) => {
          const el = document.elementFromPoint(x, y);
          const hit = el && el.closest && el.closest("[data-obj]");
          return { id: hit ? hit.dataset.obj : null, z: hit ? Number(hit.style.zIndex) || 0 : null,
                   tag: el ? el.tagName.toLowerCase() : "nothing" };
        }, Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2));
        const reaches = at.id === id || (at.z !== null && at.z > rect.z);
        press = at.id === id ? "itself" : at.id ? `${reaches ? "in front" : "WRONG"}:${at.id}` : `WRONG:${at.tag}`;
        tapRows++; if (!reaches) { tapFails++; failures.push(`${rooms} stop ${stop} yaw ${Math.round(heading)} ${id}: press answered ${press}`); }
      }
      const vx0 = Math.max(rect.x, 0), vy0 = Math.max(rect.y, 0);
      const vx1 = Math.min(rect.x + rect.w, W), vy1 = Math.min(rect.y + rect.h, H);
      const fill = n / Math.max(1, (vx1 - vx0) * (vy1 - vy0));
      console.log(`    ${id.padEnd(20)} ${ok ? "ok  " : "FAIL"}  ${where}  paint ${x0},${y0}..${x1},${y1} ` +
                  `(${n} px)  cover ${(cov * 100).toFixed(1)}%  fill ${(fill * 100).toFixed(0)}%  ` +
                  `press ${press}`);
    }
  }
  await page.close();
}

await browser.close();
if (!rows) { console.log("FAIL  no prop was measurable — this run proves nothing"); process.exit(1); }
console.log(`\nverify-box: ${rows - fails}/${rows} rectangles sit on their own paint (cover >= ${(COV * 100) | 0}%)` +
            ` -- ${tapRows - tapFails}/${tapRows} presses on a target's own paint reach it or something in front` +
            ` (${scenery} scenery props measured but not pressed: the finger goes through them by design;` +
            ` ${hidden} boxes hidden behind the world)` +
            ` -- ${PAGES.length} page(s)`);
for (const f of failures) console.log(`  FAIL ${f}`);
for (let i = 0; i < covered.length; i += 4) console.log(`  note ${covered[i]} stop ${covered[i + 1]}: ` +
  `${covered[i + 2]} is painted by ${covered[i + 3]}'s faces (the box is on a visible object; ` +
  `the silhouette belongs to its neighbour)`);
process.exit(fails || tapFails ? 1 : 0);

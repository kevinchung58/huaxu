/* The generated markup's own invariants — no browser, no jsdom, one pass over the 19 pages.

   These are the rules the *generator* is supposed to guarantee, and they are the ones a hand-edit or
   a generator refactor breaks silently: an id that repeats, a press target marked as scenery, a
   solid with no footprint, a rail whose stops run backwards. Every assertion here is a rule stated
   in `gen/render.py` or `AGENTS.md`, checked against the file that was actually produced — the
   generator being right and the page being right are two different facts.

   Fast by design (no boots): this file is the one that can run on every save.

   Run: node --test        (from the repository root; discovers tests/*.test.cjs)
*/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const PAGES = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const LANES = PAGES.filter((f) => fs.readFileSync(path.join(ROOT, f), "utf8").includes('class="walk"'));

/* The generator's own definition of a press target (`gen/render.py` `is_target`), expressed on the
   attributes it writes: a verb, a place to go, photographs, a ride, a game, a demonstration, or the
   landmark the place is named for. Anything else is scenery and must say so. */
function pressable(o) {
  const has = (k) => o.getAttribute(`data-${k}`) !== null;
  if (has("leave") || has("story") || has("frame") || has("game") || has("ride")) return true;
  if (has("demo") || o.getAttribute("data-landmark") === "1") return true;
  if (has("states") && (o.getAttribute("data-kind") === "door" || o.getAttribute("data-kind") === "glassfloor")) return true;
  return false;
}

/* `getAttribute` over one tag's text, so a test reads the markup the way the page does. */
function tags(tag) {
  return { getAttribute: (k) => { const m = tag.match(new RegExp(`\\s${k}="([^"]*)"`)); return m ? m[1] : null; } };
}

test("every page with a lane is a page the generator wrote", () => {
  assert.ok(LANES.length >= 8, `${LANES.length} walkable pages found`);
  for (const file of LANES) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.match(html, /<script src="js\/site\.js\?v=[0-9a-f]+"><\/script>/, `${file}: site.js is cache-busted (VER)`);
    /* The lane's own numbers, as `attr()` reads them: width, depth, and the far end the page
       authorises (four pages are longer than their authored depth — the quay, the promenade). */
    const w = html.match(/data-lane-w="(\d+)"/), d = html.match(/data-lane-d="(\d+)"/);
    assert.ok(w && Number(w[1]) > 0, `${file}: declares data-lane-w`);
    assert.ok(d && Number(d[1]) > 0, `${file}: declares data-lane-d`);
    /* `data-lane-max-d` is where the body may walk, and it is not always the authored depth:
       niagara authorises 90 cm *less* than it authors (the promenade stops before the brink) and
       journey 600 cm more (the tunnel runs past its own record). Only the relation the rail obeys
       is asserted below — every stop is inside the far end. */
  }
});

test("walkable-page discovery covers every registered scene", () => {
  const { walkPages } = require("../bin/walk-pages.cjs");
  const registered = JSON.parse(execFileSync("python3", ["-c",
    "import json; from gen.site import ROOMS; print(json.dumps([r[2] for r in ROOMS if r[4] == 'open']))"],
    { cwd: ROOT, encoding: "utf8" })).sort();
  assert.ok(registered.length >= 8, `${registered.length} registered walkable pages`);
  assert.deepEqual(LANES, registered, "the emitted walkable pages match the generator's registry");
  assert.deepEqual(walkPages(ROOT), registered, "the collision gate includes every emitted walkable page");
});

test("prop ids are unique on every page", async (t) => {
  for (const file of LANES) {
    await t.test(file, () => {
      const html = fs.readFileSync(path.join(ROOT, file), "utf8");
      const ids = [...html.matchAll(/data-obj="([^"]+)"/g)].map((m) => m[1]);
      assert.ok(ids.length > 0, `${file}: declares props`);
      const seen = new Map();
      for (const id of ids) seen.set(id, (seen.get(id) || 0) + 1);
      const dupes = [...seen].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`);
      assert.deepEqual(dupes, [], `${file}: duplicate data-obj ids — ${dupes.join(", ")}`);
    });
  }
});

test("a verb is never scenery: pressable props carry a verb and are not quiet", async (t) => {
  /* Round 73's invariant, and the reason `act()`'s `if (m.quiet) return;` is safe to keep at the
     top: the goldfish stall is a `board` (scenery by kind) that plays a game, so behaviour outranks
     material. If the generator ever marks a verb quiet, the press dies in silence — this is the
     test that notices. */
  for (const file of LANES) {
    await t.test(file, () => {
      const html = fs.readFileSync(path.join(ROOT, file), "utf8");
      const props = [...html.matchAll(/<[a-z]+[^>]*data-obj="[^"]+"[^>]*>/g)].map((m) => m[0]);
      let verbs = 0;
      for (const tag of props) {
        const o2 = tags(tag);
        if (!pressable(o2)) continue;
        verbs += 1;
        const id = (tag.match(/data-obj="([^"]+)"/) || [])[1];
        assert.notEqual(o2.getAttribute("data-quiet"), "1", `${file}: ${id} has a verb and is quiet`);
        assert.ok(o2.getAttribute("data-verb"), `${file}: ${id} has a verb but no data-verb`);
      }
      assert.ok(verbs >= 1, `${file}: has at least one press target`);
    });
  }
});

test("a solid declares a footprint", async (t) => {
  for (const file of LANES) {
    await t.test(file, () => {
      const html = fs.readFileSync(path.join(ROOT, file), "utf8");
      /* Not every lane has freestanding solids — a hall's walls are the lane's own boundary, and the
         CN Tower's podium declares none — so this validates the ones a page does declare. */
      const solids = [...html.matchAll(/<[a-z]+[^>]*data-solid="true"[^>]*>/g)].map((m) => m[0]);
      for (const tag of solids) {
        const id = (tag.match(/data-obj="([^"]+)"/) || [])[1];
        for (const k of ["w", "d"]) {
          const m = tag.match(new RegExp(`\\sdata-${k}="(-?[\\d.]+)"`));
          assert.ok(m, `${file}: ${id} declares data-${k}`);
          assert.ok(Number(m[1]) > 0, `${file}: ${id} data-${k} is ${m[1]} — a solid needs a real footprint`);
        }
      }
    });
  }
});

test("the rail's stops are numbered, and their progress is the depth", async (t) => {
  for (const file of LANES) {
    await t.test(file, () => {
      const html = fs.readFileSync(path.join(ROOT, file), "utf8");
      /* The rail is numbered in document order, every stop has a depth and a progress fraction, and
         none reaches past the end the page authorises. It is *not* required to run forwards:
         fukuoka's stop 10 (「the canal's stone」) sits 40 cm back from stop 9 because that is where
         the stone is — a rail that had to be monotone would have to lie about the place. */
      const depth = Number(html.match(/data-lane-d="(\d+)"/)[1]);
      const far = Number((html.match(/data-lane-max-d="(\d+)"/) || [])[1] || depth);
      assert.ok(far > 0 && depth > 0, `${file}: has a depth and a far end to measure stops against`);
      /* A stop's tag may carry a heading and a lateral offset between the number and the style, so
         read the tag's text rather than one rigid pattern — the rigid pattern silently found zero
         stops on niagara and made this test pass over nothing. */
      const stops = [...html.matchAll(/data-walk-stop="(\d+)"([^>]*)>/g)].map((m) => {
        const z = m[2].match(/--z:(-?[\d.]+)px/), p = m[2].match(/--p:([\d.]+)/);
        return { i: Number(m[1]), z: z ? Number(z[1]) : NaN, p: p ? Number(p[1]) : NaN };
      });
      assert.ok(stops.length >= 2, `${file}: at least two stops`);
      stops.forEach((s, n) => {
        assert.equal(s.i, n, `${file}: stop ${s.i} is number ${n} in document order`);
        assert.ok(s.z <= far + 1, `${file}: stop ${s.i} at ${s.z} is within the authorised ${far}`);
        assert.ok(Number.isFinite(s.z), `${file}: stop ${s.i} declares a depth`);
        /* `--p` is what the progress bar shows, and it is not a fraction of the *authorised* lane
           (street's last stop reads 1.365 out on the quay) — it is `z / data-lane-d`, the authored
           depth, exactly. Measured on all eight pages while writing this test: every stop agrees
           with that within a thousandth. */
        assert.ok(Math.abs(s.p - s.z / depth) < 0.005,
          `${file}: stop ${s.i}'s progress ${s.p} is ${s.z} / ${depth} = ${(s.z / depth).toFixed(3)}`);
      });
      assert.ok(stops[0].z >= 0, `${file}: the first stop is ahead of the lane's mouth (${stops[0].z})`);
    });
  }
});

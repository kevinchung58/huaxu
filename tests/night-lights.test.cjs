/* The lights a page is authored with are where the things that carry them are.

   Clifton Hill had four halos hanging at x=640 over the fun strip with no post under them, eight
   lamp posts standing dark, and ten shop halos placed at their props' origins -- which is inside
   the props. None of that is visible in a record or a diff; it is visible in the light island the
   generator writes, so that is what this reads. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PAGES = fs.readdirSync(ROOT).filter((f) => /^(street|rooms(-\w+)?)\.html$/.test(f));
const attr = (tag, name) => (tag.match(new RegExp(`data-${name}="([^"]*)"`)) || [])[1];
const px = (tag, name) => Number((tag.match(new RegExp(`--${name}:(-?[\\d.]+)px`)) || [])[1]);
const read = (file) => {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const island = html.match(/<script type="application\/json" data-walk-lights>([\s\S]*?)<\/script>/);
  const props = [...html.matchAll(/<button[^>]*data-obj="[^"]+"[^>]*>/g)].map((m) => ({
    id: attr(m[0], "obj"), kind: attr(m[0], "kind"), ry: Number(attr(m[0], "ry") || 0),
    x: px(m[0], "x"), y: px(m[0], "y"), z: px(m[0], "z"), h: px(m[0], "h") }));
  return { lights: island ? JSON.parse(island[1]) : [], props };
};

test("the walkable pages are all here", () => assert.equal(PAGES.length, 8));

test("every tall lamp post is a light at its own glass, lifted clear of it", () => {
  let posts = 0;
  for (const file of PAGES) {
    const { lights, props } = read(file);
    for (const p of props.filter((q) => q.kind === "lamp" && q.h > 200)) {
      posts += 1;
      const at = lights.filter((L) => L.x === p.x && L.z === p.z && !L.of);
      assert.equal(at.length, 1, `${file} ${p.id}: one light on the post, found ${at.length}`);
      assert.equal(at[0].y, p.y + p.h - 42, `${file} ${p.id}: the light is at the middle of the glass`);
      assert.ok(at[0].lift >= 22, `${file} ${p.id}: lifted past the glass's 21 cm half-diagonal`);
      assert.notEqual(at[0].bulb, false, `${file} ${p.id}: a lamp has a bulb`);
    }
  }
  assert.ok(posts >= 10, `the lamp posts were found (${posts})`);
});

test("on a page whose lamps are posts, no light hangs where no post or prop is", () => {
  for (const file of PAGES) {
    const { lights, props } = read(file);
    const posts = props.filter((q) => q.kind === "lamp" && q.h > 200);
    if (!posts.length) continue;
    for (const L of lights) {
      if (L.of) { assert.ok(props.some((p) => p.id === L.of), `${file}: glow of a prop that exists (${L.of})`); continue; }
      assert.ok(posts.some((p) => p.x === L.x && p.z === L.z),
        `${file}: a free light at x=${L.x} z=${L.z} stands on no lamp post`);
    }
  }
});

test("a wall prop's glow that says `out` hangs in front of the prop, on the lane's side", () => {
  const { lights, props } = read("rooms-niagara.html");
  const glows = lights.filter((L) => L.of);
  assert.ok(glows.length >= 10, "Clifton Hill's shop and sign glows are in the island");
  for (const L of glows) {
    const p = props.find((q) => q.id === L.of);
    if (Math.abs(p.ry) <= 45) continue;
    assert.ok(Math.abs(L.x) < Math.abs(p.x) && Math.sign(L.x) === Math.sign(p.x),
      `${L.of}: glow at x=${L.x} is not in front of its prop at x=${p.x}`);
  }
});

/* The emitted pages name things that exist.
 *
 * Found by reading the pages as a browser reads them: every district card in the written lane
 * carried `aria-describedby="room-<id>"` -- 72 of them over eight pages -- and no element anywhere
 * had such an id. A dangling id reference fails silently (the description is simply absent), which
 * is why nothing noticed. These are the references a page makes that can be checked without a
 * browser:
 *   - an id is used once per page;
 *   - `aria-controls`, `aria-describedby`, `aria-labelledby`, `aria-owns` and `label[for]` name an
 *     id on the same page;
 *   - a local `href` / `src` / `srcset` / `poster` names a file in the repository;
 *   - a `#fragment` names an id on the page it points at. `#at-<room>` is not an id: the lane reads
 *     it to decide where the visitor arrives (js/site.js, `atId`).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const tags = (html) => [...html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script\b[\s\S]*?<\/script>/g, "").matchAll(/<([a-zA-Z][\w-]*)\b([^<>]*)>/g)].map((m) => {
  const attrs = {};
  for (const a of m[2].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1].toLowerCase()] = a[2].replace(/&amp;/g, "&");
  return { tag: m[1].toLowerCase(), attrs };
});
const read = Object.fromEntries(pages.map((p) => [p, tags(fs.readFileSync(path.join(ROOT, p), "utf8"))]));
const ids = Object.fromEntries(pages.map((p) => [p, read[p].map((t) => t.attrs.id).filter(Boolean)]));

test("the generator has emitted its pages", () => {
  assert.ok(pages.length >= 19, `${pages.length} pages`);
});

test("an id is used once on a page", () => {
  const dup = [];
  for (const p of pages) {
    const seen = new Set();
    for (const id of ids[p]) { if (seen.has(id)) dup.push(`${p}#${id}`); seen.add(id); }
  }
  assert.deepEqual(dup, []);
});

test("every id an attribute refers to is on the page", () => {
  const lost = [];
  for (const p of pages) {
    const have = new Set(ids[p]);
    for (const t of read[p]) {
      for (const k of ["aria-controls", "aria-describedby", "aria-labelledby", "aria-owns", ...(t.tag === "label" ? ["for"] : [])]) {
        for (const id of (t.attrs[k] || "").split(/\s+/).filter(Boolean)) if (!have.has(id)) lost.push(`${p}: <${t.tag} ${k}="${id}">`);
      }
    }
  }
  assert.deepEqual(lost, [], `${lost.length} references to ids that are not there`);
});

test("every local file and fragment a page points at exists", () => {
  const lost = [];
  for (const p of pages) {
    for (const t of read[p]) {
      const urls = ["href", "src", "poster"].map((k) => t.attrs[k]).filter((u) => u !== undefined);
      for (const part of (t.attrs.srcset || "").split(",")) if (part.trim()) urls.push(part.trim().split(/\s+/)[0]);
      for (const u of urls) {
        if (/^(https?:|mailto:|tel:|data:|\/\/|javascript:)/.test(u)) continue;
        const [file, frag] = u.split("#");
        const local = file.split("?")[0];
        if (local && !fs.existsSync(path.join(ROOT, decodeURIComponent(local)))) { lost.push(`${p}: ${u} (no such file)`); continue; }
        if (!frag || /^at-[a-z0-9-]+$/.test(frag)) continue;
        const target = local || p;
        if (ids[target] && !ids[target].includes(frag)) lost.push(`${p}: ${u} (no such id)`);
      }
    }
  }
  assert.deepEqual(lost, []);
});

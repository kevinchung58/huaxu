---
name: pure-move-split
description: Split a load-bearing file that has grown too big to keep in one piece — the generator, a scene record, one 9,000-line script — without changing a single byte of what it produces. Use whenever a round is about to touch a file that is 6,000+ lines, whenever someone proposes "we should really modularise this", whenever a framework or build step is suggested as the fix for file size, and whenever the owner asks why the code is one file. Gives the ownership-based splitter, the byte-identity proof, the gates that go blind after a split, and the files that must not be split cosmetically.
---

# A pure move, and its proof

Round 78, the owner asked whether React would make this repository easier to work in. The honest
answer was no — GitHub Pages runs React fine, the constraint here is self-imposed (no build step, no
committed dependencies) — and the pain he was pointing at was real but named wrong: it was **two
files**, `_gen_html.py` at 7,484 lines and `js/site.js` at 9,479. He said 「該做你都去做」, so the
generator was split. It is now a **715-line entry point plus six modules**, and the split is proven
by **all 19 emitted pages being byte-identical** before and after.

The second half — `js/site.js` — was done in two stages: round 86 cut the three small units out
(§5), and the lane itself is still one closure, which the same section says out loud. A skill that
pretended otherwise would be exactly the confident-wrong instrument `frame-evidence` exists for.

## 1. Why a split needs a proof, not a review

This generator's top-level ordering is load-bearing: page bodies (f-strings), the loops that fill
them, and the records they read are interleaved, and modules that import each other in a cycle would
run half-initialised. A refactor that "tidies while it splits" is a rewrite with no way to tell a
typo from a difference. So the rule:

> **A pure move changes the file layout and nothing else, and the proof is that the output is
> byte-identical.** Not "the site still looks fine". Not "the gates are green" (they would be green
> after a small visual regression too, if no gate measures that pixel).

Keep the pre-split output as a checksum manifest before touching anything:

```sh
python3 _gen_html.py && md5sum *.html > /tmp/base_html.md5   # 19 lines
cp _gen_html.py /tmp/gen_baseline.py                        # the source of truth, never written to
```

## 2. Split by name ownership, never by line number

Line numbers move the moment anything above them changes; **names do not**. Every top-level
statement is routed to the module that owns the name it defines; anything unclaimed stays in the
entry point in its original order, so the entry keeps doing what it did.

`scripts/split_by_ownership.py` does it, `scripts/spec-gen.py` is this repository's spec, and the
pair reproduces the shipped `gen/` tree exactly — `diff` reports nothing and `md5sum -c` passes:

```sh
python3 skills/pure-move-split/scripts/split_by_ownership.py skills/pure-move-split/scripts/spec-gen.py
python3 _gen_html.py && md5sum -c /tmp/base_html.md5
```

Four traps, each of which cost a broken run in round 78:

| trap | what it looks like | the fix |
|---|---|---|
| **tuple targets** | `A, B, C = f()` binds three names and has **no `ast.Name` target**, so it owns nothing, lands in the entry, and every module importing `A` dies at import. | walk `ast.Tuple`/`ast.List`/`ast.Starred` in `name_of` — the shipped splitter does. |
| **comment leads** | the comment above a statement, glued to the statement without its own newline, becomes a comment inside the next line's indentation → `IndentationError: unexpected indent`. | join `lead + "\n"`, always. |
| **`__file__` paths** | the file moves one directory down and every path it computes (`ROOT`, asset paths, the CSS file) silently points inside the package. | a `SHIM` in the spec, replacing the old line with a commented one, and a build that fails loudly when it does. |
| **unused imports carried over** | the entry keeps `import hashlib` because the original header said so; nothing uses it, and `dead-ballast` is now hunting it. | prune any import whose bound name appears nowhere else in the file it was written into. |

An AST range proves a module **parses**. It proves nothing about behaviour. The only proof is the
checksum.

## 3. The gates go blind after a split — this is the part that gets forgotten

Three gates here read the generator as **text** (`verify-csslive`, `verify-walk`,
`bin/verify-three`), and the generator itself parsed one file to catch duplicate dict keys. All four
would have kept passing while seeing 10 % of the code:

> **A gate that reads one file keeps passing after that file is split.** It does not fail; it
> under-reports, which is worse, because a green line is a claim.

`bin/gen-source.mjs` now returns the concatenation of the entry and every `gen/*.py`, and the gates
import it. `_assert_no_duplicate_keys()` walks `gen/*.py` too — proved by planting a duplicate `"id"`
in `gen/content.py` and watching the build exit 1 at `line 53: 'id'`.

**Check every reader before declaring a split done:**

```sh
grep -rn '_gen_html\.py\|site\.js' .verify/*.mjs .verify/*.cjs bin/*.mjs | grep -v '^.*#'
```

And then check the ones a grep cannot see, because they are **tools that only run when someone has
installed their optional dependencies** — the round-78 miss. `bin/toronto_massing.py` pinned
`--generator _gen_html.py` and read `TOR_O` / `TOR_GRID` / `TOR_TOWERS` out of it with `ast`; the
split moved them to `gen/world.py`, so the tool had been broken since the commit and **no gate
noticed**, because it needs `pip install pmtiles mapbox-vector-tile shapely` plus a downloaded
archive before it even starts. A tool that cannot run is a tool that is not tested. The fix is
`bin/gen_literals.py` (stdlib only, searches every generator file, and when it fails it says which
files it looked in), and the durable part: `verify-gen` **executes** it every round. Whatever data
your split relocates, find the code that reads it by path rather than by import.

## 4. What the split bought, measured

| | before | after |
|---|---|---|
| `_gen_html.py` | 7,484 lines | **715-line entry** |
| `gen/site.py` | — | 355: nav, footer, icons, `page()`/`shell_page()` |
| `gen/content.py` | — | 494: publications, projects, pillars, courses, the report's rows |
| `gen/media.py` | — | 366: the image registry, the album wall |
| `gen/world.py` | — | 2,080: Niagara, Goat Island, Toronto, the tunnel |
| `gen/districts.py` | — | 2,657: the district records |
| `gen/render.py` | — | 855: the lane's markup, drawer, plate |
| emitted pages | 19 | **19, byte-identical** |

The win is not aesthetic. A round that changes a caption opens `gen/content.py` (494 lines) instead
of scrolling a 7,484-line file, and — the part that matters for this repository — a **record and the
renderer that consumes it are now visibly different files**, so "where does this come from" has one
answer.

## 5. A classic script splits by text, and its proof is the bytes

Round 86, `js/site.js` was 9,552 lines. Four top-level units were tangled there — page chrome (145),
shared overlay plumbing (115), the dot-trace game (207), and **the lane, 9,045 lines with 288
declarations sharing one closure**. The three small ones came out; the lane did not. What the round
learned is the rule for anything else in this shape:

> **A classic script is split into more classic scripts, in a fixed order, and the proof is that the
> parts joined in that order are byte-identical to the file they came from.** Not "it loads". Not
> "the pages look right".

- The load order lives in **one** file, `bin/site-sources.json`, and everything reads it through
  `bin/site-sources.mjs` (`siteFiles()`, `siteText()`, `sitePath()`) or its `.cjs` twin for jsdom
  gates. Python reads the same JSON. A second copy of that list is a split waiting to go half-blind.
- **The parts share one global lexical environment.** They are classic scripts, so a `let`/`const`/
  `class` declared at top level in two parts throws at load — a silent last-one-wins bug for `var`,
  a hard error for the rest. `.verify/verify-sources.mjs` scans for it; keep that scan.
- **A gate that `w.eval`-ed the old file must join the text, not evaluate part by part.** A later
  indirect eval cannot see an earlier one's `let`/`const` — measured, not assumed: `siteText()` is now
  what `verify-walk`, `verify-ux`, `verify-overlay`, the `.cjs` gates and `tests/helpers/boot.cjs`
  feed jsdom.
- **`?v=` follows the list too.** The digest is a sha1 over `bin/asset-list.json` + `bin/site-sources.json`
  (`bin/asset-ver.mjs`, mirrored by `gen/site.py`). `verify-walk` and `verify-gen` went red after the
  split *because each recomputed the list itself*; both now import the one function. Two derivations
  of one digest is the same defect as two copies of the file list.
- **Seams are chosen by measurement, not by taste.** `_coupling.mjs` counts, per section, how many
  top-level names it declares and how many are read from elsewhere; the cut goes where that number is
  small. It reports 11 names read from 5+ sections across the joined programme, all of them inside the
  lane.

### What pixel-identity cannot prove here

The generator's proof is byte-identical HTML; the script's proof is byte-identical source. Do **not**
try to add "and the frames are identical": the same build, same stop, same heading, two browser
launches differ on a few thousand pixels by one unit per channel (Toronto stop 4), and a build one
refactor old differs on 4,249 pixels at ±1, 331 at ≥2, 109 at ≥6 and 4 at ≥20 — *below* that same-build
noise floor for the interesting thresholds. Bit-exact frames are not a criterion this rasteriser
supports. What can be compared exactly is what the programme hands the renderer: `__walk.drawQuads`
(mode, texture key, colour, world corners, uv), the camera and `__walk.threeStats`.
`.verify/_scenehash.mjs` hashes exactly that and reports SAME/DIFFERENT per stop; use it for an A/B of
a refactor, and `.verify/_abdiff.mjs` only to *look* at a difference with its threshold distribution
printed beside the image.

### What must not be split cosmetically

The lane is still 9,045 lines and stays that way until a round is prepared to pay for it:

- every one of its 288 declarations shares one closure; cutting at a file boundary is not a move, it
  is an interface design;
- the fastest gate in this repository, `verify-walk` (212 assertions), works by evaluating that text
  in jsdom. **ES modules cannot be evaluated that way**, so the split also costs a browser-driven
  gate — every assertion ported, not rewritten.

Do not "fix" it with a cosmetic split that moves 500 lines into `helpers.js` and leaves 9,000 behind.
If it is done, the scope is: keep them classic scripts (or make the interface explicit *and* port the
gates in the same commit), name each seam with `_coupling.mjs`, and prove the seams with
`verify-sources` plus `_scenehash.mjs` per stop.

## 6. Checklist before claiming a split is done

1. `/tmp/base_html.md5` (or the equivalent manifest) passes — every page, byte for byte.
2. Regenerating twice changes nothing (idempotence), and the generator's own ordering is unchanged
   (`python3 _gen_html.py` prints `wrote html pages` and nothing else).
3. Every gate that read the old file as text now reads the new tree; `grep` for the old filename.
4. No module is orphaned: every `gen/*.py` is reachable from the entry point's import graph.
5. No top-level name is defined in two modules (that is a silent last-one-wins bug, the same class as
   a duplicate dict key).
6. The full gate battery, not a subset — a split touches everything, so everything runs.
7. The docs that name the layout (`AGENTS.md` §Layout, `TODO.md` sizes) are true, and the
   half that was not split says so in the same breath as the half that was.
8. For a script split: the parts **joined in load order** equal the old bytes (`cmp`), every reader
   uses `siteText()`/`siteFiles()`, the `?v=` digest is derived once (`bin/asset-ver.mjs`), and
   `verify-sources` passes — that is the gate that holds the ordering, the digest and the duplicate
   scan, so a split cannot quietly drop one.

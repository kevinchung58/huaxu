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

Then the second half was **not** done, and this file says so out loud (§5). A skill that pretends
both halves were split would be exactly the confident-wrong instrument `frame-evidence` exists for.

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

**Check every text reader before declaring a split done:**

```sh
grep -rn '_gen_html\.py' .verify/*.mjs .verify/*.cjs bin/*.mjs | grep -v '^.*#'
```

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

## 5. The file that must not be split cosmetically

`js/site.js` is 9,479 lines and **was not split**, deliberately, and the reason is not laziness:

- it is four top-level units — page chrome (145 lines), shared overlay plumbing (~115), the dot-trace
  game (207) — and **the lane: 8,989 lines, 288 declarations sharing one closure**;
- cutting a closure at a file boundary is not a move: every shared name becomes an explicit
  interface, and that is a rewrite with a different risk profile;
- the fastest gate in this repository, `verify-walk` (212 assertions), works by `w.eval`-ing that one
  script into jsdom. **ES modules cannot be evaluated that way**, so the split also costs a slower,
  browser-driven gate — every assertion has to be ported, not re-written.

So the honest statement, in `AGENTS.md` and `TODO.md` §P3, is: *the generator is split, the script is
not, here is the price of the remaining half*. Do not "fix" this with a cosmetic split that leaves a
9,000-line file behind and moves the other 500 lines into `helpers.js` — that pays none of the cost
and spends the round.

If it is done, the scope is: `js/lane/{fields,props,reach,rail,story,px}.js` as native ES modules, each
exporting only its real interface; the 212 assertions ported to a real page under puppeteer; and
`.preview` frames compared pixel-for-pixel against the pre-split frames.

## 6. Checklist before claiming a split is done

1. `/tmp/base_html.md5` (or the equivalent manifest) passes — every page, byte for byte.
2. Regenerating twice changes nothing (idempotence), and the generator's own ordering is unchanged
   (`python3 _gen_html.py` prints `wrote html pages` and nothing else).
3. Every gate that read the old file as text now reads the new tree; `grep` for the old filename.
4. No module is orphaned: every `gen/*.py` is reachable from the entry point's import graph.
5. No top-level name is defined in two modules (that is a silent last-one-wins bug, the same class as
   a duplicate dict key).
6. The full gate battery, not a subset — a split touches everything, so everything runs.
7. The docs that name the layout (`AGENTS.md` §Layout, `TODO.md` §5.6 sizes) are true, and the
   half that was not split says so in the same breath as the half that was.

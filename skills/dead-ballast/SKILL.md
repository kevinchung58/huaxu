---
name: dead-ballast
description: Find and remove the things in this repository that do nothing — a declaration nothing reads, an attribute the generator emits that no code applies, a probe no round invokes, a gate that exists but is not in the checklist, a doc line pointing at a file that is gone — and prove the removal changed nothing a visitor can see. Use whenever the owner says 垃圾、多餘、不需要、用不到的、清一清、刪掉、simplify、cleanup、dead code, whenever a round ends with time left, and before any PR that claims the repository is "done". Also use in the other direction: before you add a knob, an attribute, an instrument or a gate, this skill says what will keep it alive.
---

# Dead ballast

The owner has asked for this twice — round 73 「全部拿掉多餘的」, round 76 「不該有的垃圾都刪掉」.
Both times the answer was not a review but a **sweep with measurements**, because the dangerous
ballast here does not announce itself: it looks like a knob you can turn, a gate you can trust, or an
instrument you can run.

## 0. Why this is not cosmetic

Ballast is expensive in a specific currency: **the next round's reasoning**. Everything in this table
was believed to be live by a round that then spent time on it.

| what it looked like | what it was | what it cost |
|---|---|---|
| `data-lane-day-start="0.9"` on the page | an attribute the generator emitted, `site.js` parsed into `DAY_AT`, and **nothing read** | every "dusk" frame any probe had ever taken was a **noon** frame (`_lumacheck`: luma 141 at "night" until it was wired) |
| `_dbg2.mjs`, `_proj.mjs`, `_barshot.mjs`, … ten files | one-round scratch probes, referenced by nothing | a reader cannot tell an instrument from a relic, so the instruments stop being trusted |
| `verify-island.cjs`, `verify-ux.mjs`, `verify-mirror.mjs`, `verify-rooms-e2e.cjs` | **real gates**, working, catching real defects — absent from the checklist in `TODO.md` §2.3 | a gate that nobody runs cannot fail, which is worse than no gate: it says the area is covered |
| `NIA_TRAIL`, `_ring_m`, `PRESS_VERBS`, `DAYLEN`, `DAY_LEN`, `tileCm` | declarations in the generator and the JS | two rounds of "is this used?" before anyone could say no |

The last row is the one that gets argued about. Note what round 76 found when it finally counted:
`js/site.js` has **1,137 declarations and one that appears in exactly one place — none**. The dead code
in this repository is not in the middle of functions; it is in the seams: the attribute nobody reads,
the file nobody runs, the line in a checklist nobody updated, the name in a doc for a file that was
deleted three rounds ago.

## 1. The five kinds, and how each one is found

Each kind needs a different search. Do all five; two of them will come back empty and that is the
report.

1. **A declaration nothing reads.** Grep every identifier declared at the top of a file against the
   whole corpus — the JS, the emitted HTML, the generator, `.verify/`, the docs. Do not stop at
   `js/`: `_gen_html.py` is 8,000 lines and its dead names look exactly like its live ones.
2. **An attribute emitted and never applied.** List every `data-*` the generator writes, then for each
   one ask: who parses it (`attr("…")` in `js/site.js`), and who *uses* the parsed value. The emitter
   and the parser are two places; the defect lives in the gap between the parser and the third place.
3. **A probe no round invokes.** For every file in `.verify/`, count references outside itself, in
   every tracked text file — `TODO.md`, `AGENTS.md`, `SKILLS.md`, `skills/`, the gates, the generator.
   Zero references is a candidate; **it is not yet a verdict** (see §3).
4. **A gate missing from the checklist.** List `.verify/verify-*` and diff it against the run block in
   `TODO.md` §2.3. This is the sweep's only finding that should *not* be deleted: a working gate is
   made alive by adding it to the checklist, and dead by deleting it.
5. **A doc line whose file is gone.** Take every backticked filename in `skills/`, `AGENTS.md`,
   `SKILLS.md`, `TODO.md`, `DESIGN.md`, `README.md` and check it exists. Distinguish three outcomes:
   the file was **renamed** (point the line at the new name), the file was **retired and the line says
   so** ("retired with the painter in round 54" — this is history, keep it), or the line sends a
   reader to a file that was never there (`.preview/shot1dbg.mjs` — rewrite it around the technique
   that still exists).

## 2. Grep is not proof, in both directions

Round 76's own false positives, kept here so the next sweep does not repeat them:

- `.plate-navy` / `.plate-paper` appear nowhere in the emitted pages **because every row currently
  carries an image** and the generator only emits the plate when it does not. The CSS is a documented
  fallback (`_gen_html.py` says so above the emitter). Deleting it would delete the fallback that makes
  an image-less row still look composed.
- `IMG/3.jpg` (457 KB) is referenced by nothing and is **deliberate**: `UNFILED` in `_gen_html.py`
  keeps it out until the owner gives it a caption. An owner decision is not ballast.
- `data-walk-things`, `data-place-card`, `data-place-cards` are read by **gates and CSS**, not by
  `site.js`. The corpus for step 1 is every tracked file, not the one you happen to be editing.
- `package.json` is `gitignore`d on purpose (harness only), so "the doc names a file that is not in the
  repo" is correct there.
- Hex colour literals match a class-selector regex (`#b45309`): strip colour values before counting CSS
  selectors, or the report will be seventeen false entries long and nobody will read the real one.

## 3. The three verdicts, and how to choose

| verdict | when | example |
|---|---|---|
| **delete** | nothing reads it, and nothing *will* read it: a one-round scratch probe, a dead constant, an attribute whose whole purpose was a clock the site does not run | `data-lane-day-cycle` (900 s for a page clock), `NIA_TRAIL` (nine surveyed nodes that were provenance for a decoration) |
| **wire** | the thing is right and the reading of it was missing — a value the page hands out that the code should honour | `data-lane-day-start` → `DAY_AT` → `hourPhaseSet`, applied only to a visitor who has not chosen an hour |
| **document** | the thing works and nothing names it — a gate, an instrument, a producer | `verify-island.cjs` (0 % empty on all 20 stops) added to `TODO.md` §2.3; `bin/toronto_massing.py` (the producer of `data/toronto-massing-2025.json`) kept and named |

Prefer **wire** to **delete** when a value is already authored and correct: deleting an unused
attribute removes the possibility of a bug; wiring it removes the bug. Prefer **delete** when the
value's whole reason was something the repository no longer has.

Do not delete: a producer whose output is still in the repository, a documented fallback, a
`gitignore`d harness file, a historical sentence that names a retired tool as retired, or anything the
owner asked to keep.

## 4. Prove the removal was invisible

A deletion is a change, and this repository's rule is that a change is not delivered until it is
proven. The proof is cheap when the thing was truly dead:

```sh
python3 _gen_html.py && git diff --stat -- '*.html'      # only the cache-bust hash and the removed attribute
node --check js/site.js && python3 -m py_compile _gen_html.py
```

If the HTML diff is exactly the `?v=` hash plus the attribute that was deleted, the removal was
invisible by construction — the pages are byte-identical in everything a browser draws. Then run the
gates (round 76 ran ux, walk, overlay, exit, nowebgl, look, body, story, feel, skills, rooms-e2e),
because "dead" was a claim about a measurement, and the measurement is the gates.

For an instrument or a gate that is **deleted**, the proof is the opposite: run its nearest surviving
gate first and quote the number in the round entry, so the coverage that went away is on the record.

## 5. What keeps a thing alive

The sweep is the second half of the rule. The first half is not adding dead things:

- A new attribute needs a reader **in the same commit**, and the reader's value needs a user in the
  same commit. `data-lane-day-cycle` was authored, emitted, parsed, and unused for an unknown number
  of rounds because each of those three steps was somebody's good idea.
- A new probe gets a line in `TODO.md` §2.4 in the same commit, or it is scratch and belongs in
  `/tmp`.
- A new gate goes into §2.3 in the same commit, with its count, or it will not run again.
- A new doc reference names a file that exists at the end of the commit (`verify-skills` cannot check
  this; a sweep can).

## Procedure

1. Take the five censuses in §1. Print the counts, not the impression. Round 76's: 92 files in
   `.verify/` before the sweep and 82 after, 256 CSS class selectors, 28 custom properties, 66 images,
   95 `data-*` attributes emitted, 1,137 declarations in `site.js`, 25 gates of which 10 were missing
   from the checklist.
2. For each candidate, find its references across every tracked text file and write down the number.
3. Choose delete / wire / document per §3. Say the reason in one line in `TODO.md`, because the next
   sweep will ask the same question.
4. Delete; regenerate; diff. Prove the pages did not change except where you meant them to.
5. Update the registers in the same commit: `TODO.md` §2.3 (gate list, with counts), §2.4 (instruments,
   without the deleted ones), `skills/README.md` + `SKILLS.md` if a skill changed, and the skill itself
   if the lesson is a class.
6. Run the gates. `verify-skills` is not optional in a round that touched `skills/`.
7. Report the deletions as deletions — file names and the verdict that justified each — not as
   "cleaned up the codebase".

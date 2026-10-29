---
name: dead-ballast
description: Find and remove the things in this repository that do nothing — a declaration nothing reads, an attribute the generator emits that no code applies, a probe no round invokes, a gate that exists but is not in the checklist, a doc line pointing at a file that is gone, a CSS selector no page can match, a class token that styles and hooks nothing — and prove the removal changed nothing a visitor can see. Use whenever the owner says 垃圾、多餘、不需要、用不到的、清一清、刪掉、simplify、cleanup、dead code, whenever a round ends with time left, and before any PR that claims the repository is "done". Also use in the other direction: before you add a knob, an attribute, an instrument or a gate, this skill says what will keep it alive.
---

# Dead ballast

The owner has asked for this three times — round 73 「全部拿掉多餘的」, round 76 「不該有的垃圾都刪掉」,
round 77 「不是提到就不是垃圾。你不能這樣保守，你必須垃圾真的就刪掉。該維持的都弄好。」

Round 77 established the rule that this skill exists to enforce, and it is stronger than "does a
grep find it": **being named is not being used.** A gate, a doc line, a comment, a CSS fallback story,
an attribute mentioned in a checklist — none of those is a user. Round 76 kept a dead `.plate-navy`
family because a comment called it "a documented fallback", and kept the plan-view strip because a
comment said the rail "still marks the boundaries on its ticks"; the comment was written by round 72 in
the same commit that deleted the strip's four CSS rules. Both were deleted in round 77.

The answer is never a review but a **sweep with measurements**, because the dangerous ballast here
does not announce itself: it looks like a knob you can turn, a gate you can trust, an instrument you
can run, or a surface you have described in prose.

## 0. Why this is not cosmetic

Ballast is expensive in a specific currency: **the next round's reasoning**. Everything in this table
was believed to be live by a round that then spent time on it.

| what it looked like | what it was | what it cost |
|---|---|---|
| `data-lane-day-start="0.9"` on the page | an attribute the generator emitted, `site.js` parsed into `DAY_AT`, and **nothing read** | every "dusk" frame any probe had ever taken was a **noon** frame (`_lumacheck`: luma 141 at "night" until it was wired) |
| `_dbg2.mjs`, `_proj.mjs`, `_barshot.mjs`, … ten files | one-round scratch probes, referenced by nothing | a reader cannot tell an instrument from a relic, so the instruments stop being trusted |
| `verify-island.cjs`, `verify-ux.mjs`, `verify-mirror.mjs`, `verify-rooms-e2e.cjs` | **real gates**, working, catching real defects — absent from the checklist in `TODO.md` §2.3 | a gate that nobody runs cannot fail, which is worse than no gate: it says the area is covered |
| `NIA_TRAIL`, `_ring_m`, `PRESS_VERBS`, `DAYLEN`, `DAY_LEN`, `tileCm` | declarations in the generator and the JS | two rounds of "is this used?" before anyone could say no |
| `.ig-*`, `#ig-plate` — 259 CSS lines, 189 JS lines, ~55 generator lines | the album viewer, written for a roll of dated classroom photographs. It had never emitted one element: the wall holds no photograph because a plate needs a caption and a date | a gate (`verify-walk`) asserted the viewer's *shape* as if it shipped, so five rounds read the CSS as covered |
| `.walk-strip*` — three spans, 15 JS lines, two `zones` tables, one HTML comment | the plan-view strip. Round 72 deleted its four CSS rules and its commit message cited the strip as the surviving indicator; round 76 then wrote a comment promising the strip "marks the boundaries on its ticks" | five rounds of invisible DOM that two audits read as live, because the comment said so |
| `.plate-navy/.plate-paper/.plate-num/.plate-rule/.plate-name` | a typographic fallback for a principle row without its illustration. No row lacks one, and an image-less row is a build error, not a state to design for | round 76 called it "documented, therefore kept" — the exact reasoning the owner rejected |

The last row is the one that gets argued about. Note what round 76 found when it finally counted:
`js/site.js` has **1,137 declarations and one that appears in exactly one place — none**. The dead code
in this repository is not in the middle of functions; it is in the seams: the attribute nobody reads,
the file nobody runs, the line in a checklist nobody updated, the name in a doc for a file that was
deleted three rounds ago.

## 1. The seven kinds, and how each one is found

Each kind needs a different search. Do all seven; two of them will come back empty and that is the
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
5. **A CSS selector no page can match.** A grep cannot answer this: it finds `.plate` inside a prose
   comment and `grid-2` inside an image filename. Use `.verify/verify-csslive.mjs` (round 77): it
   parses every selector out of `css/site.css` with its line number, asks jsdom whether any page
   matches it, and classifies what is left (§3a). Its `no match` list went 36 → 12 → 0 dead once the
   survivors were settled one at a time.
6. **A class token that neither styles nor hooks.** The other direction of the same census: take every
   class in the emitted markup and ask (a) is there a rule, (b) does any script query it. Seven tokens
   in round 77 had neither. Five (`block-head`, `doi-line`, `principles`, `q-list`, `text-link`) were
   noise on top of a rule that already existed under another name; two (`walk-aside`, `walk-jump`)
   looked alive because the script asks for them — it asks for their `data-` attribute, never the class.
7. **A doc line whose file is gone.** Take every backticked filename in `skills/`, `AGENTS.md`,
   `SKILLS.md`, `TODO.md`, `DESIGN.md`, `README.md` and check it exists. Distinguish three outcomes:
   the file was **renamed** (point the line at the new name), the file was **retired and the line says
   so** ("retired with the painter in round 54" — this is history, keep it), or the line sends a
   reader to a file that was never there (`.preview/shot1dbg.mjs` — rewrite it around the technique
   that still exists).

## 2. Grep is not proof, in both directions

Round 76's false positives, kept here so the next sweep does not repeat them — including the one that
was itself wrong, because a skill that only records the catches teaches the wrong reflex:

- ~~`.plate-navy` / `.plate-paper` are a documented fallback, so keep them.~~ **Round 77 deleted them,
  and the owner is why.** A comment is not a user: nothing could emit the plate without editing the
  registry, and an image-less row is a build error, not a state to compose for. The right repair was
  to make the image required (the generator now fails loudly) and delete the twelve rules. The general
  form: **if the only thing keeping a branch alive is a sentence explaining it, the branch is dead.**
- `.hero-note a`, `.section .btn-ghost`, `.section.alt .icon-chip`, `.grid-2`, `.about-copy h3`,
  `.meta-links a`, `.place-card-media.dashed.empty` — all seven looked alive to a grep (the selector's
  *parent* appears on a page, or the word appears in a filename or a comment) and all seven matched
  nothing. A descendant selector is only as alive as its last compound, and jsdom is the cheap way to
  ask.
- `IMG/3.jpg` (457 KB) is referenced by nothing and is **deliberate**: `UNFILED` in `_gen_html.py`
  keeps it out until the owner gives it a caption. An owner decision is not ballast.
- `data-walk-things`, `data-place-card`, `data-place-cards` are read by **gates and CSS**, not by
  `site.js`. The corpus for step 1 is every tracked file, not the one you happen to be editing.
- `package.json` is `gitignore`d on purpose (harness only), so "the doc names a file that is not in the
  repo" is correct there.
- Hex colour literals match a class-selector regex (`#b45309`): strip colour values before counting CSS
  selectors, or the report will be seventeen false entries long and nobody will read the real one.

## 3. The four verdicts, and how to choose

| verdict | when | example |
|---|---|---|
| **delete** | nothing reads it, and nothing *will* read it: a one-round scratch probe, a dead constant, an attribute whose whole purpose was a clock the site does not run | `data-lane-day-cycle` (900 s for a page clock), `NIA_TRAIL` (nine surveyed nodes that were provenance for a decoration) |
| **wire** | the thing is right and the reading of it was missing — a value the page hands out that the code should honour | `data-lane-day-start` → `DAY_AT` → `hourPhaseSet`, applied only to a visitor who has not chosen an hour |
| **document** | the thing works and nothing names it — a gate, an instrument, a producer | `verify-island.cjs` (0 % empty on all 20 stops) added to `TODO.md` §2.3; `bin/toronto_massing.py` (the producer of `data/toronto-massing-2025.json`) kept and named |
| **keep as dormant** | no page matches it *today*, but the generator writes it for data the build accepts, and the thing it would show is content the site promises — and then say so out loud, with the count | the photograph wall (`.ig-grid`, `.ig-tile`, 5 rules + 12 generator lines, 0 photographs because none has a date) is the whole of what survives of the album; `verify-csslive` prints it as DORMANT rather than DEAD |

### 3a. Dormant or dead — the question that decides it

Round 77's whole difficulty was this line, so it is written out:

1. **Can any code path in the build emit it, for data the build accepts?** If no → **dead**. Delete.
2. **Does the data that would reach that path exist, or can it arrive without an invention?** The wall
   needs a caption and a date; the owner has given neither, and inventing one is forbidden. So the
   wall is dormant, not dead — but that is a *reason*, not a licence: it also means nobody has ever
   looked at it, so it may not keep a 259-line viewer. Keep the smallest path that would let the
   promise be met (a figure with its caption), and delete everything layered on top of it.
3. **Is a missing asset a state or a bug?** A cover sheet for a place card, an illustration for a
   principle row — those are required fields. Make the build raise; do not design a substitute panel
   for them. (Round 77: the plate branch and the "No cover yet" card both went.)
4. **Does the selector belong to a mechanism something else already does?** Two viewers for one
   photograph is not redundancy, it is a second thing to keep true. One path per job.

Prefer **wire** to **delete** when a value is already authored and correct: deleting an unused
attribute removes the possibility of a bug; wiring it removes the bug. Prefer **delete** when the
value's whole reason was something the repository no longer has.

Do not delete: a producer whose output is still in the repository, a `gitignore`d harness file, a
historical sentence that names a retired tool as retired, or anything the owner asked to keep.
(Note what is **not** on that list any more: "a documented fallback". Round 76 put it there and round 77
had to take it out.)

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
- A new probe gets a line in `TODO.md` §2.4 in the same commit (the instrument register), or it is
  scratch and lives in `/tmp`. The story of why it exists belongs in its own header comment, nowhere
  else: no round logs anywhere in the repository (owner ruling, 2026-10-29).
- A new gate goes into §2.3 in the same commit, with its count, or it will not run again.
- A new doc reference names a file that exists at the end of the commit (`verify-skills` cannot check
  this; a sweep can).
- **A comment never keeps code alive, and a comment that promises behaviour is a defect in itself.**
  Round 72's message said the strip survived; round 76's comment said the strip "marks the boundaries
  and names them on their ticks". The strip had no CSS. When you delete a mechanism, delete the
  sentence about it in the same commit — and when you find a sentence promising behaviour, go and look
  at the mechanism before you trust either.
- **A gate can encode dead code as truth.** `verify-walk` held four assertions about a full-screen
  viewer that no page could emit, and they passed for five rounds because they read the *stylesheet*
  rather than a page. A gate that asserts the shape of something unreachable is worse than no gate: it
  converts a deletion into a test failure someone will "fix" by restoring the CSS. Assert what ships.

## Procedure

1. Take the seven censuses in §1. Print the counts, not the impression. Round 77's: **615 CSS
   selectors → 546** (the album viewer, the strip, the plate family and seven single rules), 36
   selectors matching no page → 12 → **0 dead** (5 dormant, the wall), 228 distinct classes in the
   markup → 7 that styled and hooked nothing, 8 `data-*` written and never read → 1 (`data-room`), 83
   files in `.verify/` → 82 (`_albumprobe` went with the album), 66 images all referenced, generator
   output identical apart from the removed markup and the cache-bust hash, `verify-walk` 212/212.
2. For each candidate, find its references across every tracked text file and write down the number.
3. Choose delete / wire / document per §3. Say the reason in one line where the survivor lives — a code
   comment or its `TODO.md` register line, never a round log — because the sweep will ask the same
   question.
4. Delete; regenerate; diff. Prove the pages did not change except where you meant them to.
5. Update the registers in the same commit: `TODO.md` §2.3 (gate list, with counts), §2.4 (instruments,
   without the deleted ones), `skills/README.md` + `SKILLS.md` if a skill changed, and the skill itself
   if the lesson is a class.
6. Run the gates. `verify-skills` is not optional in a round that touched `skills/`.
7. Report the deletions as deletions — file names and the verdict that justified each — not as
   "cleaned up the codebase".

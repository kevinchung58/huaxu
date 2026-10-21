# SKILLS.md — how a place gets built here

Every room on this site is a model of a real place, walked at ground level. This file is the
method, written down because it has been learned the hard way and because the next room should
not have to relearn it.

It is called SKILLS and not RULES because it is a craft rather than a checklist. Where AGENTS.md
says what must be true of the repository, this file says how to get a district right.

**Renderer decision (owner approval, 2026-10-16; full walkable migration; sole renderer since
2026-10-20):** all eight walkable pages use the pinned, MIT-licensed Three.js 0.186.1 runtime as
their environment/object renderer. Authored `backdrop.world.prims` are added when present; all scene
geometry stays grounded in the existing records. The Canvas2D lane painter was deleted at the
owner's ruling in round 54, so there is no no-WebGL picture: a browser without WebGL is told so in
the lane's own sentence and the written list keeps answering. The Activities album remains CSS 3D
and outside this renderer decision.

The loadable halves live in tracked `skills/` files. Route a real-place build through
`scene-system` (the orchestrator) → `real-place-builder` plus `grounded-scene` and the matching
domain skill (`district-author`, `place-intake`, `japan-place`, `street-commons`, `lane-prop`, or
`landmark-space`) → `scene-quality-loop` for rendered-frame acceptance, using `pua` for diagnosis and
verification. `karpathy-guidelines` keeps implementation surgical. Before every PR creation/update,
`pr-handoff` requires an accurate, prioritized next-round plan in `TODO.md`.

The individual skills remain useful on their own: `district-author` owns the record/build rules/gate;
`place-intake` turns supplied photographs into a record; `japan-place` covers Japanese place
vocabulary, real centimetres, night, prohibitions, and the sakura-crossing study; `street-commons`
owns the hub street, regions, promenades, and daylight; `lane-prop` owns one object, light, or state;
`landmark-space` owns a real parent prop and its walkable child; `grounded-scene` owns source-based
spatial fidelity; `real-place-builder` coordinates the actual build; `scene-quality-loop` owns visual
acceptance; `pua` is the evidence-first debugging method; and `pr-handoff` owns the PR/TODO contract.
`AGENTS.md` requires the Karpathy and PUA practices for non-trivial implementation, the scene,
grounding, and domain skills before environment work, the visual loop before sign-off, and the PR
handoff before every PR operation.

---

## 1. Grill first, build second

**The single most expensive mistake available here is building the wrong thing well.**

A room takes many hours. If the subject is wrong, or the view is wrong, all of it is wasted and
worse than wasted, because a well-made wrong thing looks finished and so does not get questioned.
So before a single prop is authored, the following must have answers. Ask the owner. Do not infer
them, do not guess them, and do not quietly pick a default because asking felt slow.

### The questions

1. **Which place, exactly?** Not the city — the *spot*. "Fukuoka" turned out to mean Moji Port,
   which is a specific waterfront in Kitakyushu, not the yatai alley the room had been built as.
   A city is not a subject; a place you can stand in is.
2. **Where does the visitor stand, and what is in front of them?** A diorama has one vantage per
   stop. Name the buildings that must be visible from it.
3. **What time is it?** These rooms have a day-night cycle now. "Night" and "late afternoon" are
   different rooms with different lighting budgets.
4. **What is the one thing that moves?** Every good model railway exhibit has a moment. Niagara is
   the water. Toronto is the roof opening and the lights coming up. Rogers Centre is not a building
   with a roof, it is a roof that opens. Ask what the moment is here.
5. **Is there a personal connection?** This site may not imply a visit that did not happen. If the
   owner was there, that changes what is safe to claim; if they were not, the room must stand on
   the place's own facts. Never assume either way.
6. **How many?** A row of stalls, a line of ships, a string of lanterns. Density is what separates
   a model from a diagram, and the number is the owner's to give, not the builder's to economise on.

### Grilling well

- Ask **before** building, and ask with research already done. "What should this be?" is a lazy
  question; "Moji Port has the station, the customhouse and the Blue Wing drawbridge — which of
  those is the room, and which is the view?" is not.
- Offer **options the owner can reject**, not open questions they have to compose an answer to.
- Ask about **facts the repository cannot supply**: whether they were there, what they remember,
  which building mattered. Never about things research can answer.
- Say plainly what is **blocked** and why. "I will not invent your institution's name" is a
  complete sentence and the owner will usually supply it.
- The owner will often just say *繼續*. That is permission to proceed on the answers already
  given, **and a standing instruction to come back and grill them the moment a real fork appears.**
  It is not permission to guess.

---

## 2. Research the place like a modeller, not a tourist

Before anything is drawn, establish:

- **Proportions.** Real dimensions, from sources. Niagara is 670 m of crest against a 57 m drop,
  which is 11.75:1 and means breadth, not height. A yatai is ~3 m by 2.5 m by 2.5 m. Get these
  wrong and the object is not merely inaccurate, it is unrecognisable.
- **What identifies it.** Not what is there, but what makes it *that* place. The Blue Wing is not
  "a bridge", it is Japan's largest pedestrian drawbridge and it opens six times a day. That is
  the object.
- **Materials and colour.** Red brick with a specific bond, a wooden neo-Renaissance station, a blue
  steel bascule. A model reads by silhouette and material, not by detail.
- **What it looks like after dark.** Every room here has a night. Find out what is illuminated.

Cite sources. Record conclusions in the code next to what they produced, and in TODO.md, because
fetched pages are not saved and the next session starts from nothing.

---

## 3. The benchmark is Little Canada

The owner named it, so it is the standard. Its signature is not detail for its own sake:

- **One synchronised day-night cycle** across every exhibit, with thousands of LEDs coming up at
  "sunset". Ours is four minutes, not fifteen, because a cycle nobody waits for is decoration.
- **Motion that is behavioural**, not sinusoidal. A ferry berths, stands, and gets under way; it
  does not bounce off the quay.
- **Motion on the body of the object.** A roof that opens, a boat that crosses. Not a light blinking
  in a corner at low alpha.
- **Detail that rewards looking.** Interiors you can see into. A clock that keeps the hall's own
  time. Things you find, not things you are shown.

If a room is merely correct, it has not met this standard.

---

## 4. Measure, never assert

**Everything claims a number must be measured, in the browser, on the artefact the server serves.**

### The three ways measurement has been wrong here

1. **Picking the largest bounding box.** For a row of blocks the broadest view is the plain end.
   A skyline read 34 colours at 90° and 529 at 0°.
2. **Picking the most detailed crop.** That prefers a tight crop of a small part over an honest view
   of the whole. A track measured a 24×83 sliver. Only views seeing at least half the best area are
   eligible.
3. **Sampling only the extreme turns.** The audit used −90° and +90° and only those, which
   produced two wrong conclusions in a row and one reverted change. It now sweeps
   **{−90, −45, 0, 45, 90} at every stop**, 25 viewpoints, in batches, because one process over all
   of them runs out of memory.

### Instruments read the solver, not the render

Adopted in round 46 from the one-world-query rule (Mint spatial-contracts §4), because round 45
earned the lesson twice over: position-based feel metrics derived from wall-clock gaps disagreed in
opposite directions under the 0.12 s physics clamp, and the 穿牆 report that invalidated two rounds
of "fixed" claims had survived review precisely because the instruments re-implemented the movement
instead of consuming it. The rule: any measurement of movement, blocking, or standing reads the
committed state the site itself publishes (`__walk`'s `depth`/`x`/`yaw`/`velocity`/`blockedAt`), and
nothing outside the solver decides where the body is by sampling scene geometry or re-integrating
velocity. When the site can answer, the answer comes from the site.

### Other traps, all of them hit

- **A short window misses a slow cycle.** Sampling 2.1 s of a 42 s roof cycle measures it as dead.
  Watch a whole cycle before concluding an object does not move.
- **A sample taken at the animation's own period reads zero.** Use 0.7 s spacing.
- **`q.lit` is not a brightness control.** It tops out at a 28% warm wash over the quad's own base
  colour. Turning it down does not darken a room, it removes a wash. **Darkness is painted on with
  `air`.** This has now been learned four times; it is written at the point of use.
- **A flat tint over a varied texture destroys the texture.** Lighting windows by washing the
  daytime texture costs the city 460 of its 500 colours. Light things with their *own* texture.
- **Changing a position requires re-measuring.** A re-seat is not an improvement until it measures
  as one.
- **A reading of 0.00 is a sampling frame suspected before it is a defect assumed.**

### The gate

Every change, before it is committed:

```
sh bin/restore-env            # the sandbox wipes; this is idempotent and never resets hard
sh bin/preview                # regenerate and serve
node .verify/verify-shapes.mjs
node .verify/verify-geometry.mjs
node .verify/verify-clash.mjs
node .verify/verify-walk.mjs
node .verify/verify-collision.cjs        # the walker must not catch on walls (round 42)
node bin/verify-three.mjs                # the pinned runtime, and the anti-revival gate (round 54)
node .verify/verify-objects.mjs          # needs LD_LIBRARY_PATH=/tmp/al2023/lib
node .verify/_nogl.mjs                   # every WebGL context refused: the lane's sentence is visible
node node_modules/impeccable/cli/bin/cli.js detect --json css/site.css $(ls *.html)
md5sum *.html; python3 _gen_html.py; md5sum *.html   # idempotent
```

`_nogl.mjs` is a gate in the only sense this repository allows one: it fails when a visitor without
WebGL is shown nothing. It was added in round 55 after the deletion left the fallback sentence inside
the closed info card and wearing a hover-only class — visible to the harness that asked whether the
element existed, invisible to the person it was written for.

Then re-measure whatever the change touched, and record the numbers in the commit message.
`git fetch` and compare `git rev-list --count HEAD..origin/<branch>` **before** committing.

---

## 5. What may never be invented

- No lettering in a scene. No shop name, no sign, no price, no date. Signboards are pinned blank.
- No people or figures in the rooms. Interiors are dressed, not populated.
- No claim that the owner visited, was at, or attended anywhere.
- No institution, job title, ORCID or Scholar in structured data or prose unless supplied.
  A wrong identifier published about a researcher is worse than no identifier.
- No invented venue, date, caption or attendee anywhere on the site.

When the site needs one of these, **ask**, and leave the slot empty until it arrives.

---

## 6. Environment

The sandbox is rebuilt from nothing between turns and sometimes mid-turn: `node_modules`, `/tmp`,
and occasionally the git graph itself, which can come back pointing at `master` while the working
tree still holds the branch's files.

`bin/restore-env` restores all of it. It is idempotent and it **never resets hard** — the files are
usually intact and only the branch pointer is wrong. Run it at the start of a turn and again
whenever a tool call fails with a missing package.

Scripts that need `node_modules` must live in `.verify/`, not `/tmp`. Puppeteer scripts need
`LD_LIBRARY_PATH=/tmp/al2023/lib`.

## 7. Build in one pass, verify in one pass

**Interleaving slow visual checks with building is the round that takes all night.** A headless
screenshot costs half a minute to a minute; a full gate suite costs minutes more. Done after every
small change, they turn an hour of building into four. The owner said it plainly (2026-10-09):
do the building first, all of it, and run the fixing and the testing together at the end.

So the shape of a round is: author everything (renderer, record, generator, docs), then one
verification batch — syntax, regenerate + idempotency, the walk/chain/shapes/geometry/clash/e2e
gates, impeccable, the luminance probe, and the screenshots — and only then fix what the batch
found, in one fixing pass, and re-run the batch once. Screenshots are for the batch, not for the
build: while building, trust the arithmetic (the unit table in `street-system` §6) and the data,
and look at the picture at the end.

The exception that proves the rule: a load-time crash (an undefined function, a syntax error) is
caught by `node -e "new Function(...)"` in milliseconds and is allowed after every edit. It is the
slow *visual* round-trips that are batched, not the cheap static ones.

## 8. Nothing waits for "next round"

Standing order from the owner (2026-10-18): everything gets done to the fullest completeness. In
this repo that is operational, not aspirational:

- **An identified gap with the evidence to close it is this round's to-do.** If the source exists,
  the geometry is known, or it is a quality fix inside the author's remit (style, feel, legibility
  of what is drawn), it ships in the round that found it. "Recorded as a next-round option" without
  a blocking reason is a rule violation, not a plan.
- **"Done" means verified, not written.** A behaviour fix ships with the gate that pins it — the
  template is `.verify/verify-collision.cjs`: named properties, explicit thresholds, and a
  demonstrated *bite* (run the gate against the pre-fix artifact and show it fails). A visual fix
  ships with freshly eyeballed frames from the served artifact, not from the code that made it.
- **Handoff reports what actually ran, in those words.** A round closes by listing the gates that
  were executed with their tallies, and by naming what could not run and why, in the same breath —
  never by letting "verified" imply a browser was opened when only a headless harness was (round 46
  found the external verification policy stating exactly this, and it matches this repo's measure-
  never-assert rule rather than competing with it; the PR body is the handoff, and it tells the
  truth about its own evidence).
- **A measured "not needed" closes an option; silence does not.** An open question is completed by
  adjudicating it this round — run the inventory, print the count, cite the result — and the
  disposition goes in the ledger with the command that produced it. Rejected sources close the same
  way: what was searched, what was found, why it does not support the change (the §0y source round
  is the template). A refusal with citations is completeness; a parked TODO is not.
- **The rule never outranks §5 (nothing invented).** Completeness applies to backlog and craft,
  never to facts. A missing source stays a recorded refusal — "full" never means "full of".
- **Owner-gated things wait for the owner**: deploys, licensing windows, merge authorization. They
  are the owner's checklist; carry them as named blockers, never as silent ones.

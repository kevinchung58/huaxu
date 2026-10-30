# AGENTS.md

Personal academic site for Hua-Xu Zhong (鍾華栩), PhD — educational technology, AI in education, design thinking.
Static HTML, **no npm build step or runtime package install**. Deployed via GitHub Pages from the repo root
of `master` (see "Operational notes" below if the live site ever 404s). One owner-approved exception is
pinned, MIT-licensed Three.js 0.186.1, vendored under `js/vendor/` and dynamically imported on every
walkable page as its primary environment/object renderer; sourced `backdrop.world` records are added
when present. There is no second renderer: the Canvas2D lane painter was deleted in round 54 and a
lane whose browser refuses WebGL says so in the viewport and retires to its compiled state (round 55).
The Activities album is out of scope;
no package manifest, CDN, or additional runtime dependency is implied.

## Critical: source of truth

- **A change is not delivered until it is committed on the session branch (owner ruling, 2026-10-20).**
  The workspace snapshot can rebuild branch history between turns: a round that left its `_gen_html.py`
  and `js/` edits verified-but-uncommitted came back with the generator rolled to the merge base while
  the emitted HTML and the engine files survived, and the next round spent itself re-authoring two
  shipped rounds' mounts from memory (the recovery is `f11558a`'s message). Gates passing on an
  uncommitted tree protect nobody — commit the generator and its pages in the same round, and merge the
  original chain (`-s ours`) if the remote history no longer matches the rebuilt one. And when a
  rollback forces a rebuild, `git fetch origin` first and restore each file byte-for-byte from the
  remote's last good commit (`git show <tip>:<path> > <path>`) — the objects outlive the pointer.
  Re-authoring a rolled-back file from session memory silently rewrites it to whatever you remember,
  and what is lost is exactly what you forgot to remember: the round-53 rebuild cost 190 authored
  lines (crest mist, lantern stalls, the record's real frontages) that the blob had kept whole.
  A wiped sandbox also takes `node_modules` with it — run `bin/restore-env`. Headless Chromium needs
  `LD_LIBRARY_PATH=/tmp/al2023/lib`, which is why every gate is run as `sh bin/gate node …`: the
  wrapper restores the packages and the libraries, exports the path, and refuses the two speed gates
  (`verify-feel`, `verify-collision`) when another Chromium already has the box.
- **A patch script for `_gen_html.py` anchors on one structural line, never on remembered prose or a
  line number.** Grep the exact anchor before writing it; assert every replacement fires exactly once;
  do all inserts in a single pass bottom-up, because line numbers shift under your own hands; and after
  `python3 _gen_html.py`, grep the *emitted HTML* for the new attributes — a script that dies on an
  assert writes nothing, and the pages already on disk make a silently-skipped patch look healthy
  (same failure class as the bullet above about generator exits).
- **Deleting a span of code deletes every neighbour the span happened to contain, and a pattern-kill
  deletes the shell that ran it.** Two mechanics cost a full round each, so both are rules now. When a
  patch removes a block by start/end markers (round 54's painter excision: `emit` through `drawFar`),
  the survivors inside the span's line range — a shared helper, a trailing `};`, the `const` the next
  section needs — must be re-grepped for consumers and booted in the harness before the removal is
  called done; delete by function, not by geometry. And `pkill -f <name>` matches the killing shell's
  own command line, which contains `<name>`: kill by port (`fuser -k 8080/tcp`) or by pid file, or
  exclude with a character class — and remember the class does not protect you from the *other*
  occurrences of the literal string in the same command line.
- **A harness timeout measures the harness.** The story gate's 15 s `waitForRoute` on click-navigations
  began failing on a machine that renders WebGL in software: the page navigated fine, the poller lost
  the race, and the round spent its budget diagnosing a site that was healthy. Before treating a
  timing-out headless gate as a defect, reproduce the exact flow with a probe that prints the page's
  own state at timeout; if the site answered and the harness blinked, fix the budget (or the lifecycle
  event waited on: `domcontentloaded` plus a state wait, not `load` over abandoned subresources) and
  say so in the gate's comment.
- **A movement gate that passes once has measured one walk, not the walker.** `verify-collision`'s
  route through a page depends on the state its own earlier rams leave behind (a corner watch is
  skipped when the body already stands within 60 cm of it), and the lane's idle pulse can land a
  frame between two pumped ones — so two runs of the same page are two different approaches to the
  same geometry. Round 68's wedge appeared in one run of four and in none of the next six; a single
  green run is one sample, and the acceptance for a solver change is a loop (20 runs) *plus* the
  wide instrument (`.verify/_wedge.cjs`: every rail stop at 16 headings, the diagonal presses, every
  solid's four corners). And when a gate says a body stands still with a legal way out, print the
  solver's own decision (`_wedge2.cjs` patches `moveStep` in memory, one anchor at a time) instead of
  re-deriving its maths in the gate: the three defects that round closed — a creep step below the
  anti-flip-flop price, a clearance probe that clamped at the lane wall, and a push-out that landed
  exactly on the collision boundary the accept test asks about with a strict `<` — were all "the
  escape was legal, tested and refused", and none of them was visible from the outside.

- **A gate that fails half the time is reporting a defect, not noise.** Round 68 read `verify-walk`'s
  intermittent failure as flakiness and called 192/192 a pass. Round 69 closed the second window
  (two JSDOM lanes in one process halve each other's frame rate), and the failure stayed: the gate's
  guide was tapping a rail stop and the body never arrived. The glide probe (now
  `.verify/verify-rail.mjs`, which is that probe with assertions) published the glide's own state and
  showed it — x thrown between 206 and 343 at z 962, never closer to the stop, because a push-out
  counts as movement, so the detour never fired, and then because the detour kept aiming
  at the stop while it moved sideways, so every step was a diagonal back into the bay it was trying
  to avoid. A visitor who taps a stop chip was juddering in front of a planter. **An intermittent
  gate is a measurement with a hole in it: fix the hole (budget, lifecycle, contention) and, if the
  failure survives a correct harness, believe it about the product.** Never re-baseline an assertion
  to the flaky result — 192/192 was the flake being lucky.

- **A mention is not a user, and a gate is not a judge.** Round 76 kept a dead `.plate-navy` family
  because a comment called it "a documented fallback" and kept the plan-view strip because a comment
  promised it marked the seams; the owner's ruling is 「不是提到就不是垃圾」 — being named in a gate, a
  doc, a comment or a checklist does not make a thing live, and "I cannot be this conservative" is a
  direct instruction. Round 77 also found the opposite trap: `verify-walk` held four assertions about
  the album's full-screen viewer by reading the *stylesheet*, so they passed for five rounds and made
  259 dead lines look tested — deleting them turned the gate red, which reads as "you broke
  something". **Ask the DOM**: `.verify/verify-csslive.mjs` classifies every selector as LIVE /
  RUNTIME / DORMANT / DEAD (546 / 0 dead as of round 77) and the only one you may delete is DEAD;
  a DORMANT path must say which data it is waiting for, out loud, in `TODO.md`.

- **The unit rule, all of it:** only the depth axis converts — record `z` and `d` cross into walk
  space ×2.9 (`Z_SCALE`), while `x`, `y`, `w`, `h`, stop `--x` and every dataset passthrough field
  (ride/deck/dia/axle/period, stop view `h`) are scene centimetres as authored, unscaled, the same
  axes `data-lane-w` rides. Backdrop depths and `max_d` are also walk space as written
  (`street-system` §6). And an authored camelCase key must be emitted kebab-case: HTML lowercases
  attributes, so `rideX:` written out as `data-rideX` arrives as `dataset.ridex` — silently undefined
  at the reader. A mixed unit places the object inside the wall and no pixel gate will say why.
- **Before writing to the record line, ask who overwrites it next frame.** The lane's `say(..., "")`
  cycle clears `[data-walk-record]` every tick, so an announcement made at act()-level dies on the
  first pumped frame; anything meant to outlive an animation owns the `demoHold` protocol (set the
  flag, pump the whole envelope, clear both). And when a small object's change must be *seen*, measure
  the geometry the renderer stamps (`__walk.drawQuads`) or crop the object's own projected box — a
  full-frame average cannot see a 24 m leaf on a 980 px canvas, and a loose crop measures the room.
- **Pixel gates measure by state, not by stopwatch.** The sandbox renders WebGL at a fraction of real
  frame rate — a glide that is 20 seconds on a laptop crawls for two minutes here, and a three-second
  banner hold is gone before a fixed sleep returns. Wait for the engine's own published values
  (`__walk.depth`, `__walk.height`, the record line) and sweep animation envelopes for the loudest
  frame; asserting against a timer turns a working feature into a flaky gate.
- **Luma alone hides hue bugs; measure the channels against the other path's own frame.** A navy
  flood and a lamp-lit hall can share a luma — round 51's black-hall fix passed every luma floor
  while tinting every hall blue-violet (mean RGB 30,53,103 against the painter's 111,121,138), and
  the owner saw 紫色 for a round before anyone measured for it. A lighting gate therefore reports
  mean R/G/B and a cold/purple pixel fraction, measured against a reference frame of the same path
  (the previous committed render, or another view of the same scene) rather than a remembered
  constant — the cross-path comparison this rule was written from died with the Canvas2D painter in
  round 54. Two traps in taking any reference: `?v=<digest>` assets are cache-immortal, so aborting a
  module without `setCacheEnabled(false)` measures the tested code a second time and calls it a
  different path; and the renderer flag must be read in the same evaluation as the screenshot —
  read early, and `attachThree` races the read, so the frame is 3D while the label says otherwise.
- The cache-buster is **derived, not hand-bumped**: `VER` is the sha1 over the five files in
  `bin/asset-list.json` (`css/site.css`, `js/scene3d.js`, `js/games.js`, both pinned Three.js files) plus
  the four in `bin/site-sources.json`, truncated to ten hex digits; `bin/asset-ver.mjs` is the only
  computation outside `gen/site.py`, which reads the same two lists;
  the stylesheet, classic script and module script read that one value. It used to be a literal that a human had to remember, and it went stale the
  first time the renderer changed in a commit that forgot: new rooms, old `?v=`, and the only person
  who would ever see the bug is a returning visitor whose browser drew them with the last renderer.
  `verify-walk.mjs` now recomputes the hash from disk and fails if a page asks for anything else.
- Verification means the artefact the browser asks for. After a build, `curl` the served
  page and grep for the new markup and the pin. Pages already on disk make a crashing
  generator look healthy, so `python3 _gen_html.py` exiting 0 is a precondition for
  committing, not a nice-to-have.
- WebKit flattening is a CSS-3D concern for the Activities album, not the walkable renderer: the
  walkable lane and objects use Three.js alone, while `.ig-grid` is the only current
  `preserve-3d` selector and `.ig-wall` owns its `perspective`. Keep non-visible `overflow` off
  `.ig-grid`, keep `filter`/`backdrop-filter` off the perspective wrapper, and never add a universal
  `preserve-3d` rule. These can flatten the album silently in Safari while appearing fine in Chrome.
- Authoring a district (intake, record, build rules, gate) is a skill:
  `skills/district-author/SKILL.md`, with `skills/place-intake/` before it when the material is
  photographs of a real place, `skills/japan-place/` whenever the place is in Japan,
  `skills/street-commons/` for the hub street, a new promenade or anything that asks for daylight,
  and `skills/lane-prop/` for a single object, light or state inside one, `skills/landmark-space/`
  when one landmark object becomes its own walkable space, and `skills/grounded-scene/` whenever a
  scene recreates a real place and must feel nearly the same as being there (the owner's round-20
  fidelity rule). These scene-authoring skills live in `skills/` and **are tracked** — unlike
  everything under `.claude/`, which is local-only. Follow the matching one before doing the matching
  kind of work.
- **Installed agent practices are mandatory (owner request, 2026-10-14; workflow extended 2026-10-17):**
  before any non-trivial implementation, read `skills/karpathy-guidelines/SKILL.md` and
  `skills/pua/SKILL.md`. For every new or revised walkable environment, landmark, or substantial
  scene build, also read `skills/scene-system/SKILL.md`, `skills/real-place-builder/SKILL.md`,
  `skills/grounded-scene/SKILL.md`, and the matching domain skills above. Before the visual gate,
  read `skills/scene-quality-loop/SKILL.md`; before any PR is opened or updated, read
  `skills/pr-handoff/SKILL.md` and update `TODO.md` with a complete, prioritized plan for the next
  round. Before drawing a conclusion from a screenshot, a ray, a pixel statistic or a stop position,
  read `skills/frame-evidence/SKILL.md`; every number quoted from a frame comes through it. Before
  touching a tap, key, drag, reach, card, bar or **exit** (an overlay, the browser's back gesture),
  read `skills/walk-input/SKILL.md`; it owns the press model, the turn constants and the enter/exit
  history contract, and its probes (`_popup-audit`, `_turnprobe`, `_backprobe`) are the evidence.
  Before claiming that an **experience** is good — or that a press "was answered" — read
  `skills/ux-walkthrough/SKILL.md`: it owns the two-tier answer rule (a press shows you something, and
  only a thing with nothing to show may open text), the `press_verb` table, and the visitor's pass
  `.verify/_uxwalk.mjs` with its gate `.verify/verify-ux.mjs`. A green gate is not an experience. **Any
  round that discovers a defect class, a measured constant, or a new instrument must write or amend a
  skill in the same round** — read `skills/skill-authoring/SKILL.md`, add the `skills/README.md` row
  and the `SKILLS.md` routing sentence, and run `node .verify/verify-skills.mjs`. The agent's skills
  do not activate themselves; this rule and that gate are what make the habit automatic, so neither
  is optional. These are tracked project skills, not optional suggestions. Apply PUA as an evidence-first
  method—diagnose, change approach when stalled, inspect related effects, and verify the actual
  artifact. Do **not** use shaming, threats, fabricated performance reviews/KPIs, endless retries,
  or PUA as authority to bypass permissions, user constraints, safety, or tests. A scene is not
  visually complete until its required rendered objects and walkable stops have been inspected.
- **The hub is a street with regions on it, and that is the owner's brief** (2026-10-08): one street
  to walk, a region for Japan and a region for Toronto, and a door to each of the three main places.
  Owned landmark/sub-spaces are discovered through their real parent props, not added as more hub
  destinations. The street also opens onto the harbour in daylight.
- **The street is a day, and a record says so.** `"day": True` (or `{"cycle", "start", "gain"}`) on a
  district makes the page run its own clock and the renderer add the sun to every surface — the
  mechanism, its measurements and its four consequences are in `skills/street-commons` §3, and the
  per-quad vocabulary (`day: false`, `daygain`, `nolite`) is in `skills/lane-prop` §3. The two rooms
  whose subject is dusk simply do not ask for it, and their frames are unchanged by it. Daylight
  **cannot** be got by raising `SUN()`: `lit` tops out at a 28% wash over a tile that is a night
  value, which moved the street's whole-frame luminance by six points and looked like nothing.
- **The coast is decided and built (2026-10-09; quay detail completed 2026-10-13): the street ends
  at a harbour.** The owner asked for beach-or-harbour scenery in sunlight and then delegated the
  choice; the choice is harbour, because the street is likened to Moji Port and Moji Port is a harbour
  town, and one-point projection puts water only at the end of the walk. The street walks out onto a
  quay with a broken rail, a four-tread slipway, a ladder and six-metre mooring bollards; past it are
  depth-banded moving water, a ferry, gantry crane, breakwater and far shore (`bd.harbor`). The sky
  fills the open aperture in portrait and landscape. The beach was not built on purpose. The Japanese
  half is a shopping street now: `front` props with
  an `awn` colour are shops at eye level — awnings, fascias, noren, display glass — per
  `skills/lane-prop` §7. **Two traps from this round, both in the skills now:** record depths are
  ×2.9 into walk space but backdrop depths and `max_d` are walk space as written
  (`street-system` §6); and a record field the emitter does not stamp into a `data-*` attribute
  never reaches the renderer (`lane-prop` §7).
- **Process rule the owner directed (2026-10-09): build in one pass, verify in one pass.** It is
  `SKILLS.md` §7 now. Interleaving screenshots with building made this round slow; the batch at
  the end is the rule. Do not turn that into a second page and do not put
  the doors back into a chain: a region is a change of material, light and what is standing on the
  pavement, along the one spine, with a station that makes it a place worth standing in. The layout
  arithmetic is `skills/street-commons/references/street-system.md`.


## Mandatory PR handoff: update TODO.md first

**Owner request (2026-10-17): before every PR creation or update, first refresh `TODO.md` and
plan the next round's complete outstanding work.** Read `skills/pr-handoff/SKILL.md` before running
`gh pr create`, `gh pr edit`, or pushing commits intended to update an open PR. The file must reflect
the current diff, exact verification and visual-review evidence, limitations, and a prioritized
next-round task list with observable acceptance criteria; separate owner-input blockers from work the
agent can do. Audit all affected open items, and do not invent or omit tasks. Review the updated file
before committing or touching GitHub. Before merge, confirm the PR number, base, checks, diff, and
TODO state; report merge status only after GitHub confirms it.

**Owner ruling (2026-10-29, twice): 「那些紀錄都刪掉，我怕影響你判斷」 / 「我覺得都不需要」 — the
repository keeps NO round log, anywhere.** Not in `TODO.md`, not in an archive file, not in a skill's
"lessons" section. A finished round leaves three things behind and nothing else: the code, the gates
that hold it, and `TODO.md`'s current state (open work, rules, constants). Git history and the PR body
are the record of what happened; they are written once and never read as a plan.

Why this is a rule and not a preference: a record in a working file reads as *current evidence* to
whoever picks the file up next. Two rounds in a row were steered by exactly that — a performance
premise taken from a reading captured mid-glide, and a defect listed as open that had been fixed
several rounds earlier. A number is measured when it is used, or it is not used.

**All `*.html` pages are GENERATED by `_gen_html.py`.** Never hand-edit the HTML files —
your edits will be silently overwritten the next time the generator runs.

Workflow for any content or markup change:

1. Edit `_gen_html.py` (page bodies, nav, publication data, gallery entries live there).
2. Run `python3 _gen_html.py` to regenerate all pages.
3. Verify with `python3 -m http.server 8080` and check the affected pages.

Files you MAY edit directly:

- `css/site.css` — all styling. Nothing to bump: `VER` is derived from this file and every page-programme
  part on every build, and the harness fails if a page disagrees (see the cache-buster note above)
- `js/overlay.js`, `js/chrome.js`, `js/dot-game.js`, `js/site.js` — the page programme, in that load order
  (`bin/site-sources.json`). Add a new part by editing that one list, never the generated pages.
- `IMG/` — photos and assets
- `_gen_html.py` — the generator itself

## Layout

| Path | Purpose |
|---|---|
| `_gen_html.py` | Generator entry point: assembles the page bodies and writes every file. Run it after editing anything in `gen/`. |
| `gen/` | The generator's parts (round 78, a pure move): `site.py` (nav, footer, icons, `page()`), `content.py` (publications, projects, pillars, courses, the report's rows), `media.py` (the image registry and the wall), `world.py` (the surveyed worlds), `districts.py` (the district records), `render.py` (the lane's markup). Edit these, not the emitted HTML. |
| `index/about/research/teaching/activities/service/links/404.html` | Generated output. Do not hand-edit. |
| `css/site.css` | Single stylesheet, versioned via `?v=` query string |
| `bin/site-sources.json` | The page programme in load order: `overlay`, `chrome`, `dot-game`, `site` (see §Layout note below) |
| `js/overlay.js` · `js/chrome.js` · `js/dot-game.js` | Modal plumbing (134 lines) · page chrome (154) · the dot-trace game (218) |
| `js/site.js` | The lane: 9,045 lines, 288 declarations sharing one closure |
| `IMG/` | Portrait and gallery photos |
| `SPEC-gallery-3d.md` | **Not built.** The owner-facing proposal for a walkable Activities archive, written from a first-hand read of his reference site; read it before any 3D work or any change to the dependency rule |
| `.nojekyll` | Keeps GitHub Pages from running Jekyll — do not delete |
| `TODO.md` | Only what the next action needs: status, the hard rules, the gate list, the open work, the measured constants. **No round logs anywhere** (owner ruling, 2026-10-29); a finished item is deleted rather than narrated. Update it before every PR operation. |

Route a layout change through `skills/pure-move-split` (rounds 78, 86).

**Why the generator is split, and how far the script is (rounds 78, 86, measured).** `_gen_html.py` was
one 7,484-line file whose ordering was load-bearing: page bodies, the loops that fill them and the
records they read were interleaved, so a split had to be a *move* with a proof, not a refactor. It is
now an entry point plus six modules, and the proof is that all 19 emitted pages are byte-identical
before and after.

`js/site.js` was four top-level units in one file — page chrome, shared overlay plumbing, the dot-trace
game, and **the lane**. Round 86 split the first three out (`js/overlay.js`, `js/chrome.js`,
`js/dot-game.js`) and the proof is the same kind: the four parts joined in `bin/site-sources.json` order
are **byte-identical** to the 607,062-byte file they came from, and all four are still classic scripts
sharing one global lexical environment, which is why `verify-sources` fails on a top-level name declared
twice. They are *not* ES modules: every gate that reads the programme as text would have to be rewritten
around `import`, and `w.eval` into jsdom — how the fastest gate here (212 assertions) works — cannot
evaluate a module at all.

The lane stays one file on purpose. Its 288 declarations share one closure; cutting that at a file
boundary is not a move, it is an interface design plus 212 ported assertions plus a browser-driven gate.
So: **the programme is split into four, the lane is not** — do not "finish" it with a cosmetic cut that
leaves a 9,000-line file behind.

Reference photographs (`image-search/`) are deliberately **not tracked**: their sources are
untraceable, so they stay on the working disk for human comparison only. The same rule covers any
photograph the owner sends; the repository keeps code, documents, generated HTML, and the pinned
runtime only.

## Reference packs the design work leans on

Three third-party skill packs inform the display work and are **not** vendored here (no `package.json`,
no committed `node_modules`, same rule as every other dependency): `Owl-Listener/designer-skills`
(111 skills: research, systems, IA, UI, interaction, prototyping and testing, ops, visual critique),
`julianoczkowski/designer-skills` (the process flow: requirements → brief → information architecture →
tokens → tasks → generation → review), and `anthropics/skills` (notably `webapp-testing`). A sandbox that
wipes `.claude/` should re-fetch them with `git clone --depth 1 <repo>` and read only the SKILL.md files
that match the complaint being chased — a heuristic evaluation, an affordance critique, Fitts's law —
rather than loading a hundred files. Their conclusions that reached this code are written into
`SPEC-gallery-3d.md` §23 with the severity each one was rated.

A fourth reference is not a skill pack but the nearest thing to a sister build of ours:
[`Kenton-GMI/sakura-crossing`](https://github.com/Kenton-GMI/sakura-crossing) — an explorable
Japanese suburban neighbourhood in three.js, 56k lines, MIT, twenty-six districts, no people in it
and not one image asset. It was read for the Japan rooms and written up in
`skills/japan-place/references/sakura-crossing.md`; read **that** note before re-cloning, because it
records what may be taken (the object vocabulary and its measured proportions, the one-moment rule,
the flood-fill waypoint probe, and a refusal list that arrived at nearly the same place ours did)
and what may not (its signage system, which paints an invented Japanese string on every surface —
legitimate for a fictional town, forbidden in a scene here — and its npm/Vite/three.js stack, which
was not a precedent for the dependency rule). The owner later approved a separate, pinned Three.js
runtime for walkable-world rendering on 2026-10-16; that does not license the sister build's other tooling.

A selective 2026-10-17 survey of agent `SKILL.md` workflows for Three.js scenes, game environments,
visual QA, and plan/PR handoff lives in
`skills/scene-quality-loop/references/upstream-practices.md`. It records reviewed commits, licenses,
what was adopted, and why MCP/CDN/API-key pipelines, project-specific score thresholds, and unlicensed
skill packs were not installed. It is a research ledger, not an additional runtime dependency; the
repo-specific workflow and owner constraints remain authoritative.

## Operational notes (2026-08)

- **GitHub Pages can silently turn off.** On 2026-08-23 the live site returned GitHub's
  "Site not found" 404 because Pages had been disabled in repo settings (no action in the repo
  caused it; the last successful deploy before that was 2026-08-13). Integration/app tokens get
  HTTP 403 managing Pages via API — re-enable it **manually**:
  Settings → Pages → "Deploy from a branch" → branch `master`, folder `/ (root)` → Save.
  The merge/push then triggers the `pages-build-deployment` workflow automatically.
- **Contact email.** The site's contact email is `k43122003@gmail.com` (set in `_gen_html.py`;
  hero + footer social icons — both `mailto:` occurrences). The old
  `mailto:your.email@example.com` placeholder was replaced on 2026-08-31. If the owner changes
  it, update every `mailto:` occurrence. `VER` looks after itself. (Ask the owner to
  double-check the spelling once — it was supplied in a form.)

## Backlog — pending owner input (2026-08)

Owner will send materials later; **do not fabricate** any of this. When the asset/value lands,
edit `_gen_html.py` (+ add the file under `IMG/` if a download), rerun `python3 _gen_html.py`,
and keep the detector at 0 findings — `VER` is derived, so there is nothing to bump.

**A street that is a place to walk, with regions and a coast — asked 2026-10-08, decided and built
by 2026-10-09, its night authored 2026-10-10.** The owner's brief — one street, a Japan region and a
Canada region, a door per room, coast views in sunlight — is the state of `street.html`: the record
says `"day": True`, the far end walks out onto a quay at a harbour (`bd.harbor`), the Japanese half
is a shopping street (`front` + `awn`, `skills/lane-prop` §7), and the sun is an authored moving
shadow system (`street-commons` §3). The three decisions this backlog once left open were all taken:
the day is a per-page clock starting before noon; the water is a **harbour**, because the owner
likened the street to Moji Port and a one-point projection puts water only at the end of the walk;
the regions are changes of material, light and furniture along the one spine, not new pages. What
the seventeenth round added is the night the day had been hiding: a lamp now reads three ways after
dark — halo, body, pool on the pavement — shopfronts spill their window light across the threshold,
and every front and lantern carries a staggered `liton`, so the evening arrives as a wave
(`street-commons` §3, "the night rhythm"). The same round found the one lie in the shadow system's
history — the wall's floor shadow had been `add()`ed after the emit pass and was never painted; the
light pass draws it now. The probe that used to prove it (`_shadowdrawn.mjs`) measured the painter's
pass order and was retired with it in round 54; the claim is now held by the scene's own geometry,
which receives every quad `add()` returns without a second pass to fall out of.

Unrelated to the above and still open:

1. **English CV / PDF download link** — owner will provide the CV file (place at repo root as
   e.g. `HuaXu_Zhong_CV.pdf`). Add a download link in the hero actions (or About), styled with
   the existing `.btn` system. International search committees want a one-click CV.
2. **ORCID iD link** — owner will provide their ORCID URL/id. Add to hero + footer social icons
   (define an ORCID inline SVG icon in `_gen_html.py`, Heroicons style), next to Scholar/email.
3. **Done 2026-10-10** (under the owner's blanket go-word): Research now carries a data-driven
   glance strip above the publication filters — corresponding-author count, the NSTC
   study-abroad period, and the international houses — every value computed from `pubs` and
   `projects`, nothing asserted that the records do not already say.

Context: owner is an NSTC postdoc (2025–2028) exploring international opportunities; these three
help an international reviewer verify them quickly. Career actions (networking, conferences,
applications) are the owner's own, not site tasks.

## Interactive: the dot-trace game

The nine panels on `thinking.html` are a playable memory game, not a gallery — do not
reduce it to static figures. Content lives in `GRID_CELLS` (`_gen_html.py`); all behavior
lives in `js/site.js` (the `[data-dot-*]` block). Contract to keep intact, in that order:

- Path length encodes difficulty: `PATH_LENGTH` maps Act I/II/III to 3/4/5 dots.
- The dialog is `<main>`-nested, so `inertOutside` walks the ancestor chain; the Tab
  trap is its fallback, not the whole thing. Both must run on open *and* close.
- Dot numbers are `::after` content, which assistive tech may not read — `data-n` and the
  dot's `aria-label` are set together in `numberPath()`. "Show me the path" is the
  screen-reader route into the game.
- Playback has a `prefers-reduced-motion` branch; keep it when touching `watch()`.
- Verify by playing panels 1, 5, and 8 (one per act) at `python3 -m http.server 8080`, and
  keep the detector at 0 findings. No test framework or package-manager runtime; the approved vendored
  Three.js exception is limited to walkable-scene pages.

## Interactive: the photograph wall (activities.html)

Round 77 deleted the album viewer that used to be described in this section: a full-screen plate with
a roll, arrow buttons, a position count and a named view transition, 259 lines of CSS and 189 of
`js/site.js`. It had never emitted a single element — a plate needs a caption and a date, and no
classroom photograph has ever been given either — and four assertions in `verify-walk` passed for five
rounds by reading the *stylesheet* instead of a page. What ships is the wall and nothing else, and the
contract that remains is short:

- **A tile is a `<figure class="ig-tile">`: the photograph, and the line that says what it is.** Its
  `alt` carries the same words for a reader who never sees the picture. There is no link, no second
  surface, no `data-ig`, and no `#ig-plate`; do not add a viewer back without photographs to view.
- **A block with nothing to hang keeps its heading and its reason** (`Nothing in this block yet` plus
  the count of what is held), because an archive that silently omits a shelf is indistinguishable from
  one that never had it. A `record` image is not shown until it has a caption with a venue and a date —
  do not add a placeholder photograph or a "forthcoming" promise to make a block look full. If you do
  date one, `.verify/verify-csslive.mjs` flips the wall's five rules from DORMANT to LIVE; if it stays
  DORMANT for another year, that is the answer to whether it should exist.
- **Required assets fail the build.** A place card's cover (`IMG/{id}-cover.jpg`) and a principle row's
  illustration are checked by the generator now; the "No cover yet" card and the typographic `.plate`
  fallback are gone with the states they designed for.
- **No watched state.** Nothing may be marked seen, nothing expires; a count is a position, not a
  countdown.
- Sizes come from the file: `poster_attrs()` reads the JPEG header so the grid cannot shift, and
  `loading="lazy"` stays on the images.
- `inertOutside` / `trapTab` / `enterOverlay` / `leaveOverlay` are the site's shared overlay plumbing;
  the dot-trace game and the lane's card and story plate use them. Keep them shared.

## Interactive: the lane's display and the story plate

- **A state is geometry.** Props that can be used carry `states` in the district record and their light
  is addressed by `of: "<prop id>"`, so a stop changes a quad and a brightness, never only a caption;
  nothing in the space is animated by a clock of its own (`T` is sampled once per frame and read by the
  body, the cord, the glow and its reflection), and the idle pump drives the tick rather than a bare
  repaint so a glide finishes even while the lane is resting. Do not answer "where are the interactive
  things?" with a tooltip or a label on the display.
- **A room needs a way out, and a target needs an area.** The exit is authored (`"leave"` on the doorway
  prop → `data-leave`; `data-walk-exit` in the chrome reads the same href) and `Esc` unwinds the plate,
  then the list, then leaves. Press areas have a 44 px floor while the visible ring keeps the object's own
  silhouette (`--padx/--pady`), HUD rows are `pointer-events: none` with the controls opting back in, and a
  tap that did not become a drag is a press. These are not polish: an invisible overlay and a class deleted
  two rounds ago made the lane unclickable and the exit a description of an exit, and 130 jsdom assertions
  passed it — because jsdom has no hit-testing. Anything about landing a click is `.verify/browser-check.py`'s.
- **A story is the screen.** `#room-plate.is-rail` is full-format (`100dvh`, no radius, no shadow, no
  `pop`, media `contain`ed, duplicate headings visually hidden) and it fills the remainder with a
  blurred copy of its own frame — the one ground in the site that is made of the picture it shows. Do
  not "unify" it with anything, and do not strip the panel's own dark `background`: a caption's
  contrast is measured against it. Every pointer gesture in the site ignores `event.button !== 0`,
  `contextmenu` is refused only while a drag is live, and `auxclick` is blocked for the middle button
  alone.
- **The head-up display wears no words.** Everything textual in the lane's chrome is folded into an
  icon button that opens `data-walk-card`; the status and record lines remain only as `.sr-only` live
  regions, the station rail is ticks whose heights come from each stop's authored `--p` depth, and even
  the view controls are glyphs of the site's own icon set rather than `−`/`+`. `verify-walk.mjs` asserts
  that no node in `.walk-hud` has text of its own — do not "improve" discoverability by putting a label
  back on the space. Round 77 removed the plan-view strip (three spans, 15 lines of JS, two `zones`
  tables) that used to sit in that chrome: round 72 had already cut its four CSS rules while its own
  commit message cited the strip as the surviving indicator, so for five rounds it was DOM nobody could
  see. A progress indicator is a design decision, not a repair — do not restore it by adding CSS.
- **The space wears the atmosphere; the view only frames it.** Wall materials, ground markings and
  hanging lights are emitted as scene islands (`data-walk-surfaces`, `data-walk-marks`, the
  lantern entries in `data-walk-lights`) and painted from tiles the renderer draws in code. Every
  depth in a district record is authored in record centimetres — objects, lamps, wires, stations, and
  these islands alike — and the emitter is the one place that scales them by `Z_SCALE`; a depth that
  skips the emitter lands in the wrong space (Canada's and Fukuoka's walls once stopped at the
  record's own `d` while their objects ran on to `walk_d`). Nothing may
  be lit by a source the data does not name, nothing may be dressed with a photograph of somebody's real
  street, and no surface carries invented lettering — the blank folding board is that assertion.
- **Depth in the lane stays WebGL, everything else stays DOM.** The Three.js decision (owner,
  2026-10-16) is scoped to walkable environments; the page's own figures and the story plate's frames
  remain CSS transforms, not reconstructed 3D geometry.

## Design system

`DESIGN.md` documents the committed visual world ("the journal cover": navy plates, warm paper,
amber accents, Newsreader/Source Serif 4/Archivo). Read it before any styling change and keep
new work inside that world unless the user asks for a redesign.

**Design detector.** `.impeccable/config.json` (tracked) holds the repo-wide impeccable
detector policy: it waives the generic SaaS/AI-template rules that fire on purpose because they
describe this world (cream paper, amber hairline rules, navy plate shadows, editorial eyebrows,
etc. — each documented in `DESIGN.md`). Run it over the stylesheet and every page and keep it at **0 findings**:

```bash
node node_modules/impeccable/cli/bin/cli.js detect --json css/site.css $(ls *.html)
```

Fix objective defects (contrast, heading order, sub-11px functional text, broken/placeholder
images) in code — never silence them via the config. The tool comes from `impeccable@4.1.0` on npm,
installed **without** `--save` so no `package.json` enters the repo: `impeccable install` cannot
fetch its bundle from this sandbox (TLS), so `npm i -D impeccable@4.1.0` is the working path, and
`node_modules/` is gitignored either way. A rule disappears from the baseline only when the thing
that caused it is deleted — the waiver for `repeating-stripes-gradient` was removed together with
the `.walk-canvas::after` overlay it described, not left behind as a rumour of a defect.

## Skills

Two homes, and which one a skill lives in says who owns it:

**`skills/` — this repo's own craft, tracked in Git.** They are part of the artefact, the way
`SKILLS.md` is: they encode what this project has already paid for, so a change to one is a repo
change and gets committed with the work that motivated it.

| Skill | Path | Use when |
|---|---|---|
| **scene-system** | `skills/scene-system/SKILL.md` | Starting any new place, or when the scene skills' order is unclear: the eight-phase pipeline that conducts place-intake / grounded-scene / district-author / landmark-space / lane-prop / street-commons, the renderer contract, the proven idioms with their numbers, the critique failure table, and the gate battery. Read first, then the phase skills. |
| **real-place-builder** | `skills/real-place-builder/SKILL.md` | Building or substantially revising any grounded walkable place, district, or landmark; translates evidence and the repository's records into an implementation and acceptance plan. |
| **scene-quality-loop** | `skills/scene-quality-loop/SKILL.md` | Final visual review after a substantial Three.js environment, object, camera, or renderer change; captures settled route/prop views, separates visual critique from mechanical gates, and requires recapture after fixes. See its upstream survey for selected methods and refusals. |
| **ux-walkthrough** | `skills/ux-walkthrough/SKILL.md` | Whenever a press, bar, card, panel, reel, drawer, prompt or label changes, or the owner says 操作、體驗、彈出、很煩; judges the experience by what the press changes on the screen, keeps text for the `read` verb alone, and runs the visitor's pass (`_uxwalk`) before anyone claims a walk page feels right. |
| **pua** | `skills/pua/SKILL.md` | Non-trivial implementation, repeated failure, stalled diagnosis, or any task requiring complete end-to-end verification; evidence-first and root-cause oriented. |
| **karpathy-guidelines** | `skills/karpathy-guidelines/SKILL.md` | Non-trivial code changes: keep the implementation simple, surgical, and grounded in the actual repository. |
| **pr-handoff** | `skills/pr-handoff/SKILL.md` | Before every PR creation/update and before merge; requires `TODO.md` to state the current open work accurately before GitHub operations, and forbids writing a round log. |
| **district-author** | `skills/district-author/SKILL.md` | Adding or changing a district (a place whose frames, objects and clips hang in one lane), when the owner asks for "3D" or a stories-style viewer, or before choosing any renderer for one. |
| **place-intake** | `skills/place-intake/SKILL.md` | The owner supplies photographs of a real place — a trip, a site, an alley they walked — and it is to become a room. Runs before `district-author`, before any geometry is written. |
| **japan-place** | `skills/japan-place/SKILL.md` | The place is in Japan: Tokyo, 福岡/Moji, 屋台, 商店街, 踏切, 参道, 提灯, 自動販売機. Carries the object table with real centimetres (`references/japan-vocabulary.md`) and the sakura-crossing study note (`references/sakura-crossing.md`). |
| **lane-prop** | `skills/lane-prop/SKILL.md` | One object, light, state or stop inside an existing district: the `SHAPE`/`OBJ_SIZE` registers, the id-prefix naming rule, `Z_SCALE`, `glow`/`of:`, `states`/`leave`, and the measurement that closes it. |
| **street-commons** | `skills/street-commons/SKILL.md` | The street the rooms stand on: a second street or a new region along the hub, seaside/promenade/harbour/riverbank work, a commercial strip, **and anything that asks for daylight ("有太陽", 海邊, 港, 沿岸, 運河, 商店街)**. Carries the palette-and-sun constraint that makes a sunlit street a stylesheet decision rather than a scene one, and the arithmetic of opening one side of a lane. |
| **landmark-space** | `skills/landmark-space/SKILL.md` | One landmark object becomes its own walkable space (CN Tower as a room, not a miniature), and the owner's link contract: press the prop, the IG-story plate opens first, an enter-the-space action beside it. Use when a prop should own a district, when the subject is one tall or huge object, or for the beauty gate on any 3D space. |
| **walk-input** | `skills/walk-input/SKILL.md` | Any change to a tap, key, drag, reach, card, bar, stop or exit, and before claiming a control "feels right": the press model (the picture is look-only, the bar is the verb), quiet-versus-dead, the real-time turn contract (85 deg/s, 3 deg a tap, 0.065 deg/px), the enter/exit history contract (Back folds a surface before it leaves a place) and the probes (`_popup-audit`, `_turnprobe`, `_backprobe`) plus the gates (`verify-overlay`, `verify-exit`) that measure all of it. |
| **grounded-scene** | `skills/grounded-scene/SKILL.md` | Any experience scene (體驗場景) that recreates a real place and must feel nearly the same as being there — the owner's round-20 rule. Carries the ladder of evidence (owner's photos → official material → satellite/map → Street View/panoramas → photographs), the measurement table, the fidelity contract (details shrink; sequence, scale, sightlines and distinctive geometry must not), and the fidelity gate. Runs under `district-author`/`landmark-space`, never instead of them. |

**`.claude/skills/` — third-party skills, local-only, gitignored** (not tracked in this repo; the
74k-line skill payloads were deliberately untracked in `3e2ccbc`). Load the relevant `SKILL.md`
before doing the matching kind of work. `bin/restore-env` re-installs `skill-creator` — plus
`frontend-design` and `theme-factory` — when the sandbox has wiped `.claude/`; the rest come from
the sources below.

Reinstall sources:

- `skill-creator`, `frontend-design`, `theme-factory` — copy from [anthropics/skills](https://github.com/anthropics/skills) `skills/<name>/`
- `impeccable` (+ subagents in `.claude/agents/`) — `npx impeccable install` or copy `.claude/` from [pbakaus/impeccable](https://github.com/pbakaus/impeccable)
- productivity set (`grilling`, `grill-me`, `handoff`, `teach`, `to-questionnaire`, `wait-what`, `writing-for-agents`) — copy from [mattpocock/skills](https://github.com/mattpocock/skills) `skills/productivity/<name>/`

### Authoring a skill: when skill-creator runs

`.claude/skills/skill-creator/SKILL.md` is the harness for writing and improving skills, and the
decision to run it is the agent's to make — not the owner's to remember. Watch for the *work*
implying it, which is the case that gets missed, as much as for the words:

- the owner says so — "把這個做成 skill", 新增/修改 SKILLS, 「記下來給下一個 session」, "this keeps
  happening", "write it down somewhere";
- **a lesson has now been paid for twice** — the same trap re-derived, the same correction made in a
  second session, the same number re-measured from scratch because nobody wrote it down;
- a workflow had to be reconstructed from the code that a checklist should have handed over;
- the same kind of change is being asked for in a second place, so a one-off is generalising into a
  craft;
- an existing skill is being edited at all — read it first, and run the loop rather than patching it
  from memory.

Then do the job the skill describes: capture the intent, draft or edit the SKILL.md, and let the
description carry the trigger — it is the only thing an agent sees before deciding to open the file,
so it names the concrete situations and objects, not the skill's philosophy. Keep the body under
~500 lines and put the depth in `references/` (a table too long to read every time), `scripts/`
(deterministic steps a future session would otherwise re-invent) and `assets/`. Explain the *why*
behind each instruction: a rule whose reason is on the page survives being read by someone with
less context than the person who wrote it, and this repo's skills are read by exactly that person.

Two caveats about this sandbox, and both get said out loud rather than quietly skipped.
skill-creator's test half spawns subagents and calls `claude -p` for description optimisation, and
there is no `claude` CLI here, so the draft → test → review → improve loop runs as draft → validate
→ put it in front of the owner; no benchmark is reported, because none was taken. And
`quick_validate.py` needs PyYAML, which is one `pip install --break-system-packages pyyaml` away and
does not persist with the workspace:

```bash
python3 .claude/skills/skill-creator/scripts/quick_validate.py skills/<name>
```

It checks the frontmatter keys, the kebab-case name, and the 1024-character description ceiling —
the mechanical half. The other half is the review the owner gives: a new skill or a rewrite is a
proposal until they have read it, and the loop is not finished until they have.

### Design & frontend

| Skill | Path | Use when |
|---|---|---|
| **impeccable** | `.claude/skills/impeccable/SKILL.md` | Primary design skill. Any UI design, redesign, critique, audit, polish, typography, color, motion, a11y, or responsive work on this site. Sub-commands (`shape`, `critique`, `audit`, `polish`, `bolder`, `quieter`, `typeset`, `layout`, …) each have a playbook in `.claude/skills/impeccable/reference/`. Subagent definitions in `.claude/agents/`. |
| **frontend-design** | `.claude/skills/frontend-design/SKILL.md` | Aesthetic direction for new UI: distinctive, non-templated visual choices, typography pairing, avoiding AI-generated design tells. Complements impeccable. |
| **theme-factory** | `.claude/skills/theme-factory/SKILL.md` | Applying a cohesive color/font theme. 10 preset themes in `.claude/skills/theme-factory/themes/`; showcase in `theme-showcase.pdf`. Show options and get explicit user confirmation before applying. |

### Productivity (Matt Pocock)

| Skill | Path | Use when |
|---|---|---|
| **grilling** | `.claude/skills/grilling/SKILL.md` | User wants a plan/decision stress-tested with relentless questions |
| **grill-me** | `.claude/skills/grill-me/SKILL.md` | Explicit invocation only: interview to sharpen a plan or design |
| **handoff** | `.claude/skills/handoff/SKILL.md` | Explicit invocation only: compact the session into a handoff doc |
| **teach** | `.claude/skills/teach/SKILL.md` | Explicit invocation only: teach the user a concept in this workspace |
| **to-questionnaire** | `.claude/skills/to-questionnaire/SKILL.md` | Explicit invocation only: turn an unanswerable decision into a questionnaire |
| **wait-what** | `.claude/skills/wait-what/SKILL.md` | Explicit invocation only: re-pitch a message that didn't land |
| **writing-for-agents** | `.claude/skills/writing-for-agents/SKILL.md` | Creating/editing skills, this AGENTS.md, or any agent-consumed doc |

### Meta

| Skill | Path | Use when |
|---|---|---|
| **skill-creator** | `.claude/skills/skill-creator/SKILL.md` | Creating, editing or measuring a skill — see "Authoring a skill" above for when to run it unprompted. Holds `scripts/quick_validate.py` (frontmatter, kebab-case name, description ceiling) and `scripts/package_skill.py` (bundles a skill into a `.skill` file). |

## Working with the user

- The user communicates in Traditional Chinese (繁體中文); reply in kind. Site content stays in English.
- Ask the user **decision-level** multiple-choice questions (direction, scope, trade-offs). Do NOT ask about
  low-level technical details — infer those from the codebase and the decisions already made.
  If the user delegates a question back ("你推理"), decide it yourself with stated reasoning and finish the work.

## Conventions

- Keep the static site free of package-manager installs and build tooling: no framework, no `package.json`,
  and no `npm run build`. The sole approved runtime library is the pinned, vendored MIT Three.js 0.186.1
  for all walkable-scene geometry and objects; it is dynamically imported on each walkable page, and
  consumes `backdrop.world.prims` when present; a browser that refuses WebGL gets the lane's own
  written refusal, never a second painter (`verify-nowebgl.mjs`). Do not extend
  that exception to the Activities album or add another dependency without approval.
- Preserve accessibility features already present: skip link, `aria-*` attributes, semantic landmarks.
- Inline SVG icons (Heroicons-style paths) are defined in `_gen_html.py`; add new icons there.
- Commit generated HTML together with the `_gen_html.py` change that produced it.
- **A skill in `skills/` is a tracked artefact, so the table above is part of the change.** Add the
  row, and the pointer from whichever skill or doc should have led to it, in the same commit as the
  SKILL.md — a skill nobody is told about is a file, not a skill. `bin/` scripts count too: they are
  the repo's own tooling and they carry their reasoning in comments, like everything else here.

- **`IMG/` is a registry, not a folder.** Every raster is assigned to a block by `IMG_RULES` in
    `_gen_html.py`, and the block's kind decides what the image may claim: `record` needs a venue and
    a date before it is shown, `generated` is labelled generated wherever it appears, `figure` stays
    inline with the argument that cites it, and `unfiled` is held by name with the reason printed. A
    file that matches no rule and a rule that matches no file both stop the build with a non-zero
    exit, so the partition cannot rot. Do not add an image to a page before adding it to the
    registry, and do not classify a new block as `personal` or `academic` without writing down what
    it is for — the same rule that governs a district governs the picture of one.

- **The walkable pages have a hub, but not every page is a destination.** `ROOMS` in `_gen_html.py`
    registers every walkable page, street first. `street.html` carries doors only to the three main
    places — Toronto, Tokyo and Fukuoka. A landmark or owned sub-space has its own row/page but is
    reached only from the real parent object or doorway; it gets no hub door and no top-level album
    card. A child exit names its owner and `#at-<prop-id>` so the visitor returns beside the object
    that revealed it. Main rooms return to the street at their own `#at-<room-id>` door. The street's
    own back door opens the album. There is no onward chain between main places, and a `way-on` door
    anywhere is a regression. Never stack open districts on one page: the renderer reads one island
    per key. Adding a main place means a `ROOMS` row, record, page, one hub door and one Field notes
    card; adding a real owned space means its row/page, parent prop/door and parent return anchor —
    never a fourth album card. `skills/place-intake` is the checklist.

- **Field notes is fixed to the three original destinations, forever:** Toronto, Tokyo, Fukuoka.
    Its one `data-place-cards` container has exactly those three cards in that order. The CN Tower,
    Niagara Falls and Journey Behind the Falls are child spaces discovered inside their owners, not
    standalone cards. Every child scene must still reproduce the real environment it names; do not
    substitute a generic room or invent another destination. Sub-area plates — the gate, stall row,
    lanterns — are different again: they are frames *inside* their room, one per named slot
    (`PLACE_TITLES` + the room's slot list; `verify-walk.mjs` asserts every frame title is a slot).
    A new main place is a row in `ROOMS`, a record in `DISTRICTS`, a hub door, a Field notes card and a
    gate run; a child space is owner-wired and has no card. `skills/place-intake` walks through both.

- **Reference photographs never ship.** The owner's photographs of a real place live in `ref/`
    (gitignored) and are read, not published: what hangs on the wall is a generated plate, and what you
    stand in is built from what the photographs show. `IMG/` is a registry and every file in it must
    match a rule — putting a personal photograph there would pull it onto the album wall.

- **The walk pages are shells, not articles.** The street and every room are built by `shell_page()`:
    no nav, no footer, no `reveal`, and the reading material lives in a drawer that ships open and
    is folded by JS. Adding a section, a `reveal` class or a navy drawer surface is a defect: it can
    hide content without scripting or drop borrowed components to 2:1 contrast. The lane, props and
    sourced outdoor world are rendered in the pinned Three.js scene with the authored box
    (`data-lane-w/-d/-ceil`, `data-eye`). There is no second picture: the Canvas2D lane painter was
    deleted in round 54 on the owner's ruling, and where WebGL is absent the lane says so **in the
    viewport it cannot fill** (`[data-walk-offline]`, round 55) and retires — the compiled state
    (rail, list, reading, keys) keeps answering without it, and the projected prop buttons stand
    down because a projection onto no picture is a card floating in a void.
    No Canvas2D lane painting may return to `js/site.js`. Do not put scene geometry into CSS
    transforms or invent a second set of dimensions in `js/site.js` or `js/scene3d.js`.

- **A gate that re-derives what the site derives, measures its own approximation.** Where the site
    inferred a prop's shape kind from its id (`kind: el.dataset.obj` plus a prefix heuristic), the
    audit gate copied the inference — and when new names arrived that did not fit the convention,
    both the site and the gate went wrong together and the mismatch between them looked like noise.
    Name the channel once (the emitted field), have the renderer, the generator and every gate read
    that channel, and let convention only ever be a fallback clearly labelled as one.

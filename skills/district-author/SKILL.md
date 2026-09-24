---
name: district-author
description: Author a themed walkable district for the huaxu site — intake questions, the record shape, the build rules, and the verification gate. Use when adding or changing a district (a place whose frames, objects and clips hang in one lane), when an owner asks for "3D" or a stories-style viewer on this site, or before choosing any rendering library for it.
---

# Authoring a district

A district is one themed space: a lane of a few planes, some interactive objects, and the
frames that belong to it. It is not a gallery with a camera bolted on, and it never replaces
the list.

Work in this order. Do not skip the intake, and do not start with a library.

## 0. Is there material?

If the district comes from the owner's photographs of a real place — a trip, a site, an alley they
walked — run `skills/place-intake` first. It reads the space off the pictures, decides whether the
place earns one lane or several, tells you where the reference photographs live (they are read and
never shipped), and hands you back a record. Building directly from photographs without that step is
how a room becomes a backdrop: this skill knows how to build a place, that one knows what the place
was.

## 1. Intake — ask before you build

Ask the whole frontier in one round, numbered, each with your recommended answer. Two
answers are blocking and cannot be invented by you:

1. **Kind.** `personal` or `academic`. This is the set of claims the space may make, not a
   label. Travel is personal; a talk, workshop or school visit is academic.
   - personal: generated imagery allowed throughout, nothing may read as a record of
     attendance;
   - academic: every frame carries a venue and a date or it is not shown, and generated art
     may not stand in for evidence.
2. **Purpose.** One sentence, printed on the picker card next to the kind.

Everything else (sightlines, which objects, how deep the lane is) is yours to decide and
state with reasons — that is what the owner pays you for. Finding facts is your job: never
ask the owner what the tools can tell you.

A district with an undeclared kind renders as **shut** (`Purpose not declared`, `Not open
yet`). An honestly locked door is cheaper than a confidently wrong one.

## 2. The record

`DISTRICTS` in `_gen_html.py` — id, label, kind, purpose, status (`open` | `soon`), blurb,
objects, frames, slots. Geometry in px with CSS' handedness: `x` across the lane, `z` depth
(positive is farther; the stylesheet negates it), `y` is the object's **bottom** above the
floor line, `ry` turns it to face down the lane. The eye never moves: `.room-world` is
translated and rotated the other way, so there is no projection math, no loop, no library.

Clamps are design, not limitation: yaw ±35°, pitch ±10°. Past that the walls stop covering
the viewport and the room shows its own edges. Turning is drag, never Pointer Lock —
Pointer Lock is unsupported on every iOS Safari and it hijacks the cursor.

## 3. Build rules

- Edit `_gen_html.py`, `css/site.css`, `js/site.js` only. **Never hand-edit `*.html`.**
- One `VER` constant feeds both `?v=` tags. Never reintroduce a per-file literal: a stale
  pin ships invisible changes to every visitor with a warm cache.
- Every frame is three surfaces from **one** record: a wall object, a captioned list row with an
  anchor and a `Play from here`, and a rail figure. Counts must stay equal; assert it in the
  harness.
- A district **is** its page: `shell_page()`, viewport owned by the space, no doorway to click, no
  nav or footer, and the CV reachable by one link in the HUD. If a district becomes a figure inside
  an article, it has failed the brief regardless of how correct the geometry is.
- The HUD carries the words; nothing writes prose into the scene — wall objects are `<button>`s
  with no text at all, named by `aria-label`, so there is no caption to hide and no nested `alt` to
  concatenate into the name. Reading material lives in a drawer of `var(--bg)` that ships open in
  the HTML and is folded by JS — so the page is complete without scripting, prints as a list, and
  never re-tints a borrowed component to stay legible.
- Geometry is metric and **authored once**: `EYE = 168`, `1px = 1cm`, `LANE_W/2` walls with the walk
  clamp 30 cm short of them, `LANE_CEIL` for the roof, and depth scaled by `Z_SCALE` in the generator
  so the record keeps its authored numbers. The generator writes those onto the layer as
  `data-lane-w/-d/-ceil/-back` and `data-eye`; the renderer reads them. Do not restate them in CSS
  transforms or in a second set of constants — six CSS planes were a picture of a room, not a room,
  and the owner sent that back twice.
- The scene is a canvas raster: one projection, walls in 60 cm panels, affine-textured tiling
  patterns, quads painted far-to-near, fog and light as distance functions of the same transform.
  No library and no WebGL.
- Lighting is part of the model, not a coat of paint: one `AMBIENT`, one `FOG_MAX`, and every wall,
  floor and prop lit by `lightAt()` — the falloff of the same `lamps` list the glows and the wet-floor
  reflections are drawn from. Never brighten a surface by hand, or it glows where nothing shines.
  Materials are mid-tone (a lit alley reads at L*20 and up, not black), exhibits keep most of their
  own contrast under the haze, and `prefers-contrast: more` lifts the exposure. The harness asserts the
  luminance of the materials and the ceiling of the murk, so a slide back toward dark fails loudly. A texture comes from `data-tex` on the object; the pattern tiles are drawn
  at boot, because a stretched stock photo on a wall is the one lie this renderer tells easily.
- Motion is one rAF loop that stops when nothing moves, and it writes pixels rather than styles.
  `−`/`+` change the field of view (the focal length), never a scale factor, and never resize the
  canvas. Reduced motion drops bob and jump but keeps the walk. With no 2D context, `boot()` says so
  in the status line, opens the drawer and leaves the district readable — the reference's own move.
- Keyboard verbs print only under `(hover: hover) and (pointer: fine)`; every one of them has a
  twin that a thumb can press (the pad, `Jump`, the stop chips, tapping the object itself).
- HUD text floors at 0.76rem and every colour pair is checked against the surface it actually sits
  on; the drawer is the site's own paper precisely so that `.when`, `.badge` and `.slot` never have
  to be restated for a second background.
- Image dimensions come from the file's own JPEG header. If it cannot be parsed, omit the
  attributes — a guessed size is a worse layout bug than none.
- The hit target an object gets is sized and placed by the renderer every frame; when the object is
  off-screen or behind the visitor, its button takes `tabindex="-1"` and `visibility:hidden`. A focus
  ring on an empty corner of the screen is a trap, and a tab stop for a thing you cannot see is worse
  than one you can walk back to.
- Generated art is labelled generated, once, above the list — not stamped on every row, which
  is the cadence the detector calls templated.
- Reduced motion: no auto-advance, no flicker, no sway; taps and keys still work. Touch gets
  the same affordances as hover, never a worse set.
- The stories rail is mechanics only: segments, right two thirds forward, left third back,
  hold or Space to pause, a live counter. **Nothing is marked viewed and nothing expires** —
  this site is a durable record.
- No third-party media host for the player: Google Drive returns a virus-scan interstitial
  above ~25 MB and cannot serve range requests (seeking breaks); Pages does not serve Git
  LFS media. Small MP4s in the repo; Release assets when they outgrow it.

## 4. The gate — verify the served page, not the tree

Run in this order and stop on the first failure:

```bash
python3 _gen_html.py; echo "exit=$?"          # exit 0 or nothing else counts
md5sum *.html > /tmp/a && python3 _gen_html.py >/dev/null && md5sum *.html > /tmp/b
diff -q /tmp/a /tmp/b                          # the generator must be idempotent
node .verify/verify-walk.mjs           # 164 assertions, run from the repo root
node node_modules/impeccable/cli/bin/cli.js detect --json css/site.css $(ls *.html)
curl -s http://127.0.0.1:8080/<page>.html | grep -o 'site\.\(css\|js\)?v=[0-9a-z]*' | sort -u
curl -s http://127.0.0.1:8080/<page>.html | grep -c '<new marker you just added>'
```

The last two are not paranoia. This project shipped a page whose tree content was correct
while the browser was being handed stale cache-busted assets, and it shipped three commits
where `python3 _gen_html.py` raised `NameError` while the already-generated pages made the
build look healthy. Grep the artefact the browser fetches.

`.claude/` and `node_modules/` are gitignored and the sandbox wipes them between turns — it wipes
`.claude/` reliably, which is why the harness lives in `.verify/` (also gitignored, but it has
survived). The sandbox can also move `HEAD` under you, which is how a `git checkout -- _gen_html.py` once silently replaced the
generator with an older commit's copy. `npm install --no-save jsdom impeccable@4.1.0` restores both
tools (`impeccable install` cannot reach its bundle from here), and nothing may leave a
`package.json` behind in the repo. If the tooling is gone, say so in the commit message instead of
quietly downgrading to grep, and check `git rev-parse HEAD` before trusting any diff — a re-cloned
sandbox has dropped this session's commits twice, and the only thing that survived was the working
tree, so commit early and often even while the remote is unreachable.

## 5. Refusals

No invented venues, dates, captions, attendees, or visited places. Drawn set dressing (a crate, a
bollard, a blank sign) is authorised art direction and says so in its own hint; a caption never does.
An image may not reach a page before it reaches `IMG_RULES`. No student or bystander
faces presented as content. No vendored library, no WebGL, no npm tooling committed without
the owner explicitly renegotiating the dependency rule in `AGENTS.md` — and that is its own
PR, not a gallery PR. When a hoist or splice of this single-file generator is involved,
check ordering: a slice with `i > j` produces a duplicated region that still parses, passes
`ast.parse`, and fails only at runtime. And patch a file by applying, writing, then re-grepping the
written file — an assert that runs after an in-memory mutation loses the whole round when it fires
late, which has now happened four times.

## 6. What is a solid, and what is a plate

The lane is **one canvas raster**, so it cannot be assembled out of separately transformed surfaces —
that was the earlier architecture and it is gone. What remains 3D in CSS is the album wall and the
plate, and there WebKit still bites: a non-visible `overflow`, or a `filter`, on the element that
declares `transform-style: preserve-3d` silently forces it flat, and a universal `preserve-3d` rule
makes the whole thing vanish. So `preserve-3d` goes on `.ig-grid` only, the `perspective` one level up
on `.ig-wall`, and the frames' depth **inside each frame's own transform**, because a scroll container
flattens its children.

Inside the raster, the equivalent rule is that nothing may be invented by the renderer, and there are
two coordinate systems that must never be mixed: a *record* is authored in record centimetres and
multiplied by `Z_SCALE`, while the *space* — an arcade beam, an aperture in a wall, the far plane seen
through it — is authored in scene centimetres and is not scaled at all, because it is not a record of
anything. A prop is
authored as a solid (`OBJ_SIZE` gives width, height and depth; depth is what lets you walk behind it
and what wraps the hit box around the thing you can see), and light is authored as data — `data-walk-lights`
and `data-walk-wires`, plus the scene-centimetre islands `data-walk-surfaces` (what each wall is clad
in, band by band), `data-walk-marks` (what is painted or let into the ground), `data-walk-beams`,
`data-walk-vista` and `data-walk-backdrop`. The renderer draws the bulbs it is told about and
derives exactly one glow from a prop's own position, because that light has to come from the machine.
Adding a lamp in `js/site.js` to "fix" a dark wall is the failure mode this prevents: it produces a
scene that looks lit and a dataset that says otherwise.

**Atmosphere is a property of the space, not of the view.** A lane is dressed by what its walls are clad
in, what is on its ground, and what hangs over you — so those three are data, and the renderer only knows
how to *paint* a material: `shutter`, `dado`, `brick`, `corrugated`, `hoarding`, `plaster`, `tactile`,
`grate`, `wet`, `lantern`. Each is one 128 px tile painted in code, mapped across the same 60 cm panel
the wall already uses — which is why no band may be drawn as one stretched quad, and why a panel whose
cladding tiles its whole height (0 to `CEIL`) skips the wall's own tiling instead of wearing it twice
(`cladCovers` in `drawRoom`). A lantern is a *light* (`body: "lantern"`, `bulb: false`, with `size` and
`h` authored next to it), so no corner of the lane is bright because a gradient said so. And nothing here
carries lettering: the renderer never calls `fillText`, a board that could have held a menu is emitted
blank with the reason in its card, and a photograph of somebody's real front is not an available material
in this project.

No iOS Safari exists in this sandbox, so mobile behaviour is **unmeasured** and must never be
reported as proven. What needs no device is the fallback: the captioned list is always readable. The
per-frame draw cost is measurable here and is asserted — `ctx.fills`, and that no textured quad covers
more than its own uv extent; what it looks like on a phone is not.

## 7. The display wears no words

Nothing in `.walk-hud` may be text — not a caption, not a station label, not a `−` glyph. Anything with
a sentence is a button that opens a card, and the card carries both modes: what you are standing in
front of, and the lane's own note (legend, disclaimer, fallback sentence). Live regions stay in the
document as `.sr-only`, because *announced* and *painted* are different claims and only the second one
is forbidden. The album wall follows the same rule: tiles are photographs, and what a plate may claim is
read inside the plate.

When a control has to say something non-verbally, say it with the geometry the data already has: the
station rail is a row of ticks whose heights come from each stop's authored depth (`--p`), and the note
button carries a dot while something in front of you has a card. `verify-walk.mjs` walks every node in
the HUD and fails on its *own* text, so a wrapper above a live region is not an excuse.

## 8. States: what a prop is made of when it is used

A room you can only look at is a photograph with a walk cycle. Dressing a block means leaving things that
answer, and an answer has to be a change in the geometry — the owner's words for the failure mode are
"介面" and "說明": if pressing a thing only opens a card that *describes* it, what was interactive was the
caption, not the room.

Author it in the record, on the prop:

- `"states": [{"say": …, "k": …, "shut": …}, …]` — one entry per stop, and one geometry field on each stop
  (`shut`, `door`, `flap`, `slide`, `flip` are what the painter knows today; a new field means a new branch
  in the prop's shape, and the shape has to keep working with no states at all).
- `"state": 0` optionally, for where it starts; the generator emits both `data-states` and `data-state`, so
  the stop a thing is at belongs to the document.
- `"swing"/"period"/"phase"` on a lantern, and `"tone"` on a surface whose material the shading should not
  flatten to one grey. Both are read by the same frame clock as the states, which is what keeps a cord, a
  body, a glow and its reflection moving together.
- The light that a state changes is `"of": "<prop id>"` on that light, and `k` on the stop multiplies it. A
  glow with no `of` is a lamp on a wall; a glow with `of` is the thing's own light, and the harness will not
  accept an `of` that names no record.

The `say` line is the only text a state may own, and it is spoken from the card. Nothing on the display says
"press me" in words — a prop with `states` gets the dashed reach ring and that is the whole vocabulary.

Two traps this round earned: an idle repaint must run the tick (a glide started while the lane was resting
otherwise stops mid-lane), and anything the frame computes has to be asked before `checkReach`'s early
returns, or the highlight goes stale behind an object that happens to be in front of you.

## 9. Exits, press areas, and the ceiling on what a test can prove

A district is a place you can be *in*, so it needs three things named in the record before it is finished:
a way in (the page is the space — there is no door to open), a way to do something (the `states` of §8),
and **a way out**. The exit is authored the same way as a state: put `"leave": "index.html"` on the prop
that is the doorway and the renderer navigates when it is pressed; `data-walk-exit` in the chrome points at
the same destination so key, finger and record cannot disagree. `Esc` closes a plate, then the list, and
only then leaves. A control whose `data-hint` says "part it to leave" while it opens a card instead is
severity 4 — it is a lie about the room, and it happened here.

Three rules that exist because a real person could not use the page:

- **Rows are layout, not targets.** Anything with `inset: 0` that hands `pointer-events: auto` to full-width
  children turns the top and bottom of a viewport into glass over the scene. Opt the rows out and the
  controls in (`.walk-hud .walk-icon, .walk-hud .walk-stop { pointer-events: auto }`).
- **A press area is not a drawing.** Press boxes have a 44 px floor (`HIT` in the walk), and `--padx/--pady`
  pull the visible ring back onto the projected silhouette so the enlargement stays invisible. The chrome
  grows by padding (`::before`, `inset: -8px -4px`) with the row gap widened to match, so pads meet but do
  not overlap — an overlap would let document order decide what a click means.
- **Every verb needs a finger.** A key with no touch route is not a verb. `E` became: a `pointerup` that
  travelled less than 8 px is a press on whatever the reach found, and the same tap closes what it opened.

`.verify/verify-walk.mjs` asserts all of the above as *structure* because jsdom cannot hit-test: it has no
layout, no paint order, and it dispatches a click on whatever element it is handed. That is why the gate has
a second half — `.verify/browser-check.py`, Playwright, `elementFromPoint` at each press box's own centre,
plus console errors. Run it wherever a browser can be downloaded; in a sandbox whose CDN resets TLS, say so
out loud instead of reporting a look as proven.

## 10. A story fills the screen; one mouse button is a gesture

When a district's frames are shown as 動態, build the story's real format rather than a card with a picture
in it. The platform's own numbers are the specification: 9:16 (1080×1920) is the only ratio that fills the
screen, media that is not 9:16 keeps its proportions and gets the remainder filled by a **blurred copy of
the same file**, and the top and bottom ~250 px are where its chrome lives — so captions go in the middle
band. In this site that is `#room-plate.is-rail`: the panel is `100dvh` with no radius, shadow or `pop`;
the column is `min(100%, calc((100dvh - 7.5rem) * 9 / 16))` with the image `object-fit: contain`; the
ground is `.modal-panel::before { background-image: var(--fill); filter: blur(...) }` set from the current
frame by `paint()`. Never crop a landscape file to look portrait, and never add a fill image to `IMG/`.

Anything the reader is already reading in the tree is hidden rather than deleted: the dialog's `h2` and
hint become visually hidden, because a second copy of the caption painted over the photograph is a card's
habit. Every plate in this site is full-screen now; what differs is the **ground** — a story (`#room-plate`
in rail mode) fills the remainder with a blurred copy of the current frame, a post viewer (`#ig-plate`)
uses a plain field, and a reel keeps its per-frame perspective with `min-height: 0` so the caption cannot
be pushed off the screen. Keep a dark `background` on the plate element itself even when an open state
paints over it: a caption's contrast is measured against the element it is written on, and a static reader
will (correctly) flag light-on-paper the moment that declaration disappears.

Progress and pausing share one number: a bar fills with `transform: scaleX` in a keyframe whose duration is
`var(--rail-hold)`, and the advance timer reads that same custom property through `getComputedStyle`;
holding the frame adds a class that sets `animation-play-state: paused`. Do not animate `width`.

**Buttons.** `pointerdown` fires for the right and middle buttons as well, so every gesture in a district
starts with `if (event.button !== 0) return;` — the turn, the stick, a hold, a pan. Refuse `contextmenu`
only while a drag is live (a menu mid-drag strands a `is-dragging` class and leaves the cursor grabbing),
and refuse `auxclick` for the middle button alone: tiles are links and a blocked left click would kill
them. This is not politeness — it is what the owner called 手感. On a phone, prefer the edge of the screen
to a floating disc: `opacity: 0` until hover or focus, `width: 34%`, and no `border-radius`.

`.verify/` keeps only the three files that are run again — `verify-walk.mjs`, `cost-probe.mjs`,
`browser-check.py`. One-shot patch scripts get deleted as soon as their anchors are consumed: a script
that can only fail twice is a trap for whoever reads the folder next.

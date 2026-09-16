---
name: district-author
description: Author a themed walkable district for the huaxu site — intake questions, the record shape, the build rules, and the verification gate. Use when adding or changing a district (a place whose frames, objects and clips hang in one lane), when an owner asks for "3D" or a stories-style viewer on this site, or before choosing any rendering library for it.
---

# Authoring a district

A district is one themed space: a lane of a few planes, some interactive objects, and the
frames that belong to it. It is not a gallery with a camera bolted on, and it never replaces
the list.

Work in this order. Do not skip the intake, and do not start with a library.

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
node .verify/verify-walk.mjs           # 72 assertions, run from the repo root
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
and what wraps the hit box around the thing you can see), and light is authored as data — the two JSON
islands `data-walk-lights` and `data-walk-wires`. The renderer draws the bulbs it is told about and
derives exactly one glow from a prop's own position, because that light has to come from the machine.
Adding a lamp in `js/site.js` to "fix" a dark wall is the failure mode this prevents: it produces a
scene that looks lit and a dataset that says otherwise.

No iOS Safari exists in this sandbox, so mobile behaviour is **unmeasured** and must never be
reported as proven. What needs no device is the fallback: the captioned list is always readable.

No iOS Safari exists in this sandbox, so mobile behaviour is **unmeasured** and must never be
reported as proven. What needs no device is the fallback: the captioned list is always readable.

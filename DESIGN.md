# DESIGN.md

Visual world for huaxu.github.io — "the journal cover": editorial scholarly design
for an educational-technology researcher. Deep navy plates, warm paper, amber as a
precise instrument, serif-led typography.

## Tokens (css/site.css `:root`)

| Token | Value | Role |
|---|---|---|
| `--navy` | `#101b39` | Primary plate (hero, nav base, rules) |
| `--navy-deep` | `#0a1128` | Darker plate depth (footer bottom, photo plate) |
| `--navy-soft` | `#1a2b50` | Gradient partner, scrollbar thumb |
| `--accent` | `#b45309` | Amber: buttons, markers, rules. Graphics only on paper |
| `--accent-ink` | `#96470a` | Amber for SMALL TEXT on paper — keeps ≥4.5:1. Never lighten |
| `--accent-bright` | `#f2c88e` | Amber for text/graphics on navy plates — tuned to ≥4.5:1 over the lightest hero gradient |
| `--bg` | `#f6f1e6` | Warm paper page background |
| `--gold` | `#fdf6ec` | Cream: alt sections, quotes, featured pubs |
| `--card` | `#fffdf8` | Card surface |
| `--muted` | `#5b5648` | Secondary text on paper (warm, not gray) |
| `--muted-navy` | `#cdd6ee` | Secondary text on navy (tinted from navy, not gray) — ≥4.5:1 over the plates |
| `--line` / `--line-strong` | `#e0d7c4` / `#c9bda2` | Warm hairlines |

## Type

- Display/headings: **Newsreader** (`--display`), optical sizes, weight 500–700, italic for `.role`.
- Body: **Source Serif 4** (`--serif`), 17px/1.7. The site reads like a journal.
- UI (nav, buttons, eyebrows, badges, chips, labels, small meta): **Archivo** (`--sans`).
- Do NOT reintroduce Inter, Roboto, Fraunces, Space Grotesk, or other saturated faces.

## Rules of the world

- Navy plates open and close the page (hero, footer); paper and cream alternate between.
- Amber is an instrument, not a wash: the 2px press rule under the hero, timeline dots,
  featured-pub top rule, button fills, `::marker`, focus rings. Never large amber areas.
- On navy, secondary text uses `--muted-navy` and amber text uses `--accent-bright`.
  On paper, small amber text uses `--accent-ink` (contrast floor).
- Browser surfaces are themed: `::selection`, scrollbar, `caret-color`, underline offsets.
- Motion: ONE authored moment — the hero entrance (staggered `rise-in` + portrait +
  amber `rule-draw`), plus quiet scroll reveals and hover micro-lifts.
  Everything respects `prefers-reduced-motion`.
- No dark mode. No gradients as decoration (only navy-to-navy plate depth).
- Flat editorial devices over cards-in-cards; stats render as a ruled colophon line.
- Functional micro-text (nav labels, badges, chips, eyebrows, stat labels, date marks,
  persona hint) keeps an **11px floor** — the smallest is `0.7rem` (11.2px). Editorial
  micro-labels stay small and tracked-caps, never below legibility.
- Card/section titles use a contiguous heading outline: an `h2` block-title is followed by
  `h3` items (never a jump to `h4`). Publication titles inside a year-group (`h3` year) are
  the legitimate `h4` case.

## When changing styles

1. Edit `css/site.css` only; bump the `?v=` cache-buster in `_gen_html.py` (line ~6) and rerun `python3 _gen_html.py`.
2. Verify contrast on new text/surface pairs (≥4.5:1 small text, ≥3:1 large).
3. Run the detector: `node .claude/skills/impeccable/scripts/detect.mjs --json css/site.css index.html` — keep it at 0 findings.

## Detector policy (`.impeccable/config.json`)

The detector ships generic SaaS/AI-template heuristics. Some fire on purpose here because
they describe this committed world, so they are waived repo-wide in
`.impeccable/config.json` (`detector.ignoreRules`) to keep the baseline clean and let
**new** issues surface. Waived as intentional design (documented above):

- `cream-palette` — the warm-paper `--bg` is the world, not a beige default.
- `side-tab`, `border-accent-on-rounded` — amber hairline rules (press rule, pillar/pub/
  conv tops) are the amber-as-instrument device; the footer/navy top rules are plate edges.
- `dark-glow` — navy plate shadows carry offset + blur (plate depth), never zero-offset halos.
- `hero-eyebrow-chip`, `all-caps-body` — tracked-caps editorial eyebrows are a deliberate
  journal device (the committed world overrides the generic eyebrow ban).
- `cramped-padding` — the stats "ruled colophon line" sits flush to its hairline by design.
- `buried-raster` — About mascot layers are `opacity:0` until hover/focus, inside
  `aria-hidden`.
- `flat-type-hierarchy` — the 404 page is intentionally a minimal error plate.

**Never silence an objective defect here** — fix contrast, heading order, sub-11px
functional text, and broken/placeholder images in code. The 1×1 transparent placeholder
`src` the old lightbox used (JS set its real image on open) is gone: the photo plate
holds one real `<img>` per photograph, so a browser or reader that never runs the script
still sees the archive.
Note: the static detector's gradient contrast is conservative — it samples corner glow
stops text never sits on; verify plate text against the *painted* navy, and prefer tuning
the `--accent-bright` / `--muted-navy` tokens over weakening the plate.


## Districts: the lane (rooms.html)

A walkable district is the one place in this world where geometry is allowed. It stays in
uniform: the floor and walls are navy plates, the only light is amber and it comes from one
object (the vending machine), captions are the same `--muted`/`--muted-navy` as everywhere
else, and the poster surfaces are drawn in CSS rather than generated as images so nothing in
the scene can be mistaken for a photograph the owner took.

Camera rule of the world: the eye never moves — `.room-world` is translated and rotated in
the opposite direction. That is what keeps the lane free of a 3D library, and it is why
movement is in screen axes (a lane has one axis of travel, so turning never changes where
the next step lands).

Two limits are deliberate and should not be "improved": yaw and pitch are clamped to ±35° /
±10° because past that the walls stop covering the viewport and the room shows its own edges;
and turning is drag, not Pointer Lock, because the site must stay usable on a phone.

A district with no declared purpose cannot open — `status: "soon"` renders as such. The
reference this was modelled on ships one built level and one honest `Coming soon`, and this
site's rule is the same: an unbuilt space is announced, never decorated.

### The space is the interface; the page is its door

A district is not a figure inside an article. `rooms.html` is a doorway — cards, kind, cover, the
written-out list — and `Enter Tokyo` hands the whole viewport to the lane, with every control
floating on it as a head-up display. That is the reference site's arrangement, read carefully
rather than imitated: its first screen *is* the building, and its level chips, `YOU` marker,
`−`/`+`, `Jump` button, `W A S D walk · Space jump · Drag to turn · E open` legend and
`Level 1 ready.` status line are all overlays on a view that fills the screen. A walkable space
offered any other way is a diagram of a place, and a diagram does not answer "go in and walk like
a person".

What that costs, and what pays for it:

- **The body is simulated, cheaply.** One `requestAnimationFrame` while something moves — never a
  permanent loop — with exponential acceleration (a person speeds up and settles), a run on
  `Shift`, a 0.45 m jump under 2400 cm/s² of gravity, head bob and a half-degree of roll scaled
  by speed, and a shadow on the floor under the eye so that looking down finds a body. Units are
  metric: 1 px = 1 cm, eye at 168, 235 cm/s at foot. `prefers-reduced-motion` removes the bob and
  the jump and leaves the walk, because the nausea fix is the sway, not the ability to arrive.
- **The transform is written as custom properties, never as `style.transform`.** JS sets
  `--yaw/--pitch/--tx/--ty/--tz/--roll` on `.walk-world` and CSS composes them. That keeps the
  WebKit flattening invariants checkable by reading one block, and keeps the order of operations
  (`rotateZ` → `rotateY` → `rotateX` → `translate3d`) in one place instead of split across two
  languages.
- **`−`/`+` change the field of view (`--fov`, the perspective distance), not a scale.** Scaling
  a corridor in and out is a zoomed photograph; moving the projection plane is stepping closer.
  The base value also tracks the viewport width, which is what keeps a 640px-wide lane legible on
  a phone without a second layout.
- **Words live in the HUD, not in the scene.** `.obj-tag` is `display:none` inside the box and the
  names print in the status line — `standing at the machine · 1.8 m ahead`, which is the reference's
  `Men's and women's toilets · Level 1 · Unit 1 corner` pattern. A caption floating at
  `rotateY(-90deg)` in a dark corridor is the single reason a 3D view reads as broken.
- **What can be opened is decided by where you stand and where you look.** Nearest object within
  1.9 m and roughly in front → an amber ring on its edge and the verb in the record line. `E`,
  Enter, or a tap opens it: a wall frame plays in the rail, a prop answers in a card. The noren
  behind you is the way out, and `Esc` walks you out — except while the rail is open, where it
  closes the frame and leaves you in the lane (the rail's handler stops propagation for exactly
  that reason).
- **The list is still the same selection.** `The list` opens a drawer over the space; choosing an
  entry glides the camera there. Below the door, each frame is a row with an anchor, and a
  `Play from here` that starts the rail at that frame; `#walk-tokyo` opens the lane for whoever
  you sent the link to, and `#frame-tokyo-sensoji` marks the row. Camera position is deliberately
  *not* in the URL: the visit is not state to be shared.
- **Nothing behind the space stays interactive.** `html.is-walking` hides the nav and the footer,
  locks the page scroll, and `inert`s the document body's other regions, so a screen reader and
  Tab do not wander through a page that is visually covered. `touch-action: none` on the view —
  the drag *is* the look, and a page that scrolls under the thumb is a screenshot with a handler.
- **The HUD never goes small to look technical.** Text floors at 0.76rem (12.2px); the drawer's
  meta row states its own light colour because `.when` is the *paper's* warm secondary and reads at
  2.6:1 on navy. Contrast and functional size are fixed in code, never waived in policy.

### Kinds: the two defaults a district can be

`purpose` says what a space is about. `kind` says what it is allowed to assert, and there
are exactly two, because those are the two ways this site can be wrong:

| | personal | academic |
|---|---|---|
| generated imagery | allowed, the whole district may be drawn | allowed as cover art only, never as evidence |
| per-frame requirement | none | venue and date, or the frame is not shown |
| the failure it prevents | a travel lane reading as a record of attendance | decoration standing in for a fact |
| on the page | the kind is printed on the card and on every frame row | same |

Travel is a personal space; a talk, a workshop, a school visit is an academic one. A new
district cannot be built until its kind is declared, and the card that fails to declare it
renders as shut — `Purpose not declared`, `Not open yet` — because an honestly locked door
is cheaper than a confidently wrong one.

#### Two WebKit flattening traps, and why this scene is built around them

The research that mattered for the lane was not "which library" — it was two documented ways a
CSS 3D scene silently renders flat in Safari and WebKit:

1. `overflow` other than `visible` forces that element's `transform-style` to `flat`; the
   reported fix is `overflow: visible !important` on the `preserve-3d` element itself, not on
   its ancestor;
2. a `filter` or `backdrop-filter` on the element carrying `perspective` kills `preserve-3d`
   for its whole subtree;
3. and a universal `* { transform-style: preserve-3d }` makes the scene vanish outright.

Checked against the built stylesheet rather than hoped: `preserve-3d` is declared on exactly
two selectors, `.room-world` (the lane) and `.ig-grid` (the Activities tilt), and neither block
carries `overflow` or `filter`. The clip that keeps the lane inside its frame and the
`perspective` both live one level up on `.room-stage`; the only `filter` inside the scene is
`blur(3px)` on `.room-floor::after`, a leaf with no 3D children. A parser over the whole
stylesheet agrees: no rule mixes `preserve-3d` with `overflow` or `filter`.

So the structure is flat-safe today, and the rule for whoever edits it next is: **do not move
`overflow` or `filter` onto a `preserve-3d` element, and do not add `preserve-3d` to a selector
that has either.** These are not style preferences — moving the clip onto the wrapper is the
kind of tidy-up a future agent will do, it looks perfect in Chrome, flattens the scene on every
iPhone, and raises no detector finding.

What this sandbox cannot do is measure. There is no iOS Safari here, so nested-layer behaviour
on mobile is unverified rather than proven, and an earlier promise in SPEC §6 to research a
maximum layer count was chasing the wrong failure mode: the documented one is flattening by
`overflow` or `filter`, not a layer budget. What needs no measurement is the fallback — the
captioned list is always readable.

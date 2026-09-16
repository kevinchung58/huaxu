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
3. Run the detector: `node node_modules/impeccable/cli/bin/cli.js detect --json css/site.css $(ls *.html)` — keep it at 0 findings (`impeccable@4.1.0` from npm, installed without `--save`; never commit a `package.json`).

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

### The page *is* the space

There is no doorway. `rooms.html` is generated by `shell_page()` — no masthead, no footer, no
column of prose under the view — and arriving at it puts you in the lane. This is the reference's
architecture, not its decoration: it is one route whose viewport belongs to the building, with the
level picker, the `YOU` marker, `−`/`+`, the `Jump` button, the key legend and `Level 1 ready.` all
floating over it. A walkable space wrapped in a header and an article is a picture of a place, and
the owner rejected that twice: *"我要一堆分裂的3D加上網頁幹嘛?"*

Consequences that are now structural, not stylistic:

- **The reading material is the drawer, and the drawer is paper.** `The list` (or `L`) slides in a
  panel of `var(--bg)` holding the district cards, the frames with their `Play from here`, the
  slots and the disclaimer. Because it is the site's own surface, `.when`, `.badge`, `.slot` and
  `.district-card` need no re-tinting; the first attempt painted the drawer navy and every borrowed
  component fell to 2–3:1. Light surface, dark scene — not two dark surfaces fighting.
- **No JS, no problem.** The drawer ships open in the HTML and JS *folds* it (`is-closed` is added
  at boot, never in the markup), so with scripting off the page is a complete written district
  rather than a locked door. Nothing inside the shell uses `reveal`: an opacity-0-until-observed
  paragraph is invisible forever when the observer never runs.
- **Print prints the list.** `@media print` drops the view, the HUD, the pad and the card, and
  unhides the drawer statically.
- **The corner link is the way out** (`← Hua-Xu Zhong`), and so is the noren behind you, which
  navigates to `index.html` because it is the exit in the fiction and in the DOM.
- **`Esc` folds overlays and never ejects.** Card, then drawer, then nothing: a full-screen space
  has no "underneath" to fall back to, so an Esc that left the site would be a bug wearing a
  keyboard shortcut.
- **No URL state.** There is no `#walk-tokyo` to open and nothing about the camera is addressable;
  `#frame-tokyo-*` still marks the row it names. A visit is not a fact worth linking.

The body of the space is a hand-written raster, not a stylesheet trick. One `<canvas>` fills the
viewport and everything on it comes from a single projection: walls split into 60 cm panels, each
panel textured by an affine map onto a tiled pattern, quads depth-sorted and painted far-to-near,
fog and the amber pool and the bulbs all distance functions of that same projection. There is no
WebGL and no library — the whole site is still dependency-free, and the renderer is ~200 lines of
this repo's own code. What that buys, and what it cannot:

- The lane is closed on six sides *by construction*: the camera clips at 24 cm and the walls run past
  the walk clamp, so turning around shows a lane instead of an edge. The box is authored (`data-lane-w`,
  `data-lane-d`, `data-lane-ceil`, `data-eye`), so the renderer draws the room the data describes
  rather than a room someone remembered to keep in sync.
- Textures are patterns, not photographs, except the frames: those three JPGs are generated pictures
  and are labelled as such, and nothing in the scene pretends to be a survey of Tokyo.
- Wall objects are `<button>`s the renderer pins to their projected bounding box every frame. A
  control that could drift away from the thing it names would be worse than none, and one behind you
  leaves the tab order instead of waiting there.
- The lane is *lit*, and that is a requirement rather than a taste: ambient at 0.42 of material,
  concrete and wet asphalt at mid-tone, seven bulbs whose falloff is the same inverse-square the
  glows are drawn from, and a murk ceiling of 0.6 painted in navy so distance reads as air instead of
  the picture ending. Hung frames keep 60% of their own contrast under that haze, because a photograph
  you cannot see has stopped being evidence. `prefers-contrast: more` gets a second exposure
  (ambient 0.6, murk 0.4) from the operating system's own switch rather than a widget in the corner —
  a dim laptop is the visitor's to correct, not mine to guess at. The HUD answer is a scrim that fades
  the viewport's edges to navy, not a heavier typeface.
- No canvas, no black rectangle: `boot()` says so in the status line, opens the drawer and leaves the
  whole district readable — the reference's own move, and the only honest one.
- Motion is declined where the numbers live: no bob, no sway, no flicker under
  `prefers-reduced-motion: reduce`, which is decided inside the integrator rather than cancelled in
  CSS after it has been paid for.

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

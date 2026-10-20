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
- `repeating-stripes-gradient` — the festival stall's awning (`.walk-stall`, round 50) is a
  striped cloth; the stripes are the object, not decoration. Round 55 measured this rule
  firing 19 times (once per page, from that one declaration) while the round-54 notes still
  claimed a clean baseline, and waived it by name rather than deleting the awning.

**Never silence an objective defect here** — fix contrast, heading order, sub-11px
functional text, and broken/placeholder images in code. The 1×1 transparent placeholder
`src` the old lightbox used (JS set its real image on open) is gone: the photo plate
holds one real `<img>` per photograph, so a browser or reader that never runs the script
still sees the archive.
Note: the static detector's gradient contrast is conservative — it samples corner glow
stops text never sits on; verify plate text against the *painted* navy, and prefer tuning
the `--accent-bright` / `--muted-navy` tokens over weakening the plate.


## Districts: the rooms (rooms.html and its neighbours)

A walkable district is the one place in this world where geometry is allowed. It stays in uniform
across all three rooms: the palette is the site's, captions are the same `--muted`/`--muted-navy` as
everywhere else, and the poster surfaces are drawn on the canvas rather than pasted on as
photographs, so nothing in the scene can be mistaken for a picture the owner took.

What is *not* uniform is the light. It used to be one rule — the only light is amber and it comes from
one object — and that rule stopped being true the moment there were three places: a vending machine on
a lane, a lamp post and a lit door on a winter walkway, six paper lanterns over a stall alley. Each
district authors its own lamps, and each entry is either a **fixture** (the renderer draws a body and a
cord for it) or **spill** (`"bulb": false`: light with no body — a pool, a bounce, the sky near an
aperture). Canada's four spill entries were authored as fixtures once, which hung four white bulbs over
a walkway with one lamp post in it.

Camera rule of the world: the Three.js `PerspectiveCamera` follows the walker's world-space position
at eye height; yaw and pitch aim it without rotating the scene itself. The same camera basis decides
the reach of the projected prop buttons, so what a visitor can open and what they see agree. The
older fixed-eye screen-axis rule made W walk away from the direction the visitor had turned to look;
it is retired.

Looking can turn freely around the room, but pitch is bounded at ±24° to keep the camera from
whipping above or below the scene. Keyboard turns are rate-limited to 75°/s; drag sensitivity is
0.09° per CSS pixel, and vertical head bob is under 6 mm with no camera roll. The default walk is
165 cm/s (206 cm/s with Shift). These are comfort constraints, not performance shortcuts: W/S move
along the camera's forward vector projected onto the floor, A/D move along camera-right, and the
stick uses the same yaw basis. Pitch never lifts the walker; collision bounds remain in authored
world axes and resolve against lane limits and solid props. Turning is direct drag/arrow input,
never Pointer Lock, so the phone stays usable.

Three more are properties of *these* rooms rather than of the mechanism, and each cost a fix when a
room was built: an opening is sized against the wall it is cut in **and** the stop it is seen from
(Canada's 5.6 m aperture in a 7.2 m wall read as a window); a light 20 m away does nothing, because
`lightAt`'s half-radius is 210 cm, so each room lights its own far plane; and a stop should stand about
two metres off an end wall, or the last thing the room shows you is the wall.

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

The walkable view now uses one Three.js renderer, not a WebGL backdrop behind a 2D room. Every one
of the seven walkable pages mounts the pinned, vendored Three.js 0.186.1 runtime. It triangulates the
lane and object quads into dynamic world-space buffer geometry, builds sourced `backdrop.world.prims`
as static 3D geometry, and renders the sky, patterns, water, spray, clouds, and scene lights in the
same camera. No scene facts are invented by the conversion: procedural material maps are surface
patterns, not photographs. Accessible DOM buttons remain the hit layer and are projected from the
same world records. There is no fallback picture: a browser that refuses WebGL gets the lane's own
statement in the viewport it cannot fill, and the compiled state keeps answering (see "No black
rectangle on a WebGL failure" below). The Activities album remains CSS 3D and outside this
walkable-scene migration.

Cross-backend rendering invariants:

- **A lane quad is culled by the bounds its projected points occupy, never by its corners.** Both
  failure modes have now been paid for: the far plane (a sky covers the view by being larger than it,
  so every corner is off-screen) and the near one (stand deep in the lane and the floor under you,
  the walls beside you and the roof over you are each one panel wider than the screen — every quad
  you are inside of was dropped at once and the frame collapsed to its base plate under a fog
  gradient). `add()` projects first and compares the box; anything whose box misses the viewport by
  more than 80 px is dropped, which is a superset of what the corner test kept. Visible quads retain
  their world corners and UVs for Three.js triangulation — there is one rasteriser now, so a quad
  that survives the cull is a quad the scene draws.
- **Nothing is drawn that the data did not ask for, and everything the data asks for is drawn.** The
  window, the opening in the end wall and the compound beyond it (plaza, crossing, eight city blocks,
  the tower, the mountain, the sky bands) live in the `data-walk-vista` / `data-walk-backdrop` islands
  and were invisible for as long as a single island could be read as a list. The district's own
  harness rendered it that way for months without noticing. The Canvas2D rasteriser that answered for
  it (`.verify/lane-shot.mjs`) was retired together with the painter in round 54 — the frame contract
  now lives in the browser's own gates — and `bin/verify-three.mjs` guards the world-space geometry
  and Three.js scene-object path, including the ruling that no lane painter may come back.
- Movement is collision-bound to the scene record: the body centre clamps at `laneW / 2 - 24 cm`,
  the sealed far end stops 47 cm before its wall, and jumps stop below `lane.ceil` with headroom. The
  authored solid props also block their floor footprints and allow axis sliding. Those bounds are
  read from `data-lane-w/-d/-ceil` and the prop buttons, never from a global room width. The closed
  room therefore stays closed even in the 240 cm Journey tunnel.
- **Both ends of the lane are built, because both ends are frames you stand in front of.** The wall the
  lane runs into wears board-formed concrete — pour seams and tie holes, the same material as the far
  half of its side walls — because it is the largest surface in the deepest frame and a pale grid there
  read as the page having run out. The bottom of its opening is a parapet with a galvanised coping:
  the camera stands above the lip, so that reveal's top face is the one surface of the end wall seen
  from above, and it is the brightest line in the frame on purpose, because it is the edge the city is
  seen over. The wall at your back gets a concrete plinth where it meets the wet floor, since no alley
  wall meets a floor in the material it has at eye height. All three are authored: the opening is
  `data-walk-vista`, the coping is a material the data names, the plinth is one height in the renderer.
- Textures are patterns, not photographs, except the frames: those three JPGs are generated pictures
  and are labelled as such, and nothing in the scene pretends to be a survey of Tokyo.
- Wall objects are `<button>`s the renderer pins to their projected bounding box every frame. A
  control that could drift away from the thing it names would be worse than none, and one behind you
  leaves the tab order instead of waiting there.
- The lane is *lit*, and that is a requirement rather than a taste: ambient at 0.42 of material,
  concrete and wet asphalt at mid-tone, five bare bulbs and six paper lanterns whose falloff is the
  same inverse-square the glows are drawn from, six bulbed props' worth of glow and one cool bounce
  off the city beyond the opening, and a murk ceiling of 0.6 painted in navy so distance reads as air
  instead of the picture ending. Hung frames keep 60% of their own contrast under that haze, because a photograph
  you cannot see has stopped being evidence. `prefers-contrast: more` gets a second exposure
  (ambient 0.6, murk 0.4) from the operating system's own switch rather than a widget in the corner —
  a dim laptop is the visitor's to correct, not mine to guess at. The HUD answer is a scrim that fades
  the viewport's edges to navy, not a heavier typeface.
- **No black rectangle on a WebGL failure, and no empty grid either.** The second picture was
  deleted in round 54; round 55 rendered the state that left and found an empty navy viewport with
  the explanation three interactions away. The lane now stands a panel in the viewport it cannot
  fill — one sentence saying the walk needs WebGL, one saying what still answers (the stops, the
  keys, the written list), and the lane's own published standing position, mirrored from the status
  line rather than re-derived. The projected prop buttons retire with the picture (a projection onto
  nothing is a card floating in a void) while the reach itself survives: facing something and
  pressing E still opens its record. The info card keeps its authored sentence, and the drawer keeps
  the whole written district. `.verify/verify-nowebgl.mjs` asserts both directions, including the
  control that a WebGL visitor never sees the panel.
- Motion is declined where the numbers live: no bob, no sway, no flicker under
  `prefers-reduced-motion: reduce`, which is decided inside the integrator rather than cancelled in
  CSS after it has been paid for.

### The walk graph: three destinations and their owned spaces

The renderer reads one data island per key, so each walkable environment is its own page. `ROOMS` in
`_gen_html.py` registers those pages; it is not a list of album destinations. The hub street leads to
exactly three main places: **Toronto** (the Little-Canada-style hall of model tables), **Tokyo** (the
night lane), and **Fukuoka** (Moji Port on a table). Each has a place-specific box, sightline, surface
kit and stops; Fukuoka's 8.2 m hall leaves a body-width aisle around its 6.6 m solid port table.
Each is designed from the real environment it names, not as a generic room.

A real place may own a nested environment. The Toronto model's CN Tower and Niagara Falls props open
their stories and then their dedicated real spaces; Niagara's Table Rock door owns Journey Behind
the Falls. These are child spaces: their entry remains inside the parent, they get no street door and
no Field notes card, and their exit returns to the owning prop/door with `#at-<prop-id>`. The parent's
own exit then unwinds to its hub door. This is a real place graph, not a linear chain or an invitation
to invent additional destinations.

Field notes is the picker and contains exactly three cards, in the fixed order Toronto, Tokyo,
Fukuoka. Cards enter only those top-level places. Child spaces are discovered by interacting with
the object that represents their actual entrance; their designs retain their real geography,
materials, scale and sequence. Slots are smaller in-room areas and remain frames inside their own
room, not new pages.

A new top-level destination therefore touches `ROOMS`, `DISTRICTS`, the street door, the matching
Field notes card and a gate run. A child space instead needs a row/page, its real parent object or
door, a parent return anchor and a fidelity gate — never a fourth card. `skills/place-intake` is the
checklist for deciding which structure the actual place warrants.

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
district cannot open until its kind is declared; a main-place card that fails to declare it
renders as shut — `Purpose not declared`, `Not open yet` — because an honestly locked door
is cheaper than a confidently wrong one. An owned sub-space follows its parent's entry and
return contract and does not get a top-level card.

#### CSS 3D remains only in the Activities album

The walkable environments no longer use CSS perspective as their scene renderer: pinned Three.js
0.186.1 renders the lane, objects and sourced world, and a browser without WebGL is told so rather
than falling back to a second painter. This CSS note applies only to the Activities album's small
`.ig-grid` tilt, which remains intentionally outside that migration.

Two WebKit behaviours still matter there:

1. `overflow` other than `visible` on a `preserve-3d` element forces its `transform-style` flat;
2. `filter` or `backdrop-filter` on the element carrying `perspective` flattens its 3D subtree;
3. a universal `* { transform-style: preserve-3d }` can make the scene vanish.

Checked against the current stylesheet: `.ig-grid` is the only selector declaring
`transform-style: preserve-3d`; `.ig-wall` owns its `perspective`. Neither currently mixes in
`overflow` or `filter`. Keep those boundaries, and do not add a universal `preserve-3d` rule. The
walkable no-WebGL path is the lane's own written refusal, and the always-readable drawer remains the
no-script path.

There is no iOS Safari in this sandbox, so album behaviour on that browser is unmeasured rather
than proven. The old SPEC §6 maximum-layer-count question was about the proposal's CSS scene; it is
not a requirement for the current Three.js walkable renderer.

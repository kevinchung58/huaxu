---
name: landmark-space
description: Make one landmark object (CN Tower, a drawbridge, a station) into its own walkable space, and wire it the owner's way — press the prop, the IG-style story of the real album opens first, and an enter-the-space action beside it leads into the dedicated room. Use when the owner asks for 「點 X 會先呈現限時動態，旁邊有進入空間」, when a prop should own a room, when a district's subject is one tall or huge object, or when anyone asks how to make a 3D space here *beautiful*. Carries the round-18 repo survey on what makes walkable spaces read well, the scale strategies for objects bigger than a lane, and the beauty gate. Read with `district-author` (the record and the gate), `place-intake` (stops and sightlines) and `lane-prop` (one light, one state) — this skill is only what those three do not cover, namely the landmark's forms, the link contract, and the critique pass.
---

# A landmark, as a space

The owner's round-18 brief: inside Toronto, pressing the CN Tower should first open the IG-story
plate of the real album, with an **enter-the-space** action beside it; that space is the tower,
built for real — not the miniature on the hall's table, but a district of its own. This skill is
the craft for that: which form the space takes, what makes it beautiful, and how the door between
picture and space behaves. The record, the registers and the gate stay in `district-author`;
this file adds the landmark's own problems, because a 553 m tower is not a yatai and the questions
it forces are different.

The research behind §3 and §5 lives in `references/repo-survey.md`: sakura-crossing re-read for
hero objects, a three.js skill pack's lighting/fog/shadow checklists, the designer-skills' visual
critique vocabulary, pannellum's tour grammar, and one CSS-3D slide skill. Read it when a rule here
needs its reason or its source.

## 1. Intake — which *part* of the landmark is the room

A city is not a subject and neither is a building. A landmark at 168 cm eye height is a
*silhouette*, not a space; the space is always one of three honest forms, and the owner chooses
between them at intake because they are different rooms with different light:

1. **The deck.** The room is the view *from* the object. An observation level is a lane whose
   walls are glass and whose far end is everywhere: the city below is the backdrop, the tower is
   the floor you stand on. Its night is a city of lit windows at your feet — which is exactly the
   day-variant problem `street-commons` §3 names (a night texture read at noon), one storey up.
2. **The plaza.** The room is the ground at its foot, and the object is the vista at the end of
   the lane — the way Tokyo's lane ends in its city window, only the window is 553 m of concrete.
   This is the form our renderer already speaks fluently: one-point projection, far plane,
   backdrop. The tower reads by silhouette and material, which is what a model reads by
   (`japan-place` §2, same ruler).
3. **The table.** The object stands small on a lit plinth and you walk around it — Moji's form.
   Right when the subject is a *panorama* (the tower, the dome, the rail yard in one frame) and
   when the moment — an elevator, a turning restaurant — must be watchable from a stop.

The question to ask the owner is therefore not "what should the room be?" but **which of the three
is the thing you remember standing in** — and offer the deck and the plaza as the two that are not
a miniature, because the owner's brief said *真的額外打造*, and the table is the form to refuse
unless they name the panorama. Everything else — stops, materials, the night — you derive, with
reasons, per `district-author` §1 and `place-intake` §1.

When the object is a tower — taller than the sky a lane can hold — the forms above
are not enough; see §7 for the vertical-narrative doctrine and its worked CN Tower example, and
`skills/grounded-scene` for how faithfully any of it must be built (round-20 owner rule).

Scale is authored, not solved. `Z_SCALE`, `OBJ_SIZE` and the hero-object rule (`lane-prop` §1)
already say a 108 m bridge is authored at `w:360` because its real size projects to a line. A tower
in the plaza form is authored by the screen presence the silhouette needs, and the record's comment
carries the true metres beside the authored ones — the Moji bridge's comment is the pattern.

## 2. The link contract — story first, space beside it

The owner's interaction, as a contract the renderer and the emitter both obey:

- **The prop's first press opens the story.** That is the existing rail (`#room-plate.is-rail`):
  the real album's frames, 9:16, blurred own-frame ground, nothing marked viewed. It stays
  exactly as it is; the story is the photograph's format and the owner has approved it.
- **The enter action is a second verb in the plate's chrome, not a second plate.** While the rail
  is open on a frame whose record names a space, one icon button — the site's own glyph vocabulary,
  no words (`district-author` §7) — carries `data-enter-space` to the district's page. The button
  lives in the plate's bottom band where the platform chrome lives, it is `aria-label`led, and with
  scripting off the same destination is an ordinary link in the drawer's list row, because the
  archive survives without the viewer.
- **No space without a story, no story implied without frames.** A prop may carry `space:` only if
  the album has ≥1 frame for it *and* the district row exists; the emitter asserts both, the same
  way `record` images wait for a venue and a date. A door that opens onto a `soon` room prints the
  room's own "not open yet" card instead of navigating — the honest locked door is cheaper
  (`district-author` §1).
- **Arrival poses you at the thing.** Pannellum's scene-hotspot carries a target yaw and pitch;
  ours carries `#at-<prop>` into the new page and the renderer spawns at the stop that names the
  door you came through, facing the landmark (`place-intake`'s stop rule applied to a doorway
  between rooms — today `#at-` does this only from rooms onto the street; the landmark space
  extends it, and that extension is renderer data, not a new library).
- **The way back lands on the prop.** `Esc` unwinds plate, list, then leaves; leaving returns to
  the room the prop stands in, at the prop, because the connection between spaces is a walk's
  memory, not a teleport (`AGENTS.md`, hub rule). A `leave` on the space's exit names that page.

What this contract refuses: the space replacing the story (the photograph is the record; the space
is the model — one is evidence, the other is craft, and neither stands in for the other), and a
chain of onward doors (the hub rule: rooms hang off a place you stand, not off each other).

## 3. The beauty system — what the survey says makes a space read well

`SKILLS.md` §3 names the benchmark; this is the checklist that gets a landmark to it, every item
with its source in `references/repo-survey.md`:

- **Silhouette hierarchy is authored.** The landmark gets one of the palette's reserved saturated
  accents; every other prop stays mid-tone (sakura's `PAL` rule). At 20 m the object is recognised
  by outline and material, never by detail — so the silhouette is drawn first and the detail is
  earned later, and the lane-shot sheet is read at arm's length before it is read at arm's length
  from a screen.
- **One moment, on the body of the object.** The elevator runs the shaft; the night pattern comes
  up at its `liton`. A beacon blinking at low alpha is not a moment (`SKILLS.md` §3, sakura's
  crossing sequence). Author the moment before the furniture, because the stops are placed to
  watch it.
- **One temperature family per hour; a second temperature is an event.** Sodium street, fluorescent
  machine, warm interior — the street learned this as the vending machine's cool tint (round 17).
  A tower at dusk is one warm interior against one cool sky; if two families burn at once the frame
  reads fake (the three.js pack's first lighting pitfall).
- **Depth is painted, not hoped for.** `FOG_MAX` murk, the far plane's own exposure, and the
  round-17 shadow/pool system: contact shadow under every body, the landmark's own cast shadow by
  hour, pools at night. A tower that throws no shadow on its plaza is a decal, and the harness
  (`_shadowdrawn.mjs`) exists because a shadow in the comments is not a shadow.
- **Rhythm on the surface.** Window grids, mullions, panel seams — repetition with one break is a
  facade; uniform repetition is a texture, and the critique calls it monotony. The facade's bands
  align at a constant height the way a shopping street's fascias do (`japan-place` §5) — cadence
  without lettering.
- **Detail that rewards looking.** Interiors visible through the deck's glass: a lit room, a
  railing, a floor line — three quads that are only found by looking. Sakura's check is ours: the
  detail is in the data, and the plate's caption never announces it.
- **The critique pass, not the vibe pass.** Run `critique-composition`/`critique-color`'s loop —
  Observation → Problem → Fix, rated — over the lane-shot sheet with the dimensions renamed for a
  space: silhouette, light hierarchy, depth, rhythm, palette coherence. The numbers (luma, colours,
  fills) catch collapse; the critique catches a frame that passes every number and still tips
  top-heavy. Both are in the gate, neither replaces the other.

## 4. The renderer, honestly priced

What exists today covers the plaza form end to end: one-point lane, vista + backdrop, stations,
states, day/night, the shadow and pool system. The deck form needs two things the renderer does
not have, each priced, each its own decision:

- **More than one aperture.** A deck looks out on more than one side, but a lane authors one
  vista, and yaw clamps at ±35° for the reason `district-author` §2 states — past it the walls
  show their own edges. The honest forms inside the rule: a deck whose glass wraps as *bands* of
  the backdrop painter (the skyline painter already composites sky, masses, water), or a turn of
  authored stops where each stop is a facing (`stations` already pose you). A true panoramic yaw
  is a renderer change and takes the SPEC §9 conversation with the owner — it is not smuggled.
- **A city under glass.** The day-variant textures (`street-commons` §3's open item: the night
  window grid read at noon) must exist before the deck does, because the deck's floor-to-ceiling
  window is that texture at full frame.

So the build order when the owner says go: **plaza first** — it is the form the renderer speaks,
it makes the silhouette and the moment, and it is the room the owner's brief pictures — then the
deck as the second district, once the day-variant city exists. Never both in one record: two open
districts in one page is the floating-objects regression `AGENTS.md` names.

**What the two shipped spaces taught (rounds 21-22).** The prices above held, and three new
ones are now proven rather than predicted: a day page's open end works for a landmark exactly
as it does for the hub street (the last stop walks past the end wall to a rail, and the
backdrop painter owns the world beyond it); a landmark's signature object may reuse the
site's proven small-scale shape at real scale when a bespoke panorama washes out under the
affine-plus-flat-colour math (the falls), while a city-from-above rides a wall cladding tile
(the pod) — fidelity lives in the bearings and the ratios, not in the drawing technique; and
sky bands must start below the horizon and end above the frame's top with glow near one, or
the day sky reads as night murk (the street's idiom, reused). Each of these stayed inside the
dependency rule: new tiles, one painter, no library.

## 5. The gate

`district-author` §4's gate unchanged, plus, for a landmark space:

- `node .verify/_shadowdrawn.mjs <page>` — the landmark's shadow and the furniture's pools report
  PAINTED; a NEVER on any of them is the round-17 bug class, and it has already shipped once.
- `_lumacheck`-style rows for the new page at its noon, dusk and night, from the first build —
  the exposure is one authored value (§3), so it gets measured from the first frame, not after.
- the lane-shot sheet, read twice: by the gates, and by the critique pass (§3), with the ratings
  recorded in the commit message the way round numbers are.
- the link contract asserted by `node .verify/verify-story.mjs` (round 21, against a server on
  :8080): the prop carries a story, pressing it opens the rail first with the story's frames, the
  enter-space verb sits in the plate chrome and leads into the space, the space's states press,
  and the way back unwinds to the prop's room. The contract is no longer a hope; it is a gate.

## 7. The whole structure, simplified — the vertical narrative

The round-19 owner's brief: not one form of the landmark, *the whole of it* — 「整個CN塔的空間」 —
with permission to simplify appropriately. This is the doctrine for that, and it is a doctrine about
narrative, not geometry: **a renderer whose eye is at 168 cm and whose pitch stops at +10° can never
show a 553 m object in one frame, so "the whole" must be compressed into the beats only a space can
give, and the beats a photograph gives better are handed to the photograph.**

The split falls out of the link contract (§2): the IG story carries the exterior — the silhouette,
the skyline, the postcard — because a real photograph of a tower is evidence and reads at any scale;
the space carries what a photograph cannot — the ascent, the height under your feet, the city as a
floor. A plaza page that re-draws the silhouette in code would be a worse picture of the thing the
album already holds, which is the backdrop-of-a-backdrop failure `place-intake` exists to prevent.

So the whole structure becomes one district, one lane, read as a vertical journey:

1. **The elevator is the door, and the door is the moment.** The entry from the story lands you in
   the cab at the foot of the shaft; the shaft's ribs and a light stripe run past (motion on the
   body of the ride, `SKILLS.md` §3), the real 58-second climb compressed to a few authored seconds,
   and the doors opening *is* the transition into the next beat. The elevator is not a page and not
   a cutscene: it is a stop with a state, and reduced-motion gets the doors without the run.
2. **The LookOut is the main room.** The city below is the room's content: the backdrop's city,
   read from above, wrapped as bands the stops face into (the one-aperture rule of §4, honestly
   used: a 360° pod is three or four authored facings, not a renderer change). Floor-to-ceiling
   glass is a material band, not a view; the restaurant that rings the pod is one warm light band
   at its own `liton` and is never modelled — a room with people eating is a room with people.
3. **The Glass Floor is the moment the whole tower exists.** Standing on 24 m² of glass and looking
   straight down the length of the shaft is the CN Tower's roof-that-opens: the 553 m reads as the
   drop under your feet, which is the one frame no photograph of the exterior can give. It is one
   new tile (the city, seen down, through 64 mm of glass) and one state (step on, step off), which
   is exactly the geometry-change contract `lane-prop` §4 already speaks.
4. **The SkyPod is a band, not a room.** One higher sky band in the backdrop, one stop that faces
   it, and the horizon a shade further — because the sources say the gain over the LookOut on a
   hazy day is small, and a second room that repeats the first with a thinner horizon is length,
   not a place (`street-commons` §1).

What is dropped, and why each drop is the simplification rather than a loss: the exterior page
(the photograph's beat), the antenna climb (nothing new to see above the SkyPod band), the
restaurant interior (people), the SkyPod room (repetition), and the literal vertical geometry —
the vertical is carried by the moving shaft, the drop under the glass and the city-from-above,
because in a one-point lane *altitude is a texture and a vista, never a coordinate*. The facts
the record cites, with sources: 553.3 m, opened 1976; LookOut 346 m floor-to-ceiling 360°;
Glass Floor 342 m, 24 m², the world's first (1994); SkyPod 446.5 m; the glass-fronted elevator's
58-second ride.

Build order inside this doctrine: the LookOut first (it owns the vista the elevator doors open
onto), then the glass floor's tile and state, then the elevator stop, then the SkyPod band — each
a measurable commit, the whole never blocked on its tallest part.

**Round-20 correction (owner).** The simplification above was priced wrong. The owner's rule is
stricter — 「有些細節可簡化，但大部分體驗必須差不多」 — and the build must be grounded in the real
place (Google Maps-class sources), per `skills/grounded-scene`. So the beats stay as the
*sequence*, but each beat is authored from the measurement table's real bearings (the lake south,
the stadium at the base, the glass floor below the deck), no real level is deleted to shorten the
lane, and what shrinks is detail — materials, decoration, window counts, the 58-second clock —
never the experience. §7's drops are re-priced there: the exterior stays with the photograph
because the IG-story plate *is* the real exterior, and everything else survives, grounded.

## 6. Refusals

Everything `district-author` §5 and `japan-place` §5 refuse, plus: no auto-rotating camera and no
fade between spaces (pannellum's comforts; ours is a walk, and idle is the idle pump, not a spin);
no glassmorphism chrome on the plate (the enter button wears the site's own icon set); no second
palette for one room unless it is authored as CSS variables switched as one and measured like a
`VER`; and the deck is never built as a parallax photograph — that product was refused twice
(`SPEC` §9(e)) and a refusal with a reason is not a backlog item.

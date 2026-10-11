---
name: street-commons
description: The street the rooms stand on — the hub's layout system, a second street or district arm, seaside and harbour promenades, and the walkable sunlit day. Use when the owner asks for more 街道, for 海灘/港/海邊/沿岸/運河/河堤, for daylight or 有太陽, for a plaza or commercial strip, for more rooms on the street, or when a district should be reached by walking somewhere rather than through a door. Carries the palette/sun constraint that makes daylight a stylesheet decision rather than a scene one; read it before promising a sunny street.
---

# The commons: the street, and what it means to add to it

Every room on this site is reached by walking. `street.html` is the hub — a 7.0 m walkable spine
7.0 m wide and 10.4 m long in record depth, extending to 34 m of true walk depth, with a door per
room on either side, lit poles, strung wires, kerbs and tactile paving. The owner's picture of it is
a **street you walk along, with a region for Japan and a region for Canada, a door into each room,
and — this is the new part — sea and harbour views along the way, in sunlight.**

That last clause is the whole difficulty. Three things stand between the current street and it, and
they are of different sizes: the **light** (a stylesheet decision, and a design question for the
owner), the **kit** (materials and shapes the renderer does not have yet), and the **layout** (which
is arithmetic, and this skill). Do them in that order of honesty — the layout is the cheapest and
the light is the one that decides whether the result is what he asked for.

## 1. The street is a sequence of places, and the doors hang off it

The hub is not a corridor with doors in it; it is a **street with regions**, and each region is a
change of what is around you. That is the structure the owner is asking for, and it does not need a
second page — it needs the one street to have more than one character along its length:

| Where | What it is | What the visitor sees |
|---|---|---|
| the mouth | arrival, and the way back to the album | the album door behind you, the spine ahead |
| the near half | the **Canadian quarter** | the Toronto door, brick and plaster, a bench, cool shade |
| the middle | the crossing | the wires, a pole, a drain, the widest point |
| the far half | the **Japanese quarter** | the Tokyo and Moji doors, shutters and brickwork, a vending machine's glow |
| the end | **the opening** | the vista aperture, open ground, the skyline |

Two rules make that legible rather than merely decorated:

- **A region is a change of material and light, not a label.** The street's `surfaces` table already
  does this: `dado`+`plaster` on one stretch, `shutter`+`brick` on the next. A region earns its name
  when a visitor walking through it can feel the change without being told, and the honest way to
  describe it in a `say` line is what is there, not which country it is.
- **Every region gets a reason to stand in it.** A stop, a bench, a lit thing, a view. The street's
  stations are the six places it is worth being; a new region that adds nothing to stand in front of
  is length, not a place.

Keep the door objects on the spine and keep them in the record — that is the structure that makes
"walk down the street and step into the region" work, and it is already built. A new place is still
a row in `ROOMS`, a record in `DISTRICTS`, **a door on the street**, plates in `IMG_RULES` and a
gate run (`skills/place-intake`).

## 2. The arithmetic of two borders (what a seaside street costs)

This is the part the owner is actually asking for, priced honestly. A promenade is a **bordered
lane**: one side is the built edge (shops, walls, railings), the other is the sea. In a record that
means `surfaces` for each side, `marks` for the quay and the path, a backdrop for water and sky, and
a run of props between. The layout math is in `references/street-system.md`; what matters here:

- **`max_d` is how far you can walk out of your own walls.** The street already uses it (`max_d:
  3400` against a record `d` of 1040) to let the walker carry on into open ground. An L-shaped
  promenade — down the street, then along the water — is a second lane whose mouth is where the
  first one opens, not a new renderer.
- **A shoreline behind a wall is not a promenade.** If the water is beyond the built edge, the
  visitor never stands on the water. The boarding must be on the walker's side: a quay edge, a
  railing with a gap, sand at the end of a slipway, a bench facing out.
- **Two horizons cannot both be the far end.** A lane's far end is authored once (`vista` +
  `backdrop`): if the sea runs along the side, the far end is still the street's own, and the water
  is what the *side* opens onto. This is a real constraint of a one-point projection, not a rule;
  `references/street-system.md` §4 has what it means for the backdrop.

## 3. Daylight: built, measured, and what is still the owner's

**It exists now.** A record says `"day": True` (or `{"cycle": 900, "start": 0.45, "gain": 1}`), the
emitter stamps four `data-lane-day-*` attributes on the layer, and the renderer gives that page its
own clock: a longer cycle (fifteen minutes, the reference hall's own, because four minutes hands a
visitor dusk before they have looked around once) starting a little before noon. Night still comes.

What that buys, measured on the served page in a headless Chromium — mean luma of the whole frame,
and what fraction of the frame is near-white:

| the street, before | | the street, `"day": True` | |
|---|---|---|---|
| page load (its clock at 08:00) | 76.9 | opens 11:50 | **184.3** |
| its noon, `SUN 1.0` | 83.2 | dusk | 70.5 |
| its dusk | 68.8 | night | 62.0 |

Near-white stays at 0.06% at all three, so the sun is not washing the frame out — and the swing is
122 luma from noon to night, which is a street that has a day rather than a bright room.

**Why it needed a mechanism and not a number.** `lit` cannot carry sunlight: it tops out at a 28%
warm wash over a tile's own colour, and every tile in this file is a night value (asphalt `#37435c`,
dado `#3f5170`). Daylight is *additive* — the quad is filled again under `lighter` in a warm
near-white by how high the sun is — and it forced four other things to answer, each of which was
found by looking at the frame rather than by reasoning about it:

- **the lid.** `drawRoom()` paints a flat `#232f4a` over the whole lane at `CEIL` every panel. It is
  sky now on a day page: two authored blues blended by the panel's own depth, so it is deep overhead
  and pale toward the far end, and it opts out of the lift (`day: false`) because adding the sun's
  colour to the sky makes the sky white.
- **the air.** `FOG_MAX` is the hall's murk, and unchanged it read as a foggy morning — 3 luma
  between the floor and the middle of the frame. It clears to 38% of itself at noon.
- **the glows.** A lamp keeps a floor of light in daylight, which is right for a machine. The far
  end's "somewhere open" bounce at `k: 0.5` was a white blob 135 cm across at noon; on a day page the
  sun takes the glows' share away. A lantern's cone of light is a night object and is not drawn.
- **the far compound is a *picture* at its own exposure.** The sky and the distant masses wash pale
  with the air (nearly all the way for the sky, half for the mountain, almost not at all for the snow
  cap); everything out there that is a *surface* — the plaza, the crossing, the roofs — takes the
  lane's lift at a reduced gain (`q.daygain`), because a surface that is already lit for a night and
  then lifted is a surface that reads as blown out. Blanket-excluding the whole compound was the
  first attempt and it left a dark wedge at the end of a sunny street.
- **and a lantern's paper is neither.** It carries its own lit value and skips both the lift and the
  night's darkening (`nolite`), or the sun washes its red to pastel — which is exactly what happened
  once, in the first frame this feature produced.

**What is still not built, and is therefore still the owner's to ask for:**

- **a cast-shadow pass** — *answered by a moving authored shadow (round 16).* The day page now
  carries a sun with an azimuth and an altitude (`sunAz`, `sunAlt` from the page's own clock): a
  wall's floor shadow is `H / tan(altitude)` long, on the azimuth's side, so it lies long across
  the floor at the edges of the day, shrinks to a sliver at noon, and changes sides after noon;
  the face turned from the sun takes a third of the lift; each awning's wall-shadow slides and
  leans with the sun; and the harbour's glint column stands under the sun, not under the lens.
  Every shadow quad is `day: false`, because the one way a shade system betrays itself is the sun
  washing its own shadow away. Uniform noon measured 193.1; with shade 179–189 by the hour.
  Per-prop cast shadows joined in the same round: every body prop (boxes, bikes, planters, cones,
  A-boards, booths) runs a floor shadow `h / tan(altitude) × |azimuth|` long away from the sun,
  and where the run meets a wall it climbs it — so a crate against the lit wall wears its own
  shadow at the right hour. The shadow system is complete as authored geometry; a shadow map
  (soft edges, overlapping casters) would be a renderer, not a correction.
  One caveat the seventeenth round found and fixed: the *wall's* floor shadow — the two strips —
  had been `add()`ed after `quads.forEach(emit)` in `drawRoom()`, which means it was pushed into
  the array and never painted. The comments, the measurements and the commit message all claimed
  a shadow the screen did not have, and no structural harness saw it, because the fill count is
  unchanged either way. `.verify/_shadowdrawn.mjs` boots the served page and reports per fill
  colour whether it was ever asked for; on the round-16 build the wall shadow reads NEVER. It is
  now painted on the canvas in the light pass (`ground()`, far-to-near, alpha × `DAY()`), the
  same pass the night's pools live in — and that is the rule to keep: a quad created after the
  emit is a quad that does not exist, so anything the light system draws after it is drawn by
  the light system, not queued for a pass that already ran.
- **the night rhythm** — *built in round 17.* The street's night used to be four dots in a navy
  tube: the halo and the paper were there, the light on the ground was not. A lamp now reads
  three ways at night — halo in the air, body, and pool on the pavement (`groundLight()`), the
  pool's size from the source's own height and `k` (5 m street lamp ≈ 3.7 m across, a paper
  lantern ≈ 2 m of soft light), its alpha the same `glowStrength` the halo is drawn at, so a
  light whose `liton` has not arrived has no pool. A fitting low on an awninged front does not
  pool, it spills: a wide shallow trapezoid across the threshold, two metres out at most
  (`spill`, stamped by the emitter on the glow of any `awn` front — an un-stamped field never
  reaches the renderer). Shopfronts and lanterns carry `liton` (0.66–0.90, alternating down the
  walk) so the evening arrives as a wave, and the lantern's cone is drawn at the lantern's own
  strength with a wider fainter 暈 under it. Pools are night's the way shadows are the day's
  (`day: false`): the two never share a patch of pavement. The night's floor luma moved 65.0 →
  67.3 when the pools arrived; 65.0 was a measurement, not a target, and it stayed a measurement.
- **day variants of the tiles that are still night.** The distant city's window grid and the water
  tile are night values: a city of lit windows at noon is the one thing in that frame that still says
  "night". The fix is the one the skyline already has (a second texture per variant, not a tint over
  the first — a flat tint over a window grid removes the variation that makes it read as windows).
- **the coast kit itself** — §4, and `references/promenade.md`.

Measure any of it the same way this was measured: mean luma and near-white share over a few points of
the page's own cycle, on the page the server serves, before and after. A claim about sun that is not
this table is an assertion.

## 4. The kit a sunlit coast needs, and what the renderer has

| The place | What it must be built from | Exists today? |
|---|---|---|
| the sea | a water body wider than a `pool` prop: a quay wall or a beach line, three tone bands (shallow, deep, far), a horizon | **no.** `pool` is a tabletop prop; `water` is a night tile |
| the harbour | quay edges, bollards, a stepped slipway, a crane or a shed, moored hulls and their masts | partly — `boat`, `ship` shapes exist in the Moji kit |
| the beach | sand, a shingle line, a sea wall or a footpath, dune grass, breakwater blocks | **no.** No sand material in the walk renderer, no beach props |
| the promenade | railing or parapet, lamps, benches facing out, a widened bay with steps to the water | benches, lamps, kerbs yes; a railing and a quay edge **no** |
| the town behind it | fronts, awnings, shutters, poles and wires | yes — the whole Japanese street kit (`skills/japan-place`) |
| a hillside behind the town | silhouette, terraces, retaining walls, stairs | **partly** — the street's backdrop has mountains as flat silhouettes |

`references/promenade.md` holds the numbers from the reference build (quay, breakwater, beach,
hill road, riverside) and the refusals that come with them. The renderer's material register and how
each name fails is in `skills/japan-place` §3; a new material means a paint function, a `PATS` entry
and a `FLATOF` colour together.

## 5. The order to build it in, when the owner says go

1. **Decide the light** (§3) — it changes every material's value, so doing it after the props means
   re-measuring all of them.
2. **Lay out the street** — regions along the spine, the doors that already exist, the new border
   opened on one side, and the stations that make each region a place to stand
   (`skills/district-author` §2 for the record, `lane-prop` §5 for siting).
3. **Build the water and the quay** — the first thing the visitor recognises as "港", and the thing
   with no kit yet.
4. **Dress both edges** — the town side from the Japanese street kit, the sea side with a railing,
   lamps and what is moored.
5. **The commercial strip**, if the asking is still 商店街 after the water: one unit spec, repeated,
   which is a texture job rather than a modelling one (`references/shopfront.md`).
6. **The ornament, once** — a torii, a market hall, a drawbridge. The reference's own rule: it is
   what people remember, and repeating it makes the street generic.
7. **Measure the walk, both ways** — from the mouth to the water and back, with `SKILLS.md` §4's
   discipline. What will fail here is sightlines, not structure: a stop that shows the visitor a
   wall, a door that is reachable but invisible until you are on top of it, water that only appears
   once you are already past it.

`skills/lane-prop` is the mechanics of every single step above. `skills/japan-place` is the object
table. This skill exists only for the things neither of them covers: the commons itself, the cost of
daylight, and the order.

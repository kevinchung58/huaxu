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

## 3. Daylight is a stylesheet decision, and it is the owner's

The scene's day/night is already a cycle: `dayPhase` over `DAYLEN = 240` seconds, `SUN()` and
`NIGHT()` derived from it, `AMBIENT` and `FOG_MAX` as exposure, one `lightAt()` falloff everything
obeys. `street.html` opens at `(T + 78) / 240`, which is morning, and the cycle passes its own noon
about 42 s after the page loads.

**And that noon is not daylight.** Measured in a headless Chromium on the served page — mean luma of
the whole frame, 0–255, at five points of the street's own day:

| when | `dayPhase` | SUN | mean luma | top 12% (sky/lid) | mid | bottom 12% (floor) |
|---|---|---|---|---|---|---|
| page load | 0.33 | 0.73 | 76.9 | 59.1 | 85.1 | 86.1 |
| +22 s | 0.42 | 0.97 | 83.1 | 63.3 | 89.6 | 94.6 |
| **+42 s (noon)** | **0.50** | **1.00** | **83.2** | **63.4** | 89.6 | 95.0 |
| +97 s (dusk) | 0.73 | 0.27 | 68.8 | 53.7 | 79.1 | 75.4 |
| +152 s | 0.96 | 0.04 | 57.6 | 45.9 | 71.7 | 59.3 |

**The sunniest moment of the street's day is a third of full brightness**, and six luma points above
the frame the page opens on. So the street does not "start at night": the sun is real, it moves, and
it is nearly invisible, because **almost nothing in the frame answers to it**. The sky over the lane
is a record-authored night gradient (`#4a5a84` / `#2c3859` / `#1e2946`) under a flat `#232f4a` lid
that `drawRoom()` paints at `CEIL`, and every material tile — asphalt, plaster, brick, shutter, water —
is a night value. Turning `SUN` up cannot light a scene whose surfaces were authored for a lamp.

Measure this before and after any daylight work — it is one page load and a screenshot, and a claim
about "sun" that is not this table is an assertion.

So "有陽光" is one of three changes, and they are not equivalent:

1. **Give the lane its own day** — a per-page start phase and cycle length, so the street is at noon
   when the visitor arrives and stays there instead of handing them dusk four minutes in (the cycle
   is 240 s). Cheapest, changes no material, and the measurement above says what it buys: the frame
   the page already opens on, plus six luma.
2. **Make one place always-day** — pin the phase and give the palette its daylight values: the sky
   painted as sky, a sunlit water tile, sand and shingle, and a shadow strategy. This is the one that
   matches what the owner described, and it is a renderer change with a checklist rather than a
   config line.
3. **Change the site's day** — a decision about every room, including the two whose whole subject is
   dusk and a lit lane. Do not do this without asking.

All three start from the same deficit, and it is the reason option 1 is not enough on its own: the
street's surfaces were authored for a lamp, so its noon is the night frame plus six luma points. What
any of them needs, read off the current files rather than guessed:

- **The sky is painted with a lintel over it.** `drawRoom()` paints a flat `#232f4a` quad over the
  whole lane at `CEIL` every panel (and the comment concedes "out of the bulbs' reach, and it should
  look that way"). A daylight street needs `CEIL` to be painted as *sky* — a gradient by
  `dayPhase` — or raised until the lid is out of frame.
- **Every material in the palette is a night colour.** `paintWater` is `#27496a` with a pale green
  sheen: at noon under a lid it reads as wet slate, not sea. Daylight needs a sunlit water tile
  (broken light, a horizon line), a sand and a shingle, and the concrete and asphalt tiles read in a
  higher key than they do after dark.
- **Nothing casts a shadow.** There are contact shadows under props (a soft dark quad at the base)
  and no light-directional shadow anywhere. A sunlit street without cast shadows is flat by
  construction, so either the renderer grows one directional shadow pass for the props that matter,
  or the day is authored as *shade*: awnings, colonnades, tree canopies and the far side of the
  street darker than the near side. The second is a texture job and is honest about what the renderer
  can do; the first is a rendering change and is its own PR.
- **`AMBIENT 0.42` means nothing is black**, and that number is what makes an unlit daytime surface
  look like a dark room. A day is not `AMBIENT` raised; it is the sun term and the sky term, which
  means `lightAt()` grows a sky contribution it does not have.

None of that is in the skill's gift to decide. **Bring the owner the choice with the cost attached**
— "the street opens at noon and we fix what that exposes" versus "this one place is built for
daylight, which means a sun and a shadow in the renderer" — and do not quietly ship a bright room
with a navy lid over it.

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

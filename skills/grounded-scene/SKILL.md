---
name: grounded-scene
description: Build an experiential scene (體驗場景) that must feel like the real place it recreates. The owner's standard is that some details may be simplified but most of the experience must stay close to reality, and that builds are grounded in actual sources — Google Maps, Google Earth, Street View, official floor plans, the owner's own photographs. Use whenever a room, district or landmark space recreates a real place, when the owner asks whether the build is based on real geography, or before any bearing, level order or vista is authored. Carries the ladder of evidence, the measurement table, the fidelity contract — what may shrink (materials, decoration, furnishings, travel time) versus what must not (spatial sequence, scale, sightlines, distinctive geometry) — and the fidelity gate. Read with `place-intake` (questions to the owner), `district-author` (record and gate) and `landmark-space` (forms and link contract) — this skill governs how faithfully any of them is built.
---

# An experience scene, grounded in the real place

The owner's round-20 correction, in his words: 「要不要根據實際 Google 地圖還是甚麼地去建構……
有些細節可簡化，但大部分體驗必須差不多。」The round-19 doctrine in `landmark-space` §7 compressed
the CN Tower into narrative beats and dropped parts of the real thing to do it; the owner's rule is
stricter and simpler — **build from the real place, keep the experience nearly the same, let only
the details shrink.** He also said this will recur (「你到時候會做很多這種體驗場景」), so this is
the standing method for every scene that recreates somewhere real, not a CN Tower exception.

What "nearly the same" means operationally: a visitor who has stood there should look at the stop's
lane-shot and recognise the place — the right lake on the right side, the right stadium under the
pod, the right order of floors under their feet. It does *not* mean a CAD model, exact window
counts or photoreal materials; this renderer cannot do those and the owner never asked for them.

## 1. The ladder of evidence — where "real" comes from

Every authored fact traces to a rung. A claim with no rung is an invention, and inventions are
never built (`SKILLS.md`, "what may never be invented").

1. **The owner's own experience** — their photographs, their IG-story frames, their memory,
   extracted by `place-intake`'s grilling. Highest authority on *what mattered*: which facing they
   actually looked at, what hour, what weather, which detail they keep mentioning. The owner's
   memory outranks every map when the two disagree about emphasis — the map outranks it about
   geometry.
2. **Official material** — the place's own level tables, floor plans, "plan your visit" pages,
   press kits. Authority on *sequence and official numbers*: what levels exist, in what order,
   at what height, what each contains, what year, what records. (CN Tower example: 553.3 m,
   opened 1976; LookOut 346 m; Glass Floor 342 m, 24 m², world's first 1994; SkyPod 446.5 m.)
3. **Satellite / map imagery** — Google Maps, Google Earth, OpenStreetMap. Authority on *footprint
   and context*: the building's real orientation, what stands next to it, the real distance to the
   shore, the street grid's angle. This is the rung that answers 「根據實際 Google 地圖」 — read it
   before choosing any facing.
4. **Street View and official panoramas** — what each facing *actually sees*. Authority on
   sightlines: if a stop faces a direction, this rung says what is in that direction. Every
   authored vista is a real vista with a real bearing, or it does not exist.
5. **Photographs and video** (official and third-party) — authority on *light and material mood*:
   what hour the place looks best, what the glass does at dusk, how the observation deck's
   interior actually reads. Feeds the palette, not the geometry.

Record each rung used with its URL in the district record. If a rung cannot be reached in this
sandbox (Street View cannot be panned from here), say so honestly in the record and lean on the
rungs that can be reached — official panorama stills, floor plans and satellite reads — rather
than inventing what the unreachable rung "probably" shows.

## 2. The measurement table — between source and code

"Measure, never assert" (`SKILLS.md`) made concrete. Before any geometry is written, the sources
become one table, committed inside the district record:

| claim | value | bearing / facing | source rung |
|---|---|---|---|
| e.g. Lake Ontario | due south of the pod, horizon ~visible from 346 m | S | rung 3 + rung 4 |
| e.g. Rogers Centre | at the tower's base, NE of the shaft | NE, close | rung 3 |
| e.g. Glass Floor | 4 m below the LookOut level, 24 m² | down | rung 2 |

Rows are the things the scene promises: heights that matter, the real order of levels, what each
authored facing sees, distances that set scale, the distinctive geometry that identifies the
place. The table is what the gate checks (§5); a stop with no rows is a stop that hasn't been
researched.

## 3. The fidelity contract — what may shrink, what must not

**May shrink (details):** materials collapse to bands and palette colours; decoration to one
representative prop; furniture to its count-free impression; exact window mullions to a rhythm;
travel time (the real 58-second elevator ride plays in a few authored seconds — the *ride* stays,
only the clock shrinks); people to zero (no scene here has people anyway).

**Must not (the experience):**
- **Spatial sequence** — levels, rooms and stops in the real order. The real place's order is the
  narrative; reordering or dropping a level to shorten the lane cuts the place, not the detail.
- **Scale relationships** — what is big beside what. The pod is small against the drop; the
  stadium is small under the pod. Getting one relation backwards reads as a fake instantly.
- **Sightlines** — real bearings from rung 4. South is south; the lake is where the lake is. A
  vista that belongs to another direction is an invented vista.
- **Distinctive geometry** — the shapes that identify the place: the pod's flare, the shaft's
  taper, the glass floor's position *below* the windowed deck. These are the difference between
  "a tall tower" and "this tower".
- **The owner's hour** — if the memory is dusk, dusk is authored; the day-variant rules of
  `street-commons` §3 apply.

And the round-19 lesson stated as a rule: **a beat may be compressed, never deleted to save
work.** Compression (58 s → a few seconds, 360° → authored facings) is detail-level and allowed;
deletion (no exterior at all, no SkyPod at all, no glass floor because it needs a new tile) is
cutting the experience and is refused.

## 4. Fidelity inside this renderer

The renderer's honest price (`landmark-space` §4) stands: 168 cm eye, pitch ±10°, one authored
aperture per stop, `Z_SCALE` 2.9, CSS-transform/canvas-raster only. Grounding does not renegotiate
any of it — it governs *what is chosen* within it:

- Fidelity here means fidelity to **what the eye sees from the stop**, not to a model of the
  object. A 360° observation pod is three or four authored facings — and those facings are picked
  from the measurement table's real bearings, not from whatever composes best.
- Verticality is carried by what is real about it: the moving elevator shaft, the drop read
  through the glass floor, the city-from-above — each grounded in a rung, none needing a pitch
  the renderer does not have.
- The exterior silhouette remains the photograph's beat (`landmark-space` §2 link contract) — not
  because the experience drops it, but because the IG-story plate *is* the real exterior, at full
  photographic fidelity, one press away. That is the most grounded the exterior can be.

## 5. The fidelity gate

On top of the `district-author` gate and the beauty gate (`landmark-space` §5):

1. Every stop's sightline list traces to the measurement table, and every table row cites a rung.
   An uncited row fails the gate the way an unregistered raster fails the build.
2. The lane-shot sheet is read twice as usual (numbers, then critique pass) — and the critique
   pass now compares **against the reference panoramas**: Observation → Problem → Fix, with the
   real place as the standard, not the last draft.
3. The recognition test: put the stop's shot beside a real panorama of the same facing. If
   someone who has stood there would say "that's the wrong place", the gate fails, whatever the
   luma rows say.
4. Sources beat the build: when the record and the geometry disagree, the geometry is wrong.

## 6. Worked example — the CN Tower, corrected

The beats of `landmark-space` §7 survive as the *sequence*, and every one is now grounded rather
than composed: the LookOut's facings come from real bearings (Lake Ontario to the south, Rogers
Centre and the rail corridor at the base, the downtown grid to the north and east); the Glass
Floor shows the real plaza and streets 342 m below, 64 mm of glass between; the elevator keeps
the real 58-second motion in compressed time; the SkyPod band keeps its real differentiator
(height, horizon, the narrower window band the sources describe). Simplified: materials,
decoration, window counts, the clock. Not simplified: which way you face, what is there, which
level comes next. The round-19 drops are re-priced under §3 — the exterior stays with the
photograph (that is maximum fidelity, not a drop), and no real level is deleted.

The same method, second place — Niagara Falls (round 22): the measurement table came first
(crest ~670 m, drop 57 m, plunge pool 35 m; American Falls 21-34 m onto its talus; Table Rock
at the lip; the promenade north; the gorge running north; mist and rainbows as weather —
sources in TODO §0c). The lane is the promenade's last stretch walked in the day, park hedge
on one hand, the falls' mist worn as the other wall's cladding, and the last stop walks past
the end wall to the Table Rock rail, the way the hub street walks out onto its quay. The
falls themselves reuse the site's proven falls shape at real scale — the sheet-over-ledge-
into-mist that reads on the hall's table — because the critique pass found a bespoke aerial
panorama washes out under this renderer's affine-plus-flat-colour math, while the in-house
draw reads. The painter keeps only what no prop can carry: the gorge river, the rainbow when
the sun stands in the spray, the rail. Simplified: crowds, lettering, the skyline's towers,
the clock of the mist. Not simplified: the crest's breadth-to-drop ratio, Table Rock at the lip, the river's north,
the islands between the falls. And the ticketed descent is compressed, not deleted: a door at
the rail end opens Journey Behind the Falls — the bedrock tunnel at its real section, the
portal a window of falling water, the open end the deck at the curtain's foot, floodlit
after dark — one lane, four stations, every figure from the sources.

## 7. Refusals

Everything `district-author` §5 and `landmark-space` §6 refuse, plus: no invented bearing — north
is north; no panorama photograph turned into a parallax room (refused twice, `SPEC` §9(e)); no
scene content from a rung that cannot be cited; no deleted real level or room to shorten a lane —
shorten the detail, never the place; and no claim of having "checked Street View" from a sandbox
that cannot reach it — say which rungs were used and which were not.

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
pod, the right order of floors under their feet. It does *not* mean a CAD model, exact window counts
or photoreal materials; the current hybrid renderer does not claim those, and the owner has not asked
for them. Three.js changes the geometry path, not the evidence standard.

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
| e.g. Rogers Centre | ~190 m west-south-west of the shaft, roof 86 m | WSW, close | rung 3 (OSM way 7969701) |
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
work.** Compression (58 s → a few seconds, presenting a 360° room through authored facings) is
detail-level and allowed; deletion (no exterior at all, no SkyPod at all, no glass floor because it
needs another rendering technique) is cutting the experience and is refused.

## 4. Fidelity inside this renderer

The renderer's current contract (`landmark-space` §4) stands: 168 cm eye, a full yaw turn, pitch
bounded at ±24°, and `Z_SCALE` 2.9; all walkable lane and object geometry is rendered through the
owner-approved Three.js 0.186.1 scene, with sourced `backdrop.world.prims` added when present.
Canvas2D remains the complete fallback without WebGL. The actual room records and openings determine
what is visible; there is no one-aperture renderer limit. Grounding governs *what is chosen* within
those camera and data contracts:

- Fidelity here means fidelity to **what the eye sees from the stop**, not to a model of the
  object. For a 360° observation pod, three or four authored facings can make the measured bearings
  legible; they are a presentation choice, not a restriction imposed by the renderer.
- Verticality is carried by what is real about it: the elevator experience, the drop read through
  the glass floor, and the city-from-above — each grounded in a rung and viewed within the camera's
  actual pitch range. Do not imply an unrestricted look straight up or down.
- The exterior silhouette remains the photograph's beat (`landmark-space` §2 link contract) — not
  because the walkable renderer cannot draw it, but because the IG-story plate carries the real
  exterior photograph as evidence. The model and the photograph remain distinct.

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

The current built CN Tower page is a grounded **LookOut segment**, not a complete tower journey:
one 18.6 m chord of the window ring at 346 m, with stops based on the sourced bearings (Lake Ontario
to the south, Rogers Centre and the rail corridor at the base, the downtown grid to the north and
east), plus `toronto_world` geometry placed 346 m below the deck. The lane's glass floor is the
2017 LookOut addition at 346 m; the original 1994 Glass Floor is a distinct level at 342 m, four
metres below. The lift and SkyPod are represented by authored doors/states and their sourced facts;
there is **no moving 58-second shaft or full-height tower climb** in this page. That distinction is
important: Three.js makes such geometry possible, but neither the current record nor its browser
tests prove the unbuilt ride. Any extension must source and author the intervening levels rather
than imply that this LookOut segment is the whole tower.

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

The same method, third pass — the rooms that came before the rule (round 32). Tokyo, Moji and the
Toronto hall had been built before §1 existed, and each was re-read against sources rather than
patched. What the pass found is the reason this skill exists: a market hall wearing the clock cupola
that was demolished in 1902; Rogers Centre on the wrong side of the tower and its roof opening the
wrong way; a drawbridge hinged at its middle, opening only at night when the real one never does; two
of four Moji buildings on the wrong side of their basin; and a Tokyo "lane" that was no place at all.
Rung 3 was reachable here as OpenStreetMap (Nominatim search with `polygon_geojson=1`, and the API's
`map.json` on a tiny bounding box to read building edges — street widths came from those); Google
Maps and Street View were not, and the records say so. Two rules came out of it. A real corridor
longer than the lane keeps its order, its width and each unit's width, and the *count* shrinks
(Nakamise: 250 m in 30 m, every bay a real shop). A table model keeps one scale for every model and for
the backdrop beyond it, positions turned from map coordinates in code (`moji_xy`), so the bearings
in the frame are the map's. Where the sources stopped — a hall's height, a tower's footprint — the
record says "approximate", and a building with no source for its form is left off and named in the
caveat rather than drawn as a box.

*Correction, round 33.* §2's example table used to put Rogers Centre "NE of the shaft". It
stands about 190 m west-south-west (OpenStreetMap), and the hall's model had been built on the wrong
side of the tower until round 32 -- an example in a skill is a source too, and a wrong one travels.

The same method, fourth pass — the owned spaces as surveyed worlds (round 33). The CN Tower, the
falls and the Journey had measurement tables since rounds 21-27, but what the frames showed was still
composed: the LookOut's view a wallpaper tile of a city, the falls the hall's table model stood at
scale between a hedge and a wall of mist, the Journey's tunnel bare rock where the real one has been
concrete-lined since 1944. A table that is not what the frame draws is not fidelity. Each world is
now built from the map in the generator: OpenStreetMap polygons (the Recreation Trail, the three
falls' crests, Goat and Luna Islands, the Toronto Islands, Billy Bishop) turned into lane centimetres by
`LaneFrame`, the towers from the Wikipedia list at their coordinates and heights (23 of 214 m and over
within 4 km in round 33; all 117 of 150 m and over in round 34 -- and the 23 had claimed "every tower
over 214 m within 4 km" while missing one, 11 YV, a row without a picture: count the rows a filter
kept against the source's own count before claiming "every"), and the LookOut as an 18.6 m chord of
its real 43 m ring at 346 m, facing north-east. What
the method teaches: a frame's furniture can be checked against a photograph (an iron railing on stone
posts, not a hedge), and so can its light -- a night photograph from the deck measures luma 37, which
is what told the gate its floor, not the room its brightness. Where the sources stop -- the branch
tunnel's line, the towers below 150 m (the list does not place them), the city's streets, the ground's
rise from the lake -- the record says so; even 117 real towers stop at 150 m, and the caveat says
below them the city is lights, not buildings, rather than filling the gap with invented boxes. A
scope line drawn by distance has to be checked in the frame too: the round-34 draft cut at 4 km and
would have called the Yonge and Eglinton towers out of sight, and the far glass shows them.

**The falls, corrected (round 35).** Read against photographs of the place (rung 5, fetched by image
search and kept in `.preview/r35/ref/`, never shipped), the round-33 Table Rock failed the recognition
test in four ways no map could show: Table Rock Centre is a buff stone Collegiate Gothic building with
arched windows under steep roofs (Wikipedia names the style; the photographs show it), not a grey box
with a glass band; the gorge wall under the terrace is sheer rock in level beds for two-thirds of the
drop and green talus below, not a ramp; the curtain is streaks of water, not a sheet with windows; and
the bowl is white foam under spray. Where a height was missing it was derived from a sourced
neighbour rather than guessed: the Fallsview bluff's 29.9 m from the Falls Incline Railway's 59.8 m at
30 degrees, the Skylon's street 17.5 m over the trail from its 160 m above the street against 236 m
above the bottom of the falls. The towers on the bluff come from the city's own Wikipedia list at their
coordinates, heights and floors; what the list holds that is not a building there (a ride, two
riverside towers, one hotel whose form nobody sourced) is named in the caveat instead of boxed.

**Read the small things off the photographs too (round 35, second pass).** The owner looked at the
corrected falls and asked for them finer, and inside the falls above all. What the photographs held
that the first pass had boxed: the Table Rock parapet is a low wall of rough grey stone with rough
posts and black ironwork of rings between them, at the hip -- not straight bars at hand height; the
lamps are black lanterns on black posts; Journey's tunnels are floored with wet wooden boards laid
along the passage, carry a galvanised service pipe along one wall, and stand taller than drawn (people
reach about six tenths of the crown). Measures read from a photograph are read against the people in
it, and the caveat says so; a pattern drawn from a photograph (the ironwork's rings) is named as
such. Not drawn because the source was fetched but the time went to the inside of the falls: the
Niagara Parkway past the terrace (OSM: northbound, two lanes, under the Centre at 4.4 m) -- recorded,
so the next pass starts from the ways, not from a search.

**Take the models apart (round 36).** The owner looked at Moji Port on its one table and said the
models had to come apart -- at 1.5 cm to the metre every building was a block a few centimetres high,
and nobody could see what made it beautiful. The four buildings now stand on stands of their own down
the hall, all at one scale (1:25) so the station is still twice the length of the others, and the table
keeps the port's layout with their OpenStreetMap footprints as low plates. A model seen from two metres
has to be built from sources the way a scene is: lengths from the map's outlines, floor areas and
storeys from Wikipedia and the Agency for Cultural Affairs' register, and the rest read off photographs
(kept in `.preview/r36/ref/`). Read that way, three of the four table painters were wrong in ways the
table's scale had hidden: Osaka Shosen is orange facing brick banded grey, not pale render; the
customhouse has two storeys, not three with a glazed top; the Dalian hall's tower is a banded polygon
under a tall dark spire, not a steeple stepping square to round. And a drawn plate hung behind a
faithful model is checked against it: the station's plate showed a tiled-roof house that is no part of
Moji, and was redrawn from the model's own frame and the sources.

## 7. Refusals

Everything `district-author` §5 and `landmark-space` §6 refuse, plus: no invented bearing — north
is north; no panorama photograph turned into a parallax room (refused twice, `SPEC` §9(e)); no
scene content from a rung that cannot be cited; no deleted real level or room to shorten a lane —
shorten the detail, never the place; and no claim of having "checked Street View" from a sandbox
that cannot reach it — say which rungs were used and which were not.

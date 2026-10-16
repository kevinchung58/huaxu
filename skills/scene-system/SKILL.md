---
name: scene-system
description: The site's scene-building pipeline as one system — from the owner's go-word to a shipped, verified walkable place. Use when starting any new place (room, landmark space, sub-space, open district), when the existing scene skills disagree about order, or when re-learning the proven renderer idioms and the gate battery in one read. It conducts the other skills; it does not replace them.
---

# The scene pipeline

One place, from go-word to shipped, is eight phases in order. Each phase names the skill that
governs it, the artefact it must leave behind, and the check that closes it. Skip a phase and
a later phase rediscovers the skip as a rewrite: every entry in §7 and §8 was paid for by a
skip.

| Phase | Governing skill | Artefact | Closes when |
|---|---|---|---|
| 0 go-word | — | the owner's ask, verbatim, in TODO | the ask is written down |
| 1 evidence | `grounded-scene` §1, `place-intake` | the ladder: what the sources say, ranked | every number has a source or is refused |
| 2 measure | `grounded-scene` §2 | the measurement table in TODO + record comment | the table survives a reader who trusts nothing |
| 2b scope | this skill §2b | the inventory table: every sourced item placed in-frame / drawer / off-frame, each with a reason | the caveat mirrors the frame, the drawer mirrors the table |
| 3 form | this skill §2, `landmark-space` §2-3, `district-author` §0 | one decision: hub room / landmark space / owned sub-space / open district | the decision is stated with its doctrine |
| 4 author | `district-author` §2-3, `lane-prop`, `street-commons`, `japan-place` | the record in `_gen_html.py`, painters in `js/site.js` | `python3 _gen_html.py` exits 0 |
| 5 critique | this skill §3-4 | frames read twice, fixes listed in TODO | two consecutive reads find nothing new |
| 6 wire | this skill §5 | ROOMS row, owning `back_to`, and either a main-place card or a parent-owned prop entry; IMG rule | the hierarchy and wiring gates pass |
| 7 verify | this skill §6 | the full gate battery, green | every harness exits 0 and says so |

The hub street doctrine stands over all of it: one street with the three main destinations, never
one street door for every walkable page. An owned landmark or sub-space is reached only through its
parent object and unwinds to that parent; it gets neither a top-level Field notes card nor a hub door.
Never stack two open districts on one page. The real Table Rock owns Journey (§2), so that one nested
route is deliberate, not a return to the retired room→room chain.

## 1. The renderer contract

The vocabulary every record spends. These are the numbers the gates and the critique both
assume; change one and re-run the whole battery.

- The eye is at 168 cm; a lane segment is 60 cm of paint; depths on the record are multiplied
  by `Z_SCALE` 2.9 when walked, so a station at z 480 stands at 1392.
- `Z_FAR` is 1334: the end wall is drawn there unconditionally unless a `vista` opens it, and
  a last station past it needs `max_d` > `Z_FAR` (the proven pair: `max_d` 1500).
- Day and night are one clock per page (`day: {cycle, start, gain}`); `DAY()` and `NIGHT()`
  gate everything weather- and light-borne. Night is below `DAY() < 0.25`.
- Surfaces name a cladding kind; a kind with no `PATS` entry falls back to its flat tone.
  `dado` is brickwork, `rock` is bedrock — the material is the kind, the strata are the tones.
- Painters (`bd.<id>` in `js/site.js`, config inline in the page) draw in absolute coordinates
  and only what no prop can carry: rivers, rainbows, rails, skylines, glow.
- A lane that looks out at a real place carries a **surveyed world** (`bd.world.prims`, round 33):
  prims in lane centimetres, turned from latitude and longitude by the generator's `LaneFrame` —
  `f` flat, `x` tiled (`u` cm a repeat; `ax: "v"` maps a wall), `w` a water sheet and its streaks,
  `m` spray, `l` light points, `rb` the rainbow, `fw` fireworks. What stands between the walker and
  that world is the shell — the record's `lane` keys `lid`, `vault`, `open`, `open_back`, `open_end`,
  `under`, `wallmat`, stamped as `data-lane-*` — and cladding bands of kind `open`, `glazing` (a
  mullion every `pitch` cm) and `railing`. `skyAround` is a sky all round the eye;
  `"night": <phase>` on the record holds a page's clock at one hour of the night.
- WebKit rules: `preserve-3d` only on `.room-world`/`.ig-grid`; never `overflow`/`filter` on a
  preserve-3d ancestor. No frameworks, no npm build, no committed package.json — canvas and
  CSS transforms are the whole renderer.

## 2b. The inventory — completeness as a table

A rich real place always has more than a lane can carry; "complete" is therefore not "drew
everything" but "accounted for everything". After the measurement table, write the inventory:
one row per sourced sight or beat, each placed in exactly one of three columns —

- **in-frame** — drawn, at its honest scale and bearing; the caveat will name it;
- **drawer** — compressed into the room's reading material with its figures (distance, date,
  height, season), because the frame cannot reach it: indoors, ticketed elsewhere, kilometres
  along the parkway, behind the walker, or hidden by the site's own geometry;
- **off-frame, reasoned** — refused for a stated reason (the other side of a border, a season
  the page does not author, a lie the renderer would tell).

The table ships in the round notes; the caveat mirrors the frame column, the drawer mirrors
the drawer column, and a reader holding the sources can verify all three. Niagara's table
(§0i in TODO) is the worked example: two falls, an island pair, a gorge, a skyline of three
silhouettes, a rainbow, illumination and seasonal fireworks in-frame; a boat, a fury, a
walk, an aero car, a clock, a glen in the drawer; nothing refused without a reason.

## 2. Choosing the form

Four forms, one question each:

- **Hub room** — a themed interior hanging off the street's spine. It leaves only to the
  street, at its own door (`#at-<id>`), and the street record carries its door.
- **Open district / day page** — the hub street itself and anything that walks out of its own
  end (the quay, the promenade). `street-commons` owns the daylight and the open side.
- **Landmark space** — one tall or huge object owns a page; entered from its prop's room by
  the link contract (press prop → story plates first → enter verb beside them), unwinds to
  that room (`back_to`), and the street carries no door to it. `landmark-space` governs.
- **Owned sub-space** — a space inside a space whose real entrance stands inside the owner
  (Journey Behind the Falls inside Table Rock). A door object with `leave` at the real spot;
  the sub-space's `back_to` is its owner; the gates follow each page's walk-exit chain to the
  street, so the hub is still the one unwind every place reaches.

The decision is written in the record's opening comment with the doctrine it invokes. A form
chosen by convenience rather than by the real place's geometry is the first entry in §7's
failure table.

## 3. The proven idioms

Recipes that survived the critique pass, with their numbers. Reach for these before inventing.

- **Day sky** — the street's idiom: bands from `y0 -400` with glow near 1.0 at the
  light-bearing band, top band `y1` ≈ 90000. At backdrop depths the vertical angles are tiny;
  a short top band leaves a dark lid on the frame.
- **Open end** — `vista` aperture plus `max_d` 1500; the last stop walks past the wall and the
  painter owns the world beyond it. A rail at the edge of the walkable world is the stop's
  whole punctuation — and the rail's z must be past the last walked depth, or it stands
  behind the walker and vanishes.
- **Weather as cladding** — a side wall can wear the place's weather (`mistview`): soft
  horizontal streaks over a cool grey. Crossed or vertical mist planes at alpha ≥ 0.3 wash
  the whole view pale; mist is one horizontal band (α ≈ 0.4 / 0.22) or nothing.
- **Prop at real scale** — when a bespoke panorama washes out under the affine-plus-flat-colour
  math, reuse the site's proven small-scale shape stood at real size (the falls: the
  sheet-over-ledge-into-mist, breadth-to-drop ratio kept). Fidelity lives in the bearings and
  the ratios, not in the drawing technique.
- **City as cladding** — *retired for the LookOut in round 33*: a wall tile of a city is no city,
  and the bearings were only true in the caveat. A fallback where no survey can be reached, and the
  caveat then says the view is a texture.
- **Surveyed world** — the beyond is map data (§1). A ground bigger than the eye's surroundings is cut
  into cells, in rings that skip a cell only when it lies **wholly** inside the finer ring (by its
  centre left a 6 km band of sky under the horizon). Layer biases paint lower water first; world faces
  back-face-test with their own edge normal; a light lattice seen kilometres deep beats into moiré, so
  lights are scattered by a seeded generator — and so are a tower tile's lit windows (round 34,
  `towerwin`: lit by arithmetic on the cell index they lay on diagonals, and 117 towers of diagonals
  read as hatching); a window tile is a storey at its real height (eight storeys of 4.0 m office or
  3.2 m residential — at 1.6 m a tower showed twice its floors). Pattern fills have no mip levels, so
  a window grid kilometres out can still beat in places; averaging the tile down (box-filtered
  halvings) was tried and dulled the towers into mottled slabs — a lit window is a point of light,
  and an average cannot keep it bright. Left as is and said so.
- **Sealed lane over a world** — a tunnel sees its world only through its mouth and its open bands;
  `apertures()` drops the world quads that miss them (the Journey's entrance frame 2549 → 1811
  fills, the picture identical), and the backing behind the lane is its own material, so a seam
  between two panels never shows sky.
- **Night from height** — a window over a night city is darker than a doorway onto a lit street:
  two thirds of it is sky. Calibrate the gate against a photograph from the place (the LookOut's
  night measures luma 37), never the city against the gate.
- **Night rhythm and illumination** — lamps read three ways after dark and carry staggered
  `liton`; a floodlit landmark switches its sheet to the held illumination colour when
  `DAY() < 0.25`, five colours cycling slow, the gorge spilling the same light. The page's day
  cycle is the clock; never add a page for a time of day.
- **Sub-space door** — §2's owned form; the door's glow and hint carry the descent's facts in
  words, the scene carries the space.
- **Fill ceiling** — the walk gate's fill budget is calibrated by an honest A/B (measure HEAD
  at the parent commit, measure with the change, set the ceiling above the sum with margin;
  a second full pass would read near double). Recalibrate when a lane's cladding grows.

## 4. The critique pass

Regenerate, shoot the lane (`.verify/lane-shot.mjs`, `ROOMS=<page>`), and **read the frames as
a visitor, twice**. The harness proves paint; only a read proves place. Known failure shapes:

| Symptom in the frame | Cause | Lever |
|---|---|---|
| everything pale grey | crossed mist planes, alpha too high | one horizontal band, α ≤ 0.4 |
| dark lid over the sky | sky top band `y1` too low | 90000, glow idiom |
| falls as flat ribbons | crest depth ≥ 4000 | bring the crest near, prop at real scale |
| rail invisible | rail z < last walked depth | rail past `max_d` stop |
| alley where a tunnel should be | brick kind on bedrock | `rock`, tones as strata |
| silhouette floating | monochrome quad without a dark anchor | anchor against gorge/sky |
| nothing painted | quad `add()`ed after the emit pass | painters run in the draw list |
| subject below the floor | the lane box clips props at y<0, and the lip occludes the basin from a lip-height eye | the painter carries what the eye can see; what the lip hides stays off-frame, and the caveat says so |
| a pale polygon in the ground — sky through it | a pattern fill not covering its own clip (a sliver cell's thin first triangle) | fill the clip's preimage box; diagnose with a flat-fill A/B and `.preview/shot1dbg.mjs`, not by guessing data holes |
| a band of sky just under the horizon | ring cells skipped by their centre | skip only cells wholly inside the finer ring |
| spray reads as smoke | the haze/night wash laid over a nearly clear round darkens the sky behind it | bake the night into the round's colour; no wash on translucent quads |
| rippling arcs in a far texture | a hidden lattice in the tile | scatter with a seeded generator |
| diagonal hatching across a skyline | lit windows chosen by arithmetic on the cell index | a seeded draw, same count and colours (`towerwin`); not a box-filtered mip, which dulls lit windows |
| a tunnel twice as costly as its frame | the world behind its walls painted, then painted over | `apertures()` + the lane's own backing |
| a room brightening to noon under a night window | a non-day page's lamps following the hall's clock | `"night": <phase>` on the record |
| a waterfall reads as a pale facade with windows | a flat sheet with short pale bars moving on it | the water's grain (`fallsw`): streaks running the whole drop, laid as an overlay whose air is in its alpha; the moving streaks long and narrow (round 35) |
| the plunge basin reads as a stepped floor or a dome | one hard-edged foam band on dark flat water | textured foam (`foam`) at the foot, then translucent bands each thinner than the last |
| spray that is there and cannot be seen | white rounds over a white sheet and white foam | soft rounds (`soft`: a gradient to nothing at the rim) placed where dark water, rock or sky is behind them; test by raising alpha, not by assuming a bug |
| moiré rings and fans on a paved floor | 8 cm joints under two pixels high from about 6 m at eye height | floor tiers by distance, the tile pulled toward its own measured mean (the mean kept exact, so the tiers meet without a step) |
| a textured surface glowing at night | a tile painted in day colours on a prim that has a night colour | lay `cn` over the tile as the day goes, or crossfade a night tile (`pn`, the hotels' `towerwin`) |
| a wall missing in a recess of a building | the outward normal taken from the centroid of a concave footprint | the winding's own normal (`_outward_ccw`) |
| a named building drawn as a grey box | its form never checked | read the form off photographs (kept out of git, `.preview/<round>/ref/`); the caveat names what is approximate |
| a wedge or band of water painted over the ground near the eye | world prims sort by depth + 6000 + layer·1e6, and a sheet below the bank (layer 0) was out-layered by the ground (8.5) and the terrace (8.4) | on a view from above the bank give everything below it a layer over the ground's (`low` 8.8); not on a view from under the bank |
| a dark slab over a side opening in a vault | a prop's lintel in the wall's plane behind the barrel's lowest chord, painted in front of it because a prop sorts by its own depth | no lintel where the opening reaches the springing; the barrel is its head |
| a pipe or rail on a wall that comes out as a dashed shelf | a long piece sorted at its middle, painted over by the wall panels in front of that middle | cut it to the wall's own panels near the eye and sort it just in front of its nearest end |
| a parapet whose posts are cut off by the wall behind them | one long wall quad per segment beside short posts | cut the wall, its coping and its ironwork cell by cell between the posts |
| ironwork that greys the view through it | an overlay tile taking the air, night and sun washes over its clear parts | `a` 0, `n`, `d0` on the overlay prim; its colour is its own |
| a white wireframe down a side tunnel | adjacent world panels filled one by one, the sky showing through each anti-aliased seam | one dark underlay per face, the whole run long, a layer under the panels |

Write what each read caught into TODO with the round; a critique pass that reports no catches
is a pass that was not read.

## 5. Wiring, album, registry

- A row in `ROOMS` registers each walkable page, not each album destination. The wiring loop reads
  it; a main place defaults back to the street at its own door, while an owned space authors the
  parent page and `#at-<owning-prop>` return anchor.
- Field notes is fixed to exactly the three original main places — `FIELD_NOTES_PLACE_IDS`:
  Toronto, Tokyo, Fukuoka — in that order. Only those IDs get a card and `IMG/<id>-cover.jpg`;
  child spaces such as the CN Tower, Niagara Falls and Journey Behind the Falls never become cards
  or street doors. Their entry is the parent's real object (story → enter-space, or an owned door),
  and a cover is a generated frame re-saved as JPEG (`.verify/make-cover.mjs`), never a photograph.
- Every raster matches a rule in `IMG_RULES` before the generator will run; add the rule with
  the work that adds the file.
- The landmark link contract (prop → plates → enter verb → space → unwind) is wired by the
  hall's record and asserted end-to-end; a new landmark extends `verify-story`, it does not
  hope.

## 6. The gate battery

What each harness proves, so a green run can be named:

- `verify-walk` — the walk itself: boots, stations, door graph (rooms leave to the street or
  unwind by chain), fill ceiling, frame/slot closure.
- `verify-chain` — every page boots clean in a real browser, back props and HUD exits navigate,
  the album's cards are doors with their own covers.
- `verify-shapes` / `verify-geometry` / `verify-clash` — the prop registers: sizes, overlaps,
  the thresholds (≥70/12, deepest ≥70/15, behind ≥55).
- `verify-objects` — every object the page names exists and answers.
- `verify-rooms-e2e` — the rooms end-to-end in a served browser.
- `verify-story` — the link contract pressed end-to-end, both directions, every space.
- `lane-shot` + a human read — §4. `impeccable` — the stylesheet and pages at zero findings.

Run cheap statics after each edit; run the whole battery before a commit that touched a
scene. Verification is the artefact the browser asks for: regenerate, curl the served page,
grep the markup and the `?v=` pin.

## 7. Refusals and honesty

- No lettering in scenes, no people, no invented venue, date or caption; no claim the owner
  stood anywhere. The drawer may carry the sources' figures in words; the scene carries none.
- A caveat is a contract: it must say exactly what the screen shows. When the screen gains a
  silhouette, the caveat loses "no towers on the skyline" in the same commit.
- Drawn covers and plates are captioned generated; a drawn image is never dressed as a
  photograph the owner took.
- Details may shrink; sequence, scale, sightlines and distinctive geometry may not
  (`grounded-scene` §3). Compressed, never deleted.

## 8. Worked examples, shipped

- `street.html` — the hub, the day page, the night rhythm, the harbour open end.
- `rooms.html` — Nakamise-dori at night, built from OpenStreetMap and the street's published
  figures: the order, width and each shop's width kept, the count of shops shrunk (round 32).
- `rooms-fukuoka.html` — Moji Port laid out from OpenStreetMap at one scale, the strait beyond the
  far wall continuing the same model; the Blue Wing on its real timetable (round 32).
- `rooms-toronto.html` — the hall of lit tables; props owning spaces.
- `rooms-cntower.html` — the LookOut at 346 m as an 18.6 m chord of its ring, facing north-east
  over a surveyed Toronto at night: the shore, the islands, the spit and Billy Bishop from
  OpenStreetMap, every tower of 150 m and over on Wikipedia's list (117) at its coordinates and
  height; the Glass Floor a real hole onto it (rounds 33–34).
- `rooms-niagara.html` — the last 43 m of the Recreation Trail walked south to Table Rock's rail by
  day: stone posts and iron railing on the gorge side, Table Rock Centre on the other; both falls,
  the islands, the gorge, the Rainbow Bridge and the Skylon where the map puts them; illumination
  and fireworks after dark (round 33).
- `rooms-journey.html` — the owned sub-space: 56 m of 1944 concrete vault from the elevator to the
  deck, the branch to the two portals at 40°, the deck at the curtain's foot over the surveyed
  falls (round 33).

Each example's round notes live in TODO; the measurement tables in §0a-§0f are the artefacts
phase 2 leaves behind.

---
name: japan-place
description: What a Japanese place is made of on this site — the objects a Tokyo lane or a Moji port room needs, their real proportions in record centimetres, the materials the renderer can paint, the night the room ends up in, and the claims a Japanese room may not make. Use whenever a district is set in Japan, whenever the owner says Tokyo, 福岡, 門司港/Moji, 屋台, 商店街, 踏切, 参道, 神社, 提灯 or 自動販売機, when a Japanese room reads as "generic Asia" or as a backdrop, and before reading the sakura-crossing reference pack (references/sakura-crossing.md) or adding any prop to a Japan district.
---

# A Japanese place, built to this site's rules

The rooms that are set in Japan — Tokyo (`rooms.html`), Moji Port (`rooms-fukuoka.html`) — are
the hardest ones to get right here, because Japan is the place this builder has the most borrowed
pictures of and the least licence to invent. The mass of Japanese street imagery that exists is
almost all either a photograph of a real street (whose facts belong to somebody's real shop) or a
painting of a fictional one (whose signage is invented). This site may do neither: no lettering in
a scene, no venue, no date, no people, nothing that implies the owner was somewhere they were not.

So a Japanese room here is built the way a model shop is built — from measurements, materials and
the rhythm of the objects, with every sign left blank. That is not a limitation to work around. A
lane of correctly proportioned shutters, vending machines, gutters and hanging wires reads as Japan
from the first metre, and it reads that way *without* a single word.

Read this skill with `SKILLS.md` §1–§5 (grill first, research like a modeller, the Little Canada
benchmark, measure never assert, what may never be invented). This skill adds only what is
Japanese-specific. It does not repeat the intake questions or the build rules.

## 1. Two ways a Japanese district can stand, and what each can claim

The site has two room formats and they answer different questions. Pick before authoring, because
the choice changes the lane, the stops and the size of every object:

- **The lane** — street level, walked. Tokyo is this: `lane: LANE_FALLBACK` (6.4 m wide, 4.3 m
  deep by default), one eye height, the frames on the walls beside you. It is right for a place
  whose identity is a *corridor*: an alley, a shotengai, a shrine approach, a covered arcade.
- **The table** — a lit plinth in a hall, looked down on. Moji Port is this (`lane: {w:700, d:900,
  ceil:620, back:300}`). It is right when the subject is a *panorama* — buildings that must all be
  in one frame, a harbour, a station square, a crossing with a train on it. It also solves one
  problem a lane cannot: the moment. You cannot stand in a lane and watch a drawbridge open; on a
  table you can, from a stop that was authored to look at it.

A city is not a subject (SKILLS.md §1). Neither is a period. The subject is one spot with one
identifying object: the Blue Wing is not "a bridge", it is Japan's largest pedestrian drawbridge
and it opens six times a day, and that is what makes the harbour a room rather than a backdrop.

## 2. The ruler is the centimetre and it is never guessed

`1 px = 1 cm` throughout the generator. `EYE = 168`. `OBJ_SIZE` in `_gen_html.py` is the register
of what an object is, in width × height × depth, and `Z_SCALE = 2.9` scales a record's *depth*
only — so a widened lane does not widen its props. Two of these have already cost rounds:

- A hero object authored at its real size (a 108 m drawbridge, say) projects to a few pixels,
  because the room is looked at from across a hall. Size a hero object by the screen presence it
  needs, and say so in the record's comment. `Z_SCALE` does not do this for you.
- A prop's **bottom** is `y`. A deck authored at the waterline is half under it and draws nothing;
  the deck was lifted from 80 to 92 for exactly that reason.

`references/japan-vocabulary.md` is the object table: real dimensions, the feature that identifies
each thing at 20 m, and what it may carry on this site. Values marked † were measured in the
sakura-crossing reference rather than recalled, and the ones the site's own records already use are
noted there too. Read it before authoring a prop, and copy its numbers rather than re-deriving
them — the two rooms already built have committed to them.

## 3. Materials: the renderer paints tiles, it does not sample photographs

`js/site.js` draws every material as a 128 px tile in code, mapped across the 60 cm panel the walls
already use, and `FLATOF` gives each a flat fallback colour for grazing angles. What exists today:
`shutter, dado, brick, corrugated, hoarding, plaster, tactile, kerb, grate, lantern, concrete,
galv, wood, cobble, glass, track, water, terrain, cityg, skyline`.

An unknown name fails **silently and differently depending on where it is used**, which is why a
misspelled material is worth checking for before anything else:

- a wall band (`surfaces`) falls back to the generic plaster tile — wrong, plausible, and easy to
  attribute to lighting;
- a ground mark (`marks`) has no fallback at all and paints the void's navy `#2b3a56`, a hole in the
  floor that looks like a rendering bug because it is one.

That register is Japan-shaped already, because the rooms it was written for are Japan: `shutter` is
a rolling shop shutter, `dado` a painted lower band with its rail, `corrugated` a 波板 wall,
`hoarding` a construction board, `tactile` a 点字ブロック, `galv` galvanised sheet, `brick` the
red brick of the customhouse and the warehouses. When a new material is genuinely needed, add a
paint function in `js/site.js`, an entry in `PATS`, and its flat colour in `FLATOF` — the three
travel together, and a missing third is how a wall goes navy in one frame out of fifty.

Materials are **mid-tone**, and light is not a coat of paint: every wall, floor and prop is lit by
the record's own `lamps` through one `lightAt()` falloff. If a material looks too dark, the answer
is a lamp in the data or a lighter base colour, never a hand-brightened surface — a bright surface
with no source is a lie the renderer tells easily and the harness is written to catch.

## 4. The night is the room's best material

Both Japan rooms run a day-night cycle, and the arc — dusk starting, then the buildings coming up
one after another — is the site's answer to Little Canada's synchronised sunset. What matters when
authoring:

- `liton` sits **on the prop** and is the phase at which that prop's own windows come up. Stagger
  it across the buildings (`0.74 / 0.76 / 0.80 / 0.84 / 0.88` in Moji). One `liton` for the room is
  a switch, not a dusk.
- The phase interval must be measured from dusk and **may not cross midnight** — the first version
  computed `p - liton` from 0, went negative, and `ease01` put the lights straight out.
- Darkness is painted with `air`, and the two ceilings are separate: `AIR_MAX 0.6` and
  `NIGHT_MAX 0.72`. Sharing one cap means night can never happen — the haze eats the whole budget
  before dusk starts. The formula is multiplicative, `1-(1-air)(1-night)`.
- `glow` is the additive halo of a light and it reads `k` from the record *and* the night value.
  A glow that ignores both burns at full strength all day and, at `r:500` from 145 units away,
  covers the frame.
- A lantern is a **light**, not a prop with a picture of light on it (`body: "lantern"`,
  `bulb: false`, with `size` and `h` authored next to it). Warm light is cheap and is most of what
  makes a Japanese night read: 13 lanterns along a quay carried 57–72% of the warm pixels at every
  stop.

## 5. What a Japanese room here may never say

This is where the reference pack is most dangerous, and why it is a reference and not a source.

- **No lettering, at all.** sakura-crossing paints every 看板, 幟, 暖簾, price strip and 駅名標
  with Canvas2D, and its Japanese strings are invented on purpose (青空商店, さくら坂商店街, …).
  That is legitimate art direction for a fictional town. It is forbidden here — the lane renderer
  never calls `fillText`, and a board that could have held a name ships blank with the reason in its
  card. So take the *cadence* of Japanese signage and leave the words: a fascia band at a constant
  height along the whole row, a vertical strip sign, a small plate at eye level, a noren's
  proportions with its curtain pattern and no characters. The row reads as a shopping street
  because the bands line up, not because anyone can read them.
- **No brands, and no marque on any vehicle.** Not on a machine, not on a truck's grille, not as a
  badge. sakura-crossing made the same rule for the same reason.
- **No people, and no figures of people.** Not in the rooms, not in a poster, not on an ema, not
  as a silhouette in a window. What says the street is in use is what has been parked, hung out,
  stacked or left behind. A stone guardian animal is a place's object rather than a person, but the
  line is the owner's to draw — when in doubt, leave it out and ask.
- **No venue, no date, no price, no claim of attendance** — including in a `hint`, a `say` line or
  a caption. Drawn set dressing is authorised art direction and says so in its own hint; a caption
  never does.
- **Real identifiers stay real.** Facts about Moji Port (the station's 1914 date, the Blue Wing's
  108 m and its six openings a day, the customhouse's brick and 3F observatory) are public history
  and are written into `_gen_html.py`'s comments next to the props they produced, with the source.
  Facts about the owner being there come from the owner. Do not merge the two.

## 6. Research like a modeller: where the Japanese facts are kept

Fetched pages are not saved and the next session starts from nothing, so a Japanese fact earns its
keep only when it is written down next to what it produced:

- `_gen_html.py`, in the district record's own comments — the Moji brief, the station's history,
  the bridge's span and schedule, the customhouse's masonry, all sit above the objects they made.
  Follow that: a comment that gives the number, where it came from, and what it changed.
- `TODO.md`, as the round's findings — the Moji research block is the model. Its traps list is
  longer than its facts list and that is the right ratio.
- `references/` inside a skill, when the fact is one *any* Japanese room will need again. That is
  what `japan-vocabulary.md` is for; if you learn something a Tokyo lane and a Moji table both
  want, it goes there rather than into one room's comments.

Do not ask the owner what research can answer (SKILLS.md §1). Ask them about the place's lived
detail — which building they remember, what was on the water, whether the shutters were down —
and only after the public facts are already laid out on the table.

## 7. Before a Japanese room is called finished

`district-author`'s gate is yours unchanged. Three of its checks bite hardest on Japan, so run
them before anything else:

- `node .verify/verify-shapes.mjs` — a prop whose `kind` is not registered renders as a flat
  plane with no error, and the check reads the **id prefix**, not `data-kind`. Name the object
  `drawbridge-mj`, `stationfront-mj`, `dalianhall-mj`, not `moji-drawbridge`.
- `node .verify/verify-walk.mjs` — asserts that every frame's title is a sub-area slot of its own
  room, and that the album's Field notes wall is the built places with one door each.
- `node .verify/lane-shot.mjs .preview/lane/<place>` — the pixel gate. It asks whether the lane is
  painted where you stand, whether the deepest stop is the frame that empties out, and whether the
  wall behind the entrance is a room. A stop that stands *inside* the thing it names (the first Moji
  layout had three of five stops standing in the port) passes every structural assertion and shows
  the visitor air.

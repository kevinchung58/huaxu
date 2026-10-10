# The street system: layout, borders and the arithmetic

Everything here is a number a record can be authored with, taken from the street that exists and
from `js/site.js`'s own geometry. Units are record centimetres unless the line says walk units.

## 1. What the hub is today

| Thing | Value | Where |
|---|---|---|
| lane width | `w: 700` (7.0 m, ±350) | the street record's `lane` |
| record depth | `d: 1040` | walkable to `z = 1040` |
| walls behind you | `back: 300` | the lane is drawn from `-300` |
| how far you may walk out | `max_d: 3400` (walk units) | past the far wall, into open ground |
| ceiling | `ceil: 620` | the flat lid quad is painted at this height |
| eye | `168` | `EYE`, everywhere |
| depth scale | `2.9` | `Z_SCALE`; multiplies `z` and nothing else |
| walker's clamp | `z ≤ 3400` walk units | the reach ring is 190 |
| deepest safe door | record `z ≈ 1238` | `3400 + 190` over `Z_SCALE` |

A room's own box is the same shape at a different size — Moji is `{w:700, d:900, ceil:620,
back:300}` with a table in it. **A promenade is this same lane with one wall replaced by a border**;
nothing about the projection changes.

## 2. The spine, and where things go

- **The spine is the centre line**, `x = 0`. Doors, poles, wires and stations are authored against
  it and against the two walls at `±350`.
- **Doors live on the walls**, at `x = ±346` with `ry = ∓90`, so a door is a hole in a building
  rather than a slab in the road. They are authored at `z = 160, 470, 780` on alternating sides, and
  they carry a `glow` above them, because on a night street a door you can read is a door with light
  on it.
- **The walk out** runs from `z = 0` (the album door behind you at `z = -46`) to `z ≈ 1150`, with
  stations at 0 / 160 / 470 / 780 / 1040 / 1150. Six is the working maximum: a station is a place
  worth standing, and a seventh would be a checkpoint.
- **Density is the difference between a street and a diagram**: eight props plus three doors plus
  two poles is what the current street carries over nineteen metres. The reference build's own rule
  is that a row reads as a row because its units are *built the same*, and that the variety lives in
  what is standing on the pavement in front of them.

## 3. Adding a region without adding a page

A region is a stretch of the same spine where the materials change:

```python
"surfaces": [
    {"side": -1, "z0": 0,    "z1": 240,  "y0": 0, "y1": 620, "kind": "brick",   "tone": 1.12},
    {"side": -1, "z0": 240,  "z1": 700,  "y0": 0, "y1": 300, "kind": "shutter", "tone": 1.26},
    {"side": -1, "z0": 240,  "z1": 700,  "y0": 300, "y1": 620, "kind": "brick", "tone": 1.22},
]
```

- **A band list must tile the whole height of a panel or the wall's own tiling stays behind it**
  (`cladCovers` in `drawRoom`). A half-covered wall shows plaster where the cladding stops, which is
  right, and an accidental gap in the middle is a stripe of a different material.
- **Bands are drawn per 60 cm panel** and a band's `tone` multiplies its brightness — that is how
  the near half of a street reads cooler than the far half without a single extra light.
- **Marks carry the ground's own kit**: `tactile` (two lines, one per wall), `kerb`, `gutter`,
  `grate`, `manhole`, `wet`, `snow`. A mark whose `kind` has no pattern paints `#2b3a56` — the
  void's navy — because unlike a wall band there is no fallback.

## 4. Borders: one side open

Opening a side is what makes a promenade, and it is done with the kit that already exists plus one
new hole:

- **Below eye:** the border is a quay edge or a beach line, authored as `marks` (the ground the
  walker stands on) and lit like any other surface.
- **At eye:** a parapet or railing, authored as props — a post every 180–240 cm with a rail between,
  which is the one object the coast kit is missing.
- **Above eye:** the `surfaces` band that would have been the wall becomes the *distance*: water to a
  horizon, a far shore, a breakwater. This is where the one-point projection bites — a lane's
  `backdrop` is a single plane at the far end, so **the sea must run toward the far end, not across
  it.** A promenade whose water is to the visitor's left, in a one-point perspective, shows the
  visitor a wall of water parallel to the direction of travel and a horizon that never lines up with
  the street's own. The two ways out, in order of cost:
  1. **the street turns the corner**: the promenade is a *second* lane entered at the foot of the
     first, so the water runs down the far end of the new one and is seen head-on;
  2. **the water is the far end**: the street's own vista becomes the sea, and the buildings line one
     side of a road that runs along a shore it is always facing. Cheapest, and it is what a
     harbour road actually looks like.
- **The far end may already be open.** `max_d` walks the visitor out of the street's own walls into
  open ground with a `backdrop` behind it. Making that open ground the shore is a change of what the
  backdrop paints, not a change of geometry.

## 5. What the reference build does about this, and what transfers

`sakura-crossing` solved the same problem three times, each with a different mechanism, and the
choice between them is the design decision rather than the implementation one:

| Its place | Mechanism | Transfers here? |
|---|---|---|
| the canal (用水路) | a trench cut into the terrain, a hole in three cooperating layers | no — we have no terrain field |
| ひばり湖, the lake | water at `groundY + LEVEL − TERRAIN_DROP`, the shoreline as the *contour* where the hill field crosses that level, and `lakeLeakCheck` (a flood fill) because a lake fails globally and renders nothing | the **check**, yes: any water we author needs a "does it hold" pass, and ours is simpler — a quay wall and a plane, with the fill asserting the walker never ends up below it |
| the bay and the harbour | built from quay walls, blocks and moored hulls on a plan | yes — this is the shape of a harbour promenade |

Its 湖畔道路 (a 4.0 m road along a lake) is the closest thing to what the owner described: white
edges, delineators, guardrail on the bends, two convex mirrors, a lay-by where the water first comes
into view. **That last item is the design lesson**: the water is revealed at a viewpoint the road was
laid for, not simply present beside the road. Our equivalent is the station — "the first place the
sea is in front of you".

Its `hillSafety` is the other one worth copying in spirit: 13 263 sample points asserting the hills
never cut a road. Ours is smaller — a promenade needs an assertion that the walkable surface is
continuous from the street mouth to the quay, and that the quay edge is inside `max_d`.

## 6. Two unit systems, and which fields live in which

The record is authored in *record centimetres* — the old 4.3 m lane's numbers — and the emitter
multiplies every record depth by `Z_SCALE = 2.9` into *walk space*: props' `z`, surfaces' `z0/z1`,
marks, stations, lamps, wires, and the lane's own `d` (`walk_d = d * Z_SCALE`). Heights and widths
are real centimetres and are not scaled.

Two things are **not** scaled, because they are not record depths:

- the **backdrop** (`sky`, `mountain`, `plaza`, `harbor`, `roofs`, `city`, `express`) — its `z`
  values are walk space as written;
- **`max_d`** — written straight into `data-lane-max-d`, walk space.

So the street's lane ends at walk 3016, its quay runs 3000–4300, the rail stands at 4300 and the
water 4360–12000, while `max_d` 4150 stops the walker a stride short of the rail. Author a backdrop
number from a record number and the thing lands inside the lane — which is exactly where the first
harbour's rail went, invisible behind the far wall.

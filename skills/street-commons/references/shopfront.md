# The commercial strip: a 商店街 built out of one unit

The owner's example prompt asks for "南北向主街，兩側 20 間以上商店". That is a spec, and this file
prices it against this renderer, because a shopping street done here is a **texture job with a
layout**, not a modelling one. Nothing in this file is built yet.

## 1. The unit, and why it is one unit

The reference build's own conclusion, after two rounds of densifying its shopping street:

> *"a shopping street reads as a street because its units are built the same and differ only in
> colour, sign, awning and clutter. The variety is all in what is on the pavement outside."*

That is the whole system. Its `makeShop()` takes width, depth, floor count, wall and roof material,
awning presence and recess depth, and emits one unit; the street then places that unit repeatedly
with different seeds. Measured from it, and the numbers a strip here should adopt:

| Part | Figure | Note |
|---|---|---|
| unit frontage | 6.0 m | narrower units (4–5 m) read as a Showa-era row; wider than 8 m stops reading as a shop |
| unit depth | 6.5 m | the mass, the recess and the back of the shop |
| ground floor height | 3.2 m | where the fascia lives |
| first floor height | 2.7 m | set back 0.4 m so the fascia and awning have somewhere to sit |
| shopfront recess | 0.9 m deep | **the recess is the single most important number here** — a solid box with a picture on it is a decal; 0.9 m of real hole, with piers, a header, a soffit and a floor, is what makes a shopfront a shopfront |
| open front width | frontage − 2 piers | piers around 0.4–0.5 m |
| awning projection | 1.5 m, at 2.5–2.7 m | a solid box in the record, with the soffit darker than the top |
| fascia band | the full frontage, 0.4–0.5 m tall, at the top of the ground floor | **blank here** |
| stalls / shops | 20+ per side over ~120 m | their street runs 6 m wide and puts units hard against both kerbs |

## 2. The one thing that must not be copied

The reference's fascia, blade signs, noren, price strips and shop flags are all Canvas2D text with
**deliberately invented** Japanese names. On this site a scene carries no lettering at all — the walk
renderer never calls `fillText`, and a board that could have held a name ships blank with the reason
in its card.

So a strip here is built from the **cadence** of Japanese signage, with every plate pinned blank:

- a fascia band at a constant height along the whole row, varying only in tone;
- a handful of **vertical blade signs** (a thin plane hanging off the wall, 30–40 cm wide, 1.2–1.8 m
  tall) — the shape is unmistakable even empty;
- one small plate at eye height on some units, and nothing on others;
- a noren across a doorway, its proportions right and its cloth pattern only;
- awnings in three or four flat colours, striped on one or two.

A walker reads the row as a shopping street within two metres because the bands line up. If it *needs*
a name to work, the unit is wrong, not the rule.

## 3. The material budget, and how to spend it

This is the real constraint. The renderer caches one 128 px tile per material and applies it to every
quad that names it, so:

- **twenty shops share four or five wall materials** (`plaster`, `dado`, `brick`, `shutter`,
  `wood`), the way the reference's own wall list has six tones and twelve houses reuse them;
- **the variety lives in the three-dimensional clutter on the pavement**, because clutter is small
  and cheap: crates, a menu board, a bicycle, a plant, a bin, a bucket, a stack of trays, a hose. At
  two metres a prop is read from its joints and its silhouette, which is why the reference's kit is
  thirty small props rather than thirty façade textures;
- **a new façade material is a paint function, a `PATS` entry and a `FLATOF` colour together**
  (`skills/japan-place` §3), and it should earn its place by being used by at least a third of the
  row. One material for one shop is a texture with a shop in front of it;
- **the awning colours are the accent system.** The reference reserves saturated colours for focal
  objects and lets one or two awnings carry them; a whole street of saturated awnings is a carnival.

## 4. The kit the strip needs that does not exist here

Checked against `OBJ_SIZE`, `SHAPE` and the street's own records:

| Needs | Have | Missing |
|---|---|---|
| the unit mass, recess, piers, header, soffit | `front`, `shutter`, `awning`, `signA`, `banner`, `noren` | **a recessed unit as one shape** (`shopunit`) — today only rooms are clad in bands, and a shopfront is assembled from a door plus a lit front |
| the fascia and blade sign | `sign`, `signA` | a **blade** (the vertical hanging plane) |
| goods outside | `crate`, `planter`, `bin`, `bikes`, `cones`, `mailbox`, `barrel`, `bucket` | a **tray stack**, a **menu board stand**, a **produce box** |
| the street furniture | pole, wires, lamp, tactile, kerb, gutter, grate, manhole, mirror, hydrant, bench, bin | a **stop sign on a post**, a **bus stop** (a post, a flag, a bench, a timetable board — the board blank), a **vending machine** (£already in Tokyo's record), **lanterns on the wire** (£already in Tokyo's and Moji's records) |

**A new shape is a branch in `js/site.js` plus an `OBJ_SIZE` entry plus a `SHAPE` entry, named
`<kind>-<room>`** — `shopunit-s`, `blade-s`, `produce-s` (`lane-prop` §1, and `verify-shapes.mjs`
reads the prefix).

## 5. The ornament, and how many

The reference has, per street: one level crossing with a train, one shrine with a torii, one market
hall and one temple gate. Its rule — and the reason its world reads as a place rather than as a
theme park — is that **the identifying object appears once**. A strip here gets one ornament: a torii
if it is a shrine approach, a market hall if it is a market, a crossing if it is a railway street.
Two ornaments is a festival town; a row of them is an asset pack.

The same rule applies to the moment `SKILLS.md` §1 asks for: **one thing that moves per place.** A
crossing with a train, a lantern string that swings, an awning that flaps, a bicycle that is
somebody's and therefore does not move at all. The strip is otherwise a diorama of a working street,
which is exactly what the reference's own storefronts are: *"a half-lowered shutter, a menu board
still out, crates stacked and squared off, a freezer running — and nobody in it."*

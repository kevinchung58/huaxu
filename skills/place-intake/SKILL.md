---
name: place-intake
description: Turn the owner's photographs of a real place into the record of a walkable room — read the space off the pictures, decide whether it earns one lane or several, and hand the record to district-author. Use when the owner supplies photos of a trip or a site and asks for it to become a room, before any geometry is written, and whenever a district's purpose is "the place I went to".
---

# From photographs to a room

This skill is the step before `district-author`. It exists because a room built from a picture has to
be built from *what the picture shows*, and the temptation is to build a picture of a picture: a
backdrop with a camera in front of it, full of the details that were easy to draw rather than the ones
that were there.

Two rules come from the site and are not negotiable here:

1. **Plates are generated; the environment is read from the photographs.** What hangs on the wall is a
   drawn plate (a generated file, labelled as generated). What you stand in is built out of what the
   photographs show. The photographs themselves are reference: see "Reference material" below.
2. **Nothing the photographs do not show may be added.** No lettering anywhere (the renderer's
   `fillText` ban is gated), no shop names, no venue names, no dates, no people, no "in 1998 this was".
   A room may be sparse because the picture was sparse; it may not be fuller than the picture.

## 1. Intake — ask these, in one numbered round, with your recommended answer

Four questions are blocking. Ask them before reading anything.

1. **The place and its door on the street.** The site is a hub: a walkable street
   (`street.html`) with a door per room, so a new place is a new door on the street, not a link in a
   chain. Ask where on the street the door stands (the street is walked mouth to far end; the doors
   so far sit at Canada/Tokyo/Fukuoka), and remember the album reads plates in `ROOMS` table order.
2. **The photographs.** How many, of what, and which ones are of the *space* rather than of a subject?
   A lane needs at least one picture that shows the ground, one that shows the walls' height, and one
   that shows what is at the far end. If those do not exist, the room is not buildable yet — say so,
   and say which three shots would unblock it.
3. **Granularity: one lane, or several.** This is the judgement the owner is paying for, so bring it as
   a count, not a feeling. Count **distinct spaces with their own light and their own far end** in the
   material. One is one lane. Two or more *may* be two or more lanes — but a second lane is **earned by
   material**, not by itinerary: it needs roughly eight props of its own, a surface kit of its own, and
   a far end of its own. If a second space would be mostly the same kit with a different sign, it is a
   *stop* in the same lane, not a room. Put the count and your recommendation to the owner as a
   multiple-choice question; never open a second room quietly, and never pad one to justify it.
4. **What the room may claim.** `personal` unless the trip was academic business. Under `personal`,
   nothing in the room may read as a record of attendance; the caveat the drawer prints is written by
   the owner's rule, not by you.

Everything else — the box, the materials, which props, where the light falls — you derive, and you
state it in the record with a reason.

## 2. Reading a photograph into the record

Read each picture for the numbers, not for the mood. The unit is the centimetre; the eye is at 168.

| What you read | Where it goes | How to get it from the picture |
| --- | --- | --- |
| Lane width | `lane.w` | the span between the two facing walls at a point where both are visible; a Tokyo alley is 4–6 m, a covered corridor 2–3 m |
| Ceiling | `lane.ceil` | a door is ~200; count door-heights up. Add the headroom a walker needs — the renderer hangs the bulbs below `ceil` |
| How deep you walk | `lane.d` | how far the picture lets you see before the end wall; this is a *record* depth and the renderer scales it |
| Behind you | `lane.back` | how far the walls should run past the entrance so turning round still shows a room |
| Where the stop points are | `stations` | 4–6 places worth standing: the mouth, the lit thing, the end |
| Wall materials, band by band | `surfaces` | from the ground up, and side by side: what is at ankle, hand, and eye height; where a wall changes material, that is a band. Depths in record centimetres, like everything else — the emitter scales them |
| What is at the far end | `vista` + `backdrop` | the aperture, and the plane behind it: what the eye lands on, and what is beyond that |
| Objects | `objects` | 8–20 things that read as **silhouettes**: what you could recognise at 20 m. Each gets a position, a kind that exists in `OBJ_SIZE`, and a `hint` saying why it is there |
| Lights | `lamps`, `lanterns`, `wires` | every source you can see, with its height, tint and strength; a lantern hangs from a wire that crosses the lane, so the wire is authored too |
| Ground | `marks` | paint, grates, drains, patches, wet. Marks are rectangles in the record's units |
| Overhead | `beams`, ducts, cables | what crosses above: the ceiling is the layer most rooms leave empty, and it is the one a photograph of a real alley is fullest of. Beam depths are record centimetres — the emitter scales them |
| The way out | the back exit | where the door or curtain behind the walker stands; the emitter points it at the hub street, so author the prop, not the destination. Doors to *other rooms* are not a room's business at all — they live on the street |
| The sub-areas | `slots` | the little places the photographs actually show — the stall row, the temple gate, the machine at the end — one per Field notes plate the room will own. The drawn frame that holds a place takes the place's name (`PLACE_TITLES`); a real photograph replaces it in the slot when one arrives. On the album these plates do not appear: the album hangs one representative plate per place, and the sub-areas live inside the rooms |
| The way on, if the far end is open | `lane.max_d` | walk-units depth past `d` at which the walker may keep going when the place's far end is genuinely open ground (the hub street). Absent, the clamp sits a body short of the far wall and the view stays a view |

Rules that keep a room from reading as a backdrop:

- **A prop is drawn because the picture needs it as an edge or a rhythm, never to imply a fact.**
  Anything that would speak about the place — a sign, a name, a price — is left blank instead. Blank is
  a decision; a made-up word is a lie.
- **Light is part of the model.** Every wall, floor and prop is lit by the `lamps` list through the same
  falloff. Do not brighten a surface by hand because the picture looked bright there.
- **The far end earns the room.** A lane that ends in a wall reads as a page that ran out; look at the
  photograph for what the eye actually lands on, and put that out there.
- **Scale is the whole illusion.** The renderer's affine mapping is exact only because walls are 60 cm
  panels; a floor that is thirty metres deep is sliced for the same reason. If you cannot say how big
  something is in centimetres, you have not finished reading the picture.

## 3. Reference material — the photographs never ship

The owner's photographs are **reference**, not content: they are read, and then the room is authored.
They are never committed, never added to `IMG_RULES`, and never rendered.

- They live in `ref/` at the repo root, which is gitignored. Never put them in `IMG/`: that directory is
  a registry, every file in it must match a rule, and a personal photograph of a real place would be
  pulled onto the album wall by the very rules that keep the registry honest.
- The plates that do ship are generated, and registered like every other plate: `("<prefix>-", "field-notes", "generated")`.
  The plate is the picture the visitor sees; the photograph is the evidence the room was built from.
- If the owner later wants real photographs on the wall, that is a different change: real pictures are
  `record` material, and a `record` is not shown until it carries a venue and a date
  (`AGENTS.md`, "`IMG/` is a registry, not a folder"). Do not slip one in under `personal`.

## 4. Hand off, then verify

The record you produce is a block in `DISTRICTS`, one row in `ROOMS` (id, label, page, plate
prefixes, status), and **one door object on the street's record** (`"leave": ROOM_BY_ID[...]["page"]`,
positioned inside the walker's reach — see `district-author` §9). Then `district-author`'s build rules
apply unchanged, and so does its gate:

- `node .verify/verify-walk.mjs` — the harness asserts, per room, that the walk stays inside the
  authored box, that every lantern hangs on a cable that exists, that the Field notes wall is the
  built places grouped with one door each, that each district agrees with its row in `ROOMS`, and
  that every frame's title is a sub-area slot in its own room.
- `node .verify/verify-chain.mjs` — the hub door graph: every room's every exit lands on the street,
  the street carries exactly one door per built room plus its own door to the album, and no page still
  wires the retired chain.
- `node .verify/verify-rooms-e2e.cjs` — the walk itself, driven by keys: from the street into each
  room and out again, Esc included.
- `node .verify/lane-shot.mjs .preview/lane/<place>` — the pixel gate, shot against that room's page:
  the lane is painted where you stand, the deepest stop is not the frame that empties out, and the wall
  behind the entrance is a room.
- `node .verify/cost-probe.mjs` — one depth pass, and the fills still below the ceiling.
- The detector (`impeccable detect`) clean, and the generator idempotent.

## 5. Refusals

- **The material does not show the space.** Say which three shots are missing. Building a "room" out of
  close-ups of objects produces a stage, not a place.
- **One room pretending to be three.** If the photographs show one space, one lane is the honest answer
  even when the trip had three stops. Stops are places in the lane; rooms need their own material.
- **A picture of a person in the space.** People are not props here and are not drawn. Read the space
  around them.
- **A room that only makes sense with lettering.** Signs, menus, tickets, prices: all blank or absent.
  If the room stops working without them, it is not a room this site can hold yet.

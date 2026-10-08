# The promenade: sea, harbour, beach and riverbank

A coast is the one Japanese setting the site has never built, so this file is a specification
rather than a description of something that exists. Its numbers come from the reference build's lake
and lake-road districts, which are the same problem solved on a flat field, and from the site's own
lane geometry where they meet. Read `SKILL.md` §3 first: **a sunlit coast needs the light decided
before any of this is authored**.

## 1. The water

The reference's lake is the model, and its four numbers are the ones to copy:

| Property | Their figure | What it means for us |
|---|---|---|
| area | 7 916 m², 2.6 m at its deepest | a body of water is a *plan*, not a plane with a texture |
| tone bands by depth | under 0.9 m green, 1.75–2.6 m blue-violet | three flat bands, contour-derived, is what gives water its read; one tile is a puddle |
| reflections | block reflections laid from each stretch of shore *toward the middle of the lake* | the reflection points the way the shore does; a uniform shimmer is a lie about which way the water faces |
| motion | three drifting lanes and six ripple rings | wind lanes are streaks that travel; ripple rings are rings that expand. Both are cheap and both are *behaviour* rather than a sine flicker |

**Water above the datum, not below it.** Their lake sits at `groundY + LEVEL − TERRAIN_DROP` and its
shoreline is the contour where the hill field crosses that level — a hole in the terrain is the
other way, and they rejected it as disproportionate for a 110 m lake. We have no terrain field, so
our equivalent is a quay: a wall of authored height, water at a fixed level below the walker, and the
shoreline where our ground plane meets that wall. **The invariant to assert is that the walker never
stands below the water level and never walks through the quay.**

For daylight specifically:

- a sunlit water tile needs *broken* light — short horizontal strokes at varying length and opacity,
  denser near the horizon and sparser in the near field — because that is what makes the eye read a
  distance rather than a colour;
- the horizon is a hard line where the far water meets the sky, and it must land at eye height in
  the projection (`y = 168` at infinity) or the sea will look like a tilted table;
- avoid a high-metalness or reflective material. The owner's own brief says why: on some machines it
  renders as an object with no colour at all.

## 2. The harbour

The reference's harbour district is a table model, but its *plan* is the part that transfers, and it
is the plan that makes a harbour read:

- **a quay with a stepped edge** — bollards every 4–6 m, a ladder recess, a slipway with three or
  four treads down to the water (the treads are the read; a flat wall is a dam);
- **breakwater blocks**: interlocking concrete units in a row, deliberately irregular in plan, which
  is the single most recognisable object a Japanese port has;
- **moored hulls, seen from above or from the side but not both**: a hull with a sheer line and a
  cabin reads at 20 m; two hulls with nothing between them read as two slabs. The reference's own
  open thread is that their boat hulls "read as coloured slabs beyond about twenty metres" because
  they lacked a sheer line — do not repeat it;
- **verticals that give a port its scale**: a mast, a derrick, a crane gantry, a lamp standard. A
  quay with no vertical is a car park;
- **what is left out says somebody works here** — a coiled rope, a stacked pallet, a bollard with a
  worn cap, a hose. None of it is a person, and none of it carries a lettering.

## 3. The beach

Nothing in the site or the reference build has a beach, so this is the one part with no measured
precedent. What is known from the medium rather than from either codebase, and what should be
measured on the artefact once built:

- **a beach is three lines, not a plane**: the shingle or sea-wall line where the town ends, the
  wet-sand line where the water has been, and the water's edge itself. Without the middle line it is
  a sand-coloured floor.
- **sand is a texture, not a colour**: a very low-contrast speckle, lighter toward the dry top, with
  the wet band at a lower value and slightly cooler. This is the same "mid-tone, and the variety is
  what carries it" rule the whole renderer runs on.
- **sea walls and riprap** are the two ways a Japanese shore meets the town; a sea wall with a
  parapet and steps is also the walkable edge, which is what makes a beach *reachable* rather than
  merely visible.
- **nothing is written in the sand and nothing stands on it.** No parasols, no figures, no lettering;
  the reference made the same rule for people and applied it to posters and ema. What a beach can
  carry honestly is what the tide left: a line of weed, a crate, a breakwater.

## 4. The riverbank (an easier first step)

A river is the honest low-cost version of all of the above and it is the one the reference build has
twice (a canal round the planet, a lake road). Its advantages over the sea are real:

- **a river is a lane-shaped thing**, so it fits a one-point projection without the corner problem;
- **it has two banks**, so the visitor can stand on one and see the other — a town, a levee, a line
  of blossom — which is depth the sea cannot give;
- **the far bank gives the backdrop a job to do**, which is what stops a water district reading as
  an empty field with a blue stripe in it.

If the owner's ask is "sea and sun along a street", and the renderer is not ready for a coast, a
riverside promenade is the version that can be built this week and is not a compromise on the thing
he actually described: water in front of you, the town beside you, sun over both.

## 5. The failure modes this district type has

- **Water that is only visible once you are past it.** In a one-point projection, water on your side
  is water behind the parapet. Author the reveal as a station — the reference's lake road has a lay-by
  "where the water first comes into view" for exactly this reason.
- **A shore with no way down.** If the quay is 2 m above the water and the only way to the water is a
  door, the visitor is looking at a picture of a shore. Steps, a slipway or a beach ramp.
- **A sunlit coast measured at night.** Measure in the day you are shipping. A night reading of a
  daylight scene is the wrong frame for every value in it.
- **A lake, a lagoon, a canal, a harbour and a river all at once.** The reference reached this note
  the hard way: "water finds the lowest point on the whole rim, and a 0.3 m notch drains the basin
  with no visual change at all". One body of water per district, and it holds.

---
name: lane-prop
description: Add or change one object, light, state or stop inside a district record — the SHAPE/OBJ_SIZE registers, the id-prefix naming rule, record centimetres and Z_SCALE, glow and `of:` binding, the `states`/`leave` contracts, and the measurement that proves the thing arrived. Use when someone asks for a prop, building, sign, lamp, lantern, door or interactive object to be added to the street or a room, when a prop "does not show up" or renders as a flat card, when a hero object is too small to read, when a light is dark or blown out, when a stop shows the visitor air, and before touching `objects`, `lamps`, `lights` or `stations` in `_gen_html.py`.
---

# One thing, in a lane

`district-author` is how a district is designed; this is how a single change to one is actually
made, because the same four traps have taken a round each and every one of them is silent. The
rules about what a district may claim stay in `district-author` §3 and §5 and are not repeated here.
The Japanese object numbers are in `skills/japan-place/references/japan-vocabulary.md`.

The single fact underneath all of this: **the record is the model, and the renderer believes it.**
Nothing in `js/site.js` invents geometry, light or words. So a change is always two halves — author
the data, then make the artefact the browser fetches show it — and a change that stops after the
first half is indistinguishable from one that was never made.

## 1. The registers: a kind must exist before a prop can

Two tables have to agree, and neither one warns you:

| Where | Table | Holds |
|---|---|---|
| `_gen_html.py` | `OBJ_SIZE` | width × height × depth in **record centimetres**, per kind |
| `js/site.js` | `SHAPE` | which shape branch draws it: `box`, `cloth`, `front`, `door`, `plinth`, `drawbridge`, `stationfront`, … |

`SHAPE[kindOf(id)] || "plane"` — an unregistered kind draws a **plane**, with no error, no warning
and a meaningless bounding box. That is why a new prop starts by reading both tables and deciding
which of the three cases it is:

1. an existing kind does the job → use it and place it;
2. an existing kind nearly does → alias it (`Object.assign(SHAPE, {...})` has `pole → box`,
   `stall → stall`, `curtain → cloth`, …) and say in the record why the alias is honest;
3. a genuinely new shape → a new branch in `js/site.js` **and** an `OBJ_SIZE` entry **and** a
   `SHAPE` entry, in one commit.

**The name is the kind.** `kindOf()` resolves an id by looking for the longest `SHAPE` key the id
starts with, at a dash or the end of the string: `drawbridge-mj` is a `drawbridge`,
`front-mj` is a `front`, `pool-moji` is a `pool`. The same rule is how `.verify/verify-shapes.mjs`
recovers the kind, so a prop named `moji-drawbridge` is a `plane` to the renderer and an unknown to
the harness at the same time. Name props `<kind>-<room>` or `<kind>`, nothing else. There is no
registry to update afterwards: the prefix *is* the registration.

`Z_SCALE = 2.9` stretches **depth only** — a record's `z` is multiplied and its `w`/`h`/`d` are not.
Two consequences that have both cost a round:

- A prop's footprint and its position are authored in the same units but end up scaled differently
  the moment anything is grouped: Toronto's city table had its props spread across ±174 walk cm on
  a 150-deep plinth, so the train and its track floated 99 cm in front of the table. **A table's own
  footprint is what its props are sited against.** Fix the thing the props are standing on, not the
  props.
- A hero object authored at its true size is a few pixels wide. Moji's 108 m drawbridge at real
  scale projected to a 7-pixel line; it is authored at `w:360`. Size a hero object by the screen
  presence it needs and write the reason in the record.

## 2. Geometry: x, z, y, ry — and y is the bottom

`x` runs across the lane, `z` is depth (positive farther; the stylesheet negates it), `y` is the
object's **bottom** above the floor line, `ry` turns it to face down the lane and decides which
way its width runs. A wall-mounted prop (`|ry| > 45`) has its width running *down* the lane, which
is why `facesOf()` swaps the two.

Dressing fails in one of two ways and both are boring to fix late:

- **The decal.** A prop with no `d` has no top and no return, cannot be walked behind, and its hit
  box wraps less than the picture shows — so the thing you can open is not the thing you can see.
  `OBJ_SIZE` carries three numbers per kind for this reason. Only a picture on a wall (`poster`,
  `frame`, `ledge`) is legitimately a plane.
- **The object at the wrong height.** A deck authored at the waterline is *under* the water and
  draws nothing at all — Moji's closed drawbridge was a plane below the surface at `y:80` and is at
  `y:92`. Whenever a prop is invisible, suspect its `y` before suspecting the renderer.

## 3. Lights are data, and a light that is not in the data does not exist

- `lamps` is the list every surface is lit from, through one `lightAt()` falloff. Add the source
  there, not a brighter material.
- `glow` is the additive halo: `{r, k, dy, tint}`. It reads `k` from the record and rises with the
  night. A glow that ignores `k` burns at full strength in daylight, and at `r:500` from 145 units
  away it covers the entire frame — measure the frame's warm share before and after.
- `"of": "<prop id>"` binds a light to a prop, so a state can change it. The harness will not accept
  an `of` that names no record. A glow with no `of` is a lamp on a wall; a glow with `of` is the
  thing's own light.
- **`q.lit` is not a brightness control.** It tops out at a 28% warm wash over the quad's own base
  colour. **Darkness is painted with `air`**, the haze and the night are separate ceilings
  (`AIR_MAX 0.6`, `NIGHT_MAX 0.72`), and their combined effect is multiplicative. Sharing one cap
  between them means night can never arrive.
- A lantern is a light, not a picture of one: `body: "lantern"`, `bulb: false`, with `size` and `h`
  authored next to it, and its wire present in `data-walk-wires`.
- `liton` on the prop is the phase at which *its* windows come up. Stagger it, and never let the
  interval cross midnight — `p - liton` goes negative and `ease01` puts the lights straight out.
- **A place with a sun changes what a light is worth.** On a page whose record says `"day": True`
  (`skills/street-commons` §3) every lit thing is dialled down by how high the sun is, so a lamp or a
  machine keeps its body and loses its halo. Three fields decide what a surface or a source does with
  the sun, and they go on the *quad*, not the record's props: `day: false` (this is not a lit surface
  — sky, distant masses, paper lanterns), `daygain` (take this fraction of the sun: the compound at
  the end of the street takes 0.45–0.72, because its own `lit` was authored for a night and a bright
  surface that is then lifted is a blown-out one), and `nolite` (never darkened by night **and**
  never lifted, which is what a lantern's paper wants). Getting these wrong is invisible in a diff
  and obvious in a frame.

## 4. A prop that answers: `states`, and what a state may be

Dressing a block means leaving things that respond, and a response has to be **geometry** — if
pressing a thing only opens a card that describes it, what was interactive was the caption, not the
room. Author it on the prop:

```python
{"id": "shutter-mj", "kind": "shutter", "x": 120, "z": 300, "y": 0, "ry": 90,
 "states": [{"say": "The shutter is down.", "k": 0.4, "shut": 1.0},
            {"say": "It is half up.", "k": 0.7, "shut": 0.45}],
 "state": 0}
```

- one entry per stop, each carrying a **geometry field** the painter knows (`shut`, `door`, `flap`,
  `slide`, `flip`) and a multiplier `k` for the light it governs;
- `"state": 0` for where it starts, so the stop a thing is at belongs to the *document*;
- the `say` line is the only text a state may own and it is spoken from the card. Nothing on the
  display says "press me" in words — the dashed reach ring is the whole vocabulary;
- a new geometry field means a new branch in the prop's shape, and the shape has to keep working
  with **no states at all**.
- Two traps: an idle repaint must run the tick, or a glide started while the lane was resting stops
  mid-lane; and anything the frame computes must be asked before `checkReach()`'s early returns, or
  the highlight goes stale behind an object in front of you.

## 5. Siting: a stop stands in front of what it names, and a door must be walkable

- **Stops are viewpoints.** Every stop is a place the visitor stands and a thing they should be
  looking at. Author the stop 90–170 in front of its subject (Toronto's ratio) and check the
  subject is in the frame *from there*. The first Moji layout had three of five stops standing
  inside the port, looking at air; every structural assertion passed, because structure cannot see
  what is on the screen.
- **The reach ring is 190.** The walker's depth clamps at `MAX_D` — the far plane minus a body,
  unless the page authors `lane.max_d` — so a door authored deeper than the clamp plus a reach can
  be seen and never opened. Site doors a stop *inside* the clamp.
- **A door to somewhere is authored, never wired.** A prop with `"leave": <page>` is navigated to
  when it is pressed; a room's exit is pointed at the hub by the emitter from `CHAIN_ENTRY`, so the
  record authors the prop and not the destination. Doors *between* rooms are ordinary door objects
  on the street's own record. `data-walk-exit` in the chrome must point at the same destination, so
  key, finger and record cannot disagree.
- **A new place is five things**, not one: a row in `ROOMS`, a record in `DISTRICTS`, a page written
  by the walk loop, plate prefixes in `IMG_RULES`, and **a door object on the street**.
  `skills/place-intake` is the checklist; adding the room and forgetting the door is how a place
  becomes unreachable.

## 6. Closing it out: the change is not made until the served page shows it

```bash
python3 _gen_html.py; echo "exit=$?"        # 0 or nothing else counts
md5sum *.html > /tmp/a && python3 _gen_html.py >/dev/null && md5sum *.html > /tmp/b && diff -q /tmp/a /tmp/b
node .verify/verify-shapes.mjs              # the register: no prop fell back to a plane
node .verify/verify-walk.mjs                # the district agrees with its row, frame titles are slots
node .verify/verify-clash.mjs               # nothing interpenetrates
```

Then **look at it from the stop that names it** — a real browser, the page the server serves, before
and after the change, and count something (pixels of the prop, warm share, luminance). "It is
there" is not a measurement; "it was not there and now it is, and here is the count" is. `SKILLS.md`
§4 has the discipline and the three ways measurement has gone wrong here; `bin/preview` serves the
tree at 8080 and `.verify/lane-shot.mjs .preview/lane/<place>` is the pixel gate for a room.

If the change touched the stylesheet or the script, the cache-buster is derived — `VER` is the sha1
of `css/site.css` + `js/site.js` — so there is nothing to bump, but there *is* something to check:
`curl -s http://127.0.0.1:8080/<page>.html | grep -o 'site\.\(css\|js\)?v=[0-9a-z]*' | sort -u` must
show the value the generator wrote to disk.

## 7. The retail kit: a shop is a `front` with an `awn`

A shopping street (`skills/street-commons/references/shopfront.md`) is built here from the `front`
shape plus three record fields the emitter must ship and the renderer must read — **`data-awn`,
`data-noren`, `data-fascia`** — added to the document contract in round 15, next to `data-leaf`.
A field that is not in the DOM does not exist: the first shops were invisible because `awn` lived
only in the record.

With `awn` (a canvas colour) the front is a shop hugging the wall: kickplate, display glass
(pale by day, dark by night, via `blendHex`), two mullions, a blank fascia board, a canvas that
stands out ~130 cm at 2.4 m with a valance at its edge and **stripes along the slope** (a plain
canvas reads as a lid; a striped one reads as a market), and a noren at the doorway head when the
record names one. Without `awn` it is the old proud closed box. `states[0].shut` decides open
(display) or shut (shutter blade) at load.

Under a sun, saturated cloth washes to pastel: canvas and valance keep `lit` at 0.72–0.85 because
the day page adds its own lift. The first awnings at `lit` 1.1+ came back white. And the units are
the same unit on purpose — the variety is the canvas colour, the cloth and the clutter, never the
frame (`shopfront.md`'s rule, now enforced by one painter).

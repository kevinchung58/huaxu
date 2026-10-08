# The Japanese object table

Every number is in **centimetres**, because that is what a district record is authored in
(`1 px = 1 cm`, `EYE = 168`). Three marks:

- **†** measured from the sakura-crossing reference pack, not recalled — the file it came from is in
  brackets. It is a real generator's number for a real object, which is a stronger source than a
  memory of one.
- **⚑** already committed by a record in this repo. A room that used it is named. Do not re-derive
  these; two rooms disagreeing about how wide a lane is, is a defect you cannot see in a frame.
- *(typical)* where the range is the useful part and a single figure would be false precision.

`OBJ_SIZE` in `_gen_html.py` holds the ones the renderer already draws; anything not in it falls
back to a plausible box `(120, 160, 12)`, which is honest for dressing and wrong for a subject.

---

## 1. The objects a Japanese lane is made of

| Object | Size w × h × d | What identifies it at 20 m | Material / note |
|---|---|---|---|
| 自動販売機 vending machine | 112 × 195 × 72 †`vending.js` | the lit shelf of cans behind glass, and the **white** body | ⚑ Tokyo, `("vending", 96, 150, 52)`. The delivery port (取出口) is an *opening*: the reference released a can at `front − 0.14` inside a solid 0.72 body, so it fell inside the machine for its whole 1.9 s fall. Author the recess, not a printed panel |
| 提灯 paper lantern | ⌀32 × 34 body, r 16 †`shops.js` | the warm cylinder, the rim rings top and bottom, one wire | a **light**, not a texture. A festival lantern is 30–45 tall; a shop's 20–30 *(typical)* |
| 幟 / のぼり banner | 56 × 150 × 6 ⚑`OBJ_SIZE` | a vertical cloth, pole along one edge, no words | `cloth`. The cloth moves; the words never exist |
| 暖簾 noren | 150 × 130 × 6 ⚑`OBJ_SIZE` | the split curtain across a doorway, hem above eye | `cloth`. Panels split at 1/3 and 2/3 |
| シャッター rolling shutter | unit-width × 250–300 | horizontal slats, a box at the head, a rail each side | `shutter`. Half-lowered is the most Japanese thing in the room: it says the street is working without a person in it |
| 庇 / awning | 170 × 12 × 110 ⚑`OBJ_SIZE` | one horizontal plane over the frontage, deep | depth is the read; 60–120 *(typical)* |
| 電柱 utility pole | ⌀20–24 × 800–1200 | the taper, the crossarms, the drum of cable | ⚑ `("utility", 20, 336, 20)` for the lane's short pole. Spacing 25–40 m *(typical)* |
| 電線 the wires | — | **the sag**, not the wire | sag 40–70 over a 25–40 m span. Author them as `data-walk-wires`; a straight line reads as a rule, not a cable |
| 側溝 U-gutter | 30–45 wide × 20–40 deep | the kerbside channel, its lid castings | `grate` for the lid, `concrete` for the run |
| グレーチング grate lid | 30–45 square | the slot pattern | `grate` ⚑ painted tile |
| 点字ブロック tactile paving | 30–60 wide strip | the yellow line is the only saturated thing on the ground | `tactile` ⚑. It is a **route**, so it must run somewhere and turn where a route turns |
| 縁石 kerb | 13.5 high †`street.js` `WALK_H` | the step between road and footway | `kerb` ⚑ |
| カーブミラー convex mirror | ⌀60–100, centre 250–300 up | the orange frame and the two legs | ⚑ `("mirror", 78, 78, 24)`. Blank glass; never reflect a person |
| 消火栓 hydrant | 32 × 94 × 30 ⚑`OBJ_SIZE` | the red post with the two caps | the site's own record |
| 標識 plate on a post | 70 × 86 × 52 ⚑`signA` | a disc or a rectangle on a pole | **blank**. A plate with invented lettering is a lie; a blank plate is a plate |
| ゴミ集積所 refuse point | 180 × 100 × 100 *(typical)* | the cage, the net over it, the crate | ⚑ Toronto/Tokyo dressing; in Japan it is often just a signed kerb and a net |
| エアコン室外機 outdoor AC unit | 78 × 55 × 29 *(typical)* | the fan grille, the pipes at the bottom corner | ⚑ `("ac", 86, 30, 36)` — note the record keeps it low and wide, which is the wall-mounted read |
| 物干し laundry pole | 150–300 × 84 | a pole bracket on the wall, a hanging rail | ⚑ `("rack", 140, 76, 90)`, `("bench", 150, 84, 48)` |
| ブロック塀 block wall | 120–180 high × 19 thick | the running bond of blocks, a cap course | `concrete`; a 波板 wall is `corrugated` at 180 |
| 単管バリケード barrier | 180 × 90 | a tube frame on feet | `galv` |
| コーン + bar | 74 × 70 × 34 ⚑`OBJ_SIZE` | the orange cone, one bar through two of them | dressing; never a queue of people |
| 脚立 / ladder | 36 × 268 × 48 ⚑`OBJ_SIZE` | the stile count | leaned, not standing free |
| 自転車 bicycle | 170–190 long, 100–110 to the bars *(typical)* | two wheels, one frame triangle | ⚑ `("bikes", 150, 102, 55)`. Two copies of the same assembly is how the reference ended up with a fork 0.30 m short of the hub — one builder, many placements |
| 原付 / scooter | 170 × 110 × 65 *(typical)* | the step-through frame, the mirror pair | no badge, no marque |
| 軽トラ kei truck | 340 × 190 × 148 *(typical)* | the flat bed and the cab-over front | the reference's *only* wheeled things that move are legit |
| 植木鉢 / プランター planter | 104 × 50 × 46 ⚑`OBJ_SIZE` | the tub, the foliage, the twig | `planter`; one dead one is more telling than ten healthy |
| 台車 / 木箱 crate | 62 × 46 × 52 ⚑`OBJ_SIZE` | slats and a corner joint | dressing, stacked and squared off, never scattered |

## 2. The shrine, the steps, the gate

| Object | Size | What identifies it | Note |
|---|---|---|---|
| 鳥居 torii | 340 w × 330 h †`shrine.js` | the two pillars leaning very slightly inward, the double lintel | Scale by the shrine: 250–400 for a village shrine, 800+ only for a grand one *(typical)* |
| 石灯籠 stone lantern | 120–200 *(typical)* | the stacked stone drum, the finial | a **light** if it is lit; a stone silhouette if it is not |
| 参道の石段 stone steps | rise 19, run 46 †`shrine.js` | tread count and the hand at the rail | 11 steps = 209 cm of terrace; the terrace must **overlap** the top tread or the walker falls through the seam |
| 手水舎 purification basin | 90–120 square, 70–80 high | the stone basin, the ladles, the roof | water is `water`; the ladles are objects, the people are not |
| 絵馬掛け ema rack | 150–250 wide × 180 high | the little pentagon plates | **blank plates** here. The reference draws ema with pictures on them and its own rule still forbids a person even there |
| 狛犬 / 石像 | 60–90 high *(typical)* | the stone animal pair | a guardian animal is a place's object rather than a person, but the line is the owner's — ask before adding, and never add a human figure |
| 参道の砂利 gravel | — | the colour and the rake | `sand` here is the ground; a shrine's gravel is lighter than a road's |

## 3. The railway, which is the one place the numbers are not negotiable

| Thing | Number | Where |
|---|---|---|
| gauge | 144 †`railway.js` `RAIL_GAUGE` | the rail head pair |
| rail top | 30 †`RAIL_TOP` | above the ballast bed |
| ballast half-width | 220, shoulders +90 | the bed is a trapezoid, not a slab |
| a train car | 2000 (20000 mm) *(typical)*; the reference's train is 6030 in three cars | so no tunnel bore ever holds all of it — the better picture |
| 踏切 crossing | the sequence is bells and lamps first, then the booms, then the train | the *sequence* is what makes a crossing read; the timings are yours |
| 遮断機 boom | 400–500 long *(typical)* | it stands vertical at rest and swings down across the road |
| 警報機 the alarm | lamp pair blinking, a bell | two lamps alternating, never both lit |
| ホーム platform | 150–300 wide; 76 above rail for a 1067 mm line, 110 for standard | the edge line is the read |
| 駅名標 station sign plate | 250 × 40 *(typical)* | **blank**. The reference paints the station's name on it; here it is a plate |

## 4. The port, the table and the moment

Moji is the site's worked example of a table district, and its numbers are committed:

- **The plinth is the world.** `plinth-moji` 660 × 80 × 500 at `z:540`, `top: "cityg"`, with a
  light under its edge (`glow {r:170, k:0.42, dy:96}`) — that underlight is what makes a model read
  as a model. Every prop's position is sited against the **plinth's footprint**, not against the
  record's nominal depth, because `Z_SCALE` stretches the position and not the prop.
- **A stop stands in front of what it names**, 90–170 from it, the way Toronto's do. The first Moji
  layout put three of five stops inside the port, looking at air, and every structural assertion
  passed.
- **The hero object is sized by its screen presence**: the Blue Wing is ~108 m of bridge, authored
  at `w:360`, because at real size it projected to a 7-pixel line.
- **The water is a plane and the deck sits above it.** The closed bridge is a horizontal deck; at
  the water's own height (`y:80`) it was *under* the surface and drew nothing. It is at `y:92`.
- **One cycle carries three moments**: the bridge opens at `p 0.72→0.94`, the ship crosses inside
  that window, and the buildings come up afterwards, one `liton` each. Author the moments into the
  same `dayPhase` rather than giving each its own clock — a harbour that moves on three clocks is
  three animations, not a place.
- **Brick, and the brick is a specific building.** The customhouse is 赤レンガ with a 木骨構造 and
  a 3F observatory; the 大連友好記念館 is brick with a spire; the 舊大阪商船 has large arched
  windows and an octagonal tower. Each of those is the *one* feature that identifies it, and the
  renderer already has four distinct tints for exactly that reason
  (`customhouse: #8f4a3c`, `osakashosen: #b0a488`, `dalianhall: #7e4b39`) — the same brick four
  times would read as one building stamped.

## 5. Ground, markings, and the things that are only paint

- `marks` are rectangles in the record's units: a stop line, a crossing band, a drain, a patch, a
  wet strip. Paint is *under* the props and never a prop.
- A road has a crown and a gutter either side; a lane has neither and instead has a shallow
  centre channel in the older parts of Japan *(typical)*.
- **Wet is a state of the material, not a decal**: `wet` is its own painted tile, and the wet-floor
  reflections come from the same `lamps` list as everything else.
- Nothing written on the ground either. A 停止線 is a white bar with no word above it, and the
  reference's own painted road text is the thing this site cannot have.

## 6. The objects that are lights

| Light | Authoring |
|---|---|
| 提灯 lantern | `body: "lantern"`, `bulb: false`, with `size` and `h`; hangs on a wire that must exist in `data-walk-wires` |
| shop window | a `pane`/`front` prop whose window comes up at its own `liton` |
| street lamp | a lamp on a **pole**: `lamps` entry with height, tint and strength |
| vending machine | `glow` on the machine; it is the classic light at the end of a Japanese lane, and it is why the Tokyo room's far end is a machine rather than a door |
| 石灯籠 / 灯籠 | a stone lantern that is lit is a lamp with a body, not a glow with nothing under it |

Nothing may be lit by a source the data does not name. Adding a lamp in `js/site.js` to "fix" a dark
wall produces a scene that looks lit and a dataset that says otherwise — the one failure this whole
distinction exists to prevent.

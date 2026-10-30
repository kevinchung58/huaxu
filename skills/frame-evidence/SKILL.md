---
name: frame-evidence
description: Make a rendered frame, and every number taken from it, able to be wrong out loud. Use whenever a screenshot, a ray hit, a pixel statistic, a stop position, a heading, or a "the trees look wrong / the prop is flat / the wall is blank" claim is about to be written down, and before any of those numbers enters TODO.md, a PR body, or a skill. Owns arrival, aim, units, refusal, and the difference between "measured" and "believed".
---

# Frame evidence

A frame is the only picture this project has, and it is the easiest thing in it to lie with. Every
defect this skill exists for was already "verified" by a tool that ran to completion and printed a
confident line:

- a gate listed seven objects and framed two, then reported "nothing on screen" and exited 0;
- a stop 74 m down the lane was photographed from wherever the glide had got to, and the frame was
  named for the stop;
- a heading "yaw 0" was really −20.9°, because the aim was a 600 ms key hold;
- a ray hit printed `19416` and a round of TODO called it **19.4 km**; the units are centimetres, so
  it was 194 m, and the whole diagnosis built on it ("the forest is sub-texel at that distance") was
  wrong.

None of those tools crashed. All of them were trusted. That is the failure mode this skill closes.

Use it with `scene-quality-loop` (which owns the visual review as a whole) and `pua` (evidence-led
diagnosis). It does not replace either; it makes the evidence they quote real.

## 1. Arrival is a position, not a pause

Never wait a fixed number of seconds for a glide. Read the body back.

- The target is the stop's own authored position: `--z` and `--x` on `[data-walk-stop]`.
- Wait until the body is within a few centimetres **and** has stopped changing.
- A loose band is not arrival: the body was still gliding inside a 200 cm band and the frame was
  2 m short of the stop.
- "It stopped" is not arrival either: before the click the body is also still. A stillness-only wait
  fired three samples after the click and photographed the lane's mouth.
- If it settles short, that is a **result**, not a retry: print the signed shortfall in cm and let
  the caller decide. A shopfront can block a stop; the frame is still a real place, just not the
  authored one, and the file name must say so.

`/.verify/_aim.mjs` is the one implementation (`arrive(page, stop)`); import it rather than writing
another wait loop.

## 2. Aim with a drag, and read the heading back

- A key hold cannot land a heading: turning integrates per frame with `dt` clamped to 0.12 s at
  120 °/s, so the **smallest** turn one press can make is 14.4° (measured, round 69i).
- A drag sets the heading from distance, so it goes where it is put: **0.065 °/px** horizontally
  (0.09 before round 71 — the constant lives in `js/site.js` and in `.verify/_aim.mjs`, and the two
  are only equal when someone keeps them equal).
- Vertical is a different constant and the opposite sign: **0.065 °/px, drag down looks up**
  (measured 8.00 → 1.50 over 100 px down; 40 px up = +2.6°). `pitch` is positive DOWN.
- The lane clamps pitch to ±24°, so a heading of −28° is unreachable; asking for it must be refused
  by name, not silently rounded.
- Read the head back after it settles and refuse over ~1.2°. A frame named `yaw0` that is 20° off is
  worse than no frame: it becomes evidence.

`aim(page, yaw, { pitch })` in `_aim.mjs` does all of this. A pointerup under 8 px is a **tap** in the
lane's own rule and presses whatever is under it, so every drag travels at least 9 px.

## 3. Units, every time, both ways

World units in this repository are **centimetres** (+y up). Print the metres next to the cm. If a
tool prints a raw number, assume someone will read it as metres and write a paragraph about 19 km of
distance that is really 194 m. `_map.mjs` prints `211..252 m` and `21075..25209 cm`; both.

## 4. Say which renderer drew the frame

`js/site.js` supplies per-frame polygons and `js/scene3d.js` is the only renderer (the Canvas2D
painter was deleted in round 54). A change to a painter in `site.js` therefore *does* reach the
screen — verify by comparing two frames (md5 or a crop), never by assuming. Read the browser's
`__walk.renderer` and record it with the frame.

## 5. A measurement needs the box it claims

"Flat", "too close", "no structure" are claims about pixels, and a pixel claim needs a rectangle.

1. Find which prim owns the pixels: `_map.mjs` raycasts a grid over the live camera and prints a prim
   map plus each prim's distance range and materials. This is how "the trees are behind the shops"
   became "a wooded slope at 211–252 m".
2. Measure the rectangle: `_box.py` prints mean, sd, distinct colours, and the dark/bright shares.
   `_edge.py` prints the height of a coloured band's top edge, column by column, and how many steps
   it has — that is what turns "the tree line is a straight rule" into `sd 20.07 / 17 steps`.
3. Crop and look at it 3–4× (`_crop.py`). The eye still decides what the numbers mean.

A box that includes the background is not a measurement of the prop. Say what the box contains.

**Known limit of `_map.mjs`:** the lane's scenery is merged per material, so many props come back
under the mesh name `walk lane: flat/flat` (16,384 verts) rather than by prop. The map names the
*mesh*, so it can prove "this pixel is 86 m away and part of the merged scenery", and it cannot
prove "this pixel is the SkyWheel". When a claim needs the prop, measure the frame (`_box.py`,
`_edge.py`) and give the gate its own detector, as `verify-wheel.cjs` does.

## 6. A gate must be able to fail

- Every id or stop a gate names must be resolved against the page (`[data-obj]`, `[data-walk-stop]`)
  before it is measured. An id that does not exist is a **FAIL**, not a skip: the old
  `verify-look` framed 2 of 7 ids that had been deleted, then reported success.
- A frame with nothing in it is a **FAIL**. A heading that missed is a **FAIL**. Both exit non-zero.
- A gate that is a diagnostic (an audit of everything, a map, a ray) may report and exit 0, but it
  must say so on its own line: "REPORT (not a gate)". Do not let a report wear a gate's authority,
  and do not let a gate hide behind a report.
- A threshold must be stated with the reason it is that number. "sd > 20" on a 51×51 px miniature
  measures the background, not the prop: state a minimum area or the verdict is noise.

## 6b. A threshold measures what separates the two things, not what makes one of them bright

Round 69l's `verify-wheel` counted "blobs brighter than the row's median by 34" and found **2**
cabins in a frame that has **14**, then failed a scene that was fine. The cabins are pale grey
`#c3ccd2` on pale blue sky `#76a1cb`: luminance 155 vs 147 (indistinguishable), chroma **b−r 15 vs
85** (obvious). The separating measurement was not brightness at all.

So: before writing a threshold, print the actual pixel values of one instance and one background
sample side by side, and pick the axis where they differ most. A detector that is wrong in the
strict direction fails good work; wrong in the loose direction passes bad work. Print the count and
the sizes it found — "14 blobs of 10–20 px" is checkable against the focal length; "PASS" is not.

## 6d. A value the page hands out is not a value the code applies

Round 76 found that every "dusk" frame this repository had ever taken was a **noon** frame. The
generator emitted `data-lane-day-start`, `site.js` parsed it into `DAY_AT`, `DAY_AT` went into a
constant nothing read, and `_walkshot.mjs` / `_lumacheck.mjs` overrode the literal
`data-lane-day-start="0.45"` to ask for 0.9. The probe did exactly what it was told; the page did not.
`_lumacheck` measured the street at luma **141** for "night" and the number looked plausible enough
that no round questioned it. Wired, the same probe reads **80**.

So a probe that overrides an authored value must prove the value arrives:

1. After setting it, **read the effect back in the page** — not the attribute you just wrote, the
   thing it is supposed to move (`window.__walk`, a computed style, a material's colour, a light's
   intensity).
2. If there is nothing to read back, the value has no reader, and the frame you are about to quote is
   a frame of the default. Fix the wiring or say in the report which value was actually rendered.
3. Override the page's value **by pattern**, not by literal: a literal `"0.45"` stops matching the day
   a page ships `0.5`, and then the probe silently photographs the default while reporting the
   override.

The general form: a frame is evidence of *the page as served plus every value that reached the
renderer*. An override that did not reach the renderer is not part of the frame, and a number derived
from that frame is a number about something else.

**The same trap from the other side: a check that compares a page to the constant the page read.**
`.verify/verify-floor.mjs` measures how many centimetres of pavement one tile covers and compares it
with `64 x FLOOR_PERIOD[style]`. To see whether it can fail, `FLOOR_PERIOD` was changed from
`{pavers: 3}` to `{pavers: 2}` and the gate re-run: the tile went 192 → 128 cm and the gate stayed
green **3/3**, because the constant moved both sides of its own comparison. What it proves is real
and narrower than it looks — the floor's uv obeys the table, the tile is square, every page's paving
is textured — but *whether period 3 is the right period* is a fact about the painter's own feature
size (four 48 cm stones across the canvas), which is not in the code anywhere for a gate to read.
Before quoting a gate that checks a derived quantity, break the derivation on purpose and watch
which side moves.

## 6c. Project the geometry before you press the shutter

Round 69m re-aimed one stop three times (yaw 75, 66, 62) and the falls were not in frame any of
those times, because the fault was not the heading. A 40 m drop 6-17 m to the side of a walk subtends
almost nothing: measured by projecting the authored crest into the camera, the curtain occupied
**0-1 % of the frame at every heading** from the middle of that walk. The fix -- a stop at the floor's
end, yaw 88, pitch 14 -- took one pass once the numbers existed.

The tool is cheap: ~60 lines of Python that read the same constants the generator wrote (the crest,
the plane heights, the throw), build the camera basis from yaw/pitch (forward `(sin y, cos y)`,
pitch positive **down**), and project every prim's vertices. Print the share of the frame each
surface owns over a grid of candidate (x, z, yaw, pitch). Two things this catches that a frame does
not: a surface **behind** the camera (negative depth), and a surface that is in frame but hidden
**behind another of the same colour**.

Two traps, both hit in that round:

- **A planar water surface hides the drop behind its own crest.** Standing upstream of a brink, the
  sight line that grazes the lip descends at `atan(eye_height / distance_to_lip)`; everything on the
  sheet below that line is occluded by the water in front. From 6 m back the line already descends
  24 degrees, and at 5 degrees of pitch the sheet is *not in the frame even though the crest is*.
  Either pitch down past the grazing angle or move the eye back -- do not turn the head.
- **`_map.mjs` defaults to `rooms.html`.** Its first run in this round mapped a different page and
  returned surfaces that exist nowhere on the one being fixed (spray at 12.9 m on a page with no
  spray model). Pass `ROOMS=`. A map of the wrong page is worse than no map.

A projected share is a number, not a picture: it says the sheet is 39 % of the frame, not that it
looks like water. Use it to **choose** the shot, then look at the shot.

## 7. Strip the subject before scanning for it

When a gate greps source for a forbidden shape, strip `/* */` and `//` first. A gate that quotes the
comment explaining what it forbids will pass forever (round 69i's `mix()` scan).

## 8. Write it down where the next change will trip over it

A measurement that survives only in a chat message is a measurement that will be undone; a measurement
that survives as a *narrative* is worse, because the next round reads it as current truth. So write
the number where it does work and nowhere else:

- **A constant or rule a future change must obey** → the code, beside what it produced (`PLAYER_RADIUS`,
  `deadAlong`, the road's own widths), or `TODO.md` §5 if it belongs to a decision rather than a file.
- **A gate that holds the behaviour** → `TODO.md` §2.3, or it never runs again.
- **An instrument that is still useful** → `TODO.md` §2.4, or it is scratch and lives in `/tmp`.

There is no fourth place. No round log, no archive, no "lessons so far" section — the owner deleted
them twice (「那些紀錄都刪掉，我怕影響你判斷」/「我覺得都不需要」). A retraction still has to land
somewhere: it lands in the code comment where the wrong thing used to be, or as the gate that now
catches it. If neither of those is possible, the retraction was not a fact about the product.

## 9. Prove the instrument against the paint before quoting its numbers

A per-prop rectangle is a *projection*, and a projection can be wrong. Round 70 measured `skyline-cn`
in `rooms-toronto.html` at stop 4 and concluded the `[data-obj]` rectangle was **not on the model**,
because the towers "painted at x 130-420" while the rectangle sat at 582. Round 70 also concluded the
opposite: that after the mirror fix the same rectangle **frames** the towers. Both statements are in
`TODO.md`. Both quote the same rectangle — and the paint in each came from a different colour
heuristic ("the warmest cluster", "the rectangle's own crop").

**Round 79 settled it with a measurement that cannot drift**: `.verify/verify-box.mjs` asks the
renderer to paint one prop flat magenta (`#ff00ff`, a colour no scene contains), reads the bounding
box of the magenta pixels, and reads the rectangle from the live DOM in the same parked state. Then it
presses the middle of that paint through `document.elementFromPoint`.

| heading | rectangle | paint | cover | verdict |
|---|---|---|---|---|
| 0°, rooms-toronto stop 4 | 581,192 **312x552** | 581,191..892,683 | **100 %** | on its own paint |
| 30°, same stop | 164,172 **305x566** | 163,172..468,683 | **100 %** | on its own paint |
| 0°, rooms-fukuoka stop 2 | every visible prop | — | 100 % | 33/33 across two pages |

So **P6-8 was a false alarm**: the rectangle was never on bare wall. What produced it is the failure
this section is about — a heuristic asked to answer "which pixels are this prop". A colour rule fails
on a prop that is not the only warm thing, a crop rule measures whatever the crop contains, and both
produce a confident number. Ask the renderer instead. The patch is the one `_plume.mjs` already uses:
rewrite the served `js/site.js` in memory, tint the quads of one prop after its branch has pushed
them, and assert the anchor matched **exactly once** — a patch that quietly matches nothing measures
the scene against itself and reports perfect agreement.

Two properties, and one non-verdict:

- **cover**: the prop's own pixels lie inside its rectangle. The mirror's signature was 0 %; a box
  dragged 40 px sideways reads 3.9 % (`SHIFT=40 node .verify/verify-box.mjs`), which is how the gate
  is proved able to fail.
- **press**: `elementFromPoint` at the paint's centre answers with that prop, or with a **nearer** one
  (`z-index = 1200 - depth/4`, and "of two overlapping boxes the nearer wins the press"). Scenery is
  skipped: `[data-quiet]` carries `pointer-events: none` by design (round 65).
- **the centre offset is not a verdict.** `skyline-cn` measures +30 px, because the box includes 61 px
  of table below the model's own lower faces. A centre assertion would fail a correct box.

**The box and the paint must describe the same frame.** A moving prop is read twice — rectangle first,
screenshot a moment later — and the lane's animation moves between the two reads: `tree-c3`, swaying,
shifted 8 px and the gate called a correct box 89 % covered. `js/site.js` reads `prefers-reduced-motion`
**once, at boot** (`const ease = !reduce()`), so `_aim.openPage({ reduce: true })` sets the media
feature *before* the navigation; emulating it afterwards changes nothing.

**Two defects this gate found on its first run** (recorded in `TODO.md`, repro commands in the gate's
header): the hub street's `stall-menya` is a 170x128 card standing parallel to the wall — edge-on, a
12 px sliver at 19 m — and its own faces paint nothing at two headings while its press box sits on the
shopfront behind it; and at `rooms-niagara.html` stop 3 the `falls-horseshoe` disc projects to x 1128
of a 1024-wide frame, so the falls that stop exists to look at cannot be pressed without turning.

Still true from round 70, and still worth memorising: the rectangle *tracks* the heading (so a stale
DOM read is not the explanation), and an offset that reverses sign between 0° and 30° is a mirror, not
a shift (`x_rect = W - x_paint`). That mirror is what round 70 fixed. **The rectangle was never moved
by it.**

The rule, before any per-prop number is quoted:

1. **Tint the prop and read its paint** (`verify-box.mjs`), or crop a rectangle you chose *by looking*
   (`.verify/_box.py`). A colour heuristic is not a second opinion; it is a guess with a number on it.
2. If the rectangle is not on the paint, the **instrument** or the **projection** is the defect. Say
   which, with the heading it was measured at — not a scene defect with an adjective.
3. A rectangle can be honest and still uninformative: `tram-t`'s is the whole 380 cm track (the
   record's `w` is the line, not the car), and `boat-lake`'s is clipped to 1x1 in most views. A prop
   that moves, or whose record describes its path, is not measured by its hit box.
4. A prop standing at the frame's edge has a rectangle three times its visible paint
   (`plinth-market` 1251 px of box, 200 px of frame). Measure the fill against the **visible** part of
   the rectangle, or every edge prop fails for standing at the edge.

## 9b. The tint's own failure modes, and the bodies it cannot tint

The magenta method of section 9 measures a prop by taking the pixels only it painted, so it has three
ways to lie. All three were hit in round 79 on the same gate:

1. **A CSS body has no quad.** The hub street's two festival stalls are painted by `.walk-stall` on
   the button itself — a `background` of awning stripes, posts, booth and basin — and the renderer
   pushes nothing for them. The tint paints nothing, and the first version of the gate reported
   "pressable box, nothing painted" against a stall that answers its own press at every heading. The
   fix is a branch, not a verdict: measure that kind of body on the **untinted base frame** (the
   stall's luminance against a column of pavement beside it) and keep the press test, which is the
   property either way. Ask of every prop: is the thing drawn by a quad, or by CSS?
2. **A stale tint survives into the next prop's frame.** The tint is cleared between props, but on
   this rasteriser a repaint costs 300–600 ms and `__walk.drawQuads` — which publishes a clean list
   as soon as the new frame is committed — can be clean while the canvas still shows the previous
   one. Measured: a 2 px magenta stripe down one edge of the kingyo stall's body frame, which was
   `front-s` (the shopfront beside it) still tinted.
3. **So do not read a frame you did not tint with a wait.** The answer that held is not a longer
   sleep: it is one **untinted frame per heading**, shot before anything is tinted, and every
   branch that wants "the scene as it is" reads that. A frame is evidence of what was drawn when it
   was drawn; a number taken from the wrong frame is worse than no number.

## 9c. A published average is only as fresh as the frames behind it

The lane publishes `__walk.renderMs` — an exponential average (0.7 old + 0.3 new) of what the
renderer's own `render()` call cost — so that a report can say what the machine was asked to draw.
It is the right number to read and it has one trap: **the lane only draws when something changes.**
A page that has loaded, finished its glide and been left alone may not draw again at all, and the
average then keeps the last frame's value — which on the first frame includes shader compilation.

Measured while writing `tools/bench.mjs` (round 80): niagara at the Table Rock rail read
**3,975 ms** through a bench that warmed up for forty `requestAnimationFrame` ticks, and **3.4 ms**
the moment a mouse move forced a real draw (`.verify/cull-probe.mjs`). Same page, same stop, same
heading. The 1,170× error was the instrument's, and it was in the direction that invents a
performance problem — the whole “the renderer is the bottleneck” reading of P4 rested on it.

Two rules come out of it:

1. **Ask for the frame.** `js/site.js` publishes `__walk.draw()` for exactly this (round 80): the
   same `draw()` the keys call, so an instrument can request N real frames and read what they cost.
   Warm up *past* the average's memory (0.7^n: forty frames, not eight), then sample, and print the
   **spread** next to the median — a frozen value reads as `3975–3975`, which is how this was
   caught, and a live one as `24–34`.
2. **A metric that cannot move is not evidence.** Before quoting a number that a change is supposed
   to move, check that the number moves between two states you know differ. If drawing less should
   make it smaller, look at a heading where there is less to draw and confirm it is smaller; if it
   does not move, the instrument is reading a memory, not a measurement.

## 9d. A hit rectangle is not the prop until three things are true

`[data-obj]` is the press target, not a silhouette. Any statistic taken from
`getBoundingClientRect()` on it is a statistic about whatever the rectangle encloses — and on
`rooms-toronto` (26 props over 40 headings, `.verify/audit-all.mjs`) it was wrong twice:

| what the rectangle was | `skyline-cn` | the verdict it produced |
|---|---|---|
| an undrawn prop's last transform | 339 × 609 px, identical at six headings | sd 19.2 → "flat"; the pixels were the hall's banded wall |
| the prop's own silhouette | 171,456 px, mean 122.1 | sd 30.2, 5 of 10 views over 20 — it has form |

1. **`visibility` first.** When the painter does not draw a prop it returns *before* writing a new
   transform, so the element keeps the last heading's box. A "view" of that prop is a view of
   something else, and it is the same rectangle every time, which is the tell.
2. **Then the press floor.** `js/site.js` grows the box to `HIT = 44` px and insets the ring back
   onto the shape with `--padx`/`--pady` (`css/site.css`). The silhouette is the rect deflated by its
   own pad; the pad is written by the same pass as the box, so it is stale whenever (1) is.
3. **Then open the frame.** Even a correct rectangle around a long prop seen at an angle encloses
   background triangles: a low spread is a question, not a verdict. Two of the three props still on
   that list are a blank board and a wall-mounted air conditioner — a plane and a small pale box, and
   the criterion cannot know that from pixels.

## 9e. One build is not bit-stable against itself

A refactor needs a proof that it changed nothing, and the obvious proof — "the frames are identical" —
is not available here. Round 86 measured it before quoting it, on `rooms-toronto` stop 4 heading 90,
day, reduced motion, 1024×768, three ways:

| the two frames | px differing | ≥2 | ≥6 | ≥20 |
|---|---|---|---|---|
| same build, same browser, two launches | 4,249–27,014 | 331–1,514 | 109–385 | 4–0 |
| same build, two browser processes | **0** | 0 | 0 | 0 |
| same build, two servers, one process | **347,294** | 147,475 | 13,434 | 89 |
| the build one refactor old | 4,249 | 331 | 109 | **4** |

The last row is the one that matters: **the refactor's difference sits below the noise floor of the
same build measured twice.** On a Niagara night frame the same comparison came out 0 px. So
"0 px differ" is a claim about the launch, not about the code, and "N px differ" is not a claim at
all until it is compared with the same-build number for that stop.

What *is* exact is what the programme hands the renderer. `__walk.drawQuads` gives every quad's mode,
texture key, colour, world corners and uv; `__walk.x/yaw/pitch/depth` the camera; `__walk.threeStats`
the counters. `.verify/_scenehash.mjs` sorts those rows, hashes them, and prints SAME/DIFFERENT per
stop and heading — that is the A/B instrument for a refactor, and it found the one thing the pictures
could not: at fukuoka stop 2 the two builds' cameras differ in the third decimal (`z 990.00` vs
`989.93`), which is a real difference — a frame-count difference in the glide — that no pixel count
would have separated from dither. A camera that stops a millimetre short is not a visual defect, but
it is a measurement, and it is the kind that only a structural digest reports.

(One visual check is still worth keeping: the same scene at night, where dither has nothing to hide
behind. That is where 0 px means 0 px.)

## 10. A mirrored picture is not a cosmetic bug

Round 70 found the 3D picture was the 2D model's **left-right mirror**, and the tell was that every
`[data-obj]` rectangle satisfied `x_rect = W - x_paint`. That single relation is worth memorising,
because it separates a mirror from an offset without any further measurement:

| relation | what it means |
|---|---|
| `x_rect = x_paint + d` (constant d) | a stale read, or a projection constant that drifted |
| `x_rect = W - x_paint` | the two paths disagree about handedness: a mirror |
| `x_rect` tracks the heading but not the paint | the box is live and the projection is wrong (same as above) |
| `x_rect` clip-fitted to `1x1` | the prop is off screen and the box is lying about it |

Check it before you rewrite any prop. Then decide which side to fix **by asking what the visitor is
supposed to see**, not by which side is easier:

- the *record* carries the geography (a label says "the station, on your left" because the model puts
  it at negative x). If the picture contradicts the label, the **picture** is wrong. Fixing the model
  instead would make the picture agree with itself and disagree with the record — the worse failure,
  because nobody can see it in a frame.
- a mirror is invisible inside one frame. It only shows up when a frame is compared against a claim
  about left and right, which is why it survived many rounds of "the scene looks flat/wrong" reviews.

And after the flip, re-check everything the mirror was silently protecting: photographs hung on walls
(un-mirror their uv), compositions that put a subject at a screen edge, and every gate that quoted a
left or right. The flip itself is two lines; the proof is the frames.

## Procedure


1. State the claim in one sentence and the page/stop/view it is about.
2. `arrive()` → `aim()` → `park()` → shoot. Refusals are the tool working.
3. `_map.mjs` to name the prim; `_box.py`/`_edge.py` to measure the rectangle you will quote.
4. Crop, look, and write the verdict in numbers plus one sentence of judgement.
5. If the claim survives, it goes to TODO with the numbers and the frame path. If it does not, the
   retraction goes there instead — with the number that killed it.
6. If the claim is "this changed nothing", the frame is not the instrument: `_scenehash.mjs` (§9e).

### When you flip handedness, re-derive every box that was measured on the old frames

The flip itself is two lines. The damage is in the constants that were *authored against frames*:

- `verify-hotel.cjs`'s three tower boxes were measured on a mirrored frame; after the flip two of three
  "failed" on the umbrella and a lamp post. They were never wrong about the towers -- they were boxes
  for the other side of the screen. `1024 - x - w` fixed all three.
- a gate that counts run has to be re-derived the same way. `verify-wheel`'s cabin counter went from 14
  to 10 to 11 in three runs of an unchanged scene: the count is a property of the detector against
  that frame, not of the wheel, so read the reported number as a floor for the day, never as a fact.
  (Round 76 found the rest of that story: the wheel turns once every 40 s, so one frame is one sample
  of a moving object. Three frames 7 s apart on the *unchanged* scene counted **16 / 14 / 13** cabins
  while a single frame counted **9** and failed the gate. The threshold did not move; the sampling
  did. Ask of any count: is this thing moving?)
- **headings are numbers authored against frames too, and they were all missed.** `verify-look`'s table
  of five stands was written in round 69j; round 70 flipped the camera, and every heading in it now
  pointed at the other side of the room. `market` said `-12`, where the market model projects off-frame
  (`x 1040`): the gate had been reporting "nothing on screen" for five rounds, and no round ran it. If
  a flip invalidates the boxes, it invalidates every authored bearing, `pitch` and crop in every probe
  — re-derive them in the same round, or write down that you did not.
- and the first thing that broke was invisible until the frame was looked at: `scene.background`
  disappeared, because three paints it with a `BackSide` box and the swapped frustum reversed the
  winding and culled it. Only the *sky* went black; every `DoubleSide` surface was fine. That is the
  general lesson -- a handedness change is a winding change, so the surfaces that vanish are the ones
  that were single-sided, and there is exactly one of those in this renderer.

A mirror gate that reads the paint (largest warm cluster vs the hit box, and its mirror) is stronger
than one that reads the box: `verify-mirror.mjs` passes 74 % vs 1 % with the fix and 1 % vs 71 %
without it, on the same frame, with no threshold tuned between the runs.

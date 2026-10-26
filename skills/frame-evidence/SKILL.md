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
- A drag sets the heading from distance, so it goes where it is put: **0.09 °/px** horizontally.
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

## 8. Write it down where the next round will hit it

Every retraction and every measured constant goes into `TODO.md` in the same round, in the section
that made the claim. A correction that lives only in a chat message is a correction that will be
undone.

## 9. Prove the instrument against the paint before quoting its numbers

A per-prop rectangle is a *projection*, and a projection can be wrong. Round 70 measured `skyline-cn`
in `rooms-toronto.html` at stop 4 and found the `[data-obj]` rectangle **not on the model**:

| heading | rectangle (x, y, w, h) | where the four towers are painted |
|---|---|---|
| 0° | 582, 191, 312, 552 | x 130-420, y 160-690 |
| 30° | 163, 172, 305, 566 | x 548-860, y 170-700 |
| 31° | 153, 171, 307, 569 | — |
| 60° | -22, 147, 350, 622 | — |

The rectangle *tracks* the heading (so it is not a stale DOM read) but it moves the **opposite way** to
the paint, and the offset reverses sign between 0° and 30° — about +450 px one way, -400 px the other.
Cropping the rectangle gives bare wall: mean 102.3, **sd 14.6**, 192 colours — exactly the number
`audit-all.mjs` printed as "flat". The towers inside the same frame measure **sd 24.2**, 246 colours.

So the verdict "skyline-cn is flat" was a measurement of a wall. And it is not one row of the table:
`audit-all.mjs` and `verify-tables.mjs` both measure *through* those rectangles, so a rectangle that
misses its prop makes every number derived from it void — including the ones that passed.

The offset turned out to be a mirror, not a shift: every rectangle satisfies `x_rect = 1024 - x_paint`
about the frame centre. `skyline-cn` 582-894 vs paint 130-420 at 0 deg; 163-466 vs 548-860 at 30 deg;
the CN Tower's 500-586 vs paint 455-530; the dome's -25-431 vs paint 820-960. The cause is the camera,
not the props: Three's `lookAt` with `up = +Y` looking down `+Z` gives a camera right axis of `-X`
(`x = up x z`), while the 2D painter's `camPt` puts `+X` on the right (`W/2 + focal*dx/az`). The 3D
picture is the 2D model's left-right mirror -- which also means the hit boxes, the reach test, and
`_map.mjs`'s "the water is on your right" are all on the other side of what the visitor sees.

The rule, before any per-prop number is quoted:

1. Draw the rectangle on the frame (`.verify/_mark.mjs SRC DST X Y W H`) and look at it.
2. If it is not on the paint, the **instrument** is the defect. Say so, and file it as an instrument
   defect with the heading it was measured at — not as a scene defect with an adjective.
3. Prefer a unit that cannot drift: `.verify/_box.py` over a rectangle *you chose by looking* beats a
   rectangle the page handed you.

A rectangle can also be honest and still uninformative: `tram-t`'s is the whole 380 cm track (because
the record's `w` is the line, not the car), and `boat-lake`'s is clipped to 1x1 in most views. A prop
that moves, or whose record describes its path, is not measured by its hit box.

## Procedure

1. State the claim in one sentence and the page/stop/view it is about.
2. `arrive()` → `aim()` → `park()` → shoot. Refusals are the tool working.
3. `_map.mjs` to name the prim; `_box.py`/`_edge.py` to measure the rectangle you will quote.
4. Crop, look, and write the verdict in numbers plus one sentence of judgement.
5. If the claim survives, it goes to TODO with the numbers and the frame path. If it does not, the
   retraction goes there instead — with the number that killed it.

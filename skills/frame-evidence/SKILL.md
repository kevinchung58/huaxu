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

## 7. Strip the subject before scanning for it

When a gate greps source for a forbidden shape, strip `/* */` and `//` first. A gate that quotes the
comment explaining what it forbids will pass forever (round 69i's `mix()` scan).

## 8. Write it down where the next round will hit it

Every retraction and every measured constant goes into `TODO.md` in the same round, in the section
that made the claim. A correction that lives only in a chat message is a correction that will be
undone.

## Procedure

1. State the claim in one sentence and the page/stop/view it is about.
2. `arrive()` → `aim()` → `park()` → shoot. Refusals are the tool working.
3. `_map.mjs` to name the prim; `_box.py`/`_edge.py` to measure the rectangle you will quote.
4. Crop, look, and write the verdict in numbers plus one sentence of judgement.
5. If the claim survives, it goes to TODO with the numbers and the frame path. If it does not, the
   retraction goes there instead — with the number that killed it.

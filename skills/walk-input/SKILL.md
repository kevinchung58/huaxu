---
name: walk-input
description: How a visitor presses things in a walk room, how the head turns, and how every surface is left again. Use whenever a tap, key, drag, reach, card, bar, stop, overlay or exit is added, moved, removed or re-tuned; whenever a gate or probe drives the lane with a finger, a key or the browser's own back gesture; and before claiming that a control "feels right". Owns the press model (a press is a control you can read), the prune rule (a prop is a thing you can press only when the press does something), the quiet-versus-dead distinction, the real-time turn contract with its constants, the enter/exit history contract (Back folds before it flees), and the instruments that measure all of it.
---

# Walk input

Every rule here cost a round to learn, and each one was learned from a measurement rather than an
opinion. The incidents, because the numbers are the argument:

- **A tap on the picture opened a card for whatever was in reach.** `.verify/_popup-audit.mjs` on
  `rooms-cntower.html` stop 3: **25 taps out of 25** on what the probe thought was empty canvas
  opened a card. The whole picture was a button. The owner: 「很多不必要的物件都會跳這種視窗。這很干擾
  操作體驗。」 A scene-wide gesture is not a control; it is a trap that fires on every look.
- **Removing the tap took a toy away.** The goldfish stall (`stall-kingyo`) is `kind: "board"`, which
  the generator calls scenery, so it shipped `data-quiet="1" tabindex="-1"`. The tap had been its
  only route to `huaxuStalls.open()`. `verify-games` went 23/23 → 20/23 the moment the tap died: a
  gate pressing the stall was the only thing that noticed.
- **A tap turned the head 8–9°.** The turn was integrated inside the motion step with the frame's
  `dt`, and the frame on a software rasteriser is 47–670 ms. A 12 ms flick was paid a frame. The
  same gesture turned four times as far on a slow machine: 「移動左右邊轉向很大」.
- **The tap payment subtracted seconds from milliseconds.** `tap.held += elapsed` (seconds) was
  compared with `tap.ms` (milliseconds), so `owed = cap - held` was always positive and every tap paid
  its full cap; then a floor meant to top up short taps was paid on *every later frame*, and a 3°
  nudge measured 8.9°.

## 1. A press is a control the visitor can read

The scene is look-only. Nothing on the picture presses anything.

- A tap (or click) on the viewport: **folds what is open, and nothing else**. `up()` in `js/site.js`
  is `if (card && !card.hidden) { hideCard(); return; }` and has no other branch.
- The finger's verb is the **bar**: `<button class="walk-open" data-walk-open hidden>` inside
  `.walk-bottom`. It appears only while something is in reach, carries that thing's own
  `data-title`, and its click is `act(reach)`. Its prefix is the thing's own verb, read from
  `data-verb` (`Read · The Horseshoe`, `Walk through · Kaminarimon`), so the visitor knows what kind of
  answer is being offered before spending the press. Round 74 replaced the fixed `Open · `; the label
  and the prompt come from one table in `js/site.js` (`VERB_WORD`), fed by the generator's
  `press_verb`, so the bar, the prompt and the written lane cannot describe a press three ways.
- A prop's own hit box answers **keyboard activation only**. `event.detail === 0` is the DOM's own
  discriminator between a click the keyboard synthesised (Enter/Space on a focused control) and a
  real pointer click; a pointer click focuses the view and is otherwise ignored.
- `E` (and `Enter` on the focused view) remain the keyboard route to the same `act(reach)`.

Check it with `.verify/_popup-audit.mjs` (`ROOMS= STOP= GRID= YAW=`). It reports every gesture —
`Space`, `Enter`, `e`, `i`, four key holds — then a `GRID × GRID` sweep of taps, then the bar at four
headings. A pass is `0/N taps opened a card` **and** `bar yaw … names "<title>" -> CARD "<title>"`.
An audit that only proves the first half has proved that nothing can be pressed.

## 2. Only a thing that does something is a thing you press

The round-72 answer to "many unnecessary objects pop a window" still left 107 pressable props on eight
pages, because a press that opened *nothing* was still a press: it opened the card. The owner's ruling
ended that: 「我說的就是全部拿掉多餘的。你只要真的有意義的物件才留著，這裡面很多都是真的會導致操作很煩。」

**The test, in the generator, in one function.** `is_target(o)` in `_gen_html.py` returns True only when
the press *does* one of these:

- it **leaves** (`leave`) or carries you to another room;
- it **shows photographs** (`frame is not None` — prints, posters, the shutter-hung photographs);
- it **rides** (`ride`), **plays** (`game`), or **demonstrates** (`"demo" in o` — the models that take a
  courtesy turn or ripple when touched);
- it is **the landmark the place is named for** (`landmark`);
- it is **used**: a door that opens, the glass floor (`states` on `door`/`glassfloor`).

Everything else is painting. Measured with `.verify/_census.mjs` on the eight walk pages: **245 press
boxes, 107 pressable before the rule, 43 after** — street 6 · rooms 7 · fukuoka 7 · toronto 3 ·
niagara 9 · goat 6 · journey 1 · cntower 4. What stopped being a button: shop bays, plinths, massing,
the skyline / dome / track / tram / island / boat / pool / ship, the station front, the customs house,
Osaka Shosen, the Dalian hall, the retro high-mart, vending, the hall, and 17 shutter / arcade / plaza /
funhouse / kiosk fronts.

**The card is for one verb only.** Round 73 deleted `showCard()` outright; round 74 brought back a
single text surface, and only for the objects the owner named as needing one (「只留該需要用文字彈出介面
介紹的物件」). Each pressable prop now carries the answer it will give, as `data-verb`, and the card opens
for `read` (a landmark) and for nothing else — `skills/ux-walkthrough/SKILL.md` owns that rule and
`.verify/verify-ux.mjs` enforces it. Everything else answers in the scene: a door leaves, a print opens
its reel of photographs, a lift opens, a car moves. Hiding a card behind a named bar is **not** a fix:
the bar still asks a visitor to press a shopfront that has nothing to say.

**The paragraph is not deleted; it is written down.** The details block in the lane is
`<details class="walk-things" data-walk-things>`: every drawn thing in the order you walk past it, and a
pressable row carries `<span class="thing-does">press E — <verb></span>` plus `li.is-pressable`. Each row
has `id="thing-<obj>"`, which is what `revealThing()` opens, scrolls to and flashes (2400 ms) — landmarks
open their own row that way instead of a surface. So a visitor can still read what a shopfront is and
what is left out of it (`.verify/_r73probe.mjs`, `verify-walk`'s "the paragraph that used to be in that
card is in the lane").

**`data-states` ships only on things you use.** The generator gates it with `is_target(o)` too: the eight
pages carry it on `rooms-cntower.html` alone (3 props: `lift-cn`, `glassfloor-cn`, `lift-skypod`).
A state that changes a painting's colour is not a verb.

## 3. Quiet is not dead

`data-quiet="1"` means **not announced and not written about** — no reach prompt, no row in the lane.
It does not mean "does nothing".

Since round 73 there is nothing after the verbs, so the invariant is inverted and the guard can live
where it is cheapest: **a thing with a verb is never quiet**, because the generator decides both at
once. `is_target(o)` gives a press to anything with a verb, and `walk-object()` writes `data-quiet`
only when `not is_target(o)`; `act(m)` therefore starts with `if (m.quiet) return;` and no verb can be
swallowed by it.

```js
const act = (m) => {
  if (!m) return;
  if (m.quiet) return;                       // the generator guarantees a verb is never quiet
  if (m.el.dataset.leave) { location.assign(m.el.dataset.leave); return; }   // leaves
  if (m.el.dataset.ride && boardRide(m.el)) { tutorAnswered(); return; }     // rides
  if (m.el.dataset.game && huaxuStalls.open(...)) { tutorAnswered(); return; }// plays
  if (m.el.dataset.demo !== undefined) { ...demo envelope...; return; }      // demonstrates
  if (m.el.dataset.story && openStoryRail(...)) { ...; return; }             // shows
  if (m.el.dataset.frame !== undefined && openDistrictRail(...)) { ...; return; }
  if (m.states && m.states.length > 1) { setState(...); say on the record line; return; }  // is used
  if (m.landmark) { revealThing(m.el); tutorAnswered(); }                    // names the place
};
```

The goldfish stall is the case that proves the rule: it is `kind: "board"` (scenery by kind) and a toy
by behaviour. Round 71 answered that by moving the guard down, which kept the toy and left a card at the
bottom; round 73 answers it in `is_target`, the one place that knows what a thing *does*. If you ever
find yourself moving this guard again, the bug is in the generator's predicate, not in `act`.

**Rule.** When you remove an input route, enumerate every verb that only had that route. The way to
enumerate them is to run the gates that press things, not to reason about it:
`verify-games`, `verify-walk` (finger block), `_popup-audit`, `verify-story`, `verify-nowebgl`.

## 4. Pay the visitor's own time

The head turns in real milliseconds, never in frames.

- `TURN_RATE = 85` °/s. `DRAG_DEG_PER_PX = 0.065`. `TURN_TAP_MS = 35` — a nudge worth
  `85 × 0.035 = 2.98°` whatever the frame rate.
- While a turn key is down, each frame pays
  `paidMs = min(elapsed × 1000, performance.now() − tap.start)` and banks it in `tap.held`
  (**milliseconds**, the same unit as `tap.ms`).
- On release, the nudge is owed **once**: `cap = tap.ms > 0 ? max(tap.ms, TURN_TAP_MS) : 0`.
  Without the `tap.ms > 0` guard the floor is paid on every later frame. `owed = cap − tap.held`,
  and `tap.ms`/`tap.held` are zeroed when the payment lands.
- Walk keys keep their own cap (120 ms), because a step should carry you somewhere and a turn should
  be a nudge you can correct.
- **A release has to ask for the frame that pays it.** The nudge is paid inside `tick`, and a lane
  with nothing held rests on a timer, so on a software rasteriser the one frame that saw the key down
  can end before the key comes up and the other 3° are owed to a frame nobody schedules. Measured:
  a 40 ms tap of `ArrowRight` turned **0.4°**, and `verify-feel`'s "a tap of the turn key is never
  swallowed between two frames" was the only thing that noticed. The keyup handler therefore ends
  with `if (tap) loop();`, and every release has a frame to land in.

Measured with `.verify/_turnprobe.mjs` (browser, real events): tap **2.97–2.98°**, 200 ms **17.7–18.4°**,
500 ms **43.4°**, 1000 ms **85.2°**, drag **0.065 °/px** at 60/200/400 px. Before round 71 the same
probe read tap 7.4–9.2°, 200 ms 37.7°, 1 s 140.3°, drag 0.09 °/px.

**A threshold in centimetres is a speed with a frame's length hidden inside it.** The corner assist in
`moveStep` only helps when the press is nearly perpendicular to the face, and it asked for
`|along| < 1.9` — 1.9 cm, which is exactly 115 cm/s at a 16.6 ms frame. But a step is not always a
frame: `moveBody` walks any hop longer than 2.6 cm as micro-steps, so an ordinary 2.8 cm frame at full
walking speed arrives at `moveStep` as two 1.4 cm hops, both under a fixed 1.9, and *every* frame spent
against a long face was read as "straight into a corner". The assist then crept the body toward the
room's centre at 115 cm/s while the visitor pressed on along the face. Measured in the Moji hall
(`.verify/_aisleprobe.cjs`): walking east along the port table stalled at **x 368** and never reached
the aisle; 2 of 6 entry positions stalled, which is why `verify-rooms-e2e` looked flaky. The cure is to
say the same thing as a speed — `const deadAlong = 115 * dt` — which means the same at any frame length
and any sub-sampling. After it: 6 of 6 reach the wall (554–566 cm) in ≤ 270 frames, and the gate is
green. **When a solver constant is compared against a step, divide the intent by the step's own `dt`
before comparing.**

**Every instrument holds the same numbers.** A drag constant lives in three places or the aim lies:
`js/site.js` `DRAG_DEG_PER_PX`, `.verify/_aim.mjs` (`DRAG_DEG_PER_PX`, `DEG_PER_KEY`), `_view.mjs`
(`DRAG`), `verify-look.mjs` (`off / 0.065`). When a rate changes, `grep` for the old constant before
running anything: `grep -rn "0\.09\|14\.4" .verify/`.

## 5. Gates encode the contract, so a contract change edits the gate

- Keep the assertion, change the expectation. `verify-walk`'s finger block used to assert "a tap
  presses the thing you are standing in front of"; it now asserts the opposite, *plus* the bar, the
  pointer-click rule and the drag, and it grew from 201 to 205 assertions rather than shrinking.
- **When the thing a gate stands in front of no longer exists, move the stand-in, not the assertion.**
  Round 73 made shop bays painting, so every Tokyo assertion that opened one ("the shop at the posts",
  "Esc folds what is open", "the keyboard's activation of that box", the guide's third step) opened
  nothing and reported `#room-plate` as `class="modal"` — reach was nothing, so the press had no
  target. The assertions were all still true; they now stand at the print hung on a shutter (west row,
  x −295: `frame-sensoji` z 299, `frame-scramble` 1436, `frame-tower` 2601) and read its reel. A blind
  turn-and-step cannot land on a prop that hangs at one depth, so `verify-walk` grew `walkToThing(id)`
  — turn to the thing's own bearing, step in, repeat until `.walk-hit.is-reach` is it. Use that instead
  of `hold("d", 988)` whenever the target is a specific prop.
- **A press box's size is measured where a visitor meets it.** Facing a wall at 1.2 m nothing is on
  screen, so `0 boxes` was the honest answer to "every visible press box is a fingertip"; the block now
  turns back down the lane before counting. Ask what the visitor is looking at before asking how big
  the boxes are.
- `verify-overlay`'s bar assertion asks the same question the product does — **is the press answered?**
  — and accepts exactly the four answers: a surface, the door the thing names, the thing's own state
  changing, or a demo envelope (`el.__demoAt`). It no longer accepts "a card", because there is no card.
- Durations tuned against an old rate must be **re-scaled**, not guessed: with the turn at 85 °/s
  instead of 120, every `hold("d", 700)` in `verify-walk` became `hold("d", 988)`
  (`× 120/85`) so the same 84° came back and the positional expectations downstream still described
  the same visitor. Without that, eight unrelated assertions failed — reach, rail, focus — none of
  which were about turning.
- A gate that is red before your change is a **finding**, not noise — and "it was already red" is
  not a licence to leave it red. `verify-rooms-e2e` failed 18–20 assertions at the previous commits
  because it still encoded the round-64 contract where A/D *strafed* (round 65 made them turn):
  `sidleToReach` held A and slid sideways at a door, and after round 65 that spun the walker on the
  spot and walked it into the wall, so every door, print and aisle reported the neighbouring shop as
  the thing in reach. Repaired in round 72 by walking the way a visitor does — `walkToReach` turns to
  the target's own bearing and walks in, `walkUntilBlocked` holds W until the body stops — after
  which it is **72/72**. A gate's *expectation* may be old; its *assertion* is usually still true.
- The software rasteriser eats frames (one frame ≈ 0.25–0.67 s). A "tap" can therefore span a frame
  and measure 5–6° even when the model is exact. Judge the sub-frame case and the median, and never
  tune a constant to that artefact.
- **An instrument's "it has stopped" must be longer than a frame.** `_aim.mjs`'s `arrive()` called a
  rail glide finished after six 300 ms samples with no movement — 1.8 s, which on a loaded machine is
  *one* frame, still travelling. `verify-wheel` then failed with `body settled -2693 cm from --z
  (149 vs 2842)` and looked exactly like a broken rail. Stillness is now measured in time against the
  lane's own `frameMs` (`max(6 × 400 ms, 4 × frameMs)`), and the refusal prints how long it was still.
  A gate that cannot tell "arrived" from "the machine is slow" is not evidence.

## 6. Every way in needs the visitor's own way out

The site's exits were all in-page controls (Esc, a close button, a door) and none of them was the
gesture a phone actually has. Measured in a real browser with `.verify/_backprobe.mjs`:

- `rooms-toronto.html`, press `i` (the card opens), press Back → the visitor is on `street.html`, the
  card is gone and their position in the room is lost. On a phone that is the whole exit contract
  failing, not a detail.
- The cure is one chokepoint pair in `js/site.js`: `overlayEntered()` pushes one history entry when a
  surface opens, `overlayLeft()` pops the same entry when it closes, and a `popstate` that arrives
  while something is open folds that surface by dispatching the **same Esc the page already answers**
  (`overlayDepth`, `ownPop`, `foldingFromHistory` are the three counters that keep it from looping).
  Only a Back with nothing open leaves the place.
- Every surface has to report itself or the bug survives on that surface: `enterOverlay`/`leaveOverlay`
  (the story reel, the gallery plate, the dot game), `showCard`/`hideCard`, `showSpace`, `toggleList`
  and the featured-publication modal each call the pair. `OVERLAY_SURFACE` is the ordered selector list
  the fold dispatches at.
- **Selectors must be read off the shipped markup, not remembered.** The first version listed
  `.walk-listpanel` and `.dot-game-panel:not([hidden])`; the panel's class is `walk-list`, the dot
  game hides its `[data-dot-game]` *wrapper*, and the panel is never hidden at all — so the list
  survived Back and the dot-game selector matched on a page where nothing was open. The gate caught
  the first (`the written lane folds on Back`) and the second only after the class names were checked
  against `_gen_html.py`.
- Esc is unchanged and must stay so: it folds what is open, and with nothing open it is the room's
  door. `verify-walk`, `verify-overlay` and `verify-exit` all assert both halves.

Instruments: `.verify/_backprobe.mjs` (real browser, prints `BACK CONTRACT OK` and four verdicts:
card folds / second Back leaves / the written lane folds / Esc with nothing open is the door) and
`.verify/verify-exit.mjs` (jsdom, **82** assertions: every chrome link resolves, Back folds the card
on all 8 walk pages without navigating, two surfaces take two Backs, a self-closed surface leaves no
phantom layer, focus returns, the reel folds, `research.html`'s publication card folds, and Esc means
what it meant). jsdom cannot navigate, so "the Back finally leaves" is asserted in the browser probe
and only "not swallowed by a phantom layer" in the gate — say which side holds which claim.

## 6b. Round 75: reach is not one number, and a bookmark must arrive

- **`REACH = 190` is the length of an arm, not the size of a gesture.** Three reach limits now exist and
  each says what it means: `REACH 190` for a thing you touch, `FAR_REACH 8000` for a thing you only look
  at, `LANDMARK_REACH 60000` for the thing the place is named for, and **`EXIT_REACH 350`** for a door.
  The door's number is the one that was missing: every room hangs its exit 133 cm beyond the lane's near
  edge and the first stop of a room is not the edge (Goat 116, Mojiko 174, CN Tower 58), so at the stop a
  visitor lands on, turning round and pressing E did nothing on three of eight pages. A doorway is not a
  shop window — you press it while walking at it.
- **A glide's speed follows the jump.** `GLIDE_T 1.4 s`, `GLIDE_SPEED 165` floor, `GLIDE_SPEED_MAX 7000`
  ceiling. A hard glide gets a final swept attempt if no detour is available; a clear destination does
  not make the intervening path clear, and collision must not be bypassed to force an arrival.
- **A bookmark must work directly from either direction.** Test the authored x and z from the entrance
  and from stops on both sides of a wide obstacle, not only consecutive stops. Sample the walker's
  collision state en route. `__walk.glide === null` means the glide ended, not that it arrived.
  A detour must search the usable lane width, probe clearance in the direction of travel, and restore
  the original target x before finishing; the temporary detour is not the destination.
- **Collision depth coverage uses the live walker's bounds.** Read `minDepth` and `maxDepth` from
  `__walk`; un-emitted attributes and fixed distance caps silently leave parts of a walk unchecked.
  `wallHalf` is the base shell width, not the wider bounds of a lane with width segments.
- **`__walk.glide` is exposed** so an instrument can ask "is it finished" instead of watching for
  stillness. `_aim.mjs` already learned this in round 72 (a loaded machine shows a resting body for a
  second at a time); `_stops.mjs` and `_reach.mjs` now wait on the handle. A probe that polls for
  stillness will call a stop unfinished and a reachable prop unreachable.
- **A billboard that is pressable only because of a flag will win presses it cannot serve.** Three
  Goat Island far-bank billboards carried `"landmark": True`, so they got the 600 m landmark reach and
  one of them outranked the falls at the rail. `_reach.mjs` (walk to every pressable box on foot,
  8 pages) is what found it, and it is the cheapest possible proof that a pressable thing exists in
  reach at all: **40/40 after the fixes, 36/43 before** (the 7 misses were billboards 88–150 m off the
  lane and two prints no stop could approach).

## 7. Order of work for a change like this

1. Write or extend the probe **first** (`_popup-audit`, `_turnprobe`, `_census` for what is pressable
   on each page, `_aisleprobe` for a solver stall), and record the "before" numbers in the round's
   notes. A UX complaint is a measurement request: 「很多多餘的」 is a count, and 「操作很煩」 is a
   route that does not arrive.
2. Change `js/site.js`; `node --check js/site.js`; `python3 _gen_html.py` (the cache-buster and the
   emitted markup both come from there); re-run the probe for the "after" numbers.
3. Update the instruments' constants, then the gates' expectations, then run the whole battery:
   `verify-walk`, `verify-overlay`, `verify-exit`, `verify-rooms-e2e`, `verify-games`,
   `verify-nowebgl`, `verify-body`, `verify-feel`, `verify-story`, `_popup-audit`, `_turnprobe`,
   `_backprobe`.
4. Only then write it down (this file), refresh `TODO.md`, and hand off.

## 8. Refusals

- Never re-open the picture as a press target "just for touch": that is the defect.
- Never make the bar global (always visible, opening the nearest thing). It must be absent when
  nothing is in reach — absence is the honest statement that there is nothing to press.
- Never buy a smoother turn by paying wall-clock between frames without the `elapsed` clamp; a
  backgrounded tab would spin the head on its first frame back. `blur`/`visibilitychange` release
  the keys, and the clamp stays.
- Never report "the pop-up is gone" from a screenshot. The probe prints `0/N taps` and the bar's
  label; that pair is the claim.
- Never answer "remove the superfluous" by hiding the card behind a control. A bar that offers to open
  a shopfront which has nothing to say is the same defect with one more step: delete the verb, or give
  the thing a real one.
- Never delete the paragraph when you delete the card. The text moves to the written lane
  (`walk-things`), in walking order, with the verb on the rows that have one — the site's content is
  not expendable just because the surface was.
- Never let a surface take the screen without pushing its history entry: a surface that skips
  `overlayEntered` is a surface where Back throws the visitor out of the place.
- Never let Back *escape* the place while something is open to "keep the browser honest": Back is the
  exit of the surface first and of the place second, in that order.

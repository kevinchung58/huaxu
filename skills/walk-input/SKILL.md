---
name: walk-input
description: How a visitor presses things in a walk room, and how the head turns. Use whenever a tap, key, drag, reach, card, bar or stop is added, moved, removed or re-tuned; whenever a gate or probe drives the lane with a finger or a key; and before claiming that a control "feels right". Owns the press model (a press is a control you can read), the quiet-versus-dead distinction, the real-time turn contract with its constants, and the instruments that measure both.
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
  `data-title`, and its click is `act(reach)`. CSS prefixes `Open · ` so the label cannot drift from
  the name the reach announced.
- A prop's own hit box answers **keyboard activation only**. `event.detail === 0` is the DOM's own
  discriminator between a click the keyboard synthesised (Enter/Space on a focused control) and a
  real pointer click; a pointer click focuses the view and is otherwise ignored.
- `E` (and `Enter` on the focused view) remain the keyboard route to the same `act(reach)`.

Check it with `.verify/_popup-audit.mjs` (`ROOMS= STOP= GRID= YAW=`). It reports every gesture —
`Space`, `Enter`, `e`, `i`, four key holds — then a `GRID × GRID` sweep of taps, then the bar at four
headings. A pass is `0/N taps opened a card` **and** `bar yaw … names "<title>" -> CARD "<title>"`.
An audit that only proves the first half has proved that nothing can be pressed.

## 2. Quiet is not dead

`data-quiet="1"` means **not announced and not written about** — no reach prompt, no card. It does
not mean "does nothing".

`act(m)` therefore runs every real verb first — `data-leave`, `data-ride`, `data-game`, `data-demo`,
`data-story`, `data-frame`, `vending`, `states` — and only then refuses the card:

```js
if (m.states && m.states.length > 1) { setState(m, (m.st + 1) % m.states.length); draw(); }
if (m.quiet) return;   // scenery has no record to show
showCard(m);
```

At the *top* of the function that guard took the toy away with the card. And a prop that carries one
of those verbs must be a target at the source: `is_target()` in `_gen_html.py` returns True for
`game`, `ride`, `story` and `"demo" in o`, not only for `kind in PLACE_KINDS` — a board with a game
is a place, whatever it is made of.

**Rule.** When you remove an input route, enumerate every verb that only had that route. The way to
enumerate them is to run the gates that press things, not to reason about it:
`verify-games`, `verify-walk` (finger block), `_popup-audit`, `verify-story`, `verify-nowebgl`.

## 3. Pay the visitor's own time

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

Measured with `.verify/_turnprobe.mjs` (browser, real events): tap **2.97–2.98°**, 200 ms **17.7–18.4°**,
500 ms **43.4°**, 1000 ms **85.2°**, drag **0.065 °/px** at 60/200/400 px. Before round 71 the same
probe read tap 7.4–9.2°, 200 ms 37.7°, 1 s 140.3°, drag 0.09 °/px.

**Every instrument holds the same numbers.** A drag constant lives in three places or the aim lies:
`js/site.js` `DRAG_DEG_PER_PX`, `.verify/_aim.mjs` (`DRAG_DEG_PER_PX`, `DEG_PER_KEY`), `_view.mjs`
(`DRAG`), `verify-look.mjs` (`off / 0.065`). When a rate changes, `grep` for the old constant before
running anything: `grep -rn "0\.09\|14\.4" .verify/`.

## 4. Gates encode the contract, so a contract change edits the gate

- Keep the assertion, change the expectation. `verify-walk`'s finger block used to assert "a tap
  presses the thing you are standing in front of"; it now asserts the opposite, *plus* the bar, the
  pointer-click rule and the drag, and it grew from 201 to 205 assertions rather than shrinking.
- Durations tuned against an old rate must be **re-scaled**, not guessed: with the turn at 85 °/s
  instead of 120, every `hold("d", 700)` in `verify-walk` became `hold("d", 988)`
  (`× 120/85`) so the same 84° came back and the positional expectations downstream still described
  the same visitor. Without that, eight unrelated assertions failed — reach, rail, focus — none of
  which were about turning.
- A gate that is red before your change is a **finding**, not noise. `verify-rooms-e2e` fails 18–20
  assertions both at the branch tip and at the previous commit: it still encodes the round-64
  contract where A/D *strafed* (round 65 made them turn). Say so in `TODO.md` with the A/B numbers;
  do not blame the round you are in.
- The software rasteriser eats frames (one frame ≈ 0.25–0.67 s). A "tap" can therefore span a frame
  and measure 5–6° even when the model is exact. Judge the sub-frame case and the median, and never
  tune a constant to that artefact.

## 5. Order of work for a change like this

1. Write or extend the probe **first** (`_popup-audit`, `_turnprobe`), and record the "before"
   numbers in the round's notes. A UX complaint is a measurement request.
2. Change `js/site.js`; `node --check js/site.js`; `python3 _gen_html.py` (the cache-buster and the
   emitted markup both come from there); re-run the probe for the "after" numbers.
3. Update the instruments' constants, then the gates' expectations, then run the whole battery:
   `verify-walk`, `verify-games`, `verify-nowebgl`, `verify-body`, `verify-feel`, `verify-story`,
   `_popup-audit`, `_turnprobe`.
4. Only then write it down (this file), refresh `TODO.md`, and hand off.

## 6. Refusals

- Never re-open the picture as a press target "just for touch": that is the defect.
- Never make the bar global (always visible, opening the nearest thing). It must be absent when
  nothing is in reach — absence is the honest statement that there is nothing to press.
- Never buy a smoother turn by paying wall-clock between frames without the `elapsed` clamp; a
  backgrounded tab would spin the head on its first frame back. `blur`/`visibilitychange` release
  the keys, and the clamp stays.
- Never report "the pop-up is gone" from a screenshot. The probe prints `0/N taps` and the bar's
  label; that pair is the claim.

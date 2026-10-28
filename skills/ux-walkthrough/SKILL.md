---
name: ux-walkthrough
description: Walk the site the way a visitor does and judge the experience by what a press actually changes on the screen — not by whether a gate says the press was answered. Use whenever a press, bar, card, panel, reel, drawer, prompt, label or camera behaviour changes on a walkable page; whenever the owner says 操作、體驗、彈出、很煩、複雜、干擾 or points at a window appearing; before claiming an experience is good; and whenever a gate is about to assert "the press did something" without asking what it should have done. Owns the two-tier answer rule (a press shows you something, or it is text and only then a card), the measured difference between a record card and the written drawer, and the visitor's pass that finds dead interactions.
---

# UX walkthrough

The owner has now ruled on the same surface three times, each time narrowing it:

1. round 71: 「你幫我全部拿掉這種 …很多不必要的物件都會跳這種視窗。這很干擾操作體驗。」
2. round 72: 「很多東西 因為選取會跳這種介面 你全面審查清楚 有必要的在跳。」
3. round 73: 「全部拿掉多餘的。你只要真的有意義的物件才留著。」
4. round 74: 「只留該需要用文字彈出介面介紹的物件。其他就像你說的可以用E去互動看有沒有變化。你如果全部都做出彈出介面 這很傷使用者體驗。」

Read together, they are one rule with two halves, and the halves are both enforceable:

- **A press must change something you can see** — a door leaves, a lift opens, a car moves, a toy plays,
  a model demonstrates, a print shows its photographs.
- **Text is the last resort.** A card may open for a thing that has nothing to show, and for nothing
  else. On this site that is exactly the landmarks: the falls are 370 m away, pressing them cannot move
  anything, and the record *is* the content.

The measurement that makes the difference concrete (`_uxwalk.mjs`, rooms-goat, the Horseshoe):
pressing the falls opened the **written drawer, 47 % of the picture**, and scrolled a 14-row list to a
paragraph; it now opens the **record card, 13 %**. Same words, a quarter of the screen.

## 1. The rule is a table in the generator, not a taste in the review

`press_verb(o)` in `_gen_html.py` gives every pressable prop one word, in this precedence:

| verb | the thing | the answer | surface |
|---|---|---|---|
| `leave` | a door, a curtain | the page changes | none |
| `photos` | a frame, a poster, a story prop | the reel of photographs | pictures |
| `ride` | the Falls Incline | the camera and the body move | none |
| `play` | the goldfish stall, the rapids bell | the toy | the toy |
| `try` | the drawbridge, the basins, the wheel | the scene moves | none |
| `use` | a door that opens, the glass floor | the thing changes state | none |
| `read` | **a landmark** | its record | the one text card |

Precedence is the whole point: a thing with something to show never asks to be read. The word ships as
`data-verb`; `js/site.js`'s `VERB_WORD` turns it into the bar's prefix (`Read · The Horseshoe`,
`Walk through · Kaminarimon`) and the reach prompt, so the visitor knows which kind of answer is being
offered *before* spending the press. Measured on the eight walk pages (`verify-ux.mjs`):
**43 pressable of 248 boxes** — leave 13, photos 11, try 5, play 3, use 3, ride 2, **read 6**.

## 2. "Answered" is not the same as "changed" — measure the scene, not the sentence

The gate that existed after round 73 asked whether a press produced a surface, a state, a demo or a
navigation. It passed on a press that printed a paragraph and did nothing else — and that is precisely
the experience the owner keeps describing.

Round 74's own catch, because it is the model for what to look for: **the Falls Incline never moved.**
Pressing it announced "You ride the Falls Incline…", took the keys away, and left the body at height 0
for as long as you waited. `stepMotion` read `if (ride) return;` inside the walking branch, and that
`return` skipped `if (ride) rideStep();` at the bottom of the same function. Eleven rounds of gates had
never noticed, because every one of them asserted that the *record line* changed. The visitor pass
(`_uxwalk.mjs`) asks the other question — did the picture change? — and after the fix the same probe
reads height 0 → 259 cm and x 0 → 234 cm in 1.4 s.

So: **a press is answered when something visible changes**, and a text change on its own is not an
answer unless the verb is `read`.

## 3. The heuristics, cut down to the ones this site can actually fail

Method after the `ux-heuristics-review` and `cognitive-load-conversion` skills in
[`tommyjepsen/awesome-ux-skills`](https://github.com/tommyjepsen/awesome-ux-skills) (read round 74). Its
text is **not** vendored here — that repository carries no licence file — and the ten heuristics are
Jakob Nielsen's, not its author's. What is borrowed is the *order of the review*: verdict, only the
relevant heuristics, then at most three actions.

- **H1 Visibility of system status.** The bar and the prompt must say what the press will do before it
  is pressed. This is why `data-verb` exists; a bar that says `Open ·` for a door, a photograph and a
  paragraph promises three different things with one word.
- **H2 Match with the real world.** 「Press E to ride」 on an incline; not "activate the transport".
- **H3 User control and freedom.** Esc folds one layer; Back folds before it flees; a card is
  dismissible from its own button. `verify-exit.mjs` owns this.
- **H4 Consistency.** One verb table feeds the bar, the prompt and the written lane, so the three can
  never describe one press differently.
- **H6 Recognition over recall.** Pressable things answer a press and are in the tab order; scenery is
  not. The written lane lists *every* drawn thing with `press E — <verb>` on the rows that answer, so a
  visitor can find out what is here without walking into it.
- **H8 Aesthetic and minimalist design.** This is the one that keeps being violated. A drawer that
  covers 47 % of the picture to show one paragraph is the defect, even when every word in it is true.
- **H10 Help and documentation.** A 792-character `data-hint` in a card is a wall of text. The written
  lane is where long prose belongs; a card is for a record you read in two breaths (the landmark hints
  are 100–290 characters and that is the bar).

Not applicable here, and it is fine to skip them: H5/H9 (no forms, no error states), H7 (no expert
paths to build).

## 4. Cognitive load: the site's own case

Intrinsic load is the place — walking a lane, reading a facade. Extraneous load is everything the
interface adds on top. Two measured examples, both fixed:

- **A press that shows a drawer.** Opening the written lane for one landmark's record: the visitor has
  to find the row among 14–100, and the picture they were looking at is 47 % gone. The card is 13 %.
- **A press that shows nothing.** The incline (above). The visitor pressed the one control whose whole
  point is motion, and the machine answered with a sentence.

The lever that follows: **when a press feels like too much, the answer is usually fewer words or a
smaller surface — never another layer of interface.**

## 5. How to run the pass (this is the E2E the owner asks for)

1. **Boot the real pages, in a real browser**, from a live preview (`sh bin/preview`), not from a
   screenshot and not from jsdom: `.verify/_uxwalk.mjs`. It walks every stop, turns through four
   headings, folds whatever is open, and presses E on whatever is in reach.
2. **It records, per press**: the object and its verb, the surface that answered and **what percentage
   of the picture it covered**, whether the scene changed (quads, body height), the sentence, the
   milliseconds to answer, and how to fold it. `.preview/ux74/presses.txt`.
3. **Read the table for the two failure shapes**: a press whose answer is text but whose verb is not
   `read`; a press whose answer is nothing. Those are the two things the owner has now complained about
   four times, from two directions.
4. **Fix the product, then the gate**: `.verify/verify-ux.mjs` presses every pressable box in jsdom and
   fails if a text surface opens for any verb but `read`, if a press prompts nothing the scene can
   show, or if a `read` press opens nothing at all.
5. **Report in the review's shape**: one verdict line, only the heuristics that were actually violated,
   then at most three actions — and the numbers, because 「感覺不好」 on this project has always meant a
   number nobody had taken yet.

## 6. Refusals

- Never open a text surface from a press unless the verb is `read`. That is the owner's sentence and
  `verify-ux.mjs` fails the build on it.
- Never answer "this needs explaining" by adding a surface. Explain it where the visitor already asked
  for reading (the written lane), or change the thing so it does not need explaining.
- Never call a press "answered" because the record line changed. Measure the scene: quads, state, body,
  height. A sentence is not a change.
- Never judge an experience from a screenshot, and never from a probe sharing the machine with a
  renderer — the frame timings lie, the counts do not.
- Never delete the prose when you delete the pop-up. It moves to the written lane; the writing on this
  site is the content, not the chrome.

## 7. Procedure

1. Run `_uxwalk.mjs` on the pages you touched (or all eight) and keep the output.
2. Classify every press by `data-verb`; anything undefined or `read`-but-should-change is a finding.
3. Fix the generator (`press_verb`) for a wrong verb; fix `js/site.js` for a wrong answer; fix the
   record when the thing genuinely has nothing but words.
4. `node --check js/site.js && python3 _gen_html.py`, then `node .verify/verify-ux.mjs`,
   `verify-walk`, `verify-overlay`, `verify-exit`, `verify-games`, `verify-rooms-e2e`.
5. Write the numbers into `TODO.md` §1 and the PR body; say plainly what is still uncomfortable.

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

## 4b. A declaration that drops is not an error — it is a colour that never applied

Found on this round's own head, both by looking at one frame of the card:

- `css/site.css` said `color: var(--paper)` in five places on dark plates, and `--paper` was **never
  defined**. The card's prose only looked right because it inherited a light HUD colour two levels up.
- `.modal-close` says `color: var(--navy)`, because every other surface it closes is paper. On this
  card — `rgba(11, 20, 48, 0.94)` — that made the X **navy on navy**: present in the DOM, in the tab
  order, focusable, and invisible. The only way out of the only text surface on the site was the one
  thing on it a visitor could not see. One screenshot showed it: a gold focus ring around nothing.
- A third property, `var(--amber)`, was also undefined (the stall's close button had no hover state).

So the pass has two checks a DOM assertion cannot make: **does every custom property resolve**, and
**is every control on a surface painted in a colour that surface cannot swallow**. Both are now in
`verify-ux.mjs` (three assertions, 66 → 69), and both fail on purpose when the fix is reverted.

## 4c. Round 75: the surface is only half the question — its *contents* are the other half

Round 74 settled which objects may open a surface. The owner's next turn (「你檢查其他的 該弄掉就動掉」) is
the same question one level down, and four defects came out of it. All four were invisible to every
gate that existed, because every gate asked *whether* something opened.

- **A surface that covers the screen to show a picture in a fifth of it.** Pressing a print on
  rooms-toronto opened the story rail over **100 %** of the viewport for a **364 × 199 px** drawing
  (`.verify/_surface.mjs`: 100 % cover, **9 % fill**). The rail's column had been copied from a phone
  story canvas — a 9:16 frame — and every picture in this record is landscape. The fix is not a
  smaller surface: it is that the picture's box is the picture. `paint()` stamps `--ar` from the
  file's natural size and `sizeReel()` stamps `--reel-w` from the height the grid has left; measured
  after: **992 × 541 px, 68 % fill**, and a portrait print gets **479 × 642** instead of 406 px of
  picture in 992 px of blur. The *words* keep `--measure: 30rem` (69–72 characters), because a
  992 px caption line is 132 characters.
- **A bookmark that does not take you to the place it names.** Clicking "Terrapin Point" on the Goat
  Island walk started a **94-second** glide (15599 cm at the comfort speed of 165 cm/s), and on a loaded
  machine glides were cancelled part way: measured with `.verify/_stops.mjs`, Goat's first three stops
  were still walking after 30 s and settled **26–40 m short**. Fixed by making the speed follow the
  jump (`GLIDE_T = 1.4 s`, ceiling `7000 cm/s`) and by letting a *hard* glide (a stop, a frame's own
  approach) finish on its target instead of being dropped. Measured after: **10/10 stops within 0 cm**.
- **A door that does not answer at the stop you arrive on.** Every room hangs its exit 133 cm beyond
  the lane's near edge, and the first stop of a room is not the edge (Goat 116 cm, Mojiko 174, CN
  Tower 58) — so at the stop the visitor lands on, turning round and pressing E did **nothing** on
  three of the eight pages. `EXIT_REACH = 350` now covers it on all eight.
- **A pressable that wins a press it cannot serve.** Three far-bank billboards on Goat Island were
  authored as `landmark`, which gave them a 600 m reach; one of them *outranked the falls* and answered
  a press aimed at the Horseshoe with a note about the trees. They are scenery now
  (`press_verb` counts them as `read` only because of `landmark`; remove the flag and everything falls
  into place), and their paragraphs live in the written lane like every other drawn thing's.

So the pass has a second table to read, not just a first: **cover % and fill %** from `_surface.mjs`,
**arrival shortfall** from `_stops.mjs`, and **can it be reached on foot** from `_reach.mjs`
(40/40 after these fixes; before, the goldfish stall could only be found by wandering off the centre
line).

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
- Never call a surface "small enough" without measuring what is inside it. A full-screen surface holding
  a fifth of the picture is a pop-up with extra steps, and `cover` alone cannot tell the two apart.
- Never let a bookmark (a stop, a chapter link, a row in a list) end anywhere but where it says it
  goes. A glide that gives up half way is a promise the device broke.
- Never judge an experience from a screenshot — *except* for what only a screenshot shows: a control
  painted in its own background, a card that covers the thing it describes, a ring around nothing. The
  counts and the frame answer different questions; this round needed both, and the invisible X was
  only ever visible in the picture.
- Never trust `var(--something)` to exist because the page looks right. An undefined property drops
  the whole declaration in silence, and inheritance supplies whatever the ancestor happened to be.
- Never delete the prose when you delete the pop-up. It moves to the written lane; the writing on this
  site is the content, not the chrome.

## 7. Procedure

0. Run `.verify/_surface.mjs`, `_stops.mjs` and `_reach.mjs` first: they answer *is there anything to
   judge* before you judge the look of it.
1. Run `_uxwalk.mjs` on the pages you touched (or all eight) and keep the output.
2. Classify every press by `data-verb`; anything undefined or `read`-but-should-change is a finding.
3. Fix the generator (`press_verb`) for a wrong verb; fix `js/site.js` for a wrong answer; fix the
   record when the thing genuinely has nothing but words.
4. `node --check js/site.js && python3 _gen_html.py`, then `node .verify/verify-ux.mjs`,
   `verify-walk`, `verify-overlay`, `verify-exit`, `verify-games`, `verify-rooms-e2e`.
5. Write the numbers into `TODO.md` §1 and the PR body; say plainly what is still uncomfortable.

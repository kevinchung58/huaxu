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

## 5b. What the pass cannot see unless you make it — eleven shapes found by playing

A pass that walked every stop, pressed everything and printed no `?!` row still shipped all eleven
of these. Each one is a reason the table says "fine" while the visitor's experience is wrong; each has
a gate now, and each gate was run against the tree before the fix to prove it can fail.

| shape | what the table showed | what was true | how it is measured now |
|---|---|---|---|
| **Two ways to the same state** | `clock: night` both times | the night you press to and the night you reload into were different pictures (the sky's PMREM and hemisphere were made once, from the hour at boot); "day" after a night boot was a daylit sky over black buildings | `verify-hour.mjs`: the frame, cut into 12 × 9 cells — pressed night = booted night, pressed day = booted day. Before: mean 91.8 / 188.5 at Niagara; after: 1.2 / 0.7. And six more presses leave `threeStats.textures` where it was: the first fix made a new PMREM target per change and disposed only its texture (30 → 36); three.js's own moving-sun example keeps one generator and one target, and so does `skyLight` now |
| **A thing that never stands still** | `carousel:try SCENE 1219->1222` | nothing read the press; the ride was turning anyway, under the drawbridge's sentence | `verify-demo.mjs` reads the words; `tests/demo-words.test.cjs` holds every authored `demo` value to its own row in `DEMOS` |
| **A press that poisons the next ones** | every row answered | a demonstration's pump borrowed the idle pulse's timer handle; one step during the envelope cancelled it and the record line stayed held for the rest of the visit | `verify-demo.mjs`: press, step, wait out the envelope, read the hold |
| **A ride that says it arrived** | `falls-incline:ride SCENE` (the view moved) | from the fun row it lifted the body 3.9 m and set it down where it stood; from the deck it went deck-to-deck (`height < 900`, and the deck is 553). No ride down existed | `verify-demo.mjs` reads the **body** after the ride: on the record's own deck (`data-lane-floors`), then on the ground |
| **A sentence that lasts one frame** | the sentence was in the row | `say` rewrites the record line every frame, so a one-off written straight into it was gone before the next sample — and the line is the screen reader's live region | `verify-demo.mjs` reads the line a second later; the lane's `holdLine(text, ms)` is the only way to say a one-off |
| **A control only a script can press** | `bar yaw 0 names "The Horseshoe Falls" -> CARD` | the bar is the one control a finger has, and it inherited `pointer-events: none` from its layout row: every tap fell through to the scene. The audit pressed it with `element.click()` inside the page, which does not hit-test | `verify-demo.mjs` 6: `page.mouse.click` and `page.touchscreen.tap` at the bar's centre, desktop and 390 × 844 |
| **A lane that never rests again** | every row answered, every frame right | each press of the hour button left one more redraw timer running for the rest of the visit (it wrote into the idle pulse's handle without stopping the timer in it). The browser's frame rate went 60 → 8 → 4 → 1; screenshots took 2 s, then 17 s, then never | `tests/idle-pulse.test.cjs` counts ticks on a fake clock (30 in 3 s at rest, 146 after four presses); `verify-demo.mjs` 5 counts the browser's animation frames |
| **A fix that multiplies frames** | the stranded record line was fixed | giving the demonstration its own timer kept it alive while walking — and each firing made `tick` forget the frame it had asked for and ask for another: 1,612 ticks in 118 frames, each a full redraw | `tests/idle-pulse.test.cjs`: walking during a demonstration, and a ride, are one tick a frame. The lane's timers enter through `nudge()` |
| **A control with no area** | every pass opened and closed the written lane | its close button was 0 × 29 px: `.walk-list button` (class + element) outweighed `.walk-drawer-close` and zeroed its padding and border, and the icon had no size. On a phone the open lane covers the tools and there is no Esc: it opened and could not be closed. Every instrument had closed it with `element.click()` | `verify-press.mjs` presses it with a mouse and with a finger, open and scrolled to the end, on all 8 pages; `verify-targets.mjs` reports `ZERO` |
| **A size chosen by the window for a thing in a drawer** | the lane's frames were listed; the stops were all there | `@media (min-width: 900px)` gave the frame list three columns inside a 30rem drawer — each picture a 79 px ribbon, the lane scrolling 120 px sideways; and `46vw` squeezed Fukuoka's fourteen stop ticks to 5 px each on a phone | `verify-press.mjs` (the lane fits its width, narrowest frame ≥ 120 px, narrowest tick ≥ 16 px and a press on the last one arrives); `verify-targets.mjs` reports `WIDE` |
| **A sentence printed for every row** | the list named nine districts | every open card said "You are standing in it." — twice — on every page, and none was a way to go there; each also pointed `aria-describedby` at an id no page has (72 of them) | `verify-press.mjs` (one card says it, the others carry a link, a click on Tokyo's walks into Tokyo); `tests/page-refs.test.cjs` |
| **A picture at the right width and the wrong height** | the frames were listed, each over 120 px wide, nothing scrolling sideways | the pictures carry `width="896" height="1200"` and `img { max-width: 100% }` narrows without touching the height: every frame in the lane was drawn 325 × 1200 (204 × 1200 on a phone), 2.8 times too tall. The round before saw it and wrote "its own proportion, taller than the window" — a width check passes it, and a tall picture in a scrolling list looks like a long picture until the numbers are divided | `verify-press.mjs` compares each frame's drawn shape with its file's (within 3 %) |
| **A pad lying on a pad** | every control owned its centre point | two 27 px buttons 2 px apart, each with a 4 px pad: the later one in the source took the shared strip and the earlier answered over 29 px. A box measurement cannot see a pad at all, so it called both small and neither colliding | `verify-targets.mjs` measures the area that answers (§5c) |

What follows from them, as rules for the next pass:

- **Sign off with the visitor's input, never with `evaluate`.** `page.evaluate(() => el.click())` and
  `el.dispatchEvent` do not hit-test: they press a control that is covered, that has
  `pointer-events: none`, or that is off the screen. Use them to *stage* (dismiss the guide, read
  state); press with `page.mouse.click(x, y)`, `page.keyboard`, `page.touchscreen.tap`. And ask
  `document.elementFromPoint` at the control's centre first — "who owns this point" is the whole
  defect in one read. `PART=4 node .verify/_hands.mjs` does this for every visible button on a page,
  and `node .verify/verify-targets.mjs` asks it of every visible control on all 19 pages at a desk,
  a phone upright and a phone on its side, then measures the area that answers (§5c). A new lane
  control joins `verify-press.mjs`.
- **Count what a press leaves behind.** After the answer is over, the lane must be as it was before:
  the same ticks a second (`__walk.ticks`), the same texture count (`__walk.threeStats.textures`),
  the same frame rate. A leak looks like nothing on the first press and like a broken site on the
  tenth; press four times and measure once.
- **Where time is the thing measured, make time a number.** A browser pass waits on the wall clock,
  and on this rasteriser one redraw chain already fills the machine — five chains ticked 12 to 14
  times a second against 9, which no threshold separates. `tests/helpers/boot.cjs` already pumps
  frames off a fake clock; `tests/idle-pulse.test.cjs` shows how to put the page's `setTimeout` on
  the same clock (take it over after boot, wait out the one real timer, then `advance(ms)`). The
  count is then exact and the test runs in seconds. A pass that slows down as it goes — each
  screenshot longer than the last — is not a slow machine, it is this defect.

- **Reach every state by every road.** The hour is stored, so each state has a pressed road and a
  booted road; a page a door leads to has a walked road and a typed-URL road. Shoot both and compare
  the *frames*; the lane's state cannot tell them apart.
- **Walk the pass after dark as well**: `HOUR=night SHOTS=1 ROOMS=… node .verify/_uxwalk.mjs` writes
  a before/after pair for every press. A page with an hour button is two pages.
- **`SCENE` on a moving thing proves nothing, and `WORDS` on a thing that moves without changing its
  count proves nothing either.** The quad count filed the carousel as answered while nothing read the
  press, and filed the drawbridge as `WORDS`/`?!` while its leaves were rising. With `SHOTS=1` every
  row carries `px idle>press` — the share of the picture that changed in 2.2 s untouched, then in the
  2.2 s after the press. `px 0.3>0.4` is a press that showed nothing; `px 0.3>9.1` is an answer.
  Read that column first; look at the pair for any row where the two numbers are close.
- **After a press, do the next thing a visitor does** — take a step, press something else, wait —
  and read the line again. A press is not over when its answer starts.
- **Read where the body is, not what the line says.** "You step off at the top" was said at street
  level.
- **Run one browser pass at a time.** With two, the software rasteriser falls to a frame every few
  seconds and a probe reports "walked 28 cm in 2.5 s" about a street with nothing in the way.
- `_hands.mjs` holds what only a hand finds: the hour button under a real click, and a 390 × 844
  touch phone (a 180 px drag turns the head 12°, so a full-width swipe is 25°). That one is the
  owner's to decide, not a defect to fix quietly.

## 5c. Sizes: the target is the area that answers, not the box that is drawn

Checked against four published rule sets on GitHub (2026-11-16), all MIT, none installed here —
they agree, and what they agree on is the rule:

| where | what it says |
|---|---|
| `jakubkrehel/skills` `skills/better-accessibility/` (`SKILL.md`, `hit-areas.md`) | WCAG 2.5.8 (AA) is 24 × 24 CSS px with five exceptions (spacing, equivalent, inline, user-agent, essential); aim for 44 × 44 on touch and 40 × 40 on a desk "where density permits" — those are recommendations, not findings. Keep the drawing small and extend the area with a pseudo-element; **never let extended areas overlap** — where they would, shrink the pad to the largest size that does not collide. A decorative layer over a control takes `pointer-events: none` |
| `vercel-labs/web-interface-guidelines` (`AGENTS.md`, "Targets & Input") | MUST: hit target ≥ 24 px, **mobile ≥ 44 px**; if the visual is under 24, expand the hit area. MUST: `touch-action: manipulation` on controls. (The shorter `command.md` that `vercel-labs/agent-skills` `web-design-guidelines` fetches leaves the size rule out) |
| `addyosmani/web-quality-skills` `skills/accessibility/SKILL.md` | 2.5.8: 24 × 24 minimum; 44 × 44 "comfortable"; exceptions for inline links and for a 24 px circle that touches no other target |
| `ibelick/ui-skills` (`fixing-accessibility`, `baseline-ui`) | read for a number; it gives none |

How that is applied here (`css/site.css`, "Targets", at the end of the file):

- **Measure what answers.** `verify-targets.mjs` walks outward from a control's centre one pixel
  at a time, asking `elementFromPoint`, and stops where the point is no longer the control's. A
  bounding box cannot see a pad, and cannot see a pad that a neighbour's pad lies on. The first
  sweep measured boxes and called 399 things small; measured as areas, the real list was shorter
  and different — and it found two **collisions** the boxes hid: the two view buttons were 2 px
  apart with 4 px pads each ("Wider view" answered over 29 px of its 35), and the stop rail's pads
  reached up into the way out (36 px tall, answering over 39).
- **A pad is half the gap, never more.** The toolbar's gap is a custom property and the pad is
  `calc(var(--gap) / -2)`, so the two cannot drift apart.
- **`@media (pointer: coarse)`, not a width.** The 44 is for a finger; a narrow window with a mouse
  keeps the desk's density. Nothing in that block resizes a glyph; it grows boxes where the layout
  has room (the way out, the bar, the card's close button, the footer's links) and pads elsewhere.
- **Where the room runs out, say so in the gate.** Fourteen stops on 390 px are 25.7 px each: over
  AA's 24, under 44, and the largest that does not collide. `DENSE` in `verify-targets.mjs` names
  that case and its reason; a `DENSE` entry under 24 still fails. Adding to that list is a decision,
  not a way to turn a red line green.
- **Turn the phone.** The first pass measured a desk and an upright phone and called it done. A
  phone on its side keeps the finger and loses half the height: at 640 × 360 the guide's longest
  step lay over the rail, at 568 × 320 every step did, and neither window was in any gate. The
  gate's third view is 640 × 360 (`VIEW=side`), any other touch window can be asked for by size
  (`VIEW=667x375,568x320`), and `tests/walk-guide-visual` holds the guide clear of every other
  layer at both short sizes. A short window is fixed with its width, not by shaving 8 px.
- **Give the walk room.** A control near the window's edge or under the fixed header measures
  short because the walk ends at the edge; the gate scrolls it to the middle first.

### Which outside skill helps with playing the site (checked against the repositories, 2026-11-15)

The owner asked this directly, twice. Three were read at the source; none is installed here, and
none needs to be — what each one *requires* is the useful part.

| skill | where it is | what it asks for | here |
|---|---|---|---|
| `develop-web-game` | `openai/skills`, **removed from `main`** on 2026-04-23 (commit `11c64381`); last tree `77963424`, `skills/.curated/develop-web-game/`, Apache-2.0 | the one written for a `<canvas>` game: a text state hook (`window.render_game_to_text`), a deterministic step (`window.advanceTime(ms)` — "without it, automated tests can be flaky"), a Playwright client that sends short input bursts and saves a screenshot + the text state + console errors after each, and "verify the whole chain: cause → intermediate states → outcome" | `__walk` + `_aim.mjs` `state()` is the text hook; `_uxwalk` is the burst-and-capture loop; the deterministic step exists in jsdom (`tests/helpers/boot.cjs`, `tests/idle-pulse.test.cjs`) and **not** in the browser passes, which wait on the wall clock |
| `playwright-interactive` | `openai/skills` `main`, `skills/.curated/playwright-interactive/` | a QA inventory written first (every visible control and claim maps to a check); functional sign-off with real input only — "`page.evaluate(...)` may inspect or stage state, but does not count as signoff input"; a separate visual pass; never one screenshot for something that moves | this was the rule the bar broke (the row above). `PART=4 _hands.mjs` is the inventory by real click; `_uxwalk SHOTS=1` takes three frames a press |
| `webapp-testing` | `anthropics/skills` `main`, `skills/webapp-testing/` | Python Playwright against a local server (`scripts/with_server.py`), load → network idle → screenshot → act | `bin/gate` is the server helper. It treats a canvas as one element: fine for the plain pages, blind inside the walk |

And one that is not a skill: `mrdoob/three.js` tests its own examples (`test/e2e/puppeteer.js`,
`deterministic-injection.js`) by freezing `performance.now`, seeding `Math.random`, rendering a
fixed number of frames, and comparing with a per-pixel threshold of 0.1 and at most 0.1 % of pixels
different. `verify-hour` is deliberately coarser (12 × 9 cell means, mean ≤ 4, ≤ 8 cells over 24)
because the lane's clock is not frozen and Niagara's wheel turns between two boots; it catches a
whole-picture difference (the defect was 91.8) and would miss a small local one.

## 6. Refusals

- Never open a text surface from a press unless the verb is `read`. That is the owner's sentence and
  `verify-ux.mjs` fails the build on it.
- Never answer "this needs explaining" by adding a surface. Explain it where the visitor already asked
  for reading (the written lane), or change the thing so it does not need explaining.
- Never call a press "answered" because the record line changed. Measure the scene: quads, state, body,
  height. A sentence is not a change.
- Never call a press "answered" because the scene changed either, when the thing was already moving.
  The carousel passed that test for as long as it had been pressable.
- Never write a one-off sentence into the record line directly. `holdLine(text, ms)` or it is gone in
  a frame.
- Never give a second pump the idle pulse's handle (`pulse`). The frame loop cancels it on the first
  step; a pump that must outlive a step owns its own timer (`demoPulse`).
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
1. Run `_uxwalk.mjs` on the pages you touched (or all eight) and keep the output; run it again with
   `HOUR=night SHOTS=1` on any page with an hour button, and look at the pairs.
2. Classify every press by `data-verb`; anything undefined or `read`-but-should-change is a finding.
3. Fix the generator (`press_verb`) for a wrong verb; fix `js/site.js` for a wrong answer; fix the
   record when the thing genuinely has nothing but words.
4. `node --check js/site.js && python3 _gen_html.py`, then `node .verify/verify-ux.mjs`,
   `verify-walk`, `verify-overlay`, `verify-exit`, `verify-games`, `verify-rooms-e2e`, and in the
   real browser `sh bin/gate node .verify/verify-demo.mjs` and `verify-hour.mjs`.
5. Write the numbers into `TODO.md` §1 and the PR body; say plainly what is still uncomfortable.

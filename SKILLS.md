# SKILLS.md — how a place gets built here

Every room on this site is a model of a real place, walked at ground level. This file is the
method, written down because it has been learned the hard way and because the next room should
not have to relearn it.

It is called SKILLS and not RULES because it is a craft rather than a checklist. Where AGENTS.md
says what must be true of the repository, this file says how to get a district right.

The loadable halves of it live in `skills/`, and those are what an agent should open when the work
starts: `district-author` (the record, the build rules, the gate), `place-intake` (photographs to a
record), `japan-place` (what a Japanese place is made of — the object table in centimetres, the
night, the prohibitions, and the sakura-crossing study note), `street-commons` (the hub street, a
new region along it, a promenade, and the honest cost of daylight) and `lane-prop` (one object, light
or state, and the measurement that proves it arrived). This file is the method behind all five.

---

## 1. Grill first, build second

**The single most expensive mistake available here is building the wrong thing well.**

A room takes many hours. If the subject is wrong, or the view is wrong, all of it is wasted and
worse than wasted, because a well-made wrong thing looks finished and so does not get questioned.
So before a single prop is authored, the following must have answers. Ask the owner. Do not infer
them, do not guess them, and do not quietly pick a default because asking felt slow.

### The questions

1. **Which place, exactly?** Not the city — the *spot*. "Fukuoka" turned out to mean Moji Port,
   which is a specific waterfront in Kitakyushu, not the yatai alley the room had been built as.
   A city is not a subject; a place you can stand in is.
2. **Where does the visitor stand, and what is in front of them?** A diorama has one vantage per
   stop. Name the buildings that must be visible from it.
3. **What time is it?** These rooms have a day-night cycle now. "Night" and "late afternoon" are
   different rooms with different lighting budgets.
4. **What is the one thing that moves?** Every good model railway exhibit has a moment. Niagara is
   the water. Toronto is the roof opening and the lights coming up. Rogers Centre is not a building
   with a roof, it is a roof that opens. Ask what the moment is here.
5. **Is there a personal connection?** This site may not imply a visit that did not happen. If the
   owner was there, that changes what is safe to claim; if they were not, the room must stand on
   the place's own facts. Never assume either way.
6. **How many?** A row of stalls, a line of ships, a string of lanterns. Density is what separates
   a model from a diagram, and the number is the owner's to give, not the builder's to economise on.

### Grilling well

- Ask **before** building, and ask with research already done. "What should this be?" is a lazy
  question; "Moji Port has the station, the customhouse and the Blue Wing drawbridge — which of
  those is the room, and which is the view?" is not.
- Offer **options the owner can reject**, not open questions they have to compose an answer to.
- Ask about **facts the repository cannot supply**: whether they were there, what they remember,
  which building mattered. Never about things research can answer.
- Say plainly what is **blocked** and why. "I will not invent your institution's name" is a
  complete sentence and the owner will usually supply it.
- The owner will often just say *繼續*. That is permission to proceed on the answers already
  given, **and a standing instruction to come back and grill them the moment a real fork appears.**
  It is not permission to guess.

---

## 2. Research the place like a modeller, not a tourist

Before anything is drawn, establish:

- **Proportions.** Real dimensions, from sources. Niagara is 670 m of crest against a 57 m drop,
  which is 11.75:1 and means breadth, not height. A yatai is ~3 m by 2.5 m by 2.5 m. Get these
  wrong and the object is not merely inaccurate, it is unrecognisable.
- **What identifies it.** Not what is there, but what makes it *that* place. The Blue Wing is not
  "a bridge", it is Japan's largest pedestrian drawbridge and it opens six times a day. That is
  the object.
- **Materials and colour.** Red brick with a specific bond, a wooden neo-Renaissance station, a blue
  steel bascule. A model reads by silhouette and material, not by detail.
- **What it looks like after dark.** Every room here has a night. Find out what is illuminated.

Cite sources. Record conclusions in the code next to what they produced, and in TODO.md, because
fetched pages are not saved and the next session starts from nothing.

---

## 3. The benchmark is Little Canada

The owner named it, so it is the standard. Its signature is not detail for its own sake:

- **One synchronised day-night cycle** across every exhibit, with thousands of LEDs coming up at
  "sunset". Ours is four minutes, not fifteen, because a cycle nobody waits for is decoration.
- **Motion that is behavioural**, not sinusoidal. A ferry berths, stands, and gets under way; it
  does not bounce off the quay.
- **Motion on the body of the object.** A roof that opens, a boat that crosses. Not a light blinking
  in a corner at low alpha.
- **Detail that rewards looking.** Interiors you can see into. A clock that keeps the hall's own
  time. Things you find, not things you are shown.

If a room is merely correct, it has not met this standard.

---

## 4. Measure, never assert

**Everything claims a number must be measured, in the browser, on the artefact the server serves.**

### The three ways measurement has been wrong here

1. **Picking the largest bounding box.** For a row of blocks the broadest view is the plain end.
   A skyline read 34 colours at 90° and 529 at 0°.
2. **Picking the most detailed crop.** That prefers a tight crop of a small part over an honest view
   of the whole. A track measured a 24×83 sliver. Only views seeing at least half the best area are
   eligible.
3. **Sampling only the extreme turns.** The audit used −90° and +90° and only those, which
   produced two wrong conclusions in a row and one reverted change. It now sweeps
   **{−90, −45, 0, 45, 90} at every stop**, 25 viewpoints, in batches, because one process over all
   of them runs out of memory.

### Other traps, all of them hit

- **A short window misses a slow cycle.** Sampling 2.1 s of a 42 s roof cycle measures it as dead.
  Watch a whole cycle before concluding an object does not move.
- **A sample taken at the animation's own period reads zero.** Use 0.7 s spacing.
- **`q.lit` is not a brightness control.** It tops out at a 28% warm wash over the quad's own base
  colour. Turning it down does not darken a room, it removes a wash. **Darkness is painted on with
  `air`.** This has now been learned four times; it is written at the point of use.
- **A flat tint over a varied texture destroys the texture.** Lighting windows by washing the
  daytime texture costs the city 460 of its 500 colours. Light things with their *own* texture.
- **Changing a position requires re-measuring.** A re-seat is not an improvement until it measures
  as one.
- **A reading of 0.00 is a sampling frame suspected before it is a defect assumed.**

### The gate

Every change, before it is committed:

```
sh bin/restore-env            # the sandbox wipes; this is idempotent and never resets hard
sh bin/preview                # regenerate and serve
node .verify/verify-shapes.mjs
node .verify/verify-geometry.mjs
node .verify/verify-clash.mjs
node .verify/verify-walk.mjs
node .verify/verify-objects.mjs          # needs LD_LIBRARY_PATH=/tmp/al2023/lib
node node_modules/impeccable/cli/bin/cli.js detect --json css/site.css $(ls *.html)
md5sum *.html; python3 _gen_html.py; md5sum *.html   # idempotent
```

Then re-measure whatever the change touched, and record the numbers in the commit message.
`git fetch` and compare `git rev-list --count HEAD..origin/<branch>` **before** committing.

---

## 5. What may never be invented

- No lettering in a scene. No shop name, no sign, no price, no date. Signboards are pinned blank.
- No people or figures in the rooms. Interiors are dressed, not populated.
- No claim that the owner visited, was at, or attended anywhere.
- No institution, job title, ORCID or Scholar in structured data or prose unless supplied.
  A wrong identifier published about a researcher is worse than no identifier.
- No invented venue, date, caption or attendee anywhere on the site.

When the site needs one of these, **ask**, and leave the slot empty until it arrives.

---

## 6. Environment

The sandbox is rebuilt from nothing between turns and sometimes mid-turn: `node_modules`, `/tmp`,
and occasionally the git graph itself, which can come back pointing at `master` while the working
tree still holds the branch's files.

`bin/restore-env` restores all of it. It is idempotent and it **never resets hard** — the files are
usually intact and only the branch pointer is wrong. Run it at the start of a turn and again
whenever a tool call fails with a missing package.

Scripts that need `node_modules` must live in `.verify/`, not `/tmp`. Puppeteer scripts need
`LD_LIBRARY_PATH=/tmp/al2023/lib`.

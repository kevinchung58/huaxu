---
name: district-author
description: Author a themed walkable district for the huaxu site — intake questions, the record shape, the build rules, and the verification gate. Use when adding or changing a district (a place whose frames, objects and clips hang in one lane), when an owner asks for "3D" or a stories-style viewer on this site, or before choosing any rendering library for it.
---

# Authoring a district

A district is one themed space: a lane of a few planes, some interactive objects, and the
frames that belong to it. It is not a gallery with a camera bolted on, and it never replaces
the list.

Work in this order. Do not skip the intake, and do not start with a library.

## 1. Intake — ask before you build

Ask the whole frontier in one round, numbered, each with your recommended answer. Two
answers are blocking and cannot be invented by you:

1. **Kind.** `personal` or `academic`. This is the set of claims the space may make, not a
   label. Travel is personal; a talk, workshop or school visit is academic.
   - personal: generated imagery allowed throughout, nothing may read as a record of
     attendance;
   - academic: every frame carries a venue and a date or it is not shown, and generated art
     may not stand in for evidence.
2. **Purpose.** One sentence, printed on the picker card next to the kind.

Everything else (sightlines, which objects, how deep the lane is) is yours to decide and
state with reasons — that is what the owner pays you for. Finding facts is your job: never
ask the owner what the tools can tell you.

A district with an undeclared kind renders as **shut** (`Purpose not declared`, `Not open
yet`). An honestly locked door is cheaper than a confidently wrong one.

## 2. The record

`DISTRICTS` in `_gen_html.py` — id, label, kind, purpose, status (`open` | `soon`), blurb,
objects, frames, slots. Geometry in px with CSS' handedness: `x` across the lane, `z` depth
(positive is farther; the stylesheet negates it), `y` is the object's **bottom** above the
floor line, `ry` turns it to face down the lane. The eye never moves: `.room-world` is
translated and rotated the other way, so there is no projection math, no loop, no library.

Clamps are design, not limitation: yaw ±35°, pitch ±10°. Past that the walls stop covering
the viewport and the room shows its own edges. Turning is drag, never Pointer Lock —
Pointer Lock is unsupported on every iOS Safari and it hijacks the cursor.

## 3. Build rules

- Edit `_gen_html.py`, `css/site.css`, `js/site.js` only. **Never hand-edit `*.html`.**
- One `VER` constant feeds both `?v=` tags. Never reintroduce a per-file literal: a stale
  pin ships invisible changes to every visitor with a warm cache.
- Every frame is three surfaces from one record: a wall object, a captioned list row with an
  anchor, and a rail figure. Counts must stay equal; assert it in the harness.
- Image dimensions come from the file's own JPEG header. If it cannot be parsed, omit the
  attributes — a guessed size is a worse layout bug than none.
- `alt=""` on images inside an object: the object's visible tag is its accessible name, and
  a nested alt concatenates into it.
- Generated art is labelled generated, once, above the list — not stamped on every row, which
  is the cadence the detector calls templated.
- Reduced motion: no auto-advance, no flicker, no sway; taps and keys still work. Touch gets
  the same affordances as hover, never a worse set.
- The stories rail is mechanics only: segments, right two thirds forward, left third back,
  hold or Space to pause, a live counter. **Nothing is marked viewed and nothing expires** —
  this site is a durable record.
- No third-party media host for the player: Google Drive returns a virus-scan interstitial
  above ~25 MB and cannot serve range requests (seeking breaks); Pages does not serve Git
  LFS media. Small MP4s in the repo; Release assets when they outgrow it.

## 4. The gate — verify the served page, not the tree

Run in this order and stop on the first failure:

```bash
python3 _gen_html.py; echo "exit=$?"          # exit 0 or nothing else counts
md5sum *.html > /tmp/a && python3 _gen_html.py >/dev/null && md5sum *.html > /tmp/b
diff -q /tmp/a /tmp/b                          # the generator must be idempotent
cd .claude/scratch && node verify-rooms.mjs   # 37 assertions incl. clamps, focus, inert
node .claude/skills/impeccable/scripts/detect.mjs --json css/site.css $(ls *.html)
curl -s http://127.0.0.1:8080/<page>.html | grep -o 'site\.\(css\|js\)?v=[0-9a-z]*' | sort -u
curl -s http://127.0.0.1:8080/<page>.html | grep -c '<new marker you just added>'
```

The last two are not paranoia. This project shipped a page whose tree content was correct
while the browser was being handed stale cache-busted assets, and it shipped three commits
where `python3 _gen_html.py` raised `NameError` while the already-generated pages made the
build look healthy. Grep the artefact the browser fetches.

`.claude/` is gitignored and the sandbox wipes it between turns: reinstall the impeccable
skill (`skill-v4.1.3`, prefix `.agent/skills/impeccable`, then
`npm install --no-save htmlparser2 css-select css-tree domutils`) and `jsdom` before
trusting either result. If the tooling is gone, say so in the commit message instead of
quietly downgrading to grep.

## 5. Refusals

No invented venues, dates, captions, attendees, or visited places. No student or bystander
faces presented as content. No vendored library, no WebGL, no npm tooling committed without
the owner explicitly renegotiating the dependency rule in `AGENTS.md` — and that is its own
PR, not a gallery PR. When a hoist or splice of this single-file generator is involved,
check ordering: a slice with `i > j` produces a duplicated region that still parses, passes
`ast.parse`, and fails only at runtime.

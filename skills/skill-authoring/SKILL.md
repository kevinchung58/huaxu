---
name: skill-authoring
description: Decide when a lesson becomes a skill, write or change one, and keep the register honest. Use at the end of any round that discovered a defect class, a measured constant, or a rule that the next round could break; also use before editing any existing skills/ file. Trigger it whenever a fix would otherwise live only in this conversation, or whenever a new instrument, gate, or threshold appears in .verify/.
---

# Skill authoring

## The honest starting point

An "installed skill" is a file. Nothing in this repository, and nothing in the agent's runtime,
watches for the moment a lesson appears and switches a skill on. `/tmp/anthropic-skills/skills/
skill-creator/` is a **document** — it is read when someone opens it, and it is gone after a sandbox
reset. So the answer to "does the creator activate itself?" is **no**, and any process that pretends
otherwise is a process nobody will trust.

What can be automatic is this: **a rule that says when to write a skill, and a gate that fails when
the register is wrong.** `.verify/verify-skills.mjs` is that gate. It cannot read intent; it can
prove that every skill on disk is well-formed, registered, and routed. Run it in every round that
touches `skills/`, and run it once per round even when you think you did not.

## 1. Should this be a skill?

Write a new skill when **all four** hold:

1. The lesson is a **class**, not an instance: "gates must resolve every id they name" is a class;
   "stop 5 needed pitch −16" is an instance and belongs in `TODO.md`.
2. It will be needed **again** by a round that has not happened.
3. It is **checkable or demonstrable** — ideally both, with a number or a command.
4. It does not already exist. Extend an existing skill before adding a sixteenth.

Modify an existing skill when the lesson lands inside a job that skill already owns. A related lesson
put in a new file is a lesson nobody routes to.

Do **not** write a skill for: a one-off data value, a state of the work ("the plaza is done"), a
restatement of `AGENTS.md`, or a rule that no instrument can enforce and no reader would apply.

## 2. Where the lesson came from

Every skill must be able to name its evidence — a round, a number, a failing tool. A skill without
one is an opinion. In this repository the pattern is:

- a defect that recurred, or a tool that reported success without looking;
- the measurement that made the defect visible;
- the correction that made it stay fixed (a gate, a constant, a refusal).

`frame-evidence` is the model: three instruments that ran to completion and lied, written down with
their exact numbers, ending in `.verify/_aim.mjs`.

## 3. The shape

Follow the creator's anatomy, which this repository already uses:

- **front matter**: `name` (must equal the directory) and a `description` that says *when to use it*,
  slightly pushy, one paragraph. The description is the only thing a router sees.
- **under 500 lines** (the creator's cap; most here are 30–390). Say the rule, then the reason, then
  the number that proves it. Progressive disclosure: put the detail in a section, not in prose.
- **refusals**, not advice. "A gate that names an id that does not exist must FAIL" is usable;
  "be careful with ids" is not.
- **Procedure** at the end, numbered, in the order a round would actually do it.

## 4. Register it, or it does not exist

Three places, and the gate checks all three:

1. `skills/<name>/SKILL.md` — the file.
2. `skills/README.md` — one row: what it is, where it lives, where it came from, when to use it.
3. `SKILLS.md` — the routing paragraph, so a round knows which skill owns what.

A skill missing from (2) or (3) is invisible to the next session and will be re-learned from scratch.
That is the defect this gate exists for: at round 69k, `skills/` held thirteen skills and
`skills/README.md` registered four.

## 5. Evals, when the skill makes a judgement

`skills/<name>/evals/evals.json`: 2–4 prompts a future round would actually type, each with the
behaviour that distinguishes the skill from a baseline. Keep them short; they are for a human or a
future agent to run by hand. A skill whose eval cannot fail is documentation, not a skill.

## 6. Procedure

1. Identify the class from this round's evidence; write the number down before it is forgotten.
2. Search `skills/` for an owner. Extend it if there is one.
3. Draft with front matter, the refusals, the numbers, the procedure.
4. Add the README row and the `SKILLS.md` routing sentence.
5. If it makes a judgement, add `evals/evals.json`.
6. `node .verify/verify-skills.mjs` — it must pass, and it must be able to fail (break a row on
   purpose once, if you have never seen it red).

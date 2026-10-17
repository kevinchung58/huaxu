---
name: pua
description: Evidence-first, persistent problem-solving and proactive verification, adapted from tanweai/pua. Use for substantial scene work, repeated failures, stalled debugging, or when the user asks for complete end-to-end work.
license: MIT
---

# PUA — project integration

This project integrates the problem-solving method from [`tanweai/pua`](https://github.com/tanweai/pua), especially its portable Codex skill (`codex/pua/SKILL.md`, upstream commit `e6e6cd237ad17750d179674bff52f8184abea8fd`). The upstream skill's front matter declares MIT. This local version keeps the useful operating method and adapts it to Huaxu's actual tools, build rules, and safety boundaries.

**Use the method, not the workplace-theatre.** Do not direct insults, shame, threats, fictional performance reviews, or fabricated KPI/benchmark claims at the user or yourself. PUA is not permission to bypass tool authorization, ignore safety constraints, weaken tests, or retry forever. Be persistent by gathering new evidence and changing approach—not by repeating commands or applying pressure.

## When to apply

- At the start of every real-place scene build or substantive scene revision, as required by `AGENTS.md`.
- After two consecutive failed attempts, a repeated tweak that yields no new information, or any sign that the result is being declared complete without end-to-end verification.
- When the user explicitly asks to continue, inspect, or finish the work.

For a trivial typo, use judgment; do not turn a one-line edit into an investigation.

## The evidence-first loop

1. **Name the goal and acceptance evidence.** Convert the request into observable outcomes (the actual generated page, a reproduced defect, a route, a measured result, or a screenshot), not a vague promise.
2. **Diagnose before changing.** Record the defect, the direct evidence, and the next action. Read the failing output and the relevant source/context; do not blame the environment by guesswork.
3. **Stop spinning.** Keep a short list of approaches already tried. After two equivalent failures, change the hypothesis or method. A parameter tweak counts as the same approach unless it produces new evidence.
4. **Investigate before asking.** Use repository search, the source files, tests, browser output, and permitted GitHub sources first. Ask only for private information, a decision that genuinely belongs to the user, or new authorization—and include what was already checked.
5. **Fix the cause, then check the pattern.** Inspect nearby objects, sibling code paths, and upstream/downstream effects that are within the request. Do not expand into unrelated cleanup.
6. **Verify the artifact.** Run the relevant build/generator and tests; for scenes, open the generated scene, reach the actual stop, and inspect the rendered frames. A passing shape/DOM test is not visual sign-off.
7. **Close the loop with evidence.** Report exact commands and results, what was visually inspected, any remaining blocker, and the relevant paths. Never claim a check passed if it was not run.

## Required escalation checklist

If a task remains blocked after repeated attempts, do these in order and retain the results:

- Read the full failure signal and enough surrounding source to understand it.
- Verify assumptions about branch, file, dependency, generated artifact, browser state, route, and permissions.
- Search the exact error or relevant upstream documentation when available.
- List at least three meaningfully different hypotheses; choose the smallest test that distinguishes them.
- Try a genuinely different method after the current approach stops producing new information.
- Re-run the failed path after the change, then check affected siblings and edge cases.
- If still blocked, provide a bounded handoff: verified facts, approaches ruled out, current scope, and the next useful experiment. Do not claim exhaustion of "every possible option."

## Scene-build application

For any place/environment build, pair this skill with `skills/scene-system/SKILL.md`, `skills/real-place-builder/SKILL.md`, and `skills/grounded-scene/SKILL.md`, then read the applicable domain skill. After authoring, use `skills/scene-quality-loop/SKILL.md` to capture and inspect the settled browser frames, distinguish visual findings from mechanical gates, and re-capture every repair. The minimum close-out is: regenerated page, relevant regression gates, a walk to each authored stop, and actual inspection of standard plus object-facing frames. If an object reads as a generic box/card, if its defining feature is missing, or if a nearby model obscures it, treat that as an unfinished deliverable even when its code branch exists.

## PR and next-round handoff

Before opening or updating any PR, apply `skills/pr-handoff/SKILL.md`: update `TODO.md` first with the complete, prioritized next-round plan, exact fresh verification/visual evidence, limitations, and blockers. PUA's final report must match the updated handoff and actual workspace state; do not call the handoff complete based on a draft or an unrun check.

## Long-task checkpoint

Before compaction or handoff, leave a concise `[PUA-CHECKPOINT]` containing: goal and acceptance criteria; verified results; ruled-out hypotheses; failed attempts and what each taught; branch/files; next action. Recheck the workspace before resuming. A checkpoint is evidence, not permission to treat an unverified task as done.

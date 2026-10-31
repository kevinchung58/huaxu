---
name: pr-handoff
description: Mandatory Huaxu pull-request handoff for opening, updating, or preparing to merge a PR. Use before every PR creation or update to keep TODO.md's open work accurate and to keep round logs out of the repository entirely (owner ruling, 2026-10-29); use it again before merge.
---

# PR handoff and next-round TODO

The owner requires `TODO.md` to be updated **before every PR is opened or updated**, so the next session receives an accurate plan rather than a stale summary — and, since round 82, requires that plan to contain **no record of what earlier rounds did** 「我覺得都不需要」. In this repository that means the file is prepared before pushing changes intended for an open PR or editing its title/body. Follow `AGENTS.md`'s fixed Arena branch rule and keep this skill paired with PUA's evidence-first reporting.

## Before opening or updating a PR

1. **Confirm scope and branch.** Read the user's current request, `AGENTS.md`, current PR state, branch name, `git status`, and the full diff against the PR head. Do not silently include ignored screenshots, reference photographs, local skills, or other untracked artifacts.
2. **Read `TODO.md` for what is open.** It is the only working file: status, rules, the gate list, the
   open tasks with their acceptance evidence, the owner blockers. (Before round 82 there was a
   round-log archive; the owner deleted it. 「我覺得都不需要」 — do not recreate it, in any form.)
3. **Write no round log.** Not a summary section, not a "what this round did" paragraph, not an archive
   appendix, not a skill "lessons" section. The round's story lives in the commit message and the PR
   body, which are written once and never read as a plan. If a fact must survive, put it where a future
   *change* will trip over it: the constant in the code beside what it produced, the rule in
   `AGENTS.md`, the gate in `TODO.md` §2.3, the instrument in `TODO.md` §2.4.
4. **Refresh only what changed in `TODO.md`.** Close what closed (delete the item), add what opened
   (with its prerequisite and observable acceptance evidence), correct a rule that proved wrong. A
   finished task is deleted, not narrated — the diff says what happened.
5. **Audit the open list against the repository.** Re-read every open, blocked or limitation entry this
   work touched; mark it accurately; carry forward what is still open. Do not invent work to make the
   list look full, and do not omit known work to claim the round is complete.
6. **Review before any PR operation.** `TODO.md` must match the current diff and the latest evidence;
   commands and results must have actually run; each open task needs a testable acceptance condition.
   Then commit, push, and create/update the PR.

## Before merge

- Re-read the current user request, the latest `TODO.md`, PR diff/body, target base, branch, and CI/check state.
- Confirm every required gate has fresh output; inspect actual rendered images for scene work. A successful build, clean diff, or merged PR is not visual sign-off.
- Update the PR body to match the final diff and exact verification results; preserve caveats and scope boundaries.
- Merge only the explicit PR number the owner authorized, using the repository's required `gh pr merge <number> --merge` form. Report the resulting merge state and commit only after confirming it from GitHub.
- If a check or required visual review is incomplete, do not imply it passed. State the blocker in `TODO.md` as open work (with the experiment that would close it), and do not merge until the task's acceptance conditions are satisfied.

---
name: pr-handoff
description: Mandatory Huaxu pull-request handoff for opening, updating, or preparing to merge a PR. Use before every PR creation or update to refresh TODO.md with the full, prioritized next-round plan, exact verification evidence, remaining work, and blockers; use it again before merge.
---

# PR handoff and next-round TODO

The owner requires `TODO.md` to be updated **before every PR is opened or updated**, so the next session receives the complete plan rather than a stale summary. In this repository that means the file is prepared before pushing changes intended for an open PR or editing its title/body. Follow `AGENTS.md`'s fixed Arena branch rule and keep this skill paired with PUA's evidence-first reporting.

## Before opening or updating a PR

1. **Confirm scope and branch.** Read the user's current request, `AGENTS.md`, current PR state, branch name, `git status`, and the full diff against the PR head. Do not silently include ignored screenshots, reference photographs, local skills, or other untracked artifacts.
2. **Review the current handoff.** Read `TODO.md` for what is open, and `TODO-archive.md` for how a
   related round went before. The archive is history, not truth: re-measure a number you are about to
   rely on, and check whether a later round reversed the conclusion.
3. **Keep the round log out of `TODO.md`** (owner ruling, 2026-10-29: 「那些紀錄都刪掉，我怕影響你判斷」).
   The narrative of this round — what was tried, what it measured, what was refuted, which instrument
   lied — is appended to `TODO-archive.md`. `TODO.md` receives only the deltas an actor needs: status,
   a new or changed rule, a new gate on the list, a new constant, and the reordered open work. If a
   sentence in the working file would only matter as "why we did it this way", it belongs in the archive.
4. **Append the round log to `TODO-archive.md`.** Record:
   - the request/scope and consequential decisions;
   - source/research findings that will otherwise be lost, with URLs, dates/commits, license status, and uncertainty;
   - what changed and what is explicitly out of scope;
   - exact commands, measured counts/results, generated artifacts, and what was visually inspected;
   - known limitations, approximations, failed attempts that changed the diagnosis, and unverified claims;
   - which items it opened, closed or reversed in `TODO.md` (the working file holds the plan itself,
     with each task's prerequisite and observable acceptance evidence);
   - decisions or assets that genuinely require owner input, separately from work the agent can do.
5. **Audit the next-round list against the repository.** Re-read all active “not done”, “blocked”, “pending”, or “limitation” entries affected by this work. Mark completed or superseded items accurately, carry forward each still-open item or link to its precise section, and distinguish unrelated owner-input backlog from the next task. Do not invent work to make the list look full, and do not omit known work to claim the round is complete.
6. **Review and validate both files before any PR operation.** Ensure the top section matches the current diff and latest evidence, commands/results are not hypothetical, and each next task has a testable acceptance condition. Only after this check, commit and push the branch and create/update the PR.

## Before merge

- Re-read the current user request, the latest `TODO.md`, PR diff/body, target base, branch, and CI/check state.
- Confirm every required gate has fresh output; inspect actual rendered images for scene work. A successful build, clean diff, or merged PR is not visual sign-off.
- Update the PR body to match the final diff and exact verification results; preserve caveats and scope boundaries.
- Merge only the explicit PR number the owner authorized, using the repository's required `gh pr merge <number> --merge` form. Report the resulting merge state and commit only after confirming it from GitHub.
- If a check or required visual review is incomplete, do not imply it passed. Record the blocker and its next experiment in `TODO.md`, and do not merge until the task's acceptance conditions are satisfied.

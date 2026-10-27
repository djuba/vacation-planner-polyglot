---
name: start-wu
description: Run the branch → plan → approve → orchestrate → verify → review → commit → pull request workflow for one work unit from docs/work-breakdown.md. Invoke as /start-wu WU-xx.
argument-hint: WU-xx
disable-model-invocation: true
---

# Start work unit $ARGUMENTS

Follow these phases in order. **Phases 1 and 4 end with a hard stop:** do not continue until the user explicitly approves.

## Phase 0 — Preconditions
- Read the $ARGUMENTS entry in `docs/work-breakdown.md`.
- Confirm `git status` is clean. If it isn't, stop and show the user what's there.
- Update `main`: `git switch main && git pull --ff-only`. A unit is `done` only once its pull request is merged, so dependency status must be read from an up-to-date `main`.
- Confirm every unit in its Depends-on is `done` on `main`. If not, stop and say which are not.
- Create the unit's branch from `main`: `git switch -c wu/$ARGUMENTS-<slug>`, where `<slug>` is the unit's title in kebab-case (e.g. `wu/WU-02-quality-gates`). All of the unit's work happens on this branch; never commit to `main` directly.
- Set the unit's status to `in-progress`.

## Phase 1 — Plan (Opus, main agent)
Write `docs/plans/$ARGUMENTS.md` containing:
1. **Goal & scope**, restated from the work breakdown, including what's out of scope.
2. **Approach**, with key design decisions and the alternatives rejected. Link the `CLAUDE.md` sections each decision follows.
3. **File-by-file changes**: create/modify/delete, with a purpose for each.
4. **Acceptance criteria → tests**: each AC ID mapped to its test file and layer (CLAUDE.md §6.2–6.3).
5. **Task list**: numbered tasks (`T1`, `T2`, …). Each task has:
   - Owner: **Opus** or **Sonnet**, with a one-line reason
   - The exact files the task touches
   - What "done" means for the task, and the command that proves it
   - Dependencies on other tasks
   - Which tasks can run in parallel (only when they touch different files)
6. **Risks & open questions** for the user.
7. **Expected commit series**, as Conventional Commit messages.

**Delegation rules for the task list:**
- **Sonnet** (`wu-implementer`): self-contained tasks fully specified by the plan, touching a known set of files, mostly mechanical (scaffolding, config, tests from listed ACs, components to spec).
- **Opus** (keep it): contract and schema design, anything touching `CLAUDE.md`, spikes, debugging failures that cross layers, and integrating task outputs.
- **Small tasks stay with Opus.** A subagent starts with no context and must read `CLAUDE.md` and the plan first, so delegating a few-minute task costs more tokens than doing it directly.

Then present a short summary of the plan in chat and **STOP. Wait for the user's approval or changes.** Revise the plan file if asked.

## Phase 2 — Orchestrate
- Do Opus tasks yourself.
- For each Sonnet task, call the Agent tool with `subagent_type: "wu-implementer"`. The prompt gives the plan path and task ID, plus anything learned since the plan was written; do not paste the plan in. Launch independent tasks in parallel in one message.
- Review every subagent result: read the changed files, not just the report. Fix small issues yourself; re-delegate with specific feedback for larger ones.
- If reality diverges from the plan materially (new files, a changed approach, new risks), pause and tell the user before continuing.

## Phase 3 — Verify
- Run `pnpm verify` (or the subset that exists at this stage of the build) yourself.
- Check the unit's Definition of done item by item.
- Fix or re-delegate failures. Never weaken a test, threshold or lint rule to get to green.

## Phase 4 — Review (hard stop)
Leave all changes **uncommitted** so the user can review them in VS Code's Source Control view. Present:
- **Summary:** what was built, with each Definition of done item and its status.
- **Verification:** the commands run, with results. Report failures honestly.
- **Changes:** a `git status --short` style file list grouped by area, with a one-line purpose per file. Flag generated and lock files (`pnpm-lock.yaml`, `generated/`, cassettes, pacts) separately.
- **Deviations from the plan.**
- **Proposed commits:** the Conventional Commit messages and which files go in each.

Do **not** paste the full diff unless the user asks for it.

**STOP. Do not commit until the user explicitly approves.** Apply any requested changes, re-verify, and re-present.

## Phase 5 — Commit, push & open the pull request (only after approval)
- Create the approved commits in order on the unit's branch, each ending with the session's attribution trailer.
- Push the branch (`git push -u origin HEAD`) and open the pull request with `gh pr create --base main`:
  - **Title:** `$ARGUMENTS: <unit title>`.
  - **Body:** the Phase 4 summary (Definition of done with statuses, verification results, deviations), a link to `docs/plans/$ARGUMENTS.md`, and the session's PR attribution line.
- Update `docs/work-breakdown.md`: status `done`, **Commits:** the PR link (commit hashes can change if the branch is rebased; the PR link can't), and anything learned in Notes. Commit that as a final `docs(repo): close $ARGUMENTS` commit and push it. This commit is part of the approved series; the status becomes true on `main` when the PR merges.
- Report the PR URL and the branch's `git log --oneline main..HEAD`.

## Phase 6 — Merge (the user merges)
History on `main` follows GitLab's **merge commit with semi-linear history** (CLAUDE.md §10). Every PR lands as a merge commit, and only when its branch already contains the tip of `main`. GitHub enforces it: only merge commits are allowed, and branch protection requires the `verify` check to pass on a branch that is up to date with `main`.
- Before telling the user the PR is ready to merge, confirm the `verify` check passed: `gh pr checks --watch`. If it failed, fix it on the branch; never ask the user to bypass protection.
- **The user merges the PR** with "Create a merge commit". Never merge it yourself unless asked.
- If `main` has moved since the branch was created, rebase the branch instead of merging `main` into it: `git fetch origin && git rebase origin/main`, re-run `pnpm verify`, then `git push --force-with-lease`. Ask the user before force-pushing. Never use GitHub's "Update branch" merge, which breaks the linear segment.
- After the merge: `git switch main && git pull --ff-only && git branch -d wu/$ARGUMENTS-<slug>`. GitHub deletes the remote branch automatically.

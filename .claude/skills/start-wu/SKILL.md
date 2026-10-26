---
name: start-wu
description: Run the plan → approve → orchestrate → verify → review → commit workflow for one work unit from docs/work-breakdown.md. Invoke as /start-wu WU-xx.
argument-hint: WU-xx
disable-model-invocation: true
---

# Start work unit $ARGUMENTS

Follow these phases in order. **Phases 1 and 4 end with a hard stop:** do not continue until the user explicitly approves.

## Phase 0 — Preconditions
- Read the $ARGUMENTS entry in `docs/work-breakdown.md`.
- Confirm every unit in its Depends-on is `done`. If not, stop and say which are not.
- Confirm `git status` is clean. If it isn't, stop and show the user what's there.
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

## Phase 5 — Commit & close (only after approval)
- Create the approved commits in order, each ending with the session's attribution trailer.
- Then update `docs/work-breakdown.md`: status `done`, the hashes of the commits just made, and anything learned in Notes. Commit that as a final `docs(repo): close $ARGUMENTS` commit; this commit is part of the approved series.
- Report the final `git log --oneline` for the unit.

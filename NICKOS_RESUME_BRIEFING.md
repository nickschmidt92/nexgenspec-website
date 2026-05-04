# Resuming NickOS Improvements (combined from sessions 25d19014 + 03e6f391, 2026-04-27)

## Original objectives
- **Session A (Audit & Reorganization):** Full spring-cleaning audit of NickOS Firebase state, GitHub repos (`nickos`, `nickos-backups`, `NexGenSpec_FINAL`), and local filesystem. Five-phase plan: INVENTORY → PROBLEMS REPORT → REORGANIZE → VERIFY → BACKUP. Hard rules: no `/setState`, no local-file deletion without approval, no NickOS↔NexGenSpec data mixing, stop after Phase 2 for approval.
- **Session B (Workspace Reorg + Data Cleanup):** Two-phase. Phase 1 — restructure `/Users/nicholasschmidt/Documents/Claude/Projects/NickOS/` into folders mirroring NickOS project IDs (P-0001…P-0023, proj_northbound_seo), move ~12 artifact files to per-project `marketing/` subfolders, split the multi-brand ContentLibrary file, update `CLAUDE.md` with a Folder Structure section. Phase 2 — six NickOS schema cleanups (Northbound folder rename, folder/project field normalization, name→title on projects, project ID format, decision schema unification, missing project folders), each with explicit per-category approval.

## What's already done

### From Session B (mostly executed)
- `/Users/nicholasschmidt/Documents/Claude/Projects/NickOS/` rebuilt: 24 folders mirroring NickOS project tree, 12 files moved, ContentLibrary split into 3 brand-specific files (DIA / NexGenSpec / Northbound), empty `social_media/` removed, `CLAUDE.md` updated with new `## Folder Structure` section.
- NickOS data writes via `update_items`:
  - **Cleanup 1:** 3 tasks (T-01154, T-01158, T-01161) folder normalized `Northbound` → `Northbound Growth`.
  - **Cleanup 2:** 34 tasks (T-01164–T-01197) backfilled with `folder` field (mapped from `project`/`project_id`); old fields kept for compat.
  - **Cleanup 3:** P-0022 and P-0023 now have a `title` field (alongside legacy `name`).
  - **Cleanup 5:** D-0001 → D-0027 backfilled with new `rationale` + `decision` fields (lightest-touch, old fields preserved). 27 records updated.
  - **Cleanup 6:** P-0020, P-0022, P-0023, proj_northbound_seo all have a `folder` field now.
- A PLANNED NickOS task was logged for the items the API couldn't fix, with `deps: [T-01167]`.

### From Session A (analysis only — no destructive writes happened yet)
- Full inventory pulled: 799 tasks, 24 projects, 21 blockers, 28 docs, 34 decisions, 0 reviews. INBOX 708 / NEXT 74 / DROPPED 13 / PLANNED 2 / CANCELLED 1 / DONE 1.
- Phase 2 problems report delivered (30 numbered items: critical / structural / stale / missing / duplicates / local FS / GitHub).
- Nick's answers received in-thread: **Q1** use IN_PROGRESS as canonical; **Q2** leave 708 INBOX alone (separate organize pass); **Q3** merge PR #7 (digest email Yahoo→Gmail) AND PR #6 (Dependabot fast-xml-parser); **Q4** address branches before deciding; **Q5** decide nested-repo strategy after info; **Q6** old MacBook desktop dump (25 GB / 1,194 files) — defer as separate task.
- Nick's "Go" with modifications: list the 76 transcript bullets before dropping; **do NOT** reschedule the 9 overdue NEXT — reset them to INBOX with note "Reset from overdue NEXT — needs triage"; list folder backfills before applying; merge PR #7 + Firebase functions redeploy after; merge PR #6; rest of Phase 3 plan as written.
- The 76 transcript-bullet titles were listed and the 35 folder-backfill table was presented (with two flags: T-01175/T-01176 Brand Sprint multi-business home; T-01186–T-01197 Home Assistant tasks → recommend creating new "Home Automation" folder).

## What's still open

### Session A — Phase 3 was paused awaiting Nick's confirmation on the listed items, then the session ended without executing
- **NOT YET EXECUTED in NickOS**:
  - Drop/cancel the 3 null-ID task duplicates (note: Session B confirmed these can't be removed via `update_items` API — needs manual delete in app, blocked on T-01167 fix).
  - Drop the 1 malformed-ID task `task-mailbox-sync-2026-04-22`.
  - Bulk DROP the 76 transcript-bullet INBOX items (list awaiting Nick's keep/drop selection).
  - Merge B-0017 into B-0003 (drone insurance dup); mark B-0017 DROPPED with note.
  - Mark B-0021 (RESOLVED status, still active) as ARCHIVED/CLOSED.
  - Drop T-01154 dup (note: T-01154 was *touched* in Session B Cleanup 1 — verify state before action; the dup of T-01153 may now be stale info).
  - Drop T-00357 (dup of T-00356).
  - Reset the 9 overdue NEXT tasks (T-01125, T-01126, T-01131, T-01132, T-01138, T-01139, T-01143, T-01146, T-01150) to INBOX with note "Reset from overdue NEXT — needs triage." Per Nick's modification — NOT a +7 reschedule.
  - Backfill folders on the 35 missing-folder tasks per the proposed table (still awaiting confirmation on T-01175/76 home + Home Automation folder creation for T-01186→T-01197).
  - Rename `proj_northbound_seo` → `P-0024` (Session B confirmed: API can't change IDs — needs manual delete+recreate in app).
  - Update DOC-0026 status flow to canonical: `INBOX → NEXT → IN_PROGRESS → DONE/COMPLETED` (terminal: DROPPED, CANCELLED, WAITING).
- **NOT YET EXECUTED on GitHub**:
  - Merge `nickos` PR #7 (digest emails Yahoo→Gmail) + run `firebase deploy --only functions` after.
  - Merge `nickos` PR #6 (Dependabot fast-xml-parser 5.6.0→5.7.1).
  - Open a PR for branch `nickos / edit/ai-phone-system-tab` (1 ahead, 1 behind main, last touched Apr 21 — adds AI Phone tracker tab to PWA).
  - Decide on `NexGenSpec_FINAL / feature/calendar-import` (2 ahead, 7 behind, real WIP — recommend rebase + finish, not delete).
- **NOT YET EXECUTED on local filesystem** (recommendations only, awaiting approval):
  - `.gitignore` strategy for nested git repos `ai-phone-system/` and `bsdub-site/` inside `/Users/nicholasschmidt/Claude #86`.
  - Decide whether the loose subdirs (`dia-site`, `northbound-seo`, `northbound-site`, `remotion`, `bsdub-logo`, `dia-research`) belong inside this parent repo or as separate repos.
  - Remove build artifacts from git tracking: `diainspections-deploy.zip`, `northbound-site.zip`.
  - Archive `~/Desktop/` orphans: `NickOS-Claude-Setup-Guide.pdf`, `Northbound_Growth_Co_OnePager_Portrait_Vertical.pdf`, `NexGenSpecindex.html`.
  - Delete 3 `~/Downloads/*.ips` NexGenSpec crash reports (Apr 19) — safe to delete.
  - Verify `~/Documents/NexGenSpec_FINAL/` clone is in sync with remote.
  - Defer `~/Desktop/Desktop - Nicholas's MacBook Air/` (25 GB / 1,194 files) — separate task.
- **Phase 4 verification (re-pull state, before/after diff) and Phase 5 (`nickos_run_backup`) never ran for Session A's batch.**

### Session B — leftover items the API couldn't handle
- 3 task records with no `id` (duplicates of T-01164/65/66) — must be deleted manually in NickOS app.
- 3 decision records with no `id` ("InspectIQ is NexGenSpec…", "Safe to retire DIA Hostinger…", "NexGenSpec site: AVIF > WebP pipeline") — assign new D-0031/D-0032/D-0033 manually.
- ID renames (delete+recreate in app): `proj_northbound_seo` → `P-0024`; `DEC-0028/0029/0030` → `D-0028/0029/0030`.
- Root cause: T-01167 ("Fix NickOS Cloud Function: appendItems not auto-assigning T-IDs") — fix this first, then redo the manual cleanups so new appendItems work correctly.

### Cross-session coordination needed
- Both sessions touched overlapping tasks (T-01154, T-01164–T-01197, the proj_northbound_seo project, the missing-folder set). Re-pull `nickos_get_state` first to see the current post-Session-B state before making any further writes — the duplicate-drop and folder-backfill plans from Session A may be partially stale.

## Pick up here

1. Call `mcp__nickos__nickos_get_state` and confirm current post-Session-B state. Diff against Session A's Phase 2 problem list to identify what's still actionable (especially: are T-01154 + null-ID dups still around? Did Cleanup 2 already cover the 35 folder backfills?).
2. Then resume Session A's modified Phase 3 in this order, asking confirmation before each destructive batch:
   a. Print the 76 transcript-bullet INBOX titles (T-01036–T-01114 range) and ask Nick to confirm which to nuke.
   b. Print the 35-task folder-backfill plan as a final table (re-evaluated against current state) and ask for confirmation, including the two flagged decisions: where T-01175/T-01176 Brand Sprint should live, and whether to create a new "Home Automation" folder for T-01186–T-01197.
   c. Reset the 9 overdue NEXT (T-01125, T-01126, T-01131, T-01132, T-01138, T-01139, T-01143, T-01146, T-01150) to status INBOX with note "Reset from overdue NEXT — needs triage." (NOT +7 reschedule).
   d. Drop T-00357 (dup of T-00356) and the malformed-ID `task-mailbox-sync-2026-04-22`.
   e. Merge B-0017 into B-0003; mark B-0021 archived.
   f. Update DOC-0026 to canonical status flow: `INBOX → NEXT → IN_PROGRESS → DONE/COMPLETED` (terminal: DROPPED, CANCELLED, WAITING).
3. Hand the API-unfixable list (3 no-ID tasks, 3 no-ID decisions, `proj_northbound_seo`→P-0024 rename, DEC-→D- renames) back to Nick — confirm the existing PLANNED follow-up task with `deps:[T-01167]` is sufficient or log a new one. Do NOT attempt these via API.
4. GitHub batch: merge PR #7 (`nickos`) → run `firebase deploy --only functions` → merge PR #6 (`nickos`) → open PR for `edit/ai-phone-system-tab` → ask Nick about `feature/calendar-import` on `NexGenSpec_FINAL`.
5. Working dir at `/Users/nicholasschmidt/Claude #86`: present the `.gitignore` recommendation for the nested repos + zip artifacts and ask Nick which loose subdirs (`dia-site`, `northbound-seo`, `northbound-site`, `remotion`, `bsdub-logo`, `dia-research`) should be in this repo vs. separate.
6. Run Phase 4 verification: re-pull state, before/after diff, confirm zero duplicate IDs / orphan refs / missing required fields.
7. Run Phase 5: `mcp__nickos__nickos_run_backup`. Confirm success.

Hard rules carried over: NEVER `/setState`; NEVER delete local files without approval; NEVER mix NickOS and NexGenSpec data; ask before each destructive batch; if a write category overlaps something Session B already did, skip it (don't double-write).

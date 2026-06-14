---
name: ledgerly-architecture-docs
description: Maintain ADRs and related architecture documentation in Ledgerly. Use when creating, updating, superseding, archiving, or linking architecture decisions, plan docs, RFC-like notes, and decision logs.
---

# Ledgerly Architecture Docs

Use this skill to keep architecture knowledge consistent across ADRs, task plans,
and related documentation. Prefer small, precise edits and stable references.

## Scope

Use this skill when the user asks to:

- create or update ADRs;
- add architectural decision rationale to task docs;
- link Jira/PR to architecture docs;
- archive completed plan documents;
- replace obsolete decisions and mark superseded status.

Do not use this skill for runtime bug fixing, feature coding, or non-document
changes unless explicitly requested.

## Source of Truth

- ADR index and records: `docs/architecture/adr/`
- Active implementation plans: `docs/plans/`
- Archived plans and analysis: `docs/archive/`
- Issue tracker references: Jira links in plan/ADR metadata
- Code truth for validation: current codebase and tests

When documentation conflicts with code, verify code first and then update docs.

## File Conventions

### ADR location and naming

- Directory: `docs/architecture/adr/`
- Index file: `docs/architecture/adr/README.md`
- ADR filename: `NNNN-short-kebab-case-title.md`
- Numbering: increment monotonically; never renumber old ADRs.

### ADR metadata

Every ADR should include:

- `Status: Proposed|Accepted|Superseded|Deprecated`
- `Date: YYYY-MM-DD`
- `Jira: <link-or-N/A>`
- `PR: <link-or-TBD>`

### Minimum ADR sections

1. `Context`
2. `Decision`
3. `Alternatives Considered`
4. `Consequences`
5. `Related`

Keep each section concise and decision-focused.

## Editing Rules

1. One decision per ADR.
2. Avoid repeating implementation-level details better suited for plan docs.
3. Preserve historical facts; do not rewrite accepted history to match new intent.
4. If direction changed, create new ADR and mark old one as `Superseded`.
5. Keep links stable; when moving plan docs to archive, update ADR links.
6. Prefer explicit links to Jira issue and PR once available.

## Plan Doc Workflow

For task documents in `docs/plans/`:

1. Keep checkboxes as the execution tracker during implementation.
2. On completion, ensure status reflects done state.
3. If project convention is to archive completed plans, move to
   `docs/archive/plans/` preserving git history.
4. After move, update all references from ADR and other docs.

## Lifecycle Playbooks

### Create ADR for a completed architectural decision

1. Find latest ADR number from `docs/architecture/adr/`.
2. Create `NNNN-*.md` with required metadata and sections.
3. Add concise rationale and rejected alternatives.
4. Update ADR index in `docs/architecture/adr/README.md`.
5. Add Jira immediately; fill PR as `TBD` if not created.
6. After PR creation, replace `PR: TBD` with actual link.

### Supersede an ADR

1. Create a new ADR with the next number and updated decision.
2. In old ADR, set status to `Superseded`.
3. In old ADR `Related`, link the new ADR.
4. In new ADR `Related`, link the superseded ADR.
5. Update ADR index statuses if listed.

### Finalize completed task docs

1. Verify all checklist items are complete.
2. Add/verify Jira and PR references.
3. Move completed plan to archive if team follows archive policy.
4. Update links in ADR and any docs that referenced old path.

## Quality Checklist

Before finalizing documentation changes, confirm:

- metadata fields exist and are accurate;
- status values are valid;
- links are not stale after moves;
- ADR index includes new ADR;
- no contradictory statements versus code and tests;
- language is concise and future-readable.

## Templates

### ADR template

```md
# ADR NNNN: Title

- Status: Proposed|Accepted|Superseded|Deprecated
- Date: YYYY-MM-DD
- Jira: <link-or-N/A>
- PR: <link-or-TBD>

## Context

## Decision

## Alternatives Considered

1. Option A

- Pros
- Cons

2. Option B

- Pros
- Cons

## Consequences

## Related
```

### Plan completion note snippet

```md
Статус документа: выполнено.

- [x] Связать этот документ с Jira-задачей и итоговым pull request.
      Jira: <link>
      PR: <link>
```

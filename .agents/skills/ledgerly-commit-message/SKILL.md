---
name: ledgerly-commit-message
description: Create and validate Ledgerly commit messages. Use when committing Ledgerly changes, drafting commit messages, checking commit message format, or extracting the Jira ticket key from the current branch.
---

# Ledgerly Commit Message

Use this skill whenever the user asks to commit changes, draft a commit message,
or validate a commit message in the Ledgerly repository.

## Required Format

Commit messages must follow:

```text
LED-XXXXX type(scope): subject
```

Where:

- `LED-XXXXX` is the Jira ticket key extracted from the current branch name.
- `type` is one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`.
- `scope` is optional and must be concise kebab-case or a short module name,
  such as `fullscreen`, `mobile`, or `platform-core`.
- `subject` must be imperative mood, lowercase, and must not end with a period.

Valid examples:

```text
LED-12345 fix(platform-core): handle empty ledger state
LED-12345 test: cover transaction context loading
```

Invalid examples:

```text
fix: handle empty ledger state
LED-12345 fixed(platform-core): handled empty ledger state.
LED-12345 feature: Add platform core loading
```

## Ticket Extraction

Before creating a commit, get the current branch:

```sh
git branch --show-current
```

Extract the first `LED-<digits>` key from a branch matching:

```text
LED-XXXXX-description
```

Use a practical regex:

```text
\bLED-[0-9]+\b
```

If the branch does not contain a `LED-<digits>` key, stop and ask the user for
the ticket key before committing.

## Drafting Rules

1. Choose the narrowest accurate `type`.
2. Add a scope only when it clarifies the changed area.
3. Keep the subject short, specific, lowercase, imperative, and without a final
   period.
4. Prefer concrete verbs: `add`, `fix`, `move`, `rename`, `remove`, `update`,
   `cover`, `document`, `refactor`.
5. Do not invent a Jira ticket key. Use the branch key or ask the user.

## Commit Workflow

When the user asks to commit:

1. Inspect `git status --short`.
2. Confirm the staged or intended files match the requested work.
3. Extract the Jira ticket key from the current branch.
4. Draft a valid commit message from the actual diff.
5. Run `git commit -m "<message>"`.

If unrelated user changes are present, do not stage or modify them unless the
user explicitly asks.

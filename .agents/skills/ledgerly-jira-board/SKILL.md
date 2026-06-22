---
name: ledgerly-jira-board
description: Read a project's Jira board through Atlassian MCP and JQL using local connection configuration. Use when asked for the next Ledgerly task, current work, backlog order, task status, priority, assignee, epic contents, or another Jira board operation.
---

# Ledgerly Jira Board

Use Jira as the only source of truth for task status, priority, assignee, and
board order. Do not infer these values from Git branches, commits, pull
requests, or repository files.

## Issue Language

When creating or updating Ledgerly Jira issues, write the summary in English
and the description in Russian. Keep identifiers, API field names, error codes,
and code snippets in their original technical form.

## Connection

Read connection values from `config.local.yaml` in this skill directory. This
file is intentionally ignored by Git. Use `config.example.yaml` only to learn
the expected schema.

Required values:

- `site_url`
- `cloud_id`
- `project_name`
- `project_key`
- `board_url`

Never print `cloud_id` unless the user explicitly asks for connection details.
Never add credentials or access tokens to either configuration file.

If Atlassian tools are not loaded, discover the Jira JQL search tool first.

## Access Workflow

1. Optionally verify project access with `getVisibleJiraProjects`.
2. Read issues with `searchJiraIssuesUsingJql`.
3. Request at least `summary`, `status`, `priority`, `issuetype`, `parent`,
   `assignee`, and `customfield_10019` (`Rank`).
4. Use `ORDER BY Rank ASC` when board order matters.
5. Treat a `403` from the general Rovo `search` tool as a Rovo integration
   failure, not as proof that Jira is unavailable. Retry through direct JQL.

## Queries

Find work currently in progress:

```jql
project = <PROJECT_KEY> AND statusCategory = "In Progress" ORDER BY Rank ASC
```

Find all unfinished work:

```jql
project = <PROJECT_KEY> AND statusCategory != Done ORDER BY Rank ASC
```

Find unfinished children of an epic:

```jql
project = <PROJECT_KEY> AND parent = <EPIC_KEY> AND statusCategory != Done ORDER BY Rank ASC
```

Find a specific issue:

```jql
project = <PROJECT_KEY> AND key = <ISSUE_KEY>
```

## Determine the Next Task

1. Find the active epic with the in-progress query.
2. Query its unfinished children by `parent`.
3. Select the first child returned by `Rank ASC`.
4. Do not return the epic itself as the next implementation task.
5. Build the Jira link as `<site_url>/browse/<ISSUE_KEY>`.
6. Report the issue key, summary, status, priority, assignee, and Jira link.

If no epic is active, report that explicitly and use the first unfinished
non-epic issue by board rank only when the user asks for the board-wide next
task.

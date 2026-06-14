# Architecture Decision Records (ADR)

Этот каталог хранит архитектурные решения проекта в формате ADR.

## Как писать ADR

- Один файл = одно решение.
- Именование: `NNNN-short-kebab-case-title.md`.
- Статусы: `Proposed`, `Accepted`, `Superseded`, `Deprecated`.
- ADR должен ссылаться на Jira и PR, если они есть.

## Рекомендуемый шаблон

```md
# ADR NNNN: Заголовок

- Status: Proposed|Accepted|Superseded|Deprecated
- Date: YYYY-MM-DD
- Jira: <link-or-N/A>
- PR: <link-or-TBD>

## Context

## Decision

## Alternatives Considered

## Consequences

## Related
```

## Индекс

- [ADR 0001: Transaction repository boundaries](./0001-transaction-repository-boundaries.md)
- [ADR 0002: Operation application boundary](./0002-operation-application-boundary.md)

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
- [ADR 0003: No zero-net account effect invariant](./0003-no-zero-net-account-effect-invariant.md)
- [ADR 0004: No minimum distinct accounts invariant](./0004-no-minimum-distinct-accounts-invariant.md)
- [ADR 0005: No non-zero operation invariant](./0005-no-non-zero-operation-invariant.md)
- [ADR 0006: Asset registry before currency validation](./0006-asset-registry-before-currency-validation.md)
- [ADR 0007: No operation amount sign invariant](./0007-no-operation-amount-sign-invariant.md)
- [ADR 0008: Structured API error contract](./0008-structured-api-error-contract.md)
- [ADR 0009: Repository error-code migration](./0009-repository-error-code-migration.md)

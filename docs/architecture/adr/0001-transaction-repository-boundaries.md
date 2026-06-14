# ADR 0001: Transaction repository boundaries

- Status: Accepted
- Date: 2026-06-14
- Jira: https://gorushkin.atlassian.net/browse/LED-37
- PR: https://github.com/gorushkin/ledgerly/pull/196

## Context

В backend есть два репозитория транзакций:

- `TransactionRepository` для command/write-side;
- `TransactionQueryRepository` для query/read-side.

Разделение уже применялось в use cases, но не было полностью закреплено контрактами.
Это допускало утечки persistence-деталей в application слой:

- импорт db schema-типов в transaction read flow;
- раскрытие внутренних write-side деталей через публичный интерфейс.

Такая связность делала архитектурную границу соглашением, которое легко нарушить
при изменениях.

## Decision

Принято разделение ответственности transaction repositories через явные
application contracts:

1. `TransactionRepositoryInterface` остается write-side контрактом агрегата и не
   раскрывает внутренние collaborators.
2. `TransactionQueryRepositoryInterface` возвращает application-level
   `TransactionReadModel`, а не db schema/row типы и не доменный агрегат.
3. Mapping `DB rows -> TransactionReadModel` выполняется в infrastructure query
   repository.
4. Tombstone policy для read-side применяется в query repository до mapping.
5. Преобразование `TransactionReadModel -> TransactionResponseDTO` выполняется
   отдельным mapper (`TransactionReadModelResponseMapper`) на application уровне.

## Alternatives Considered

1. Возвращать из query repository сразу `TransactionResponseDTO`.

- Плюс: меньше одного mapper-слоя.
- Минус: repository contract становится зависим от внешнего API формата.

2. Продолжать использовать db schema-типы в application read flow.

- Плюс: меньше промежуточных типов.
- Минус: нарушение границы слоев и рост связанности с persistence.

3. Открыть `OperationRepository` через `TransactionRepositoryInterface`.

- Плюс: прямая точка записи операций.
- Минус: риск обхода границы агрегата `Transaction`.

## Consequences

Положительные:

- Граница read/write закреплена контрактами, а не соглашением.
- Application transaction read flow не зависит от `src/db/schema`.
- Публичный write-side контракт стал уже и безопаснее для эволюции агрегата.

Нейтральные/стоимость:

- Появляется отдельная read-model и mapper между read-model и response DTO.
- Требуется поддерживать тесты shape-контракта для query read model.

## Related

- План задачи: `docs/archive/plans/LED-37-transaction-repository-boundaries.md`
- Документация домена: `docs/DOMAIN.md`

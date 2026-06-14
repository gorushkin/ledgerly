# ADR 0002: Operation application boundary

- Status: Accepted
- Date: 2026-06-14
- Jira: https://gorushkin.atlassian.net/browse/LED-39
- PR: TBD

## Context

`Operation` представляет отдельную проводку, но ее бизнес-смысл и допустимость
определяются только в составе `Transaction`. Баланс, набор активных операций,
soft delete и optimistic concurrency проверяются на уровне агрегата
`Transaction`.

Выделение самостоятельных operation use cases создало бы второй write path,
способный обойти инварианты и версионирование агрегата.

## Decision

1. `Transaction` остается aggregate root и единственной application write
   boundary для своих операций.
2. Создание, изменение и удаление операций выполняются только через transaction
   use cases.
3. Отдельные публичные `CreateOperation`, `UpdateOperation` и `DeleteOperation`
   use cases и write API не вводятся.
4. Внутренние operation mapper, domain entity и persistence collaborator могут
   существовать как детали реализации transaction flow, но не должны
   предоставлять независимый application write path.
5. Решение пересматривается, только если у операции появится самостоятельный
   жизненный цикл: отдельная авторизация, версия, API, фоновая обработка или
   изменение без загрузки агрегата `Transaction`.

## Alternatives Considered

1. Выделить отдельные operation use cases

- Плюс: более мелкие application-команды и прямой CRUD для операций.
- Минус: дублирование transaction orchestration и риск обхода проверки баланса,
  ownership и `Transaction.version`.

2. Выделить `Operation` в самостоятельный aggregate

- Плюс: независимая загрузка, запись и версионирование операций.
- Минус: усложнение атомарного соблюдения transaction-level инвариантов без
  текущей бизнес-потребности.

3. Оставить решение неявным

- Плюс: отсутствие дополнительной документации.
- Минус: infrastructure `OperationRepository` можно ошибочно принять за
  основание для самостоятельного application API.

## Consequences

Положительные:

- Все изменения операций проходят через transaction-level инварианты.
- Optimistic concurrency остается на уровне одного aggregate root.
- Application API не отражает внутреннее разбиение persistence.

Нейтральные/стоимость:

- Для изменения одной операции требуется загрузить и сохранить агрегат
  `Transaction`.
- При появлении независимого жизненного цикла операций потребуется новый ADR и
  изменение модели конкурентности.

## Related

- [ADR 0001: Transaction repository boundaries](./0001-transaction-repository-boundaries.md)
- [Документация домена](../../DOMAIN.md)

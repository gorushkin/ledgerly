# ADR 0011: Domain entity API conventions

- Status: Accepted
- Date: 2026-06-25
- Jira: https://gorushkin.atlassian.net/browse/LED-57
- PR: TBD

## Context

В domain слое появились разные способы выразить одни и те же операции:

- создание новой entity через `create`;
- восстановление из persistence state через `restore` или `fromPersistence`;
- получение plain state через `toSnapshot`, `toPersistence` или DTO-методы;
- построение API response внутри domain entity через `toResponseDTO`.

`Transaction` и `Operation` уже используют более чистую модель: entity работает
с domain snapshot, а преобразование в DB rows и response DTO вынесено в mapper
слой. `User` и `Account` пока частично нарушают эту границу и знают о
`src/db/schema` или application/shared DTO.

Без общего правила новые entities и refactoring старых будут снова смешивать
domain state, persistence representation и public API shape.

## Decision

Для domain entities принимается единый публичный API:

1. `static create(...)` создает новую entity и генерирует новую identity,
   timestamps и другие behavior-компоненты.
2. `static restore(snapshot)` восстанавливает entity из plain domain snapshot.
3. `toSnapshot()` возвращает plain domain snapshot, пригодный для передачи в
   mapper или repository boundary.
4. Domain entity не должна импортировать `src/db/schema`, application DTO,
   shared request/response DTO или HTTP-specific типы.
5. Domain entity не должна содержать `toPersistence()`, `toResponseDTO()` или
   `fromPersistence(...)`.
6. Преобразования `entity -> response DTO`, `entity -> DB row` и
   `DB row -> entity snapshot/entity` выполняются в application или
   infrastructure mapper, в зависимости от направления и существующей границы
   модуля.
7. `Transaction` и `Operation` считаются текущим эталоном для entity API.
   Отклонения допустимы только если они явно описаны в документации или ADR.

Snapshot-типы должны жить рядом с entity в `domain/<module>/types.ts` и
использовать primitive/domain-safe типы. Они не должны быть alias для DB row или
API response DTO.

## Alternatives Considered

1. Оставить `fromPersistence()` и `toPersistence()` в entities.

- Плюс: меньше mapper-кода в короткой перспективе.
- Минус: domain слой начинает зависеть от persistence schema и становится
  сложнее менять DB shape независимо от бизнес-модели.

2. Разрешить `toResponseDTO()` в entities как удобный read helper.

- Плюс: меньше преобразований в use cases.
- Минус: domain entity начинает знать public API contract, а response shape
  становится связан с внутренней моделью.

3. Использовать разные conventions для разных aggregate roots.

- Плюс: можно быстрее дорабатывать существующий legacy код.
- Минус: новые изменения требуют каждый раз заново угадывать правильный слой и
  увеличивают риск несовместимых patterns.

## Consequences

Положительные:

- Domain entities остаются независимыми от DB schema, DTO и HTTP слоя.
- Новый и legacy код получают одинаковые правила для creation, restoration и
  serialization.
- Refactoring persistence и response contracts не требует менять domain entity,
  если business state не изменился.

Нейтральные/стоимость:

- Для legacy entities нужны migration tasks.
- Mapper layer становится обязательным для преобразований между слоями.
- Некоторые существующие helper-типы и tests придется переписать под snapshot
  API.

## Related

- [ADR 0001: Transaction repository boundaries](./0001-transaction-repository-boundaries.md)
- [ADR 0002: Operation application boundary](./0002-operation-application-boundary.md)
- [Документация домена](../../DOMAIN.md)
- Jira epic: https://gorushkin.atlassian.net/browse/LED-57
- Current task: https://gorushkin.atlassian.net/browse/LED-2

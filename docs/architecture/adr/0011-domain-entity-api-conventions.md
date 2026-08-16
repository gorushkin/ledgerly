# ADR 0011: Domain entity API conventions

- Status: Accepted
- Date: 2026-06-25
- Jira: https://gorushkin.atlassian.net/browse/LED-57

## Context

В domain слое появились разные способы выразить одни и те же операции:

- создание новой entity через `create`;
- восстановление из persistence state через `restore` или `fromPersistence`;
- получение plain state через `toSnapshot`, `toPersistence` или DTO-методы;
- построение API response внутри domain entity через `toResponseDTO`.

`Transaction` и `Operation` уже используют более чистую модель: entity работает
с domain snapshot, а преобразование в persistence и response формы вынесено за
пределы domain слоя. `User` и `Account` пока частично нарушают эту границу и
знают о `src/db/schema` или application/shared DTO.

Без общего правила новые entities и refactoring старых будут снова смешивать
domain state, persistence representation и public API shape.

## Decision

Для domain entities принимается единый публичный API:

1. `static create(...)` создает новую entity и генерирует новую identity,
   timestamps и другие behavior-компоненты.
2. `static restore(snapshot)` восстанавливает entity из plain domain snapshot.
3. `toSnapshot()` возвращает полный plain domain snapshot entity или aggregate,
   пригодный для передачи в mapper или repository boundary. Метод не должен
   скрыто фильтровать дочерние элементы или soft-deleted/raw state.
4. Domain entity не должна импортировать `src/db/schema`, application DTO,
   shared request/response DTO или HTTP-specific типы.
5. Domain entity не должна содержать `toPersistence()`, `toResponseDTO()` или
   `fromPersistence(...)`.
6. Преобразования `domain snapshot -> response DTO` выполняются в application
   или presentation mapper, в зависимости от endpoint boundary.
   Преобразования `domain snapshot -> DB row` и
   `DB row -> entity snapshot/entity` выполняются в infrastructure persistence
   mapper рядом с repository boundary. Entity не должна предоставлять
   persistence/DTO методы для этих преобразований.
7. `Transaction` и `Operation` считаются текущим эталоном для entity API.
   Отклонения допустимы только если они явно описаны в документации или ADR.

Entity timestamps являются частью domain state, а не persistence side effect.
Repository layer не должен генерировать entity `id`, `createdAt` или
`updatedAt`. `Entity.create(...)` создает identity и initial timestamps, а
domain behavior methods вроде `update(...)` и `markAsDeleted()` обновляют
`updatedAt`, когда меняют состояние entity. Repository сохраняет timestamps,
полученные через snapshot/mapper.

Soft-delete является domain state transition. Повторный вызов
`markAsDeleted()` для уже deleted entity должен завершаться domain error
`DELETED_ENTITY_OPERATION`, а не быть idempotent no-op и не обновлять
`updatedAt` повторно. Generic behavior `SoftDelete` централизует invariant, а
конкретная entity передает typed domain error для своего `entityType`.

Snapshot-типы должны жить рядом с entity в `domain/<module>/types.ts` и
использовать primitive/domain-safe типы. Они не должны быть alias для DB row или
API response DTO.

Если aggregate дополнительно предоставляет отфильтрованное представление, метод
должен иметь явное имя по семантике фильтра, например `toActiveSnapshot()`.
Такой метод является domain-specific projection и не входит в обязательный API
каждой entity.

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
- Repository layer перестает скрыто менять entity state при save/update/delete;
  persisted state должен приходить из explicit domain transition.

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
- Implementation tasks:
  - https://gorushkin.atlassian.net/browse/LED-2
  - https://gorushkin.atlassian.net/browse/LED-4
  - https://gorushkin.atlassian.net/browse/LED-5
  - https://gorushkin.atlassian.net/browse/LED-6

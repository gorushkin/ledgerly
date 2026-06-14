# LED-37: Граница ответственности transaction repositories

Jira: https://gorushkin.atlassian.net/browse/LED-37

Статус документа: выполнено (ожидает PR).

## Контекст

В backend существуют два репозитория транзакций:

- `TransactionRepository` обслуживает command/write-side;
- `TransactionQueryRepository` обслуживает query/read-side.

Фактическое разделение уже используется в use cases, но не полностью закреплено
контрактами. Application layer импортирует read-модель непосредственно из
database schema, а write-side интерфейс публично раскрывает
`operationsRepository`.

Из-за этого граница остается соглашением, которое легко нарушить при следующих
изменениях.

## Целевая граница

### TransactionRepository

Отвечает за persistence агрегата `Transaction`:

- создание агрегата;
- восстановление агрегата для command-сценариев;
- сохранение изменений с optimistic locking;
- soft delete агрегата;
- внутреннее сохранение входящих в агрегат операций.

Контракт возвращает и принимает доменные типы. Детали таблиц, DB rows и
вложенные infrastructure repositories не являются частью публичного
интерфейса.

### TransactionQueryRepository

Отвечает за read-модель транзакций:

- чтение одной транзакции;
- списки, фильтрацию, сортировку и pagination;
- исключение архивных данных согласно read policy;
- формирование стабильного application-level query shape.

Контракт не возвращает доменный агрегат и не раскрывает типы Drizzle/database
schema.

## План

### 1. Зафиксировать application-level read model

- [x] Определить `TransactionReadModel` и `OperationReadModel`.
- [x] Разместить типы в application layer рядом с query repository contract.
- [x] Включить только данные, необходимые текущим read use cases и API.
- [x] Не переносить в read model persistence-only поля без потребности API.

### 2. Изолировать query repository от database schema

- [x] Изменить `TransactionQueryRepositoryInterface`, чтобы он возвращал
      application-level read model.
- [x] Преобразовывать DB rows в read model внутри infrastructure query
      repository.
- [x] Убрать импорты `TransactionWithRelations` и `OperationDbRow` из
      application interfaces, use cases, mappers и их unit-тестов.
- [x] Оставить фильтрацию tombstone-записей ответственностью query repository.

### 3. Закрыть write-side контракт

- [x] Удалить `operationsRepository` из `TransactionRepositoryInterface`.
- [x] Сделать dependency на `OperationRepositoryInterface` приватной деталью
      реализации `TransactionRepository`.
- [x] Проверить, что операции сохраняются только как часть persistence
      агрегата `Transaction`.
- [x] Сохранить `getById()` в write repository: он восстанавливает агрегат для
      update/delete и не является read API.

### 4. Упростить mapping

- [x] Решить, должен ли query repository возвращать готовый
      `TransactionResponseDTO` или отдельный `TransactionReadModel`.
- [x] Предпочесть отдельный read model, если API DTO не должен определять
      repository contract.
- [x] Удалить дублирующую фильтрацию tombstone-операций из mapper после
      закрепления read policy.
- [x] Переименовать mapper так, чтобы источник и назначение преобразования были
      очевидны.

### 5. Проверить границу тестами

- [x] Обновить unit-тесты read use cases: они не должны импортировать DB schema.
- [x] Обновить тесты `TransactionQueryRepository` для нового read shape.
- [x] Проверить create/update/delete use cases с закрытым write contract.
- [x] Запустить backend typecheck, unit и repository/integration tests.

### 6. Зафиксировать правило

- [x] Добавить короткие комментарии к обоим repository interfaces.
- [x] Проверить отсутствие DB schema imports в application query contract.
- [ ] Связать этот документ с Jira-задачей и итоговым pull request.
      Jira уже добавлена, ссылка на PR будет добавлена после открытия PR для ветки.

## Критерии завершения

- `TransactionRepositoryInterface` оперирует только агрегатом и результатами
  write-side persistence.
- `TransactionQueryRepositoryInterface` возвращает application-level
  read-модель.
- Application layer не зависит от `src/db/schema` в transaction read flow.
- `OperationRepositoryInterface` не раскрывается через публичный transaction
  repository contract.
- Tombstone policy применяется в одном определенном месте.
- Все затронутые тесты проходят.

## Не входит в задачу

- изменение внешнего REST API без необходимости;
- переход на event sourcing;
- хранение полной истории изменений транзакции;
- выделение операций в отдельный aggregate;
- создание отдельных operation use cases.

## Решения и изменения плана

Этот раздел содержит только решения, влияющие на архитектуру или объем задачи.
Подробный дневник реализации вести не нужно.

| Дата | Решение | Причина |
|---|---|---|
| 2026-06-14 | Разделить command aggregate persistence и query read model явными application contracts | Текущие контракты допускают утечку DB schema и внутренних repository dependencies |
| 2026-06-14 | Определить read model независимо от REST DTO, даже при совпадающей текущей структуре | Изменения внешнего API и внутреннего query contract должны эволюционировать независимо |
| 2026-06-14 | Разместить mapping DB rows → read model внутри infrastructure | DB schema не должна пересекать границу application layer |
| 2026-06-14 | Применять tombstone policy в SQL query repository, до mapping в read model | Архивные признаки являются persistence detail и не входят в application read model |
| 2026-06-14 | Оставить `OperationRepository` внутренним collaborator `TransactionRepository` и не публиковать его через application container | Операции сохраняются в границе агрегата транзакции; отдельная публичная точка записи позволяла бы обойти эту границу |
| 2026-06-14 | Сохранять отдельные `TransactionReadModel` и `TransactionResponseDTO`; преобразовывать их через `TransactionReadModelResponseMapper` | Repository query contract и внешний REST contract должны изменяться независимо |

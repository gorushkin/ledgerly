# Database Design Analysis: Transaction-Entry Relationships

## Текущая схема БД

Анализируя существующую схему базы данных, можно увидеть следующую иерархию:

```
Transaction (1) -> Entry (N) -> Operation (N)
     ↓              ↓            ↓
   [id: UUID]   [transactionId]  [entryId]
```

### Таблицы и связи:

1. **transactions** - содержит только метаданные транзакции
2. **entries** - связана с transactions через `transactionId` FK  
3. **operations** - связана с entries через `entryId` FK

## Вопрос: Должны ли быть у транзакции прямые ссылки на entries?

### Текущий подход (нормализованная модель):

```sql
-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    description TEXT,
    posting_date TEXT,
    transaction_date TEXT,
    user_id UUID REFERENCES users(id),
    -- НЕТ прямых ссылок на entries
);

-- Entries table  
CREATE TABLE entries (
    id UUID PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id), -- FK к transaction
    description TEXT,
    user_id UUID REFERENCES users(id)
);

-- Operations table
CREATE TABLE operations (
    id UUID PRIMARY KEY,
    entry_id UUID REFERENCES entries(id), -- FK к entry
    account_id UUID REFERENCES accounts(id),
    amount INTEGER,
    description TEXT,
    user_id UUID REFERENCES users(id)
);
```

### Альтернативный подход (денормализованная модель):

```sql
-- Transactions table с прямыми ссылками
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    description TEXT,
    posting_date TEXT,
    transaction_date TEXT,
    user_id UUID REFERENCES users(id),
    entry_ids TEXT[] -- массив ID entries (PostgreSQL) или JSON (SQLite)
);
```

## Анализ подходов

### 1. Нормализованная модель (текущая) ✅

**Плюсы:**
- ✅ Соответствует принципам нормализации БД
- ✅ Избегает дублирования данных
- ✅ Упрощает операции CRUD с entries
- ✅ Обеспечивает referential integrity через FK
- ✅ Автоматический CASCADE DELETE работает корректно
- ✅ Индексы на FK обеспечивают быстрый поиск

**Минусы:**
- ❌ Требует JOIN для получения entries транзакции
- ❌ Сложнее обеспечить атомарность операций

### 2. Денормализованная модель (с прямыми ссылками) ❌

**Плюсы:**
- ✅ Быстрый доступ к entries без JOIN
- ✅ Возможность атомарного обновления

**Минусы:**
- ❌ Нарушение нормальных форм БД
- ❌ Дублирование данных (entry_id хранится в двух местах)
- ❌ Сложность поддержания консистентности
- ❌ Проблемы с concurrent access
- ❌ Усложнение операций добавления/удаления entries

## Рекомендация: Сохранить нормализованную модель

### Обоснование:

1. **Целостность данных**: FK constraints гарантируют консистентность
2. **Производительность**: Индексы на `transaction_id` обеспечивают быстрый поиск
3. **Стандартность**: Соответствует best practices реляционных БД
4. **Простота**: Легче поддерживать и расширять

### Оптимизация производительности:

```sql
-- Индексы для быстрого поиска
CREATE INDEX idx_entries_transaction_id ON entries(transaction_id);
CREATE INDEX idx_operations_entry_id ON operations(entry_id);

-- Запрос всех данных транзакции с одним JOIN
SELECT 
    t.*,
    e.id as entry_id,
    e.description as entry_description,
    o.id as operation_id,
    o.amount,
    o.description as operation_description
FROM transactions t
LEFT JOIN entries e ON t.id = e.transaction_id  
LEFT JOIN operations o ON e.id = o.entry_id
WHERE t.id = ?;
```

## Текущая реализация в Ledgerly

Анализ показывает, что текущая схема правильная:

```typescript
// entries table
export const entriesTable = sqliteTable('entries', {
  id,
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactionsTable.id, { onDelete: 'cascade' }),
  // ...
});

// operations table  
export const operationsTable = sqliteTable('operations', {
  id,
  entryId: text('entry_id')
    .notNull()
    .references(() => entriesTable.id, { onDelete: 'cascade' }),
  // ...
});
```

### Индексы уже настроены:
```typescript
(t) => [
  index('idx_entries_tx').on(t.transactionId),        // entries по transaction
  index('idx_operations_entry').on(t.entryId),        // operations по entry
  index('idx_operations_account').on(t.accountId),    // operations по account
]
```

## Выводы

**НЕТ, у транзакции НЕ должно быть прямых ссылок на entries в БД.**

### Причины:

1. **Нормализация**: Текущая модель корректно нормализована
2. **Целостность**: FK constraints обеспечивают consistency
3. **Производительность**: Индексы решают проблемы скорости
4. **Простота**: Стандартный подход легче поддерживать
5. **Масштабируемость**: Растет лучше при увеличении данных

### Domain vs Database:

- **В домене**: Transaction может содержать entries (Aggregate Root)
- **В БД**: Transaction не содержит прямых ссылок на entries (нормализация)

Это правильное разделение ответственности между доменной моделью и persistence слоем.
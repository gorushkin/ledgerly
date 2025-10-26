# DDD Analysis: Должна ли Transaction знать о своих Entries?

## Проблема

С точки зрения Domain-Driven Design возник вопрос: должна ли сущность `Transaction` содержать прямые ссылки на свои `Entry` или они должны быть отдельными агрегатами?

## Анализ подходов

### 1. Separate Aggregates (изначальный подход)

```typescript
// Transaction и Entry - отдельные агрегаты
export class Transaction {
  // только собственные данные, без entries
}

export class Entry {
  private transactionRelation: ParentChildRelation; // ссылка на Transaction
}
```

**Плюсы:**
- ✅ Лучшая масштабируемость
- ✅ Независимые жизненные циклы
- ✅ Меньшее coupling между сущностями
- ✅ Проще тестирование отдельных сущностей

**Минусы:**
- ❌ Сложнее контролировать инварианты (сбалансированность)
- ❌ Возможны нарушения консистентности данных
- ❌ Более сложная бизнес-логика валидации

### 2. Aggregate Root (реализованный подход)

```typescript
// Transaction как корень агрегата, содержащий entries
export class Transaction {
  private entries: Entry[] = [];
  
  addEntry(entry: Entry): void {
    // бизнес-логика валидации
    this.entries.push(entry);
  }
  
  isBalanced(): boolean {
    // проверка сбалансированности всех entries
  }
}
```

**Плюсы:**
- ✅ Транзакция может контролировать инварианты (сбалансированность)
- ✅ Атомарность операций с транзакцией и её entries
- ✅ Более простая консистентность данных
- ✅ Естественная модель для финансовой системы

**Минусы:**
- ❌ Потенциально хуже масштабируемость при большом количестве entries
- ❌ Более тесная связанность

## Принятое решение

**Выбран подход "Aggregate Root"** - Transaction содержит entries.

### Обоснование:

1. **Критичность инвариантов**: В финансовых системах сбалансированность транзакций критична. Transaction должна гарантировать, что сумма всех entries = 0.

2. **Бизнес-логика**: В двойной бухгалтерии Transaction и её entries представляют одно атомарное бизнес-событие.

3. **Консистентность**: Операции с entries должны выполняться в контексте транзакции для поддержания целостности данных.

## Реализация

### Методы управления Entries:

```typescript
export class Transaction {
  private entries: Entry[] = [];

  // Добавление entry с валидацией
  addEntry(entry: Entry): void {
    this.validateUpdateIsAllowed();
    
    if (!entry.belongsToTransaction(this.getId())) {
      throw new Error('Entry does not belong to this transaction');
    }

    this.entries.push(entry);
    this.touch();
  }

  // Удаление entry
  removeEntry(entryId: Id): void {
    this.validateUpdateIsAllowed();
    
    const entryIndex = this.entries.findIndex((entry) =>
      entry.getId().isEqualTo(entryId),
    );
    
    if (entryIndex === -1) {
      throw new Error('Entry not found in transaction');
    }

    this.entries.splice(entryIndex, 1);
    this.touch();
  }

  // Readonly доступ к entries
  getEntries(): readonly Entry[] {
    return [...this.entries];
  }

  // Проверка сбалансированности
  isBalanced(): boolean {
    // TODO: Реализовать логику проверки баланса
    return true;
  }

  validateBalance(): void {
    if (!this.isBalanced()) {
      throw new Error('Transaction is not balanced');
    }
  }
}
```

### Ключевые принципы:

1. **Инкапсуляция**: entries - приватное поле
2. **Валидация**: все изменения проходят через контролируемые методы
3. **Иммутабельность**: getEntries() возвращает readonly копию
4. **Бизнес-правила**: проверка принадлежности entry к транзакции

## Альтернативы для будущего

Если производительность станет проблемой, можно рассмотреть **гибридный подход**:

- Transaction содержит метаданные entries (количество, сумма)
- Полная загрузка entries происходит по требованию через репозиторий
- Критические операции загружают полный агрегат

## Выводы

Для финансовой системы Ledgerly подход "Transaction as Aggregate Root" является оптимальным, так как:

1. Гарантирует соблюдение бизнес-инвариантов
2. Обеспечивает атомарность операций
3. Упрощает реализацию сложной бизнес-логики
4. Соответствует природе двойной бухгалтерии

Данный подход следует принципам DDD и подходит для домена финансового учёта.
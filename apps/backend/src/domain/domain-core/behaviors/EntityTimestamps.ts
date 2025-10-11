import { Timestamp } from '../value-objects/Timestamp';

/**
 * Поведение для управления временными метками сущности
 */
export class EntityTimestamps {
  constructor(
    private readonly updatedAt: Timestamp,
    private readonly createdAt: Timestamp,
  ) {
    Object.freeze(this);
  }

  /**
   * Возвращает время последнего обновления
   */
  getUpdatedAt(): Timestamp {
    return this.updatedAt;
  }

  /**
   * Возвращает время создания
   */
  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  /**
   * Обновляет время последнего изменения
   */
  touch(now?: Timestamp): EntityTimestamps {
    const newTimestamp = now ?? Timestamp.create();
    return new EntityTimestamps(newTimestamp, this.createdAt);
  }

  /**
   * Создает новый экземпляр EntityTimestamps
   */
  static create(createdAt?: Timestamp): EntityTimestamps {
    const now = createdAt ?? Timestamp.create();
    return new EntityTimestamps(now, now);
  }

  /**
   * Восстанавливает экземпляр из базы данных
   */
  static fromPersistence(
    updatedAt: Timestamp,
    createdAt: Timestamp,
  ): EntityTimestamps {
    return new EntityTimestamps(updatedAt, createdAt);
  }
}

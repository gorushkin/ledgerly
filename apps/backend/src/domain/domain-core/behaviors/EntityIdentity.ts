import { Id } from '../value-objects/Id';

/**
 * Поведение для управления идентичностью сущности
 */
export class EntityIdentity {
  constructor(private id: Id) {}

  /**
   * Возвращает ID сущности
   */
  getId(): Id {
    return this.id;
  }

  /**
   * Устанавливает ID сущности
   */
  setId(id?: Id): void {
    this.id = id ?? Id.create();
  }

  /**
   * Создает новый экземпляр EntityIdentity
   */
  static create(id?: Id): EntityIdentity {
    return new EntityIdentity(id ?? Id.create());
  }
}

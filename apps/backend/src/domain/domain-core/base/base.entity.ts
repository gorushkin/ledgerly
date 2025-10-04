import { Id } from '../value-objects/Id';
import { IsoDatetimeString } from '../value-objects/IsoDateString';

/**
 * Базовая сущность для всех доменных объектов
 * Содержит общие поля и методы
 */
export abstract class BaseEntity {
  isTombstone = false;
  protected constructor(
    public readonly userId: Id,
    public readonly id: Id | null,
    public readonly updatedAt: IsoDatetimeString,
    public readonly createdAt: IsoDatetimeString,
  ) {
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
  }

  /**
   * Проверяет, является ли сущность новой (еще не сохраненной в БД)
   */
  isNew(): boolean {
    return this.id === null;
  }

  get now(): IsoDatetimeString {
    return IsoDatetimeString.create();
  }

  /**
   * Проверяет, принадлежит ли сущность указанному пользователю
   */
  belongsToUser(userId: Id): boolean {
    return this.userId.equals(userId);
  }

  markAsDeleted(): void {
    this.isTombstone = true;
  }

  isDeleted(): boolean {
    return this.isTombstone;
  }

  validateUpdateIsAllowed(): void {
    if (this.isTombstone) {
      throw new Error('Cannot update a deleted entity');
    }
  }
}

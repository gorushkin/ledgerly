import { Id } from '../value-objects/Id';
import { IsoDatetimeString } from '../value-objects/IsoDateString';

/**
 * Базовая сущность для всех доменных объектов
 * Содержит общие поля и методы
 */
export abstract class BaseEntity {
  public readonly updatedAt: IsoDatetimeString;
  public readonly createdAt: IsoDatetimeString;
  isTombstone = false;

  protected constructor(
    public readonly userId: Id,
    public readonly id: Id | null,
    updatedAt?: IsoDatetimeString,
    createdAt?: IsoDatetimeString,
  ) {
    const now = IsoDatetimeString.create();

    this.updatedAt = updatedAt ?? now;
    this.createdAt = createdAt ?? now;
  }

  /**
   * Проверяет, является ли сущность новой (еще не сохраненной в БД)
   */
  isNew(): boolean {
    return this.id === null;
  }

  /**
   * Проверяет, принадлежит ли сущность указанному пользователю
   */
  belongsToUser(userId: Id): boolean {
    return this.userId.equals(userId);
  }

  markAsArchived(): void {
    this.isTombstone = true;
  }

  isArchived(): boolean {
    return this.isTombstone;
  }

  validateUpdateIsAllowed(): void {
    if (this.isTombstone) {
      throw new Error('Cannot update a deleted entity');
    }
  }
}

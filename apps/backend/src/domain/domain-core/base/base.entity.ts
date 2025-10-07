import { Id } from '../value-objects/Id';
import { IsoDatetimeString } from '../value-objects/IsoDateString';

export abstract class BaseEntity {
  isTombstone = false;
  protected constructor(
    public readonly userId: Id,
    public readonly id: Id,
    public readonly updatedAt: IsoDatetimeString,
    public readonly createdAt: IsoDatetimeString,
  ) {
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
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

  getNewId() {
    return Id.create();
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

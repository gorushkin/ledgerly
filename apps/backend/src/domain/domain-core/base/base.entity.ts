import { Id } from '../value-objects/Id';
import { Timestamp } from '../value-objects/Timestamp';

export abstract class BaseEntity {
  isTombstone = false;
  protected constructor(
    protected readonly userId: Id,
    protected id: Id,
    protected updatedAt: Timestamp,
    protected readonly createdAt: Timestamp,
  ) {
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
  }

  /**
   * Проверяет, принадлежит ли сущность указанному пользователю
   */
  belongsToUser(userId: Id): boolean {
    return this.userId.isEqualTo(userId);
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

  protected touch(now?: Timestamp) {
    this.updatedAt = now ?? Timestamp.create();
  }

  setId() {
    this.id = Id.create();
  }
}

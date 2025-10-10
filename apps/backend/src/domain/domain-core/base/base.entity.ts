import { Id } from '../value-objects/Id';
import { IsoDatetimeString } from '../value-objects/IsoDateString';

export abstract class BaseEntity {
  isTombstone = false;
  protected constructor(
    protected readonly userId: Id,
    protected id: Id,
    protected updatedAt: IsoDatetimeString,
    protected readonly createdAt: IsoDatetimeString,
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
    return this.userId.isEqualTo(userId);
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

  protected touch(now?: IsoDatetimeString) {
    this.updatedAt = now ?? this.now;
  }

  setId() {
    this.id = this.getNewId();
  }
}

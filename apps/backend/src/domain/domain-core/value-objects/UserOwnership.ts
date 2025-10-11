import { Id } from './Id';

/**
 * Value Object для представления принадлежности сущности пользователю
 */
export class UserOwnership {
  constructor(private readonly userId: Id) {}

  /**
   * Проверяет, принадлежит ли сущность указанному пользователю
   */
  belongsToUser(userId: Id): boolean {
    return this.userId.isEqualTo(userId);
  }

  /**
   * Возвращает ID владельца
   */
  getOwnerId(): Id {
    return this.userId;
  }

  /**
   * Создает новый экземпляр UserOwnership
   */
  static create(userId: Id): UserOwnership {
    return new UserOwnership(userId);
  }
}

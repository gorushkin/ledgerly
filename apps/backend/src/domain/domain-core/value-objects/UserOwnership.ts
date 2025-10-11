import { Id } from './Id';

/**
 * Value Object representing the ownership of an entity by a user
 */
export class UserOwnership {
  constructor(private readonly userId: Id) {}

  /**
   * Checks if the entity belongs to the specified user
   */
  belongsToUser(userId: Id): boolean {
    return this.userId.isEqualTo(userId);
  }

  /**
   * Returns the owner's ID
   */
  getOwnerId(): Id {
    return this.userId;
  }

  /**
   * Creates a new instance of UserOwnership
   */
  static create(userId: Id): UserOwnership {
    return new UserOwnership(userId);
  }
}

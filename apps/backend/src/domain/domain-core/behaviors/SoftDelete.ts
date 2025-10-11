/**
 * Behavior for managing soft deletion of an entity
 */
export class SoftDelete {
  constructor(private readonly isTombstone = false) {
    Object.freeze(this);
  }

  /**
   * Marks the entity as deleted
   */
  markAsDeleted(): SoftDelete {
    return new SoftDelete(true);
  }

  /**
   * Checks if the entity is deleted
   */
  isDeleted(): boolean {
    return this.isTombstone;
  }

  /**
   * Checks if the entity can be updated
   */
  validateUpdateIsAllowed(): void {
    if (this.isTombstone) {
      throw new Error('Cannot update a deleted entity');
    }
  }

  /**
   * Returns the deletion status for serialization
   */
  getIsTombstone(): boolean {
    return this.isTombstone;
  }

  /**
   * Creates a new instance of SoftDelete
   */
  static create(): SoftDelete {
    return new SoftDelete(false);
  }

  /**
   * Restores an instance from the database
   */
  static fromPersistence(isTombstone: boolean): SoftDelete {
    return new SoftDelete(isTombstone);
  }
}

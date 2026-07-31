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
  markAsDeleted(error?: Error): SoftDelete {
    this.validateUpdateIsAllowed(error ?? SoftDelete.defaultUpdateError());
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
  validateUpdateIsAllowed(error?: Error): void {
    if (this.isTombstone) {
      throw error ?? SoftDelete.defaultUpdateError();
    }
  }

  /**
   * Returns the deletion status for serialization
   */
  getIsTombstone(): boolean {
    return this.isTombstone;
  }

  static defaultUpdateError(): Error {
    return new Error('Cannot update a deleted entity');
  }

  /**
   * Creates a new instance of SoftDelete
   */
  static create(): SoftDelete {
    return new SoftDelete(false);
  }

  static restore(isTombstone: boolean): SoftDelete {
    return new SoftDelete(isTombstone);
  }
}

import { Id } from './Id';

/**
 * Value Object representing a parent-child relationship between entities
 */
export class ParentChildRelation {
  constructor(
    private readonly parentId: Id,
    private readonly childId: Id,
  ) {}

  /**
   * Checks if the child belongs to the specified parent
   */
  belongsToParent(parentId: Id): boolean {
    return this.parentId.equals(parentId);
  }

  /**
   * Checks if this relation involves the specified child
   */
  isChild(childId: Id): boolean {
    return this.childId.equals(childId);
  }

  /**
   * Returns the parent's ID
   */
  getParentId(): Id {
    return this.parentId;
  }

  /**
   * Returns the child's ID
   */
  getChildId(): Id {
    return this.childId;
  }

  /**
   * Creates a new parent-child relation
   */
  static create(parentId: Id, childId: Id): ParentChildRelation {
    return new ParentChildRelation(parentId, childId);
  }

  /**
   * Checks if two relations are equal
   */
  isEqualTo(other: ParentChildRelation): boolean {
    return (
      this.parentId.equals(other.parentId) && this.childId.equals(other.childId)
    );
  }
}

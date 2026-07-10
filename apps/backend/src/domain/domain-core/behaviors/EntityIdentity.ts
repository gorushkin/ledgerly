import { Id } from '../value-objects/Id';

/**
 * Behavior for managing entity identity
 */
export class EntityIdentity {
  constructor(private readonly id: Id) {
    Object.freeze(this);
  }

  /**
   * Returns the entity ID
   */
  getId(): Id {
    return this.id;
  }

  /**
   * Creates a new EntityIdentity with a different ID
   */
  withId(id: Id): EntityIdentity {
    return new EntityIdentity(id);
  }

  /**
   * Creates a new instance of EntityIdentity
   */
  static create(id?: Id): EntityIdentity {
    return new EntityIdentity(id ?? Id.create());
  }

  static restore(id: Id): EntityIdentity {
    return new EntityIdentity(id);
  }

  /**
   * @deprecated Use restore() for domain snapshot restoration.
   * Remove this compatibility alias in LED-81.
   */
  static fromPersistence(id: Id): EntityIdentity {
    return EntityIdentity.restore(id);
  }

  equals(other: EntityIdentity): boolean {
    return this.id.equals(other.id);
  }
}

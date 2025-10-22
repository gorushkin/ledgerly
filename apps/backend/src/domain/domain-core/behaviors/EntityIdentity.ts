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

  static fromPersistence(id: Id): EntityIdentity {
    return new EntityIdentity(id);
  }
}

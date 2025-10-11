import { Timestamp } from '../value-objects/Timestamp';

/**
 * Behavior for managing entity timestamps
 */
export class EntityTimestamps {
  constructor(
    private readonly updatedAt: Timestamp,
    private readonly createdAt: Timestamp,
  ) {
    Object.freeze(this);
  }

  /**
   * Returns the last update time
   */
  getUpdatedAt(): Timestamp {
    return this.updatedAt;
  }

  /**
   * Returns the creation time
   */
  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  /**
   * Updates the last modification time
   */
  touch(now?: Timestamp): EntityTimestamps {
    const newTimestamp = now ?? Timestamp.create();
    return new EntityTimestamps(newTimestamp, this.createdAt);
  }

  /**
   * Creates a new instance of EntityTimestamps
   */
  static create(createdAt?: Timestamp): EntityTimestamps {
    const now = createdAt ?? Timestamp.create();
    return new EntityTimestamps(now, now);
  }

  /**
   * Restores an instance from the database
   */
  static fromPersistence(
    updatedAt: Timestamp,
    createdAt: Timestamp,
  ): EntityTimestamps {
    return new EntityTimestamps(updatedAt, createdAt);
  }
}

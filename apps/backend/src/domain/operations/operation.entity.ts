import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

import {
  Id,
  Timestamp,
  Amount,
  EntityIdentity,
  EntityTimestamps,
  SoftDelete,
  ParentChildRelation,
} from '../domain-core';

export class Operation {
  private readonly identity: EntityIdentity;
  private timestamps: EntityTimestamps;
  private softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: ParentChildRelation,
    public readonly accountId: Id,
    public readonly entryId: Id,
    public amount: Amount,
    public description: string,
    public readonly isSystem: boolean,
  ) {
    this.identity = identity;
    this.timestamps = timestamps;
    this.softDelete = softDelete;
    this.ownership = ownership;
  }

  static create(
    userId: Id,
    accountId: Id,
    entryId: Id,
    amount: Amount,
    description: string,
  ): Operation {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();
    const ownership = ParentChildRelation.create(userId, identity.getId());

    return new Operation(
      identity,
      timestamps,
      softDelete,
      ownership,
      accountId,
      entryId,
      amount,
      description,
      false,
    );
  }

  static fromPersistence(data: OperationDbRow): Operation {
    const {
      accountId,
      amount,
      createdAt,
      description,
      entryId,
      id,
      isSystem,
      isTombstone,
      updatedAt,
      userId,
    } = data;

    const identity = new EntityIdentity(Id.fromPersistence(id));
    const timestamps = EntityTimestamps.fromPersistence(
      Timestamp.restore(updatedAt),
      Timestamp.restore(createdAt),
    );
    const softDelete = SoftDelete.fromPersistence(isTombstone);
    const ownership = ParentChildRelation.create(
      Id.fromPersistence(userId),
      identity.getId(),
    );

    return new Operation(
      identity,
      timestamps,
      softDelete,
      ownership,
      Id.fromPersistence(accountId),
      Id.fromPersistence(entryId),
      Amount.fromPersistence(amount),
      description,
      isSystem,
    );
  }

  // Delegation methods for identity
  getId(): Id {
    return this.identity.getId();
  }

  // Delegation methods for timestamps
  getUpdatedAt(): Timestamp {
    return this.timestamps.getUpdatedAt();
  }

  getCreatedAt(): Timestamp {
    return this.timestamps.getCreatedAt();
  }

  private touch(): void {
    this.timestamps = this.timestamps.touch();
  }

  // Delegation methods for soft delete
  markAsDeleted(): void {
    this.softDelete = this.softDelete.markAsDeleted();
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private validateUpdateIsAllowed(): void {
    this.softDelete.validateUpdateIsAllowed();
  }

  // Delegation methods for ownership
  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  getUserId(): Id {
    return this.ownership.getParentId();
  }

  delete(): void {
    if (this.isDeleted()) {
      throw new Error('Operation is already deleted');
    }

    this.markAsDeleted();
    this.touch();
  }

  canBeUpdated(): boolean {
    return !this.isSystem && !this.isDeleted();
  }

  updateAmount(amount: Amount): void {
    if (!this.canBeUpdated()) {
      throw new Error('Operation cannot be updated');
    }

    this.amount = amount;
    this.touch();
  }

  updateDescription(description: string): void {
    if (!this.canBeUpdated()) {
      throw new Error('Operation cannot be updated');
    }

    this.description = description;
    this.touch();
  }

  updateUpdatedAt(): void {
    this.touch();
  }

  toPersistence(): OperationDbInsert {
    return {
      accountId: this.accountId.valueOf(),
      amount: this.amount.valueOf(),
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      entryId: this.entryId.valueOf(),
      id: this.getId().valueOf(),
      isSystem: this.isSystem,
      isTombstone: this.softDelete.getIsTombstone(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.getUserId().valueOf(),
    };
  }
}

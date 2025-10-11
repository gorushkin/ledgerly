import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

import {
  Id,
  Timestamp,
  Amount,
  UserOwnership,
  EntityIdentity,
  EntityTimestamps,
  SoftDelete,
} from '../domain-core';

export class Operation {
  private readonly identity: EntityIdentity;
  private readonly timestamps: EntityTimestamps;
  private readonly softDelete: SoftDelete;
  private readonly ownership: UserOwnership;

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: UserOwnership,
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
    const ownership = UserOwnership.create(userId);

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
    const ownership = UserOwnership.create(Id.fromPersistence(userId));

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

  // Методы делегирования для identity
  getId(): Id {
    return this.identity.getId();
  }

  setId(id?: Id): void {
    this.identity.setId(id);
  }

  // Методы делегирования для timestamps
  getUpdatedAt(): Timestamp {
    return this.timestamps.getUpdatedAt();
  }

  getCreatedAt(): Timestamp {
    return this.timestamps.getCreatedAt();
  }

  private touch(): void {
    this.timestamps.touch();
  }

  // Методы делегирования для soft delete
  markAsDeleted(): void {
    this.softDelete.markAsDeleted();
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private validateUpdateIsAllowed(): void {
    this.softDelete.validateUpdateIsAllowed();
  }

  // Методы делегирования для ownership
  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToUser(userId);
  }

  getUserId(): Id {
    return this.ownership.getOwnerId();
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
      userId: this.ownership.getOwnerId().valueOf(),
    };
  }
}

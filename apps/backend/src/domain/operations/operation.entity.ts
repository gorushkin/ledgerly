import { OperationResponseDTO } from 'src/application/dto/operation.dto';
import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

import { Account, Entry, User } from '..';
import {
  Id,
  Timestamp,
  Amount,
  EntityIdentity,
  EntityTimestamps,
  SoftDelete,
  ParentChildRelation,
  Currency,
} from '../domain-core';

export class Operation {
  private timestamps: EntityTimestamps;
  private softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;
  private readonly entryRelation: ParentChildRelation;
  private readonly accountRelation: ParentChildRelation;

  private constructor(
    public readonly identity: EntityIdentity,
    private readonly currency: Currency,

    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: ParentChildRelation,
    entryRelation: ParentChildRelation,
    accountRelation: ParentChildRelation,
    public amount: Amount,
    public description: string,
    public readonly isSystem: boolean,
  ) {
    this.timestamps = timestamps;
    this.softDelete = softDelete;
    this.ownership = ownership;
    this.entryRelation = entryRelation;
    this.accountRelation = accountRelation;
  }

  static create(
    user: User,
    account: Account,
    entry: Entry,
    amount: Amount,
    description: string,
  ): Operation {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();

    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const entryRelation = ParentChildRelation.create(
      entry.getId(),
      identity.getId(),
    );

    const accountRelation = ParentChildRelation.create(
      account.getId(),
      identity.getId(),
    );

    return new Operation(
      identity,
      account.getCurrency(),
      timestamps,
      softDelete,
      ownership,
      entryRelation,
      accountRelation,
      amount,
      description,
      false,
    );
  }

  static fromPersistence(
    data: OperationDbRow & { currencyCode: string },
  ): Operation {
    const {
      accountId,
      amount,
      createdAt,
      currencyCode,
      description,
      entryId,
      id,
      isSystem,
      isTombstone,
      updatedAt,
      userId,
    } = data;

    const identity = EntityIdentity.fromPersistence(Id.fromPersistence(id));

    const timestamps = EntityTimestamps.fromPersistence(
      Timestamp.restore(updatedAt),
      Timestamp.restore(createdAt),
    );
    const softDelete = SoftDelete.fromPersistence(isTombstone);

    const ownership = ParentChildRelation.create(
      Id.fromPersistence(userId),
      identity.getId(),
    );

    const entryRelation = ParentChildRelation.create(
      Id.fromPersistence(entryId),
      identity.getId(),
    );

    const accountRelation = ParentChildRelation.create(
      Id.fromPersistence(accountId),
      identity.getId(),
    );

    const currency = Currency.fromPersistence(currencyCode);

    return new Operation(
      identity,
      currency,
      timestamps,
      softDelete,
      ownership,
      entryRelation,
      accountRelation,
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

  getAccountId(): Id {
    return this.accountRelation.getParentId();
  }

  toPersistence(): OperationDbInsert {
    return {
      accountId: this.accountRelation.getParentId().valueOf(),
      amount: this.amount.valueOf(),
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      entryId: this.entryRelation.getParentId().valueOf(),
      id: this.getId().valueOf(),
      isSystem: this.isSystem,
      isTombstone: this.softDelete.getIsTombstone(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.getUserId().valueOf(),
    };
  }

  toResponseDTO(): OperationResponseDTO {
    return {
      accountId: this.getAccountId().valueOf(),
      amount: this.amount.valueOf(),
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      entryId: this.entryRelation.getParentId().valueOf(),
      id: this.getId().valueOf(),
      isSystem: this.isSystem,
      updatedAt: this.getUpdatedAt().valueOf(),
    };
  }

  isCurrencyDifferent(other: Operation): boolean {
    return this.currency.isEqualTo(other.currency) === false;
  }
}

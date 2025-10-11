import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

import { BaseEntity, Id, Timestamp, Amount } from '../domain-core';

export class Operation extends BaseEntity {
  private constructor(
    public readonly userId: Id,
    public readonly id: Id,
    public readonly accountId: Id,
    public readonly entryId: Id,
    public amount: Amount,
    public description: string,
    public readonly isSystem: boolean,
    public readonly createdAt: Timestamp,
    public updatedAt: Timestamp,
  ) {
    super(userId, id, updatedAt, createdAt);
  }

  static create(
    userId: Id,
    accountId: Id,
    entryId: Id,
    amount: Amount,
    description: string,
  ): Operation {
    const now = Timestamp.create();

    return new Operation(
      userId,
      Id.create(),
      accountId,
      entryId,
      amount,
      description,
      false,
      now,
      now,
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
      updatedAt,
      userId,
    } = data;

    return new Operation(
      Id.fromPersistence(userId),
      Id.fromPersistence(id),
      Id.fromPersistence(accountId),
      Id.fromPersistence(entryId),
      Amount.fromPersistence(amount),
      description,
      isSystem,
      Timestamp.restore(createdAt),
      Timestamp.restore(updatedAt),
    );
  }

  isDeleted = (): boolean => {
    return this.isTombstone;
  };

  delete(): void {
    if (this.isDeleted()) {
      throw new Error('Operation is already deleted');
    }

    this.isTombstone = true;
    this.updatedAt = Timestamp.create();
  }

  canBeUpdated(): boolean {
    return !this.isSystem && !this.isDeleted();
  }

  updateAmount(amount: Amount): void {
    if (!this.canBeUpdated()) {
      throw new Error('Operation cannot be updated');
    }

    this.amount = amount;
    this.updatedAt = Timestamp.create();
  }

  updateDescription(description: string): void {
    if (!this.canBeUpdated()) {
      throw new Error('Operation cannot be updated');
    }

    this.description = description;
    this.updatedAt = Timestamp.create();
  }

  updateUpdatedAt(): void {
    this.updatedAt = Timestamp.create();
  }

  toPersistence(): OperationDbInsert {
    return {
      accountId: this.accountId.valueOf(),
      amount: this.amount.valueOf(),
      createdAt: this.createdAt.valueOf(),
      description: this.description,
      entryId: this.entryId.valueOf(),
      id: this.id.valueOf(),
      isSystem: this.isSystem,
      isTombstone: false,
      updatedAt: this.updatedAt.valueOf(),
      userId: this.userId.valueOf(),
    };
  }
}

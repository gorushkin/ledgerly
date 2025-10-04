import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

import { BaseEntity, Id, IsoDatetimeString, Amount } from '../domain-core';

export class Operation extends BaseEntity {
  private constructor(
    public readonly userId: Id,
    public readonly id: Id,
    public readonly accountId: Id,
    public amount: Amount,
    public description: string,
    public readonly isSystem: boolean,
    public readonly createdAt: IsoDatetimeString,
    public updatedAt: IsoDatetimeString,
  ) {
    super(userId, id, updatedAt, createdAt);
  }

  static create(
    userId: Id,
    accountId: Id,
    amount: Amount,
    description: string,
  ): Operation {
    const now = this.prototype.now;

    return new Operation(
      userId,
      Id.create(),
      accountId,
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
      id,
      isSystem,
      updatedAt,
      userId,
    } = data;

    return new Operation(
      Id.restore(userId),
      Id.restore(id),
      Id.restore(accountId),
      Amount.fromPersistence(amount),
      description,
      isSystem,
      IsoDatetimeString.restore(createdAt),
      IsoDatetimeString.restore(updatedAt),
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
    this.updatedAt = this.now;
  }

  // withId(id: Id): Operation {
  //   if (!this.isNew()) {
  //     throw new Error('Cannot set ID for existing operation');
  //   }

  //   return new Operation(
  //     this.userId,
  //     id,
  //     this.entryId,
  //     this.accountId,
  //     this.amount,
  //     this.isSystem,
  //     this.description,
  //   );
  // }

  canBeUpdated(): boolean {
    return !this.isSystem && !this.isDeleted();
  }

  updateAmount(amount: Amount): void {
    if (!this.canBeUpdated()) {
      throw new Error('Operation cannot be updated');
    }

    this.amount = amount;
    this.updatedAt = this.now;
  }

  updateDescription(description: string): void {
    if (!this.canBeUpdated()) {
      throw new Error('Operation cannot be updated');
    }

    this.description = description;
    this.updatedAt = this.now;
  }

  updateUpdatedAt(): void {
    this.updatedAt = this.now;
  }

  toPersistence(): OperationDbInsert {
    return {
      accountId: this.accountId.valueOf(),
      amount: this.amount.valueOf(),
      createdAt: this.createdAt.valueOf(),
      description: this.description,
      id: this.id.valueOf(),
      isSystem: this.isSystem,
      isTombstone: false,
      updatedAt: this.updatedAt.valueOf(),
      userId: this.userId.valueOf(),
    };
  }
}

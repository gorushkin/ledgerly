import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

import { Account, Transaction } from '..';
import {
  Id,
  Timestamp,
  Amount,
  EntityIdentity,
  EntityTimestamps,
  SoftDelete,
  ParentChildRelation,
} from '../domain-core';

import { OperationSnapshot, UpdateOperationProps } from './types';

// TODO: add versioning to operation entity and implement optimistic concurrency control in repo
export class Operation {
  private constructor(
    public readonly identity: EntityIdentity,
    public timestamps: EntityTimestamps,
    public softDelete: SoftDelete,
    public readonly ownership: ParentChildRelation,
    public readonly transactionRelation: ParentChildRelation,
    public accountRelation: ParentChildRelation,
    public amount: Amount,
    public value: Amount,
    public description: string,
    public readonly isSystem: boolean,
  ) {}

  static create(
    userId: Id,
    account: Account,
    transaction: Transaction,
    amount: Amount,
    value: Amount,
    description: string,
  ): Operation {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();

    const ownership = ParentChildRelation.create(userId, identity.getId());

    const transactionRelation = ParentChildRelation.create(
      transaction.getId(),
      identity.getId(),
    );

    const accountRelation = ParentChildRelation.create(
      account.getId(),
      identity.getId(),
    );

    return new Operation(
      identity,
      timestamps,
      softDelete,
      ownership,
      transactionRelation,
      accountRelation,
      amount,
      value,
      description,
      account.isSystem,
    );
  }

  static restore(data: OperationDbRow): Operation {
    const {
      accountId,
      amount,
      createdAt,
      description,
      id,
      isSystem,
      isTombstone,
      transactionId,
      updatedAt,
      userId,
      value,
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

    const transactionRelation = ParentChildRelation.create(
      Id.fromPersistence(transactionId),
      identity.getId(),
    );

    const accountRelation = ParentChildRelation.create(
      Id.fromPersistence(accountId),
      identity.getId(),
    );

    return new Operation(
      identity,
      timestamps,
      softDelete,
      ownership,
      transactionRelation,
      accountRelation,
      Amount.fromPersistence(amount),
      Amount.fromPersistence(value),
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

  // Delegation methods for ownership
  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  getUserId(): Id {
    return this.ownership.getParentId();
  }

  getAccountId(): Id {
    return this.accountRelation.getParentId();
  }

  belongsToAccount(account: Account): boolean {
    return this.accountRelation.belongsToParent(account.getId());
  }

  belongsToTransaction(transaction: Transaction): boolean {
    return this.transactionRelation.belongsToParent(transaction.getId());
  }

  toPersistence(): OperationDbInsert {
    return {
      accountId: this.accountRelation.getParentId().valueOf(),
      amount: this.amount.valueOf(),
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      id: this.id.valueOf(),
      isSystem: this.isSystem,
      isTombstone: this.softDelete.getIsTombstone(),
      transactionId: this.transactionRelation.getParentId().valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.getUserId().valueOf(),
      value: this.value.valueOf(),
    };
  }

  get id(): Id {
    return this.identity.getId();
  }

  get transactionId(): Id {
    return this.transactionRelation.getParentId();
  }

  toSnapshot(): OperationSnapshot {
    return {
      accountId: this.getAccountId().valueOf(),
      amount: this.amount.valueOf(),
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      id: this.id.valueOf(),
      isSystem: this.isSystem,
      isTombstone: this.softDelete.getIsTombstone(),
      transactionId: this.transactionRelation.getParentId().valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.getUserId().valueOf(),
      value: this.value.valueOf(),
    };
  }

  markAsDeleted(): void {
    this.softDelete = this.softDelete.markAsDeleted();
    this.timestamps = this.timestamps.touch();
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private updateDescription(description: string): boolean {
    if (this.description === description) {
      return false;
    }

    this.description = description;
    return true;
  }

  private updateAmount(amount: Amount): boolean {
    if (this.amount.equals(amount)) {
      return false;
    }

    this.amount = amount;
    return true;
  }

  private updateValue(value: Amount): boolean {
    if (this.value.equals(value)) {
      return false;
    }

    this.value = value;
    return true;
  }

  private updateAccount(account: Account): boolean {
    if (this.belongsToAccount(account)) {
      return false;
    }

    this.accountRelation = ParentChildRelation.create(
      account.getId(),
      this.identity.getId(),
    );
    return true;
  }

  update(params: UpdateOperationProps): void {
    const { account, amount, description, value } = params;

    let isUpdated = false;

    const isDescriptionUpdate = this.updateDescription(description);
    const isAmountUpdate = this.updateAmount(amount);
    const isValueUpdate = this.updateValue(value);
    const isAccountUpdate = account ? this.updateAccount(account) : false;

    isUpdated =
      isDescriptionUpdate || isAmountUpdate || isValueUpdate || isAccountUpdate;

    if (isUpdated) {
      this.timestamps = this.timestamps.touch();
    }
  }
}

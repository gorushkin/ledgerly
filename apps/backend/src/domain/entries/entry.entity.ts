import { EntryDbRow } from 'src/db/schemas/entries';

import {
  EntityIdentity,
  EntityTimestamps,
  Id,
  SoftDelete,
  ParentChildRelation,
  Timestamp,
  Amount,
} from '../domain-core';
import {
  UnbalancedEntryError,
  EmptyOperationsError,
  DeletedEntityOperationError,
  OperationOwnershipError,
  MissingOperationsError,
} from '../domain.errors';
import { Operation } from '../operations';
import { Transaction } from '../transactions';
import { User } from '../users/user.entity';

export class Entry {
  private readonly identity: EntityIdentity;
  private timestamps: EntityTimestamps;
  private softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;
  private readonly transactionRelation: ParentChildRelation;
  private operations: Operation[] = [];

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: ParentChildRelation,
    transactionRelation: ParentChildRelation,
    operations?: Operation[],
  ) {
    this.identity = identity;
    this.timestamps = timestamps;
    this.softDelete = softDelete;
    this.ownership = ownership;
    this.transactionRelation = transactionRelation;
    this.operations = operations ?? [];
  }

  static create(
    user: User,
    transaction: Transaction,
    operations?: Operation[],
  ): Entry {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();
    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const transactionRelation = ParentChildRelation.create(
      transaction.getId(),
      identity.getId(),
    );

    const entry = new Entry(
      identity,
      timestamps,
      softDelete,
      ownership,
      transactionRelation,
      operations,
    );

    if (entry.canBeValidated()) {
      entry.validateBalance();
    }

    return entry;
  }

  getId(): Id {
    return this.identity.getId();
  }

  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  belongsToTransaction(transactionId: Id): boolean {
    return this.transactionRelation.belongsToParent(transactionId);
  }

  getTransactionId(): Id {
    return this.transactionRelation.getParentId();
  }

  markAsDeleted(): void {
    this.softDelete = this.softDelete.markAsDeleted();
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private touch(): void {
    this.timestamps = this.timestamps.touch();
  }

  getUpdatedAt(): Timestamp {
    return this.timestamps.getUpdatedAt();
  }

  getCreatedAt(): Timestamp {
    return this.timestamps.getCreatedAt();
  }

  toPersistence(): EntryDbRow {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      id: this.identity.getId().valueOf(),
      isTombstone: this.isDeleted(),
      transactionId: this.getTransactionId().valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.ownership.getParentId().valueOf(),
    };
  }

  private validateCanAddOperations(operations: Operation[]): void {
    if (this.isDeleted()) {
      throw new DeletedEntityOperationError('entry', 'add operations');
    }

    if (operations.length === 0) {
      throw new EmptyOperationsError();
    }

    for (const operation of operations) {
      if (!operation.belongsToEntry(this)) {
        throw new OperationOwnershipError();
      }
    }
  }

  addOperations(operations: Operation[]): void {
    this.validateCanAddOperations(operations);

    this.operations.push(...operations);
    this.touch();
  }

  hasOperations(): boolean {
    return this.operations.length > 0;
  }

  canBeValidated(): boolean {
    return this.hasOperations() && !this.isDeleted();
  }

  getOperations(): Operation[] {
    return [...this.operations];
  }

  validateBalance(): void {
    if (!this.hasOperations()) {
      throw new MissingOperationsError();
    }

    if (this.isDeleted()) {
      throw new DeletedEntityOperationError('entry', 'validate');
    }

    const total = this.operations.reduce((sum, operation) => {
      return sum.add(operation.amount);
    }, Amount.create('0'));

    if (!total.isZero()) {
      throw new UnbalancedEntryError(this, total);
    }
  }
}

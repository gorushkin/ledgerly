import { TransactionDbRow } from 'src/db/schema';

import {
  EntityIdentity,
  EntityTimestamps,
  Id,
  SoftDelete,
  Timestamp,
  ParentChildRelation,
  DateValue,
} from '../domain-core';
import { Entry } from '../entries';

export class Transaction {
  private readonly identity: EntityIdentity;
  private timestamps: EntityTimestamps;
  private softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;
  private postingDate: DateValue;
  private transactionDate: DateValue;
  private entries: Entry[] = [];

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: ParentChildRelation,
    postingDate: DateValue,
    transactionDate: DateValue,
    public description: string,
  ) {
    this.identity = identity;
    this.timestamps = timestamps;
    this.softDelete = softDelete;
    this.ownership = ownership;
    this.postingDate = postingDate;
    this.transactionDate = transactionDate;
    this.description = description;
  }

  static create(
    userId: Id,
    description: string,
    postingDate: DateValue,
    transactionDate: DateValue,
  ): Transaction {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();
    const ownership = ParentChildRelation.create(userId, identity.getId());

    return new Transaction(
      identity,
      timestamps,
      softDelete,
      ownership,
      postingDate,
      transactionDate,
      description,
    );
  }

  static restore(data: TransactionDbRow): Transaction {
    const {
      createdAt,
      description,
      id,
      isTombstone,
      postingDate,
      transactionDate,
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

    return new Transaction(
      identity,
      timestamps,
      softDelete,
      ownership,
      DateValue.restore(postingDate),
      DateValue.restore(transactionDate),
      description,
    );
  }
  getId(): Id {
    return this.identity.getId();
  }

  getUpdatedAt(): Timestamp {
    return this.timestamps.getUpdatedAt();
  }

  getCreatedAt(): Timestamp {
    return this.timestamps.getCreatedAt();
  }

  private touch(): void {
    this.timestamps = this.timestamps.touch();
  }

  markAsDeleted(): void {
    this.softDelete = this.softDelete.markAsDeleted();
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  getUserId(): Id {
    return this.ownership.getParentId();
  }

  delete(): void {
    if (this.isDeleted()) {
      throw new Error('Transaction is already deleted');
    }

    this.markAsDeleted();
    this.touch();
  }

  canBeUpdated(): boolean {
    return !this.isDeleted();
  }

  updateUpdatedAt(): void {
    this.touch();
  }

  toPersistence(): TransactionDbRow {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      id: this.getId().valueOf(),
      isTombstone: this.isDeleted(),
      postingDate: this.postingDate.valueOf(),
      transactionDate: this.transactionDate.valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.getUserId().valueOf(),
    };
  }

  validateUpdateIsAllowed(): void {
    this.softDelete.validateUpdateIsAllowed();
  }

  updatePostingDate(date: DateValue): void {
    this.validateUpdateIsAllowed();

    this.postingDate = date;
    this.touch();
  }

  updateTransactionDate(date: DateValue): void {
    this.validateUpdateIsAllowed();

    this.transactionDate = date;
    this.touch();
  }

  updateDescription(description: string): void {
    this.validateUpdateIsAllowed();

    this.description = description;
    this.touch();
  }

  getPostingDate(): DateValue {
    return this.postingDate;
  }

  getTransactionDate(): DateValue {
    return this.transactionDate;
  }

  // Entry management methods
  addEntry(entry: Entry): void {
    this.validateUpdateIsAllowed();

    // Validate entry belongs to this transaction
    if (!entry.belongsToTransaction(this.getId())) {
      throw new Error('Entry does not belong to this transaction');
    }

    this.entries.push(entry);
    this.touch();
  }

  removeEntry(entryId: Id): void {
    this.validateUpdateIsAllowed();

    const entryIndex = this.entries.findIndex((entry) =>
      entry.getId().isEqualTo(entryId),
    );

    if (entryIndex === -1) {
      throw new Error('Entry not found in transaction');
    }

    this.entries.splice(entryIndex, 1);
    this.touch();
  }

  getEntries(): readonly Entry[] {
    return [...this.entries];
  }

  isBalanced(): boolean {
    // All entries must sum to zero for a balanced transaction
    // const total = this.entries.reduce(
    //   (sum, entry) => sum + entry.getAmount().valueOf(),
    //   0,
    // );
    // return total === 0;

    return true; // Placeholder implementation
  }

  validateBalance(): void {
    if (!this.isBalanced()) {
      throw new Error('Transaction is not balanced');
    }
  }
}

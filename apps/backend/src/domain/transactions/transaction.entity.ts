import { UUID } from '@ledgerly/shared/types';

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
import { User } from '../users/user.entity';

import {
  CreateTransactionProps,
  TransactionBuildContext,
  TransactionUpdateData,
  TransactionWithEntriesAndOperations,
  TransactionSnapshot,
} from './types';

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
    user: User,
    dto: CreateTransactionProps,
    transactionContext: TransactionBuildContext,
  ): Transaction {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();
    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const postingDate = DateValue.restore(dto.postingDate);
    const transactionDate = DateValue.restore(dto.transactionDate);

    const transaction = new Transaction(
      identity,
      timestamps,
      softDelete,
      ownership,
      postingDate,
      transactionDate,
      dto.description,
    );

    const entries = dto.entries.map((entryDTO) =>
      Entry.create(user, transaction.getId(), entryDTO, transactionContext),
    );

    transaction.attachEntries(entries);

    transaction.validate();

    return transaction;
  }

  static restore(data: TransactionWithEntriesAndOperations): Transaction {
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

    const idVO = Id.fromPersistence(id);

    const identity = EntityIdentity.fromPersistence(idVO);
    const timestamps = EntityTimestamps.fromPersistence(
      Timestamp.restore(updatedAt),
      Timestamp.restore(createdAt),
    );
    const softDelete = SoftDelete.fromPersistence(isTombstone);
    const ownership = ParentChildRelation.create(
      Id.fromPersistence(userId),
      identity.getId(),
    );

    const transaction = new Transaction(
      identity,
      timestamps,
      softDelete,
      ownership,
      DateValue.restore(postingDate),
      DateValue.restore(transactionDate),
      description,
    );

    const entries = data.entries.map((entryData) => Entry.restore(entryData));

    transaction.attachEntries(entries);

    return transaction;
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

  toSnapshot(): TransactionSnapshot {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      entries: this.entries.map((entry) => entry.toSnapshot()),
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

  private updatePostingDate(date: DateValue): void {
    this.validateUpdateIsAllowed();

    this.postingDate = date;
  }

  private updateTransactionDate(date: DateValue): void {
    this.validateUpdateIsAllowed();

    this.transactionDate = date;
  }

  private updateDescription(description: string): void {
    this.validateUpdateIsAllowed();

    this.description = description;
  }

  update(updateData: TransactionUpdateData): void {
    if (updateData.description !== undefined) {
      this.updateDescription(updateData.description);
    }

    if (updateData.postingDate) {
      this.updatePostingDate(DateValue.restore(updateData.postingDate));
    }

    if (updateData.transactionDate) {
      this.updateTransactionDate(DateValue.restore(updateData.transactionDate));
    }
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
    this.attachEntry(entry);
  }

  attachEntry(entry: Entry): void {
    if (!entry.belongsToTransaction(this.getId())) {
      throw new Error('Entry does not belong to this transaction');
    }

    this.entries.push(entry);
  }

  addEntries(entries: Entry[]): void {
    this.validateUpdateIsAllowed();
    entries.forEach((entry) => this.addEntry(entry));
    this.touch();
  }

  attachEntries(entries: Entry[]): void {
    entries.forEach((entry) => this.attachEntry(entry));
  }

  removeEntry(entryId: Id): void {
    const entryIndex = this.entries.findIndex((entry) =>
      entry.getId().equals(entryId),
    );

    if (entryIndex === -1) {
      throw new Error('Entry not found in transaction');
    }

    this.entries.splice(entryIndex, 1);
  }

  removeEntries(entryIds: Id[]): void {
    this.validateUpdateIsAllowed();
    entryIds.forEach((entryId) => this.removeEntry(entryId));
    this.touch();
  }

  getEntries(): Entry[] {
    return [...this.entries];
  }

  getEntryById(entryId: UUID): Entry | null {
    const entry = this.entries.find((e) => e.getId().equals(entryId));
    return entry ?? null;
  }

  private validate(): void {
    for (const entry of this.entries) {
      entry.validateBalance();
    }
  }
}

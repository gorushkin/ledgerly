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
import { EntryDraft, EntryUpdate } from '../entries/types';

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
    private version = 0,
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
    dto: CreateTransactionProps,
    transactionContext: TransactionBuildContext,
  ): Transaction {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();
    const ownership = ParentChildRelation.create(userId, identity.getId());

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

    const entries = transaction.createEntriesFromDrafts(
      dto.entries,
      transactionContext,
    );

    transaction.attachEntries(entries);

    transaction.validate();

    return transaction;
  }

  private createEntriesFromDrafts(
    entriesData: EntryDraft[],
    transactionContext: TransactionBuildContext,
  ): Entry[] {
    const entries = entriesData.map((entryDTO) =>
      Entry.create(
        this.getUserId(),
        this.getId(),
        entryDTO,
        transactionContext,
      ),
    );

    return entries;
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
      version,
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
      version,
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

  private markUpdated() {
    this.version += 1;
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
    this.markUpdated();
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
      version: this.version,
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
    this.markUpdated();
  }

  getPostingDate(): DateValue {
    return this.postingDate;
  }

  getTransactionDate(): DateValue {
    return this.transactionDate;
  }

  addEntries(
    entriesData: EntryDraft[],
    transactionContext: TransactionBuildContext,
  ): void {
    const entries = this.createEntriesFromDrafts(
      entriesData,
      transactionContext,
    );

    this.attachEntries(entries);
    this.markUpdated();
  }

  updateEntries(
    entriesData: EntryUpdate[],
    transactionContext: TransactionBuildContext,
  ) {
    // TODO: add validation if updating is allowed
    entriesData.forEach((entryData) => {
      const existingEntry = this.getEntryById(entryData.id);

      if (!existingEntry) {
        // TODO: add proper error handling
        throw new Error(
          `Entry with id ${entryData.id} does not belong to this transaction`,
        );
      }

      existingEntry.updateEntry(entryData, transactionContext);
    });

    this.markUpdated();
  }

  attachEntries(entries: Entry[]): void {
    entries.forEach((entry) => {
      if (!entry.belongsToTransaction(this.getId())) {
        throw new Error('Entry does not belong to this transaction');
      }

      this.entries.push(entry);
    });
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

  get validationResult(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const entry of this.entries) {
      try {
        entry.validateBalance();
      } catch (error) {
        if (error instanceof Error) {
          errors.push(
            `Entry ${entry.getId().toString()} is invalid: ${error.message}`,
          );
        } else {
          errors.push(`Entry ${entry.getId().toString()} is invalid.`);
        }
      }
    }

    return {
      errors,
      isValid: errors.length === 0,
    };
  }
}

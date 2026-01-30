import { UUID } from '@ledgerly/shared/types';
import {
  ConflictingEntryIdsError,
  EntryNotFoundInTransactionError,
  MissingTransactionContextError,
} from 'src/domain/domain.errors';

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
  UpdateTransactionProps,
  EntriesPatch,
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

    const entries = this.getEntries();

    this.deleteEntries(entries.map((entry) => entry.getId().valueOf()));
    this.markUpdated();
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

  private updateMetadataIfChanged(metadata?: TransactionUpdateData): boolean {
    let isUpdated = false;

    if (!metadata) {
      return isUpdated;
    }

    if (metadata.description !== undefined) {
      isUpdated = true;
      this.updateDescription(metadata.description);
    }

    if (metadata.postingDate) {
      isUpdated = true;

      this.updatePostingDate(DateValue.restore(metadata.postingDate));
    }

    if (metadata.transactionDate) {
      isUpdated = true;
      this.updateTransactionDate(DateValue.restore(metadata.transactionDate));
    }

    return isUpdated;
  }

  getPostingDate(): DateValue {
    return this.postingDate;
  }

  getTransactionDate(): DateValue {
    return this.transactionDate;
  }

  private addEntries(
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

  private updateEntries(
    entriesData: EntryUpdate[],
    transactionContext: TransactionBuildContext,
  ) {
    this.validateUpdateIsAllowed();

    entriesData.forEach((entryData) => {
      const existingEntry = this.getEntryById(entryData.id);

      if (!existingEntry) {
        throw new EntryNotFoundInTransactionError(
          entryData.id,
          this.getId().valueOf(),
        );
      }

      existingEntry.updateEntry(entryData, transactionContext);
    });

    this.markUpdated();
  }

  private deleteEntries(entryIds: UUID[]): void {
    entryIds.forEach((entryId) => {
      const entry = this.getEntryById(entryId);

      if (entry) {
        entry.markAsDeleted();
      } else {
        throw new Error(
          `Entry with id ${entryId} does not belong to this transaction`,
        );
      }
    });
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

  private validateEntriesPatch(entries: EntriesPatch): void {
    if (!entries) {
      return;
    }

    const deleteIds = new Set(entries.delete);

    // Check for IDs present in both update and delete
    const updateDeleteConflicts = entries.update
      .map((entry) => entry.id)
      .filter((id) => deleteIds.has(id));

    if (updateDeleteConflicts.length > 0) {
      throw new ConflictingEntryIdsError(
        updateDeleteConflicts,
        'IDs found in both update and delete arrays',
      );
    }

    // Check for duplicate IDs within update array
    const updateDuplicates = entries.update
      .map((entry) => entry.id)
      .filter((id, index, arr) => arr.indexOf(id) !== index);

    if (updateDuplicates.length > 0) {
      throw new ConflictingEntryIdsError(
        [...new Set(updateDuplicates)],
        'Duplicate IDs in update array',
      );
    }

    // Check for duplicate IDs within delete array
    const deleteDuplicates = entries.delete.filter(
      (id, index, arr) => arr.indexOf(id) !== index,
    );

    if (deleteDuplicates.length > 0) {
      throw new ConflictingEntryIdsError(
        [...new Set(deleteDuplicates)],
        'Duplicate IDs in delete array',
      );
    }
  }

  private applyEntriesPatch(
    entries: EntriesPatch,
    transactionContext?: TransactionBuildContext,
  ) {
    let isUpdated = false;

    if (!entries) {
      return isUpdated;
    }

    this.validateEntriesPatch(entries);

    if (entries.create.length > 0) {
      isUpdated = true;

      if (!transactionContext) {
        throw new MissingTransactionContextError('create new entries');
      }

      this.addEntries(entries.create, transactionContext);
    }

    if (entries.update.length > 0) {
      isUpdated = true;

      if (!transactionContext) {
        throw new MissingTransactionContextError('update entries');
      }

      this.updateEntries(entries.update, transactionContext);
    }

    if (entries.delete.length > 0) {
      isUpdated = true;
      this.deleteEntries(entries.delete);
    }

    return isUpdated;
  }

  applyUpdate(
    { entries, metadata }: UpdateTransactionProps,
    transactionContext?: TransactionBuildContext,
  ) {
    const isMetadataUpdated = this.updateMetadataIfChanged(metadata);

    const isEntriesUpdated = this.applyEntriesPatch(
      entries,
      transactionContext,
    );

    if (isMetadataUpdated || isEntriesUpdated) {
      this.markUpdated();
    }
  }
}

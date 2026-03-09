import { UUID } from '@ledgerly/shared/types';

import {
  EntityIdentity,
  EntityTimestamps,
  Id,
  SoftDelete,
  Timestamp,
  ParentChildRelation,
  DateValue,
  Amount,
  Currency,
} from '../domain-core';
import {
  AccountNotFoundInContextError,
  ConflictingOperationIdsError,
  MissingTransactionContextError,
  OperationNotFoundInTransactionError,
  OperationUserMismatchError,
  UnbalancedTransactionError,
} from '../domain.errors';
import { Operation } from '../operations';
import { OperationDraft, OperationUpdate } from '../operations/types';

import {
  CreateTransactionProps,
  TransactionBuildContext,
  TransactionUpdateData,
  TransactionWithEntriesAndOperations,
  TransactionSnapshot,
  UpdateTransactionProps,
  OperationsPatch,
} from './types';

export class Transaction {
  private operations: Operation[] = [];
  private operationsMap = new Map<string, Operation>();
  private constructor(
    private readonly identity: EntityIdentity,
    private timestamps: EntityTimestamps,
    private softDelete: SoftDelete,
    private readonly ownership: ParentChildRelation,
    private postingDate: DateValue,
    private transactionDate: DateValue,
    public currency: Currency,
    public description: string,
    private version = 0,
  ) {}

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
      dto.currency,
      dto.description,
    );

    const operations = transaction.createOperationsFromDrafts(
      dto.operations,
      transactionContext,
    );

    transaction.attachOperations(operations);
    transaction.validate();

    return transaction;
  }

  private attachOperations(operations: Operation[]): void {
    operations.forEach((operation) => {
      const existingOperation = this.operationsMap.get(
        operation.getId().valueOf(),
      );

      if (existingOperation) {
        throw new Error(
          `Operation with id ${operation.getId().valueOf()} is already attached to transaction ${this.getId().valueOf()}`,
        );
      }

      if (!operation.belongsToUser(this.getUserId())) {
        throw new OperationUserMismatchError(
          operation.getId().valueOf(),
          this.getId().valueOf(),
        );
      }

      this.operations.push(operation);
      this.operationsMap.set(operation.getId().valueOf(), operation);
    });
  }

  private createOperationsFromDrafts(
    operationsData: OperationDraft[],
    transactionContext: TransactionBuildContext,
  ) {
    const operations = operationsData.map((operationDTO) =>
      Operation.create(
        this.getUserId(),
        transactionContext.accountsMap.get(operationDTO.accountId)!,
        this,
        Amount.create(operationDTO.value),
        Amount.create(operationDTO.value),
        operationDTO.description,
      ),
    );

    return operations;
  }

  static restore(data: TransactionWithEntriesAndOperations): Transaction {
    const {
      createdAt,
      currency,
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
      Currency.fromPersistence(currency),
      description,
      version,
    );

    const operations = data.operations.map((operationData) =>
      Operation.restore(operationData),
    );

    transaction.attachOperations(operations);

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

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  getUserId(): Id {
    return this.ownership.getParentId();
  }

  canBeUpdated(): boolean {
    return !this.isDeleted();
  }

  toSnapshot(): TransactionSnapshot {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      currency: this.currency.valueOf(),
      description: this.description,
      id: this.getId().valueOf(),
      isTombstone: this.isDeleted(),
      operations: this.operations.map((operation) => operation.toSnapshot()),
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

  private updateMetadataIfChanged(metadata?: TransactionUpdateData): boolean {
    this.validateUpdateIsAllowed();

    let isUpdated = false;

    if (!metadata) {
      return isUpdated;
    }

    if (metadata.description !== undefined) {
      isUpdated = true;
      this.description = metadata.description;
    }

    if (metadata.postingDate) {
      isUpdated = true;

      this.postingDate = DateValue.restore(metadata.postingDate);
    }

    if (metadata.transactionDate) {
      isUpdated = true;
      this.transactionDate = DateValue.restore(metadata.transactionDate);
    }

    return isUpdated;
  }

  getPostingDate(): DateValue {
    return this.postingDate;
  }

  getTransactionDate(): DateValue {
    return this.transactionDate;
  }

  getOperationById(entryId: UUID): Operation | null {
    return this.operationsMap.get(entryId) ?? null;
  }

  private validate(): void {
    const totalValue = this.getOperations().reduce((sum, { value }) => {
      return sum.add(value);
    }, Amount.create('0'));

    if (!totalValue.isZero()) {
      throw new UnbalancedTransactionError(this, totalValue);
    }
  }

  private validateOperationsPatch(operations: OperationsPatch): void {
    if (!operations) {
      return;
    }

    const deleteIds = new Set(operations.delete);

    // Check for IDs present in both update and delete
    const updateDeleteConflicts = operations.update
      .map((operation) => operation.id)
      .filter((id) => deleteIds.has(id));

    if (updateDeleteConflicts.length > 0) {
      throw new ConflictingOperationIdsError(
        updateDeleteConflicts,
        'IDs found in both update and delete arrays',
      );
    }

    // Check for duplicate IDs within update array
    const updateDuplicates = operations.update
      .map((operation) => operation.id)
      .filter((id, index, arr) => arr.indexOf(id) !== index);

    if (updateDuplicates.length > 0) {
      throw new ConflictingOperationIdsError(
        [...new Set(updateDuplicates)],
        'Duplicate IDs in update array',
      );
    }

    // Check for duplicate IDs within delete array
    const deleteDuplicates = operations.delete.filter(
      (id, index, arr) => arr.indexOf(id) !== index,
    );

    if (deleteDuplicates.length > 0) {
      throw new ConflictingOperationIdsError(
        [...new Set(deleteDuplicates)],
        'Duplicate IDs in delete array',
      );
    }
  }

  private addOperations(
    operationsData: OperationDraft[],
    transactionContext: TransactionBuildContext,
  ) {
    const operations = this.createOperationsFromDrafts(
      operationsData,
      transactionContext,
    );

    this.attachOperations(operations);
  }

  private updateOperations(
    operationsData: OperationUpdate[],
    transactionContext: TransactionBuildContext,
  ) {
    operationsData.forEach((operationData) => {
      const existingOperation = this.operationsMap.get(operationData.id);

      if (!existingOperation) {
        throw new OperationNotFoundInTransactionError(
          operationData.id,
          this.getId().valueOf(),
        );
      }

      const operationAccount = transactionContext.accountsMap.get(
        operationData.accountId,
      );

      if (!operationAccount) {
        throw new AccountNotFoundInContextError(
          operationData.accountId,
          operationData.id,
        );
      }

      existingOperation.update({
        account: operationAccount,
        amount: Amount.create(operationData.amount),
        description: operationData.description,
        value: Amount.create(operationData.value),
      });
    });
  }

  private deleteOperations(operationIds: UUID[]): void {
    operationIds.forEach((operationId) => {
      const operation = this.operationsMap.get(operationId);

      if (!operation) {
        throw new OperationNotFoundInTransactionError(
          operationId,
          this.getId().valueOf(),
        );
      }

      operation.markAsDeleted();
    });
  }

  private applyOperationsPatch(
    operations?: OperationsPatch,
    transactionContext?: TransactionBuildContext,
  ): boolean {
    let isUpdated = false;

    if (!operations) {
      return isUpdated;
    }

    this.validateOperationsPatch(operations);

    const { create, delete: deleteIds, update } = operations;

    if (create.length > 0) {
      isUpdated = true;

      if (!transactionContext) {
        throw new MissingTransactionContextError('create new operations');
      }

      this.addOperations(create, transactionContext);
    }

    if (update.length > 0) {
      isUpdated = true;

      if (!transactionContext) {
        throw new MissingTransactionContextError('update operations');
      }

      this.updateOperations(update, transactionContext);
    }

    if (deleteIds.length > 0) {
      isUpdated = true;

      this.deleteOperations(deleteIds);
    }

    return isUpdated;
  }

  applyUpdate(
    { metadata, operations }: UpdateTransactionProps,
    transactionContext?: TransactionBuildContext,
  ) {
    const isMetadataUpdated = this.updateMetadataIfChanged(metadata);

    const isOperationsUpdated = this.applyOperationsPatch(
      operations,
      transactionContext,
    );

    if (isMetadataUpdated || isOperationsUpdated) {
      this.validate();
      this.markUpdated();
    }
  }

  getOperations(): Operation[] {
    return this.operations;
  }

  markAsDeleted(): void {
    if (this.isDeleted()) {
      return;
    }

    this.softDelete = this.softDelete.markAsDeleted();

    this.operations.forEach((operation) => operation.markAsDeleted());

    this.markUpdated();
  }
}

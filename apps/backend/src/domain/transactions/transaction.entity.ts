import { UUID } from '@ledgerly/shared/types';
import {
  ConflictingOperationIdsError,
  MissingTransactionContextError,
  OperationNotFoundInTransactionError,
  OperationUserMismatchError,
  UnbalancedTransactionError,
} from 'src/domain/domain.errors';

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
import { Operation } from '../operations';
import { OperationProps, UpdateOperationProps } from '../operations/types';

import {
  CreateTransactionProps,
  TransactionBuildContext,
  TransactionUpdateData,
  TransactionSnapshotWithDetails,
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
    public version = 0,
  ) {}

  static create(userId: Id, dto: CreateTransactionProps): Transaction {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();
    const ownership = ParentChildRelation.create(userId, identity.getId());

    const transaction = new Transaction(
      identity,
      timestamps,
      softDelete,
      ownership,
      dto.postingDate,
      dto.transactionDate,
      dto.currency,
      dto.description,
    );

    const operations = transaction.createOperationsFromDrafts(dto.operations);

    transaction.attachOperations(operations);
    transaction.validate();

    return transaction;
  }

  attachOperations(operations: Operation[]): void {
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

  private createOperationsFromDrafts(operationsData: OperationProps[]) {
    const operations = operationsData.map((operationDTO) =>
      Operation.create(
        this.getUserId(),
        operationDTO.account,
        this,
        operationDTO.amount,
        operationDTO.value,
        operationDTO.description,
      ),
    );

    return operations;
  }

  static restore(data: TransactionSnapshotWithDetails): Transaction {
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

    const operations = data.operations
      .filter((operationData) => !operationData.isTombstone)
      .map((operationData) => Operation.restore(operationData));

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
      operations: this.operations
        .filter((operation) => !operation.isDeleted())
        .map((operation) => operation.toSnapshot()),
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

  private updateDescription(description: string): boolean {
    if (this.description === description) {
      return false;
    }

    this.description = description;
    return true;
  }

  private updatePostingDate(postingDate: DateValue): boolean {
    if (this.postingDate.isEqualTo(postingDate)) {
      return false;
    }

    this.postingDate = postingDate;
    return true;
  }

  private updateTransactionDate(transactionDate: DateValue): boolean {
    if (this.transactionDate.isEqualTo(transactionDate)) {
      return false;
    }

    this.transactionDate = transactionDate;
    return true;
  }

  private updateMetadataIfChanged(metadata?: TransactionUpdateData): boolean {
    this.validateUpdateIsAllowed();

    if (!metadata) {
      return false;
    }

    const isDescriptionUpdated = this.updateDescription(metadata.description);

    const isPostingDateUpdated = this.updatePostingDate(
      DateValue.restore(metadata.postingDate),
    );

    const isTransactionDateUpdated = this.updateTransactionDate(
      DateValue.restore(metadata.transactionDate),
    );

    return (
      isDescriptionUpdated || isPostingDateUpdated || isTransactionDateUpdated
    );
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
      throw new UnbalancedTransactionError(this.getId().valueOf(), totalValue);
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
        updateDeleteConflicts.map((id) => id.valueOf()),
        'IDs found in both update and delete arrays',
      );
    }

    // Check for duplicate IDs within update array
    const updateDuplicates = operations.update
      .map((operation) => operation.id)
      .filter((id, index, arr) => arr.indexOf(id) !== index);

    if (updateDuplicates.length > 0) {
      throw new ConflictingOperationIdsError(
        [...new Set(updateDuplicates.map((id) => id.valueOf()))],
        'Duplicate IDs in update array',
      );
    }

    // Check for duplicate IDs within delete array
    const deleteDuplicates = operations.delete
      .filter((id, index, arr) => arr.indexOf(id) !== index)
      .map((id) => id.valueOf());

    if (deleteDuplicates.length > 0) {
      throw new ConflictingOperationIdsError(
        [...new Set(deleteDuplicates)],
        'Duplicate IDs in delete array',
      );
    }
  }

  private addOperations(operationsData: OperationProps[]) {
    const operations = this.createOperationsFromDrafts(operationsData);

    this.attachOperations(operations);
  }

  private updateOperations(operationsData: UpdateOperationProps[]) {
    operationsData.forEach((operationData) => {
      const operationId = operationData.id.valueOf();

      const existingOperation = this.operationsMap.get(operationId);

      if (!existingOperation) {
        throw new OperationNotFoundInTransactionError(
          operationId,
          this.getId().valueOf(),
        );
      }

      existingOperation.update({
        account: operationData.account, // operationAccount,
        amount: operationData.amount,
        description: operationData.description,
        id: operationData.id,
        value: operationData.value,
      });
    });
  }

  private deleteOperations(operationIds: Id[]): void {
    operationIds.forEach((operationId) => {
      const operation = this.operationsMap.get(operationId.valueOf());

      if (!operation) {
        throw new OperationNotFoundInTransactionError(
          operationId.valueOf(),
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

      this.addOperations(create);
    }

    if (update.length > 0) {
      isUpdated = true;

      if (!transactionContext) {
        throw new MissingTransactionContextError('update operations');
      }

      this.updateOperations(update);
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
  ): boolean {
    const isMetadataUpdated = this.updateMetadataIfChanged(metadata);

    const isOperationsUpdated = this.applyOperationsPatch(
      operations,
      transactionContext,
    );

    if (isMetadataUpdated || isOperationsUpdated) {
      this.validate();
      this.markUpdated();
    }

    return isMetadataUpdated || isOperationsUpdated;
  }

  getOperations(): Operation[] {
    return this.operations.filter((operation) => !operation.isDeleted());
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

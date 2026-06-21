import { UUID } from '@ledgerly/shared/types';
import {
  ConflictingOperationIdsError,
  DeletedEntityOperationError,
  InsufficientOperationsError,
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
  Version,
} from '../domain-core';
import { Operation } from '../operations';
import { OperationProps, UpdateOperationProps } from '../operations/types';

import { MIN_TRANSACTION_OPERATIONS } from './constants';
import {
  CreateTransactionProps,
  TransactionUpdateData,
  TransactionSnapshotWithDetails,
  TransactionSnapshot,
  UpdateTransactionProps,
  OperationsPatch,
} from './types';

const findDuplicateIds = (ids: UUID[]): UUID[] => {
  const seenIds = new Set<UUID>();
  const duplicateIds = new Set<UUID>();

  ids.forEach((id) => {
    if (seenIds.has(id)) {
      duplicateIds.add(id);
      return;
    }

    seenIds.add(id);
  });

  return [...duplicateIds];
};

export class Transaction {
  static readonly entityType = 'transaction';
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
    private version: Version,
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
      Version.create(0),
    );

    const operations = transaction.createOperationsFromDrafts(dto.operations);

    transaction.attachOperations(operations);
    transaction.validateActiveOperationsCount();
    transaction.validateActiveOperationsBalance();

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
      Version.restore(version),
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

  getVersion(): Version {
    return this.version;
  }

  hasVersion(expectedVersion: Version): boolean {
    return this.version.isEqualTo(expectedVersion);
  }

  private markUpdated() {
    this.version = this.version.increment();
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
      version: this.version.valueOf(),
    };
  }

  validateUpdateIsAllowed(): void {
    this.softDelete.validateUpdateIsAllowed(
      DeletedEntityOperationError.forUpdate(Transaction.entityType),
    );
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

  private validateOperationIds(operationsPatch?: OperationsPatch) {
    if (!operationsPatch) {
      return;
    }

    const ids = [
      ...operationsPatch.update.map(({ id }) => id),
      ...operationsPatch.delete,
    ];

    ids.forEach((id) => {
      const operation = this.operationsMap.get(id.valueOf());

      if (!operation || operation.isDeleted()) {
        throw new OperationNotFoundInTransactionError(
          id.valueOf(),
          this.getId().valueOf(),
        );
      }
    });
  }

  private validateResultingOperationCount(
    operationsPatch?: OperationsPatch,
  ): void {
    if (!operationsPatch) {
      return;
    }

    const activeOperationsCount =
      this.getOperations().length +
      operationsPatch.create.length -
      operationsPatch.delete.length;

    if (activeOperationsCount < MIN_TRANSACTION_OPERATIONS) {
      throw new InsufficientOperationsError(activeOperationsCount);
    }
  }

  private validateActiveOperationsCount(): void {
    const activeOperationsCount = this.getOperations().length;

    if (activeOperationsCount < MIN_TRANSACTION_OPERATIONS) {
      throw new InsufficientOperationsError(activeOperationsCount);
    }
  }

  private validateActiveOperationsBalance(): void {
    const totalValue = this.getOperations().reduce((sum, { value }) => {
      return sum.add(value);
    }, Amount.create('0'));

    if (!totalValue.isZero()) {
      throw new UnbalancedTransactionError(this.getId().valueOf(), totalValue);
    }
  }

  private validateResultingBalance(operationsPatch?: OperationsPatch) {
    if (!operationsPatch) {
      return;
    }

    const deletedIds = new Set(
      operationsPatch.delete.map((id) => id.valueOf()),
    );

    const updatedValues = new Map(
      operationsPatch.update.map(({ id, value }) => [id.valueOf(), value]),
    );

    const currentBalance = this.getOperations().reduce((sum, operation) => {
      if (deletedIds.has(operation.getId().valueOf())) {
        return sum;
      }

      const updatedValue = updatedValues.get(operation.getId().valueOf());

      if (updatedValue) {
        return sum.add(updatedValue);
      }

      return sum.add(operation.value);
    }, Amount.create('0'));

    const updatedBalanceAfterOperations = currentBalance.add(
      operationsPatch.create.reduce(
        (sum, { value }) => sum.add(value),
        Amount.create('0'),
      ),
    );

    if (!updatedBalanceAfterOperations.isZero()) {
      throw new UnbalancedTransactionError(
        this.getId().valueOf(),
        updatedBalanceAfterOperations,
      );
    }
  }

  private validateOperationsPatch(operationsPatch?: OperationsPatch): void {
    if (!operationsPatch) {
      return;
    }

    const deleteIds = operationsPatch.delete.map((id) => id.valueOf());
    const updateIds = operationsPatch.update.map(({ id }) => id.valueOf());
    const deleteIdSet = new Set(deleteIds);

    // Check for IDs present in both update and delete
    const updateDeleteConflicts = [
      ...new Set(updateIds.filter((id) => deleteIdSet.has(id))),
    ];

    if (updateDeleteConflicts.length > 0) {
      throw new ConflictingOperationIdsError(
        updateDeleteConflicts,
        'IDs found in both update and delete arrays',
      );
    }

    // Check for duplicate IDs within update array
    const updateDuplicates = findDuplicateIds(updateIds);

    if (updateDuplicates.length > 0) {
      throw new ConflictingOperationIdsError(
        updateDuplicates,
        'Duplicate IDs in update array',
      );
    }

    // Check for duplicate IDs within delete array
    const deleteDuplicates = findDuplicateIds(deleteIds);

    if (deleteDuplicates.length > 0) {
      throw new ConflictingOperationIdsError(
        deleteDuplicates,
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

  private applyOperationsPatch(operationsPatch?: OperationsPatch): boolean {
    let isUpdated = false;

    if (!operationsPatch) {
      return isUpdated;
    }

    const { create, delete: deleteIds, update } = operationsPatch;

    if (create.length > 0) {
      isUpdated = true;

      this.addOperations(create);
    }

    if (update.length > 0) {
      isUpdated = true;

      this.updateOperations(update);
    }

    if (deleteIds.length > 0) {
      isUpdated = true;

      this.deleteOperations(deleteIds);
    }

    return isUpdated;
  }

  applyUpdate({ metadata, operations }: UpdateTransactionProps): boolean {
    this.validateUpdateIsAllowed();
    this.validateOperationsPatch(operations);
    this.validateOperationIds(operations);
    this.validateResultingOperationCount(operations);
    this.validateResultingBalance(operations);

    const isMetadataUpdated = this.updateMetadataIfChanged(metadata);

    const isOperationsUpdated = this.applyOperationsPatch(operations);

    if (isMetadataUpdated || isOperationsUpdated) {
      this.validateActiveOperationsBalance();
      this.markUpdated();
    }

    return isMetadataUpdated || isOperationsUpdated;
  }

  getOperations(): Operation[] {
    return this.operations.filter((operation) => !operation.isDeleted());
  }

  getAllOperations(): Operation[] {
    return [...this.operations];
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

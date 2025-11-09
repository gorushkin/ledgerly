import { EntryResponseDTO, OperationResponseDTO } from 'src/application';
import { EntryDbRow } from 'src/db/schemas/entries';

import {
  EntityIdentity,
  EntityTimestamps,
  Id,
  SoftDelete,
  ParentChildRelation,
  Timestamp,
} from '../domain-core';
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

    return new Entry(
      identity,
      timestamps,
      softDelete,
      ownership,
      transactionRelation,
      operations,
    );
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
      transactionId: this.getTransactionId().valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.ownership.getParentId().valueOf(),
    };
  }

  private getOperationsForResponseDTO(): [
    OperationResponseDTO,
    OperationResponseDTO,
  ] {
    const operations = this.operations.reduce(
      (acc, operation) => {
        if (operation.isSystem) {
          return acc;
        }

        acc.push(operation.toResponseDTO());
        return acc;
      },
      [] as unknown as [OperationResponseDTO, OperationResponseDTO],
    );

    if (operations.length !== 2) {
      throw new Error(
        'Entry must have exactly two non-system operations for response DTO',
      );
    }

    return operations;
  }

  toResponseDTO(): EntryResponseDTO {
    const operations = this.getOperationsForResponseDTO();

    return {
      createdAt: this.getCreatedAt().valueOf(),
      id: this.getId().valueOf(),
      operations,
      transactionId: this.getTransactionId().valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.ownership.getParentId().valueOf(),
    };
  }

  addOperations(operations: Operation[]): void {
    this.operations.push(...operations);
  }

  getOperations(): Operation[] {
    return this.operations;
  }
}

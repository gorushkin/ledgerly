import { EntryResponseDTO } from 'src/application';
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

  addOperation(operation: Operation): void {
    console.info('Adding operation to entry:', operation);
    this.operations.push(operation);
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

  toResponseDTO(): EntryResponseDTO {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      id: this.getId().valueOf(),
      operations: this.operations.map((operation) => operation.toResponseDTO()),
      transactionId: this.getTransactionId().valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
    };
  }
}

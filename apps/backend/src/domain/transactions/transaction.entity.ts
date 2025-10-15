import { TransactionDbRow } from 'src/db/schema';

import {
  EntityIdentity,
  EntityTimestamps,
  Id,
  SoftDelete,
  Timestamp,
  UserOwnership,
  DateValue,
} from '../domain-core';

export class Transaction {
  private readonly identity: EntityIdentity;
  private timestamps: EntityTimestamps;
  private softDelete: SoftDelete;
  private readonly ownership: UserOwnership;

  private postingDate: DateValue;
  private transactionDate: DateValue;

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: UserOwnership,
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
    const ownership = UserOwnership.create(userId);

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
    const ownership = UserOwnership.create(Id.fromPersistence(userId));

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
    return this.ownership.belongsToUser(userId);
  }

  getUserId(): Id {
    return this.ownership.getOwnerId();
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

  toRecord(): TransactionDbRow {
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
}

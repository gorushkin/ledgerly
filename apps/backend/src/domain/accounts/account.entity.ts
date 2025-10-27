import { AccountUpdateDTO } from '@ledgerly/shared/types';
import { AccountDbRow, AccountRepoInsert } from 'src/db/schema';

import {
  Amount,
  Currency,
  Id,
  Timestamp,
  Name,
  ParentChildRelation,
  EntityIdentity,
  EntityTimestamps,
  SoftDelete,
} from '../domain-core';
import { User } from '../users/user.entity';

import { AccountType } from './account-type.enum.ts';

export class Account {
  private readonly identity: EntityIdentity;
  private timestamps: EntityTimestamps;
  private softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: ParentChildRelation,
    private name: Name,
    private description: string,
    private initialBalance: Amount,
    private currentClearedBalanceLocal: Amount,
    private currency: Currency,
    private type: AccountType,
  ) {
    this.identity = identity;
    this.timestamps = timestamps;
    this.softDelete = softDelete;
    this.ownership = ownership;
  }

  static create(
    user: User,
    name: Name,
    description: string,
    initialBalance: Amount,
    currency: Currency,
    type: AccountType,
  ): Account {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();

    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    return new Account(
      identity,
      timestamps,
      softDelete,
      ownership,
      name,
      description,
      initialBalance,
      Amount.create('0'),
      currency,
      type,
    );
  }

  static restore(data: AccountDbRow): Account {
    const {
      createdAt,
      currency,
      currentClearedBalanceLocal,
      description,
      id,
      initialBalance,
      isTombstone,
      name,
      type,
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

    return new Account(
      identity,
      timestamps,
      softDelete,
      ownership,
      Name.fromPersistence(name),
      description,
      Amount.create(initialBalance),
      Amount.create(currentClearedBalanceLocal),
      Currency.create(currency),
      AccountType.create(type),
    );
  }

  // Delegation methods for identity
  getId(): Id {
    return this.identity.getId();
  }

  // Delegation methods for timestamps
  getUpdatedAt(): Timestamp {
    return this.timestamps.getUpdatedAt();
  }

  getCreatedAt(): Timestamp {
    return this.timestamps.getCreatedAt();
  }

  private touch(now?: Timestamp): void {
    this.timestamps = this.timestamps.touch(now);
  }

  // Delegation methods for soft delete
  markAsDeleted(): void {
    this.softDelete = this.softDelete.markAsDeleted();
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private validateUpdateIsAllowed(): void {
    this.softDelete.validateUpdateIsAllowed();
  }

  // Delegation methods for ownership
  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  getUserId(): Id {
    return this.ownership.getParentId();
  }

  toPersistence(): AccountRepoInsert {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      currency: this.currency.valueOf(),
      currentClearedBalanceLocal: this.currentClearedBalanceLocal.valueOf(),
      description: this.description,
      id: this.getId().valueOf(),
      initialBalance: this.initialBalance.valueOf(),
      isTombstone: this.softDelete.getIsTombstone(),
      name: this.name.valueOf(),
      type: this.type.valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.ownership.getParentId().valueOf(),
    };
  }

  getType(): AccountType {
    return this.type;
  }

  updateAccount(data: AccountUpdateDTO): void {
    this.validateUpdateIsAllowed();

    const currency = data.currency
      ? Currency.create(data.currency)
      : this.currency;

    const name = data.name ? Name.create(data.name) : this.name;

    this.description = data.description ?? this.description;
    this.type = data.type ? AccountType.create(data.type) : this.type;
    this.currency = currency;
    this.name = name;

    this.touch(Timestamp.create());
  }

  getCurrency(): Currency {
    return this.currency;
  }
}

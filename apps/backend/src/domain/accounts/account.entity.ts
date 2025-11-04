import { AccountResponseDTO, AccountUpdateDTO } from '@ledgerly/shared/types';
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
    private _name: Name,
    private _description: string,
    private _initialBalance: Amount,
    private _currentClearedBalanceLocal: Amount,
    private _currency: Currency,
    private _type: AccountType,
    private _isSystem: boolean,
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

    const isSystem = type.isSystemType();

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
      isSystem,
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
      isSystem,
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
      isSystem,
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
      currency: this._currency.valueOf(),
      currentClearedBalanceLocal: this._currentClearedBalanceLocal.valueOf(),
      description: this._description,
      id: this.getId().valueOf(),
      initialBalance: this._initialBalance.valueOf(),
      isSystem: this._isSystem,
      isTombstone: this.softDelete.getIsTombstone(),
      name: this._name.valueOf(),
      type: this._type.valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.ownership.getParentId().valueOf(),
    };
  }

  getType(): AccountType {
    return this._type;
  }

  updateAccount(data: AccountUpdateDTO): void {
    this.validateUpdateIsAllowed();

    const currency = data.currency
      ? Currency.create(data.currency)
      : this._currency;

    const name = data.name ? Name.create(data.name) : this._name;

    this._description = data.description ?? this._description;
    this._type = data.type ? AccountType.create(data.type) : this._type;
    this._currency = currency;
    this._name = name;

    this.touch(Timestamp.create());
  }

  isCurrencySame(currency: Currency): boolean {
    return this._currency.valueOf() === currency.valueOf();
  }

  get currency(): Currency {
    return this._currency;
  }

  toResponseDTO(): AccountResponseDTO {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      currency: this._currency.valueOf(),
      currentClearedBalanceLocal: this._currentClearedBalanceLocal.valueOf(),
      description: this._description,
      id: this.getId().valueOf(),
      initialBalance: this._initialBalance.valueOf(),
      isSystem: this._isSystem,
      isTombstone: this.softDelete.getIsTombstone(),
      name: this._name.valueOf(),
      type: this._type.valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.ownership.getParentId().valueOf(),
    };
  }
}

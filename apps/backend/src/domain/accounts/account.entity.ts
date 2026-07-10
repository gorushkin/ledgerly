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

import { AccountType } from './account-type.enum';
import { AccountSnapshot, AccountUpdateProps } from './types';

export class Account {
  static readonly entityType = 'account';

  private readonly identity: EntityIdentity;
  private timestamps: EntityTimestamps;
  private softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    softDelete: SoftDelete,
    ownership: ParentChildRelation,
    public name: Name,
    public description: string,
    private initialBalance: Amount,
    // remove currentClearedBalanceLocal from entity and schemas later
    private currentClearedBalanceLocal: Amount,
    public currency: Currency,
    private type: AccountType,
    public isSystem: boolean,
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

  static restore(data: AccountSnapshot): Account {
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

    const identity = EntityIdentity.restore(Id.restore(id));

    const timestamps = EntityTimestamps.restore(
      Timestamp.restore(updatedAt),
      Timestamp.restore(createdAt),
    );

    const softDelete = SoftDelete.restore(isTombstone);

    const ownership = ParentChildRelation.create(
      Id.restore(userId),
      identity.getId(),
    );

    return new Account(
      identity,
      timestamps,
      softDelete,
      ownership,
      Name.restore(name),
      description,
      Amount.restore(initialBalance),
      Amount.restore(currentClearedBalanceLocal),
      Currency.restore(currency),
      AccountType.restore(type),
      isSystem,
    );
  }

  // Delegation methods for identity
  // TODO: remove
  getId(): Id {
    return this.identity.getId();
  }

  get id(): Id {
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

  toSnapshot(): AccountSnapshot {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      currency: this.currency.valueOf(),
      currentClearedBalanceLocal: this.currentClearedBalanceLocal.valueOf(),
      description: this.description,
      id: this.getId().valueOf(),
      initialBalance: this.initialBalance.valueOf(),
      isSystem: this.isSystem,
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

  update(data: AccountUpdateProps): void {
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

  isCurrencySame(currency: Currency): boolean {
    return this.currency.valueOf() === currency.valueOf();
  }

  getCurrency(): Currency {
    return this.currency;
  }
}

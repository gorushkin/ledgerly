import { AccountUpdateDTO } from '@ledgerly/shared/types';
import { AccountDbRow, AccountRepoInsert } from 'src/db/schema';

import {
  Amount,
  BaseEntity,
  Currency,
  Id,
  Timestamp,
  Name,
} from '../domain-core';

import { AccountType } from './account-type.enum.ts';

export class Account extends BaseEntity {
  private constructor(
    public readonly userId: Id,
    public id: Id,
    private name: Name,
    private description: string,
    private initialBalance: Amount,
    private currentClearedBalanceLocal: Amount,
    private currency: Currency,
    private type: AccountType,
    readonly createdAt: Timestamp,

    updatedAt: Timestamp,
  ) {
    super(userId, id, updatedAt, createdAt);
  }

  static create(
    userId: Id,
    name: Name,
    description: string,
    initialBalance: Amount,
    currency: Currency,
    type: AccountType,
  ): Account {
    const now = Timestamp.create();

    return new Account(
      userId,
      Id.create(),
      name,
      description,
      initialBalance,
      Amount.create('0'),
      currency,
      type,
      now,
      now,
    );
  }

  static fromPersistence(data: AccountDbRow): Account {
    const {
      createdAt,
      currency,
      currentClearedBalanceLocal,
      description,
      id,
      initialBalance,
      name,
      type,
      updatedAt,
      userId,
    } = data;

    return new Account(
      Id.fromPersistence(userId),
      Id.fromPersistence(id),
      Name.fromPersistence(name),
      description,
      Amount.create(initialBalance),
      Amount.create(currentClearedBalanceLocal),
      Currency.create(currency),
      AccountType.create(type),
      Timestamp.restore(createdAt),
      Timestamp.restore(updatedAt),
    );
  }

  toPersistence(): AccountRepoInsert {
    return {
      createdAt: this.createdAt.valueOf(),
      currency: this.currency.valueOf(),
      currentClearedBalanceLocal: this.currentClearedBalanceLocal.valueOf(),
      description: this.description,
      id: this.id.valueOf(),
      initialBalance: this.initialBalance.valueOf(),
      isTombstone: this.isTombstone,
      name: this.name.valueOf(),
      type: this.type.valueOf(),
      updatedAt: this.updatedAt.valueOf(),
      userId: this.userId.valueOf(),
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
}

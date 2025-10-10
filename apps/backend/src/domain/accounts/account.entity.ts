import { AccountUpdateDTO, CurrencyCode } from '@ledgerly/shared/types';
import { AccountDbRow, AccountRepoInsert } from 'src/db/schema';

import { Amount, BaseEntity, Id, IsoDatetimeString } from '../domain-core';
import { Currency } from '../domain-core/value-objects/Currency';

import { AccountType } from './account-type.enum.ts';

export class Account extends BaseEntity {
  private constructor(
    public readonly userId: Id,
    public id: Id,
    private name: string,
    private description: string,
    private initialBalance: Amount,
    private currentClearedBalanceLocal: Amount,
    private currency: Currency,
    private type: AccountType,
    readonly createdAt: IsoDatetimeString,

    updatedAt: IsoDatetimeString,
  ) {
    super(userId, id, updatedAt, createdAt);
  }

  private validateName(name?: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Account name cannot be empty');
    }
  }

  static create(
    userId: Id,
    name: string,
    description: string,
    initialBalance: Amount,
    currency: CurrencyCode,
    type: AccountType,
  ): Account {
    this.prototype.validateName(name);
    const now = this.prototype.now;
    const id = this.prototype.getNewId();

    const createdAccount = new Account(
      userId,
      id,
      name,
      description,
      initialBalance,
      Amount.create('0'),
      Currency.create(currency),
      type,
      now,
      now,
    );

    return createdAccount;
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
      name,
      description,
      Amount.create(initialBalance),
      Amount.create(currentClearedBalanceLocal),
      Currency.create(currency),
      AccountType.create(type),
      IsoDatetimeString.restore(createdAt),
      IsoDatetimeString.restore(updatedAt),
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
      name: this.name,
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
    this.validateName(data.name);

    const currency = data.currency
      ? Currency.create(data.currency)
      : this.currency;

    this.description = data.description ?? this.description;
    this.type = data.type ? AccountType.create(data.type) : this.type;
    this.currency = currency;
    this.name = data.name ?? this.name;

    this.touch(this.now);
  }
}

import {
  AccountUpdateDTO,
  CurrencyCode,
  Money,
  UUID,
} from '@ledgerly/shared/types';
import { AccountDbRow, AccountRepoInsert } from 'src/db/schema';

import { BaseEntity, Id, IsoDatetimeString } from '../domain-core';

import { AccountType } from './account-type.enum.ts';

export class Account extends BaseEntity {
  private constructor(
    public readonly userId: Id,
    public readonly id: Id,
    private name: string,
    private description: string,
    private initialBalance: Money,
    private currentClearedBalanceLocal: Money,
    private currency: CurrencyCode,
    private type: AccountType,
    updatedAt?: IsoDatetimeString,
    createdAt?: IsoDatetimeString,
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
    initialBalance: Money,
    currency: CurrencyCode,
    type: AccountType,
  ): Account {
    this.prototype.validateName(name);

    const createdAccount = new Account(
      userId,
      Id.create(),
      name,
      description,
      initialBalance,
      0 as Money,
      currency,
      type,
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
      Id.restore(userId),
      Id.restore(id),
      name,
      description,
      initialBalance as Money,
      currentClearedBalanceLocal as Money,
      currency,
      AccountType.create(type),
      IsoDatetimeString.restore(createdAt),
      IsoDatetimeString.restore(updatedAt),
    );
  }

  toPersistence(): AccountRepoInsert & { id: UUID } {
    return {
      createdAt: this.createdAt.valueOf(),
      currency: this.currency,
      currentClearedBalanceLocal: this.currentClearedBalanceLocal,
      description: this.description,
      id: this.id.valueOf(),
      initialBalance: this.initialBalance,
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

  getName(): string {
    return this.name;
  }

  updateAccount(data: AccountUpdateDTO): void {
    this.validateUpdateIsAllowed();

    this.validateName(data.name);
    this.description = data.description ?? this.description;
    this.type = data.type ? AccountType.create(data.type) : this.type;
    this.currency = data.currency ?? this.currency;
    this.name = data.name ?? this.name;
  }
}

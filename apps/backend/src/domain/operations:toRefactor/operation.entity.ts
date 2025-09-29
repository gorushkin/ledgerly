import { Money } from '@ledgerly/shared/types';

import { Id } from '../domain-core/value-objects/Id';

import { BaseEntity } from '../domain-core/base/base.entity';

export class Operation extends BaseEntity {
  private constructor(
    public readonly userId: Id,
    public readonly id: Id | null,
    public readonly entryId: Id,
    public readonly accountId: Id,
    public readonly amount: Money,
    public readonly isSystem = false,
    public readonly description?: string,
  ) {
    super(userId, id);
  }

  static create(
    userId: Id,
    entryId: Id,
    accountId: Id,
    amount: Money,
    description = '',
    isSystem = false,
  ): Operation {
    if (amount === 0) {
      throw new Error('Operation amount cannot be zero');
    }

    return new Operation(
      userId,
      null,
      entryId,
      accountId,
      amount,
      isSystem,
      description,
    );
  }

  static restore(
    userId: string,
    id: string,
    entryId: string,
    accountId: string,
    amount: Money,
    isSystem: boolean,
    description?: string,
  ): Operation {
    return new Operation(
      Id.create(userId),
      Id.create(id),
      Id.create(entryId),
      Id.create(accountId),
      amount,
      isSystem,
      description,
    );
  }

  isSystemGenerated(): boolean {
    return this.isSystem;
  }

  canBeModified(): boolean {
    return !this.isSystem;
  }

  getDisplayAmount(): string {
    return this.amount.toFixed(2);
  }

  // validateForAccount(
  //   accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
  // ): boolean {
  //   const normalDebitAccounts = ['asset', 'expense'];
  //   const normalCreditAccounts = ['liability', 'equity', 'revenue'];

  //   if (this.isDebit()) {
  //     return normalDebitAccounts.includes(accountType);
  //   } else {
  //     return normalCreditAccounts.includes(accountType);
  //   }
  // }

  withId(id: Id): Operation {
    if (!this.isNew()) {
      throw new Error('Cannot set ID for existing operation');
    }

    return new Operation(
      this.userId,
      id,
      this.entryId,
      this.accountId,
      this.amount,
      this.isSystem,
      this.description,
    );
  }

  // async getCurrency(accountService: AccountService): Promise<string> {
  //   const account = await accountService.getById(this.userId, this.accountId);
  //   if (!account) {
  //     throw new Error(`Account ${this.accountId} not found`);
  //   }
  //   return account.currency;
  // }
}

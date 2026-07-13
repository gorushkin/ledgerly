import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { AccountSnapshot } from 'src/domain/accounts';

export type AccountRepositoryUpdateInput = Partial<
  Pick<
    AccountSnapshot,
    | 'currency'
    | 'currentClearedBalanceLocal'
    | 'description'
    | 'initialBalance'
    | 'isSystem'
    | 'name'
    | 'type'
    | 'updatedAt'
  >
>;

export type AccountRepositorySoftDeleteInput = Pick<
  AccountSnapshot,
  'isTombstone' | 'updatedAt'
>;

export type AccountRepositoryInterface = {
  getAll(userId: UUID): Promise<AccountSnapshot[]>;
  create(data: AccountSnapshot): Promise<AccountSnapshot>;
  getById(userId: UUID, id: UUID): Promise<AccountSnapshot>;
  update(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryUpdateInput,
  ): Promise<AccountSnapshot>;
  delete(
    userId: UUID,
    id: UUID,
    data: AccountRepositorySoftDeleteInput,
  ): Promise<AccountSnapshot>;
  findSystemAccount(
    userId: UUID,
    currency: CurrencyCode,
  ): Promise<AccountSnapshot>;
  ensureUserOwnsAccount(
    userId: UUID,
    accountId: UUID,
  ): Promise<AccountSnapshot>;
  getByIds(userId: UUID, accountIds: UUID[]): Promise<AccountSnapshot[]>;
};

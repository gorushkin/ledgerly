import { UUID } from '@ledgerly/shared/types';
import { AccountSnapshot } from 'src/domain/accounts';

export type AccountRepositoryUpdateInput = Pick<AccountSnapshot, 'updatedAt'> &
  Partial<
    Pick<AccountSnapshot, 'description' | 'initialBalance' | 'name' | 'type'>
  >;

export type AccountRepositorySoftDeleteInput = Pick<
  AccountSnapshot,
  'updatedAt'
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
  ensureUserOwnsAccount(
    userId: UUID,
    accountId: UUID,
  ): Promise<AccountSnapshot>;
  getByIds(userId: UUID, accountIds: UUID[]): Promise<AccountSnapshot[]>;
};

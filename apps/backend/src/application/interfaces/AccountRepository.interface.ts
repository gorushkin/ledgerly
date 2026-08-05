import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';
import { AccountQuery } from '@ledgerly/shared/validation';
import { AccountSnapshot } from 'src/domain/accounts';

export type AccountRepositoryUpdateInput = Pick<AccountSnapshot, 'updatedAt'> &
  Partial<
    Pick<AccountSnapshot, 'description' | 'initialBalance' | 'name' | 'type'>
  >;

export type AccountRepositoryLifecycleInput = { updatedAt: IsoDatetimeString };

export type AccountLifecycleAction = 'close' | 'open';

export type AccountLifecycleUpdateInput = AccountRepositoryLifecycleInput & {
  action: AccountLifecycleAction;
};

export type AccountRepositoryInterface = {
  getAll(userId: UUID, query: AccountQuery): Promise<AccountSnapshot[]>;
  create(userId: UUID, data: AccountSnapshot): Promise<void>;
  getById(userId: UUID, id: UUID): Promise<AccountSnapshot>;
  getByIdForLifecycle(userId: UUID, id: UUID): Promise<AccountSnapshot>;
  update(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryUpdateInput,
  ): Promise<void>;
  delete(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryLifecycleInput,
  ): Promise<void>;
  open(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryLifecycleInput,
  ): Promise<void>;
  close(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryLifecycleInput,
  ): Promise<void>;
  ensureUserOwnsAccount(
    userId: UUID,
    accountId: UUID,
  ): Promise<AccountSnapshot>;
  getByIds(userId: UUID, accountIds: UUID[]): Promise<AccountSnapshot[]>;
};

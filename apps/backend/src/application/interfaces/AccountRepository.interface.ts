import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import {
  AccountDbRow,
  AccountDbUpdate,
  AccountRepoInsert,
} from 'src/db/schema';
export type AccountRepositoryInterface = {
  getAll(userId: UUID): Promise<AccountDbRow[]>;
  create(data: AccountRepoInsert): Promise<AccountDbRow>;
  getById(userId: UUID, id: UUID): Promise<AccountDbRow>;
  update(userId: UUID, id: UUID, data: AccountDbUpdate): Promise<AccountDbRow>;
  delete(userId: UUID, id: UUID): Promise<AccountDbRow>;
  findSystemAccount(
    userId: UUID,
    currency: CurrencyCode,
  ): Promise<AccountDbRow>;
  ensureUserOwnsAccount(userId: UUID, accountId: UUID): Promise<AccountDbRow>;
};

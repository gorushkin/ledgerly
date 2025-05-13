import {
  Account,
  AccountFormValues,
} from '../../../../packages/shared/types/account';

export interface IAccountRepository {
  getAllAccounts(): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | undefined>;
  createAccount(data: AccountFormValues): Promise<Account>;
  updateAccount(id: string, data: AccountFormValues): Promise<Account>;
  deleteAccount(id: string): Promise<Account | undefined>;
}

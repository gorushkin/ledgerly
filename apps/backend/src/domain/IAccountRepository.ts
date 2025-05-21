import { Account, AccountDTO } from 'src/db/schema';

export interface IAccountRepository {
  getAllAccounts(): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | undefined>;
  createAccount(data: AccountDTO): Promise<Account>;
  updateAccount(id: string, data: AccountDTO): Promise<Account>;
  deleteAccount(id: string): Promise<Account | undefined>;
}

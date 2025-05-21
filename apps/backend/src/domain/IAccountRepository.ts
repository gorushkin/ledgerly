import { AccountResponseDTO, AccountCreateDTO } from '@ledgerly/shared/types';

export interface IAccountRepository {
  getAllAccounts(): Promise<AccountResponseDTO[]>;
  getAccountById(id: string): Promise<AccountResponseDTO | undefined>;
  createAccount(data: AccountCreateDTO): Promise<AccountResponseDTO>;
  updateAccount(
    id: string,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO>;
  deleteAccount(id: string): Promise<AccountResponseDTO | undefined>;
}

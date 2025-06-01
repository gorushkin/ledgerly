import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { accounts } from 'src/db';
import { withErrorHandling } from 'src/libs/errorHandler';
import { DataBase } from 'src/types';

export class AccountRepository {
  constructor(private readonly db: DataBase) {}
  async createAccount(data: AccountCreateDTO): Promise<AccountResponseDTO> {
    return withErrorHandling(
      () => this.db.insert(accounts).values(data).returning().get(),
      'Failed to create account',
    );
  }

  async updateAccount(
    id: string,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    return withErrorHandling(
      () =>
        this.db
          .update(accounts)
          .set(data)
          .where(eq(accounts.id, id))
          .returning()
          .get(),
      `Failed to update account with ID ${id}`,
    );
  }

  async deleteAccount(id: string): Promise<AccountResponseDTO | undefined> {
    return withErrorHandling(
      () =>
        this.db.delete(accounts).where(eq(accounts.id, id)).returning().get(),
      `Failed to delete account with ID ${id}`,
    );
  }

  async getAccountById(id: string): Promise<AccountResponseDTO | undefined> {
    return withErrorHandling(
      () => this.db.select().from(accounts).where(eq(accounts.id, id)).get(),
      `Failed to fetch account with ID ${id}`,
    );
  }

  async getAllAccounts(): Promise<AccountResponseDTO[]> {
    return withErrorHandling(
      () => this.db.select().from(accounts).all(),
      'Failed to fetch accounts',
    );
  }
}

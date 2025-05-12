import { AccountFormValues } from "../../../../../packages/shared/types/account";
import { db } from "../../db";
import { accounts } from "../../db/accounts";
import { eq } from "drizzle-orm";

export class AccountController {
  async handleDatabaseOperation(
    operation: () => Promise<any>,
    errorMessage: string
  ) {
    try {
      return await operation();
    } catch (error) {
      console.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  async getAll() {
    return this.handleDatabaseOperation(
      async () => db.select().from(accounts).all(),
      "Failed to fetch accounts"
    );
  }

  async getById(id: string) {
    return this.handleDatabaseOperation(
      async () => db.select().from(accounts).where(eq(accounts.id, id)).get(),
      "Failed to fetch account"
    );
  }

  async create(newAccount: AccountFormValues) {
    return this.handleDatabaseOperation(
      async () => db.insert(accounts).values(newAccount).returning().get(),
      "Failed to create account"
    );
  }

  async update(id: string, updatedAccount: Partial<AccountFormValues>) {
    return this.handleDatabaseOperation(
      async () =>
        db
          .update(accounts)
          .set(updatedAccount)
          .where(eq(accounts.id, id))
          .returning()
          .get(),
      "Failed to update account"
    );
  }

  async delete(id: string) {
    return this.handleDatabaseOperation(
      async () => db.delete(accounts).where(eq(accounts.id, id)).run(),
      "Failed to delete account"
    );
  }
}

export const accountController = new AccountController();

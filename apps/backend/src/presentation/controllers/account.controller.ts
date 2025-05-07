import { db } from "../../db";
import { accounts } from "../../db/accounts";
import { eq } from "drizzle-orm";
import { NewAccount } from "../../../../packages/shared/types/account";

export async function getAllAccounts() {
  try {
    const result = await db.select().from(accounts).all();
    return result;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw new Error("Failed to fetch accounts");
  }
}

export async function getAccountById(id: number) {
  try {
    const result = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .get();
    return result;
  } catch (error) {
    console.error("Error fetching account by ID:", error);
    throw new Error("Failed to fetch account");
  }
}

export async function createAccount(newAccount: NewAccount) {
  try {
    const result = await db
      .insert(accounts)
      .values(newAccount)
      .returning()
      .get();
    return result;
  } catch (error) {
    console.error("Error creating account:", error);
    throw new Error("Failed to create account");
  }
}

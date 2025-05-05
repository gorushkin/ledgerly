import { eq } from "drizzle-orm";
import { entries } from "src/db/entries";
import { IEntryRepository } from "../../domain/IEntryRepository";
import { db } from "src/db";

export class EntryRepository implements IEntryRepository {
  async getAllEntries() {
    return db.select().from(entries);
  }

  async getEntryById(id: number) {
    return db.select().from(entries).where(eq(entries.id, id)).get();
  }

  async createEntry(data: any) {
    return db.insert(entries).values(data).returning();
  }

  async updateEntry(id: number, data: any) {
    return db.update(entries).set(data).where(eq(entries.id, id)).returning();
  }

  async deleteEntry(id: number) {
    await db.delete(entries).where(eq(entries.id, id));
  }
}

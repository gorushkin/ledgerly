import { eq } from 'drizzle-orm';
import { entries } from '../../db/schemas/entries';
import type { IEntryRepository } from '../../domain/IEntryRepository';
import { db } from '../../db';

export class EntryRepository implements IEntryRepository {
  async getAllEntries() {
    return db.select().from(entries);
  }
  async getEntryById(id: number) {
    return db.select().from(entries).where(eq(entries.id, id)).get();
  }
  async createEntry(data: unknown) {
    const result = await db
      .insert(entries)
      .values(data as any)
      .returning();
    return result[0];
  }
  async updateEntry(id: number, data: unknown) {
    await db
      .update(entries)
      .set(data as any)
      .where(eq(entries.id, id));
  }
  async deleteEntry(id: number) {
    await db.delete(entries).where(eq(entries.id, id));
  }
}

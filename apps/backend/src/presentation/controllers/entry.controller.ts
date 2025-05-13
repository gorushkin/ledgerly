import { eq } from 'drizzle-orm';

import { db } from '../../db';
import { entries } from '../../db/schemas/entries';

export async function getAllEntries() {
  try {
    const result = await db.select().from(entries);
    return result;
  } catch (error) {
    console.error('Error fetching entries:', error);
    throw new Error('Failed to fetch entries');
  }
}

export function getEntryById(id: number) {
  try {
    const result = db.select().from(entries).where(eq(entries.id, id)).get();

    return result;
  } catch (error) {
    console.error('Error fetching entry by ID:', error);
    throw new Error('Failed to fetch entry');
  }
}

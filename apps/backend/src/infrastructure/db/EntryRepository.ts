import type { IEntryRepository } from '../../domain/IEntryRepository';

export class EntryRepository implements IEntryRepository {
  getAllEntries(): Promise<unknown[]> {
    throw new Error('Method not implemented.');
  }
  getEntryById(_id: number): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  createEntry(_data: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  updateEntry(_id: number, _data: unknown): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteEntry(_id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

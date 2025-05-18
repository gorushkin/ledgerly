export interface IEntryRepository {
  getAllEntries(): Promise<unknown[]>;
  getEntryById(id: number): Promise<unknown>;
  createEntry(data: unknown): Promise<unknown>;
  updateEntry(id: number, data: unknown): Promise<void>;
  deleteEntry(id: number): Promise<void>;
}

export interface IEntryRepository {
  getAllEntries(): Promise<any[]>;
  getEntryById(id: number): Promise<any | null>;
  createEntry(data: any): Promise<any>;
  updateEntry(id: number, data: any): Promise<any>;
  deleteEntry(id: number): Promise<void>;
}

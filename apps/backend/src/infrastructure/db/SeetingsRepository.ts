import { SettingsResponseDTO } from '@ledgerly/shared/types';
import { settings } from 'src/db/schemas';
import { DataBase } from 'src/types';

export class SettingsRepository {
  constructor(private readonly db: DataBase) {}

  getSettings(): Promise<SettingsResponseDTO[]> {
    return this.db.select().from(settings).all();
  }

  updateSettings(_data: SettingsResponseDTO): Promise<SettingsResponseDTO> {
    throw new Error('Method not implemented.');
  }
}

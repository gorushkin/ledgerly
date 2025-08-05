import { SettingsResponseDTO } from '@ledgerly/shared/types';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class SettingsRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  getSettings(): Promise<SettingsResponseDTO[]> {
    return this.executeDatabaseOperation(() => {
      throw new Error('Method not implemented.');
    }, 'Failed to fetch settings');
  }

  updateSettings(_data: SettingsResponseDTO): Promise<SettingsResponseDTO> {
    throw new Error('Method not implemented.');
  }
}

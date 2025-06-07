import { SettingsResponseDTO } from '@ledgerly/shared/types';
import { settings } from 'src/db/schemas';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class SettingsRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  getSettings(): Promise<SettingsResponseDTO[]> {
    return this.withErrorHandling(
      () => this.db.select().from(settings).all(),
      'Failed to fetch settings',
    );
  }

  updateSettings(_data: SettingsResponseDTO): Promise<SettingsResponseDTO> {
    throw new Error('Method not implemented.');
  }
}

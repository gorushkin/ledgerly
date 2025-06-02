import { TransactionResponseDTO } from '@ledgerly/shared/types';
import { SettingsRepository } from 'src/infrastructure/db/SeetingsRepository';

export class SettingsController {
  constructor(private readonly repo: SettingsRepository) {}

  getAll() {
    return this.repo.getSettings();
  }

  update(_id: string, _updatedAccount: TransactionResponseDTO) {
    throw new Error('Method update not implemented.');
  }

  delete(_id: string) {
    throw new Error('Method delete not implemented.');
  }
}

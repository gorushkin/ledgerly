import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { AccountRepositoryInterface } from 'src/application/interfaces';
import { DataBase } from 'src/db';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class GetAccountByIdUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

  async execute(
    user: User,
    id: UUID,
    _tx?: DataBase,
  ): Promise<AccountResponseDTO> {
    return this.ensureAccountExistsAndOwned(user, id);
  }
}

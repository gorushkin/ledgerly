import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { AccountMapper } from 'src/application/mappers';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../../interfaces';

import { AccountUseCaseBase } from './accountBase';

export class DeleteAccountUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

  async execute(user: User, accountId: UUID): Promise<AccountResponseDTO> {
    await this.ensureAccountExistsAndOwned(user, accountId);

    const deletedAccount = await this.accountRepository.delete(
      user.id,
      accountId,
    );

    return AccountMapper.toResponseDTO(AccountMapper.toDomain(deletedAccount));
  }
}

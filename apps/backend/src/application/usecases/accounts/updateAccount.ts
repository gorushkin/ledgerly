import {
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { AccountMapper } from 'src/application/mappers';
import { User } from 'src/domain/users/user.entity';
import { AccountRepository } from 'src/infrastructure/db/';

import { AccountUseCaseBase } from './accountBase';

export class UpdateAccountUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepository) {
    super(accountRepository);
  }

  async execute(
    user: User,
    accountId: UUID,
    data: AccountUpdateDTO,
  ): Promise<AccountResponseDTO> {
    const accountData = await this.ensureAccountExistsAndOwned(user, accountId);

    const account = AccountMapper.toDomain(accountData);

    account.updateAccount(AccountMapper.toUpdateData(data));

    const updatedAccount = await this.accountRepository.update(
      user.id,
      accountId,
      AccountMapper.toDBRow(account),
    );

    return AccountMapper.toResponseDTO(AccountMapper.toDomain(updatedAccount));
  }
}

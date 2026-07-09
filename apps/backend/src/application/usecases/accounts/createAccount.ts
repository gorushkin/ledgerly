import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import { AccountMapper } from 'src/application/mappers';
import { AccountFactory } from 'src/application/services';
import { User } from 'src/domain/users/user.entity';

export class CreateAccountUseCase {
  constructor(protected readonly accountFactory: AccountFactory) {}

  async execute(
    user: User,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    const { currency, description, initialBalance, name, type } = data;

    const account = await this.accountFactory.createAccount(user, {
      currency,
      description,
      initialBalance,
      name,
      type,
    });

    return AccountMapper.toResponseDTO(account);
  }
}

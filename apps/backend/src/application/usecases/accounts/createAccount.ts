import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  CommodityRepositoryInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { AccountType, Account, Commodity } from 'src/domain/';
import { Amount, Name } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

export class CreateAccountUseCase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly commodityRepository: CommodityRepositoryInterface,
  ) {}
  async execute(
    user: User,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    const { commodityId, description, initialBalance, name, type } = data;

    const commoditySnapshot = await this.commodityRepository.getById(
      user.getId().valueOf(),
      commodityId,
    );

    const commodity = Commodity.restore(commoditySnapshot);

    const account = Account.create(user, {
      commodityId: commodity.getId(),
      description,
      initialBalance: Amount.create(initialBalance),
      name: Name.create(name),
      type: AccountType.create(type),
    });

    const accountSnapshot = account.toSnapshot();

    await this.accountRepository.create(accountSnapshot);

    return AccountMapper.toResponseDTOFromSnapshot(accountSnapshot);
  }
}

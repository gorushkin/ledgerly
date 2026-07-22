import {
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import type {
  CommodityRepositoryInterface,
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionMapper } from 'src/application/mappers';
import { TransactionContextLoader } from 'src/application/services/TransactionService';
import { Commodity, User } from 'src/domain';
import { Transaction } from 'src/domain/transactions';

export class CreateTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly transactionContextLoader: TransactionContextLoader,
    protected readonly commodityRepository: CommodityRepositoryInterface,
  ) {}

  async execute(
    user: User,
    data: CreateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    const { commodityId, operations } = data;
    const createdTransaction = await this.transactionManager.run(async () => {
      const commoditySnapshot = await this.commodityRepository.getById(
        user.getId().valueOf(),
        commodityId,
      );

      const context = await this.transactionContextLoader.loadContext(
        user,
        operations,
      );

      const createTransactionProps = TransactionMapper.toCreateTransactionProps(
        data,
        context,
      );

      const commodity = Commodity.restore(commoditySnapshot);

      const transaction = Transaction.create(
        user.getId(),
        commodity,
        createTransactionProps,
      );

      await this.transactionRepository.create(
        user.getId().valueOf(),
        transaction,
      );

      return transaction;
    });

    return TransactionMapper.toResponseDTO(createdTransaction);
  }
}

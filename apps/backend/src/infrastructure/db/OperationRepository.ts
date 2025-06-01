import {
  OperationCreateDTO,
  OperationResponseDTO,
} from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { operations } from 'src/db/schemas';
import { DataBase } from 'src/types';

export class OperationRepository {
  constructor(private readonly db: DataBase) {}

  getAll(): Promise<OperationResponseDTO[]> {
    throw new Error('Method not implemented.');
  }

  getById(_id: string): Promise<OperationResponseDTO | undefined> {
    throw new Error('Method not implemented.');
  }

  create(_dto: OperationCreateDTO): Promise<OperationResponseDTO> {
    throw new Error('Method not implemented.');
  }
  update(_id: number, _data: unknown): Promise<OperationResponseDTO> {
    throw new Error('Method not implemented.');
  }
  delete(_id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getByTransactionId(
    transactionId: string,
  ): Promise<OperationResponseDTO[]> {
    const transactionOperations = await this.db
      .select()
      .from(operations)
      .where(eq(operations.transactionId, transactionId));

    return transactionOperations;
  }
}

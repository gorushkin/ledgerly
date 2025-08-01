import {
  OperationCreateDTO,
  OperationResponseDTO,
} from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { operationsTable } from 'src/db/schemas';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class OperationRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

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
      .from(operationsTable)
      .where(eq(operationsTable.transactionId, transactionId));

    return transactionOperations;
  }
}

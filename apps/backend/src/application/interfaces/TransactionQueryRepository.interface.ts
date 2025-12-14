import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { TransactionWithRelations } from 'src/db/schema';

/**
 * Query repository for read-only transaction operations.
 * Returns DTOs optimized for display without full domain model restoration.
 */
export type TransactionQueryRepositoryInterface = {
  /**
   * Find transaction by ID with all related entries and operations
   */
  findById(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionWithRelations | null>;

  /**
   * Find all transactions with optional filtering
   */
  findAll(
    userId: UUID,
    query?: TransactionQueryParams,
  ): Promise<TransactionWithRelations[]>;
};

import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';

import { TransactionReadModel } from '../read-models';

export type PaginatedResult<T> = {
  items: T[];
  total: number;
};

/**
 * Query repository for read-only transaction operations.
 * Returns application read models without restoring domain aggregates.
 */
export type TransactionQueryRepositoryInterface = {
  /**
   * Find transaction by ID with all related entries and operations
   */
  findById(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionReadModel | null>;

  /**
   * Find all transactions with optional filtering
   */
  findAll(
    userId: UUID,
    query: TransactionQueryParams,
  ): Promise<PaginatedResult<TransactionReadModel>>;
};

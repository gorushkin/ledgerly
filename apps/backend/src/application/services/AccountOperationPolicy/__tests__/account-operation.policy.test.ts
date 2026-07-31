import { type UUID } from '@ledgerly/shared/types';
import { AccountHasActiveOperationsError } from 'src/application/application.errors';
import type { OperationRepositoryInterface } from 'src/application/interfaces';
import { AccountOperationPolicy } from 'src/application/services/AccountOperationPolicy';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AccountOperationPolicy', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000' as UUID;
  const accountId = '550e8400-e29b-41d4-a716-446655440001' as UUID;

  const operationRepository = {
    existsActiveByAccountId: vi.fn(),
  };

  const policy = new AccountOperationPolicy(
    operationRepository as unknown as OperationRepositoryInterface,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows account operations when the account has no active operations', async () => {
    operationRepository.existsActiveByAccountId.mockResolvedValueOnce(false);

    await expect(
      policy.assertNoActiveOperations(userId, accountId),
    ).resolves.toBeUndefined();

    expect(operationRepository.existsActiveByAccountId).toHaveBeenCalledWith(
      userId,
      accountId,
    );
  });

  it('rejects account operations when the account has active operations', async () => {
    operationRepository.existsActiveByAccountId.mockResolvedValueOnce(true);

    const assertion = policy.assertNoActiveOperations(userId, accountId);

    await expect(assertion).rejects.toBeInstanceOf(
      AccountHasActiveOperationsError,
    );
    await expect(assertion).rejects.toMatchObject({
      context: { accountId },
    });

    expect(operationRepository.existsActiveByAccountId).toHaveBeenCalledWith(
      userId,
      accountId,
    );
  });

  it('propagates repository lookup errors', async () => {
    const repositoryError = new Error('repository unavailable');

    operationRepository.existsActiveByAccountId.mockRejectedValueOnce(
      repositoryError,
    );

    await expect(
      policy.assertNoActiveOperations(userId, accountId),
    ).rejects.toBe(repositoryError);
  });
});

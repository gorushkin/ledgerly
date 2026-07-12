import { apiErrorCodes, MoneyString } from '@ledgerly/shared/types';
import {
  CreateOperationRequestDTO,
  UpdateOperationRequestDTO,
} from 'src/application/dto';
import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils';
import { User } from 'src/domain';
import {
  AccountNotFoundInContextError,
  InvalidAmountError,
} from 'src/domain/domain.errors';
import type { OperationSnapshot } from 'src/domain/operations';
import { beforeAll, describe, expect, it } from 'vitest';

import { OperationMapper } from './operation.mapper';

describe('OperationMapper', () => {
  let user: User;
  let validCreateDTO: CreateOperationRequestDTO;
  let validUpdateDTO: UpdateOperationRequestDTO;
  let transactionContext: ReturnType<
    typeof TransactionBuilder.request
  >['transactionContext'];

  beforeAll(async () => {
    user = await createUser();

    const fixture = TransactionBuilder.request({
      accounts: ['USD'],
      operations: [
        { accountKey: 'USD', amount: '100', description: 'Debit' },
        { accountKey: 'USD', amount: '-100', description: 'Credit' },
      ],
      user,
    });

    transactionContext = fixture.transactionContext;
    validCreateDTO = fixture.transactionDTO.operations[0];
    validUpdateDTO = {
      ...validCreateDTO,
      id: crypto.randomUUID() as UpdateOperationRequestDTO['id'],
    };
  });

  it('maps an operation snapshot to a persistence row', () => {
    const { operations } = TransactionBuilder.transaction({
      accounts: ['USD'],
      operations: [
        { accountKey: 'USD', amount: '100', description: 'Debit' },
        { accountKey: 'USD', amount: '-100', description: 'Credit' },
      ],
      user,
    });
    const operation = operations[0];
    const snapshot: OperationSnapshot = operation.toSnapshot();

    expect(OperationMapper.toDBRowFromSnapshot(snapshot)).toEqual({
      accountId: snapshot.accountId,
      amount: snapshot.amount,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isSystem: snapshot.isSystem,
      isTombstone: snapshot.isTombstone,
      transactionId: snapshot.transactionId,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      value: snapshot.value,
    });
  });

  describe('toCreateOperationProps', () => {
    it('should reject an invalid amount', () => {
      expect(() =>
        OperationMapper.toCreateOperationProps(
          {
            ...validCreateDTO,
            amount: 'NaN' as MoneyString,
          },
          transactionContext,
        ),
      ).toThrow(InvalidAmountError);
    });

    it('returns ACCOUNT_NOT_FOUND_IN_CONTEXT for an unknown account', () => {
      const accountId =
        crypto.randomUUID() as CreateOperationRequestDTO['accountId'];

      try {
        OperationMapper.toCreateOperationProps(
          { ...validCreateDTO, accountId },
          transactionContext,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(AccountNotFoundInContextError);
        expect(error).toMatchObject({
          code: apiErrorCodes.accountNotFoundInContext,
          context: {
            accountId,
            operationId: 'new-operation',
          },
        });
        return;
      }

      throw new Error('Expected AccountNotFoundInContextError to be thrown');
    });
  });

  describe('toUpdateOperationProps', () => {
    it('should reject an invalid value', () => {
      expect(() =>
        OperationMapper.toUpdateOperationProps(
          {
            ...validUpdateDTO,
            value: 'Infinity' as MoneyString,
          },
          transactionContext,
        ),
      ).toThrow(InvalidAmountError);
    });
  });
});

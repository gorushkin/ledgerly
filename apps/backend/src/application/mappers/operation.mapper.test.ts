import { apiErrorCodes, MoneyString } from '@ledgerly/shared/types';
import {
  CreateOperationRequestDTO,
  UpdateOperationRequestDTO,
} from 'src/application/dto';
import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils';
import {
  AccountNotFoundInContextError,
  InvalidAmountError,
} from 'src/domain/domain.errors';
import { beforeAll, describe, expect, it } from 'vitest';

import { OperationMapper } from './operation.mapper';

describe('OperationMapper', () => {
  let validCreateDTO: CreateOperationRequestDTO;
  let validUpdateDTO: UpdateOperationRequestDTO;
  let transactionContext: ReturnType<
    typeof TransactionBuilder.request
  >['transactionContext'];

  beforeAll(async () => {
    const user = await createUser();

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

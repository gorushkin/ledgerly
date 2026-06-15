import { createUser } from 'src/db/createTestUser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { prettyPrint } from './prettyPrint';
import { TransactionBuilder } from './testEntityBuilder';

describe('prettyPrint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints an operation in PTA format', async () => {
    const user = await createUser();
    const data = TransactionBuilder.transaction({
      accounts: ['USD'],
      operations: [
        {
          accountKey: 'USD',
          amount: '10000',
          description: 'Test operation',
        },
        {
          accountKey: 'USD',
          amount: '-10000',
          description: 'Balancing operation',
        },
      ],
      user,
    });
    const consoleInfo = vi
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);

    const result = prettyPrint.operationPTA(
      data.operations[0],
      data.accountsMap,
    );

    expect(result).toBeUndefined();
    expect(consoleInfo).toHaveBeenCalledOnce();
    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringContaining('Account USD'),
    );
  });

  it('prints a transaction in PTA format', async () => {
    const user = await createUser();
    const data = TransactionBuilder.transaction({
      accounts: ['USD', 'EUR'],
      operations: [
        {
          accountKey: 'USD',
          amount: '10000',
          description: 'Debit operation',
        },
        {
          accountKey: 'EUR',
          amount: '-9000',
          description: 'Credit operation',
          value: '-10000',
        },
      ],
      user,
    });
    const consoleInfo = vi
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);
    const result = prettyPrint.transactionPTA(
      data.transaction,
      data.accountsMap,
    );

    expect(result).toBeUndefined();
    expect(consoleInfo).toHaveBeenCalledOnce();
    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringContaining('Currency'),
    );
    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining('Debit'));
    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining('Credit'));
    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringContaining('Debit operation'),
    );
    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringContaining('Credit operation'),
    );
    expect(consoleInfo).toHaveBeenCalledWith(expect.stringContaining('Total'));

    const output = String(consoleInfo.mock.calls[0]?.[0]);
    const lines = output.split('\n');
    const debitOperation = lines.find((line) =>
      line.includes('Debit operation'),
    );
    const creditOperation = lines.find((line) =>
      line.includes('Credit operation'),
    );
    const total = lines.find((line) => line.includes('Total'));

    expect(debitOperation).toMatch(/USD\s+100\.00\s*$/);
    expect(creditOperation).toMatch(/EUR\s+90\.00$/);
    expect(total).toMatch(/USD\s+100\.00\s+100\.00$/);
    expect(lines.indexOf(total!)).toBeGreaterThan(
      lines.indexOf(creditOperation!),
    );
  });
});

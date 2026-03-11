// Pretty-print transaction in PTA format
import { UUID } from '@ledgerly/shared/types';
import { Account, Operation, Transaction } from 'src/domain';
import { AmountFormatter } from 'src/presentation/formatters';
const formatter = new AmountFormatter();

const getAccountInfo = (
  accountId: UUID,
  accountMap?: Map<UUID, Account>,
): { currency: string; name: string } => {
  if (!accountMap) {
    return { currency: 'N/A', name: 'Unknown Account' };
  }
  const account = accountMap.get(accountId);

  if (!account) {
    return { currency: 'N/A', name: 'Unknown Account' };
  }
  return { currency: account.currency.valueOf(), name: account.name.valueOf() };
};

function printOperationPTA(
  operation: Operation,
  accountMap?: Map<UUID, Account>,
): string {
  const { currency, name } = getAccountInfo(
    operation.getAccountId().valueOf(),
    accountMap,
  );
  const formattedAmount = formatter.formatForTable(operation.amount, 'en-US');
  return `  ${name.padEnd(20)} ${operation.description.padEnd(50)} ${formattedAmount} ${currency}`;
}

/**
 * Prints a transaction in PTA (Posting-Transaction-Account) format.
 * Example:
 *   2025-12-11 Test Transaction
 *     Account1      100 USD
 *     Account2     -100 EUR
 */
function printTransactionPTA(
  transaction: Transaction,
  accountMap?: Map<UUID, Account>,
): string {
  const lines: string[] = [];
  lines.push(
    `${transaction.getTransactionDate().valueOf()} ${transaction.description}`,
  );
  transaction.getOperations().forEach((operation) => {
    lines.push(printOperationPTA(operation, accountMap));
  });
  return lines.join('\n');
}

export const prettyPrint = {
  operationPTA: printOperationPTA,
  transactionPTA: printTransactionPTA,
};

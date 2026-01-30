// Pretty-print transaction in PTA format
import { UUID } from '@ledgerly/shared/types';
import { Account, Entry, Transaction } from 'src/domain';
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

/**
 * Prints an entry in PTA (Posting-Transaction-Account) format.
 * Example:
 *   Account1      100 USD
 *   Account2     -100 EUR
 */
export function printEntryPTA(
  entry: Entry,
  accountMap?: Map<UUID, Account>,
): string {
  const lines: string[] = [];
  lines.push(entry.description);
  entry.getOperations().forEach((op) => {
    const { currency, name } = getAccountInfo(
      op.getAccountId().valueOf(),
      accountMap,
    );

    const amount = formatter.formatForTable(op.amount, 'en-US');
    lines.push(
      `  ${name.padEnd(20)} ${op.description.padEnd(20)} ${amount} ${currency}`,
    );
  });
  return lines.join('\n');
}
/**
 * Prints a transaction in PTA (Posting-Transaction-Account) format.
 * Example:
 *   2025-12-11 Test Transaction
 *     Account1      100 USD
 *     Account2     -100 EUR
 */
export function printTransactionPTA(
  transaction: Transaction,
  accountMap?: Map<UUID, Account>,
): string {
  const lines: string[] = [];
  lines.push(
    `${transaction.getTransactionDate().valueOf()} ${transaction.description}`,
  );
  transaction.getEntries().forEach((entry) => {
    lines.push(printEntryPTA(entry, accountMap));
  });
  return lines.join('\n');
}

export const prettyPrint = {
  entryPTA: printEntryPTA,
  transactionPTA: printTransactionPTA,
};

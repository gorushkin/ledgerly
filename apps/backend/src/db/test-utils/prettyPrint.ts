// Pretty-print transaction in PTA format
import { Entry, Transaction } from 'src/domain';
import { AmountFormatter } from 'src/presentation/formatters';
const formatter = new AmountFormatter();

/**
 * Prints an entry in PTA (Posting-Transaction-Account) format.
 * Example:
 *   Account1      100 USD
 *   Account2     -100 EUR
 */
export function printEntryPTA(entry: Entry): string {
  const lines: string[] = [];
  entry.getOperations().forEach((op) => {
    const amount = formatter.formatForTable(op.amount, 'en-US');
    lines.push(
      `  ${op.accountName.padEnd(20)} ${op.description.padEnd(20)} ${amount} ${op.currency}`,
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
export function printTransactionPTA(transaction: Transaction): string {
  const lines: string[] = [];
  lines.push(
    `${transaction.getTransactionDate().valueOf()} ${transaction.description}`,
  );
  transaction.getEntries().forEach((entry) => {
    lines.push(printEntryPTA(entry));
  });
  return lines.join('\n');
}

export const prettyPrint = {
  entryPTA: printEntryPTA,
  transactionPTA: printTransactionPTA,
};

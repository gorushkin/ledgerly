// Pretty-print transaction in PTA format
import { Transaction } from 'src/domain';
import { AmountFormatter } from 'src/presentation/formatters';
const formatter = new AmountFormatter();
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
    entry.getOperations().forEach((op) => {
      const amount = formatter.formatForTable(op.amount, 'en-US');

      lines.push(
        `  ${op.accountName.padEnd(20)} ${op.description.padEnd(20)} ${amount} ${op.currency}`,
      );
    });
  });

  return lines.join('\n');
}

// Format and print transactions in PTA format
import { UUID } from '@ledgerly/shared/types';
import { Account, Operation, Transaction } from 'src/domain';
import { Amount } from 'src/domain/domain-core';
import { AmountFormatter } from 'src/presentation/formatters';
const formatter = new AmountFormatter();
const amountColumnWidth = 15;

const formatAmountColumn = (amount?: Amount): string =>
  amount
    ? formatter.format(amount).padStart(amountColumnWidth)
    : ''.padStart(amountColumnWidth);

const formatDebitCredit = (
  amount: Amount,
): { credit: string; debit: string } => ({
  credit: formatAmountColumn(amount.isNegative() ? amount.negate() : undefined),
  debit: formatAmountColumn(amount.isPositive() ? amount : undefined),
});

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

function formatOperationPTA(
  operation: Operation,
  accountMap?: Map<UUID, Account>,
): string {
  const { currency, name } = getAccountInfo(
    operation.getAccountId().valueOf(),
    accountMap,
  );
  const { credit, debit } = formatDebitCredit(operation.amount);
  return `  ${name.padEnd(20)} ${operation.description.padEnd(50)} ${currency.padEnd(8)} ${debit} ${credit}`;
}

/**
 * Formats a transaction in PTA (Posting-Transaction-Account) format.
 * Example:
 *   2025-12-11 Test Transaction
 *     Account              Description                                        Currency           Debit          Credit
 *     Account1             Debit operation                                    USD               100.00
 *     Account2             Credit operation                                   EUR                               90.00
 *     Total                                                                       USD            100.00          100.00
 */
function formatTransactionPTA(
  transaction: Transaction,
  accountMap?: Map<UUID, Account>,
): string {
  const { credit, debit } = transaction.getOperations().reduce(
    (totals, operation) => {
      if (operation.value.isPositive()) {
        totals.debit = totals.debit.add(operation.value);
      } else if (operation.value.isNegative()) {
        totals.credit = totals.credit.add(operation.value.negate());
      }

      return totals;
    },
    {
      credit: Amount.create('0'),
      debit: Amount.create('0'),
    },
  );
  const lines: string[] = [];
  lines.push(
    `${transaction.getTransactionDate().valueOf()} ${transaction.description}`,
  );
  lines.push(
    `  ${'Account'.padEnd(20)} ${'Description'.padEnd(50)} ${'Currency'.padEnd(8)} ${'Debit'.padStart(amountColumnWidth)} ${'Credit'.padStart(amountColumnWidth)}`,
  );
  transaction.getOperations().forEach((operation) => {
    lines.push(formatOperationPTA(operation, accountMap));
  });
  lines.push(
    `  ${'Total'.padEnd(20)} ${''.padEnd(50)} ${transaction.currency.valueOf().padEnd(8)} ${formatAmountColumn(debit)} ${formatAmountColumn(credit)}`,
  );
  return lines.join('\n');
}

function printOperationPTA(
  operation: Operation,
  accountMap?: Map<UUID, Account>,
): void {
  console.info(formatOperationPTA(operation, accountMap));
}

function printTransactionPTA(
  transaction: Transaction,
  accountMap?: Map<UUID, Account>,
): void {
  console.info(formatTransactionPTA(transaction, accountMap));
}

export const prettyPrint = {
  operationPTA: printOperationPTA,
  transactionPTA: printTransactionPTA,
};

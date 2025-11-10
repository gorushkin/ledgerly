import { OperationResponseDTO } from 'src/application';
import {
  EntryOperationsResponseDTO,
  EntryResponseDTO,
} from 'src/application/dto/entry.dto';
import { TransactionResponseDTO } from 'src/application/dto/transaction.dto';
import { EntryDbRow, OperationDbRow, TransactionDbRow } from 'src/db/schema';

export class TransactionViewMapper {
  static toView(
    transaction: TransactionDbRow,
    entries: (EntryDbRow & { operations: OperationDbRow[] })[],
  ): TransactionResponseDTO {
    return {
      createdAt: transaction.createdAt,
      description: transaction.description,
      entries: entries.map(this.mapEntry.bind(this)),
      id: transaction.id,
      postingDate: transaction.postingDate,
      transactionDate: transaction.transactionDate,
      updatedAt: transaction.updatedAt,
      userId: transaction.userId,
    };
  }

  private static mapEntry(
    entry: EntryDbRow & { operations: OperationDbRow[] },
  ): EntryResponseDTO {
    const entryOperations = entry.operations
      .filter((op) => !op.isSystem)
      .map(this.mapOperation.bind(this));

    if (entryOperations.length !== 2) {
      throw new Error(
        `Entry with id ${entry.id} must have exactly 2 non-system operations, but got ${entryOperations.length}.`,
      );
    }

    const operations: EntryOperationsResponseDTO = [
      entryOperations[0],
      entryOperations[1],
    ];

    return {
      createdAt: entry.createdAt,
      id: entry.id,
      operations: operations,
      transactionId: entry.transactionId,
      updatedAt: entry.updatedAt,
      userId: entry.userId,
    };
  }

  private static mapOperation(op: OperationDbRow): OperationResponseDTO {
    return {
      accountId: op.accountId,
      amount: op.amount,
      createdAt: op.createdAt,
      description: op.description,
      entryId: op.entryId,
      id: op.id,
      updatedAt: op.updatedAt,
      userId: op.userId,
    };
  }

  //   // You can use MoneyAmount here
  //   const totalValue = transaction.entries
  //     .flatMap((e) => e.operations)
  //     .filter((op) => !op.isSystem)
  //     .reduce((acc, op) => acc + op.amount.value, 0);

  //   // можно использовать MoneyAmount здесь
  //   return totalValue.toFixed(2);
  // }
}

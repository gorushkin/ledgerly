import { UUID } from '@ledgerly/shared/types';
import { z } from 'zod';

import { BaseEntity } from '../domain-core/base/base.entity';
import {
  Operation,
  OperationType,
} from '../operations:toRefactor/operation.entity.js';

export type EntryData = {
  id: UUID | null;
  transactionId: UUID;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Zod схемы для валидации
const DescriptionSchema = z
  .string()
  .trim()
  .min(1, 'Description cannot be empty')
  .max(255, 'Description cannot exceed 255 characters');

const TransactionIdSchema = z.string().min(1, 'Transaction ID is required');

/**
 * Entry - бухгалтерская проводка, группирующая операции дебета и кредита
 * В рамках одной проводки сумма всех дебетовых операций должна равняться сумме кредитовых
 */
export class Entry extends BaseEntity {
  private _operations: Operation[] = [];

  private constructor(
    userId: UUID,
    id: UUID | null,
    private readonly _transactionId: UUID,
    private _description: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(userId, id);
  }

  // Геттеры
  get transactionId(): UUID {
    return this._transactionId;
  }

  get description(): string {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get operations(): readonly Operation[] {
    return [...this._operations];
  }

  readonly canBeModified = true; // Entry можно модифицировать в любой момент

  updateDescription(description: string): void {
    if (!this.canBeModified) {
      throw new Error('Entry cannot be modified');
    }

    const validatedDescription = DescriptionSchema.parse(description);

    this._description = validatedDescription;
    this._updatedAt = new Date();
  }

  // Управление операциями
  addOperation(
    accountId: UUID,
    amount: number,
    type: OperationType,
    description?: string,
    isSystem = false,
  ): Operation {
    if (!this.canBeModified) {
      throw new Error('Entry cannot be modified');
    }

    if (!this.id) {
      throw new Error('Entry must be saved before adding operations');
    }

    const operation = Operation.create(
      this.userId,
      this.id,
      accountId,
      amount,
      type,
      description,
      isSystem,
    );

    this._operations.push(operation);
    this._updatedAt = new Date();

    return operation;
  }

  removeOperation(operationId: UUID): boolean {
    if (!this.canBeModified) {
      throw new Error('Entry cannot be modified');
    }

    const index = this._operations.findIndex((op) => op.id === operationId);
    if (index === -1) {
      return false;
    }

    const operation = this._operations[index];
    if (!operation.canBeModified()) {
      throw new Error('Cannot remove system operation');
    }

    this._operations.splice(index, 1);
    this._updatedAt = new Date();

    return true;
  }

  getOperation(operationId: UUID): Operation | undefined {
    return this._operations.find((op) => op.id === operationId);
  }

  clearOperations(): void {
    if (!this.canBeModified) {
      throw new Error('Entry cannot be modified');
    }

    const systemOperations = this._operations.filter(
      (op) => !op.canBeModified(),
    );
    if (systemOperations.length > 0) {
      throw new Error(
        'Cannot clear operations: some operations are system-generated',
      );
    }

    if (this._operations.length > 0) {
      this._operations = [];
      this._updatedAt = new Date();
    }
  }

  // Бизнес-правила для операций
  getDebitOperations(): Operation[] {
    return this._operations.filter((op) => op.isDebit());
  }

  getCreditOperations(): Operation[] {
    return this._operations.filter((op) => op.isCredit());
  }

  getTotalDebitAmount(): number {
    return this.getDebitOperations().reduce((sum, op) => sum + op.amount, 0);
  }

  getTotalCreditAmount(): number {
    return this.getCreditOperations().reduce((sum, op) => sum + op.amount, 0);
  }

  // Главное бизнес-правило: дебет должен равняться кредиту
  isBalanced(): boolean {
    const debitTotal = this.getTotalDebitAmount();
    const creditTotal = this.getTotalCreditAmount();
    return Math.abs(debitTotal - creditTotal) < 0.01; // Учитываем плавающую точку
  }

  hasOperations(): boolean {
    return this._operations.length > 0;
  }

  get operationsCount(): number {
    return this._operations.length;
  }

  canBeDeleted(): boolean {
    return this._operations.every((op) => op.canBeModified());
  }

  // Валидация всей проводки
  validateBusinessRules(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.hasOperations()) {
      errors.push('Entry must have at least one operation');
    } else {
      if (!this.isBalanced()) {
        errors.push(
          `Entry is not balanced: debit ${this.getTotalDebitAmount()}, credit ${this.getTotalCreditAmount()}`,
        );
      }

      if (!this.getDebitOperations().length) {
        errors.push('Entry must have at least one debit operation');
      }

      if (!this.getCreditOperations().length) {
        errors.push('Entry must have at least one credit operation');
      }
    }

    return {
      errors,
      isValid: errors.length === 0,
    };
  }

  // Фабричные методы
  static create(
    userId: UUID,
    data: Pick<EntryData, 'transactionId' | 'description'>,
  ): Entry {
    const now = new Date();

    const validatedTransactionId = TransactionIdSchema.parse(
      data.transactionId,
    );

    // Для создания Entry описание может быть пустым
    const description = data.description?.trim() ?? '';
    if (description.length > 255) {
      throw new Error('Description cannot exceed 255 characters');
    }

    return new Entry(
      userId,
      null, // ID будет сгенерирован базой данных
      validatedTransactionId as UUID,
      description,
      now,
      now,
    );
  }

  static restore(
    userId: UUID,
    data: EntryData,
    operations: Operation[] = [],
  ): Entry {
    if (!data.id) {
      throw new Error('ID is required for existing entry');
    }

    if (!data.transactionId) {
      throw new Error('Transaction ID is required');
    }

    if (!data.createdAt) {
      throw new Error('Creation date is required for existing entry');
    }

    if (!data.updatedAt) {
      throw new Error('Update date is required for existing entry');
    }

    const description = data.description?.trim() ?? '';

    const entry = new Entry(
      userId,
      data.id,
      data.transactionId,
      description,
      data.createdAt,
      data.updatedAt,
    );

    // Добавляем операции при восстановлении
    entry._operations = [...operations];

    return entry;
  }

  // Сериализация для сохранения в базу
  toData(): EntryData {
    return {
      createdAt: this._createdAt,
      description: this._description || undefined,
      id: this.id,
      transactionId: this._transactionId,
      updatedAt: this._updatedAt,
    };
  }

  // Метод для установки ID после сохранения в БД
  withId(id: UUID): Entry {
    if (!this.isNew()) {
      throw new Error('Entry already has an ID');
    }

    const entry = new Entry(
      this.userId,
      id,
      this._transactionId,
      this._description,
      this._createdAt,
      this._updatedAt,
    );

    // Переносим операции с обновленным entryId
    entry._operations = this._operations.map((op) => op.withId(op.id!));

    return entry;
  }

  // Проверка равенства
  equals(other: Entry): boolean {
    if (this.id && other.id) {
      return this.id === other.id;
    }

    // Если один имеет ID, а другой нет - они не равны
    if (this.id || other.id) {
      return false;
    }

    // Для новых объектов сравниваем по содержимому
    return (
      this._transactionId === other._transactionId &&
      this._description === other._description &&
      this._operations.length === other._operations.length
    );
  }
}

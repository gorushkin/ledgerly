// import { UUID } from '@ledgerly/shared/types';
// import { z, ZodError } from 'zod';

// import { BaseEntity } from '../domain-core/base/base.entity';
// import { Entry, EntryData } from './Entry.js';

// export type TransactionData = {
//   id: UUID | null;
//   userId: UUID;
//   description: string;
//   createdAt?: Date;
//   updatedAt?: Date;
//   entries?: EntryData[];
// };

// // Zod схемы для валидации
// const TransactionDescriptionSchema = z
//   .string()
//   .trim()
//   .min(1, 'Description is required')
//   .max(500, 'Description cannot exceed 500 characters');

// const UserIdSchema = z.string().min(1, 'User ID is required');

// /**
//  * Transaction - агрегатный корень для управления бухгалтерскими транзакциями
//  * Каждая транзакция содержит одну или несколько проводок (Entry)
//  * Обеспечивает бизнес-правило: сумма всех дебетовых операций = сумме всех кредитовых операций
//  */
// export class Transaction extends BaseEntity {
//   private _entries: Entry[] = [];

//   private constructor(
//     userId: UUID,
//     id: UUID | null,
//     private _description: string,
//     private readonly _createdAt: Date,
//     private _updatedAt: Date,
//   ) {
//     super(userId, id);
//   }

//   // Геттеры
//   get description(): string {
//     return this._description;
//   }

//   get createdAt(): Date {
//     return this._createdAt;
//   }

//   get updatedAt(): Date {
//     return this._updatedAt;
//   }

//   get entries(): readonly Entry[] {
//     return [...this._entries];
//   }

//   get entriesCount(): number {
//     return this._entries.length;
//   }

//   // Бизнес-методы
//   readonly canBeModified = true; // Transaction можно модифицировать

//   updateDescription(description: string): void {
//     if (!this.canBeModified) {
//       throw new Error('Transaction cannot be modified');
//     }

//     try {
//       const validatedDescription =
//         TransactionDescriptionSchema.parse(description);
//       this._description = validatedDescription;
//     } catch (error) {
//       if (error instanceof ZodError) {
//         const issue = error.issues[0];
//         if (issue.code === 'too_big') {
//           throw new Error('Description cannot exceed 500 characters');
//         }
//         // Для too_small и других ошибок используем стандартное сообщение
//         throw new Error('Description cannot be empty');
//       }
//       throw error;
//     }

//     this._updatedAt = new Date();
//   }

//   addEntry(entryData: Pick<EntryData, 'description'>): Entry {
//     if (!this.canBeModified) {
//       throw new Error('Transaction cannot be modified');
//     }

//     if (!this.id) {
//       throw new Error('Transaction must be saved before adding entries');
//     }

//     const entry = Entry.create(this.userId, {
//       description: entryData.description,
//       transactionId: this.id,
//     });

//     this._entries.push(entry);
//     this._updatedAt = new Date();

//     return entry;
//   }

//   removeEntry(entryId: UUID): boolean {
//     if (!this.canBeModified) {
//       throw new Error('Transaction cannot be modified');
//     }

//     const initialLength = this._entries.length;
//     this._entries = this._entries.filter((entry) => entry.id !== entryId);

//     if (this._entries.length !== initialLength) {
//       this._updatedAt = new Date();
//       return true;
//     }

//     return false;
//   }

//   getEntry(entryId: UUID): Entry | undefined {
//     return this._entries.find((entry) => entry.id === entryId);
//   }

//   clearEntries(): void {
//     if (!this.canBeModified) {
//       throw new Error('Transaction cannot be modified');
//     }

//     if (this._entries.length > 0) {
//       this._entries = [];
//       this._updatedAt = new Date();
//     }
//   }

//   // Валидация бизнес-правил
//   validateBusinessRules(): { isValid: boolean; errors: string[] } {
//     const errors: string[] = [];

//     // Минимум одна проводка
//     if (this._entries.length === 0) {
//       errors.push('Transaction must have at least one entry');
//     }

//     // Каждая проводка должна иметь описание
//     const entriesWithoutDescription = this._entries.filter(
//       (entry) => !entry.description || entry.description.trim().length === 0,
//     );
//     if (entriesWithoutDescription.length > 0) {
//       errors.push('All entries must have descriptions');
//     }

//     return {
//       errors,
//       isValid: errors.length === 0,
//     };
//   }

//   // Фабричные методы
//   static create(
//     data: Pick<TransactionData, 'userId' | 'description'>,
//   ): Transaction {
//     const now = new Date();

//     // Валидируем данные отдельно для более точной обработки ошибок
//     let validatedUserId: string;
//     let validatedDescription: string;

//     try {
//       validatedUserId = UserIdSchema.parse(data.userId);
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw new Error('User ID is required');
//       }
//       throw error;
//     }

//     try {
//       validatedDescription = TransactionDescriptionSchema.parse(
//         data.description,
//       );
//     } catch (error) {
//       if (error instanceof ZodError) {
//         const issue = error.issues[0];
//         if (issue.code === 'too_big') {
//           throw new Error('Description cannot exceed 500 characters');
//         }
//         // Для too_small и других ошибок используем стандартное сообщение
//         throw new Error('Description is required');
//       }
//       throw error;
//     }

//     return new Transaction(
//       validatedUserId as UUID,
//       null, // ID будет сгенерирован базой данных
//       validatedDescription,
//       now,
//       now,
//     );
//   }

//   static restore(data: TransactionData): Transaction {
//     if (!data.id) {
//       throw new Error('ID is required for existing transaction');
//     }

//     // Валидируем данные отдельно для более точной обработки ошибок
//     let validatedUserId: string;
//     let validatedDescription: string;

//     try {
//       validatedUserId = UserIdSchema.parse(data.userId);
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw new Error('User ID is required');
//       }
//       throw error;
//     }

//     try {
//       validatedDescription = TransactionDescriptionSchema.parse(
//         data.description,
//       );
//     } catch (error) {
//       if (error instanceof ZodError) {
//         const issue = error.issues[0];
//         if (issue.code === 'too_big') {
//           throw new Error('Description cannot exceed 500 characters');
//         }
//         // Для too_small и других ошибок используем стандартное сообщение
//         throw new Error('Description is required');
//       }
//       throw error;
//     }

//     if (!data.createdAt) {
//       throw new Error('Creation date is required for existing transaction');
//     }

//     if (!data.updatedAt) {
//       throw new Error('Update date is required for existing transaction');
//     }

//     const transaction = new Transaction(
//       data.id,
//       validatedUserId as UUID,
//       validatedDescription,
//       data.createdAt,
//       data.updatedAt,
//     );

//     // Восстанавливаем entries если они есть
//     if (data.entries && data.entries.length > 0) {
//       transaction._entries = data.entries.map((entryData) =>
//         Entry.restore(transaction.userId, entryData),
//       );
//     }

//     return transaction;
//   }

//   // Методы для работы с ID (для сохранения в базу)
//   withId(id: UUID): Transaction {
//     if (this.id !== null) {
//       throw new Error('Transaction already has an ID');
//     }

//     const transaction = new Transaction(
//       this.userId,
//       id,
//       this._description,
//       this._createdAt,
//       this._updatedAt,
//     );

//     // Копируем entries
//     transaction._entries = [...this._entries];

//     return transaction;
//   }

//   // Сериализация для сохранения в базу
//   toData(): TransactionData {
//     return {
//       createdAt: this._createdAt,
//       description: this._description,
//       entries: this._entries.map((entry) => entry.toData()),
//       id: this.id,
//       updatedAt: this._updatedAt,
//       userId: this.userId,
//     };
//   }

//   // Проверка равенства
//   equals(other: Transaction): boolean {
//     if (this.id && other.id) {
//       return this.id === other.id;
//     }

//     // Если один имеет ID, а другой нет - они не равны
//     if (this.id || other.id) {
//       return false;
//     }

//     // Для новых объектов сравниваем по содержимому
//     return (
//       this.userId === other.userId && this._description === other._description
//     );
//   }
// }

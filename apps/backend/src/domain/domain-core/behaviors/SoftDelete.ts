/**
 * Поведение для управления мягким удалением сущности
 */
export class SoftDelete {
  constructor(private isTombstone = false) {}

  /**
   * Помечает сущность как удаленную
   */
  markAsDeleted(): void {
    this.isTombstone = true;
  }

  /**
   * Проверяет, удалена ли сущность
   */
  isDeleted(): boolean {
    return this.isTombstone;
  }

  /**
   * Проверяет, можно ли обновлять сущность
   */
  validateUpdateIsAllowed(): void {
    if (this.isTombstone) {
      throw new Error('Cannot update a deleted entity');
    }
  }

  /**
   * Возвращает статус удаления для сериализации
   */
  getIsTombstone(): boolean {
    return this.isTombstone;
  }

  /**
   * Создает новый экземпляр SoftDelete
   */
  static create(): SoftDelete {
    return new SoftDelete(false);
  }

  /**
   * Восстанавливает экземпляр из базы данных
   */
  static fromPersistence(isTombstone: boolean): SoftDelete {
    return new SoftDelete(isTombstone);
  }
}

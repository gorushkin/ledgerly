import { describe, it, expect } from 'vitest';

import { SoftDelete } from '../SoftDelete';

describe('SoftDelete', () => {
  it('должен создать новый экземпляр SoftDelete', () => {
    const softDelete = SoftDelete.create();

    expect(softDelete).toBeInstanceOf(SoftDelete);
    expect(softDelete.isDeleted()).toBe(false);
  });

  it('должен быть иммутабельным при пометке как удаленного', () => {
    const original = SoftDelete.create();
    const deleted = original.markAsDeleted();

    // Оригинальный экземпляр должен остаться неизменным
    expect(original.isDeleted()).toBe(false);

    // Новый экземпляр должен быть помечен как удаленный
    expect(deleted.isDeleted()).toBe(true);

    // Это должны быть разные объекты
    expect(original).not.toBe(deleted);
  });

  it('должен быть заморожен (Object.freeze)', () => {
    const softDelete = SoftDelete.create();

    expect(Object.isFrozen(softDelete)).toBe(true);
  });

  it('должен корректно работать с getIsTombstone', () => {
    const active = SoftDelete.create();
    const deleted = active.markAsDeleted();

    expect(active.getIsTombstone()).toBe(false);
    expect(deleted.getIsTombstone()).toBe(true);
  });

  it('должен валидировать возможность обновления', () => {
    const active = SoftDelete.create();
    const deleted = active.markAsDeleted();

    // Активная сущность должна разрешать обновления
    expect(() => active.validateUpdateIsAllowed()).not.toThrow();

    // Удаленная сущность должна запрещать обновления
    expect(() => deleted.validateUpdateIsAllowed()).toThrow(
      'Cannot update a deleted entity',
    );
  });

  it('markAsDeleted должен возвращать новый экземпляр даже для уже удаленной сущности', () => {
    const deleted1 = SoftDelete.create().markAsDeleted();
    const deleted2 = deleted1.markAsDeleted();

    expect(deleted1).not.toBe(deleted2);
    expect(deleted1.isDeleted()).toBe(true);
    expect(deleted2.isDeleted()).toBe(true);
  });
});

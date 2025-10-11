import { describe, it, expect, vi } from 'vitest';

import { Timestamp } from '../../value-objects/Timestamp';
import { EntityTimestamps } from '../EntityTimestamps';

describe('EntityTimestamps', () => {
  it('должен создать новый экземпляр EntityTimestamps', () => {
    const timestamps = EntityTimestamps.create();

    expect(timestamps).toBeInstanceOf(EntityTimestamps);
    expect(timestamps.getCreatedAt()).toBeInstanceOf(Timestamp);
    expect(timestamps.getUpdatedAt()).toBeInstanceOf(Timestamp);
    expect(timestamps.getCreatedAt().valueOf()).toBe(
      timestamps.getUpdatedAt().valueOf(),
    );
  });

  it('должен быть иммутабельным при обновлении времени', () => {
    const original = EntityTimestamps.create();
    const newTimestamp = Timestamp.restore('2024-01-01T00:00:00.000Z');

    // Получаем исходные значения
    const originalCreatedAt = original.getCreatedAt();
    const originalUpdatedAt = original.getUpdatedAt();

    // Вызываем touch
    const updated = original.touch(newTimestamp);

    // Оригинальный экземпляр должен остаться неизменным
    expect(original.getCreatedAt()).toBe(originalCreatedAt);
    expect(original.getUpdatedAt()).toBe(originalUpdatedAt);

    // Новый экземпляр должен иметь обновленное время
    expect(updated.getCreatedAt()).toBe(originalCreatedAt); // createdAt не меняется
    expect(updated.getUpdatedAt()).toBe(newTimestamp); // updatedAt обновился

    // Это должны быть разные объекты
    expect(original).not.toBe(updated);
  });

  it('должен быть заморожен (Object.freeze)', () => {
    const timestamps = EntityTimestamps.create();

    expect(Object.isFrozen(timestamps)).toBe(true);
  });

  it('должен корректно создаваться с заданным временем создания', () => {
    const createdAt = Timestamp.restore('2024-01-01T00:00:00.000Z');
    const timestamps = EntityTimestamps.create(createdAt);

    expect(timestamps.getCreatedAt()).toBe(createdAt);
    expect(timestamps.getUpdatedAt()).toBe(createdAt);
  });

  it('должен корректно восстанавливаться из persistence', () => {
    const createdAt = Timestamp.restore('2024-01-01T00:00:00.000Z');
    const updatedAt = Timestamp.restore('2024-01-02T00:00:00.000Z');

    const timestamps = EntityTimestamps.fromPersistence(updatedAt, createdAt);

    expect(timestamps.getCreatedAt()).toBe(createdAt);
    expect(timestamps.getUpdatedAt()).toBe(updatedAt);
  });

  it('touch() должен использовать текущее время если не передано', () => {
    // Мокаем Timestamp.create() чтобы контролировать время
    const mockTimestamp = Timestamp.restore('2024-01-01T12:00:00.000Z');
    const createSpy = vi
      .spyOn(Timestamp, 'create')
      .mockReturnValue(mockTimestamp);

    const original = EntityTimestamps.create();
    createSpy.mockClear(); // Очищаем вызовы от create()

    const updated = original.touch();

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(updated.getUpdatedAt()).toBe(mockTimestamp);

    createSpy.mockRestore();
  });

  it('touch() с новым временем должен возвращать новый экземпляр даже с тем же временем', () => {
    const sameTime = Timestamp.restore('2024-01-01T00:00:00.000Z');
    const timestamps1 = EntityTimestamps.create(sameTime);
    const timestamps2 = timestamps1.touch(sameTime);

    expect(timestamps1).not.toBe(timestamps2);
    expect(timestamps1.getUpdatedAt().valueOf()).toBe(
      timestamps2.getUpdatedAt().valueOf(),
    );
    expect(timestamps1.getCreatedAt()).toBe(timestamps2.getCreatedAt());
  });
});

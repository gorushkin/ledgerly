// vitest.integration.config.ts
import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      src: path.resolve(__dirname, './src'),
    },
  },

  test: {
    // Покрытие кода
    coverage: {
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/test-*', '**/__tests__/**'],
      include: [
        'src/infrastructure/repositories/**/*.ts',
        'src/domain/**/*.ts',
        'src/__tests__/**/*.ts',
      ],
      provider: 'v8',
    },
    // Окружение
    environment: 'node',
    exclude: ['**/*.unit.test.ts', 'node_modules/**'],
    // Глобальная настройка
    globals: true,

    hookTimeout: 10000,
    include: [
      'src/infrastructure/repositories/**/*.ts',
      'src/domain/**/*.ts',
      'src/application/**/*.ts',
      'src/__tests__/**/*.ts',
    ],

    // include: ['**/*.integration.test.ts'],

    // Изоляция тестов
    isolate: true,

    // Конфигурация для интеграционных тестов
    name: 'integration',

    // Тайм-ауты для интеграционных тестов (больше чем для unit)
    testTimeout: 10000,
  },
});

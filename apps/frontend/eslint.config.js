import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import pluginRouter from '@tanstack/eslint-plugin-router';
import { baseConfig, commonIgnores } from '../../eslint.base.config.js';

export default tseslint.config(
  { ignores: commonIgnores },
  {
    ...baseConfig,
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...pluginRouter.configs['flat/recommended'],
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      ...baseConfig.languageOptions,
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      ...baseConfig.plugins,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
    },
    rules: {
      ...baseConfig.rules,
      // Override base config for frontend
      '@typescript-eslint/consistent-type-definitions': 'off',

      // React-specific rules
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/exhaustive-deps': 'error',

      // Frontend-specific import order with React prioritization
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          pathGroupsExcludedImportTypes: ['react'],
          pathGroups: [
            {
              pattern: '{react,react-dom/**}',
              group: 'external',
              position: 'before',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
    },
  }
);

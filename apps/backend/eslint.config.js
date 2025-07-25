import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-plugin-prettier';
import perfectionist from 'eslint-plugin-perfectionist';
import importOrder from 'eslint-plugin-import';
import pluginDrizzle from 'eslint-plugin-drizzle';
import js from '@eslint/js';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  globalIgnores(['.config/*']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    plugins: {
      'unused-imports': unusedImports,
      prettier,
      perfectionist,
      'typescript-eslint': tseslint.plugin,
      import: importOrder,
      pluginDrizzle,
    },
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'no-console': ['warn', { allow: ['error', 'info'] }],
      'unused-imports/no-unused-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      'perfectionist/sort-objects': 'warn',
      'max-len': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
        },
      ],
      'prettier/prettier': [
        'error',
        {
          bracketSpacing: true,
        },
      ],
    },
  },
);

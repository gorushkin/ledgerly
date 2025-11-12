import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';
import pluginDrizzle from 'eslint-plugin-drizzle';
import { baseConfig, commonIgnores } from '../../eslint.base.config.js';

export default tseslint.config(
  { ignores: commonIgnores },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  globalIgnores(['.config/*']),
  {
    ...baseConfig,
    languageOptions: {
      ...baseConfig.languageOptions,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      ...baseConfig.plugins,
      drizzle: pluginDrizzle,
    },
    rules: {
      ...baseConfig.rules,

      // Backend-specific rules can be added or overridden here
    },
  },
);

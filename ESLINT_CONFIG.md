# Shared ESLint Configuration

This file contains the base ESLint configuration shared across all packages in the Ledgerly monorepo.

## Structure

- **`eslint.base.config.js`** - Base configuration with common rules
- Individual package configs extend and override as needed:
  - `apps/backend/eslint.config.js` - Backend-specific rules (includes Drizzle plugin)
  - `apps/frontend/eslint.config.js` - Frontend-specific rules (includes React plugins)
  - `packages/shared/eslint.config.js` - Shared package rules (includes interface sorting)

## Base Configuration Includes

- TypeScript ESLint recommended rules
- Prettier integration
- Import sorting and unused imports detection
- Perfectionist plugin for object sorting
- Consistent TypeScript type definitions (`type` over `interface`)
- Common code style rules

## Usage

Each package imports the base config and can override or extend rules:

```javascript
import { baseConfig, commonIgnores } from '../../eslint.base.config.js';

export default tseslint.config(
  { ignores: commonIgnores },
  {
    ...baseConfig,
    rules: {
      ...baseConfig.rules,
      // Package-specific overrides here
    },
  },
);
```

## Adding New Rules

To add a rule that should apply to all packages, add it to `eslint.base.config.js`.

To add a package-specific rule, add it to that package's `eslint.config.js`.

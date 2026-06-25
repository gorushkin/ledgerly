# Repository Rules

## Git Branch Naming

All work branches must start with the Jira project key `LED-`, followed by the
issue number and a concise kebab-case description. For example:
`LED-77-decouple-database-errors`.

## Module Public API

When a module directory exposes an `index.ts`, code outside that module must
import through the `index.ts` public API instead of deep-importing internal
files. Internal files within the same module may import each other directly.

For example, prefer:

```ts
import { HttpApiError, UnauthorizedError } from 'src/presentation/errors';
```

over:

```ts
import { HttpApiError } from 'src/presentation/errors/HttpError';
import { UnauthorizedError } from 'src/presentation/errors/auth.errors';
```

This keeps module boundaries explicit, makes refactors easier, and avoids
runtime class identity issues for `instanceof` checks.

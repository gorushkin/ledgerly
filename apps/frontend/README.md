# Ledgerly Frontend

This package is intentionally reduced to a placeholder React app.

The previous frontend was removed because it drifted from the current backend
domain model. New frontend work should start from `src/App.tsx` and add
frameworks, routing, state management, and API clients back only when they are
needed.

## Development

```bash
pnpm --filter @ledgerly/frontend dev
pnpm --filter @ledgerly/frontend build
pnpm --filter @ledgerly/frontend ts-check
```

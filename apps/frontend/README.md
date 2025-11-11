# Ledgerly Frontend

React-based frontend application for personal finance management.

## Tech Stack

- **React 19** with TypeScript
- **TanStack Router** for routing
- **MobX** for state management
- **React Hook Form** for form handling
- **Tailwind CSS + DaisyUI** for styling
- **Vite** for build tooling

## Architecture

### Project Structure
```
src/
  entities/      # Business entities and models
  features/      # Feature-specific components
  pages/         # Page components
  routes/        # Route definitions (TanStack Router)
  shared/        # Shared utilities and components
  widgets/       # Complex reusable components
```

### State Management
- **MobX** stores for reactive state management
- **mobx-react-lite** for React integration
- Stores organized by domain entities

### Routing
- File-based routing with TanStack Router
- Type-safe navigation
- Automatic route generation

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm --filter frontend dev

# Build for production
pnpm --filter frontend build
```

## Key Features

- Account management (Asset, Liability, Income, Expense)
- Transaction tracking with split entries
- Multi-currency support
- Income/Expense account-based classification
- User profile management

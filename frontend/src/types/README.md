# Type Definitions

This directory contains all TypeScript type definitions for the PawfectPal frontend application. The types are organized by feature domain for better maintainability and separation of concerns.

## Structure

```
types/
├── index.ts            # Re-exports all types from feature modules
├── common.ts           # Common types used across features
├── auth/               # Authentication and user-related types
│   ├── index.ts        # Re-exports all auth types
│   └── auth.ts         # Auth-related types and interfaces
├── pets/               # Pet-related types
│   ├── index.ts        # Re-exports all pet types
│   └── pet.ts          # Pet-related types and interfaces
├── tasks/              # Task-related types
│   ├── index.ts        # Re-exports all task types
│   └── task.ts         # Task-related types and interfaces
├── services/           # Service-related types
│   ├── index.ts        # Re-exports all service types
│   └── service.ts      # Service-related types and interfaces
├── location/           # Location and tracking types
│   ├── index.ts        # Re-exports all location types
│   └── location.ts     # Location-related types and interfaces
├── analytics/          # Analytics and reporting types
│   ├── index.ts        # Re-exports all analytics types
│   └── analytics.ts    # Analytics-related types and interfaces
├── notifications/      # Notification-related types
│   ├── index.ts        # Re-exports all notification types
│   └── notification.ts # Notification-related types and interfaces
└── external/           # External API types
    ├── index.ts        # Re-exports all external API types
    └── external.ts     # External API types and interfaces
```

## Usage

Import types directly from their feature modules:

```typescript
// Import specific types from their feature modules
import { Pet } from '../types/pets';
import { Task } from '../types/tasks';
import { User } from '../types/auth';
import { Service } from '../types/services';
import { Coordinates } from '../types/location';

// For multiple types from the same module
import { Pet, PetVaccine } from '../types/pets';

// For all types from a module (use sparingly)
import * as PetTypes from '../types/pets';
```

### Example: Using Types in Components

```typescript
import React from 'react';
import { Pet } from '../types/pets';
import { Task } from '../types/tasks';

interface PetCardProps {
  pet: Pet;
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, tasks, onTaskComplete }) => {
  // Component implementation
};
```

## Type Organization Guidelines

1. **Feature-based Modules**: Each feature has its own directory with related types.
2. **Index Files**: Each directory has an `index.ts` that re-exports the types for easier imports.
3. **Common Types**: Shared types that don't belong to a specific feature go in `common.ts`.
4. **Naming Conventions**:
   - Interface names are PascalCase (e.g., `Pet`, `Task`).
   - Type names are PascalCase with a `Type` suffix if needed (e.g., `TaskStatusType`).
   - Enum names are PascalCase (e.g., `NotificationType`).
5. **Documentation**: Each type should have JSDoc comments explaining its purpose and usage.

## Adding New Types

1. Identify the feature domain the type belongs to.
2. Add the type to the appropriate file in the corresponding feature directory.
3. Update the `index.ts` in that directory to export the new type.
4. If the type is used across multiple features, consider adding it to `common.ts`.

## Best Practices

- **Keep types close to where they're used**: Place types in the feature directory they belong to.
- **Avoid circular dependencies**: Be careful with imports between feature modules.
- **Use interfaces for public API types**: This allows for declaration merging if needed.
- **Use type aliases for complex types**: Especially for union/intersection types.
- **Document all types**: Add JSDoc comments to explain the purpose and usage of each type.
- **Keep types in sync with the backend**: Ensure type definitions match the API responses and requests.

## Type Safety Tips

- Use `type` for simple type aliases and union/intersection types.
- Use `interface` for object shapes that may be extended or implemented.
- Use `as const` for literal types that shouldn't change.
- Use `Readonly<T>` for immutable data structures.
- Use `Partial<T>` for optional properties in update operations.

## Common Patterns

### API Response Types

```typescript
// For successful responses
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

// For error responses
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
```

### Paginated Data

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### Form Data

```typescript
interface PetFormData {
  name: string;
  species: string;
  breed: string;
  birthDate?: string;
  // ... other fields
}

// For form submission
type PetFormSubmit = Omit<PetFormData, 'id' | 'createdAt' | 'updatedAt'>;
```

## Testing Types

Consider using `@ts-expect-error` and `@ts-check` in your test files to ensure type safety in your tests:

```typescript
// @ts-check
import { Pet } from '../types/pets';

describe('Pet', () => {
  it('should require a name', () => {
    // @ts-expect-error - name is required
    const pet: Pet = {
      species: 'dog',
      breed: 'Labrador',
    };
    
    expect(pet.name).toBeUndefined();
  });
});
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes the following settings for optimal type checking:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Troubleshooting

- **Type errors**: Check that all required properties are provided.
- **Import errors**: Ensure the type is exported from the module's index file.
- **Circular dependencies**: Break circular dependencies by moving shared types to `common.ts`.
- **Type widening**: Use `as const` for literal types that should not be widened.

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

# Services

This directory contains all the API service modules for the PawfectPal frontend application. The services are organized by feature domain for better maintainability and separation of concerns.

## Structure

```
services/
├── api.ts                # Core API utilities and request helpers
├── auth/                 # Authentication related services
│   └── authService.ts    # Login, register, logout, etc.
├── pets/                 # Pet management services
│   └── petService.ts     # CRUD operations for pets, location tracking
├── tasks/                # Task management services
│   └── taskService.ts    # CRUD operations for tasks
├── vaccines/             # Vaccine related services
│   └── vaccineService.ts # Vaccine and age restriction management
├── services/             # Service booking services
│   └── serviceService.ts # Service management and booking
├── location/             # Location services
│   └── locationService.ts# Geolocation and distance calculations
└── external/             # External API integrations
    └── externalApiService.ts # External API calls (e.g., breed info)
```

## Usage

Import services from the main `services` directory:

```typescript
import { 
  login, 
  getPets, 
  createTask,
  getCurrentLocation 
} from '../services';

// Or import specific services directly
import { getDogBreedInfo } from '../services/external/externalApiService';
```

## API Request Pattern

All API services follow a consistent pattern using the `apiRequest` utility:

```typescript
import { apiRequest } from './api';

export const getResource = async (): Promise<ResourceType> => {
  return apiRequest<ResourceType>('/api/endpoint');
};

export const createResource = async (data: ResourceData): Promise<ResourceType> => {
  return apiRequest<ResourceType>('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

## Error Handling

All API errors are handled consistently through the `handleApiError` utility, which throws errors with status codes and error messages from the server when available.

## Authentication

Authentication headers are automatically added to all API requests through the `apiRequest` utility. The token is retrieved from local storage.

## File Uploads

For file uploads, use the `FormData` API and include the file directly in the request body. See `petService.ts` and `taskService.ts` for examples.

## Location Services

The location services provide wrappers around the browser's Geolocation API with consistent error handling and TypeScript types.

## External APIs

External API integrations are isolated in the `external` directory. These services handle communication with third-party APIs and should be the only place where these integrations occur.

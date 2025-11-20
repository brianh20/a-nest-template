# Database Connection Testing

This project includes comprehensive testing for PostgreSQL database connectivity with health check endpoints.

## Overview

The database connection functionality is implemented in the `DatabaseModule` which provides a `DatabaseService` for managing PostgreSQL connections using the `pg` library. A `HealthController` exposes HTTP endpoints to check database connectivity.

The application uses NestJS `ConfigModule` from `@nestjs/config` to manage environment variables following NestJS best practices.

## Files Created

### Database Layer
- **[src/database/database.service.ts](src/database/database.service.ts)** - Service for managing database connections
- **[src/database/database.module.ts](src/database/database.module.ts)** - NestJS module that exports the DatabaseService
- **[src/database/database.service.spec.ts](src/database/database.service.spec.ts)** - Unit tests for the DatabaseService
- **[test/database-connection.e2e-spec.ts](test/database-connection.e2e-spec.ts)** - E2E tests for actual database connectivity

### Health Check Endpoints
- **[src/health/health.controller.ts](src/health/health.controller.ts)** - Controller with health check endpoints
- **[src/health/health.controller.spec.ts](src/health/health.controller.spec.ts)** - Unit tests for health endpoints
- **[test/health.e2e-spec.ts](test/health.e2e-spec.ts)** - E2E tests for health endpoints

## Configuration

### Environment Variable

The database connection uses the `DATABASE_URL` environment variable with the following format:

```
postgresql://username:password@host:port/database
```

### Example

```bash
export DATABASE_URL="postgresql://aguanteRiver:aguanteRiver@localhost:5401/aguanteRiver"
```

Or create a `.env` file (see [.env.example](.env.example)):

```env
DATABASE_URL=postgresql://aguanteRiver:aguanteRiver@localhost:5401/aguanteRiver
```

## Health Check Endpoints

The application exposes HTTP endpoints to check the health of the application and database connectivity.

### GET /health

Returns the basic health status of the application.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T14:00:00.000Z",
  "service": "a-nest-template"
}
```

### GET /health/db

Returns the health status of the database connection.

**Response when DATABASE_URL is not configured (200 OK):**
```json
{
  "status": "not_configured",
  "message": "DATABASE_URL environment variable is not set",
  "timestamp": "2025-11-20T14:00:00.000Z"
}
```

**Response when database is connected (200 OK):**
```json
{
  "status": "healthy",
  "message": "Database connection successful",
  "timestamp": "2025-11-20T14:00:00.000Z",
  "database": {
    "connected": true
  }
}
```

**Response when database connection fails (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "message": "Database connection failed",
  "error": "Connection refused",
  "timestamp": "2025-11-20T14:00:00.000Z"
}
```

### Testing Health Endpoints

Start the application:
```bash
npm run start:dev
```

Test the endpoints:
```bash
# Check basic health
curl http://localhost:3000/health

# Check database health
curl http://localhost:3000/health/db
```

## Running Tests

### Unit Tests

Run unit tests (these use mocks and don't require a real database):

```bash
npm test
```

Or specifically for the database service:

```bash
npm test -- database.service.spec.ts
```

### E2E Tests

Run E2E tests (these test actual database connectivity):

```bash
# Without DATABASE_URL - test will be skipped gracefully
npm run test:e2e -- database-connection.e2e-spec.ts

# With DATABASE_URL - will attempt real connection
DATABASE_URL="postgresql://aguanteRiver:aguanteRiver@localhost:5401/aguanteRiver" npm run test:e2e -- database-connection.e2e-spec.ts
```

## DatabaseService API

### `initializePool(connectionString: string): void`

Initialize the database connection pool with a PostgreSQL connection string.

```typescript
databaseService.initializePool('postgresql://user:pass@localhost:5432/mydb');
```

### `testConnection(): Promise<boolean>`

Test the database connection by executing a simple query.

```typescript
const isConnected = await databaseService.testConnection();
```

### `getPool(): Pool`

Get the underlying PostgreSQL connection pool for executing queries.

```typescript
const pool = databaseService.getPool();
const result = await pool.query('SELECT * FROM users');
```

## Test Coverage

The tests cover:

1. **Unit Tests** (with mocks):
   - Pool initialization
   - Connection testing
   - Error handling
   - Resource cleanup
   - Multiple initialization prevention

2. **E2E Tests** (real connections):
   - Successful database connection
   - Invalid connection string handling
   - Connection string format validation
   - Graceful skipping when DATABASE_URL is not set

## Usage in Your Application

To use the DatabaseService in your own modules:

1. Import the `DatabaseModule`:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule],
  // ...
})
export class YourModule {}
```

2. Inject the `DatabaseService`:

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class YourService {
  constructor(private databaseService: DatabaseService) {
    // Initialize connection on startup
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      this.databaseService.initializePool(dbUrl);
    }
  }

  async someMethod() {
    const pool = this.databaseService.getPool();
    const result = await pool.query('SELECT * FROM your_table');
    return result.rows;
  }
}
```

## Notes

- The E2E test will gracefully skip if `DATABASE_URL` is not set, with a warning message
- The connection pool is automatically closed when the application shuts down
- Connection errors are logged to the console
- The pool uses sensible defaults (max 10 connections, 30s idle timeout, 2s connection timeout)

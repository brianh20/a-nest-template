# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS application template with authentication, database integration, and a call center management system. It uses PostgreSQL for data persistence and includes JWT-based authentication.

## Key Commands

### Development
```bash
npm install              # Install dependencies
npm run start:dev        # Run in watch mode (auto-reload on changes)
npm run start:debug      # Run with debugger support
npm run start:prod       # Run production build
```

### Testing
```bash
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run end-to-end tests
npm run test:cov         # Generate test coverage report
```

### Code Quality
```bash
npm run lint             # Run ESLint and auto-fix issues
npm run format           # Format code with Prettier
```

### Database
```bash
npm run migrate          # Run database migrations (requires DATABASE_URL in .env)
npm run seed:users       # Seed users table
npm run seed:data        # Seed sample data
npm run db:setup         # Run migrations and all seeds
```

### Building
```bash
npm run build            # Build the application for production
```

## Architecture

### Module Structure
The application follows NestJS's modular architecture with feature modules:

- **DatabaseModule**: PostgreSQL connection pool management using `pg` library. Provides `DatabaseService` for raw SQL queries
- **AuthModule**: JWT authentication with Passport.js integration. Handles login, registration, and token validation
- **UsersModule**: User management with role-based access (manager/agent roles)
- **ContactsModule**: Contact/lead management with status tracking
- **CallsModule**: Call tracking and management
- **AnalyticsModule**: Performance analytics and reporting
- **HealthModule**: Health check endpoint for monitoring

### Database Schema
The application uses PostgreSQL with these main tables:
- `users`: Authentication and user profiles with role-based access
- `contacts`: Customer/lead information with status workflow
- `calls`: Call records with agent assignments
- `call_insights`: AI-analyzed call data (sentiment, transcripts, performance)

Migrations are located in `src/database/migrations/` and run sequentially.

### Authentication Flow
- JWT-based authentication configured through environment variables (JWT_SECRET, JWT_EXPIRATION)
- JwtStrategy validates tokens and attaches user to requests
- Protected routes use `@UseGuards(JwtAuthGuard)`

### Environment Configuration
Create a `.env` file from `.env.example` with:
- `DATABASE_URL`: PostgreSQL connection string (required)
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret for JWT signing (auto-generated if not set)
- `JWT_EXPIRATION`: Token expiration time (default: 7d)

## Development Notes

- All modules are imported in `app.module.ts`
- Database pool is initialized on application startup with connection testing
- ConfigModule is global - access config anywhere via ConfigService injection
- Use Nest CLI generators for consistency: `nest g [schematic] [name]`
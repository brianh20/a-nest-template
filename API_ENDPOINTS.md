# Call Center API Endpoints

All endpoints except /auth/* require JWT authentication via the Authorization header:
`Authorization: Bearer <token>`

## Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token

## Users Module
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user (name, role)
- `DELETE /users/:id` - Delete user

## Contacts Module
- `GET /contacts` - Get all contacts (supports pagination, search, filter)
  - Query params: `page`, `limit`, `search`, `status`
- `GET /contacts/:id` - Get contact by ID
- `POST /contacts` - Create new contact
- `PATCH /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact

## Calls Module
- `GET /calls` - Get all calls (supports pagination)
  - Query params: `page`, `limit`
- `GET /calls/:id` - Get call by ID
- `GET /calls/contact/:contactId` - Get all calls for a contact
- `GET /calls/agent/:agentId` - Get all calls for an agent
- `POST /calls` - Create new call
- `PATCH /calls/:id` - Update call

## Analytics Module
- `GET /analytics/dashboard` - Get dashboard analytics
  - Returns: callsToday, completedToday, avgDuration, topAgents, recentCalls

## Health Checks
- `GET /health` - Basic health check
- `GET /health/db` - Database health check

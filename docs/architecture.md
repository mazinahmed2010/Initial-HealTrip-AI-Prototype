# HealTrip Technical Architecture

## Request lifecycle

1. User submits a message.
2. Client sends `POST /api/chat`.
3. Zod validates the payload.
4. Agent receives the message with the safety system instructions.
5. Agent either:
   - asks a clarifying question, or
   - calls a verified search tool.
6. Tool executes server-side.
7. Prisma queries PostgreSQL.
8. Tool result is returned to the agent.
9. Agent generates a user-facing response using only verified provider records.
10. Client renders the response.

## Trust boundaries

```text
Browser
  │
  │ untrusted input
  ▼
API validation
  │
  ▼
Agent
  │
  │ tool request
  ▼
Server-side tools
  │
  ▼
Database
  │
  │ verified records
  ▼
Agent response
```

The browser never receives database credentials and never executes database queries.

## Future service decomposition

```text
Next.js Web
   │
   ├── API Gateway
   │
   └── Agent Orchestrator
         ├── Safety Engine
         ├── Provider Search Tool
         ├── Hospital Search Tool
         └── Audit Service

Provider Service ─── PostgreSQL
```

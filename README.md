# HealTrip AI Patient Decision Assistant

A small full-stack prototype demonstrating how to turn the HealTrip concept into an AI-assisted patient decision workflow.

> **Medical safety:** This is a technical prototype, not a medical device or diagnostic system. It must not be used as a substitute for professional medical evaluation.

## 1. Architecture

```text
┌───────────────────────────┐
│ Next.js React Chat UI     │
│ Arabic / English + RTL    │
└─────────────┬─────────────┘
              │ POST /api/chat
              ▼
┌───────────────────────────┐
│ API validation (Zod)      │
│ Safety + error boundary   │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ AI Agent                  │
│ - understand intent       │
│ - ask clarifying Qs       │
│ - choose tools            │
└───────┬───────────┬───────┘
        │           │
        ▼           ▼
 search_doctors  search_hospitals
        │           │
        └─────┬─────┘
              ▼
┌───────────────────────────┐
│ Prisma ORM                │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ PostgreSQL                │
│ Hospitals + Doctors       │
└───────────────────────────┘
```

Next.js is used as the React framework and API boundary for this prototype. Its App Router provides file-system routing and server-side application capabilities. See the official Next.js documentation: https://nextjs.org/docs

## 2. Why this architecture?

The test is intentionally small. A separate NestJS service could be introduced later, but using Next.js API routes for the prototype:

- reduces infrastructure;
- keeps the demo easy to run;
- preserves a clean `/api` boundary;
- allows the AI/tool layer to become an independent service later.

## 3. AI Agent design

The model does not directly query arbitrary text or invent provider information.

Available tools:

- `search_doctors`
- `search_hospitals`

The tools query PostgreSQL through Prisma.

The system prompt explicitly requires provider facts to originate from tool results.

### Anti-hallucination rule

```text
LLM
 ↓
Tool call
 ↓
Database
 ↓
Verified records
 ↓
LLM response
```

If the database returns no matching provider, the assistant must say that no matching provider was found in the prototype database.

## 4. Safety approach

For medical scenarios, the assistant:

1. does not diagnose;
2. asks clarifying questions when important information is missing;
3. recognizes common emergency warning signs at the prototype level;
4. prioritizes urgent medical evaluation when red flags are described;
5. does not allow the LLM to fabricate provider records.

For a production system, this safety layer should be implemented as deterministic, clinically reviewed rules in addition to model instructions.

## 5. Database

### Hospital

- id
- name / nameAr
- city
- address
- phone
- emergency
- specialties
- active

### Doctor

- id
- name / nameAr
- specialty / specialtyAr
- city
- languages
- hospitalId
- active

The schema can later be expanded with availability, insurance networks, specialties, appointments, provider credentials and audit records.

## 6. API

### POST `/api/chat`

Request:

```json
{
  "message": "I need a cardiologist in Riyadh"
}
```

Response:

```json
{
  "text": "...",
  "toolUsed": true,
  "emergency": false
}
```

### GET `/api/providers`

Returns active mock hospitals and their active doctors.

## 7. Run locally

### Prerequisites

- Node.js 20.9+
- Docker Desktop
- Git

Next.js currently documents Node.js 20.9+ for its App Router learning environment.

### Install

```bash
npm install
```

### Configure environment

Copy:

```bash
copy .env.example .env
```

Then add your LLM API key if available.

### Start PostgreSQL

```bash
npm run db:up
```

### Create schema

```bash
npm run db:push
```

### Seed mock providers

```bash
npm run db:seed
```

### Start application

```bash
npm run dev
```

Open:

http://localhost:3000

## 8. Mock mode

The application intentionally works without an API key.

If `OPENAI_API_KEY` is empty, the prototype uses a deterministic mock assistant for the main chest-pain flow. This makes the demo reproducible and avoids blocking UI/database development on an external API.

When the key is configured, the application uses the AI agent and function tools.

## 9. Security considerations

Implemented in the prototype:

- environment variables for secrets;
- server-side API key usage;
- Zod input validation;
- bounded message length;
- database-backed provider records;
- no direct client access to database;
- explicit anti-hallucination instructions;
- error boundary around the API.

Production additions:

- authentication and authorization;
- rate limiting;
- audit logging;
- encryption at rest/in transit;
- PHI minimization;
- consent and privacy controls;
- secrets manager;
- structured observability;
- clinician-reviewed safety rules;
- provider data verification pipeline.

## 10. Error handling

The API returns:

- `400` for invalid input;
- `500` for unexpected processing errors.

The UI displays a safe generic error rather than exposing server internals.

## 11. Production evolution

```text
Prototype
   ↓
Separate Agent Service
   ↓
Clinical Safety Engine
   ↓
Provider/Facility Verification
   ↓
Authentication + Consent
   ↓
Observability + Audit
   ↓
Production deployment
```

The prototype intentionally avoids over-engineering while keeping these boundaries clear.

## 12. Suggested interview discussion points

During the technical interview, explain:

1. Why the model should not be the source of truth for providers.
2. Why tools are used for provider search.
3. Why emergency triage should have deterministic safety controls.
4. Why PHI should be minimized and protected.
5. How the provider database could be replaced by a verified external provider API.
6. How the AI service could later be extracted from Next.js into NestJS.
7. How evaluation datasets and red-team scenarios would test hallucination and unsafe recommendations.

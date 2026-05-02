# Shift-Sync — AI Task Orchestrator

A cross-platform task management system with an **AI-powered natural language command bar** that parses free-form text into structured, schedulable tasks.

> "Call Alice tomorrow at 10am about the quarterly review" → Creates a task with title, category, and scheduled time — all parsed by Gemini.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo + pnpm |
| **Backend** | Node.js, Fastify, TypeScript, Clean Architecture |
| **Database** | PostgreSQL + Drizzle ORM |
| **AI** | Google Gemini SDK (`@google/genai`) |
| **DI Container** | Awilix |
| **Web** | React + Vite + Tailwind CSS v4 |
| **Mobile** | Expo (React Native) |
| **Shared** | `@shift-sync/shared` — Zod schemas, React hooks |
| **CI/CD** | GitHub Actions |

## Architecture

```
shift-sync-task/
├── apps/
│   ├── server/          # Fastify API (Clean Architecture)
│   │   ├── domain/      # Entities, Repository interfaces
│   │   ├── use-cases/   # Business logic
│   │   ├── infrastructure/  # DB, AI, DI container
│   │   └── presentation/    # Controllers, Routes
│   ├── web/             # React dashboard (Vite + Tailwind)
│   └── mobile/          # Expo React Native app
├── packages/
│   └── shared/          # Zod schemas, useSmartInput hook
├── docker-compose.yml
└── turbo.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
# Option A — Docker Compose (recommended)
docker compose up -d postgres

# Option B — Manual
docker run --name my-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 3. Configure Environment

```bash
cp apps/server/.env.example apps/server/.env
# Edit apps/server/.env and add your GEMINI_API_KEY
```

### 4. Push Database Schema

```bash
cd apps/server && npx drizzle-kit push
```

### 5. Seed Default User

```bash
docker exec my-postgres psql -U postgres -d shiftsync \
  -c "INSERT INTO users (id, email, name, role) VALUES ('00000000-0000-0000-0000-000000000001', 'default@shiftsync.local', 'Default User', 'admin') ON CONFLICT (id) DO NOTHING;"
```

### 6. Run

```bash
pnpm dev
```

This starts:
- **Backend API** → `http://localhost:3000`
- **Web Dashboard** → `http://localhost:5173`

### 7. (Optional) Mobile

```bash
pnpm --filter mobile start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check |
| `GET` | `/metrics` | Database latency |
| `POST` | `/ai/parse` | Parse natural language → task JSON |
| `GET` | `/tasks` | List all tasks |
| `POST` | `/tasks` | Create a task |
| `PUT` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task |

## Testing

```bash
pnpm --filter @shift-sync/server test
```

## License

MIT
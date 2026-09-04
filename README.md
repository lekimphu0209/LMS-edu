# EduConnect v2

A modular Learning Management System (LMS) built with a monorepo architecture.

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Backend     | NestJS, Prisma ORM, PostgreSQL 16               |
| Frontend    | React 18, Vite, TailwindCSS, shadcn/ui          |
| Auth        | JWT (access + refresh), Argon2id password hash   |
| Database    | PostgreSQL via Docker Compose + Adminer          |
| Monorepo    | pnpm workspaces                                 |
| Shared      | `@educonnect/shared` — TypeScript types package  |

## Project Structure

```
LMS-edu/
├── apps/
│   ├── api/                 # NestJS backend
│   │   └── src/
│   │       ├── common/      # Guards, decorators, filters, storage, email
│   │       ├── database/    # PrismaService, PrismaModule
│   │       └── modules/     # Domain modules (auth, users, classes, ...)
│   └── web/                 # React + Vite frontend
│       └── src/
│           ├── components/  # UI components (shadcn/ui), layouts
│           ├── contexts/    # Auth context
│           ├── lib/         # API client, utils
│           └── pages/       # Route pages
├── packages/
│   └── shared/              # Shared TypeScript types
├── prisma/
│   └── schema.prisma        # Full domain model
├── docker-compose.yml       # PostgreSQL + Adminer
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Backend Modules

| Module         | Responsibilities                                    |
|----------------|-----------------------------------------------------|
| auth           | Login, register, JWT refresh, change password       |
| users          | CRUD users, activate/deactivate, reset password     |
| classes        | CRUD classes, enroll/remove students                |
| curriculum     | Curriculum → Chapter → Lesson (2-tier)              |
| question-bank  | CRUD questions with options                         |
| assignments    | CRUD assignments, assign to class/student           |
| submissions    | Start, submit, grade submissions                    |
| progress       | Progress snapshots, learning sessions               |
| feedback       | Teacher feedback on submissions                     |
| statistics     | Admin/teacher/student overview dashboards           |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate Prisma client + run migrations
pnpm --filter @educonnect/api prisma:generate
pnpm --filter @educonnect/api prisma:migrate

# Start API (port 3000)
pnpm --filter @educonnect/api dev

# Start Web (port 5173)
pnpm --filter @educonnect/web dev
```

### API Documentation

Once the API is running, Swagger UI is available at `http://localhost:3000/api/docs`.

## Architecture Decisions

- **Modular Monolith**: Single NestJS app with domain-based modules — no microservices.
- **Repository Pattern**: Lightweight interfaces isolate Prisma in `users` and `classes` modules.
- **JWT Auth**: Access token (15m) + refresh token (7d). Argon2id for password hashing.
- **No Redis**: Stateless JWT, no caching layer at this stage.
- **Shared Types**: `@educonnect/shared` package provides TypeScript types for both frontend and backend.

## License

Private — © EduConnect 2025

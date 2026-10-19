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

## API Endpoints

All routes are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <accessToken>`. Roles in parentheses; no role = any authenticated user.

### Auth — `/auth`

| Method | Path                  | Role    | Description                          |
|--------|-----------------------|---------|--------------------------------------|
| POST   | /auth/login           | public  | Login, returns access + refresh JWT |
| POST   | /auth/register        | ADMIN   | Create user (admin only)            |
| POST   | /auth/refresh         | public  | Exchange refresh token for new pair |
| GET    | /auth/me              | any     | Current user profile                |
| POST   | /auth/logout          | public  | Revoke refresh token                |
| POST   | /auth/change-password | any     | Change own password                 |

### Users — `/users`

| Method | Path            | Role            | Description                    |
|--------|-----------------|-----------------|--------------------------------|
| GET    | /users/students | TEACHER, ADMIN  | List students (for enrollment) |

### Admin — `/admin` (all ADMIN only)

| Method | Path                              | Description                          |
|--------|-----------------------------------|--------------------------------------|
| GET    | /admin/users                      | List users (`role,status,search,page,limit`) |
| POST   | /admin/users                      | Create user                          |
| GET    | /admin/users/:id                  | User detail with classes             |
| PATCH  | /admin/users/:id                  | Update user                          |
| PATCH  | /admin/users/:id/status           | Activate/deactivate user             |
| POST   | /admin/users/:id/reset-password   | Reset user password                  |
| GET    | /admin/users/:id/reset-logs       | Password reset audit logs            |
| GET    | /admin/classes                    | List classes (`search,subject,status`) |
| POST   | /admin/classes                    | Create class                         |
| GET    | /admin/classes/:id                | Class detail with students           |
| PATCH  | /admin/classes/:id                | Update class                         |
| PATCH  | /admin/classes/:id/status         | Activate/deactivate class            |
| POST   | /admin/classes/:id/students       | Enroll students                      |
| DELETE | /admin/classes/:id/students/:sid  | Remove student from class            |
| GET    | /admin/stats/overview             | Platform overview statistics         |
| GET    | /admin/stats/growth               | User growth (`from,to,interval`)     |
| GET    | /admin/stats/questions            | Question stats (`groupBy=teacher\|subject`) |
| GET    | /admin/stats/files                | Uploaded files stats                 |

### Classes — `/classes`

| Method | Path                            | Role           | Description                        |
|--------|---------------------------------|----------------|------------------------------------|
| GET    | /classes                        | any            | List classes (admin: all, teacher: own) |
| GET    | /classes/:id                    | any            | Class detail                       |
| POST   | /classes                        | TEACHER, ADMIN | Create class                       |
| PATCH  | /classes/:id                    | TEACHER, ADMIN | Update class                       |
| PATCH  | /classes/:id/deactivate         | ADMIN          | Deactivate class                   |
| GET    | /classes/:id/stats              | TEACHER, ADMIN | Avg progress, ungraded, avg score  |
| GET    | /classes/:id/students           | any            | Enrolled students                  |
| GET    | /classes/:id/assignments        | any            | Assignments of the class           |
| POST   | /classes/:id/students           | TEACHER, ADMIN | Enroll students                    |
| DELETE | /classes/:id/students/:studentId| TEACHER, ADMIN | Remove student                     |

### Curriculum — `/curriculum`

| Method | Path                        | Role           | Description                      |
|--------|-----------------------------|----------------|----------------------------------|
| GET    | /curriculum                 | any            | List curriculums                 |
| GET    | /curriculum/:id             | any            | Curriculum with chapters/lessons |
| POST   | /curriculum                 | TEACHER, ADMIN | Create curriculum                |
| PATCH  | /curriculum/:id             | TEACHER, ADMIN | Update curriculum                |
| DELETE | /curriculum/:id             | TEACHER, ADMIN | Delete curriculum                |
| POST   | /curriculum/chapters        | TEACHER, ADMIN | Create chapter                   |
| PATCH  | /curriculum/chapters/:id    | TEACHER, ADMIN | Update chapter                   |
| DELETE | /curriculum/chapters/:id    | TEACHER, ADMIN | Delete chapter                   |
| POST   | /curriculum/lessons         | TEACHER, ADMIN | Create lesson                    |
| PATCH  | /curriculum/lessons/:id     | TEACHER, ADMIN | Update lesson                    |
| DELETE | /curriculum/lessons/:id     | TEACHER, ADMIN | Delete lesson                    |

### Question Bank — `/question-bank`

| Method | Path                | Role           | Description                              |
|--------|---------------------|----------------|------------------------------------------|
| GET    | /question-bank      | any            | List (`teacherId,subject,type,difficulty,q,page,limit`) |
| GET    | /question-bank/:id  | any            | Question with options                    |
| POST   | /question-bank      | TEACHER, ADMIN | Create question with options             |
| PATCH  | /question-bank/:id  | TEACHER, ADMIN | Update question                          |
| DELETE | /question-bank/:id  | TEACHER, ADMIN | Delete question                          |

### Assignments — `/assignments`

| Method | Path                          | Role           | Description                     |
|--------|-------------------------------|----------------|---------------------------------|
| GET    | /assignments                  | any            | List (`createdBy`)              |
| GET    | /assignments/:id              | any            | Detail with questions + targets |
| POST   | /assignments                  | TEACHER, ADMIN | Create with questions           |
| PATCH  | /assignments/:id              | TEACHER, ADMIN | Update                          |
| DELETE | /assignments/:id              | TEACHER, ADMIN | Delete                          |
| POST   | /assignments/:id/targets      | TEACHER, ADMIN | Assign to class/student         |
| GET    | /assignments/:id/targets      | any            | List targets                    |
| GET    | /assignments/:id/submissions  | TEACHER, ADMIN | List submissions                |

### Submissions — `/submissions`

| Method | Path                    | Role           | Description                    |
|--------|-------------------------|----------------|--------------------------------|
| GET    | /submissions            | any            | List (`studentId`, `targetId`) |
| GET    | /submissions/:id        | any            | Submission detail              |
| POST   | /submissions/start      | STUDENT        | Start a submission             |
| POST   | /submissions/:id/submit | STUDENT        | Submit answers                 |
| POST   | /submissions/:id/grade  | TEACHER, ADMIN | Grade submission               |

### Progress — `/progress`

| Method | Path                        | Role           | Description                |
|--------|-----------------------------|----------------|----------------------------|
| GET    | /progress/snapshots         | any            | Progress snapshots (`studentId,curriculumId`) |
| GET    | /progress/sessions          | any            | Learning sessions          |
| POST   | /progress/sessions/start    | STUDENT        | Start learning session     |
| POST   | /progress/sessions/:id/end  | STUDENT        | End learning session       |
| GET    | /progress/milestones        | any            | List milestones            |
| POST   | /progress/milestones        | TEACHER, ADMIN | Create milestone           |
| DELETE | /progress/milestones/:id    | TEACHER, ADMIN | Delete milestone           |

### Feedback — `/feedback`

| Method | Path                     | Role            | Description                  |
|--------|--------------------------|-----------------|------------------------------|
| POST   | /feedback                | TEACHER, ADMIN  | Feedback on a submission     |
| GET    | /feedback/:submissionId  | any             | Feedback for a submission    |
| POST   | /feedback/student        | STUDENT, ADMIN  | Student creates feedback     |
| GET    | /feedback/inbox          | TEACHER, ADMIN  | Teacher inbox (`isRead,studentId`) |
| PATCH  | /feedback/:id/read       | TEACHER, ADMIN  | Mark as read                 |
| POST   | /feedback/:id/reply      | TEACHER, ADMIN  | Reply to feedback            |

### Student self-service — `/students/me` (all STUDENT)

| Method | Path                            | Description                          |
|--------|---------------------------------|--------------------------------------|
| GET    | /students/me/classes            | Enrolled classes + progress          |
| GET    | /students/me/classes/:id        | Class detail (student view)          |
| GET    | /students/me/assignments        | My assignments (`status,classId`)    |
| GET    | /students/me/assignments/:id/quiz | Quiz questions (no answers)        |
| GET    | /students/me/feedbacks          | My feedback history                  |
| POST   | /students/me/feedbacks          | Send feedback to teacher             |
| GET    | /students/me/stats              | Dashboard stats                      |

### Statistics — `/statistics`

| Method | Path                | Role           | Description            |
|--------|---------------------|----------------|------------------------|
| GET    | /statistics/admin   | ADMIN          | Admin overview         |
| GET    | /statistics/teacher | TEACHER, ADMIN | Teacher overview       |
| GET    | /statistics/student | STUDENT        | Student overview       |

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

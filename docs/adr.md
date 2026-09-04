# ADR-001: Modular Monolith Architecture

**Date**: 2025-01  
**Status**: Accepted

## Context

EduConnect needs a backend that supports multiple domains (auth, users, classes, curriculum, question-bank, assignments, submissions, progress, statistics) with clear separation of concerns. The team is small (2-3 devs) and needs to ship quickly.

## Decision

Adopt a **modular monolith** architecture using NestJS with domain-based modules. Each module encapsulates its own controllers, services, DTOs, and (where applicable) repository interfaces. No microservices at this stage.

## Rationale

- **Simplicity**: Single deployable unit, shared database, no network overhead between services.
- **Developer velocity**: No distributed systems complexity (service discovery, inter-service auth, distributed tracing).
- **Module boundaries**: NestJS modules provide clear separation. Repository interfaces in `users` and `classes` modules demonstrate how to swap implementations.
- **Path to microservices**: If needed later, modules can be extracted into separate services with minimal refactor since they already have clean interfaces.

## Consequences

- All modules share a single PostgreSQL database via Prisma.
- Cross-module communication happens through direct service injection (no events/bus).
- The Prisma schema is centralized in `/prisma/schema.prisma`.

---

# ADR-002: JWT Authentication with Argon2id

**Date**: 2025-01  
**Status**: Accepted

## Context

Need a stateless authentication mechanism suitable for a SPA frontend. Must support role-based access control (ADMIN, TEACHER, STUDENT).

## Decision

Use **JWT** with access + refresh token flow. Hash passwords with **Argon2id** (via `@node-rs/argon2`).

- Access token: 15 minutes, sent in `Authorization: Bearer` header.
- Refresh token: 7 days, stored in DB for revocation.
- No Redis — tokens are stateless, refresh tokens validated against DB.

## Rationale

- Argon2id is the OWASP-recommended password hashing algorithm.
- JWT allows stateless auth without session storage.
- Refresh token in DB enables revocation (e.g., on logout or password change).

## Consequences

- Token rotation on refresh: new access + refresh token pair on each refresh.
- Frontend axios interceptor handles 401 → auto-refresh → retry.
- No session invalidation without DB lookup (acceptable for this scale).

---

# ADR-003: pnpm Workspaces Monorepo

**Date**: 2025-01  
**Status**: Accepted

## Context

Frontend (React), backend (NestJS), and shared types need to coexist with shared dependencies and type safety across packages.

## Decision

Use **pnpm workspaces** with three packages:
- `apps/api` — NestJS backend
- `apps/web` — React + Vite frontend
- `packages/shared` — Shared TypeScript types (`@educonnect/shared`)

## Rationale

- pnpm is fast, disk-efficient, and has first-class workspace support.
- Shared types package ensures type safety between frontend and backend.
- Single `pnpm install` at root installs all packages.

## Consequences

- Root `tsconfig.base.json` provides shared compiler options.
- Each package has its own `tsconfig.json` extending the base.
- `pnpm --filter <package> <script>` for per-package commands.

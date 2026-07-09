# Task Management Platform

A task-management platform that cleanly separates **generic workflow rules**
(apply to every task type, present and future) from **task-type-specific
rules** (Procurement, Development, ...), using the **Strategy Pattern**.

## Architecture at a glance

```
server/src/
  entities/           Task, User (TypeORM entities)
  handlers/            <-- the Strategy Pattern lives here
    types.ts             ITaskTypeHandler interface + shared types
    BaseTaskTypeHandler.ts  generic validation logic (shared by ALL types)
    ProcurementHandler.ts   Procurement's status list + required fields
    DevelopmentHandler.ts   Development's status list + required fields
    HandlerFactory.ts       registry: type string -> handler instance
  services/
    TaskService.ts       the ONE generic workflow engine (rules 1-7).
                          Never branches on task.type - it only ever calls
                          methods on the ITaskTypeHandler it gets from
                          HandlerFactory.
    UserService.ts
  controllers/, routes/, dto/, middleware/, migrations/

client/src/
  api/                 thin REST clients (taskApi, userApi)
  hooks/               useUserTasks, useTask, useTaskTypes
  components/          UserSelector, TaskList, TaskCard, CreateTaskForm,
                        DynamicStatusForm (renders inputs purely from the
                        server-provided field descriptors - no task-type
                        knowledge on the client either)
  pages/               HomePage
```

### How adding a third task type works

1. Create `server/src/handlers/MarketingHandler.ts`:
   ```ts
   export class MarketingHandler extends BaseTaskTypeHandler {
     readonly type = 'marketing';
     protected statuses = [ /* your statuses + requiredFields */ ];
   }
   ```
2. Register it in `HandlerFactory.ts`: `['marketing', new MarketingHandler()]`.

That's it. `TaskService`, controllers, routes, migrations, and the entire
React client require **zero changes** — the client discovers the new type's
statuses and required fields dynamically via `GET /api/task-types`.

### Where each workflow rule (section 2) is enforced

All in `TaskService`, generically:

| Rule | Enforced by |
|---|---|
| 1 task ↔ 1 user | `assignedUserId` column + update on every status change |
| Open/Closed, immutable when closed | `isClosed` flag, checked first in `changeStatus` |
| Ascending int statuses | `status: number`, validated against handler's status list |
| Forward moves sequential | `newStatus !== task.status + 1` check |
| Backward always allowed | no restriction on `newStatus < task.status` |
| Close only at final status | `handler.getFinalStatusNumber()` — **derived, not stored** |
| Status change validates data + records next user | `handler.validateCustomFields()` + `assignedUserId` update, single `save()` |

Note: the final status is intentionally **not** a column on `tasks` — it is
a property of the task type, computed on demand from the handler, so there
is no duplicated/denormalized storage.

## Prerequisites

- Node.js 18+
- Docker Desktop (running) — used to run PostgreSQL via `docker-compose.yml`,
  no local Postgres installation needed
- On Windows: run the scripts below from Git Bash or WSL

## Quick start (one command)

**Windows:** double-click `setup.bat`, then `start.bat`.
(These wrap `setup.ps1` / `start.ps1`; the window stays open even if
something fails, so you can read the error. `start.bat` opens the server
and client each in their own Windows Terminal tab if you have Windows
Terminal installed, or two separate windows otherwise.)

**macOS / Linux:**
```bash
./setup.sh    # creates the DB, .env files, installs deps, runs migrations, seeds demo users
./start.sh    # runs server (http://localhost:3000) + client (http://localhost:5173) together, Ctrl+C to stop
```

Open http://localhost:5173, pick a seeded user from the dropdown, create a
Procurement or Development task, and walk it through its lifecycle
(forward / backward / close).

Both setup scripts are idempotent — safe to re-run; they won't overwrite
existing `.env` files or re-seed if users already exist.

## Manual setup (step by step, if you prefer)

If you'd rather run each step yourself instead of `./setup.sh` / `./start.sh`:

### 1. Database

```bash
docker compose up -d          # starts Postgres in a container; creates 'task_management' DB automatically
```

(To stop it later: `docker compose stop`. To remove it entirely including data: `docker compose down -v`.)

### 2. Server

```bash
cd server
cp .env.example .env       # edit DB credentials if needed
npm install
npm run migration:run      # creates users + tasks tables
npm run seed                # inserts 3 demo users, prints their UUIDs
npm run dev                 # starts API on http://localhost:3000
```

### 3. Client

```bash
cd client
cp .env.example .env       # points at http://localhost:3000/api by default
npm install
npm run dev                 # starts on http://localhost:5173
```

## API summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/task-types` | List registered task types with their status lists & final status |
| GET | `/api/users` | List demo users |
| POST | `/api/tasks` | `{ type, assignedUserId }` — create a task |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks/:id/status` | `{ newStatus, assignedUserId, data }` — advance/reverse |
| POST | `/api/tasks/:id/close` | Close a task (only from its final status) |
| GET | `/api/users/:userId/tasks` | All tasks assigned to a user |

Errors are returned as `{ "error": "message" }` with appropriate HTTP status
codes (400 validation, 404 not found, 409 workflow-rule violation).

## Task types included

**Procurement**: 1 Created → 2 Supplier offers received (2 price quotes) → 3
Purchase completed (receipt), closeable only from 3.

**Development**: 1 Created → 2 Specification completed (spec text) → 3
Development completed (branch name) → 4 Distribution completed (version),
closeable only from 4.

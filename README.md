<<<<<<< HEAD
# sprint-board
  Full-stack Kanban board with drag-and-drop task management,   sprint planning, and team member assignments
=======
# Sprint Board

A fast, reliable, and durable task tracker / sprint board for teams of 10.

## Features

- **Kanban Board** — Drag-and-drop tasks between To Do, In Progress, Review, and Done
- **Sprint Planning** — Create sprints with goals and date ranges
- **Team Members** — Assign tasks to team members with color-coded avatars
- **Priority & Points** — Track urgency and effort with story points
- **Atomic Operations** — All moves and updates use PostgreSQL transactions for data integrity

## Tech Stack

- **Frontend:** React 18, Vite, @dnd-kit (drag and drop)
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL 16 (ACID-compliant for atomicity and durability)

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) or a local PostgreSQL instance

### 1. Start the database

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run migrations and seed data

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start development

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Project Structure

```
sprint-board/
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   └── utils/      # API client
│   └── vite.config.js
├── server/             # Express backend
│   └── src/
│       ├── db/         # Pool, migrations, seeds
│       └── routes/     # REST API routes
├── docker-compose.yml  # PostgreSQL container
└── package.json        # Workspace root
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/members | List all members |
| POST | /api/members | Create a member |
| GET | /api/sprints | List all sprints |
| GET | /api/sprints/active | Get active sprint |
| POST | /api/sprints | Create a sprint |
| PATCH | /api/sprints/:id/activate | Activate a sprint |
| GET | /api/tasks | List tasks (filterable) |
| POST | /api/tasks | Create a task |
| PATCH | /api/tasks/:id | Update a task |
| PATCH | /api/tasks/:id/move | Move task (reorder) |
| DELETE | /api/tasks/:id | Delete a task |

## Design Principles

- **Atomic:** All position changes use database transactions with row-level locking
- **Durable:** PostgreSQL WAL ensures committed data survives crashes
- **Fast:** Connection pooling (20 connections), indexed queries, optimistic UI updates
- **Reliable:** Constraint checks at DB level, graceful error handling, auto-rollback on failures
>>>>>>> e5c114e (Initial sprint board implementation)

# Real-Time Kanban Board

A collaborative task management app built with **Bun**, **Elysia**, **React**, and **WebSockets**.

## Features
- Create, edit, and delete tasks across multiple columns
- Drag and drop tasks between columns
- Real-time updates across all connected browsers
- SQLite database with full CRUD API
- Deployed on Railway

## Tech Stack
- **Runtime:** Bun
- **Backend:** Elysia (Bun-native web framework)
- **Database:** SQLite (via `bun:sqlite`)
- **Real-Time:** WebSockets (native Bun support)
- **Frontend:** React + TypeScript + Vite
- **Drag & Drop:** @hello-pangea/dnd
- **Deployment:** Railway (Docker)

## Running Locally

```bash
bun install
cd frontend && bun install && cd ..
bun run dev
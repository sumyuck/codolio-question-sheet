# Interactive Question Management Sheet

Codolio-like interactive question tracker with hierarchical topics, subtopics, and questions. Built with a Vite + React frontend and an Express + TypeScript backend.

## Features
- [x] Dark theme with Codolio-inspired orange accents
- [x] Accordion layout for topics and subtopics
- [x] CRUD for topics, subtopics, and questions (via API)
- [x] Drag-and-drop reorder for topics, subtopics, and questions
- [x] Move questions across subtopics
- [x] Right-side drawer editor with Overview/Notes tabs
- [x] Search by title/source/difficulty
- [x] Progress ring with solved/total counts
- [x] Export/Import JSON
- [x] Persistence via `server/data/state.json`

## Setup
```bash
npm install
npm run dev
```
- Client: http://localhost:5173
- Server: http://localhost:3001

## API Routes
- `GET /api/sheet`
- `POST /api/topics`
- `PATCH /api/topics/:topicId`
- `DELETE /api/topics/:topicId`
- `POST /api/topics/:topicId/subtopics`
- `PATCH /api/subtopics/:subTopicId`
- `DELETE /api/subtopics/:subTopicId`
- `POST /api/subtopics/:subTopicId/questions`
- `PATCH /api/questions/:questionId`
- `DELETE /api/questions/:questionId`
- `POST /api/reorder`
- `GET /api/export`
- `POST /api/import`

## Persistence + Seed
- On server boot, `server/data/state.json` is loaded if it exists.
- If missing, the server reads `server/seed/sheet.json`, transforms it into the Topic → SubTopic → Question hierarchy, and persists it to `server/data/state.json`.
- All mutations update the persisted JSON file so the UI remains consistent after refresh/restart.

# Uni Admission Scanner — Soroti University

Lets a registrar upload a scan of Soroti University's handwritten "REGISTRATION FORM" (1 to 4 pages), have Gemini read the handwriting into structured data, watch progress live over Server-Sent Events, then review/correct the extracted data before it becomes a real admission record.

## Tech stack

- `server/` — Express 5, TypeScript, Drizzle ORM (`drizzle-orm/postgres-js`, PostgreSQL), multer (uploads), `@google/genai` (Gemini), `pdf-lib` (PDF page handling), `zod` (validation).
- `client/` — React 19, Vite, TypeScript, TanStack Query, Formik/Yup, react-router-dom, Tailwind v4 + shadcn-style primitives (Radix + `cva` + `cn()`).

Package manager is `pnpm` in both workspaces.

## Running locally

```
cd server && pnpm install && pnpm db:migrate && pnpm dev          # http://localhost:8080
cd client && pnpm install && pnpm dev                              # http://localhost:5173
```

Required server env vars (see `server/.env.example`): `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `MAX_UPLOAD_SIZE_MB`, `ADMISSION_MAX_PAGES`.

## Directory map

```
server/src/
  routes/        Express routers (thin)
  controllers/   req/res glue, no business logic
  services/      orchestration + Drizzle writes (admissionService.ts)
  db/            schema.ts (tables/enums/relations), index.ts (db client), connection.ts (health check), drizzle/ (migrations)
  utils/         gemini.ts (AI), pdf.ts, sseHub.ts, asyncHandler.ts, error.ts
  middleware/    upload.ts (multer)
  types/         shared TS types

client/src/
  api/           fetch wrappers per resource
  hooks/         data/SSE hooks
  components/pages/   route-level screens
  components/layout/  Header/Footer
  components/ui/shared/  shadcn-style primitives
```

For deeper conventions, see the scoped skills:
- [server/.claude/skills/backend-development/SKILL.md](server/.claude/skills/backend-development/SKILL.md)
- [client/.claude/skills/frontend-development/SKILL.md](client/.claude/skills/frontend-development/SKILL.md)

## The admission lifecycle

1. **Upload** — `POST /api/v1/admissions/upload` (multipart, field `file`, PDF only). Returns `202 { jobId }` immediately; extraction runs in the background.
2. **Live progress** — client opens `GET /api/v1/admissions/extract/:jobId/events` (SSE) and watches real status events (validating → extracting → saving) until a terminal `review_ready` or `failed` event.
3. **Review** — on `review_ready`, a `Student` + `Admission` (status `PENDING_REVIEW`) + child rows (guardians, exam records, qualifications, courses) already exist in the DB. The registrar edits them via `PATCH /api/v1/admissions/:id`.
4. **Confirm/Reject** — `POST /api/v1/admissions/:id/confirm` → `COMPLETED`, or `POST /api/v1/admissions/:id/reject` → `REJECTED`.

## Key design decisions

- **`Admission.studentId` is non-nullable** — "every admission belongs to a student" is enforced by the FK itself, not application logic. Consequence: nothing is written to Postgres until extraction succeeds enough to know who the student is. The `jobId` used for the SSE channel is a throwaway UUID, never a DB id. **Failed extractions are never persisted** — only reported over SSE and logs.
- **Original uploaded PDF is not retained.** It's held in memory only for the duration of the request; the Gemini Files API copy is explicitly deleted right after extraction.
- **Review-required**: extraction never auto-finalizes. Everything lands as `PENDING_REVIEW` so handwriting-OCR mistakes get caught by a human before being treated as real data.
- **SSE pattern** is adapted from two reference repos the client pointed at (`owiino/owino-backend` for the backend hub/controller shape, `Tibz-Dankan/appcrons-web` for the frontend consumption hook) — see the backend/frontend skill files for specifics. Auth headers from those references aren't needed here since this feature currently has no auth gate; if auth is added later, swap the frontend's native `EventSource` for `EventSourcePolyfill` to attach an `Authorization` header, exactly as `appcrons-web` does.
- **One Gemini call per upload**, not one call per page — Gemini natively understands multi-page PDFs, so cross-page fields (e.g. the father's name on page 1 continuing into his contact details on page 2) stay correctly associated. The PDF is still capped to the first `ADMISSION_MAX_PAGES` pages before sending, and 1-page uploads work the same way with later sections simply left null.

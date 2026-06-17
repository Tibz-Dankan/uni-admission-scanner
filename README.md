# Uni Admission Scanner — Soroti University

A tool for Soroti University registrars to digitize handwritten student registration forms. Upload a scanned PDF (1–4 pages), watch Gemini extract the handwriting into structured data in real time via Server-Sent Events, then review and correct the result before it becomes a permanent admission record.

## Tech stack

- **Server** — Express 5, TypeScript, Prisma 7 (PostgreSQL), Multer, Google Gemini (`@google/genai`), pdf-lib, Zod
- **Client** — React 19, Vite, TypeScript, TanStack Query, Formik/Yup, React Router, Tailwind v4, Radix UI

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database
- Google Gemini API key

## Setup & running locally

### 1. Clone the repository

```bash
git clone https://github.com/Tibz-Dankan/uni-admission-scanner.git
cd uni-admission-scanner
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/uni_admission_scanner?schema=public"
PORT=8000
NODE_ENV=development

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-lite
MAX_UPLOAD_SIZE_MB=25
ADMISSION_MAX_PAGES=4
```

### 3. Start the server

```bash
# inside server/
pnpm install
pnpm prisma migrate dev
pnpm dev
```

Server runs at **http://localhost:8000**.

### 4. Start the client

```bash
cd ../client
pnpm install
pnpm dev
```

Client runs at **http://localhost:5173**.

## How it works

1. **Upload** — registrar uploads a PDF scan of the handwritten form (`POST /api/v1/admissions/upload`). The server returns a `jobId` immediately.
2. **Live progress** — the client subscribes to `GET /api/v1/admissions/extract/:jobId/events` (SSE) and receives status updates (`validating → extracting → saving`) until `review_ready` or `failed`.
3. **Review** — on `review_ready`, the extracted student and admission records are shown for editing/correction.
4. **Confirm or reject** — the registrar finalizes (`confirm`) or discards (`reject`) the admission.

## Project structure

```
server/src/
  routes/        Express routers
  controllers/   Request/response handlers
  services/      Business logic and Prisma writes
  utils/         Gemini, PDF, SSE, Prisma helpers

client/src/
  api/           Fetch wrappers
  hooks/         Data and SSE hooks
  components/    Pages, layout, and UI primitives
```

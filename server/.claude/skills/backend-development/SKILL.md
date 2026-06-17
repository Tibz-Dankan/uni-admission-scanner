---
name: backend-development
description: Use when working in server/ on this Express + Prisma + TypeScript API — covers the layered route/controller/service/util structure, error handling conventions, the Gemini extraction utility, and the SSE progress-hub pattern.
---

# Backend development — uni-admission-scanner server

## Layering

Requests flow `routes/ → controllers/ → services/ → utils/`. Keep each layer thin and single-purpose:

- **routes/** (`server/src/routes/*.ts`) — just wires paths to controller functions and middleware. No logic.
- **controllers/** (`server/src/controllers/*.ts`) — req/res glue only: pull params/body, call a service function, shape the HTTP response. No Prisma calls, no business rules here.
- **services/** (`server/src/services/*.ts`) — orchestration and all Prisma reads/writes. This is where transactions, upserts, and multi-step workflows live.
- **utils/** (`server/src/utils/*.ts`) — pure, reusable helpers with no knowledge of HTTP. The Gemini client lives here (see below) precisely because it's a capability, not a request handler.

Every async controller is wrapped in `asyncHandler` (`server/src/utils/asyncHandler.ts`) so rejected promises reach `errorController` (`server/src/controllers/errorController.ts`) instead of crashing the process. Throw `AppError(message, statusCode)` (`server/src/utils/error.ts`) for any expected/operational failure (bad input, not found, etc.) — `errorController` already knows how to turn that into the right JSON response. Don't hand-roll `try/catch` + `res.status().json()` in controllers; let errors bubble to `asyncHandler`.

## Prisma

`server/src/utils/prisma.ts` exports a single shared `PrismaClient` instance built with `@prisma/adapter-pg` — always import that, never instantiate a second `PrismaClient`. Multi-step writes that must succeed or fail together (e.g. creating a `Student` + `Admission` + its child rows) go inside one `prisma.$transaction(...)`.

When adding a model, update `server/prisma/schema.prisma` and run `pnpm prisma migrate dev --name <change>` — never hand-edit the generated client or skip a migration.

## SSE progress hub pattern

Long-running background work (currently: PDF extraction) reports progress over Server-Sent Events using `server/src/utils/sseHub.ts`. This is adapted from `owiino/owino-backend`'s `src/utils/notification.ts` + `src/controllers/notificationController.ts`: a singleton wrapping a Node `EventEmitter`, keyed by an id (there: `userId`; here: a throwaway `jobId`), with the SSE controller setting `text/event-stream` headers, writing a `"warmup"` message, running a heartbeat `setInterval`, subscribing to the emitter, and unsubscribing on `req.on("close")`.

Differences from that reference, both deliberate:
- Events are buffered per `jobId` in a small history array so a client that opens the `EventSource` a moment late still gets replayed the steps it missed, instead of silently losing them.
- A job's history/listeners are garbage-collected after a short TTL once it reaches a terminal event (`review_ready` / `failed`) — jobs aren't meant to live forever in memory.

When you add a new background workflow that needs live progress, reuse `sseHub` rather than inventing a second hub — give it a new `jobId` namespace and event `type` values specific to that workflow.

## Gemini extraction utility

`server/src/utils/gemini.ts` is the **only** place that talks to the Gemini API (`@google/genai`), per the project requirement that AI logic lives in a utility, not scattered through services/controllers. It exports `extractAdmissionData(pdfBuffer): Promise<ExtractedAdmissionData>` which:
1. Uploads the buffer via the Gemini Files API.
2. Calls `generateContent` with `GEMINI_MODEL` (env var — never hardcode the model id) and a `responseSchema` so the model is constrained to return JSON shaped like `ExtractedAdmissionData` (`server/src/types/admission.ts`).
3. Validates the parsed JSON with a Zod schema before returning it — never trust LLM output as already-correct, even with `responseSchema`.
4. Deletes the uploaded Gemini file in a `finally` block, regardless of success/failure.

If you need Gemini for a different extraction task, add a new exported function in this same file (or a sibling `utils/gemini-*.ts` if it grows large) — don't call the SDK directly from a service.

## PDF page handling

`server/src/utils/pdf.ts` wraps `pdf-lib` for two jobs: counting pages, and slicing a PDF down to its first N pages (`ADMISSION_MAX_PAGES`). The admission service always runs uploads through this before handing them to `gemini.ts`, so 1-page and multi-page uploads go through the identical code path — there's no separate branch for "single page mode."

## Adding a new admission-related endpoint

1. Add/extend the orchestration function in `admissionService.ts`.
2. Add a thin controller function in `admissionController.ts` calling it.
3. Wire the route in `admissionRoutes.ts`.
4. If the endpoint changes persisted shape, update `schema.prisma` + migrate, and update `server/src/types/admission.ts`.

## Uploads

File uploads use multer in-memory storage (`server/src/middleware/upload.ts`) — files are never written to disk, consistent with the project's "don't retain the original PDF" decision. Validate mimetype (`application/pdf`) and size (`MAX_UPLOAD_SIZE_MB`) in the multer config itself, not after the fact in the controller.

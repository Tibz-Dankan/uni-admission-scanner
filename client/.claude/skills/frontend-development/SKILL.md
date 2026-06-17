---
name: frontend-development
description: Use when working in client/ on this React + Vite app — covers React Query for server state, Formik/Yup forms, the shadcn-style UI primitives, the SSE consumption hook pattern, routing, and the Soroti University theme.
---

# Frontend development — uni-admission-scanner client

## Server state

Use TanStack Query (`client/src/providers/ReactQuery.tsx` already wraps the app) for anything that comes from the API — queries for `GET`s, mutations for `POST`/`PATCH`/`DELETE`, with `invalidateQueries` after mutations that change list/detail data. Don't reach for Zustand for server data; Zustand (already a dependency) is reserved for genuinely client-only/ephemeral state if a future feature needs it — this feature doesn't.

API calls go through `client/src/api/*.ts` files built on `apiFetch` (`client/src/api/client.ts`), which prefixes `API_BASE_URL` and handles non-OK responses. `apiFetch` only sets a default `Content-Type: application/json` header when the body isn't `FormData` — multipart upload calls pass a `FormData` body and get no forced JSON header.

## Forms

Use Formik + Yup (already dependencies) for any editable form, matching the rest of the app rather than introducing a second form library. Validation should be lenient on OCR-derived fields (most things are optional strings) — only enforce format where it's meaningful (e.g. email shape if present), not presence, since handwriting may legitimately be blank.

## UI primitives

`client/src/components/ui/shared/` holds shadcn-style primitives (`Button`, `Input`, `Card`, etc.) built on the Radix packages already in `package.json` + `cva` + `cn()` (`client/src/utils/cn.ts`, `clsx` + `tailwind-merge`). `components.json` is already configured for the "new-york" shadcn style with these aliases — follow that convention (forwardRef, `cva` variants, `cn()` for class merging) for any new primitive instead of writing one-off styled divs.

## SSE consumption pattern

For any live-progress feature, follow `client/src/hooks/useAdmissionExtractionEvents.ts`, adapted from `Tibz-Dankan/appcrons-web`'s `src/hooks/UseGetAppLiveRequest.tsx`:
- Open the stream inside a `useEffect`, parse `event.data` as JSON, **ignore `"heartbeat"`/`"warmup"` message types** (they're just keep-alive, not state updates) exactly like the reference hook does.
- Handle `onerror` distinctly from a normal terminal event.
- Always close the `EventSource` in the effect cleanup and once a terminal event (`review_ready`/`failed`) arrives — don't leave dangling connections.

This app uses the native `EventSource` (no `event-source-polyfill`) because there's currently no auth header to attach. If/when an `Authorization` header becomes necessary, switch to `EventSourcePolyfill` (the package the reference repo uses) rather than hand-rolling header support — native `EventSource` cannot send custom headers.

## Routing

Routes are declared in `client/src/routes/renderRoutes.tsx` using `react-router-dom`. Route-level screens live in `client/src/components/pages/`, shared chrome in `client/src/components/layout/`. Keep page components focused on composing hooks + UI primitives; push data-fetching logic into `api/`/hooks, not inline in the component body.

## Theme

Soroti University brand tokens are defined as CSS variables in `client/src/index.css` alongside the existing shadcn-style tokens (`--background`, `--primary`, etc.): a deep forest-green primary, crimson-red accent (used for primary CTAs, matching the site's "Apply Now" button), a blush nav background, and dark navy/charcoal text. These are an approximation read off a screenshot of sun.ac.ug, not official brand guidelines — if exact brand colors/logo assets are provided later, update the variables in one place rather than hunting for hardcoded hex values in components (there shouldn't be any — always reference the CSS variables/Tailwind theme tokens).

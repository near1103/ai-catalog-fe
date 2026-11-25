---
name: ai-catalog-frontend
description: Project-specific frontend guidance for the AI catalog repository. Use when changing this Next.js frontend for the product auto-categorization project, especially tasks involving project structure, API calls, TanStack Query, forms, auth preparation, UI conventions, dependencies, or architectural boundaries with the Spring Boot backend, Firebase, Firestore, and Gemini.
---

# AI Catalog Frontend

## Purpose

Preserve the frontend stack and architecture boundaries for the AI product cataloging client. Do not design the domain model, exact UI flows, routes, DTOs, catalog structure, forms, or entities ahead of an explicit task and confirmed backend contracts.

## Project Context

- Topic: product auto-categorization for an online store using Firebase behind a Spring Boot backend.
- Frontend is a Next.js client for the Spring Boot REST API.
- Backend owns Firebase, Firestore, Firebase Admin SDK, Gemini/Spring AI, auth validation, business logic, and data access.
- Frontend displays backend data and sends user actions to backend endpoints.
- Do not call Firestore, Firebase service APIs, Gemini, or backend secrets directly from the browser.

## Stack Rules

- Use JavaScript only. Do not create `.ts` or `.tsx` files.
- Use Next.js App Router and React functional components.
- Use Tailwind CSS for styling.
- Use TanStack Query for server state.
- Use React Hook Form for forms and Zod for client validation.
- Use `lucide-react` for icons.
- Use standard `fetch` through the centralized API layer.
- Do not add Axios, Redux, Zustand, Firebase SDK, NextAuth/Auth.js, UI frameworks, or other dependencies unless the specific task truly requires them.
- Do not use Next.js API routes as the main backend.

## Workflow

1. Inspect the current repository structure before editing.
2. Check `package.json` before adding dependencies or assuming libraries exist.
3. Follow existing folders, naming, component style, and API conventions.
4. Make the smallest change that satisfies the task.
5. Do not create pages, forms, routes, entities, DTOs, or future abstractions speculatively.
6. After changes, run `npm run build`; run `npm run lint` only if the script exists or the task requires it.
7. Fix errors caused by the change.
8. Summarize changed files, dependencies, and checks performed.

## API Rules

- Route all backend calls through `src/lib/api` or the existing centralized API layer.
- Read the backend base URL from `NEXT_PUBLIC_API_URL`.
- Never hardcode backend URLs in components.
- Use one shared HTTP approach for JSON parsing, HTTP errors, 401, 403, 404, and network failures.
- Keep repeated fetch logic out of UI components.
- Add feature-level API functions only when real backend endpoints and data needs are known.
- Do not invent frontend contracts separately from backend DTOs.

## TanStack Query

- Use queries for data read from the backend.
- Use stable, descriptive query keys.
- Use mutations for create/update/delete or action endpoints.
- Invalidate related queries after successful mutations.
- Do not duplicate server state in global client state.

## Forms

- Use React Hook Form for form state.
- Use Zod for client-side validation.
- Treat frontend validation as UX only; backend validation remains the source of truth.
- Do not create forms or schemas before the required fields and backend contract are known.

## UI Rules

- Build a simple, clean administrative interface.
- Avoid heavy animation and premature design systems.
- Prefer reusable components when reuse is real.
- Avoid large monolithic components.
- Separate UI and data fetching when it improves readability.
- Do not finalize UI flows unless the user explicitly asks for that flow.

## Auth Rules

- Do not install Firebase SDK only for future use.
- If Firebase Auth is later selected, the frontend may obtain an access token and send it as `Authorization: Bearer <token>`.
- Spring Boot must validate tokens through Firebase Admin SDK.
- Frontend is not trusted for authorization decisions.
- Do not design the exact auth scheme before a dedicated task.

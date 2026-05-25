# CLAUDE.md — TypeScript React Client

This file documents the coding style, architectural patterns, and conventions for the
Aftok TypeScript React client (`client/ts/`).

## Architecture: Capability Pattern

All side effects are routed through **explicitly-typed capability interfaces** passed as
component props.

### Structure

Each feature area has three files:

- **Interface** (`capabilities/foo.ts`) — defines the capability as a TypeScript interface
- **Live implementation** (`capabilities/foo.ts` or inline) — wires to real API calls
- **Mock implementation** (`capabilities/foo.ts` or inline) — returns canned data for testing

```typescript
// Interface
export interface LoginCapability {
  login: (username: string, password: string) => Promise<LoginResponse>;
  checkLogin: () => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

// Live implementation
export const apiLoginCapability: LoginCapability = {
  login: apiLogin,
  checkLogin: apiCheckLogin,
  logout: apiLogout,
};
```

### Rules

- **No React Context for capabilities.** Capabilities are always passed as props.
- **Capabilities are assembled at the root** (`App.tsx`).
- **Nested capabilities** are used when a page has sub-features (e.g., `OverviewCapability`
  contains `inviteCaps: InviteCapability` and `createCaps: CreateProjectCapability`).

## Error Handling: Either, Not Exceptions

Capability functions return `Either<APIError, T>` (a discriminated union), never throw:

```typescript
type Either<L, R> = { type: "left"; value: L } | { type: "right"; value: R };

const result = await caps.getProjectDetail(pid);
if (result.type === "left") {
  system.error(`Failed: ${result.value.type}`);
} else {
  setProjectDetail(result.value);
}
```

## Modal Pattern: Event-Driven Results

Modals produce a **single discriminated union result** rather than separate `onClose`/`onSuccess`
callbacks. The parent owns all coordination logic (closing the modal, updating state).

```typescript
// Modal defines its result type
export type CreateProjectResult =
  | { type: "created"; pid: ProjectId }
  | { type: "cancelled" };

// Modal props take a single onResult callback
interface CreateProjectModalProps {
  open: boolean;
  onResult: (result: CreateProjectResult) => void;
  // ...
}

// Parent handles the result in one place
function handleCreateResult(result: CreateProjectResult) {
  setShowCreateModal(false);
  if (result.type === "created") {
    onProjectChange(result.pid);
    setProjectListKey((k) => k + 1);
  }
}
```

## API Layer

- **XSRF protection**: `api/xsrf.ts` reads the `XSRF-TOKEN` cookie and attaches it as
  `X-XSRF-TOKEN` on mutating requests. Cookie values may contain `=` (base64 padding);
  use `substring` not `split("=")` to parse.
- **`api/http.ts`**: Wraps `fetch` with `credentials: "include"` and XSRF headers.
- **`api/json.ts`**: `parseResponse` / `parseResponseMaybe` convert HTTP responses to
  `Either<APIError, T>`.
- **Response parsing should be rigorous.** Do not use `as SomeType` casts on `unknown` JSON.
  Use Zod schemas (or explicit validation) so that mismatches between server and client
  produce clear errors rather than silent `undefined` propagation.

## Technology Stack

| Concern       | Choice                     | Notes                                    |
|---------------|----------------------------|------------------------------------------|
| Build         | Vite                       | `base: "/app/"` for nginx serving path   |
| UI            | React 18+ with TypeScript  |                                          |
| Routing       | React Router v6            | Path-based (`/overview`), not hash-based |
| Styling       | Tailwind CSS               | Replaces Bootstrap 4                     |
| Capabilities  | TypeScript interfaces      | Props, not Context                       |
| Deployment    | Docker multi-stage build   | `Dockerfile.k8s`                         |

## Conventions

- **No implicit global state.** The `System` interface abstracts browser APIs (`now()`,
  `log()`, `error()`, `fetchConfig()`).
- **ProjectSelector refreshKey pattern**: increment a counter prop to force the dropdown
  to re-fetch the project list (e.g., after creating a project).
- **`useTimer` hook**: wraps `setInterval` for the timeline elapsed-time display.
- **Paths**: All API calls use relative paths like `/api/projects` — the Vite proxy or
  nginx handles routing.

## Common Pitfalls

- The server returns bare UUID strings for some creation endpoints (e.g., `POST /api/projects/`).
  Ensure decoders match the actual response shape, not an assumed `{ id: "..." }` wrapper.
- `parseResponse` only treats HTTP 200 as success. Servant's `Post` returns 200, not 201.
- Timer intervals for UI updates (e.g., elapsed time) should be 1 second, not longer.

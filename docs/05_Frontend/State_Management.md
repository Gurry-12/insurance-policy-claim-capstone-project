# Frontend State Management

> How state is held in the React SPA without an external state library: `AuthContext` + `ThemeContext` + an in-memory token store, server-driven auth events, toast notifications, local form state, and the two pagination models.

## Purpose

Documents every state-management decision in `insurance-policy-claim-management-app-ui`: what state exists, where it lives, and — crucially — *why* each approach was chosen. Engineers use this to decide where new state belongs before adding it, and to understand the session/refresh lifecycle. Implementation detail for the state section of [`../01_System_Architecture/Frontend_Architecture.md`](../01_System_Architecture/Frontend_Architecture.md).

## Overview

The app deliberately uses **no external state-management library** (no Redux, no Zustand, no React Query). State is split into:

| Concern | Owner | Persistence |
|---|---|---|
| Auth (token, user, restore, login/logout) | `src/context/AuthContext.jsx` + `src/api/tokenStore.js` | token in memory only; non-sensitive session markers in `localStorage` |
| Light/dark + role theme | `src/context/ThemeContext.jsx` | theme name in `localStorage` (`ss_theme`) |
| Global API error handling | `GlobalApiHandler` (event listeners) + `GlobalToaster` | n/a (ephemeral) |
| Server-driven auth events | `window` CustomEvents | n/a |
| Form data | local `useState` / `react-hook-form` | n/a |
| Server-paginated tables | `useApiTable` | n/a |
| Client-paginated lists | `useClientPagination` / `useSearch` | n/a |

Every page renders from the REST API; there is no shared server-state cache on the client.

## Business Context

An insurance portal must keep sessions secure and unambiguous. The driving constraints are: (1) the access token must never be readable by XSS payloads; (2) a page reload should not log a user out while their refresh session is alive; (3) role separation must be reflected in what state a user can ever hold; and (4) list pages must scale to thousands of records without re-fetching everything.

## Technical Design

### AuthContext — session lifecycle

`src/context/AuthContext.jsx` exposes `{ token, user, isAuthenticated, isRestoring, login, logout }`.

- **State shape.** `token` (string, mirror of the token store), `user` (object with `id`, `email`, `role`, `name`, `productSpeciality` — built in `authService.login` from the JWT claims and payload), and `isRestoring` (boolean). `isAuthenticated` is derived as `!!token`.
- **`login(newToken, newUser)`** writes the token to `tokenStore`, stores the user, and sets the session markers (`ss_user` = serialized user, `ss_has_session = "1"`).
- **`logout(isForced = false)`** — non-forced logout sets the `isLoggingOut` marker so `ProtectedRoute` redirects to `/login` without `state.from`; then it clears the token, the user, the markers, and calls the server logout (best-effort, HttpOnly refresh-cookie revocation).
- **`restoreSession`** runs once on mount. If `ss_has_session !== "1"` it clears the user and stops. Otherwise it sets `isRestoring = true`, calls `refreshSession()` (`POST /auth/refresh`, which exchanges the HttpOnly refresh cookie for a fresh access token), stores the token, and finally clears `isRestoring`. On failure it removes the markers and resets to logged out.
- **`auth:token-refreshed` listener.** AuthContext also listens for `auth:token-refreshed` events dispatched by the Axios interceptor, keeping `token` in sync when a refresh happens behind the scenes.

**Why session markers and not the token.** The access token is held only in memory (`tokenStore`), so a page reload wipes it. The non-sensitive `ss_has_session` marker tells the app that a refresh cookie exists; `ss_user` allows instant UI render of the user before the refresh round-trips. Neither marker contains a credential. Code note: although the flag names use the `ss_` (session-store) prefix, the implemented code persists these markers in `localStorage`; the access token itself is never written to any browser storage.

### tokenStore — in-memory access token

`src/api/tokenStore.js` is a tiny module: `getToken`, `setToken`, `clearToken` around a module-level `let accessToken`.

**Why not `localStorage`/`sessionStorage`?** An XSS payload that runs in the page can read any browser storage, but it cannot reach a closure variable. Keeping the access token out of storage shrinks the blast radius of a script injection: an attacker could read UI data but never mint or replay a bearer token. Long-lived credential storage is delegated to the **HttpOnly refresh cookie** (`refresh_token`, rotated on every use, 7-day TTL, backend-controlled — see [`../01_System_Architecture/Security_Architecture.md`](../01_System_Architecture/Security_Architecture.md)), which JavaScript cannot read but which the app uses to silently re-issue access tokens on boot and on 401. The trade-off — the token does not survive a reload — is removed by the silent restore.

### ThemeContext — light/dark theme

`src/context/ThemeContext.jsx` holds `{ theme, toggleTheme }`. `theme` initializes from `localStorage.getItem("ss_theme") ?? "light"`. An effect applies `data-theme` **and** `data-bs-theme` on `document.documentElement` (driving both custom CSS variables and Bootstrap 5.3's built-in dark mode) and persists the choice. The *role* theme is separate: `UnifiedLayout` adds `theme-admin` / `theme-staff` / `theme-customer` on its wrapper, and the CSS role blocks override `--ip-brand` for the accent (see [`Layout.md`](Layout.md) and [`UI_Workflows.md`](UI_Workflows.md)).

### Server-driven auth events (GlobalApiHandler)

The Axios response interceptor (`src/api/axiosInstance.js`) never touches React state. Instead it dispatches `window` CustomEvents that `GlobalApiHandler` consumes:

| Event | Dispatch condition | Handler behavior |
|---|---|---|
| `auth:token-refreshed` | a 401 was silently refreshed with a new token | `AuthContext` stores the new token |
| `auth:unauthorized` | refresh failed / a protected call 401'd with no retry possible | `logout(true)` (forced — no `isLoggingOut` marker), toast "Session expired", `navigate("/login", { state: { from: location } })` |
| `auth:forbidden` | HTTP 403 | `navigate("/unauthorized")` |
| `api:error` | status >= 500 or network error | toast the message |

This keeps the HTTP layer decoupled from components: no page subscribes to 401s itself. Full detail in [`API_Integration.md`](API_Integration.md).

### Toast notifications

`src/utils/notificationService.js` wraps `react-hot-toast` in a singleton `notify` object (`success`, `error`, `warning`, `info`), preferring the backend message as the single source of truth. `GlobalToaster` renders one styled `<Toaster position="top-right">` with a frosted-glass look. Hooks and pages call `notify.*`; they never construct toasts directly.

### Form state

- **`react-hook-form`** is used on forms needing field-level validation and touched-on-blur behavior (e.g. `Login`).
- **Local `useState`** drives most feature forms (e.g. `Register`, `ForgotPassword`, `RaiseClaimPage`, `PurchasePolicyPage`) with a local `errors` object for field errors; `useApiForm` centralizes the submit/loading/fieldErrors pattern for API-backed forms.
- Server validation errors (`fieldErrors` from `parseErrorResponse`) are surfaced beside the fields.

**Why local form state.** Forms are short-lived and page-scoped; lifting them into a global store adds indirection without shared benefit, and `react-hook-form` already handles the expensive re-render concerns.

### Pagination state — two models

- **Server pagination (`useApiTable`).** Keeps `{ data, loading, error, pagination, params }`; any page/sort/filter change triggers a new request with query params, and the `PageResponseDTO` envelope supplies `pageNumber/pageSize/totalRecords/totalPages`. Used for admin/staff list pages where datasets are large and the backend is authoritative.
- **Client pagination (`useClientPagination` + `useSearch`).** Slices an already-fetched array into pages (`pageItems`) and filters in memory. Used for lightweight customer-facing lists (products, plans, claims) where the whole dataset is small enough to fetch once.

**Why both.** Re-fetching a page per click is wasteful when the total is a handful of rows, but slicing 10,000 rows client-side is wasteful and stale. The choice is dataset-size-driven; `useApiTable` on anything the backend can page, client-side hooks on small catalog/dashboard lists.

## Workflow

1. On boot `main.jsx` mounts `ThemeProvider → AuthProvider → BrowserRouter → App`.
2. `AuthProvider` runs `restoreSession`: reads `ss_has_session`, optionally refreshes the token, and flips `isRestoring`.
3. A page calls a service → `axiosInstance` attaches the in-memory token. On 401 it single-flight-refreshes and retries; on refresh failure it dispatches `auth:unauthorized`, which `GlobalApiHandler` converts into forced logout + redirect.
4. `ThemeContext` keeps `data-theme`/`data-bs-theme` in sync; `UnifiedLayout` applies the role theme class.
5. `GlobalToaster` renders whatever `notify.*` produces.

## Code References

| Concern | File (repo-root-relative path) |
|---|---|
| Auth context | `insurance-policy-claim-management-app-ui/src/context/AuthContext.jsx` |
| In-memory token store | `insurance-policy-claim-management-app-ui/src/api/tokenStore.js` |
| Theme context | `insurance-policy-claim-management-app-ui/src/context/ThemeContext.jsx` |
| Axios interceptors + events | `insurance-policy-claim-management-app-ui/src/api/axiosInstance.js` |
| Event consumers | `insurance-policy-claim-management-app-ui/src/components/common/GlobalApiHandler.jsx`, `GlobalToaster.jsx` |
| Notification service | `insurance-policy-claim-management-app-ui/src/utils/notificationService.js` |
| Pagination hooks | `insurance-policy-claim-management-app-ui/src/hooks/useApiTable.js`, `useClientPagination.js`, `useSearch.js` |

## Diagrams

- Session boot/restore and 401-refresh flows: [`Protected_Routes.md`](Protected_Routes.md) (Mermaid).
- Interceptor flow: [`API_Integration.md`](API_Integration.md) (Mermaid).

## Best Practices

- Keep the access token out of browser storage and out of state trees; derive `isAuthenticated` from it.
- Route global HTTP outcomes through `window` events to a single handler, never page-level interceptor logic.
- Use the backend message as the toast source of truth.
- Pick pagination by dataset size: server-side for large lists, client-side for small ones.

## Future Improvements

- A typed client-side cache (React Query/SWR) if cross-page cache invalidation becomes necessary.
- See `../10_Evaluation/Future_Enhancements.md`.

## See Also

- [`Custom_Hooks.md`](Custom_Hooks.md) — the hooks that own most local state.
- [`API_Integration.md`](API_Integration.md) — the events and token flow behind the scenes.
- [`Protected_Routes.md`](Protected_Routes.md) — guards that read this state.
- [`../01_System_Architecture/Frontend_Architecture.md`](../01_System_Architecture/Frontend_Architecture.md) — system overview.

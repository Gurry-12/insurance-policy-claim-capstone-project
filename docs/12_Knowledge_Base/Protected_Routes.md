# Protected Routes

## What It Is
Route guards are components that decide whether a route may render.
Routes are declared centrally in `src/App.jsx` using React Router 7.
Guards wrap route groups with `<Route element={...}>` and render either
an `<Outlet />` (allowed) or a `<Navigate />` (denied).

## Why It Is Used
- Enforces authentication and role-based access on the client before a
  page mounts, improving UX and providing defense in depth.
- Centralizes redirect rules so every `/admin/*`, `/staff/*`, and
  `/customer/*` route inherits them.
- The server still enforces security through Spring Security (JWT plus
  roles); guards are a UX layer, not the only control.

## Where It Is Used in This Project
Verified against `insurance-policy-claim-management-app-ui/src/App.jsx`:
- `AuthLoading`: full-page spinner shown while the silent session
  restore (`isRestoring`) is in flight.
- `ProtectedRoute`: if restoring, shows `AuthLoading`; if
  unauthenticated, redirects to `/login` with
  `state={{ from: location }}` (and honors an `isLoggingOut` marker to
  avoid bouncing back after an explicit logout).
- `GuestRoute`: wraps `/`, `/login`, `/register`, `/forgot-password`,
  `/verify-otp`; an already-authenticated user is redirected to their
  role dashboard.
- `RoleProtectedRoute`: takes `allowedRole` and compares it against
  `user.role` using `ROLES` from `src/utils/roles.js`
  (`ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`); a mismatch
  redirects to the user's own dashboard or `/unauthorized`.
- `DashboardRedirect`: resolves `/dashboard` to the role-specific home.
- The route tree nests `GuestRoute`, then `ProtectedRoute` wrapping a
  `MainLayout`, then three `RoleProtectedRoute` groups under the
  `/admin/*`, `/staff/*`, and `/customer/*` namespaces, plus a
  `/unauthorized` page and a `*` fallback to `NotFound`.

## Related Files
- `insurance-policy-claim-management-app-ui/src/App.jsx`
- `insurance-policy-claim-management-app-ui/src/hooks/useAuth.js`
- `insurance-policy-claim-management-app-ui/src/context/AuthContext.jsx`
- `insurance-policy-claim-management-app-ui/src/utils/roles.js`

## Related Docs
- ../05_Frontend/Routing.md
- ../05_Frontend/Protected_Routes.md
- ../05_Frontend/State_Management.md
- ../01_System_Architecture/Security_Architecture.md

## Common Interview Questions
1. Why are client-side guards not sufficient for security?
   JavaScript can be bypassed; the backend must independently authorize
   every request through Spring Security and JWT role claims.
2. How does `ProtectedRoute` avoid flashing the login page on reload?
   It waits for `isRestoring` before deciding, so a valid HttpOnly
   refresh cookie silently restores the session first.
3. What does `state={{ from: location }}` achieve?
   It lets the login flow return the user to the page they originally
   requested instead of a fixed dashboard.
4. How is a role mismatch handled?
   `RoleProtectedRoute` redirects the user to their own role dashboard
   (or `/unauthorized`) rather than rendering the forbidden page.
5. What is the difference between `GuestRoute` and `ProtectedRoute`?
   `GuestRoute` keeps anonymous users in and redirects authenticated
   users away; `ProtectedRoute` does the opposite.

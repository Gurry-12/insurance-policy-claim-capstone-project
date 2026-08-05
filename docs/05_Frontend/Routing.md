# Routing
> Centralized, role-based navigation and protected routes using React Router 7.

---

## Purpose
This document explains the routing architecture of the frontend application. It details how URLs map to components, how access is restricted based on user roles, and how nested routes are structured.

---

## Overview
- Centralized route configuration in `App.jsx`.
- Uses React Router 7 for declarative routing.
- Four distinct guard components enforce authentication and authorization.
- Nested routing allows shared layouts for role-specific dashboards.

---

## Business Context
Different users (Administrators, Staff, Customers) need access to different parts of the application. An unauthenticated user should not see a dashboard, and a customer should not access the admin portal. The routing layer is the first line of defense in the frontend to enforce these business rules.

---

## Route Tree Diagram
```mermaid
flowchart TD
    App[App.jsx] --> Public[Public Routes]
    App --> Auth[Auth Routes]
    App --> DashboardGuard[Dashboard Redirect]
    App --> Protected[Protected Routes]

    Public --> Home[/]
    Public --> Unauthorized[/unauthorized]
    Public --> Forbidden[/forbidden]

    Auth --> GuestGuard[GuestRoute]
    GuestGuard --> Login[/login]
    GuestGuard --> Register[/register]
    GuestGuard --> Verify[/verify]
    GuestGuard --> Reset[/reset-password]

    Protected --> AuthGuard[ProtectedRoute]
    AuthGuard --> AdminRoute[RoleProtectedRoute: ADMIN]
    AuthGuard --> StaffRoute[RoleProtectedRoute: STAFF]
    AuthGuard --> CustRoute[RoleProtectedRoute: CUSTOMER]

    AdminRoute --> AdminLayout[Admin Layout]
    AdminLayout --> AdminDash[/admin/dashboard]
    AdminLayout --> AdminUsers[/admin/users]

    StaffRoute --> StaffLayout[Staff Layout]
    StaffLayout --> StaffDash[/staff/dashboard]
    StaffLayout --> StaffClaims[/staff/claims]

    CustRoute --> CustLayout[Customer Layout]
    CustLayout --> CustDash[/customer/dashboard]
    CustLayout --> CustPolicies[/customer/policies]
```

---

## Complete Route Table

| Path | Component | Auth Required? | Role Required |
|------|-----------|----------------|---------------|
| `/` | `LandingPage` | No | None |
| `/login` | `LoginPage` | No (Guest) | None |
| `/register` | `RegisterPage` | No (Guest) | None |
| `/verify` | `VerifyOTPPage` | No (Guest) | None |
| `/unauthorized`| `UnauthorizedPage`| No | None |
| `/forbidden` | `ForbiddenPage` | No | None |
| `/dashboard` | `DashboardRedirect`| Yes | Any |
| `/admin/*` | `UnifiedLayout` | Yes | `ROLE_ADMIN` |
| `/staff/*` | `UnifiedLayout` | Yes | `ROLE_INTERNAL_STAFF` |
| `/customer/*`| `UnifiedLayout` | Yes | `ROLE_CUSTOMER` |

---

## Guard Components Explained

### 1. ProtectedRoute
Ensures the user is authenticated. Checks `AuthContext`. If no user is logged in, redirects to `/login`.

### 2. GuestRoute
Ensures the user is NOT authenticated. Used for login/register pages. If an authenticated user tries to access these, redirects them to `/dashboard`.

### 3. RoleProtectedRoute
Ensures the authenticated user has the required role (e.g., `ROLE_ADMIN`). If the role doesn't match, redirects to `/forbidden`.

### 4. DashboardRedirect
A utility route at `/dashboard`. It checks the user's role and redirects them to their specific dashboard (`/admin/dashboard`, `/staff/dashboard`, or `/customer/dashboard`).

---

## Nested Route Structure
The application uses nested routes to apply a common layout (`UnifiedLayout`) to all routes within a specific role's domain. For example, all `/admin/*` routes share the admin sidebar and top navigation.

---

## Deep-link Behavior for OTP Verification
The `/verify` route accepts query parameters (e.g., `?email=test@test.com&type=login`) to support deep-linking from emails. This pre-fills the verification form and sets the context for the OTP submission.

---

## Design Decisions

| Decision | Reason | Trade-offs |
|----------|--------|------------|
| **Centralized routing in App.jsx** | Easier to see the entire application structure in one place. Simplifies guard application. | `App.jsx` can become large, but breaking it down with sub-routers or route arrays mitigates this. |
| **Nested routes per role** | Allows role-specific layouts and sidebars while sharing the same underlying `UnifiedLayout` component logic. | Requires repeating the layout wrapper for each role group. |
| **Separate guard components** | Promotes Single Responsibility Principle. Easier to test and reuse (e.g., combining `ProtectedRoute` and `RoleProtectedRoute`). | Slightly more boilerplate than a single complex guard component. |
| **Client-side redirect vs blocking** | Redirecting provides a better UX than just showing a blank or error screen when a user stumbles on the wrong URL. | Can cause a quick flash if state initialization is slow. |

---

## Interview Notes

1. **Why do we need frontend routing if the backend enforces security?**
   Frontend routing improves UX by preventing users from navigating to pages they can't use, but it doesn't replace backend security. The backend must always validate the token and role for every API request.
2. **How does `DashboardRedirect` work?**
   It reads the user's role from context and performs a client-side redirect (`navigate()`) to the correct role-specific dashboard path.
3. **What happens if a user directly types `/admin/dashboard` but isn't logged in?**
   `ProtectedRoute` intercepts the render, sees no auth token/state, and redirects to `/login` (often appending a `?redirect=/admin/dashboard` param to return them after login).
4. **How are layouts applied in React Router 7?**
   Using nested routes (`<Route element={<Layout/>}>`). The `Layout` component renders an `<Outlet />` where the child route components are injected.

---

## Related Documents
- [State Management](State_Management.md)
- [Protected Routes](Protected_Routes.md)
- [Layout](Layout.md)

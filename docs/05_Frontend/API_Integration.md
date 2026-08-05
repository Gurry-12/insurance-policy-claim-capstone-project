# API Integration
> Centralized Axios configuration with automated token injection, silent refresh, and global error handling.

---

## Purpose
This document explains how the frontend communicates with the backend, including request configuration, automatic authentication handling, and the structure of the service layer.

---

## Overview
- Uses Axios for all HTTP requests.
- Interceptors inject the access token into every request.
- Response interceptors automatically handle token refresh on 401 errors using a single-flight mechanism.
- Uses custom DOM events to communicate auth state changes from the API layer to React components.
- NProgress provides visual feedback for network activity.

---

## Business Context
Consistent API communication is crucial. Users should not be abruptly logged out when their access token expires if a valid refresh token exists. Error handling must be uniform across the app.

---

## Architecture Diagram
```mermaid
flowchart TD
    Component[React Component] --> Service[Service Layer (e.g., UserService)]
    Service --> AxiosInstance[axiosInstance]
    
    AxiosInstance --> ReqInt[Request Interceptor]
    ReqInt --> AddToken[Add Authorization Header]
    AddToken --> Backend[Backend API]
    
    Backend --> ResInt[Response Interceptor]
    
    ResInt -- 2xx --> Service
    ResInt -- 401 Unauthorized --> RefreshLogic[Refresh Token Logic]
    
    RefreshLogic -- Success --> Retry[Retry Original Request]
    Retry --> Service
    
    RefreshLogic -- Failure --> DispatchLogout[Dispatch 'auth:unauthorized']
    DispatchLogout --> AuthProvider[AuthProvider handles logout]
```

---

## Core Mechanisms

### Request Interceptor
Before a request leaves, it retrieves the access token from `tokenStore`. If it exists, it attaches it as `Authorization: Bearer <token>`. It also starts the `NProgress` loading bar.

### Response Interceptor & Refresh Logic
When a response returns:
1. It stops the `NProgress` bar.
2. If successful (2xx), it passes data back to the caller.
3. If it encounters a `401 Unauthorized`, it assumes the access token expired.

**Single-Flight Refresh Mechanism:**
To prevent multiple parallel API calls from all trying to refresh the token simultaneously:
- A `isRefreshing` flag is set.
- Subsequent failed requests are pushed into a `refreshSubscribers` queue.
- The refresh API (`/auth/refresh`) is called.
- On success, the new token is saved, and all queued requests are retried with the new token.
- On failure, all queued requests are rejected, and an `auth:unauthorized` event is dispatched.

### Event Dispatch System
Axios exists outside the React component tree, so it uses `window.dispatchEvent(new CustomEvent(...))` to communicate with the `AuthProvider` and global UI elements.
- `auth:token-refreshed`: Signal to update user state if needed.
- `auth:unauthorized`: Signal to log the user out and redirect to `/login`.
- `auth:forbidden`: Signal to redirect to `/forbidden`.
- `api:error`: Generic signal to show a toast notification for 500 errors.

---

## Service Layer Architecture
Located in `src/services/`, these files encapsulate API calls, providing clean interfaces for components.

| File Name | Resource | Key Methods |
|-----------|----------|-------------|
| `authService.js` | `/api/auth` | `login`, `register`, `verifyOTP`, `refresh`, `logout` |
| `policyService.js`| `/api/policies` | `getPolicies`, `getPolicyById`, `createPolicy`, `calculatePremium` |
| `claimService.js` | `/api/claims` | `submitClaim`, `getClaims`, `updateClaimStatus` |
| `userService.js` | `/api/users` | `getUsers`, `getUserProfile`, `updateUser` |

---

## Design Decisions

| Decision | Reason | Trade-offs |
|----------|--------|------------|
| **Axios over Fetch API** | Built-in interceptors, automatic JSON transformation, easier error handling. | Slightly larger bundle size. |
| **Single-flight refresh** | Prevents race conditions and redundant network requests when multiple API calls fail simultaneously. | Adds complexity to the interceptor logic. |
| **Custom Event Dispatch** | Allows Axios (outside React) to trigger React state updates (like logout) without circular dependencies. | Relies on global DOM events, which can be harder to trace than direct function calls. |

---

## Error Handling

- **401 Unauthorized**: Triggers silent refresh. If refresh fails, logs user out.
- **403 Forbidden**: Dispatches `auth:forbidden`, triggering a redirect.
- **400 Bad Request**: Service returns validation errors to the component form.
- **500 Internal Server Error**: Dispatches `api:error`, showing a global toast notification.

---

## Interview Notes

1. **How does the frontend handle token expiration?**
   Using an Axios response interceptor. On a 401 response, it pauses the original request, calls the refresh token endpoint, updates the access token, and then retries the original request.
2. **What is the "single-flight" pattern in the context of token refreshing?**
   If multiple requests fail with 401 at the same time, only the first one triggers the refresh API call. The others are queued and wait for the new token before retrying.
3. **How does Axios communicate with React Context (like AuthProvider)?**
   By dispatching custom DOM events (`window.dispatchEvent`). `AuthProvider` listens for these events to update its state or trigger redirects.
4. **Why put API calls in a service layer instead of inside components?**
   Separation of concerns. It keeps components clean, makes API logic reusable, and creates a single place to update endpoints if the backend changes.
5. **How are headers attached to requests?**
   Via an Axios request interceptor that reads from the `tokenStore` and adds the `Authorization: Bearer` header.

---

## Related Documents
- [State Management](State_Management.md)

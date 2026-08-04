# Access Token Specification

---

## 1. Lifecycle & Duration
- **Lifetime**: 15 minutes (`app.security.jwt.expiration-ms=900000`).
- **Format**: Signed JWT (HS256).

---

## 2. Delivery & Storage
- **Transmission**: Returned in the JSON response payload on `/api/auth/login` and `/api/auth/refresh`:
  ```json
  {
    "token": "eyJhbGciOi...",
    "type": "Bearer",
    "refreshToken": "..."
  }
  ```
- **Client Storage**: React frontend stores the access token in in-memory state or Axios defaults (never in `localStorage` to mitigate XSS risks).
- **HTTP Header**: Sent on every protected API call:
  ```http
  Authorization: Bearer <access_token>
  ```

---

## 3. Expiry & Renewal
When an Access Token expires, the backend responds with `401 Unauthorized`. The React Axios interceptor automatically catches `401` errors and calls `POST /api/auth/refresh` to obtain a fresh Access Token without requiring user re-login.

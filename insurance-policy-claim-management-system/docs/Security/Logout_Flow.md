# Logout Flow (Single Device & All Devices)

---

## 1. Single Device Logout (`POST /api/auth/logout`)
1. Client sends `POST /api/auth/logout` with the `refresh_token` cookie.
2. Backend revokes the refresh token in MySQL and deletes its hash from Redis.
3. Backend clears the `refresh_token` cookie (`Max-Age=0`).

---

## 2. All Devices Logout (`POST /api/auth/logout-all`)
1. Authenticated user sends `POST /api/auth/logout-all` with `Authorization: Bearer <token>`.
2. Backend calls `authService.logoutAll(userId)`:
   - Sets `revoked=true` for all refresh tokens belonging to `userId`.
   - Evicts all cached refresh tokens for `userId` from Redis.
3. Backend clears the current session cookie.
4. All open browser tabs and devices will fail token renewal and be redirected to the login screen.

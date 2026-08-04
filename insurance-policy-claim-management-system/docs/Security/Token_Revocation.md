# Token Revocation & Replay Attack Defense

---

## 1. Single-Token Revocation (`POST /api/auth/logout`)
- When a user logs out of their current browser session:
  1. The presented `refresh_token` cookie is marked as `revoked=true` in MySQL.
  2. The hash is evicted from `auth:refresh:<userId>:<tokenHash>` in Redis.
  3. The `HttpOnly` cookie is cleared from the response header (`Max-Age=0`).

---

## 2. Session Family Revocation (`POST /api/auth/logout-all` & Security Events)
A user may have multiple active sessions (e.g., Laptop Chrome + Mobile Safari). All sessions for a user are revoked simultaneously when:
- The user calls `POST /api/auth/logout-all`.
- The user resets their password (`POST /api/auth/reset-password`).
- An admin deactivates the user account.
- **Replay Attack Detected**: If a revoked refresh token is presented at `/api/auth/refresh` after the 10-second grace window expires.

---

## 3. How Session Family Revocation Works
1. `refreshTokenService.revokeAllForUser(userId)` marks all refresh tokens for that user as `revoked=true` in MySQL and evicts them from Redis.
2. `user.setTokenVersion(current + 1)` increments the user's `tokenVersion` in MySQL.
3. Because every JWT encodes the `ver` claim, `JwtAuthenticationFilter` rejects any existing Access Token where `jwt.ver < user.tokenVersion`.

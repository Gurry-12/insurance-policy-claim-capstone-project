# Session Management & Multi-Device Tracking

---

## 1. Multi-Device Sessions
Because our backend supports multiple concurrent logins per user:
- Each login attempt generates a distinct `refresh_token` record in MySQL linked to the `user_id`.
- Users can log in on multiple devices (e.g., Desktop Chrome and Mobile Phone) simultaneously without kicking each other out.

---

## 2. Token Versioning (`tokenVersion`)
- The `users` table includes a `token_version` BIGINT column (default `0`).
- Every issued JWT Access Token embeds this version number in the `ver` claim.
- When critical security events occur (password reset, admin deactivation, or suspicious replay detection), `tokenVersion` is incremented, immediately terminating all active sessions across every device.

---

## 3. Session Security Auditing
All session events are recorded by `SecurityAuditLogger` with structured logging:
- `[LOGIN_SUCCESS]` / `[LOGIN_FAILED]`
- `[TOKEN_REFRESHED]` / `[REFRESH_REUSE_DETECTED]`
- `[ACCOUNT_DEACTIVATED]`
- `[LOGOUT]`

# Refresh Token & Rotation Specification

---

## 1. Core Architecture
- **Lifetime**: 7 days (`app.security.jwt.refresh-token-ttl-days=7`).
- **Token Type**: Opaque cryptographically random 32-byte Base64URL string.
- **Database Storage**: The raw token is **never** stored in plaintext. Only the SHA-256 hex digest (`tokenHash`) is saved in MySQL (`refresh_tokens` table) and Redis (`auth:refresh:<userId>:<tokenHash>`).

---

## 2. Delivery via HttpOnly Cookie
- To protect against XSS token theft, the Refresh Token is delivered as an `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` HTTP cookie (`refresh_token`).
- It is also optionally returned in the JSON payload for mobile/native clients.

---

## 3. Token Rotation & Replay Attack Detection
When `/api/auth/refresh` is called:
1. The presented refresh token is marked as `revoked=true` in MySQL and evicted from Redis.
2. A new refresh token is issued and linked via the `replacedBy` field.
3. **Replay Detection**: If an already-revoked refresh token is presented, the system assumes token theft and **revokes the entire session family** (`revokeAllForUser`), logging out the user across all devices.

---

## 4. 10-Second Grace Window for Concurrent Browser Tabs
In modern Single Page Applications (React), multiple open tabs may fire `/api/auth/refresh` simultaneously when the access token expires.
- Without a grace window, Tab A rotates the token, and 50ms later Tab B presents the old token—triggering a false-positive Replay Attack detection and logging the user out.
- **Our Solution**: When a token is rotated, `RefreshTokenService` caches a **10-second grace mapping** in Redis (`auth:refresh:grace:<oldTokenHash> -> <newTokenHash>`).
- If another tab requests a refresh within 10 seconds, the service recognizes it as a benign concurrent request and throws a graceful session-expired exception instead of revoking the session family.

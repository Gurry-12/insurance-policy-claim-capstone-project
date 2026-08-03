# Refresh Token

## What It Is
- An opaque 256-bit (32-byte) random token generated with `SecureRandom` and encoded Base64url (no padding). The raw value is never persisted; only its **SHA-256 hex digest** is stored in the `refresh_tokens` table.
- Delivered to the browser as an **HttpOnly cookie** named `refresh_token`, scoped to path `/api/auth`, `SameSite=Lax`, with the `Secure` flag configurable via `app.security.jwt.refresh-cookie-secure`.
- TTL is 7 days (`app.security.jwt.refresh-token-ttl-days`), refreshed on every rotation.
- Lifecycle endpoints: `POST /api/auth/refresh` rotates the token and issues a fresh access token; `POST /api/auth/logout` revokes it and clears the cookie.

## Why It Is Used
- Long-lived session continuity without exposing credentials on every call.
- HttpOnly + path scoping protects against XSS theft and restricts where the cookie is sent; `SameSite=Lax` prevents cross-site POST usage (CSRF mitigation).
- **Rotation on every use** plus **reuse detection** (presenting an already-revoked token revokes the entire session family) protects against replay and theft.
- DB-backed storage allows explicit revocation on logout, password reset, and account deactivation.

## Where It Is Used in This Project
- `security/RefreshTokenService.java`: `createRefreshToken`, `rotate` (atomic claim via `claimAndIssue` in a `REQUIRES_NEW` transaction), `revoke`, `revokeAllForUser`, `revokeSessionFamily`.
- `repository/RefreshTokenRepository.java`: `revokeAndMarkReplaced` (conditional update so only one concurrent rotation can win), `revokeAllActiveForUser`, `purgeStale` (used by the cleanup scheduler).
- `config/RefreshTokenCookieManager.java`: writes and clears the `refresh_token` cookie.
- `model/RefreshToken.java`: `tokenHash`, `jti`, `expiresAt`, `revoked`, `replacedBy`, and a `tokenVersion` snapshot.
- `controller/AuthController.java`: `/refresh` and `/logout` read the cookie and delegate to the service.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/RefreshTokenService.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/RefreshTokenCookieManager.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/RefreshToken.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/RefreshTokenRepository.java

## Related Docs
- ../06_Backend/Security.md
- ../06_Backend/JWT.md
- ../01_System_Architecture/Security_Architecture.md
- ../03_API/Authentication_API.md

## Common Interview Questions
1. Why store only a SHA-256 hash of the refresh token? — A database leak then yields no usable tokens; the raw token only exists in the client's cookie.
2. What happens if a rotated (revoked) token is presented again? — Replay is assumed; `rotate` calls `revokeSessionFamily`, revoking all active refresh tokens for that user, and throws `SESSION_EXPIRED`.
3. How are concurrent refresh requests handled? — `revokeAndMarkReplaced` flips `revoked` only for an active, unexpired row, so at most one request wins; losers observe zero rows and are treated as replays.
4. Why is the cookie scoped to `/api/auth`? — So it is only ever sent to the refresh and logout endpoints, reducing exposure.
5. What forces a full re-login? — Password reset and account deactivation bump `tokenVersion`; `rotate` compares the stored snapshot and revokes the family.

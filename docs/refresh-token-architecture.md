# Refresh Token Architecture

> Status: **implemented** (backend + frontend + integration tests). The previous
> "deferred" proposal was built out in this stage: opaque, DB-backed, HttpOnly-cookie
> refresh tokens with rotation and reuse/family revocation.

## Why

Short-lived access tokens alone (15 min) force a re-login every 15 minutes and give no
graceful way to invalidate a stolen token. A refresh token, kept out of JS-reachable
storage, fixes both:

1. **Expiry UX** — the access token can be short-lived while a refresh cookie silently
   renews it, so the user stays logged in.
2. **Revocation** — revoking a refresh token ends the session (logout, password reset,
   deactivation) and kills the whole token family on replay.
3. **localStorage exposure** — the long-lived credential lives in an **HttpOnly cookie**
   the browser manages; JS (and therefore XSS) cannot read it.

## Flow

```
POST /api/auth/login
  → 200 body { data: { token, tokenType, userId, ... } }   // refreshToken NOT in body
  → Set-Cookie: refresh_token=<opaque>; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=7d

POST /api/auth/refresh         (reads the HttpOnly cookie)
  → validates + rotates: old token revoked (replaced_by set), new one issued
  → 200 body { data: { accessToken, tokenType } }  + new refresh_token cookie
  → 401 { errorType: "INVALID_REFRESH_TOKEN" } when cookie missing/expired/invalid

POST /api/auth/logout          (reads the HttpOnly cookie)
  → revokes the presented token and clears the cookie (Max-Age=0)
```

On the frontend, `src/api/axiosInstance.js` retries any protected call that returns `401`
exactly once: a single-flight (shared promise) `POST /api/auth/refresh` obtains a new
access token, `localStorage`/AuthContext are updated, and the original request is replayed
with the new `Authorization: Bearer` header. If the refresh itself fails, the session is
treated as expired and the user is sent to `/login`.

## Data model

```sql
refresh_tokens (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  token_hash    CHAR(64) NOT NULL,        -- SHA-256 of the raw token, never stored raw
  jti           CHAR(36) NOT NULL UNIQUE,
  expires_at    TIMESTAMP NOT NULL,
  revoked       BOOLEAN NOT NULL DEFAULT FALSE,
  replaced_by   VARCHAR(36) NULL,         -- jti of the rotating replacement
  token_version BIGINT NOT NULL,          -- snapshot of app_user.token_version at issue
  created_at    TIMESTAMP NOT NULL,
  INDEX (user_id), UNIQUE INDEX (jti)
)
```

- Only the **SHA-256 hex digest** is stored; a DB leak yields no usable tokens.
- The raw token is a 32-byte `SecureRandom` value, Base64url-encoded (~43 chars).
- The schema is auto-created by `ddl-auto=update` (dev/test).

## Rotation & reuse detection (`RefreshTokenService.rotate`)

Every successful refresh:

1. Looks up the presented token by hash; missing → `401 INVALID_REFRESH_TOKEN`.
2. `revoked == true` → **replay**: revokes every active token for the user (whole session
   family) and logs `SECURITY_AUDIT [REFRESH_REUSE_DETECTED]`, then returns `401`.
3. Expired → `401`.
4. User deactivated, or `token_version` snapshot differs from current (`password reset` /
   `deactivation` since issue) → family revoked, `401`.
5. Otherwise marks the old token `revoked = true` (with `replaced_by`), issues a fresh one,
   logs `[REFRESH_TOKEN_ROTATED]`, and returns the raw token to be set as the new cookie.

The family revocation in steps 2–4 runs in a `REQUIRES_NEW` transaction
(`revokeSessionFamily`), so it **commits even though the surrounding rotation transaction
rolls back** with the exception — the rejection must not undo the revocation.

## Cookie handling (`RefreshTokenCookieManager`)

- Name `refresh_token`, **HttpOnly** (never readable by JS).
- `SameSite=Lax` — never attached to cross-site POSTs (CSRF mitigation).
- `Path=/api/auth` — only ever sent to the refresh/logout endpoints.
- `Secure` flag driven by `app.security.jwt.refresh-cookie-secure`: `true` in the `prod`
  profile, `false` by default so it works over plain `http://localhost` in dev.
- Rotation on every use; TTL 7 days (`app.security.jwt.refresh-token-ttl-days`).

## Revocation events

| Event | Effect |
|-------|--------|
| `logout` | revokes the presented token, clears cookie |
| password reset | `revokeAllForUser` (all active refresh tokens die) |
| account deactivation | `revokeAllForUser` |
| refresh replay | whole session family revoked + `REFRESH_REUSE_DETECTED` audit |

## Security properties

| Property | Value |
|----------|-------|
| Access token TTL | 15 min (`app.security.jwt.expiration-ms`) |
| Refresh token TTL | 7 days (`app.security.jwt.refresh-token-ttl-days`) |
| Refresh token storage | SHA-256 hash in DB; raw value only in HttpOnly cookie |
| Rotation | every refresh |
| Reuse detection | revoke whole family + audit on revoked-token replay |
| Refresh rate limit | separate Bucket4j bucket (`app.security.rate-limit.refresh.*`, default 10/min) |
| Refresh token in JSON | never serialized (`@JsonIgnore` on `LoginResponseDTO`/`RefreshResponseDTO`) |

## Test coverage

`RefreshTokenIntegrationTest` (9 tests, real MySQL via `env.properties`, profile `test`):
cookie issuance (HttpOnly, Path, SameSite, opaque value, `refreshToken` absent from body),
cookie not `Secure` outside prod, rotation + new access token, refresh without cookie → 401,
reuse → family revocation, expired token → 401, password-reset revocation, deactivation
revocation, and logout revocation + cookie clearing.

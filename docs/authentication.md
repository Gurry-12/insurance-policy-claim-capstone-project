# Authentication (JWT) — Implementation Notes

> Status: implemented and covered by integration tests. This document describes the
> Stage 1 authentication hardening as built in `insurance-policy-claim-management-system`,
> plus the Stage 3 refresh-token flow (see
> [`refresh-token-architecture.md`](refresh-token-architecture.md) for the full design).

## Overview

The system uses **stateless JWT bearer authentication** (`SessionCreationPolicy.STATELESS`).
A login returns a signed **access token** and also sets an **HttpOnly refresh cookie**;
protected requests carry the access token in `Authorization: Bearer <token>`, and the
refresh cookie silently renews the access token when it expires. There is no server-side
session and no CSRF token (correct for a Bearer-token API; the refresh endpoint is
additionally protected by `SameSite=Lax` + its own rate-limit bucket).

## Request flow

```
Browser/API
   │  POST /api/auth/login  {email, password}
   ▼
RateLimitFilter ──(login bucket, key = IP|email)──► 429 + Retry-After if exhausted
   ▼
AuthController ─► AuthServiceImpl
   │   ─► AuthenticationManager (DaoAuthenticationProvider + BCrypt)
   │   ─► JwtService.generateToken(user)          // signed HS256
   │   ─► RefreshTokenService.createRefreshToken(user)
   │   ─► SecurityAuditLogger [LOGIN_SUCCESS] / [LOGIN_FAILED]
   ▼
{ data: { token, tokenType: "Bearer", ... }, success: true }
   │     + Set-Cookie: refresh_token=<opaque>; HttpOnly; SameSite=Lax; Path=/api/auth
   │
   │  GET /api/customers/profile   Authorization: Bearer <token>
   ▼
RateLimitFilter (not a limited path → passes through)
   ▼
JwtAuthenticationFilter ─► JwtService.isTokenValid(token, subject)
   │   (signature, exp + 30 s clock skew, issuer, sub, tokenVersion)
   │   on success → SecurityContext populated with AppUserDetails (DB-loaded authorities)
   │   on failure  → logs, leaves context empty → AuthorizationFilter 401
   ▼
AuthorizationFilter (URL rules) ─► Method security (@PreAuthorize)

   │  401 on any protected call
   ▼
Frontend axios interceptor ─► POST /api/auth/refresh (HttpOnly cookie) ─► new access token
   │   success → retry original request with new Bearer token
   └─ failure → session expired → redirect to /login
```

## Token design

| Field | Value |
|-------|-------|
| Algorithm | `HS256` via jjwt `Keys.hmacShaKeyFor(JWT_KEY)` |
| `sub` | user email |
| `iss` | `insurance-policy-claim-management-system` (`app.security.jwt.issuer`) |
| `iat` / `exp` | issued-at / expiry (`app.security.jwt.expiration-ms`, default `900000` = 15 min) |
| `jti` | random UUID |
| `role` | informational claim only — **never** used for authorization |
| validation | signature + `exp` (with 30 s `app.security.jwt.clock-skew-seconds`) + `iss` + `sub` + **`tokenVersion`** |

Authorities are **always loaded from the database** on each request
(`CustomUserDetailsService` / `AppUserDetails`) so a role change takes effect on the next
request without waiting for token expiry.

## Token revocation (`tokenVersion`)

`app_user.token_version BIGINT` is embedded in the signed JWT. Every issued token carries
the user's current version; `JwtService.isTokenValid` rejects any token whose version does
not match the stored value.

- **Password reset** → bumps `tokenVersion` (all outstanding tokens die).
- **Account deactivation** → bumps `tokenVersion` (all outstanding tokens die).
- **Account (re)activation** → does **not** bump the version. A deactivated user must
  re-login; an old pre-deactivation token stays invalid because the deactivation bump
  already advanced the version and reactivation leaves it unchanged.

## Refresh tokens

A login additionally issues an **opaque refresh token** delivered only as an HttpOnly
cookie (`refresh_token`, `SameSite=Lax`, `Path=/api/auth`). It is stored hashed
(SHA-256) in `refresh_tokens` and is rotated on every `POST /api/auth/refresh`. Presenting
an already-rotated (revoked) token revokes the user's entire session family
(`REFRESH_REUSE_DETECTED`). Password reset and account deactivation revoke all active
refresh tokens; logout revokes the presented one and clears the cookie. The frontend
retries 401 responses after a single silent refresh. See
[`refresh-token-architecture.md`](refresh-token-architecture.md) for the complete design.

## Rate limiting (Bucket4j)

`RateLimitFilter` (registered before the JWT filter) protects the unauthenticated auth
endpoints: `login`, `register`, `verify-otp`, `resend-otp`, `forgot-password`,
`reset-password`, `refresh`, `logout`. Buckets are in-memory, keyed by **IP + email** for
the credential endpoints and **IP** for the cookie endpoints, and fully configurable:

| Group | Defaults | Property |
|-------|----------|----------|
| login | 5 / 5 min | `app.security.rate-limit.login.capacity/refill-per-minute` |
| otp | 5 / 5 min | `app.security.rate-limit.otp.*` |
| forgot | 3 / 3 min | `app.security.rate-limit.forgot.*` |
| reset | 5 / 5 min | `app.security.rate-limit.reset.*` |
| register | 5 / 5 min | `app.security.rate-limit.register.*` |
| refresh | 10 / 10 min | `app.security.rate-limit.refresh.*` |

Exhaustion returns `429` with a `Retry-After` header and `errorType: RATE_LIMITED`
(`RATE_LIMIT_TRIGGERED` audit event). In-memory is a documented limitation — a distributed
limiter is a future enhancement.

## OTP hardening

- 6-digit OTPs (`SecureRandom`), expiry `app.otp.expiry-minutes` (default 5).
- Single-use (`used` flag): reusing a consumed OTP returns
  `"No active OTP found. Please request a new OTP."`.
- Internal attempt counter (`max-otp-attempts`, default 5). After exhaustion the OTP is
  marked used and the **count is never exposed** to the client — the same generic message
  is returned. Failed-attempt increments are written in a `REQUIRES_NEW` transaction
  (`OtpAttemptRecorder`) so they survive the rollback of the failing request.
- Resend limited to 4 sends / 24 h per user with a 60 s resend window.

## Enumeration hardening

- Unknown email and wrong password produce the **same** response:
  `401 "Invalid credentials or account unavailable."`
- Registration with an existing email returns a generic `ACCOUNT_ALREADY_EXISTS` response.
- Forgot-password always returns a generic success body.
- The distinguishing reason is recorded only in the `SECURITY_AUDIT` logger, never in the
  HTTP response.

## Password policy

Backend `@Pattern` (and matching frontend regex): `^(?=.*[A-Za-z])(?=.*\d).{8,64}$`
(at least one letter, one digit, 8–64 chars). Rejection → `400 VALIDATION_FAILED`.

## Audit logging

Security-relevant events are written through `SecurityAuditLogger` to the
`SECURITY_AUDIT` logger: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `TOKEN_INVALID`, `ACCOUNT_ACTIVATED`,
`ACCOUNT_DEACTIVATED`, `PASSWORD_RESET`, `RATE_LIMIT_TRIGGERED`, `REFRESH_TOKEN_ISSUED`,
`REFRESH_TOKEN_ROTATED`, `REFRESH_REUSE_DETECTED`, `REFRESH_TOKEN_INVALID`, `LOGOUT`,
and OTP events.
Reasons are logged server-side only.

## Test coverage

`JwtSecurityIntegrationTest` (15 tests, real MySQL via `env.properties`, profile `test`)
covers: unauthenticated / valid / expired / tampered tokens, admin-endpoint RBAC,
deactivation and password-reset revocation, reactivation not restoring old tokens,
login rate limiting (429 + Retry-After), OTP reuse rejection, OTP attempt exhaustion
(without revealing the count), weak-password registration, generic login failure, and
service-level IDOR scope checks.

`RefreshTokenIntegrationTest` (9 tests, same setup) covers the refresh-token flow: cookie
issuance (HttpOnly, Path, SameSite, opaque value, not in JSON body), rotation, missing-
cookie rejection, reuse → family revocation, expiry, and revocation on password reset,
deactivation and logout.

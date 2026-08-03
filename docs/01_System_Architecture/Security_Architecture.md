# Security Architecture

> Authoritative security overview: threat model and the defense-in-depth controls that protect authentication, authorization, sessions, and data.

## Purpose

Documents the security posture of the system for engineers, reviewers, and evaluators. It maps every security control to its implementation class and to the authoritative deep-dive documents. Implementation detail lives in [`../06_Backend/Security.md`](../06_Backend/Security.md) and [`../06_Backend/JWT.md`](../06_Backend/JWT.md).

## Overview

The system is a stateless JWT-backed REST API consumed by a React SPA. Security is layered so no single failure ends the defense:

1. **Stateless JWT access tokens** (HS256, claims, `tokenVersion`).
2. **Opaque DB-backed refresh tokens** (HttpOnly cookie, rotation, reuse detection, 7-day TTL).
3. **Dual OTP** (email + SMS).
4. **Rate limiting** (Bucket4j) on auth endpoints.
5. **RBAC** (`ROLE_ADMIN` / `ROLE_INTERNAL_STAFF` / `ROLE_CUSTOMER`) at filter and controller level.
6. **CORS origin allowlist + CSRF considerations** for the cookie-authenticated auth endpoints.
7. **BCrypt password storage.**
8. **Secrets via gitignored `env.properties` + Cloudinary secure upload.**

Plus hardening headers and dedicated audit logging.

## Business Context

The system moves money (premium payments) and makes claim-adjudication decisions, so authentication, separation of duties, and a verifiable audit trail are not optional. The threat model below reflects what an attacker would actually target in an insurance portal, and each defense-in-depth layer exists to make that attack harder.

## Threat Model at a Glance

| Threat | Example attack | Primary controls |
|---|---|---|
| Broken authentication | Credential stuffing / weak passwords | BCrypt hashing, login rate limit, dual OTP, token-version revocation |
| Replay | Re-presenting a used refresh token | Refresh-token rotation + family revocation on reuse |
| Brute force | Hammering login/OTP/reset endpoints | Bucket4j per-IP+email limits, OTP attempt cap |
| CSRF / CORS abuse | Cross-site request on cookie-authenticated endpoints | SameSite=Lax cookie, origin/Referer filter, CORS allowlist |
| Token theft | XSS reading the access token | In-memory token (not localStorage), HttpOnly refresh cookie |
| Document upload abuse | Malicious file uploaded as claim evidence | 10 MB multipart cap, secure Cloudinary upload |
| Session persistence | Stolen cookie used after logout/password reset | Rotation, 7-day TTL, tokenVersion bump revokes family |
| Authorization bypass (IDOR) | Accessing another user's policy/claim | URL-level RBAC + service-level ownership checks |

## Technical Design

### Control 1 — Stateless JWT access tokens (HS256)

Short-lived access tokens are issued at login and carried as `Authorization: Bearer`. They are signed with HMAC-SHA256 (jjwt 0.12.6, key must be ≥ 256 bits), carry subject (email), issuer, jti, and the `roles` / `fullName` / `productSpeciality` / `tokenVersion` claims, and are validated per request (signature, issuer, expiry with 30 s clock skew). The `tokenVersion` claim enables **stateless revocation**: bumping `app_user.token_version` (password reset, deactivation) invalidates every previously issued access token. Access-token expiry is set via `app.security.jwt.expiration-ms` (default 15 min in `AppSecurityProperties`; the committed local `application.properties` sets 60 s for faster dev). Authorization decisions always come from authorities loaded from the database, not from the token claims.

Implementation: `security/JwtService.java`, `security/JwtAuthenticationFilter.java`, `security/CustomUserDetailsService.java`. Detail: [`../06_Backend/JWT.md`](../06_Backend/JWT.md).

### Control 2 — Opaque DB-backed refresh tokens

Refresh tokens are 32-byte `SecureRandom` values delivered only in an **HttpOnly** `refresh_token` cookie (`SameSite=Lax`, `Path=/api/auth`, 7-day TTL, `Secure` via `app.security.jwt.refresh-cookie-secure`). Only the SHA-256 hash is stored in `refresh_tokens` (a DB leak yields no usable tokens). Every refresh **rotates** the token; presenting a revoked token (replay) revokes the whole session family and emits a `REFRESH_REUSE_DETECTED` audit event. Logout, password reset, and deactivation revoke active tokens. Access tokens stay in browser memory, never in `localStorage`.

Implementation: `security/RefreshTokenService.java`, `config/RefreshTokenCookieManager.java`, `config/RefreshTokenCleanupScheduler.java`, `model/RefreshToken.java`. Detail: [`../06_Backend/JWT.md`](../06_Backend/JWT.md) and [`../03_API/Authentication_API.md`](../03_API/Authentication_API.md).

### Control 3 — Dual OTP (email + SMS)

Account activation, resend, and password reset require 6-digit OTPs on **both** email (Gmail SMTP) and phone (Twilio). OTPs expire after `app.otp.expiry-minutes` (5 min), are single-use, allow at most `app.security.max-otp-attempts` (5) verification attempts, cap resends at 4 per 24 h with a 60 s resend window, and are rate-limited per IP+email.

Implementation: `verification/OtpService.java`, `verification/EmailService.java`, `verification/SmsService.java`, `verification/OtpAttemptRecorder.java`, `model/OtpVerification.java`. Detail: [`../03_API/Authentication_API.md`](../03_API/Authentication_API.md).

### Control 4 — Rate limiting (Bucket4j)

`RateLimitFilter` applies Bucket4j token buckets to unauthenticated auth endpoints (login, register, OTP verify/resend, forgot/reset password, refresh), keyed by **client IP + email**, returning `429` with `Retry-After`. Capacities/refills are configurable per endpoint group under `app.security.rate-limit.*`.

Implementation: `config/RateLimitFilter.java`, `config/AppSecurityProperties.java`. Detail: [`../06_Backend/Security.md`](../06_Backend/Security.md).

### Control 5 — RBAC (roles)

Three roles — `ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER` — are enforced at the filter level (`authorizeHttpRequests` in `SecurityConfig`, method + role matchers, `@EnableMethodSecurity` for method-level checks) and reinforced by service-level ownership checks against the authenticated user's email/ID (e.g. `my-policies`, `my-claims`, `my-payments`).

Implementation: `config/SecurityConfig.java`. Detail: [`../06_Backend/Security.md`](../06_Backend/Security.md).

### Control 6 — CORS + CSRF considerations

CORS allows exactly one origin (`app.security.cors.allowed-origin`, default `http://localhost:5173`, credentials allowed). CSRF is disabled for the Bearer-token API; for the cookie-authenticated refresh/logout endpoints, `CookieCsrfOriginFilter` rejects POSTs whose `Origin` (or fallback `Referer`) is not the allowlisted origin, complementing the `SameSite=Lax` cookie. Security headers (CSP `default-src 'none'`, frame-deny, HSTS, `STRICT_ORIGIN_WHEN_CROSS_ORIGIN` referrer policy) lock down the HTTP surface.

Implementation: `config/CorsConfig.java`, `config/CookieCsrfOriginFilter.java`, `config/SecurityConfig.java` (headers). Detail: [`../06_Backend/Security.md`](../06_Backend/Security.md).

### Control 7 — BCrypt password storage

Passwords are hashed with `BCryptPasswordEncoder` via `DaoAuthenticationProvider`; plaintext is never stored, logged, or returned. Seeded admin: `admin@insurance.com` / `Admin@123`, created by `DataInitializer` (controllable via `app.security.seed-admin.enabled`) — the default password must be changed immediately.

Implementation: `config/SecurityConfig.java` (encoder + provider beans), `config/DataInitializer.java`.

### Control 8 — Secrets and document uploads

All secrets (DB, JWT key, Cloudinary, Gmail, Twilio) live in the **gitignored** `env.properties`, imported at runtime via `spring.config.import=file:env.properties`; the UI uses gitignored `.env*` files (`.env.example` committed). Claim documents upload through the Cloudinary SDK with a 10 MB multipart cap (`spring.servlet.multipart.max-file-size`), and only Cloudinary references/public IDs are stored in MySQL.

Implementation: `src/main/resources/application.properties`, `env.properties`, `service/CloudinaryService.java`, `config/CloudinaryConfig.java`.

### Audit logging

Security-relevant events — `LOGIN_SUCCESS`, `LOGIN_FAILED`, `REFRESH_TOKEN_ISSUED`, `REFRESH_TOKEN_ROTATED`, `REFRESH_REUSE_DETECTED`, `RATE_LIMIT_TRIGGERED`, `CSRF_REJECTED`, `PASSWORD_RESET`, account activation/deactivation, logout — are written to the dedicated `SECURITY_AUDIT` logger via `SecurityAuditLogger`, keeping them routable to a separate sink. Domain history is preserved in DB audit tables (`pricing_audit_logs`, `claim_status_histories`). Implementation: `config/SecurityAuditLogger.java`. Detail: [`../06_Backend/Security.md`](../06_Backend/Security.md).

### Authentication and refresh flow

```mermaid
sequenceDiagram
    participant UI as React SPA
    participant API as Backend (Spring Security)
    participant DB as MySQL

    UI->>API: POST /api/auth/login (email + password)
    API->>DB: verify BCrypt, load user + tokenVersion
    API-->>UI: 200 { accessToken, ... } + Set-Cookie refresh_token (HttpOnly, SameSite=Lax, Path=/api/auth)
    Note over API: RefreshTokenService.rotate on every /auth/refresh

    UI->>API: POST /api/auth/refresh (cookie only)
    API->>DB: lookup by SHA-256 hash; check revoked/expired/tokenVersion
    alt token valid
        API->>DB: rotate (old revoked, replacement issued, REQUIRES_NEW)
        API-->>UI: 200 { accessToken } + new refresh_token cookie
    else token was revoked (replay)
        API->>DB: revoke whole session family
        API-->>UI: 401 INVALID_REFRESH_TOKEN + SECURITY_AUDIT REFRESH_REUSE_DETECTED
    end

    UI->>API: POST /api/auth/logout (cookie only)
    API->>DB: revoke token, clear cookie
```

## Workflow

1. **Registration** — `POST /api/auth/register`, then `POST /api/auth/verify-otp` with both email and phone OTPs; the account is activated only after both succeed.
2. **Login** — `POST /api/auth/login` (rate-limited, per-IP+email): BCrypt verify → access token in body + refresh cookie set.
3. **Authenticated calls** — `JwtAuthenticationFilter` validates the access token per request; `SecurityConfig` RBAC rules gate each route.
4. **Refresh** — on access-token expiry the SPA silently calls `POST /api/auth/refresh` (single-flight); the refresh token rotates and the family is protected against replay.
5. **Password reset / logout** — `POST /api/auth/reset-password` bumps `tokenVersion` and revokes all refresh tokens; `POST /api/auth/logout` revokes the presented token and clears the cookie.

## Code References

| Control | File (repo-root-relative path) |
|---|---|
| Filter chain, RBAC, headers, encoders | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityConfig.java` |
| JWT issue/verify | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtService.java` |
| JWT filter | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtAuthenticationFilter.java` |
| Refresh rotation & reuse detection | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/RefreshTokenService.java` |
| Refresh cookie | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/RefreshTokenCookieManager.java` |
| Rate limiter | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/RateLimitFilter.java` |
| CORS | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/CorsConfig.java` |
| CSRF/origin filter | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/CookieCsrfOriginFilter.java` |
| Dual OTP | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/verification/OtpService.java` |
| Security properties | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/AppSecurityProperties.java` |
| Audit logger | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityAuditLogger.java` |
| Auth endpoints | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/AuthController.java` |
| Secrets / config | `insurance-policy-claim-management-system/src/main/resources/application.properties`, `insurance-policy-claim-management-system/env.properties` |
| Frontend token handling | `insurance-policy-claim-management-app-ui/src/api/axiosInstance.js`, `insurance-policy-claim-management-app-ui/src/api/tokenStore.js` |

## Diagrams

- Inline authentication/refresh sequence diagram above.
- Additional security diagrams: [`../06_Backend/Security.md`](../06_Backend/Security.md).

## Best Practices

- Defense in depth: JWT, refresh cookies, OTP, rate limits, RBAC, origin checks, BCrypt, and secret externalization are independent layers.
- Stateless access tokens plus DB-backed refresh tokens balance horizontal scalability with real revocation.
- Refresh rotation with family revocation converts replay into a session-killing event rather than a window of risk.
- Secrets never enter the repository; committed defaults exist only where safe (dev origins, feature flags).

## Future Improvements

- Distributed rate limiting (Redis) for multi-instance deployments.
- Account lockout / exponential backoff on repeated failed logins.
- File-type/content validation on document uploads beyond size caps.
- Structured audit log sink (ELK) fed by the `SECURITY_AUDIT` logger.
- See [`../10_Evaluation/Future_Enhancements.md`](../10_Evaluation/Future_Enhancements.md).

## See Also

- [`High_Level_Architecture.md`](High_Level_Architecture.md) — system context.
- [`Backend_Architecture.md`](Backend_Architecture.md) — filter chain position and layering.
- [`Database_Architecture.md`](Database_Architecture.md) — `refresh_tokens` table, audit tables, optimistic locking.
- [`../06_Backend/Security.md`](../06_Backend/Security.md) — security implementation detail.
- [`../06_Backend/JWT.md`](../06_Backend/JWT.md) — JWT and refresh-token implementation detail.
- [`../03_API/Authentication_API.md`](../03_API/Authentication_API.md) — auth endpoint contracts.

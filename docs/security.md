# Security Review

> **Status: review of the current implementation with recommendations.** No security changes were made for this document.

## What is in place today

### Authentication — JWT (stateless)

- Spring Security with `SessionCreationPolicy.STATELESS`.
- **Login:** `POST /api/auth/login` → `AuthenticationManager` (Dao + BCrypt) → `JwtService.generateToken` issues a jjwt 0.12.x token signed with `Keys.hmacShaKeyFor(app.jwt.secret)` (`JWT_KEY` from `env.properties`), `expiration-ms=6000000` (100 min).
- **Claims:** `roles` (authority strings), `fullName`, `productSpeciality`, subject = username/email, issued-at/expiry.
- **Validation:** `JwtAuthenticationFilter` (OncePerRequestFilter) parses and verifies each request; on failure it logs a warning and continues (the downstream matchers then 401).
- Passwords hashed with **BCrypt** (`BCryptPasswordEncoder`).

### Two-factor-ish onboarding

- Registration requires **email OTP + phone OTP** (`verify-otp`) before the account is usable; `resend-otp` and `forgot-password`/`reset-password` reuse the same OTP machinery.
- OTP is 6 digits (`SecureRandom`), expires after `app.otp.expiry-minutes=5`, single-use (`used` flag), rate-limited to **4 sends per 24h** per user with a **60s** resend window.

### Authorization — RBAC + ownership

- URL-level rules in `SecurityConfig` per role (see [`architecture/02-backend-architecture.md`](architecture/02-backend-architecture.md)).
- Service-level **ownership checks** prevent IDOR-style access:
  - `GET /api/policies/my-policies`, `/api/claims/my-claims`, `/api/payments/my-payments` — scoped to the authenticated user.
  - Single-record reads (`getClaimById`, `getPolicyById`, payment reads) verify `policy.customer.user.email == authenticated email` for customers.
  - Claim document upload verifies the claim belongs to the current user (`ClaimDocumentServiceImpl`).
  - `PremiumPaymentServiceImpl` and `ClaimServiceImpl` repeat the email-ownership guard on record reads.
- `@EnableMethodSecurity` is active; additional method-level checks are used in services.

### Transport & browser config

- **CORS:** `CorsConfig` allows origin `http://localhost:5173`, credentials `true`, common methods.
- **CSRF:** disabled — correct for a stateless Bearer-token API.
- Spring Security's default security headers (frame options, content-type options, XSS protection, HSTS on HTTPS) are applied by the framework defaults.

### Secrets

- `env.properties` (git-ignored) carries DB/JWT/Cloudinary/Gmail/Twilio credentials, imported at runtime (`spring.config.import=file:env.properties`).
- JWT secret, DB password, mail/twilio keys are **not** committed.

## Known gaps & recommendations

| # | Gap | Recommendation |
|---|-----|----------------|
| 1 | **No rate limiting** on `/api/auth/login`, register, or `/api/public/stats` | Add a lightweight in-memory rate limiter (e.g., Bucket4j) or gateway-level limit on auth + public endpoints |
| 2 | **Default admin seed** — `DataInitializer` creates `admin@insurance.com` / `Admin@123` on every startup if absent | Force password change on first login, or seed from environment variables only in a dev profile; document it in [`deployment.md`](deployment.md) |
| 3 | **Upload validation** — multipart size is capped (10MB), but file-type/content validation is not visible in the upload path | Validate allowed MIME types + extension on the server before Cloudinary upload; reject executable/HTML content |
| 4 | **No account lockout / brute-force protection** | Track failed login attempts per account; temporary lockout or exponential backoff |
| 5 | **JWT revocation** — no refresh token, no revocation list; logout is client-side (`localStorage` clear) | Acceptable at capstone scale; document the trade-off; consider short-lived tokens + refresh if needed |
| 6 | **OTP in logs** — `SmsService` logs the OTP at WARN when Twilio is unconfigured | Fine for local dev; ensure it cannot be enabled in a real environment (guard by profile) |
| 7 | **No token/refresh storage hardening** — `ss_token` in `localStorage` is XSS-accessible | Consider `HttpOnly` cookies for tokens, or CSP hardening; at minimum keep the surface clean of injected scripts |
| 8 | **No security headers hardening beyond defaults** | Add CSP, `Referrer-Policy`, `Permissions-Policy` via `SecurityFilterChain` headers |
| 9 | **No actuator** | If exposed, gate `/actuator/**` to ADMIN and never expose `env`/`heapdump` in production; only `/health` should be open (see [`deployment.md`](deployment.md)) |
| 10 | **Audit trail is DB-based only** | Keep DB audit (`claim_status_histories`, `pricing_audit_logs`); optionally mirror to structured logs (see [`logging-strategy.md`](logging-strategy.md)) |

## Threat-model notes (what is already handled)

- **IDOR/authorization bypass** — mitigated by service-level ownership checks in addition to URL rules.
- **Duplicate/illegal policy creation** — repository guards one-time/duplicate purchases per customer+plan.
- **Concurrency** — `@Version` optimistic locking on `Policy`/`Claim`; conflicts return 409.
- **Validation** — Bean Validation on DTOs + `ValidationErrorResponseDTO`; `GlobalExceptionHandler` maps constraint violations to 400.
- **SQL injection** — Spring Data JPA parameterized queries throughout; the only JPQL is `@Query` with bind params.

## See also

- [`architecture/02-backend-architecture.md`](architecture/02-backend-architecture.md)
- [`imp-doc/07-diagrams/security-diagrams.md`](../imp-doc/07-diagrams/security-diagrams.md)
- [`decision-records.md`](decision-records.md)

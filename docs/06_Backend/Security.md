# Security

## Purpose

This document is the single source of truth for the HTTP security layer: the filter chain, authentication provider, password hashing, CORS and CSRF posture, rate limiting, security headers, and the audit event model. Token mechanics (JWT and refresh-token rotation) are detailed in JWT.md; the overall security architecture is described in the architecture document.

## Overview

Security is configured declaratively in `com.insurance.demo.config.SecurityConfig` (`@EnableMethodSecurity`, stateless sessions, CSRF disabled, hardened headers) and enforced by three custom filters registered in a fixed order inside the security chain. Authentication is JWT-based for the API and refresh-token-cookie based for the auth endpoints. All password storage uses BCrypt. Rate limiting uses Bucket4j and is applied only to unauthenticated authentication endpoints.

## Business Context

The application is a stateless JSON API consumed by a single front end (`http://localhost:5173`). CSRF is disabled because the access token is carried in the `Authorization` header, not a cookie, so the classic CSRF vector does not apply to API calls; the one cookie-authenticated surface (`/api/auth/refresh`, `/api/auth/logout`) is protected by the refresh cookie being HTTP-only, `SameSite=Lax`, scoped to `/api/auth`, and by origin validation in `CookieCsrfOriginFilter`. Rate limiting on login/registration/OTP endpoints is required because those are the brute-force and abuse surface before any token exists.

## Technical Design

### Filter chain

Order in the chain (each added with `addFilterBefore`):

1. `CookieCsrfOriginFilter` — validates the Origin/Referer against the allowed origin for state-changing requests that carry the refresh cookie; logs `CSRF_REJECTED` on mismatch.
2. `RateLimitFilter` — applies Bucket4j limits to the seven auth paths; on limit breach responds `429` with a `Retry-After` header and logs `RATE_LIMIT_TRIGGERED`.
3. `JwtAuthenticationFilter` — parses and validates the `Authorization: Bearer` token, then populates the `SecurityContext`; invalid/expired tokens are logged as `TOKEN_INVALID` and the request continues unauthenticated.
4. `UsernamePasswordAuthenticationFilter` (framework) — effectively unused for API calls because the login flow authenticates manually in `AuthServiceImpl` via `AuthenticationManager`.

Both custom filters are registered in Spring Security's internal chain via `addFilterBefore`; `FilterRegistrationBean` entries disable servlet-container auto-registration so ordering is deterministic.

### Authentication

- `DaoAuthenticationProvider` backed by `CustomUserDetailsService` (`findByEmailAndIsActiveTrue`), with `BCryptPasswordEncoder` as the `PasswordEncoder`.
- `AppUserDetails` adapts `AppUser` to `UserDetails`; its authority is `appUser.getRole().name()` and it carries the user's `tokenVersion` for stateless revocation checks.
- Login, registration, OTP verification, and refresh flows use `AuthenticationManager`/`DaoAuthenticationProvider` for credential checks and `JwtService` for token issuance.

### Authorization

- `@EnableMethodSecurity` enables `@PreAuthorize` at the controller/service level.
- `SecurityConfig.authorizeHttpRequests` additionally pins URL-level roles (`hasRole`/`hasAnyRole`) per endpoint group. `OPTIONS` is permitted globally for CORS preflight.
- Public surfaces: `/api/auth/**`, `/api/public/**`, and (when `app.security.swagger-enabled` is true) Swagger UI and `/v3/api-docs/**`. All other requests require authentication.
- `JwtAuthenticationFilter.shouldNotFilter` mirrors these public prefixes so unauthenticated endpoints never incur token parsing.

### Session and password policy

- `SessionCreationPolicy.STATELESS`; no server-side sessions.
- Passwords are BCrypt-encoded at registration and staff creation; `passwordEncoder` bean is a fresh `BCryptPasswordEncoder` (strength 10 default).
- `AppUser.tokenVersion` is incremented on password reset and account deactivation/activation so outstanding tokens are invalidated without a token blacklist.

### CORS and CSRF

- `CorsConfig` allows exactly one origin (`app.security.cors-allowed-origin`, default `http://localhost:5173`), methods `GET/POST/PUT/PATCH/DELETE/OPTIONS`, all headers, and credentials.
- CSRF protection is disabled via `AbstractHttpConfigurer::disable`; the mitigation posture is documented in the Business Context section.

### Rate limiting (Bucket4j)

- `RateLimitFilter` limits the paths `/api/auth/login`, `/register`, `/verify-otp`, `/resend-otp`, `/forgot-password`, `/reset-password`, `/refresh`.
- Buckets are keyed by endpoint group + client IP + email parsed from the body, so rotating IP or email alone cannot bypass the limit.
- Group defaults (capacity / refill-per-minute): login, otp, forgot, reset, register = 5/5; refresh = 10/5. All configurable under `app.security.rate-limit.*`.
- Buckets are in-memory per instance; idle buckets are purged every 5 minutes after 10 minutes of inactivity.
- On breach: `429 Too Many Requests`, `Retry-After` seconds, JSON body with `errorType=RATE_LIMITED`.

### Security headers

`SecurityConfig` sets: `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and HSTS (includeSubDomains, 1 year).

### Audit events

All security events go to the dedicated `SECURITY_AUDIT` logger via `SecurityAuditLogger` so they can be routed to a separate sink. Event names: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `ACCOUNT_DISABLED`, `ACCOUNT_ACTIVATED`, `ACCOUNT_DEACTIVATED`, `TOKEN_INVALID`, `PASSWORD_RESET`, `RATE_LIMIT_TRIGGERED`, `REFRESH_TOKEN_ISSUED`, `REFRESH_TOKEN_ROTATED`, `REFRESH_REUSE_DETECTED`, `REFRESH_TOKEN_INVALID`, `REFRESH_TOKEN_PURGED`, `LOGOUT`, `CSRF_REJECTED`.

## Workflow

1. A request enters the chain; `CookieCsrfOriginFilter` checks cross-site state-change attempts when the refresh cookie is present.
2. `RateLimitFilter` meters auth endpoints and rejects abuse with 429.
3. `JwtAuthenticationFilter` validates the bearer token and, if valid, sets the `SecurityContext`.
4. `SecurityConfig` authorizes the URL; `@PreAuthorize` enforces finer-grained role checks in the handler.
5. `exceptionHandling` delegates both authentication-entry-point and access-denied failures to `GlobalExceptionHandler` so they are serialized with the uniform error body.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityConfig.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/CorsConfig.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/AppSecurityProperties.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/RateLimitFilter.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/CookieCsrfOriginFilter.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityAuditLogger.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/CustomUserDetailsService.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/AppUserDetails.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtAuthenticationFilter.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/RefreshTokenCookieManager.java`

Related: [JWT](JWT.md), [Security Architecture](../01_System_Architecture/Security_Architecture.md), [Exception Handling](Exception_Handling.md)

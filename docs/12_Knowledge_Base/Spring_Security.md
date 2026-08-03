# Spring Security

## What It Is
- The Spring framework module that provides authentication, authorization, and web-request protection for the API. It operates as a servlet filter chain.
- The project runs a **stateless** security model: no HTTP sessions (`SessionCreationPolicy.STATELESS`); identity is established per request by a JWT bearer token.
- Key components: `SecurityFilterChain` bean, `DaoAuthenticationProvider`, `BCryptPasswordEncoder`, `JwtAuthenticationFilter`, `RateLimitFilter`, `CookieCsrfOriginFilter`, and method security via `@EnableMethodSecurity`.

## Why It Is Used
- Provides battle-tested authentication/authorization primitives instead of custom code.
- The filter chain gives a single, well-ordered place to run authentication, rate limiting, and CSRF origin checks.
- Headers (CSP, frame-options, HSTS, referrer policy) harden the API response surface with declarative configuration.

## Where It Is Used in This Project
- `config/SecurityConfig.java`: builds the `SecurityFilterChain`; CORS enabled; CSRF disabled (compensated by `CookieCsrfOriginFilter` for the cookie-authenticated refresh endpoint); security headers configured; `authorizeHttpRequests` role matrix; `DaoAuthenticationProvider` and `BCryptPasswordEncoder` beans; `AuthenticationManager` exposed.
- `security/JwtAuthenticationFilter.java`: added before `UsernamePasswordAuthenticationFilter`; validates bearer tokens and sets the `SecurityContext`.
- `config/RateLimitFilter.java`: Bucket4j rate limiting for unauthenticated auth endpoints; added before the JWT filter.
- `config/CookieCsrfOriginFilter.java`: same-site/origin check for cookie-bearing requests.
- `config/AppSecurityProperties.java`: `app.security.*` configuration (JWT, rate limits, OTP attempts, CORS origin, seeding).

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityConfig.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtAuthenticationFilter.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/RateLimitFilter.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/AppSecurityProperties.java

## Related Docs
- ../06_Backend/Security.md
- ../01_System_Architecture/Security_Architecture.md
- ../06_Backend/JWT.md
- ../03_API/Authentication_API.md

## Common Interview Questions
1. Why is CSRF protection disabled? — The API is stateless with token-based auth; the only cookie-authenticated endpoint is `/api/auth/refresh`, protected by `SameSite=Lax` and the `CookieCsrfOriginFilter` origin check.
2. What order are the custom filters in? — `RateLimitFilter` and `CookieCsrfOriginFilter` run before `JwtAuthenticationFilter`, which runs before `UsernamePasswordAuthenticationFilter`.
3. How is statelessness enforced? — `sessionManagement(...).sessionCreationPolicy(SessionCreationPolicy.STATELESS)`; no session is created or used.
4. How are 401/403 responses produced? — The filter chain delegates to `HandlerExceptionResolver`; `GlobalExceptionHandler` maps `AuthenticationException` to 401 and `AccessDeniedException` to 403.
5. Where is password hashing configured? — `BCryptPasswordEncoder` is exposed as a `PasswordEncoder` bean and wired into the `DaoAuthenticationProvider`.

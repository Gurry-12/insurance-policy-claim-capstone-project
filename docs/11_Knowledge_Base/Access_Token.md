# Access Token

## What It Is
- The short-lived, stateless JWT issued after successful login and again on every refresh. It is sent by the client as `Authorization: Bearer <token>`.
- Not persisted server-side. Its claims are self-contained: `sub` (email), `iss`, `iat`, `exp`, `jti`, `role`, and `tokenVersion`.
- Lifetime is configured via `app.security.jwt.expiration-ms`. The default in `AppSecurityProperties` is `900000` ms (15 min); the committed local `application.properties` sets `60000` ms (60 s) for fast development iteration.
- Validation tolerates a 30-second clock skew (`app.security.jwt.clock-skew-seconds`).

## Why It Is Used
- Stateless request authentication keeps the API horizontally scalable and avoids session stores.
- The short TTL bounds the impact of token leakage; long-lived trust is delegated to the refresh token instead.
- The `tokenVersion` check lets the system invalidate all outstanding access tokens of a user at once (password reset, deactivation).

## Where It Is Used in This Project
- `security/JwtService.java`: `generateToken` issues the token; `isTokenValid` confirms subject match and `tokenVersion` equality.
- `security/JwtAuthenticationFilter.java`: validates the token on every protected request and sets the `SecurityContext`.
- `serviceimpl/AuthServiceImpl.java`: issues tokens in `login` and `refresh`.
- Frontend `src/api/axiosInstance.js`: attaches the Bearer header and performs single-flight refresh on a 401.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtService.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtAuthenticationFilter.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/AuthServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/AppSecurityProperties.java

## Related Docs
- ../06_Backend/JWT.md
- ../06_Backend/Security.md
- ../01_System_Architecture/Security_Architecture.md
- ../03_API/Authentication_API.md

## Common Interview Questions
1. Where is the access token stored on the client? — In memory (`src/api/tokenStore.js`) with `sessionStorage` flags; it is never placed in a cookie so it cannot be read by scripts or sent automatically.
2. How long does an access token live? — Configurable via `app.security.jwt.expiration-ms`; default 15 minutes in `AppSecurityProperties`, overridden to 60 seconds in the committed local `application.properties`.
3. What happens when the access token expires? — The API returns 401; the frontend triggers a single-flight refresh using the refresh cookie and retries the request once.
4. How is a stolen access token mitigated? — Short TTL plus stateless `tokenVersion` invalidation on password change or account deactivation.
5. Why not store the access token in a cookie? — An HttpOnly cookie would work, but in-memory storage plus Bearer header keeps the token out of cookies entirely and prevents accidental CSRF exposure.

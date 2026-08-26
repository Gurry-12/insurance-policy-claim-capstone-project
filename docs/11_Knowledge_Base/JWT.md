# JWT

## What It Is
- A JSON Web Token is a compact, URL-safe token that carries a set of signed claims. This project uses it as the **stateless access token**.
- Signed with **HS256** (symmetric HMAC-SHA256) using `jjwt 0.12.6`. The signing key must be at least 256 bits (32 characters).
- Built in one pass with `Jwts.builder().signWith(signingKey)` and verified in one pass with `Jwts.parser().verifyWith(...)` which checks signature, issuer, and expiry (with a configurable clock skew).
- Claims carried in the token: `sub` (email), `iss`, `iat`, `exp`, `jti` (unique per token), `role` (informational, first authority only) and `tokenVersion`.
- The `role` claim is informational only; authorization decisions are always based on authorities loaded from the database.

## Why It Is Used
- Provides stateless, verifiable authentication: the server does not need a server-side session, so the API scales horizontally.
- Short-lived by design, limiting the damage window if a token is stolen.
- The `tokenVersion` claim enables stateless revocation: bumping a user's version invalidates all previously issued access tokens.

## Where It Is Used in This Project
- `security/JwtService.java`: `generateToken`, `parseClaims`, `extractUsername`, `extractTokenVersion`, `isTokenValid`, and `buildSigningKey` (enforces the 256-bit key length).
- `security/JwtAuthenticationFilter.java`: extracts the `Authorization: Bearer` token, validates it, loads the user, and populates the `SecurityContext`.
- `config/AppSecurityProperties.java`: all JWT settings live under `app.security.jwt.*` (secret, `expiration-ms`, issuer, `clock-skew-seconds`).

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtService.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtAuthenticationFilter.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/AppSecurityProperties.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityConfig.java

## Related Docs
- ../06_Backend/JWT.md
- ../06_Backend/Security.md
- ../01_System_Architecture/Security_Architecture.md
- ../03_API/Authentication_API.md

## Common Interview Questions
1. What makes a JWT valid in this project? — Signature verified with the HS256 key, issuer must match, token must not be expired (with 30 s clock skew), and `tokenVersion` must equal the user's current version.
2. Why is the `role` claim informational only? — To avoid trusting client-declared roles; the filter loads `AppUserDetails` from the database and uses its authorities for authorization.
3. How is an access token revoked before it expires? — Bump the user's `tokenVersion` (done on password reset and deactivation); the version check then rejects all older tokens statelessly.
4. Why must the secret be at least 32 characters? — HS256 needs a 256-bit key; `buildSigningKey` throws an `IllegalStateException` otherwise.
5. How does an access token differ from a refresh token? — The access token is a signed stateless JWT; the refresh token is opaque, stored as a SHA-256 hash in the database, and rotated on every use.

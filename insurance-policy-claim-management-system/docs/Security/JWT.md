# JSON Web Token (JWT) Architecture

The application uses standard RFC 7519 JSON Web Tokens (JWT) for API authentication.

---

## 1. Cryptographic Signature
- **Algorithm**: `HMAC SHA-256` (`HS256`).
- **Secret Key**: Configured via `app.security.jwt.secret` (environment variable override `JWT_KEY`). Must be at least 256 bits (32 bytes).

---

## 2. Token Structure & Claims
Each JWT Access Token contains the following claims:
- **`sub` (Subject)**: User email address (`user.getEmail()`).
- **`jti` (JWT ID)**: Unique UUID for the individual token. Used for stateful Redis revocation/blacklisting.
- **`role`**: User authority string (`ROLE_CUSTOMER`, `ROLE_STAFF`, `ROLE_ADMIN`).
- **`ver`**: User token version (`user.getTokenVersion()`). Checked against the database/cache to invalidate all tokens when a password reset or account deactivation occurs.
- **`iat` / `exp`**: Issued-at and Expiration timestamps.

---

## 3. Stateless vs Stateful Validation
1. **Stateless Signature Check**:
   - `JwtAuthenticationFilter` first verifies the signature and expiration statelessly using `io.jsonwebtoken.Jwts`.
2. **Stateful Blacklist Check (Redis)**:
   - Before granting access, the filter checks if `auth:jwt:blacklist:<jti>` exists in Redis. If found, the token is rejected.

# Authentication Module Overview

This document describes the authentication architecture in the **Insurance Policy & Claim Management System**.

---

## 1. Core Objectives
- **Secure Credentials**: Username/password authentication with `BCryptPasswordEncoder`.
- **Dual-Token Architecture**: Short-lived **Access Tokens (15 min)** for API requests + long-lived **Refresh Tokens (7 days)** stored as SHA-256 hashes in MySQL and delivered via `HttpOnly` cookies.
- **Stateful Security via Redis**: Fast caching for token validation, stateful JWT blacklisting upon logout, and a 10-second rotation grace window for concurrent browser tabs.
- **Graceful Degradation**: If Redis is unreachable or disabled (`app.security.redis.enabled=false`), authentication seamlessly falls back to SQL database lookups.

---

## 2. Authentication Flow

```
[React Client]                           [Spring Security / AuthController]
      │                                                │
      ├── POST /api/auth/login (email/password) ──────>│
      │                                                ├── Validate User via UserDetailsService & BCrypt
      │                                                ├── Generate JWT Access Token (15m)
      │                                                ├── Generate Refresh Token & save SHA-256 hash in DB/Redis
      │<─ Return JSON (Access Token) + HttpOnly Cookie─┤
```

---

## 3. Key Components
1. **`JwtAuthenticationFilter`**: Stateless signature verification + stateful Redis blacklist check (`auth:jwt:blacklist:*`).
2. **`RefreshTokenService`**: Handles token rotation, replay detection, session family revocation, and Redis 10-second grace window checks.
3. **`AuthService` / `AuthController`**: Exposes `/login`, `/refresh`, `/logout`, `/logout-all`, `/register`, and OTP endpoints.

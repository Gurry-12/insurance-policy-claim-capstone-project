# Redis Integration for Authentication & Token Registry

---

## 1. Why Redis?
In standard stateless JWT authentication, once a token is issued, the backend cannot invalidate it until its expiration time arrives.
- **Problem**: If a user clicks **Logout**, or an administrator deactivates an account, a stolen JWT remains valid.
- **Solution**: We integrate **Redis** as an in-memory **Token Registry & Revocation Blacklist**.

---

## 2. Key Structures & Namespaces
All keys are prefixed and configured under `app.security.redis.*` in `application.properties`:

| Prefix | Example Key | Purpose | TTL |
|---|---|---|---|
| `auth:jwt:blacklist:` | `auth:jwt:blacklist:<jti>` | Blacklisted/revoked JWT Access Token IDs upon logout or revocation. | Remaining JWT lifetime (up to 15m) |
| `auth:refresh:` | `auth:refresh:<userId>:<tokenHash>` | Active refresh token hashes for fast in-memory verification. | 7 Days |
| `auth:refresh:grace:` | `auth:refresh:grace:<oldTokenHash>` | Maps old token hash to new token hash during rotation. | 10 Seconds |

---

## 3. Graceful DB Fallback Pattern
The `RedisTokenCacheServiceImpl` class wraps all Redis commands (`ValueOperations`) in error-handling blocks.
- If Redis is down, or `app.security.redis.enabled=false`, operations degrade gracefully to MySQL database queries without failing user requests.

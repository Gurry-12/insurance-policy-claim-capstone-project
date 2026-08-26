# Production Improvements
> Critical changes required before deploying InsuranceFlow to a production environment.

---

## Purpose
To document the necessary security, configuration, and architectural changes required to transition the application from a local development state to a hardened, production-ready state.

---

## 1. Database & Schema Management
- **Replace `ddl-auto=update` with Flyway or Liquibase.**
  - *Why:* Spring Data's auto-update can drop columns, mismanage foreign keys, or lock tables unexpectedly in production. Migrations ensure predictable, versioned schema changes.
- **Implement Connection Pooling Optimization.**
  - *Why:* Tune HikariCP settings (max pool size, idle timeouts) to handle production load without exhausting database connections.

## 2. Security Hardening
- **Disable Admin Auto-Seed.**
  - *Why:* The `DataSeeder` runs on startup and creates a default admin. This is a massive security risk in production. Admin accounts should be created via secure, one-time scripts.
- **Enable Secure Cookies (HTTPS).**
  - *Why:* The refresh token cookie must have `Secure=true` set so it is only transmitted over HTTPS, preventing packet sniffing.
- **Disable Swagger / OpenAPI UI.**
  - *Why:* Exposing API documentation in production reveals the attack surface. It should be disabled or placed behind strict authentication.

## 3. Rate Limiting & Caching
- **Redis Distributed Rate Limiting.**
  - *Why:* Local Bucket4j state is lost if the application runs on multiple instances. Bucket4j must be backed by Redis to enforce rate limits globally across the cluster.

## 4. Observability & Monitoring
- **Structured Logging (ELK/Loki).**
  - *Why:* Console logging is insufficient. Logs must be output in JSON format and aggregated centrally for searchability and alerting.
- **Health Checks & Actuator.**
  - *Why:* Spring Boot Actuator must be enabled (but secured) to provide readiness and liveness probes for Kubernetes or AWS target groups.

## 5. File Storage
- **Move to Cloud Native Storage (S3).**
  - *Why:* Currently, Cloudinary is used for demonstration. An enterprise app should use AWS S3 with strict IAM roles, pre-signed URLs, and bucket policies for claim documents.

---

## Summary of Configuration Changes

| Environment Variable | Dev Value | Production Value |
|----------------------|-----------|------------------|
| `spring.jpa.hibernate.ddl-auto` | `update` | `validate` or `none` |
| `jwt.cookie.secure` | `false` | `true` |
| `springdoc.swagger-ui.enabled` | `true` | `false` |
| `server.error.include-stacktrace`| `always` | `never` |

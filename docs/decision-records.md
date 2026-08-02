# Architecture Decision Records

Short records of the notable engineering decisions in this project. **Status:** `Accepted` = implemented today; `Proposed` = recommended (documented but not implemented).

---

## ADR-001: Two-module monorepo (Spring Boot + React)

- **Status:** Accepted
- **Context:** A capstone full-stack system needing a REST API and a browser SPA in one repo.
- **Decision:** One git repository with two sibling modules: `insurance-policy-claim-management-system` (backend) and `insurance-policy-claim-management-app-ui` (frontend).
- **Consequences:** Shared docs (`imp-doc/`, `docs/`, `screenshots/`) live at the root; each module keeps its own README/build. CI would need to build two artifacts.

## ADR-002: Java 17 + Spring Boot 4.0.6 + MySQL 8

- **Status:** Accepted
- **Context:** Need a JVM REST stack with a relational store; earlier project notes assumed PostgreSQL but the delivered system runs on MySQL.
- **Decision:** Spring Boot 4.0.6 (Java 17), Spring Data JPA/Hibernate, MySQL `insurance_db`, `spring-boot-starter-*` starters, springdoc 3.0.2.
- **Consequences:** Matches the installed MySQL tooling; schema managed by Hibernate `ddl-auto=update` today (see ADR-010).

## ADR-003: Stateless JWT authentication (no sessions, no refresh)

- **Status:** Accepted
- **Context:** A SPA + REST API needs auth without server-side sessions; logout is client-side.
- **Decision:** Stateless Spring Security; jjwt 0.12.x tokens with `roles`, `fullName`, `productSpeciality` claims; `SessionCreationPolicy.STATELESS`; CSRF disabled.
- **Consequences:** Simple, horizontally scalable auth. Trade-offs: no server-side revocation, token lives until expiry (100 min), `localStorage` exposure risk (see [`security.md`](security.md)).

## ADR-004: Two-step OTP verification (email + phone)

- **Status:** Accepted
- **Context:** Customers register self-service; the project wants account activation and password reset without manual admin work.
- **Decision:** Gmail SMTP (`EmailService`) + Twilio (`SmsService`) send 6-digit OTPs; `OtpVerification` enforces expiry (5 min), single-use, 4 sends/24h, 60s resend window. OTP is also sent for forgot-password/reset.
- **Consequences:** Stronger onboarding; depends on third-party SMTP/Twilio credentials via `env.properties`. When Twilio is unconfigured, OTP is logged at WARN (dev fallback).

## ADR-005: Strategy pattern for premium calculation

- **Status:** Accepted
- **Context:** One-time and annual premiums have different formulas (annual has a term-based discount schedule; one-time does not).
- **Decision:** `PremiumCalculator` interface with `AnnualPremiumCalculator` and `OneTimePremiumCalculator`, selected by `PremiumCalculatorFactory` keyed on `PremiumType`.
- **Consequences:** Adding a new premium type = new calculator bean; math is unit-testable in isolation. `RoundingRule` enum exists to support rounding policies.

## ADR-006: Three fixed roles (no custom roles)

- **Status:** Accepted
- **Context:** The business has admin, internal staff, and customers.
- **Decision:** `ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`; enforced via URL matchers in `SecurityConfig` plus service-level ownership checks. Staff are scoped by `productSpeciality`.
- **Consequences:** Role set is small and explicit. Earlier docs used "AGENT" informally; the codebase consistently uses `INTERNAL_STAFF`.

## ADR-007: No Redis at capstone scale — Caffeine first

- **Status:** Proposed (design in [`caching.md`](caching.md))
- **Context:** Hot read paths (`/api/public/stats`, catalog) query DB every call; a full Redis deployment is overkill for a single-instance capstone.
- **Decision:** Start with in-process Caffeine (`@Cacheable` on stats + catalog, bounded TTLs, eviction on writes). Introduce Redis only when scaling to multiple API instances.
- **Consequences:** Near-zero infra; cache is per-node (acceptable for one instance). Redis remains the documented scale-out path.

## ADR-008: Lazy fetching with strict transaction boundaries

- **Status:** Proposed (design in [`performance.md`](performance.md))
- **Context:** Four `@ManyToOne` associations are `EAGER` and are pure overhead (all `@JsonIgnore`d). OSIV is enabled by default in Spring Boot 4.0.6.
- **Decision:** Flip the four relations to `LAZY`; add `@Transactional(readOnly=true)` to the one non-transactional read path (`PremiumCalculationServiceImpl`); then set `spring.jpa.open-in-view=false`.
- **Consequences:** Removes eager-join overhead on every payment/coverage/pricing/plan read and forces future lazy access to be transaction-scoped.

## ADR-009: Frontend — no code splitting, context + hooks only

- **Status:** Accepted
- **Context:** App is small; the team prioritized zero-latency navigation.
- **Decision:** No `React.lazy`/`Suspense` (static imports); no external state library (React Context `AuthContext`/`ThemeContext` + custom hooks); table pages use stale-while-loading.
- **Consequences:** Instant navigation, simple mental model. Trade-off: larger initial bundle — revisit if the bundle grows.

## ADR-010: Schema managed by Hibernate (migrate later)

- **Status:** Accepted (with a Proposed follow-up)
- **Context:** `spring.jpa.hibernate.ddl-auto=update` keeps local setup trivial.
- **Decision:** Hibernate manages the schema; uniqueness and FKs come from JPA annotations.
- **Consequences:** Fast to iterate; no versioned migrations, so schema drift across environments is possible. **Proposed:** adopt Flyway/Liquibase for production (see [`database.md`](database.md)).

## ADR-011: Cloudinary for claim documents (not DB BLOBs)

- **Status:** Accepted
- **Context:** Claim documents need preview + download; storing blobs in MySQL bloats backups and queries.
- **Decision:** Upload to Cloudinary (`insurance_claims` folder), store only name/type/reference/`publicId` in `claim_documents`.
- **Consequences:** Cheap storage in DB; depends on Cloudinary credentials; upload is synchronous (async path proposed in [`performance.md`](performance.md)).

## ADR-012: DB tables as the audit source of truth

- **Status:** Accepted
- **Context:** Claim reviews and pricing changes must be auditable by business users in the UI.
- **Decision:** `claim_status_histories` and `pricing_audit_logs` store the authoritative history; operational logging is secondary.
- **Consequences:** Audit is queryable in-app (timeline UI). **Proposed:** mirror key events to structured logs for ops (see [`logging-strategy.md`](logging-strategy.md)).

## ADR-013: Actuator — health only in production

- **Status:** Proposed
- **Context:** No operational monitoring endpoint exists today.
- **Decision:** Add `spring-boot-starter-actuator`; expose `/actuator/health` openly and everything else gated/disabled in production (never `env`, `heapdump`, `logfile`).
- **Consequences:** Enables load-balancer health checks and uptime visibility; requires careful exposure config (see [`security.md`](security.md)).

---

## Index by topic

| Topic | ADR |
|-------|-----|
| Stack | 001, 002 |
| AuthN/AuthZ | 003, 004, 006 |
| Domain pricing | 005 |
| Caching | 007 |
| Data access | 008, 010 |
| Frontend | 009 |
| Media/audit/ops | 011, 012, 013 |

See also: [`security.md`](security.md), [`performance.md`](performance.md), [`caching.md`](caching.md), [`logging-strategy.md`](logging-strategy.md).

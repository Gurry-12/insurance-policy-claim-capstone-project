# Project Documentation

Technical documentation for the **Insurance Policy & Claim Management System**. These documents describe the system as built and audited for a technical evaluation.

> Existing curated documentation also lives in [`imp-doc/`](../imp-doc/README.md) (API contracts, workflows, Postman scenarios, diagrams). This `docs/` set focuses on architecture, design analysis, and engineering-quality topics.

## Architecture

| Document | Contents |
|----------|----------|
| [`architecture/01-system-architecture.md`](architecture/01-system-architecture.md) | End-to-end system diagram: browser, API, MySQL, Cloudinary, Gmail SMTP, Twilio, JWT |
| [`architecture/02-backend-architecture.md`](architecture/02-backend-architecture.md) | Spring Boot layered architecture, request path, cross-cutting concerns |
| [`architecture/03-domain-model.md`](architecture/03-domain-model.md) | Domain/ER-style model of all 15 entities and their relationships |
| [`architecture/04-frontend-architecture.md`](architecture/04-frontend-architecture.md) | React SPA layers, routing, state, data flow |
| [`architecture/05-deployment-architecture.md`](architecture/05-deployment-architecture.md) | Runtime topology, configuration, and future scaling targets |

## Design Analysis

| Document | Contents |
|----------|----------|
| [`sequence-diagrams.md`](sequence-diagrams.md) | 10 request-level sequence diagrams (auth, quote, purchase, payment, claims) |
| [`database.md`](database.md) | `insurance_db` schema, foreign keys, constraints, index recommendations |
| [`caching.md`](caching.md) | Caching strategy: current state, recommended Caffeine/Redis design |
| [`logging.md`](logging.md) | Current logging setup and what is logged today |
| [`logging-strategy.md`](logging-strategy.md) | Recommended logging/observability strategy (levels, MDC, structured JSON, ELK) |
| [`performance.md`](performance.md) | Performance review: N+1 risks, fetch strategies, pagination, recommendations |
| [`security.md`](security.md) | Security review: JWT, RBAC, authorization, data protection |
| [`authentication.md`](authentication.md) | Authentication hardening as built: JWT flow, tokenVersion revocation, rate limiting, OTP, enumeration |
| [`refresh-token-architecture.md`](refresh-token-architecture.md) | Planned refresh-token + HttpOnly-cookie session design (deferred) |
| [`jwt-key-rotation.md`](jwt-key-rotation.md) | Signing-key rotation strategy and runbook |
| [`deployment.md`](deployment.md) | Build, run, configure, and deploy the system |

## Decisions

| Document | Contents |
|----------|----------|
| [`decision-records.md`](decision-records.md) | Architecture Decision Records (ADR) for key engineering choices |

## Related material

- [`imp-doc/01-api-contracts/`](../imp-doc/01-api-contracts/backend-api-contract.md) — REST API contract (backend, per-endpoint)
- [`imp-doc/04-workflows/`](../imp-doc/04-workflows/backend-workflows.md) — step-by-step business workflows
- [`imp-doc/07-diagrams/`](../imp-doc/07-diagrams/class-diagrams.md) — UML class, flow, and security diagrams
- [`CHANGELOG.md`](../CHANGELOG.md) — recent change history

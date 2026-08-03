# Production Improvements

> Operational hardening needed to run this in real production. Each item notes
> current state → target state.

## Database

| Item | Current | Target |
|---|---|---|
| Schema management | `ddl-auto=update` | Flyway/Liquibase versioned migrations; `validate` in prod |
| Backups | none | Scheduled automated backups + restore drill |
| Connection pool | defaults (Hikari) | Explicit pool sizing, leak detection, prod metrics |

## Secrets & config

| Item | Current | Target |
|---|---|---|
| Secrets | gitignored `env.properties` + env vars | Vault / cloud secret manager |
| JWT key | single static secret | Key rotation with kid/dual-key overlap; shorter-lived keys |
| Admin seeding | auto-seed flag | Idempotent bootstrap with forced password change |

## Security

| Item | Current | Target |
|---|---|---|
| OTP | Email/SMS, console fallback | Verified providers, TOTP option, hashed OTPs at rest |
| Rate limiting | Bucket4j on auth endpoints | Business-rule limits (purchase, claim) + admin API |
| Headers | CSP in prod build | HSTS, X-Content-Type-Options, Referrer-Policy at proxy |
| Audit | pricing + claim history captured | Exposed query UI + retention policy |
| File uploads | size/type validated, Cloudinary | Server-side malware scan, EXIF stripping, per-tenant limits |
| Logging | console | Structured JSON, PII redaction, centralised log pipeline |

## Frontend / delivery

| Item | Current | Target |
|---|---|---|
| SPA hosting | static `dist/` | CDN with cache headers; SSG/pre-render for landing |
| Error reporting | console + toasts | Sentry-style capture with source maps |
| Feature flags | none | Config-driven rollout of new claim flows |
| CI/CD | local builds | Pipeline (build → test → SAST → image → deploy), zero-downtime |

## Observability

| Item | Current | Target |
|---|---|---|
| Health/liveness | actuator basics | `/health`, `/ready`, `/metrics` wired to Prometheus |
| Tracing | none | Distributed tracing (Micrometer + Tempo/OTel) |
| Alerts | none | SLOs on auth failure rate, claim latency, error budget |

## SLA & resilience

| Item | Current | Target |
|---|---|---|
| Single instance | one jar | Horizontal scaling behind proxy; sticky sessions not needed (stateless JWT) |
| Queueing | sync calls | Async claim document processing / email dispatch (queues) |
| Disaster recovery | none | RTO/RPO definition, failover runbook |

## Compliance

- Data retention & right-to-erasure handling for user PII.
- Payment processing under PCI-DSS guidance (outsource to gateway).
- Accessibility (WCAG) audit before public launch.

## Related

- `../11_Developer_Guide/Deployment.md` — current deployment steps
- `Future_Enhancements.md` — feature roadmap

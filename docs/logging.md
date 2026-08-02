# Logging — Current State

## Summary

Logging today uses Spring Boot defaults (Logback) with the configuration from `application.properties`:

```properties
logging.level.root=INFO
logging.level.com.insurance.demo=DEBUG
```

No `logback-spring.xml` exists. No custom appenders, no JSON layout, no log files configured (console only), no correlation IDs.

## What is logged today

| Component | Level | What |
|-----------|-------|------|
| `com.insurance.demo` | DEBUG | Controller/service/repository debug lines from the framework |
| `root` | INFO | Spring Boot startup/shutdown, Tomcat, security, Hibernate session events |
| Hibernate SQL | `show-sql=true` | Every generated SQL statement (DEBUG-style, via `spring.jpa.show-sql` + `format_sql=true`) |

### Explicit application logs (from code)

- `JwtAuthenticationFilter` — `log.warn("Invalid or expired JWT token: ...")` on token parse failure (but the chain continues).
- `CustomerServiceImpl` — class-level `Logger` (currently used minimally).
- `SmsService` — logs the OTP at **WARN** level when Twilio is not configured (so it is visible without the SMS dependency).

Most business services do **not** emit explicit log lines for events (login, purchase, payment, claim transitions). The audit trail for claims/pricing lives in the **database** (`claim_status_histories`, `pricing_audit_logs`) rather than in logs.

## Gaps

1. **No correlation/trace ID** — impossible to follow a single request across filter → controller → service → DB from log files.
2. **No structured (JSON) logs** — parsing/tooling (grep, ELK, CloudWatch) is painful.
3. **Console-only** — no file appender; logs are lost on restart.
4. **`DEBUG` + `show-sql` in the base config** — noisy in any shared/runtime environment; belongs to a dev profile only (see [`logging-strategy.md`](logging-strategy.md)).
5. **No business-event logs** — e.g., "policy purchased", "payment recorded", "claim decided" are not in the log stream (they exist only as DB rows).
6. **Error visibility** — `GlobalExceptionHandler` returns structured errors to clients but does not log stack traces server-side for 500s.

## See also

- [`logging-strategy.md`](logging-strategy.md) — the recommended observability design
- [`decision-records.md`](decision-records.md) — related decisions
- [`imp-doc/05-deployment/deployment-guide.md`](../imp-doc/05-deployment/deployment-guide.md) — run/troubleshooting context

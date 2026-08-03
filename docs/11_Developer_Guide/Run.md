# Run

> Day-to-day commands to run the application locally.

## Purpose

Fast reference for starting/stopping both modules.

## Backend

```bash
cd insurance-policy-claim-management-system
./mvnw spring-boot:run
```

- API base: `http://localhost:8081/api`
- Swagger UI: `http://localhost:8081/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8081/v3/api-docs`
- `show-sql=true` is enabled — Hibernate SQL is printed to the console.

**Auto-seeded admin** on first boot (when `app.security.seed-admin.enabled=true`):

| Field | Value |
|---|---|
| email | `admin@insurance.com` |
| password | `Admin@123` |

> Change the default password immediately in a real environment.

## Frontend

```bash
cd insurance-policy-claim-management-app-ui
npm run dev
```

- Dev server: `http://localhost:5173`
- `/api` requests are proxied to `http://localhost:8081` by `vite.config.js`.

## Notes on access tokens

The committed local `application.properties` sets
`app.security.jwt.expiration-ms=60000` (60-second access tokens) for fast
development. Expect frequent refreshes; the frontend handles them transparently.
See `Environment.md` to change it.

## Offline OTP (no email/SMS keys)

When Twilio/Gmail are not configured, OTPs are **logged to the backend console**
and stored (plaintext) in the `otp_verifications` table:

```sql
SELECT email_otp, phone_otp FROM otp_verifications
WHERE user_id = <id> ORDER BY id DESC LIMIT 1;
```

The seeded pending user `meena.iyer@example.com` uses OTP `555555` / `555555`
(see `demo-data/04-evaluator-demo.md`).

## Loading demo data

Import `demo-data/sql/*.sql` after the first boot, then restart. See
`Setup.md#6`.

## Related

- `Setup.md` — first-time setup
- `Environment.md` — configuration
- `Troubleshooting.md` — common issues

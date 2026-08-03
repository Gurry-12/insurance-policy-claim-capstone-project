# Troubleshooting

> Common problems and their fixes.

## Purpose

Diagnose the most frequent setup and runtime issues without reading code.

## Backend won't start

| Symptom | Cause / Fix |
|---|---|
| `Access denied for user` | Wrong `DB_USER`/`DB_PASSWORD` in `env.properties`, or the MySQL user lacks grants. See `Setup.md#3`. |
| `Communications link failure` / unknown host `localhost:3306` | MySQL not running or on another port; fix `spring.datasource.url`. |
| `Failed to load `env.properties`` | File missing at `insurance-policy-claim-management-system/env.properties`. Create it (see `Environment.md`). |
| Port already in use `8081` | Another process on 8081; stop it or change `server.port`. |
| `IllegalStateException: Failed to import bean definitions from relative location [env.properties]` | Same as env.properties missing. |
| SQL errors at startup about columns | Schema is `ddl-auto=update`; an old schema conflicts with new entities. Back up and drop/recreate `insurance_db`, or manually reconcile the column. |

## Frontend issues

| Symptom | Cause / Fix |
|---|---|
| `npm install` fails / audit vulnerabilities | Use `npm ci`; lockfile is `package-lock.json`. |
| API calls 404 from the browser | Vite proxy not configured or backend on another port — check `VITE_API_PROXY_TARGET` in `.env` and `vite.config.js`. |
| CORS errors | `CORS_ALLOWED_ORIGIN` must include the frontend origin (`http://localhost:5173`). |
| Blank page / CSP errors in production build | `.env.production` CSP is strict; adjust only the needed `*src`/`connect-src` entries. |

## Authentication / OTP problems

| Symptom | Cause / Fix |
|---|---|
| OTP not received by email/SMS | No SMTP/Twilio keys → OTP is **printed to the backend console** and stored in `otp_verifications`. |
| OTP invalid after ~5 min | OTP expiry is 5 minutes; request a new one. |
| Too many OTP attempts | Max 5 attempts then the OTP is invalidated; resend. Rate limits apply per IP+email. |
| Login returns 401 immediately after password change | `tokenVersion` was bumped; all old JWTs are rejected — log in again. |
| `Refresh token revoked` | Token reuse was detected (family revoked) or token expired (>7 days). Log in again. |
| Requests fail with 401 every ~minute | Local `expiration-ms=60000` — expected. Frontend refreshes transparently. Use the UI, or bump the value in `application.properties`. |

## Claims / uploads

| Symptom | Cause / Fix |
|---|---|
| Claim document upload fails | Cloudinary keys missing/incorrect in `env.properties`, or file > 5 MB / unsupported type. |
| Cannot raise claim | Policy not `ACTIVE`, incident date outside policy period, amount exceeds remaining cover, or missing files. See `../02_Business_Domain/Business_Rules.md`. |
| Staff doesn't see a claim | Claims are filtered by the staff member's `productSpeciality`. |

## Payments / policies

| Symptom | Cause / Fix |
|---|---|
| Payment rejected on amount | Amount must **exactly** equal the quote total (premium computed at quote time). |
| Can't purchase a second policy | HEALTH duplicate rules: an ACTIVE or PENDING_PAYMENT policy already exists on that plan. See `Business_Rules.md`. |
| Can't cancel a policy | Open (non-finalised) claims exist on the policy. |

## Swagger not loading

`app.security.swagger-enabled=true` required; check `springdoc` is on classpath and access the exact URLs (`/swagger-ui.html`, `/v3/api-docs`).

## Related

- `Setup.md`, `Run.md`, `Environment.md`
- `../../demo-data/03-testing-flow.md` — expected responses
- `../02_Business_Domain/Business_Rules.md` — rule enforcement

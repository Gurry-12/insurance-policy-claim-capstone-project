# Environment

> Every configuration key for backend and frontend, and where secrets live.

## Purpose

Authoritative reference for environment configuration. Secrets are **never
committed**; committed templates are `.env.example` (frontend) and this doc.

## Backend — `env.properties`

Location: `insurance-policy-claim-management-system/env.properties`
(gitignored). Loaded via `spring.config.import=file:env.properties`.

| Key | Purpose | Required |
|---|---|---|
| `DB_USER` | MySQL user | Yes |
| `DB_PASSWORD` | MySQL password | Yes |
| `JWT_KEY` | HS256 signing secret (≥32 chars) | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account | For claim uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | For claim uploads |
| `CLOUDINARY_SECRET` | Cloudinary API secret | For claim uploads |
| `EMAIL_USER` | Gmail SMTP user | For email OTP / reset |
| `EMAIL_PASSWORD` | Gmail app password | For email OTP / reset |
| `TWILIO_SID` | Twilio account SID | For SMS OTP |
| `TWILIO_TOKEN` | Twilio auth token | For SMS OTP |
| `TWILIO_PHONE` | Twilio sender number | For SMS OTP |

## Backend — `application.properties` (committed, overridable)

| Key | Default / Value | Notes |
|---|---|---|
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/insurance_db` | DB URL |
| `spring.jpa.hibernate.ddl-auto` | `update` | Hibernate manages schema |
| `server.port` | `8081` | Backend port |
| `app.security.jwt.secret` | `${JWT_KEY}` | from env |
| `app.security.jwt.expiration-ms` | `60000` | Access-token TTL (ms) |
| `app.security.jwt.refresh-token-ttl-days` | `7` | Refresh-token TTL |
| `app.security.jwt.refresh-cookie-secure` | `${REFRESH_COOKIE_SECURE:false}` | set true behind HTTPS |
| `app.security.cors.allowed-origin` | `${CORS_ALLOWED_ORIGIN:http://localhost:5173}` | CORS allowlist |
| `app.security.seed-admin.enabled` | `true` | Auto-seed admin |
| `app.security.swagger-enabled` | `true` | Expose Swagger |
| `app.security.rate-limit.*` | capacities | Login/OTP/forgot/reset/register/refresh |
| `app.security.max-otp-attempts` | `5` | OTP retries |
| `app.otp.expiry-minutes` | `5` | OTP validity |
| `app.frontend.url` | `http://localhost:5173` | Used in emails |
| `spring.mail.host/port` | `smtp.gmail.com:587` | SMTP |
| `cloudinary.*` | from env | Cloudinary |
| `app.twilio.*` | from env | Twilio |

## Frontend — `.env*`

Location: `insurance-policy-claim-management-app-ui/` (gitignored; only `.env` exists locally). The expected keys are documented here so nothing secret needs to be committed:

| Key | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API base path, e.g. `/api` (proxied) |
| `VITE_API_PROXY_TARGET` | Vite proxy target, e.g. `http://localhost:8081` |
| `VITE_CSP` | Content-Security-Policy header value (empty in dev for HMR; strict in prod) |

- `.env.development` — used by `vite dev` (empty CSP for HMR).
- `.env.production` — used by `vite build` (strict CSP: `default-src 'self'`,
  images from `res.cloudinary.com`, `frame-ancestors 'none'`).

## Secrets policy

- `env.properties`, `.env`, `.env.development`, `.env.production` are gitignored.
- Only templates/examples are committed (`.env.example`, this doc).
- `JWT_KEY` should be a long random string and rotated periodically
  (see `../01_System_Architecture/Security_Architecture.md`).

## Related

- `Setup.md` — creating `env.properties` from scratch
- `Deployment.md` — environment in production
- `../00_Project_Overview/Tech_Stack.md`

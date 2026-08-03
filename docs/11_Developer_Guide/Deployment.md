# Deployment

> How to deploy the application to production.

## Purpose

Production deployment topology and steps. For local development see
`Setup.md` / `Run.md`.

## Topology

```
┌─────────────┐      ┌──────────────────────────┐      ┌─────────────┐
│   CDN/Web   │      │    Application Server     │      │   MySQL 8   │
│  Server      │──────│  Spring Boot fat jar      │──────│ insurance_db│
│  (static     │ HTTPS│  :8081  (embedded Tomcat) │ 3306 │             │
│   dist/)     │      └────────────┬─────────────┘      └─────────────┘
└─────────────┘                   │
                     Cloudinary │ Twilio │ Gmail SMTP
```

- Frontend `dist/` is served as static files (any web server / CDN / S3).
- Backend runs as a single service (fat jar) behind a reverse proxy (TLS
  termination, `X-Forwarded-*` headers, path `/api`).

## 1. Build

```bash
# Frontend
cd insurance-policy-claim-management-app-ui
npm ci
npm run build                       # → dist/

# Backend
cd ../insurance-policy-claim-management-system
./mvnw clean package -DskipTests     # → target/*.jar
```

## 2. Backend runtime config (production)

Set environment values and **overrides** so secrets are not on disk only:

```bash
export DB_USER=... DB_PASSWORD=...
export JWT_KEY='<long random secret>'
export CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_SECRET=...
export EMAIL_USER=... EMAIL_PASSWORD=...
export TWILIO_SID=... TWILIO_TOKEN=... TWILIO_PHONE=...
export CORS_ALLOWED_ORIGIN='https://app.example.com'
export FRONTEND_URL='https://app.example.com'
export REFRESH_COOKIE_SECURE=true
```

Run:

```bash
java -jar insurance-policy-claim-management-system-0.0.1-SNAPSHOT.jar
```

Suggested overrides for production (`--` args or env):
- `--server.port=8081`
- `--app.security.swagger-enabled=false`
- `--app.security.seed-admin.enabled=false` (or change admin password immediately)
- `--app.security.jwt.expiration-ms=900000` (15 min)
- `--app.security.jwt.refresh-cookie-secure=true`
- `--spring.jpa.show-sql=false`

## 3. Frontend hosting

Serve `dist/` with `index.html` as the SPA fallback (all non-asset routes →
`index.html`). Set the strict CSP (already emitted from `.env.production`) and
secure headers at the reverse proxy (HSTS, X-Content-Type-Options, etc.).
Configure the reverse proxy to forward `/api` to the backend (same-origin
deployment keeps `VITE_API_BASE_URL=/api` and the CORS allowlist trivially).

## 4. Database

- MySQL 8, `insurance_db`, credentials via `env.properties`.
- Keep `ddl-auto=update` only if you accept Hibernate-managed schema; for strict
  production control, generate DDL once and switch to `validate`.
- Back up the database; schedule binary backups.

## 5. Security checklist

- HTTPS everywhere; `REFRESH_COOKIE_SECURE=true`.
- CSP with `frame-ancestors 'none'` (already in `.env.production`).
- Restrict Swagger (`app.security.swagger-enabled=false`).
- Change/seed admin credentials; disable admin auto-seed after first run.
- `JWT_KEY` strong + rotation plan (see `../01_System_Architecture/Security_Architecture.md`).

## Related

- `Environment.md` — full config reference
- `Build.md` — build steps
- `../01_System_Architecture/High_Level_Architecture.md` — architecture
- `Troubleshooting.md` — production issue notes

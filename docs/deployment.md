# Deployment Guide

Practical steps to build, run, configure, and deploy the system. This mirrors and updates the guides in `imp-doc/05-deployment/` for the current codebase (Spring Boot 4.0.6 on port 8081).

## Prerequisites

| Tool | Version |
|------|---------|
| JDK | 17+ |
| Maven | 3.9+ (a `mvnw` wrapper is included) |
| MySQL | 8.x, running on `localhost:3306` |
| Node.js | 20+ (for the frontend build) |
| Accounts | Cloudinary, Gmail (SMTP app password), Twilio |

## 1. Database

```sql
CREATE DATABASE IF NOT EXISTS insurance_db;
```

The schema is created automatically by Hibernate (`spring.jpa.hibernate.ddl-auto=update`). No manual DDL is required. A minimal bootstrap script is at [`imp-doc/03-database/create-insurance-database.sql`](../imp-doc/03-database/create-insurance-database.sql).

## 2. Configuration

Create `env.properties` next to the backend root (git-ignored) with real credentials:

```properties
DB_USER=springstudent
DB_PASSWORD=<your-mysql-password>
JWT_KEY=<a-long-random-base64-secret>
CLOUDINARY_CLOUD_NAME=<...>
CLOUDINARY_API_KEY=<...>
CLOUDINARY_SECRET=<...>
EMAIL_USER=<gmail-address>
EMAIL_PASSWORD=<gmail-app-password>
TWILIO_SID=<...>
TWILIO_TOKEN=<...>
TWILIO_PHONE=<+1...>
```

The backend imports this file via `spring.config.import=file:env.properties`. The same variables can be supplied directly from the environment in CI/CD (an `env.properties` file beside the jar also works).

Key runtime properties in `application.properties`:

| Property | Value | Meaning |
|----------|-------|---------|
| `server.port` | `8081` | API port |
| `app.jwt.expiration-ms` | `6000000` | token lifetime (100 min) |
| `app.otp.expiry-minutes` | `5` | OTP validity |
| `app.frontend.url` | `${FRONTEND_URL:http://localhost:5173}` | CORS/email links origin |
| `spring.servlet.multipart.max-file-size` | `10MB` | upload cap |

## 3. Run the backend (development)

```bash
./mvnw spring-boot:run
```

Or package and run:

```bash
./mvnw clean package
java -jar target/insurance-policy-claim-management-system-0.0.1-SNAPSHOT.jar
```

- API base: `http://localhost:8081/api`
- Swagger UI: `http://localhost:8081/swagger-ui.html`
- On first startup, `DataInitializer` seeds the admin account `admin@insurance.com` / `Admin@123` if missing.

> **Note:** the base config is the runtime config. A `dev` profile (DEBUG + `show-sql` + plain console logs) is proposed — see [`logging-strategy.md`](logging-strategy.md). Until then, the default run already enables those via `application.properties`.

## 4. Run the frontend (development)

```bash
npm install
npm run dev
```

- Serves on `http://localhost:5173`, proxies `/api` → `http://localhost:8081` (`vite.config.js`).
- Build for production: `npm run build` (outputs `dist/`).
- Lint: `npm run lint`.

## 5. Production deployment

Recommended minimal topology (see [`architecture/05-deployment-architecture.md`](architecture/05-deployment-architecture.md)):

1. Build the backend jar and frontend `dist/`.
2. Serve the frontend as static files (nginx/CDN); point API calls to the backend origin.
3. Run the backend with `env.properties` (or env vars) and a proper `SPRING_PROFILES_ACTIVE` value.
4. Put the backend behind a reverse proxy / load balancer. Expose only:
   - `GET /actuator/health` for health checks (proposed actuator addition — not yet present),
   - `GET /swagger-ui.html`, `/v3/api-docs` if you want public API docs,
   - `/api/**`.
5. Enforce HTTPS; set security headers per [`security.md`](security.md).

## 6. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `Access denied for user` on startup | `DB_USER`/`DB_PASSWORD` wrong or DB not created |
| Mail errors at login/OTP | Gmail needs an **app password**, not the login password |
| OTP never arrives (SMS) | Twilio unconfigured → OTP is logged at WARN instead; check console |
| CORS errors from the SPA | `FRONTEND_URL`/origin mismatch; CorsConfig allows `http://localhost:5173` |
| 409 on policy/claim update | Optimistic-lock conflict (`@Version`) — retry |
| Swagger blank | Confirm springdoc path and that you hit `:8081` (not `:8080` — older docs) |

## See also

- [`imp-doc/05-deployment/deployment-guide.md`](../imp-doc/05-deployment/deployment-guide.md)
- [`imp-doc/05-deployment/project-setup.md`](../imp-doc/05-deployment/project-setup.md)
- [`imp-doc/05-deployment/frontend-developer-guide.md`](../imp-doc/05-deployment/frontend-developer-guide.md)

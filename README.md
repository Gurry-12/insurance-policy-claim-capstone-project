# Insurance Policy & Claim Management System

A full-stack insurance management platform with role-based workflows for policy administration, premium payments, and claim processing.

## Architecture

```
capstone-project/
├── insurance-policy-claim-management-system/   # Backend (Spring Boot REST API)
└── insurance-policy-claim-management-app-ui/    # Frontend (React + Vite)
```

## Backend

- **Stack:** Java 17, Spring Boot 4.0.6, Spring Security (JWT), Spring Data Redis, Spring Data JPA + Hibernate, MySQL, Redis
- **Features:** Role-based auth (ADMIN / INTERNAL_STAFF / CUSTOMER), dual-token authentication (15m JWT + 7d HttpOnly Refresh Token), Redis token caching & stateful blacklisting, product & plan management, policy lifecycle, premium calculation with strategy pattern, claim submission & multi-step review, Cloudinary document upload, OTP via Twilio SMS & Gmail SMTP
- **Port:** `http://localhost:8081/api`

## Frontend

- **Stack:** React 19, Vite, React Router 7, React Hook Form, Axios, Bootstrap 5, Framer Motion, jsPDF
- **Features:** Themed UI with dark/light mode, role-specific dashboards, real-time form validation, data tables with pagination/filtering/sorting, PDF export, responsive layouts, automatic Axios token refresh interceptor
- **Port:** `http://localhost:5173`

## Quick Start

> [!IMPORTANT]
> **See [RUN_GUIDE.md](./RUN_GUIDE.md) for full step-by-step terminal commands, Docker Compose instructions, and troubleshooting tips.**

### 1. Infrastructure (Redis via Docker Desktop + Local MySQL Workbench)
```bash
# Start Redis container (port 6379) via Docker Desktop; uses your local MySQL server on port 3306
docker-compose up -d
```

### 2. Backend (Spring Boot)
```bash
cd insurance-policy-claim-management-system
# Create env.properties (see RUN_GUIDE.md for template)
./mvnw spring-boot:run   # On Windows: .\mvnw.cmd spring-boot:run
```

### 3. Frontend (React + Vite)
```bash
cd insurance-policy-claim-management-app-ui
npm install
npm run dev
```

## Roles

| Role | Capabilities |
|------|-------------|
| **ADMIN** | Manage products, plans, users, coverage options, pricing rules; final claim approval/denial |
| **INTERNAL_STAFF** | Review claims, recommend decisions, issue policies, manage customer payments |
| **CUSTOMER** | Browse products, purchase policies, make payments, raise and track claims |

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a history of recent changes.

## Documentation

- [`docs/`](./docs/README.md) — full documentation hub (architecture, API, database, business domain, workflows, developer guide, evaluation material)
- [`demo-data/`](./demo-data/) — seed SQL, API test payloads, testing flow, and the evaluator demo walkthrough
- [`screenshots/`](./screenshots/) — UI screenshots per role

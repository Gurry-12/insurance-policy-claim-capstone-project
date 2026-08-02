# Insurance Policy & Claim Management System

A full-stack insurance management platform with role-based workflows for policy administration, premium payments, and claim processing.

## Architecture

```
capstone-project/
├── insurance-policy-claim-management-system/   # Backend (Spring Boot REST API)
└── insurance-policy-claim-management-app-ui/    # Frontend (React + Vite)
```

## Backend

- **Stack:** Java 17, Spring Boot 4.0.6, Spring Security (JWT), Spring Data JPA + Hibernate, MySQL
- **Features:** Role-based auth (ADMIN / INTERNAL_STAFF / CUSTOMER), product & plan management, policy lifecycle, premium calculation with strategy pattern, claim submission & multi-step review, Cloudinary document upload, OTP via Twilio SMS & Gmail SMTP
- **Port:** `http://localhost:8081/api`

## Frontend

- **Stack:** React 19, Vite, React Router 7, React Hook Form, Axios, Bootstrap 5, Framer Motion, jsPDF
- **Features:** Themed UI with dark/light mode, role-specific dashboards, real-time form validation, data tables with pagination/filtering/sorting, PDF export, responsive layouts
- **Port:** `http://localhost:5173`

## Quick Start

### Backend

```bash
cd insurance-policy-claim-management-system

# Create env.properties with the required values (see application.properties):
#   DB_USER, DB_PASSWORD, JWT_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
#   CLOUDINARY_SECRET, EMAIL_USER, EMAIL_PASSWORD, TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE
# The backend imports env.properties automatically via spring.config.import.

# Run
./mvnw spring-boot:run
```

### Frontend

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

See [CHANGELOG.md](./CHANGELOG.md) for a history of recent changes. Curated project documentation lives in [`imp-doc/`](./imp-doc/).

## Documentation

- [`docs/`](./docs/README.md) — architecture, sequence diagrams, database, caching, logging, performance, security, and deployment documentation
- [`imp-doc/`](./imp-doc/README.md) — curated API contracts, workflows, and Postman scenarios
- [`screenshots/`](./screenshots/) — UI screenshots per role

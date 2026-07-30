# Insurance Policy & Claim Management System

A full-stack insurance management platform with role-based workflows for policy administration, premium payments, and claim processing.

## Architecture

```
capstone-project/
├── insurance-policy-claim-management-system/   # Backend (Spring Boot REST API)
└── insurance-policy-claim-management-app-ui/    # Frontend (React + Vite)
```

## Backend

- **Stack:** Java 17, Spring Boot 3.x, Spring Security (JWT), Spring Data JPA + Hibernate, MySQL
- **Features:** Role-based auth (ADMIN / INTERNAL_STAFF / CUSTOMER), product & plan management, policy lifecycle, premium calculation with strategy pattern, claim submission & multi-step review, Cloudinary document upload, OTP via Twilio SMS & Gmail SMTP
- **Port:** `http://localhost:8080/api`

## Frontend

- **Stack:** React 19, Vite, React Router 7, React Hook Form, Axios, Bootstrap 5, Framer Motion, jsPDF
- **Features:** Themed UI with dark/light mode, role-specific dashboards, real-time form validation, data tables with pagination/filtering/sorting, PDF export, responsive layouts
- **Port:** `http://localhost:5173`

## Quick Start

### Backend

```bash
cd insurance-policy-claim-management-system

# Set required environment variables
set DB_USER=your_mysql_user
set DB_PASSWORD=your_mysql_password
set JWT_SECRET=your_jwt_secret
set TWILIO_ACCOUNT_SID=your_twilio_sid
set TWILIO_AUTH_TOKEN=your_twilio_token
set CLOUDINARY_CLOUD_NAME=your_cloud_name
set CLOUDINARY_API_KEY=your_api_key
set CLOUDINARY_API_SECRET=your_api_secret

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

# Setup

> Prerequisites and first-time installation for local development.

## Purpose

Take a new developer from zero to a running backend + frontend.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Java JDK | 17 | Required by `pom.xml` |
| Maven | via `./mvnw` | No global Maven needed |
| Node.js / npm | LTS (npm ≥ 10) | For the Vite frontend |
| MySQL | 8.x | Schema `insurance_db` created by the app |
| Git | any | Clone the repo |

## 1. Clone

```bash
git clone https://github.com/Gurry-12/insurance-policy-claim-capstone-project.git
cd capstone-project
```

## 2. Configure backend secrets (`env.properties`)

The backend imports `env.properties` from its root via
`spring.config.import=file:env.properties` (the file is gitignored). Copy the
shape from `docs/11_Developer_Guide/Environment.md` and fill in real values:

```properties
DB_USER=springstudent
DB_PASSWORD=springstudent

JWT_KEY=<long random secret at least 32 chars>

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_SECRET=...

EMAIL_USER=you@gmail.com
EMAIL_PASSWORD=<app password>

TWILIO_SID=...
TWILIO_TOKEN=...
TWILIO_PHONE=...
```

Without email/Twilio keys the app still boots; OTPs are then visible in the
server console and stored in `otp_verifications` (see `Run.md`).

## 3. Create the database

```sql
CREATE DATABASE IF NOT EXISTS insurance_db;
CREATE USER IF NOT EXISTS 'springstudent'@'localhost' IDENTIFIED BY 'springstudent';
GRANT ALL PRIVILEGES ON insurance_db.* TO 'springstudent'@'localhost';
FLUSH PRIVILEGES;
```

The schema is auto-created by Hibernate (`ddl-auto=update`), so no manual DDL.

## 4. Backend

```bash
cd insurance-policy-claim-management-system
./mvnw clean install -DskipTests        # first time: downloads dependencies
./mvnw spring-boot:run
```

The API is ready at `http://localhost:8081/api` (Swagger at
`http://localhost:8081/swagger-ui.html`).

## 5. Frontend

```bash
cd insurance-policy-claim-management-app-ui
npm install
cp .env.example .env   # adjust if needed
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:8081`.

## 6. Seed demo data (optional but recommended)

Import `demo-data/sql/*.sql` **after** the first backend boot so the schema
exists:

```bash
mysql -u springstudent -p insurance_db < demo-data/sql/01-users-and-customers.sql
mysql -u springstudent -p insurance_db < demo-data/sql/02-catalog.sql
mysql -u springstudent -p insurance_db < demo-data/sql/03-policies-claims.sql
```

Then restart the backend. Login with the seeded users from
`demo-data/04-evaluator-demo.md` (e.g. `admin@insurance.com` / `Admin@123`,
`rajesh.sharma@example.com` / `Customer@123`).

## Verification checklist

- [ ] Backend starts on 8081 without errors
- [ ] `GET http://localhost:8081/api/public/stats` returns JSON
- [ ] Frontend loads on 5173 and the landing page shows stats
- [ ] `admin@insurance.com` / `Admin@123` logs in (auto-seeded admin)

## Related

- `Environment.md` — every configuration key
- `Run.md` — day-to-day run commands
- `Troubleshooting.md` — common failures
- `../../demo-data/03-testing-flow.md` — full curl walkthrough

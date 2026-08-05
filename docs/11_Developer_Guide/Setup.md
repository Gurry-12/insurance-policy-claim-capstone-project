# Local Setup Guide
> Step-by-step instructions to get InsuranceFlow running on your local machine.

---

## Purpose
To ensure a smooth, error-free setup of the development environment. Follow these steps exactly to avoid dependency or port conflicts.

---

## Prerequisites

| Software | Required Version | Why it's needed |
|----------|------------------|-----------------|
| Java | 17 (LTS) | Backend execution |
| Node.js | v20+ | Frontend React/Vite environment |
| MySQL | 8.0+ | Relational data storage |
| Redis | 6.0+ | Token blacklisting & caching |
| Maven | 3.8+ | Backend dependency management |

---

## Step 1: Database Setup (MySQL)

1. Open your MySQL client (Workbench/CLI).
2. Execute the following to create the database:
   ```sql
   CREATE DATABASE insurance_db;
   ```
3. Ensure your MySQL instance is running on port `3306` with username `root` and password `root`. (Modify `application.properties` if yours differs).

> [!WARNING]
> **If this fails:** Ensure MySQL service is running. Check port conflicts if you have XAMPP or other DBs installed.

---

## Step 2: Cache Setup (Redis)

1. Start your local Redis server.
   - **Windows:** Use WSL2 or Memurai.
   - **Mac/Linux:** `redis-server`
2. Redis must be running on `localhost:6379`.

> [!WARNING]
> **If this fails:** The backend will refuse to start because the token blacklist filter requires an active Redis connection.

---

## Step 3: Backend Setup (Spring Boot)

1. Navigate to the backend directory.
2. Build the project:
   ```bash
   mvn clean install -DskipTests
   ```
3. Expected Output: `BUILD SUCCESS`

> [!WARNING]
> **If this fails:** Verify Java 17 is on your PATH by running `java -version`. Check `pom.xml` for any unresolved dependencies.

---

## Step 4: Frontend Setup (React)

1. Navigate to the frontend directory (`src` or `insurance-frontend`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Expected Output: `added X packages, and audited Y packages`

> [!WARNING]
> **If this fails:** Try clearing npm cache (`npm cache clean --force`) or ensure you are using Node v20+.

---

## Verification Checklist
- [ ] MySQL is running on 3306 and `insurance_db` exists.
- [ ] Redis is running on 6379 (`redis-cli ping` returns `PONG`).
- [ ] `mvn clean install` succeeded.
- [ ] `npm install` succeeded.
- [ ] Cloudinary and SMTP credentials are ready for `.env` / `application.properties`.

---

## Related Documents
- [Environment Configuration](./Environment.md)
- [Run Guide](./Run.md)

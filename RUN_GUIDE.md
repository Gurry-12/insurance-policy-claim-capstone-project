# Project Run & Command Guide (Full-Stack, MySQL Workbench & Redis)

This guide provides all necessary terminal commands (`npm`, `mvnw`, `docker-compose`) and step-by-step instructions to run the **Insurance Policy & Claim Management System** locally with your setup:
- **MySQL Workbench** (Local MySQL Server on port `3306`)
- **Docker Desktop** (Lightweight Redis 7 Alpine container on port `6379`)
- **Spring Boot Backend** (`http://localhost:8081/api`)
- **React Vite Frontend** (`http://localhost:5173`)

---

## 1. One-Glance Full-Stack Startup Order

| Step | Component | Command | Port / URL | Notes |
|---|---|---|---|---|
| **1. MySQL** | Local MySQL Server | Start MySQL in MySQL Workbench / Windows Services | `3306` | Uses your local database |
| **2. Redis** | Start Redis via Docker | `docker-compose up -d` *(in root or backend folder)* | `6379` | Runs `insurance-redis` container |
| **3. Backend** | Start Spring Boot REST API | `.\mvnw.cmd spring-boot:run` *(or `./mvnw`)* | `8081` | Base API: `http://localhost:8081/api` |
| **4. Frontend** | Start React SPA UI | `npm run dev` *(in UI folder)* | `5173` | UI: `http://localhost:5173` |
| **5. Docs** | Swagger API UI | Open in browser | `8081` | `http://localhost:8081/swagger-ui.html` |

> [!TIP]
> Ensure **Docker Desktop** and your **local MySQL Server** are running before starting the Spring Boot backend.

---

## 2. Infrastructure Setup (Redis via Docker Desktop)

We provide a [`docker-compose.yml`](./docker-compose.yml) in the root (and in `insurance-policy-claim-management-system/`) configured to run a lightweight Alpine Redis container (`redis:7-alpine`) on port `6379` without interfering with your local MySQL Workbench on port `3306`.

### A. Start Redis Container
In either the project root or backend folder:
```powershell
# Start Redis in background detached mode
docker-compose up -d
```

### B. Verify & Manage Redis Container
```powershell
# Verify container status (should show insurance-redis as Up/healthy)
docker ps

# Test Redis ping (should output PONG)
docker exec -it insurance-redis redis-cli ping

# Stop container when done working
docker-compose down
```

---

## 3. Database Setup (MySQL Workbench)

1. Open **MySQL Workbench** and ensure your local MySQL server is running on port `3306`.
2. Ensure you have a MySQL schema/user configured matching your `env.properties` (or default `app.datasource.url=jdbc:mysql://localhost:3306/insurance_claim_db`).
3. Spring Boot's Hibernate (`ddl-auto=update`) will automatically create or update all tables (`users`, `refresh_tokens`, `customers`, etc.) upon startup.
4. *(Optional)* To populate sample data, run the scripts in [`demo-data/`](./demo-data/) in MySQL Workbench.

---

## 4. Backend Setup & Commands (`mvnw` / Maven)

- **Directory**: [`insurance-policy-claim-management-system`](./insurance-policy-claim-management-system)
- **Stack**: Java 17, Spring Boot 4.0.6, Spring Security (JWT), Spring Data Redis, MySQL

### A. Environment Properties (`env.properties`)
Before running the backend, ensure an `env.properties` file exists in the backend directory (`insurance-policy-claim-management-system/env.properties`):

```properties
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_KEY=ThisIsASecretKeyForJWTAuthenticationInSpringBootManyToManyProject12345

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET=your_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_PHONE=+1234567890

# Redis Config (enabled by default; connects to docker container on localhost:6379)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true
```

### B. Running & Testing the Backend (PowerShell / CMD)

```powershell
cd e:\Ddrive\03_Skills_and_Projects\capstone-project\insurance-policy-claim-management-system

# 1. Start the Spring Boot backend server
.\mvnw.cmd spring-boot:run

# 2. Run all unit & integration tests
.\mvnw.cmd test

# 3. Run only the JWT & Refresh Token Security test suite
.\mvnw.cmd test "-Dtest=JwtSecurityIntegrationTest,RefreshTokenIntegrationTest,RedisTokenCacheServiceTest"

# 4. Build executable JAR without running tests
.\mvnw.cmd clean package -DskipTests

# 5. Run built production JAR directly
java -jar target/insurance-policy-claim-management-system-0.0.1-SNAPSHOT.jar
```

---

## 5. Frontend Setup & Commands (`npm` / Vite / React)

- **Directory**: [`insurance-policy-claim-management-app-ui`](./insurance-policy-claim-management-app-ui)
- **Stack**: React 19, Vite, React Router 7, Bootstrap 5, Axios (with dual-token `withCredentials` interceptor)

### A. Environment Setup (`.env`)
In the frontend folder (`insurance-policy-claim-management-app-ui`), check or create `.env`:
```env
VITE_API_BASE_URL=http://localhost:8081/api
```

### B. Node Package Manager (`npm`) Commands

```powershell
cd e:\Ddrive\03_Skills_and_Projects\capstone-project\insurance-policy-claim-management-app-ui

# 1. Install required Node dependencies (first-time setup)
npm install

# 2. Start the Vite local development server (http://localhost:5173)
npm run dev

# 3. Lint the codebase
npm run lint

# 4. Build optimized production bundle (/dist folder)
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 6. Verification Checklist

1. **Redis Health**:
   ```powershell
   docker exec -it insurance-redis redis-cli ping
   # Expected output: PONG
   ```
2. **Backend API Health**:
   - Open `http://localhost:8081/swagger-ui.html` in your browser.
   - You should see the OpenAPI documentation page for **Insurance Policy & Claim Management System API**.
3. **Frontend UI Health**:
   - Open `http://localhost:5173` in your browser.
   - Try logging in with any user account from your MySQL database.

---

## 7. Troubleshooting Common Local Errors

### `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`
- **Cause**: The **Docker Desktop** application is closed or the Docker Engine background daemon is not running on Windows.
- **Fix**:
  1. Open the **Docker Desktop** app from your Windows Start Menu.
  2. Wait ~30 seconds until the bottom-left status indicator says **"Engine running"** (green icon).
  3. Re-run `docker-compose up -d`.

---

## 8. How to Inspect & View Stored Data in Redis

You can inspect all cached authentication tokens, blacklisted JWTs, and grace-window keys stored in Redis using terminal commands or a GUI tool.

### A. Quick One-Line Terminal Commands (PowerShell / CMD)

```powershell
# 1. List all existing keys in Redis
docker exec -it insurance-redis redis-cli KEYS *

# 2. List only authentication-related keys
docker exec -it insurance-redis redis-cli KEYS auth:*

# 3. View active refresh token hashes stored for User ID 1 (Redis Set)
docker exec -it insurance-redis redis-cli SMEMBERS "auth:refresh:1"

# 4. Check remaining time-to-live (TTL in seconds) for a key
docker exec -it insurance-redis redis-cli TTL "auth:refresh:1"

# 5. Check if a specific JWT Access Token ID (jti) is blacklisted after logout
docker exec -it insurance-redis redis-cli GET "auth:jwt:blacklist:<jti>"

# 6. Check if a token is in the 10-second rotation grace window
docker exec -it insurance-redis redis-cli GET "auth:refresh:grace:<hash>"

# 7. Clear/Delete all cached data from Redis (Reset Redis cache)
docker exec -it insurance-redis redis-cli FLUSHALL
```

### B. Interactive Redis CLI Session
To open an interactive Redis console inside the container:
```powershell
docker exec -it insurance-redis redis-cli
```
Once inside `127.0.0.1:6379>`, you can run any Redis command directly:
```text
127.0.0.1:6379> KEYS *
1) "auth:refresh:1"
2) "auth:jwt:blacklist:c91f1c7e-8c3b-4c5e-9e7f-1b2c3d4e5f6a"

127.0.0.1:6379> SMEMBERS "auth:refresh:1"
1) "8f4e2b1d9c...sha256hex..."

127.0.0.1:6379> exit
```

### C. Using a Graphical GUI Tool (Optional)
If you prefer a visual interface to browse keys:
1. **RedisInsight** (Official free GUI by Redis): Download and connect to `localhost:6379` (no password by default).
2. **VS Code Extension**: Install the **Database Client / Redis** extension in VS Code and add a connection to `localhost:6379`.


# Local Run Guide
> Master guide for starting the InsuranceFlow platform.

---

## Prerequisites
Before running, ensure you have completed the [Setup Guide](docs/11_Developer_Guide/Setup.md) and have the following running:
- **Java 17**
- **Node v20+**
- **MySQL 8.0+**
- **Redis 6.0+**

---

## One-Glance Startup Table

| Component | Command / Action | Port | Status URL / Check |
|-----------|------------------|------|--------------------|
| **MySQL** | Start via Services/Docker | 3306 | Connect via Workbench |
| **Redis** | `redis-server` | 6379 | `redis-cli ping` -> PONG |
| **Backend** | `mvn spring-boot:run` | 8081 | `http://localhost:8081/api/system/health` |
| **Frontend** | `npm run dev` | 5173 | `http://localhost:5173` |

---

## Per-Component Setup & Verification

### 1. Database & Cache
- Start MySQL. Ensure `insurance_db` exists.
- Start Redis.
- **Verify:** `redis-cli ping` must return `PONG`.

### 2. Spring Boot Backend
1. Open terminal in the backend root directory.
2. Run: `mvn spring-boot:run`
3. **Verify:** Check terminal for `Tomcat started on port(s): 8081`. 
4. **Seed Data Note:** The system will auto-create the `admin@insurance.com` / `Admin@123` account on the first boot.

### 3. React Frontend
1. Open terminal in the frontend root directory.
2. Run: `npm run dev`
3. **Verify:** Open `http://localhost:5173`. You should see the login screen.

---

## Troubleshooting

- **Backend crashes on start:** Check if Redis is running. The JWT filter requires Redis for blacklisting.
- **Cannot login:** Check MySQL connection settings in `application.properties`.
- **CORS Errors:** Ensure frontend is running exactly on `localhost:5173` and matches the allowed origins in Spring Boot.
- *For more details, see the [Troubleshooting Guide](docs/11_Developer_Guide/Troubleshooting.md).*

---

## Redis Inspection Commands

If you need to debug session state, tokens, or rate-limiting, use these commands inside `redis-cli`:

| Command | What it does |
|---------|--------------|
| `keys *` | Lists all keys in Redis. |
| `get "auth:jwt:blacklist:<token>"` | Checks if a specific JWT is blacklisted. |
| `keys "bucket4j*"` | Lists all rate-limiting buckets (IPs/Emails). |
| `flushall` | Wipes the entire cache (useful to reset rate limits instantly). |

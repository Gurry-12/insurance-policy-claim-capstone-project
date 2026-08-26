# Local Run Guide
> Master guide for starting and verifying the InsuranceFlow platform (Backend, Frontend, Redis, and the ELK Logging Stack).

---

## 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Java 17 (LTS)**
- **Node.js v20+** & npm
- **MySQL 8.0+**
- **Docker Desktop** (for Redis, Elasticsearch, Logstash, Kibana, Filebeat)

---

## ⚡ One-Glance Startup Table

| Component | Command / Action | Port | Status / Verification URL |
|:---|:---|:---|:---|
| **MySQL** | Local Service / Workbench | 3306 | Connect to database `insurance_db` |
| **Redis** | `docker-compose up -d` | 6379 | `redis-cli ping` $\rightarrow$ `PONG` |
| **Elasticsearch** | `docker-compose up -d` | 9200 | `http://localhost:9200` |
| **Logstash** | `docker-compose up -d` | 5044 | Pipeline listening on port 5044 |
| **Kibana (ELK UI)**| `docker-compose up -d` | 5601 | `http://localhost:5601` |
| **Filebeat** | `docker-compose up -d` | — | Tails `./logs/application.json` $\rightarrow$ Logstash |
| **Spring Boot API**| `mvn spring-boot:run` | 8081 | `http://localhost:8081/swagger-ui.html` & `/api/public/stats` |
| **React Frontend** | `npm run dev` | 5173 | `http://localhost:5173` |

---

## 🚀 Step-by-Step Startup Sequence

### Step 1: Start MySQL Database
1. Ensure your local MySQL server is running on port `3306`.
2. Ensure the database `insurance_db` exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS insurance_db;
   ```
3. Verify that credentials in `env.properties` (or `application.properties`) match your MySQL password (`DB_USER`, `DB_PASSWORD`).

---

### Step 2: Start Redis & ELK Stack (Docker Compose)
Navigate to the backend directory and launch the multi-container infrastructure:
```bash
cd insurance-policy-claim-management-system
docker-compose up -d
```

#### Verify Container Health:
```bash
docker ps
```
You should see 5 running containers:
* `insurance-redis` (Redis on port `6379`)
* `elasticsearch` (Elasticsearch 8.14.1 on port `9200`)
* `logstash` (Logstash on port `5044`)
* `kibana` (Kibana on port `5601`)
* `filebeat` (Filebeat reading `/logs/application.json`)

---

### Step 3: Start Spring Boot Backend
Open a new terminal in `insurance-policy-claim-management-system`:
```bash
mvn spring-boot:run
```
#### Verification:
1. Terminal shows `Tomcat started on port(s): 8081 (http)`.
2. Open Swagger in browser: [`http://localhost:8081/swagger-ui.html`](http://localhost:8081/swagger-ui.html)
3. Open Public Stats API: [`http://localhost:8081/api/public/stats`](http://localhost:8081/api/public/stats)
4. *Default Seeded Admin:* `admin@insurance.com` / `Admin@123` is automatically inserted on initial boot.

---

### Step 4: Start React (Vite) Frontend
Open a new terminal in `insurance-policy-claim-management-app-ui`:
```bash
npm install   # If running for the first time
npm run dev
```
#### Verification:
1. Terminal displays `Local: http://localhost:5173/`.
2. Open [`http://localhost:5173`](http://localhost:5173) in browser. The landing page and login portal will load.

---

## 📊 Kibana & ELK Logging Setup Guide

The application uses Logback with `LogstashEncoder` to output structured JSON logs to `./logs/application.json`. Filebeat ships these logs to Logstash, which indexes them in Elasticsearch under `springboot-json-logs-YYYY.MM.dd`.

### How to View Logs in Kibana:
1. Open Kibana in your browser: [`http://localhost:5601`](http://localhost:5601)
2. Go to **Management** $\rightarrow$ **Stack Management** $\rightarrow$ **Data Views** (or **Index Patterns**).
3. Click **Create data view**.
4. Name the view: `springboot-json-logs-*`
5. Index pattern: `springboot-json-logs-*`
6. Timestamp field: `@timestamp`
7. Click **Save data view to Kibana**.
8. Navigate to **Analytics** $\rightarrow$ **Discover** to view live structured logs, filter by `level: "ERROR"` or `logger_name`, and trace security audit events!

---

## 🔍 Redis Inspection & Debugging Guide

To inspect session state, blacklisted tokens, and grace windows:

### Access Redis CLI:
```bash
# If using Docker:
docker exec -it insurance-redis redis-cli

# If installed locally:
redis-cli
```

### Essential Redis Commands:

| Command | Purpose |
|:---|:---|
| `PING` | Returns `PONG` if Redis is healthy |
| `KEYS *` | Lists all active keys |
| `KEYS "auth:jwt:blacklist:*"` | Lists blacklisted JWTs (revoked on `/logout`) |
| `KEYS "auth:refresh:*"` | Lists active refresh token caches |
| `KEYS "auth:refresh:grace:*"` | Lists tokens in the 10-second silent refresh grace window |
| `GET "auth:jwt:blacklist:<jti>"` | Reads blacklist status of a specific JWT |
| `TTL "auth:jwt:blacklist:<jti>"` | Returns remaining expiration time in seconds |
| `MONITOR` | Streams real-time Redis operations (useful for live demo debugging) |
| `FLUSHDB` | Clears all cache/blacklists (caution: resets active sessions) |

---

## 🛠️ Common Troubleshooting

* **Backend fails on startup with Redis Connection Exception:**
  * Ensure Redis container is running: `docker start insurance-redis` or `docker-compose up -d`.
* **CORS Error in Browser Console:**
  * Ensure frontend runs on `http://localhost:5173`. If running on another port, update `app.security.cors.allowed-origin` in `application.properties`.
* **Logs not showing in Kibana:**
  * Verify `./logs/application.json` exists in the backend directory and has write permissions.
  * Check Filebeat status: `docker logs filebeat`.


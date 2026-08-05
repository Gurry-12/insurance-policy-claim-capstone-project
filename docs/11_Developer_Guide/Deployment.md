# Deployment Guide
> Taking InsuranceFlow from local development to production.

---

## Purpose
To outline the architecture and steps required to deploy the frontend and backend in a live environment.

---

## Deployment Checklist
- [ ] Database is migrated, and `ddl-auto` is set to `validate`.
- [ ] Frontend `.env.production` points to the live backend domain.
- [ ] Backend CORS configuration allows the live frontend domain.
- [ ] Redis is secured with a password and not exposed to the public internet.
- [ ] SSL/TLS certificates are provisioned for both domains.

---

## Backend Deployment (JAR)

1. **Build:** `mvn clean install -DskipTests`
2. **Transfer:** Move the JAR to the server.
3. **Environment:** Set system ENV variables (DB, Redis, Secrets).
4. **Run as Service:** Use `systemd` to keep the app running.
   ```ini
   [Unit]
   Description=InsuranceFlow Backend
   [Service]
   ExecStart=/usr/bin/java -jar /opt/app/insuranceflow.jar
   Restart=always
   [Install]
   WantedBy=multi-user.target
   ```

---

## Frontend Deployment (Static Build)

1. **Build:** `npm run build`
2. **Transfer:** Copy the `/dist` folder contents to `/var/www/insuranceflow` on your server.
3. **Nginx Config:** Serve the static files and map fallback routes for React Router.

### Reverse Proxy (Nginx) Example
```nginx
server {
    listen 80;
    server_name insuranceflow.com;

    # Serve React App
    location / {
        root /var/www/insuranceflow;
        index index.html;
        try_files $uri $uri/ /index.html; # Required for React Router 7
    }

    # Reverse Proxy to Spring Boot API
    location /api/ {
        proxy_pass http://localhost:8081/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Pass cookies securely
        proxy_cookie_path / "/; secure; HttpOnly; SameSite=strict";
    }
}
```

---

## Dev vs Production Differences

| Feature | Local Dev | Production |
|---------|-----------|------------|
| **CORS** | `http://localhost:5173` | `https://insuranceflow.com` |
| **Cookies** | `Secure=false` | `Secure=true` |
| **Database** | `ddl-auto=update` | `ddl-auto=validate` (Flyway) |
| **Routing** | Vite Dev Server | Nginx `try_files` |

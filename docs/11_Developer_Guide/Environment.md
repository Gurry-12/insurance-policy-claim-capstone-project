# Environment Configuration
> Complete guide to environment variables and properties for both environments.

---

## Purpose
Defines all configurable properties required for the system to boot, connect to databases, and integrate with external APIs.

---

## Backend: `application.properties`

Place this in `src/main/resources/`. 

```properties
# Server
server.port=8081
server.servlet.context-path=/api

# MySQL Database
spring.datasource.url=jdbc:mysql://localhost:3306/insurance_db?useSSL=false
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update

# Redis (Token caching)
spring.redis.host=localhost
spring.redis.port=6379

# JWT Security
# Must be at least 256 bits (32 chars)
app.jwt.secret=YourSuperSecretKeyForJwtGenerationDoNotShare
app.jwt.expiration-ms=900000 
app.jwt.refresh-expiration-days=7

# Twilio (SMS OTP)
twilio.account.sid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
twilio.auth.token=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
twilio.phone.number=+1234567890

# SMTP (Email OTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# Cloudinary (Claim Documents)
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret
```

### Missing Keys Behavior
- **DB/Redis:** Server crashes immediately on startup.
- **JWT:** Server crashes due to `IllegalArgumentException` in AuthFilter initialization.
- **Twilio/SMTP/Cloudinary:** Server boots, but features (OTP, Uploads) will throw 500 errors when invoked.

---

## Frontend: `.env`

Place this in the frontend root directory.

```env
# The base URL of the backend API
VITE_API_BASE_URL=http://localhost:8081/api

# Feature Flags (Optional)
VITE_ENABLE_DEBUG_LOGGING=true
```

### Missing Keys Behavior
- If `VITE_API_BASE_URL` is missing, Axios will attempt to call relative paths (e.g., `http://localhost:5173/auth/login`) resulting in 404 Not Found errors.

---

> [!CAUTION]
> **Security Note**
> Never commit `application.properties` or `.env` to version control. Use templates (e.g., `.env.example`) in Git and manage real credentials via CI/CD secrets.

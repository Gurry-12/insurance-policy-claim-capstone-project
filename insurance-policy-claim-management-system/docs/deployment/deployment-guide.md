# Deployment Guide

## Purpose

This document explains how to set up the environment, configure the database, and run the Insurance Policy Claim Management System locally or in a server environment.

---

## Prerequisites

- **Java:** JDK 17
- **Maven:** 3.8+
- **Database:** MySQL 8.x
- **Cloudinary Account:** For document storage
- **Gmail Account:** For email OTP (requires App Password)
- **Twilio Account:** For SMS OTP

---

## 1. Database Setup

1. Install MySQL 8.x
2. Create a database named `insurance_db`:
   ```sql
   CREATE DATABASE insurance_db;
   ```
3. The application will automatically create the tables on startup because of `spring.jpa.hibernate.ddl-auto=update`.

---

## 2. Environment Variables Configuration

The application uses `env.properties` to manage secrets. This file is loaded via `spring.config.import=file:env.properties` in `application.properties`.

**IMPORTANT:** Do NOT commit `env.properties` to version control.

Create a file named `env.properties` in the root of the project (same directory as `pom.xml`):

```properties
# Database
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Security
# Must be at least 256-bit (32 characters) string for HMAC-SHA
JWT_KEY=your_super_secret_jwt_key_that_is_very_long

# Cloudinary (Document Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret

# Email Config (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
# Use an App Password if using Gmail with 2FA enabled, not your real password
EMAIL_PASSWORD=your_app_password

# Twilio Config (SMS)
TWILIO_SID=your_twilio_account_sid
TWILIO_TOKEN=your_twilio_auth_token
TWILIO_PHONE=+1234567890  # Your Twilio verified phone number

# Frontend URL (For CORS and Email Links)
FRONTEND_URL=http://localhost:5173
```

---

## 3. Running the Application

### Using Maven

Run the Spring Boot application using the Maven wrapper or installed Maven:

```bash
mvn spring-boot:run
```

### Using IDE (Eclipse/IntelliJ/VS Code)

1. Import the project as a Maven project
2. Locate `com.insurance.demo.DemoApplication.java`
3. Run as Java Application

### Building for Production

To build a deployable JAR file:

```bash
mvn clean package -DskipTests
```

This will generate a JAR file in the `target/` directory, e.g., `target/insurance-policy-claim-management-system-0.0.1-SNAPSHOT.jar`.

To run the packaged JAR:

```bash
java -jar target/insurance-policy-claim-management-system-0.0.1-SNAPSHOT.jar
```

Ensure `env.properties` is in the same directory as the JAR file when running.

---

## 4. Default Admin Initialization (Not Implemented)

**Developer Note:** There is currently no `DataInitializer` or `CommandLineRunner` script to automatically insert an Admin user on startup.

**To create the first Admin:**
You must manually insert an admin record directly into the database to bootstrap the system, since staff/admin accounts cannot be self-registered.

```sql
INSERT INTO users (full_name, email, password, mobile_number, is_active, role, email_verified, phone_verified, created_date) 
VALUES ('System Admin', 'admin@example.com', '$2a$10$YourBcryptHashedPasswordHere', '+919999999999', true, 'ROLE_ADMIN', true, true, NOW());
```

*(You must generate a BCrypt hash for your desired password and paste it above. For example, the BCrypt hash for `password123`)*

---

## 5. Third-Party Service Setup Details

### Gmail App Password
If using Gmail for SMTP, regular passwords will not work if 2-Factor Authentication is enabled.
1. Go to Google Account Settings -> Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new password for "Mail" and use this 16-character string as `EMAIL_PASSWORD`.

### Cloudinary
1. Sign up at cloudinary.com
2. Go to Dashboard
3. Copy "Cloud Name", "API Key", and "API Secret".

### Twilio
1. Sign up at twilio.com
2. Get a Twilio phone number
3. Copy Account SID and Auth Token from the console dashboard.

---

## 6. Troubleshooting

- **Server fails to start:** Check `env.properties`. Missing variables will cause property resolution errors.
- **Database connection error:** Verify MySQL is running and `DB_USER`/`DB_PASSWORD` are correct.
- **CORS errors in frontend:** Ensure `FRONTEND_URL` in `env.properties` exactly matches the frontend origin (no trailing slash).
- **Email fails to send:** Check your App Password and ensure port 587 isn't blocked by your firewall.

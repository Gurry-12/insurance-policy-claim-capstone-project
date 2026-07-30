# Insurance Policy and Claim Management System

A Spring Boot REST API that simulates real-world insurance operations including product management, policy purchases, premium payments, claim submission, and role-based claim approval workflows.

## Tech Stack

- **Java 17** + **Spring Boot 3.x**
- **Spring Security** with JWT authentication
- **Spring Data JPA** + **Hibernate** (MySQL)
- **Lombok** for boilerplate reduction
- **Cloudinary** for document storage
- **Twilio** for SMS OTP
- **Gmail SMTP** for email OTP

## Roles

| Role | Permissions |
|---|---|
| **ADMIN** | Manage products, plans, users, final claim decisions |
| **INTERNAL_STAFF** | Review claims, recommend decisions, issue policies |
| **CUSTOMER** | Purchase policies, make payments, raise claims |

## Quick Start

```bash
# 1. Set environment variables
export DB_USER=your_mysql_user
export DB_PASSWORD=your_mysql_password
export TWILIO_ACCOUNT_SID=your_twilio_sid
export TWILIO_AUTH_TOKEN=your_twilio_token
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret

# 2. Run
./mvnw spring-boot:run
```

## API Base URL

`http://localhost:8080/api`

See [API_CONTRACT.md](API_CONTRACT.md) for full endpoint documentation.

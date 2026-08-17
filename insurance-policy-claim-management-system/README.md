# Insurance Policy and Claim Management System

A Spring Boot REST API that simulates real-world insurance operations including product management, policy purchases, premium payments, claim submission, and role-based claim approval workflows.

## Tech Stack

- **Java 17** + **Spring Boot 4.0.6**
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
# 1. Create env.properties beside the project root with these values (see application.properties):
#    DB_USER, DB_PASSWORD, JWT_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
#    CLOUDINARY_SECRET, EMAIL_USER, EMAIL_PASSWORD, TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE
#    The backend imports it automatically via spring.config.import.

# 2. Run
./mvnw spring-boot:run
```

## API Base URL

`http://localhost:8081/api`

Swagger UI: `http://localhost:8081/swagger-ui.html`

Full endpoint documentation: [API reference](../docs/03_API/API_Flow.md). See also the project's [documentation hub](../docs/README.md).



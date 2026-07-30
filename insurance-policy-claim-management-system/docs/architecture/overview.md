# System Architecture Overview

## Purpose

This document explains the overall architecture of the Insurance Policy Claim Management System — what layers exist, why they exist, how they communicate, and what decisions shaped the design.

---

## Architectural Style

The system follows a **classic layered (n-tier) architecture** using Spring Boot's opinionated conventions:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Frontend)                    │
│         React / Next.js app at http://localhost:5173     │
└───────────────────────────┬─────────────────────────────┘
                            │  HTTP REST (JSON)
                            │  Authorization: Bearer <JWT>
┌───────────────────────────▼─────────────────────────────┐
│                   SPRING SECURITY FILTER CHAIN           │
│   JwtAuthenticationFilter → SecurityFilterChain rules    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    CONTROLLER LAYER                      │
│   @RestController, @RequestMapping, @PreAuthorize        │
│   Input validation (@Valid), DTO binding                 │
└───────────────────────────┬─────────────────────────────┘
                            │  Calls Service Interface
┌───────────────────────────▼─────────────────────────────┐
│                     SERVICE LAYER                        │
│   Business rules, orchestration, @Transactional          │
│   SecurityContext reads (who is logged in?)              │
└───────────────────────────┬─────────────────────────────┘
                            │  Calls Repository Interface
┌───────────────────────────▼─────────────────────────────┐
│                   REPOSITORY LAYER                       │
│   Spring Data JPA, JPQL queries, Specifications          │
│   EntityGraph for N+1 prevention                         │
└───────────────────────────┬─────────────────────────────┘
                            │  JPA / Hibernate
┌───────────────────────────▼─────────────────────────────┐
│                       DATABASE                           │
│         MySQL 8.x (insurance_db)                         │
│   Tables: users, customers, insurance_products,          │
│   policy_plans, policies, premium_payments, claims,      │
│   claim_documents, claim_status_histories,               │
│   staff_specialities, otp_verifications                  │
└─────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Controller Layer (`com.insurance.demo.controller`)

**What:** Thin REST endpoints that accept HTTP requests and return HTTP responses.

**Why it's thin:** Controllers must NOT contain business logic. They only:
- Bind and validate incoming DTOs (`@Valid`)
- Delegate to the service layer
- Return `ApiResponseDTO<T>` wrapping the result

**Key pattern:**
```java
@PostMapping("/raise")
@PreAuthorize("hasRole('CUSTOMER')")
public ApiResponseDTO<ClaimResponseDTO> raiseClaim(@Valid @RequestPart("claim") ClaimRequestDTO dto,
        @RequestPart("files") List<MultipartFile> files) throws IOException {
    return claimService.raiseClaim(dto, files);  // All logic in service
}
```

### Service Layer (`com.insurance.demo.service` + `serviceimpl`)

**What:** The brain of the application. All business rules, validations, and decisions live here.

**Why it's separated into interface + impl:**
- Interface (`service/`) defines the contract
- Implementation (`serviceimpl/`) provides the behavior
- This enables easy testing with mocks and future alternative implementations

**Key responsibilities:**
- All business rule enforcement (policy ownership, coverage limits, OTP rate limits)
- Reading the `SecurityContext` to identify the current user
- Calling multiple repositories in a transaction
- Converting entities to response DTOs

### Repository Layer (`com.insurance.demo.repository`)

**What:** Spring Data JPA interfaces that generate SQL automatically.

**Why Spring Data JPA:**
- Eliminates boilerplate DAO code
- Derived queries from method names are type-safe and readable
- Custom JPQL when derived queries are insufficient
- `JpaSpecificationExecutor` enables dynamic filtering (used in paginated endpoints)

### Security Layer (`com.insurance.demo.security` + `config/SecurityConfig`)

**What:** JWT-based stateless authentication and role-based access control.

**Why stateless (no sessions):**
- Insurance APIs are consumed by a React SPA — sessions are not suitable
- JWT allows horizontal scaling without shared session state
- Token contains all needed information (email, role, fullName, productSpeciality)

### Verification Layer (`com.insurance.demo.verification`)

**What:** OTP generation, email delivery (Gmail SMTP), and SMS delivery (Twilio).

**Why dual-channel OTP:**
- Regulatory compliance — identity verification via two channels
- Business requirement: both email AND phone must be verified before login

---

## Cross-Cutting Concerns

### Exception Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) intercepts ALL exceptions and returns consistent JSON error responses. No try-catch in controllers.

### Validation

Bean Validation (`jakarta.validation`) on DTOs. If validation fails, Spring throws `MethodArgumentNotValidException`, handled globally.

### Logging

SLF4J with `@Slf4j` (Lombok). Structured log messages include user IDs, emails, and operation context. Level: DEBUG for `com.insurance.demo`, INFO for root.

### Optimistic Locking

`Policy` and `Claim` entities use `@Version` (a `Long version` field). This prevents two concurrent requests from overwriting each other's changes. The `GlobalExceptionHandler` catches `ObjectOptimisticLockingFailureException` and returns HTTP 409.

---

## Configuration Strategy

All environment-sensitive values are externalized:

```properties
# application.properties imports env.properties
spring.config.import=file:env.properties
```

`env.properties` (gitignored) contains:
- `DB_USER`, `DB_PASSWORD`
- `JWT_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET`
- `EMAIL_USER`, `EMAIL_PASSWORD`
- `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE`
- `FRONTEND_URL`

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Stateless JWT auth | SPA frontend, no session affinity needed |
| Service interface + impl split | Enables mock-based unit testing |
| `@Version` on Policy and Claim | Prevents concurrent update race conditions |
| `ApiResponseDTO<T>` wrapper | Consistent response structure for all endpoints |
| `MessageConstants` static class | Centralized string management, no magic strings |
| `JpaSpecificationExecutor` for pagination | Dynamic multi-filter queries without string concatenation |
| BCrypt password hashing | Prevents plaintext passwords in database |
| OTP via email + SMS (dual channel) | Regulatory compliance and stronger identity verification |
| Staff speciality scoping | Staff can only work within their product domain (HEALTH, LIFE, etc.) |

---

## Server Configuration

| Property | Value |
|---|---|
| Server Port | `8081` |
| Database | MySQL, `insurance_db` |
| JPA DDL | `update` (auto-creates/updates tables) |
| JWT Expiry | `6000000` ms = 100 minutes |
| OTP Expiry | 5 minutes |
| OTP Rate Limit | Max 4 per user per 24 hours |
| File Upload Limit | 10MB per file / 10MB total request |
| Multipart | Enabled |

---

## Related Documents

- [security/security-overview.md](../security/security-overview.md)
- [database/database-overview.md](../database/database-overview.md)
- [deployment/deployment-guide.md](../deployment/deployment-guide.md)

# High-Level Architecture
> The authoritative system overview of the Insurance Policy & Claim Management System, covering system context, containers, deployment topology, and the end-to-end request lifecycle.

---

## Purpose
This document provides a bird's-eye view of the entire system architecture. It is designed to help new engineers, technical reviewers, and evaluators understand how the system is put together, how data flows, and why certain architectural choices were made.

---

## Overview
- **Separation of Concerns**: A React single-page application (SPA) on the frontend communicating with a Spring Boot REST API on the backend.
- **Robust Persistence**: Relational data is stored in MySQL 8, while token caching and blacklisting are managed by Redis.
- **Secure by Design**: Utilizes stateless JWTs, HTTP-only refresh tokens, and dual OTP validation for high security.
- **Third-Party Integrations**: Cloudinary for document storage, Twilio for SMS, and Gmail SMTP for email notifications.

---

## Business Context
The InsuranceFlow system digitizes the core lifecycle of an insurance business. From the business perspective, this feature allows customers to browse plans, get quotes, buy policies, and submit claims. Internal staff can review claims, while administrators manage pricing and approve final claims. Strong identity verification and role-based access are critical because the system handles financial transactions and sensitive personal data.

---

## Feature Flow
```mermaid
flowchart TD
    A[Start: User Action] --> B{Is Authenticated?}
    B -- No --> C[Login / Register]
    B -- Yes --> D[Access Role Workspace]
    D --> E[Perform Action e.g., Buy Policy / Submit Claim]
    E --> F{Input Valid?}
    F -- No --> G[Show Validation Error]
    F -- Yes --> H[Backend Processing]
    H --> I[Update MySQL / Redis]
    I --> J[Return Response]
    J --> K[End: UI Updated]
```

---

## System Flow
```mermaid
flowchart TD
    UI[React SPA Browser] -->|Axios HTTP Request| F[Security Filters]
    F --> C[REST Controller]
    C --> S[Service Layer]
    S --> R[JPA Repository]
    R --> DB[(MySQL / Redis)]
    DB --> R
    R --> S
    S --> C
    C --> F
    F --> UI
```

---

## Sequence Diagram
```mermaid
sequenceDiagram
    participant UI as React SPA
    participant Axios as Axios Interceptor
    participant Filter as Security Filters
    participant API as REST Controller
    participant Service as Business Service
    participant DB as MySQL/Redis

    UI->>Axios: Initiate Request
    Axios->>Filter: Add JWT Bearer (HTTP)
    Filter->>API: Validate JWT & Route
    API->>Service: Map DTO & Call Business Logic
    Service->>DB: Execute Transaction
    DB-->>Service: Return Entity
    Service-->>API: Return Response DTO
    API-->>Axios: HTTP 200 OK
    Axios-->>UI: Return Data
```

---

## Architecture Diagram

### C4 Level 1 — System Context
```mermaid
flowchart LR
    CU["Customer<br/>(Browser)"] --> UI["Insurance Portal<br/>React SPA"]
    ST["Internal Staff<br/>(Claims Reviewer)"] --> UI
    AD["Administrator<br/>(Product Owner)"] --> UI

    UI -->|"HTTPS JSON API"| API["Spring Boot REST API<br/>:8081 /api"]

    API --> DB[("MySQL 8<br/>insurance_db :3306")]
    API --> REDIS[("Redis<br/>Token Cache")]
    API --> CL["Cloudinary<br/>Documents"]
    API --> SM["Gmail SMTP<br/>Emails"]
    API --> TW["Twilio<br/>SMS OTP"]
```

### C4 Level 2 — Containers
```mermaid
flowchart TB
    subgraph BROWSER["Web Browser"]
        SPA["React SPA<br/>Vite dev :5173"]
    end

    subgraph APP["Application Server"]
        FILTER["Security Filters"]
        CTRL["REST Controllers"]
        SVC["Service Layer"]
        REPO["Repositories"]
    end

    subgraph DATA["Data & External Systems"]
        MYSQL[("MySQL 8")]
        REDIS[("Redis")]
        CLOUD["Cloudinary"]
        TWILIO["Twilio"]
        SMTP["Gmail SMTP"]
    end

    SPA -->|"/api HTTP"| FILTER
    FILTER --> CTRL
    CTRL --> SVC
    SVC --> REPO
    REPO --> MYSQL
    SVC --> REDIS
    SVC --> CLOUD
    SVC --> TWILIO
    SVC --> SMTP
```

### C4 Level 3 — Components (Backend Layers)
```mermaid
flowchart TB
    subgraph SpringBootApp["Spring Boot Application"]
        Controllers["Controllers<br/>(Request Routing & Validation)"]
        Services["Service Interfaces & Impls<br/>(Business Logic & Transactions)"]
        Strategies["Premium Calculators<br/>(Strategy Pattern)"]
        Repositories["Spring Data JPA Repositories<br/>(Data Access)"]
        Security["Security Config & Filters<br/>(AuthN & AuthZ)"]
    end
    
    Controllers --> Services
    Services --> Strategies
    Services --> Repositories
    Security -.-> Controllers
```

### Deployment Topology
```mermaid
flowchart LR
    subgraph PROD["Production Environment"]
        STATIC["Frontend<br/>(CDN / Nginx)"]
        API2["Backend<br/>Spring Boot Fat JAR :8081"]
        DB2[("MySQL 8")]
        R2[("Redis")]
    end

    STATIC -->|"CORS Allowlisted"| API2
    API2 --> DB2
    API2 --> R2
```

---

## Request Lifecycle
1. **Initiation**: The user triggers an action in the React SPA.
2. **Interception**: The Axios interceptor attaches the JWT token from memory to the `Authorization: Bearer` header.
3. **Filtering**: The request hits the backend Spring Security filter chain (RateLimitFilter → CookieCsrfOriginFilter → JwtAuthenticationFilter).
4. **Validation**: The REST controller binds and validates the request body against the DTO.
5. **Business Logic**: The controller delegates to a `@Transactional` service where business rules are applied.
6. **Data Access**: The service interacts with MySQL via JPA repositories (and Redis for token checks).
7. **Response**: The entity is mapped to a Response DTO, wrapped in `ApiResponseDTO`, and returned to the client.

---

## Design Decisions
| Decision | Rationale | Trade-offs |
|---|---|---|
| **SPA + API Separation** | Decouples frontend and backend, allowing independent scaling, testing, and deployment. | Requires CORS configuration and careful token management. |
| **Stateless JWT** | Highly scalable, no need to query the database for every request's session state. | Harder to revoke instantly (mitigated by tokenVersion and Redis blacklisting). |
| **Spring Boot** | Enterprise-grade, mature ecosystem, excellent dependency injection, and JPA support. | Higher memory footprint compared to Go or Node.js. |
| **MySQL 8** | ACID compliance, strong relational integrity suitable for financial and policy data. | Schema rigidity compared to NoSQL databases. |
| **Redis** | In-memory key-value store provides sub-millisecond lookups for token blacklists and refresh tokens. | Adds infrastructure complexity. |

---

## Interview Notes
**Q1: Why did you separate the frontend and backend instead of using Thymeleaf/JSP?**
A: Separation allows independent scaling, parallel development, and modern UI capabilities with React. It also provides a clean REST API that can be consumed by mobile apps in the future.

**Q2: How does the system handle security without server-side sessions?**
A: We use stateless JWTs for access tokens (kept in memory) and DB/Redis-backed HTTP-only refresh tokens. We handle revocation by bumping a `tokenVersion` in the user's record and using Redis for blacklisting.

**Q3: What role does Redis play in your architecture?**
A: Redis is used for caching tokens—specifically storing refresh tokens and blacklisting JWTs for fast, scalable authentication checks without hitting MySQL on every request.

**Q4: How do you handle database transactions?**
A: We use Spring's `@Transactional` at the service layer. Write operations are in read-write transactions, while read operations use `@Transactional(readOnly = true)` to optimize performance.

**Q5: Describe the flow of a single HTTP request through your backend.**
A: The request passes through security filters (rate limiting, CSRF, JWT validation), hits a REST controller where DTOs are validated, delegates to a transactional service for business logic, uses a repository to query MySQL/Redis, and returns an `ApiResponseDTO`.

---

## Related Documents
- [Backend Architecture](Backend_Architecture.md)
- [Frontend Architecture](Frontend_Architecture.md)
- [Database Architecture](Database_Architecture.md)
- [Security Architecture](Security_Architecture.md)

---

## Future Enhancements
- Deploying the frontend via AWS CloudFront/S3 and the backend on AWS ECS.
- Introducing a distributed trace ID for cross-service logging.

# 🧠 Enterprise Knowledge Base — Concept Reference Cards

> **Purpose:** 40 concise, high-signal technical reference cards explaining every architectural pattern, security control, database optimization, and business workflow used in the Insurance Policy & Claim Management System.

---

## 🗂️ Knowledge Base Categorized Index

### 1. Security & Identity Subsystem
- [Authentication.md](./Authentication.md) — User authentication principles.
- [Authorization.md](./Authorization.md) — Method-level access control.
- [Access_Token.md](./Access_Token.md) — Short-lived 15-minute JJWT structure and claims.
- [Refresh_Token.md](./Refresh_Token.md) — Rotating 7-day HttpOnly cookie token lifecycle.
- [JWT.md](./JWT.md) — JSON Web Token signature verification and parsing.
- [Spring_Security.md](./Spring_Security.md) — Security Filter Chain and UserDetails service.
- [Role_Based_Access.md](./Role_Based_Access.md) — RBAC matrix (`ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`).
- [Redis_Token_Cache.md](./Redis_Token_Cache.md) — In-memory token blacklisting (`jti`) and 10s grace window.
- [Rate_Limiting.md](./Rate_Limiting.md) — Token bucket rate limiting (Bucket4j) against brute-force and DoS.
- [Dual_OTP_Verification.md](./Dual_OTP_Verification.md) — Multi-channel verification via Twilio SMS and Gmail SMTP.

### 2. Architecture & Design Patterns
- [Dependency_Injection.md](./Dependency_Injection.md) — Spring IoC container and `@Autowired`/Lombok injection.
- [Service_Layer.md](./Service_Layer.md) — Transaction boundaries and business logic isolation.
- [Repository_Pattern.md](./Repository_Pattern.md) — Spring Data JPA abstraction over SQL queries.
- [Strategy_Pattern.md](./Strategy_Pattern.md) — Dynamic actuarial premium calculation engine.
- [Factory_Pattern.md](./Factory_Pattern.md) — `PremiumCalculatorFactory` strategy bean resolution.
- [REST_API.md](./REST_API.md) — Resource-oriented HTTP endpoints and status codes.
- [DTO.md](./DTO.md) — Data Transfer Objects separating API payloads from JPA entities.
- [Mapper.md](./Mapper.md) — ModelMapper object graph transformations.
- [Exception_Handling.md](./Exception_Handling.md) — Global `@RestControllerAdvice` exception translation.
- [Validation.md](./Validation.md) — Jakarta Bean Validation constraints and field error formatting.

### 3. Business Domain & Actuarial Workflows
- [Coverage_Options.md](./Coverage_Options.md) — Selectable sum assured tiers.
- [Pricing_Rules.md](./Pricing_Rules.md) — Base risk rates, processing fees, and GST formulas.
- [Premium_Calculation.md](./Premium_Calculation.md) — Actuarial formula execution.
- [Quote.md](./Quote.md) — 30-minute transient quote snapshotting before purchase.
- [Policy.md](./Policy.md) — Contract lifecycle, rate snapshotting, and status transitions.
- [Payment.md](./Payment.md) — Premium payment ledger and automatic policy activation.
- [Claim.md](./Claim.md) — Claim lifecycle, remaining coverage math, and Maker-Checker review.
- [Document_Upload.md](./Document_Upload.md) — Evidence ingestion and validation.

### 4. Database & Persistence (MySQL 8.0)
- [Entity.md](./Entity.md) — JPA entity mappings and primary key generation.
- [Database_Indexing.md](./Database_Indexing.md) — B+ Tree indexing strategies on foreign keys and filter columns.
- [Cascade.md](./Cascade.md) — Cascade persistence rules and orphan removal.
- [Fetch_Types.md](./Fetch_Types.md) — `LAZY` vs `EAGER` loading and eliminating the N+1 problem.
- [Transactions.md](./Transactions.md) — ACID transaction management via `@Transactional`.
- [Pagination.md](./Pagination.md) — Server-side pagination and sorting (`Pageable`, `PageResponseDTO`).

### 5. Frontend & UI Architecture (React 18)
- [React_Hooks.md](./React_Hooks.md) — Standard and custom hook patterns.
- [Context_API.md](./Context_API.md) — Global authentication and user state management.
- [Protected_Routes.md](./Protected_Routes.md) — Role-based route guards in React Router 6.
- [PDF_Generation.md](./PDF_Generation.md) — Client-side PDF generation engine (`jspdf`, `html2canvas`).

### 6. Cloud Services & Observability
- [Cloudinary.md](./Cloudinary.md) — Cloud document storage and CDN media streaming.
- [ELK_Stack_and_Kibana.md](./ELK_Stack_and_Kibana.md) — Structured JSON logging, Logstash, Elasticsearch, and Kibana dashboard.

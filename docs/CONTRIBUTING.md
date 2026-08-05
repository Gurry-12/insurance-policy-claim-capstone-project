# Documentation Standards & Contributing Guide

> The absolute source of truth and rulebook for contributing to InsuranceFlow's documentation.

---

## Purpose
This document defines the strict formatting, structural, and factual rules that all documentation in this project must adhere to. It exists to ensure that every technical document remains enterprise-grade, interview-friendly, and completely accurate to the codebase.

---

## Overview
- **One source of truth per topic.** Never duplicate explanations; reference them.
- **Code-verified.** Every fact stated in this directory must match the code.
- **Template-driven.** Every document MUST follow the 20-section Enterprise Document Template.

---

## Document Template (ALWAYS follow this exactly)

When creating or modifying a document, you MUST use the following structure. Skip sections only if genuinely not applicable (e.g., an architectural concept doc may not have an API section), but maintain the template's order and spirit.

```markdown
# <[Title]>
> [One-line elevator pitch]

---

## Purpose
Why this module/feature exists. What business problem does it solve. Who reads this document.

---

## Overview
High-level explanation in plain English. No implementation details. 3-5 bullet points max.

---

## Business Context
The real-world business scenario. Why does this feature exist from the business perspective? Include a real example.

---

## Feature Flow
The user-facing flow. Show as a simple vertical flowchart (Mermaid flowchart TD). 
Every major feature MUST show: Start → Validation → Business Logic → Database → Response → Possible Failures.

---

## System Flow
How the backend processes the request internally.
Show as Mermaid flowchart TD: Frontend → Controller → Service → Repository → Database → Response.

---

## Sequence Diagram
A Mermaid sequenceDiagram showing the full interaction between components.

---

## Architecture Diagram (if applicable)
Component relationships as Mermaid diagram.

---

## Database Design
Explain entities, relationships, constraints, WHY relationships were chosen.
Use tables. Do NOT just paste ER diagrams — EXPLAIN them.

---

## API Documentation (if applicable)
For every endpoint: Purpose, Method, URL, Auth, Request body, Response body, Validation, Possible errors, Business logic, Frontend screen.

---

## Frontend Implementation (if applicable)
Pages, Components, Hooks, Services. Where each feature is implemented.

---

## Backend Implementation
Controller, Service, Repository, Entity, DTOs, Mapper, Important methods.

---

## Business Rules
Every rule with WHY it exists. Use a table.

---

## Validation Rules
Input, Business, Database, Security validations.

---

## Error Handling
Failures, exceptions, HTTP status codes, frontend behavior.

---

## Design Decisions
WHY this design? WHY not another approach? Trade-offs.
This is the MOST IMPORTANT section for interviews.

---

## Security (if applicable)
Authentication, Authorization, JWT, RBAC, how security applies to this feature.

---

## Code References
Table of important files with their paths (no code copied).

---

## Interview Notes
5-8 interview questions with concise answers specific to this document's topic.

---

## Related Documents
Cross-links to related docs. No duplicate explanations.

---

## Future Enhancements
Documented improvements only. No code. No placeholders.
```

---

## Writing Style Rules
1. Write for a developer with 1-2 years of experience.
2. Use simple English. Never use academic language.
3. Short paragraphs (3-4 lines max).
4. Prefer bullet points over long prose.
5. Prefer diagrams over paragraphs — put Mermaid diagram FIRST, then explain.
6. Every section answers: What? Why? How? Where? When? Example? Trade-offs?
7. Never say "JWT is a JSON Web Token" — say "In this project, JWT is issued after login and used to authenticate every API request".
8. Always relate concepts back to the specific codebase.
9. Use tables for comparisons, rules, and structured data.
10. Include worked examples for complex calculations/flows.
11. Make it interview-friendly throughout.

---

## Naming & Linking Conventions
- File names: `Upper_Case_With_Underscores.md`.
- Internal links are relative: `../02_Business_Domain/Business_Rules.md`.
- Code references always include the full path from the repo root: `insurance-policy-claim-management-system/src/main/...`.
- Ports, roles, and enum names must match the Fact Sheet exactly.

---

## Single Source of Truth Map

| Topic | Authoritative document |
|---|---|
| Tech stack & versions | `00_Project_Overview/Tech_Stack.md` |
| Project vision & features | `00_Project_Overview/Vision.md`, `Features.md` |
| High-level / system architecture | `01_System_Architecture/High_Level_Architecture.md` |
| Backend architecture | `01_System_Architecture/Backend_Architecture.md` |
| Frontend architecture | `01_System_Architecture/Frontend_Architecture.md` |
| Database architecture | `01_System_Architecture/Database_Architecture.md` |
| Security architecture | `01_System_Architecture/Security_Architecture.md` |
| Repo / package layout | `01_System_Architecture/Folder_Structure.md` |
| Business domain & rules | `02_Business_Domain/Insurance_Domain.md`, `Business_Rules.md` |
| Domain workflows | `02_Business_Domain/*.md` (Product/Policy/Claim/Payment/Pricing/…) |
| Premium calculation math | `02_Business_Domain/Premium_Calculation.md` |
| API endpoints & payloads | `03_API/*.md` |
| Database tables & relationships | `04_Database/*.md` |
| Frontend implementation | `05_Frontend/*.md` |
| Backend implementation | `06_Backend/*.md` |
| Design patterns used | `07_Design_Patterns/*.md` |
| End-to-end flows | `08_Workflows/*.md` |
| Diagrams | `09_Diagrams/` |
| Evaluation material | `10_Evaluation/*.md` |
| Setup / build / run / deploy | `11_Developer_Guide/*.md` |
| Concept quick-reference cards | `12_Knowledge_Base/*.md` |
| Demo seed data & test flows | `demo-data/` (repo root) |

---

## Fact Sheet (Code-Verified, DO NOT CONTRADICT)

**Stack**
- Backend: Java 17, Spring Boot **4.0.6**, Spring Data JPA/Hibernate, Spring Security, `jjwt 0.12.6`, ModelMapper 3.2.0, Bucket4j 8.10.1, Lombok, MySQL Connector, springdoc-openapi 3.0.2, Cloudinary HTTP SDK 1.39.0, Twilio 11.0.0.
- Frontend: React **19**, Vite **8**, React Router **7**, Bootstrap **5.3** + bootstrap-icons, Axios, react-hook-form, react-hot-toast, Framer Motion, jsPDF (+ autotable), date-fns, big.js, jwt-decode, nprogress.
- Database: MySQL 8, schema `insurance_db`, `spring.jpa.hibernate.ddl-auto=update`.
- Ports: backend **8081** (`/api` prefix), frontend dev server **5173**, MySQL **3306**.
- Swagger/OpenAPI: `/swagger-ui.html`, `/v3/api-docs` (when `app.security.swagger-enabled=true`).

**Security**
- BCrypt password hashing (`PasswordEncoder`).
- Stateless JWT access tokens: HS256 (`jjwt`), claims `roles`/`fullName`/`productSpeciality`/`tokenVersion`; expiry 15 min (60 s locally), 30 s clock skew, token version checked per request.
- Opaque refresh tokens in `refresh_tokens` table, delivered as HttpOnly `refresh_token` cookie, SHA-256 hashed in DB, rotated on every use, reuse → whole family revoked, 7-day TTL.
- Dual OTP (email + SMS), 6 digits, 5-min expiry, max attempts 5, resend cooldown 60 s, per-IP+email rate limits (Bucket4j).
- Roles: `ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`.
- Seeded admin: `admin@insurance.com` / `Admin@123`.

**Domain enums (stored as STRING)**
- `Role` {ROLE_ADMIN, ROLE_INTERNAL_STAFF, ROLE_CUSTOMER}
- `ProductType` {HEALTH, MOTOR, LIFE, TRAVEL, INSURANCE}
- `PremiumType` {ONE_TIME, ANNUAL}
- `PolicyStatus` {PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED}
- `ClaimStatus` {SUBMITTED, UNDER_REVIEW, RECOMMENDED_FOR_APPROVAL, RECOMMENDED_FOR_REJECTION, APPROVED, REJECTED}
- `PaymentMode` {UPI, CARD, NET_BANKING, CASH}
- `PaymentStatus` {PENDING, SUCCESS, FAILED}
- `QuoteStatus` {CREATED, USED, EXPIRED, CANCELLED}
- `PricingRuleStatus` {ACTIVE, INACTIVE}

**Entities (16 / 17 Tables)**
`AppUser`, `RefreshToken`, `Customer`, `StaffSpeciality`, `OtpVerification`, `InsuranceProduct`, `PolicyPlan`, `CoverageOption`, `PricingRule`, `PricingAuditLog`, `Quote`, `Policy`, `PremiumPayment`, `Claim`, `ClaimDocument`, `ClaimStatusHistory`.

**Backend Package Root**
`com.insurance.demo` (with subpackages: controller, service, repository, model, dto, config, security, etc.)

**Key Business Rules**
- Policy purchase requires active user + active product/plan; starts `PENDING_PAYMENT`, payment exactly equal to calculated premium activates it.
- HEALTH products: no duplicate ACTIVE or PENDING_PAYMENT policy per customer+plan. Non-HEALTH: no duplicate PENDING_PAYMENT per customer+plan.
- Claims only on ACTIVE policies; incident date within policy period; amount ≤ remaining cover; ≥1 document required (Cloudinary).
- Staff review claims matching their `productSpeciality`; admin makes final decision.
- Cancellation blocked while open claims exist.
- Quote: 30-minute validity, single-use.
- Premium Strategy Pattern: `PremiumCalculator` interface, `AnnualPremiumCalculator`, `OneTimePremiumCalculator`.

**Frontend**
- Routes in `src/App.jsx`; guards: `ProtectedRoute`, `RoleProtectedRoute`.
- Role namespaces: `/admin/*`, `/staff/*`, `/customer/*`.
- Auth state: Context + `tokenStore.js` (in-memory).
- Axios interceptors attach Bearer token and refresh on 401.

**External Services**
- Cloudinary (claims folder), Twilio (SMS), Gmail SMTP (Email).

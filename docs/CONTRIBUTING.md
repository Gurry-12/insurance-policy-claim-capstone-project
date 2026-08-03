# Documentation Standards

This file is the contract for every document in this `docs/` tree.

**Rules of the repository**
1. **One source of truth per topic.** Every topic has exactly one authoritative
   document. Everything else links to it. Do not re-explain a topic that already
   has a home — reference it.
2. **No duplication.** If two documents would explain the same thing, merge them
   into the authoritative document and link.
3. **Everything is code-verified.** Facts stated here are checked against the
   source (`.java`, `.jsx`, `pom.xml`, `package.json`, `application.properties`)
   and against `docs/CONTRIBUTING.md#fact-sheet`. If you find a mismatch, fix the
   stale doc, not the fact sheet.
4. **Follow the template.** Every document uses the sections in the
   [template](#document-template); shorter concept cards in `12_Knowledge_Base/`
   may trim to a fixed set of sections.
5. **Use stable file names and relative links.** Links between docs use relative
   paths from the current file (`../04_Database/Table_Descriptions.md`).

---

## Document Template

Every in-depth document uses this structure (skip a section with a `_N/A_` note
if it genuinely does not apply; keep the heading anyway for consistency).

```markdown
# <Title>

> <one-line elevator pitch of the doc>

## Purpose
Why this document exists and who reads it.

## Overview
High-level explanation of the topic.

## Business Context
Why this module/feature exists in the business domain.

## Technical Design
Architecture and implementation details.

## Workflow
Step-by-step execution (numbered list), referencing endpoints or functions.

## Code References
Table or list of the important classes/files with their paths.

## Diagrams
Where to find the relevant diagrams (docs/09_Diagrams/...) or an inline Mermaid block.

## Best Practices
Why the chosen implementation approach is good; what to keep doing.

## Future Improvements
Possible enhancements; link to docs/10_Evaluation/Future_Enhancements.md when relevant.
```

Knowledge-base concept cards (`12_Knowledge_Base/`) use this shorter card:

```markdown
# <Concept>

## What It Is
## Why It Is Used
## Where It Is Used in This Project
## Related Files
## Related Docs
## Common Interview Questions
```

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

## Fact Sheet (code-verified, do not contradict)

**Stack**
- Backend: Java 17, Spring Boot **4.0.6**, Spring Data JPA/Hibernate, Spring
  Security, `jjwt 0.12.6`, ModelMapper 3.2.0, Bucket4j 8.10.1, Lombok, MySQL
  Connector, springdoc-openapi 3.0.2, Cloudinary HTTP SDK 1.39.0, Twilio 11.0.0.
- Frontend: React **19**, Vite **8**, React Router **7**, Bootstrap **5.3** +
  bootstrap-icons, Axios, react-hook-form, react-hot-toast, Framer Motion,
  jsPDF (+ autotable), date-fns, big.js, jwt-decode, nprogress.
- Database: MySQL 8, schema `insurance_db`, `spring.jpa.hibernate.ddl-auto=update`.
- Ports: backend **8081** (`/api` prefix), frontend dev server **5173**, MySQL **3306**.
- Swagger/OpenAPI: `/swagger-ui.html`, `/v3/api-docs` (when `app.security.swagger-enabled=true`).

**Security**
- BCrypt password hashing (`PasswordEncoder`).
- Stateless JWT access tokens: HS256 (`jjwt`), claims `roles`/`fullName`/
  `productSpeciality`/`tokenVersion`; expiry 100 min, 30 s clock skew, token
  version checked per request.
- Opaque refresh tokens in `refresh_tokens` table, delivered as HttpOnly
  `refresh_token` cookie, rotated on every use, reuse → whole family revoked,
  7-day TTL, `POST /api/auth/refresh`, `POST /api/auth/logout`.
- Dual OTP (email + SMS), 6 digits, 5-min expiry, max attempts 5, resend
  cooldown 60 s, per-IP+email rate limits (Bucket4j).
- Roles: `ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`.
- Seeded admin: `admin@insurance.com` / `Admin@123` (created by `DataInitializer`,
  controllable via `app.security.seed-admin.enabled`).
- Access-token expiry is configured via `app.security.jwt.expiration-ms`
  (default `900000` ms = 15 min in `AppSecurityProperties`; the committed local
  `application.properties` sets `60000` ms = 60 s for faster dev iteration).

**Domain enums (stored as STRING)**
- `Role` {ROLE_ADMIN, ROLE_INTERNAL_STAFF, ROLE_CUSTOMER}
- `ProductType` {HEALTH, MOTOR, LIFE, TRAVEL, INSURANCE}
- `PremiumType` {ONE_TIME, ANNUAL}
- `PolicyStatus` {PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED}
- `ClaimStatus` {SUBMITTED, UNDER_REVIEW, RECOMMENDED_FOR_APPROVAL,
  RECOMMENDED_FOR_REJECTION, APPROVED, REJECTED}
- `PaymentMode` {UPI, CARD, NET_BANKING, CASH}
- `PaymentStatus` {PENDING, SUCCESS, FAILED}
- `QuoteStatus` {CREATED, USED, EXPIRED, CANCELLED}
- `PricingRuleStatus` {ACTIVE, INACTIVE}
- (`Gender`, `RoundingRule` are dead/unused enums — do not reference as features.)

**Entities (16)**
`AppUser`, `RefreshToken`, `Customer`, `StaffSpeciality`, `OtpVerification`,
`InsuranceProduct`, `PolicyPlan`, `CoverageOption`, `PricingRule`,
`PricingAuditLog`, `Quote`, `Policy`, `PremiumPayment`, `Claim`,
`ClaimDocument`, `ClaimStatusHistory`. Backend package
`com.insurance.demo` with subpackages `controller`, `service`, `serviceimpl`,
`repository`, `model`, `dto` (`request`/`response`), `config`, `security`,
`verification`, `enums`, `exception`, `util`, `service/strategy`.

**Key business rules (details in `02_Business_Domain/Business_Rules.md`)**
- Policy purchase requires active user + active product/plan; policy starts
  `PENDING_PAYMENT`, payment activates it.
- HEALTH products: no duplicate ACTIVE or PENDING_PAYMENT policy per customer+plan.
  Non-HEALTH: no duplicate PENDING_PAYMENT per customer+plan.
- Claims only on ACTIVE policies; incident date within policy period; amount ≤
  remaining cover; ≥1 document required (Cloudinary).
- Staff review claims matching their `productSpeciality`; admin makes final decision.
- Cancellation blocked while open claims exist.
- Premium: `base = coverage × baseRiskRate`; `taxable = base + processingFee`;
  `gst = 18% of taxable`; ANNUAL total = `taxable + gst`; ONE_TIME total =
  `annualPremium × duration × (1 − durationDiscount)` with duration discounts
  (e.g. 2yr 2%, 3yr 5%, 5yr 8%, 10yr 12%); rounding HALF_UP.

**Frontend**
- Routes defined centrally in `src/App.jsx`; guards: `ProtectedRoute`,
  `GuestRoute`, `RoleProtectedRoute`, `DashboardRedirect`.
- Role namespaces: `/admin/*`, `/staff/*`, `/customer/*`.
- Auth state: `src/context/AuthContext.jsx` + `src/api/tokenStore.js`
  (in-memory token; `sessionStorage` flags `ss_user`/`ss_has_session`).
- Axios: `src/api/axiosInstance.js` — Bearer header, single-flight refresh on
  401 with one retry, event dispatch (`auth:token-refreshed`,
  `auth:unauthorized`, `auth:forbidden`, `api:error`).
- Role theming (implemented in `src/index.css`): admin blue `#2563eb`,
  staff violet `#7c3aed`, customer teal `#0d9488`, light + dark themes.
- Services in `src/services/*.js` (one per resource). Hooks in `src/hooks/`
  (incl. `useApiTable`, `useApiForm`, `useClientPagination`, PDF export hooks).

**External services**
- Cloudinary (claim document upload), Twilio (SMS OTP), Gmail SMTP (email OTP,
  password reset links). Config via `env.properties` at backend root
  (gitignored) and `.env*` in the UI (gitignored; `.env.example` committed).

---

## Naming & Linking Conventions

- File names: `Upper_Case.md`, one topic per file.
- Internal links are relative: `../02_Business_Domain/Business_Rules.md`.
- Code references always include the full path from the repo root:
  `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculator.java`.
- Never link to `imp-doc/` (deprecated) — it is being removed.
- Ports, roles, and enum names must match the Fact Sheet exactly.

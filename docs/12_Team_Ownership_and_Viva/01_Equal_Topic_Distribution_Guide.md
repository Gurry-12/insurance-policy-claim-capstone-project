# 🎓 Equal Topic Distribution & Viva Preparation Guide

> **Project Title:** Insurance Policy & Claim Management System  
> **Team Members:** Gurpreet Singh · Chandrashehar Megharaj Kavishetti · Shivaji Gunde  
> **Workload Distribution:** Exactly Balanced — Gurpreet: 6 Topics · Chandrashehar: 7 Topics · Shivaji: 7 Topics  
> **Golden Principle:** **Everyone must know the complete end-to-end project.** Primary assignment establishes who leads the topic during evaluation, while the Backup continues if asked.

---

## 🧭 Master Rule for the Evaluation

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PRIMARY EXPLAINER ≠ EXCLUSIVE KNOWLEDGE                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Every team member is accountable for understanding the COMPLETE project architecture.│
│ • If an examiner asks Shivaji about JWT or Chandrashehar about Claims, they must know. │
│ • Primary assignment establishes who leads the topic during structured presentation.   │
│ • Backup explainer steps in seamlessly if the examiner redirects the question.        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Master Topic Distribution Table (20 Topics)

| # | Evaluation Topic | Primary Explainer | Backup Explainer | All Members Prepared | Actual Implementation / Classes Used |
|:---:|:---|:---:|:---:|:---:|:---|
| **1** | **Project Overview & Business Value** | **Gurpreet** | Chandrashehar | **Yes** | Full-stack platform, problem statement, core user roles |
| **2** | **4-Tier Layered Architecture** | **Gurpreet** | Shivaji | **Yes** | React SPA $\rightarrow$ Servlet Security $\rightarrow$ `@Service` $\rightarrow$ JPA Repository |
| **3** | **Authentication & Dual-OTP** | **Gurpreet** | Chandrashehar | **Yes** | `AuthController`, `AuthServiceImpl`, `OtpService`, Twilio SMS + SMTP Email |
| **4** | **Token Lifecycle & Redis Cache** | **Gurpreet** | Shivaji | **Yes** | `JwtService`, `RefreshTokenService`, `RedisTokenCacheService`, `tokenVersion` |
| **5** | **Actuarial Pricing (Strategy Pattern)** | **Gurpreet** | Chandrashehar | **Yes** | `PremiumCalculator` interface, `Annual`/`OneTime` calculators, `Quote` (30m TTL) |
| **6** | **Admin Center UI & User Management** | **Gurpreet** | Shivaji | **Yes** | `UserController`, `StaffSpeciality`, `AdminLayout.jsx`, Dynamic Landing Page |
| **7** | **Customer KYC Profile & Validation** | **Chandrashehar** | Gurpreet | **Yes** | `CustomerController`, `CustomerServiceImpl`, `isCustomerProfileComplete()` |
| **8** | **Policy Plans & Creation Wizard** | **Chandrashehar** | Gurpreet | **Yes** | `PolicyPlanController`, `CoverageOptionController`, atomic plan wizard |
| **9** | **Policy Purchase & Contracts** | **Chandrashehar** | Gurpreet | **Yes** | `PolicyController`, `PolicyServiceImpl`, rate snapshotting, duplicate health check |
| **10** | **Customer Portal Frontend (All 14 UI)** | **Chandrashehar** | Shivaji | **Yes** | `CustomerLayout.jsx`, `PurchasePolicyPage.jsx`, `CustomerProfilePage.jsx` |
| **11** | **Database Schema & B-Tree Indexing** | **Chandrashehar** | Gurpreet | **Yes** | MySQL 8.0 schema, `@Index(name = "idx_policy_status")`, `FetchType.LAZY` |
| **12** | **React Architecture & Global State** | **Chandrashehar** | Gurpreet | **Yes** | `AuthContext.jsx`, `axiosInstance.js`, `ProtectedRoute.jsx`, Route Guards |
| **13** | **Global Exception Handling & DTOs** | **Chandrashehar** | Gurpreet | **Yes** | `@RestControllerAdvice`, `GlobalExceptionHandler`, Request/Response DTOs |
| **14** | **Insurance Product Catalog** | **Shivaji** | Chandrashehar | **Yes** | `InsuranceProductController`, `InsuranceProductServiceImpl`, soft deactivation |
| **15** | **Premium Payments & Ledger** | **Shivaji** | Chandrashehar | **Yes** | `PremiumPaymentController`, `PremiumPaymentServiceImpl`, 15-day renewal window |
| **16** | **Claim Submission & Headroom Math** | **Shivaji** | Chandrashehar | **Yes** | `ClaimController`, remaining coverage math, incident date boundary checks |
| **17** | **2-Tier Claim Adjudication (Maker-Checker)** | **Shivaji** | Gurpreet | **Yes** | Maker-Checker workflow (`SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `RECOMMENDED_*` $\rightarrow$ `APPROVED`), `@Version` |
| **18** | **Cloudinary Document Upload CDN** | **Shivaji** | Chandrashehar | **Yes** | `CloudinaryServiceImpl`, `ClaimDocumentServiceImpl`, multipart streaming |
| **19** | **Client-Side PDF Generation Engine** | **Shivaji** | Chandrashehar | **Yes** | `usePolicyPdf.js`, `useClaimPdf.js`, `useCustomerPdf.js`, `jspdf`, `formatINR` |
| **20** | **Observability & ELK Logging** | **Shivaji** | Gurpreet | **Yes** | `logback-spring.xml` (JSON), `SecurityAuditLogger`, Filebeat + Logstash |

---

## 🏛️ Part 1: Detailed Topic Breakdown

---

### Topic 1: Project Overview & Business Value

**What it means:**  
The business motivation behind building a unified digital insurance platform that replaces legacy paper-based workflows with automated quoting, policy issuance, and fraud-resistant claims.

**What we used:**  
End-to-end full-stack platform: Spring Boot 3 REST API + React 18 SPA + MySQL 8.0 + Redis + Cloudinary + Docker.

**Why we used it:**  
Provides a seamless customer onboarding journey, eliminates manual premium calculations via an actuarial engine, and enforces regulatory separation of duties (maker-checker) on financial claim settlements.

- **Primary Explainer:** Gurpreet
- **Backup Explainer:** Chandrashehar
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. What core business problem does this project solve compared to traditional insurance portals?
2. What are the key actors in this system and what are their high-level responsibilities?
3. How does this system prevent internal employee fraud during claim payouts?

---

### Topic 2: 4-Tier Layered System Architecture

**What it means:**  
How client requests flow cleanly across Presentation, Security, Business Logic, and Data Persistence layers with zero tight coupling.

**What we used:**  
- Presentation: React 18 Single Page Application (`Axios`, `React Router 6`).
- Security Perimeter: Servlet Filter Chain (`RateLimitFilter`, `CookieCsrfOriginFilter`, `JwtAuthenticationFilter`).
- Service Layer: Spring `@Service` classes with declarative `@Transactional` boundaries.
- Persistence Layer: Spring Data JPA Repositories (`AppUserRepository`, `PolicyRepository`, etc.) backed by MySQL 8.0.

**Why we used it:**  
Adheres to the Single Responsibility Principle and Separation of Concerns. Allows changing data persistence or external services without touching business logic or UI.

- **Primary Explainer:** Gurpreet
- **Backup Explainer:** Shivaji
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. Explain the lifecycle of an HTTP request from React button click to database row update.
2. Why is `@Transactional` placed on the Service layer instead of the Controller or Repository?
3. What is the role of DTOs between the Controller and Service layers?

---

### Topic 3: Authentication, Dual-OTP Verification & Security Filter Chain

**What it means:**  
How identity is verified during registration using multi-channel OTP, and how requests pass through pre-servlet security gates before reaching controllers.

**What we used:**  
- `AuthController.java`, `AuthServiceImpl.java`, `OtpService.java`.
- `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `CustomUserDetailsService.java`, `AppUserDetails.java`.
- Twilio SMS API + Gmail SMTP Email for concurrent 6-digit OTP delivery.
- BCrypt password hashing (`PasswordEncoder`).

**Why we used it:**  
Insurance platforms handle sensitive KYC data. Requiring verified email and phone numbers prevents fake accounts, while BCrypt protects against rainbow table attacks.

- **Primary Explainer:** Gurpreet
- **Backup Explainer:** Chandrashehar
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. Why do we send OTPs to both email and phone during customer registration?
2. How does `JwtAuthenticationFilter` extract, validate, and populate the `SecurityContextHolder`?
3. Why is password hashing done using BCrypt with salt rather than SHA-256 or MD5?

---

### Topic 4: Token Lifecycle, Token Versioning & Redis Cache

**What it means:**  
Stateless session management using short-lived Access JWTs, long-lived HttpOnly Refresh Tokens, and instant multi-device revocation using database token versioning and Redis blacklisting.

**What we used:**  
- `JwtService.java` (generating claims, expiration, `jti`, and `tokenVersion`).
- `RefreshTokenService.java`, `RefreshToken.java` (SHA-256 hashed refresh token in DB).
- `RedisTokenCacheService.java` (blacklisting revoked `jti` and managing the 10-second silent refresh grace window).
- `RefreshTokenCookieManager.java` (setting `SameSite=Strict`, `HttpOnly`, `Secure` cookies).

**Why we used it:**  
Short-lived (15-min) JWTs minimize attack exposure if a token is intercepted. HttpOnly cookies protect long-lived refresh tokens against XSS. Token Versioning allows immediate invalidation of all active user sessions upon password reset.

- **Primary Explainer:** Gurpreet
- **Backup Explainer:** Shivaji
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. What is the difference between an Access Token and a Refresh Token? Why not use a 7-day Access Token?
2. Since JWTs are stateless, how does our system revoke a token immediately on logout?
3. What is `tokenVersion` and how does it prevent token reuse after password reset?

---

### Topic 5: Actuarial Pricing Engine & Strategy Design Pattern

**What it means:**  
How mathematical premium formulas are decoupled and executed dynamically based on policy tenure and premium payment type (`ANNUAL` vs `ONE_TIME`).

**What we used:**  
- Strategy Interface: `PremiumCalculator.java` with method `calculatePremium()`.
- Concrete Strategies: `AnnualPremiumCalculator.java`, `OneTimePremiumCalculator.java`.
- Strategy Factory: `PremiumCalculatorFactory.java` (resolves bean by `PremiumType` enum).
- `PricingRule.java` (base risk rate, processing fee, GST rate, effective dates).
- `PremiumCalculationController.java`, `PremiumCalculationServiceImpl.java`, `Quote.java`.

**Why we used it:**  
Applies the Open-Closed Principle (OCP). New premium calculation strategies (e.g., Monthly, Quarterly, Senior Citizen) can be added by creating a new class without modifying existing calculation code.

- **Primary Explainer:** Gurpreet
- **Backup Explainer:** Chandrashehar
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. Explain how the Strategy Pattern and Factory Pattern work together in our pricing engine.
2. What mathematical formula is used in `AnnualPremiumCalculator` vs `OneTimePremiumCalculator`?
3. Why do we store a 30-minute transient `Quote` entity before allowing policy purchase?

---

### Topic 6: Admin Center UI, User Administration & Docker Environment

**What it means:**  
How administrators manage internal staff provisioning, domain specialities, account activations, and how Docker containerizes the application, database, and Redis.

**What we used:**  
- `UserController.java`, `UserServiceImpl.java`, `StaffSpeciality.java`, `Role.java` (`ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`).
- Frontend: `AdminLayout.jsx`, `AdminDashboard.jsx`, `UserListPage.jsx`, Landing Page live stats.
- Docker Compose: Multi-container orchestration (Backend App, MySQL 8, Redis, ELK).

**Why we used it:**  
Guarantees domain isolation (health specialist only reviews health claims). Docker guarantees that any evaluator or developer can launch the entire stack with a single command (`docker-compose up`).

- **Primary Explainer:** Gurpreet
- **Backup Explainer:** Shivaji
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. How does Spring Security evaluate `@PreAuthorize("hasRole('ADMIN')")`?
2. What happens to a user's active session when an Admin deactivates their account?
3. How are Docker containers networked so the Spring Boot backend can reach MySQL and Redis?

---

### Topic 7: Customer Profile & KYC Management

**What it means:**  
How customer identity, date of birth, address, and nominee details are gathered, verified, and secured against unauthorized modifications.

**What we used:**  
- `CustomerController.java`, `CustomerServiceImpl.java`, `Customer.java`, `CustomerRepository.java`.
- DTOs: `CustomerRequestDTO.java`, `CustomerResponseDTO.java`.
- Helper check: `isCustomerProfileComplete()` verifying DOB, address, and nominee before contract purchase.
- Frontend: `CustomerProfilePage.jsx`, `EditProfilePage.jsx`.

**Why we used it:**  
Insurance regulations require full KYC and legal nominee information before issuing a financial contract. Automatic creation of an empty customer record at registration ensures zero orphaned profile references.

- **Primary Explainer:** Chandrashehar
- **Backup Explainer:** Gurpreet
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. How do we ensure Customer A cannot view or edit Customer B's KYC profile?
2. When is the `Customer` database row created — during registration or during profile completion?
3. What validation rules are applied to the Customer date of birth and nominee fields?

---

### Topic 8: Policy Plans, Coverage Tiers & Creation Wizard

**What it means:**  
Configuring insurance policy plans with allowed tenure durations, coverage tiers (sum assured), and terms & conditions.

**What we used:**  
- `PolicyPlanController.java`, `PolicyPlanServiceImpl.java`, `PolicyPlan.java`, `PolicyPlanRepository.java`.
- `CoverageOptionController.java`, `CoverageOptionServiceImpl.java`, `CoverageOption.java`.
- Multi-duration mapping: `@ElementCollection` join table `policy_plan_durations`.
- Atomic multi-step plan wizard: `PlanWizardRequestDTO.java` creating Plan + Coverage Tiers + Pricing Rule in one transaction.

**Why we used it:**  
Allows administrators to launch new market offerings dynamically with multiple coverage levels (e.g., ₹3 Lakh, ₹5 Lakh, ₹10 Lakh) and durations (1, 2, 3, 5 years) without writing code.

- **Primary Explainer:** Chandrashehar
- **Backup Explainer:** Gurpreet
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. How does the Plan Creation Wizard guarantee atomicity when inserting into three tables?
2. How is the list of allowed durations stored in the database for a `PolicyPlan`?
3. Why are coverage options tied to a specific policy plan rather than being global?

---

### Topic 9: Policy Purchase, Rate Snapshotting & Contract Lifecycle

**What it means:**  
Converting a transient quote into a binding legal policy contract in `PENDING_PAYMENT` status, locking agreed rates against future price rule changes.

**What we used:**  
- `PolicyController.java`, `PolicyServiceImpl.java`, `Policy.java`, `PolicyRepository.java`.
- DTOs: `PolicyPurchaseRequestDTO.java`, `PolicyResponseDTO.java`.
- Rate snapshotting: `premiumRateUsed`, `processingFeeUsed`, `gstUsed`, `calculatedPremium` copied directly from the `Quote` to the `Policy` entity.
- Unique policy number generation: `PolicyNumberGenerator.java` (`POL-YYYYMMDD-XXXX`).
- Anti-duplicate rule: Prevents customer from buying a duplicate active Health policy on the same plan.

**Why we used it:**  
Guarantees contract immutability. If an administrator modifies pricing rules tomorrow, existing customer policies maintain their original agreed rates.

- **Primary Explainer:** Chandrashehar
- **Backup Explainer:** Gurpreet
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. Why does a policy start in `PENDING_PAYMENT` status rather than `ACTIVE` upon purchase?
2. What is 'rate snapshotting' and why is it legally essential in insurance software?
3. Explain the business rule that prevents duplicate active health policies for the same customer.

---

### Topic 10: Customer Portal Frontend (All 14 User Interfaces)

**What it means:**  
The complete client-side journey for customers: onboarding, browsing products, comparing plans, purchasing policies, managing profile, and filing claims.

**What we used:**  
- `CustomerLayout.jsx`, `CustomerDashboard.jsx`, `CustomerProfilePage.jsx`, `EditProfilePage.jsx`.
- `CustomerProductListPage.jsx`, `CustomerPlanListPage.jsx`, `PurchasePolicyPage.jsx`, `CustomerPolicyListPage.jsx`.
- `CustomerPaymentHistoryPage.jsx`, `RecordPaymentPage.jsx`, `RaiseClaimPage.jsx`, `UploadDocumentsPage.jsx`, `CustomerClaimListPage.jsx`, `ClaimDetailsPage.jsx`.

**Why we used it:**  
Delivers an intuitive, self-service portal where customers can complete every insurance transaction without needing agent assistance.

- **Primary Explainer:** Chandrashehar
- **Backup Explainer:** Shivaji
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. Walk us through the customer UI workflow from selecting a plan to viewing the active policy.
2. How does the customer UI show real-time quote calculation countdown (30-minute timer)?
3. How are form inputs validated in React before submitting API calls?

---

### Topic 11: Database Schema, JPA Mappings & B-Tree Indexing Optimization

**What it means:**  
The relational entity model, foreign key constraints, cascade rules, fetch types (`LAZY` vs `EAGER`), and performance index optimizations.

**What we used:**  
- Relational schema: `users`, `customers`, `staff_specialities`, `insurance_products`, `policy_plans`, `coverage_options`, `pricing_rules`, `quotes`, `policies`, `premium_payments`, `claims`, `claim_documents`, `claim_status_histories`, `refresh_tokens`.
- Strategic B-Tree indexes: `@Index(name = "idx_policy_status", columnList = "policy_status")`, `idx_claim_status`, `idx_customer_user_id`.
- Fetch optimization: `FetchType.LAZY` on `@ManyToOne` relationships to eliminate N+1 query problems.

**Why we used it:**  
Indexes accelerate high-frequency filter queries (`WHERE policy_status = 'ACTIVE'`) from $O(N)$ full-table scans to $O(\log N)$ B-Tree lookups.

- **Primary Explainer:** Chandrashehar
- **Backup Explainer:** Gurpreet
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. What is the difference between `FetchType.LAZY` and `FetchType.EAGER`? Which one did we use and why?
2. Why did we place an index on `policy_status` and `customer_id` columns in the `policies` table?
3. How does JPA enforce foreign key cascading when a policy plan or claim is saved?

---

### Topic 12: React Frontend Architecture, Routing & Global State

**What it means:**  
How the frontend is organized using React 18, React Router 6, role-based layout nesting, Context API, and Axios request/response interceptors.

**What we used:**  
- `AuthContext.jsx` (stores user identity, role, and in-memory access token).
- `axiosInstance.js` (attaches Bearer token to headers, intercepts 401s for silent refresh).
- `ProtectedRoute.jsx` (route guards redirecting unauthorized roles to `/login` or `/unauthorized`).
- Role Layouts: `AdminLayout.jsx`, `CustomerLayout.jsx`, `AgentLayout.jsx`.

**Why we used it:**  
Guarantees clean state synchronization across components and ensures customers cannot access admin or staff URL routes.

- **Primary Explainer:** Chandrashehar
- **Backup Explainer:** Gurpreet
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. How does `ProtectedRoute.jsx` verify whether a user has permission to visit a route?
2. Where is the JWT stored in the React application, and why isn't it stored in `localStorage`?
3. How does the Axios response interceptor handle a 401 error and trigger silent token refresh?

---

### Topic 13: Global Exception Handling & DTO Validation Architecture

**What it means:**  
How backend validation errors and runtime exceptions are trapped globally and returned as structured, predictable JSON error responses.

**What we used:**  
- `@RestControllerAdvice`: `GlobalExceptionHandler.java`.
- Standardized Response DTOs: `ErrorResponseDTO.java`, `ValidationErrorResponseDTO.java`, `ApiResponseDTO.java`.
- Custom Exceptions: `ResourceNotFoundException`, `DuplicateResourceException`, `BadRequestException`, `InvalidStateException`.
- Jakarta Bean Validation: `@NotBlank`, `@Positive`, `@Email`, `@Size`, `@NotNull`.

**Why we used it:**  
Prevents leaking internal stack traces or database schema details to clients, while providing clear field-level validation feedback to frontend forms.

- **Primary Explainer:** Chandrashehar
- **Backup Explainer:** Gurpreet
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. What is the purpose of `@RestControllerAdvice` in Spring Boot?
2. How does the application format field-level validation errors when a user submits an invalid form?
3. What HTTP status code is returned for duplicate resource registration vs resource not found?

---

### Topic 14: Insurance Product Catalog Management

**What it means:**  
Managing top-level insurance product categories (Health, Motor, Life, Travel) and their lifecycle states.

**What we used:**  
- `InsuranceProductController.java`, `InsuranceProductServiceImpl.java`, `InsuranceProduct.java`, `InsurenceProductRepository.java`.
- DTOs: `ProductRequestDTO.java`, `ProductResponseDTO.java`.
- Unique constraint on `product_name` and soft deactivation via `is_active` boolean flag.
- Frontend: `AdminProductListPage.jsx`, `CustomerProductListPage.jsx`.

**Why we used it:**  
Products act as parent categories under which specific policy plans are grouped. Soft deactivation ensures historical policies linked to retired products remain valid for claims.

- **Primary Explainer:** Shivaji
- **Backup Explainer:** Chandrashehar
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. Why do we soft-deactivate products (`isActive=false`) instead of using hard SQL `DELETE`?
2. What happens if an admin attempts to deactivate a product that has active policy plans?
3. Which API endpoint allows customers to view only active products?

---

### Topic 15: Premium Payment Ledger & Policy Activation

**What it means:**  
Recording financial installments, validating exact amount matches, and automatically transitioning policies from `PENDING_PAYMENT` to `ACTIVE`.

**What we used:**  
- `PremiumPaymentController.java`, `PremiumPaymentServiceImpl.java`, `PremiumPayment.java`, `PremiumPaymentRepository.java`.
- Enums: `PaymentMode.java` (`UPI`, `CARD`, `NET_BANKING`, `CASH`), `PaymentStatus.java` (`SUCCESS`, `PENDING`, `FAILED`).
- Unique transaction reference constraint (`transaction_reference`).
- 15-day renewal window logic for annual recurring installments.

**Why we used it:**  
Strict exact-match validation ensures no policy is activated with underpayment. The unique transaction reference prevents double-charging or duplicate submissions.

- **Primary Explainer:** Shivaji
- **Backup Explainer:** Chandrashehar
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. How does the system ensure the payment amount matches the policy's calculated premium?
2. What state changes occur on the `Policy` entity when the first premium payment succeeds?
3. How does the 15-day early payment window work for `ANNUAL` recurring policies?

---

### Topic 16: Claim Submission & Remaining Coverage Math

**What it means:**  
How customers file claims against active policies with supporting evidence, while the backend verifies that the requested amount does not exceed the remaining sum assured.

**What we used:**  
- `ClaimController.java`, `ClaimServiceImpl.java`, `Claim.java`, `ClaimRepository.java`.
- DTOs: `ClaimRequestDTO.java`, `ClaimResponseDTO.java`.
- Remaining Coverage Formula: `remainingCoverage = policy.selectedCoverage - SUM(claims NOT in REJECTED status)`.
- Incident date bounds check: `startDate <= incidentDate <= endDate`.

**Why we used it:**  
Protects the insurer from paying out more than the policy's sum assured, and ensures the incident occurred while coverage was strictly in force.

- **Primary Explainer:** Shivaji
- **Backup Explainer:** Chandrashehar
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. How is the remaining coverage (headroom) calculated when a customer submits a new claim?
2. What happens if a customer files a claim for an incident that occurred before policy start date?
3. What initial status is assigned to a newly created claim?

---

### Topic 17: 2-Tier Claim Adjudication & Maker-Checker Workflow

**What it means:**  
The multi-step state machine where Internal Staff investigate and recommend a decision, and Administrators make the final binding approval or rejection.

**What we used:**  
- `ClaimStatus.java` enum (`SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `RECOMMENDED_FOR_APPROVAL` / `RECOMMENDED_FOR_REJECTION` $\rightarrow$ `APPROVED` / `REJECTED`).
- `ClaimStatusHistory.java`, `ClaimStatusHistoryRepository.java` (immutable append-only audit trail).
- Explicit state transition endpoints: `PATCH /api/claims/{id}/under-review`, `/assign`, `/review`, `/final-decision`.
- Optimistic locking: `@Version` column on `Claim` entity preventing race conditions.

**Why we used it:**  
Implements Segregation of Duties (Maker-Checker). No single employee can investigate a claim and authorize a financial payout, preventing internal collusion and fraud.

- **Primary Explainer:** Shivaji
- **Backup Explainer:** Gurpreet
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. Explain the Maker-Checker concept in claim processing. Who is the Maker and who is the Checker?
2. Can an Admin directly approve a claim in `SUBMITTED` status? Why or why not?
3. How does `@Version` prevent two staff members from claiming the same file simultaneously?

---

### Topic 18: Cloud Storage, Document Upload & Cloudinary CDN

**What it means:**  
How multipart image and PDF evidence files are uploaded directly to Cloudinary cloud storage, storing only secure URLs and public IDs in the relational database.

**What we used:**  
- `CloudinaryConfig.java`, `CloudinaryServiceImpl.java`, `ClaimDocumentServiceImpl.java`.
- `ClaimDocumentController.java`, `ClaimDocument.java`, `ClaimDocumentRepository.java`.
- Multipart file streaming: `MultipartFile` received in Spring Boot controller and passed to Cloudinary SDK.

**Why we used it:**  
Storing binary BLOBs inside MySQL causes database bloat and degrades query performance. Cloudinary offloads bandwidth and delivers assets securely via global CDN.

- **Primary Explainer:** Shivaji
- **Backup Explainer:** Chandrashehar
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. Why is storing file URLs in MySQL better than storing raw image/PDF binary data in BLOB columns?
2. How does the backend validate uploaded file extensions and size limits before streaming?
3. How are documents linked to their respective `Claim` parent entity in JPA?

---

### Topic 19: Client-Side PDF Generation & Official Certificate Engine

**What it means:**  
Generating pixel-perfect, downloadable PDF insurance certificates, policy schedules, and claim settlement receipts directly in the customer's browser.

**What we used:**  
- Frontend Custom Hooks: `usePolicyPdf.js`, `useClaimPdf.js`, `useCustomerPdf.js`.
- Libraries: `jspdf` and `html2canvas`.
- Formatted currency renderer: `formatINR()` utility displaying Indian Rupee standard format (`₹5,00,000.00`).

**Why we used it:**  
Client-side generation offloads heavy document rendering from the backend server. Customers get instant, high-resolution official certificates with zero server latency.

- **Primary Explainer:** Shivaji
- **Backup Explainer:** Chandrashehar
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. How does `jspdf` generate PDF documents on the client side?
2. What information is rendered on the official Policy Schedule certificate PDF?
3. Why did we choose client-side PDF generation over server-side libraries like iText or JasperReports?

---

### Topic 20: Observability, Logging Pipeline & ELK Stack

**What it means:**  
How application logs are formatted as structured JSON and streamed to Elasticsearch, Logstash, and Kibana for centralized debugging and security auditing.

**What we used:**  
- `logback-spring.xml` (Logstash Logback Encoder producing structured JSON log events).
- `SecurityAuditLogger.java` (recording critical security events: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `PASSWORD_RESET`).
- Filebeat + Logstash + Elasticsearch dockerized pipeline.

**Why we used it:**  
Provides enterprise-grade traceability. In production, engineers cannot SSH into servers to grep plain-text logs; ELK enables real-time search across all security and transaction events.

- **Primary Explainer:** Shivaji
- **Backup Explainer:** Gurpreet
- **All Members Must Know:** Yes

**Important Questions Evaluators May Ask:**
1. What is the difference between structured JSON logging and traditional plain-text console logging?
2. What critical security events are tracked by `SecurityAuditLogger`?
3. How do Filebeat and Logstash work together to ingest logs into Elasticsearch?

---

## 🎯 Part 2: Individual Viva Preparation Checklists

---

### Gurpreet Singh — 6 Primary Topics

```
[ ] 1. Project Overview & Business Value
[ ] 2. 4-Tier Layered Architecture & Request Lifecycle
[ ] 3. Spring Security, Dual-OTP (SMS/Email) & Filter Chain
[ ] 4. Token Lifecycle, Token Versioning & Redis Cache
[ ] 5. Actuarial Pricing Strategy Engine (Strategy & Factory Pattern)
[ ] 6. Admin Center UI, User Administration & Docker Setup
```
*Plus: Common knowledge of full end-to-end flow, database relationships, and claims.*

---

### Chandrashehar Kavishetti — 7 Primary Topics

```
[ ] 1. Customer KYC Profile & Completeness Validation
[ ] 2. Policy Plans, Durations & Creation Wizard
[ ] 3. Policy Purchase, Rate Snapshotting & Contract Lifecycle
[ ] 4. Customer Portal Frontend (All 14 Components & User Flows)
[ ] 5. Database Schema Design, JPA Mappings & B-Tree Indexing
[ ] 6. React Architecture, Routing, Protected Routes & Axios Interceptors
[ ] 7. Global Exception Handling (@RestControllerAdvice) & DTO Layer
```
*Plus: Common knowledge of full end-to-end flow, security filter chain, and claims.*

---

### Shivaji Gunde — 7 Primary Topics

```
[ ] 1. Insurance Product Catalog Management (CRUD & Soft Deactivation)
[ ] 2. Premium Payment Ledger & Automatic Policy Activation
[ ] 3. Claim Submission, Incident Bounds & Headroom Mathematics
[ ] 4. 2-Tier Claim Adjudication (Maker-Checker State Machine & @Version)
[ ] 5. Cloudinary Document Upload & CDN Streaming
[ ] 6. Client-Side PDF Generation Engine (use*Pdf custom hooks)
[ ] 7. Observability, Security Audit Logging & ELK Stack
```
*Plus: Common knowledge of full end-to-end flow, security filter chain, and policy contracts.*

---

## ⏱️ Part 3: 20-Minute Balanced Viva Presentation Flow

```
[00:00 - 05:00] GURPREET SINGH (Platform & Security)
  • Project Overview & Business Problem Statement.
  • 4-Tier Layered Architecture & Docker environment.
  • Spring Security Filter Chain, Dual-OTP, JWT & Redis token cache.
  • Actuarial Pricing Engine (Strategy Pattern).
  • Live Demo: Admin Center (Plan Wizard & Dynamic Pricing Simulator).

[05:00 - 10:00] CHANDRASHEKHAR KAVISHETTI (Customer & Policy Domain)
  • Customer KYC profile completeness validation rules.
  • Policy contract binding, rate snapshotting, and duplicate health policy rule.
  • Database schema design, JPA relations, and B-Tree index optimizations.
  • React state management, route guards, and DTO validation.
  • Live Demo: Customer Portal (KYC Profile -> Catalog -> Buying Policy).

[10:00 - 15:00] SHIVAJI GUNDE (Staff Operations & Claims)
  • Product catalog management & Premium payment ledger activation.
  • Claim Headroom math & Maker-Checker investigation workflow.
  • Cloudinary document streaming & client-side PDF certificate generation.
  • ELK Stack structured logging and security auditing.
  • Live Demo: Staff self-assigning claim -> Recommending approval -> Generating Policy PDF.

[15:00 - 20:00] ALL TEAM MEMBERS (FINALE & Q&A)
  • Admin granting final live claim approval.
  • Answering examiner technical questions across architecture, database, concurrency, and security.
```

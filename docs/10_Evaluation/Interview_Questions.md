# Interview Questions
> Comprehensive technical interview Q&A guide for the InsuranceFlow system.

---

## Purpose
To prepare developers, architects, and candidates for technical interviews regarding the InsuranceFlow system's design, architecture, and implementation details.

---

## Overview
- Organized by technical domain (Architecture, Security, Business Logic, Database, Frontend, Operations).
- Contains concise, interview-ready answers.
- Includes references to specific system components.

---

## Architecture (8 questions)

**1. How is the backend layered?**
The backend follows a standard N-tier architecture using Spring Boot. It includes Controllers for HTTP routing, Services for business logic, Repositories for database access via Spring Data JPA, and Entities for ORM mapping. DTOs and Mappers are used to ensure separation of concerns between layers.
*Reference: `Backend Implementation` section in architecture docs.*

**2. What design patterns did you use?**
We extensively used the Strategy Pattern for premium calculations (`PremiumCalculator`), Factory Pattern for instantiating the right calculator, and Data Transfer Object (DTO) pattern to encapsulate data. We also used the Builder pattern for entity creation and Singleton for Spring managed beans.
*Reference: `../02_Business_Domain/Premium_Calculation.md`*

**3. Why did you separate the service interface from its implementation?**
Separating the interface (e.g., `PolicyService`) from its implementation (`PolicyServiceImpl`) promotes loose coupling and adheres to the Dependency Inversion Principle. It makes mocking easier during unit testing and allows for multiple implementations if the business logic diverges in the future.
*Reference: Backend Architecture*

**4. How does the request lifecycle work?**
A request hits the Spring Security filter chain where JWT authentication and rate-limiting occur. It then reaches the Controller, which validates DTOs and delegates to the Service layer. The Service executes business rules, coordinates with the Repository for DB transactions, and returns a mapped response via `ApiResponseDTO`.
*Reference: `System Flow` diagrams*

**5. How does the frontend and backend communicate?**
Communication is strictly over REST HTTP via the Vite frontend proxy in dev (or Nginx in production). The frontend uses Axios with interceptors to automatically attach JWT access tokens to the `Authorization` header and seamlessly handle 401 token refreshes.
*Reference: `../06_Frontend/API_Integration.md`*

**6. Why did you choose a SPA + REST API architecture?**
A Single Page Application (React) combined with a stateless REST API (Spring Boot) allows for independent scaling, distinct deployment lifecycles, and a more responsive user experience. It also enables future integrations, like mobile apps, consuming the same API layer.
*Reference: Project Summary*

**7. What is the ApiResponseDTO and why does it exist?**
`ApiResponseDTO` is a generic wrapper for all API responses, containing fields like `status`, `message`, `data`, and `timestamp`. It ensures a consistent contract with the frontend, making error handling and generic response parsing completely predictable across the entire application.
*Reference: Error Handling guidelines*

**8. How do you handle cross-cutting concerns?**
Cross-cutting concerns are handled using Aspect-Oriented Programming (AOP) and Servlet Filters. Spring Security handles auth, `@ControllerAdvice` handles global exception mapping, and Bucket4j handles rate-limiting at the filter level before hitting business logic.
*Reference: Security and Error Handling docs*

---

## Security (10 questions)

**1. How does JWT authentication work in this project?**
Upon login, the server issues a short-lived HS256 JWT access token (15 min) and a long-lived refresh token (7 days). The frontend includes the access token in the `Authorization: Bearer` header. Spring Security filters validate the signature and extract the user's roles for RBAC.

**2. How do access tokens and refresh tokens work together?**
Access tokens are kept in memory and authorize immediate requests. When they expire, the frontend Axios interceptor automatically hits the `/refresh` endpoint using the HttpOnly refresh token cookie to get a new access token without requiring user interaction.

**3. Why store refresh tokens in an HttpOnly cookie?**
HttpOnly cookies are inaccessible to JavaScript, completely mitigating Cross-Site Scripting (XSS) attacks from stealing the long-lived refresh token. This provides a much stronger security posture than local storage.

**4. Why hash refresh tokens in the database?**
We hash refresh tokens (SHA-256) in the DB so that if the database is compromised, the attacker cannot use the stolen tokens to hijack sessions. We compare the provided plain-text token against the stored hash, similar to passwords.

**5. How does tokenVersion enable stateless revocation?**
The `tokenVersion` integer is stored in both the `User` DB record and the JWT payload. If a user's access is revoked (e.g., password change), the DB `tokenVersion` increments. Even if the JWT is mathematically valid, the filter checks against a Redis cache (or DB) and rejects it if the version mismatches.

**6. How does refresh token rotation with family revocation work?**
A new refresh token is issued upon every use, and the old one is invalidated. If a malicious actor uses a stolen (and thus invalidated) old refresh token, the system detects this anomaly and revokes the entire "family" of tokens for that user, requiring re-authentication.

**7. What is dual OTP and why is it required?**
Dual OTP requires a 6-digit code sent via both Email (SMTP) and SMS (Twilio) for sensitive operations. It adds a strong layer of Multi-Factor Authentication (MFA), expiring in 5 minutes with a maximum of 5 attempts to prevent brute force.

**8. How does rate limiting work?**
We use Bucket4j integrated into the Spring filter chain. Rate limits are applied per IP address and email combination to prevent brute force logins and API abuse, returning a 429 Too Many Requests status when the bucket is exhausted.

**9. How does CORS work in this project?**
Cross-Origin Resource Sharing is configured globally in Spring Boot to allow requests only from the frontend origin (e.g., `http://localhost:5173`). It exposes necessary headers, allows specific HTTP methods, and importantly, sets `allowCredentials=true` to permit HttpOnly cookies.

**10. What happens when a user gets deactivated?**
Their `isActive` flag is set to false, their `tokenVersion` is incremented, and their tokens are blacklisted in Redis. Any active sessions are immediately rejected on the next API call with a 401/403.

---

## Business Logic (8 questions)

**1. How does premium calculation work?**
Premium calculation uses the Strategy Pattern based on `PremiumType`. The base premium is fetched from the DB, multiplied by risk factors, age modifiers, and duration. Payment is strictly validated against this exactly calculated amount.

**2. Why are PricingRules separate from PolicyPlans?**
This decouples the core product definition from variable market conditions. Pricing rules change frequently; storing them separately allows administrators to update modifiers without altering historical policies or the core plan structure.

**3. Why are CoverageOptions separate entities?**
Coverage options (e.g., "Add-on Dental") can apply across multiple plans and have independent limits and costs. Separating them normalizes the database and allows for a dynamic selection model during quote generation.

**4. How does quote generation work?**
A user inputs their parameters, the system dynamically calculates the exact premium using the Strategy pattern, and saves a `Quote` entity. The quote is valid for 30 minutes, ensuring the user is locked into that price temporarily.

**5. Why must payment exactly equal calculatedPremium?**
To prevent fraud or partial payments. The system performs a strict `BigDecimal.compareTo` check between the incoming payment intent and the DB-stored calculated premium. No float rounding approximations are permitted.

**6. How does the claim approval workflow work?**
Claims start as `SUBMITTED`, move to `UNDER_REVIEW`, then require internal staff to mark `RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION`. Finally, an Admin reviews and sets it to `APPROVED` or `REJECTED`.

**7. Why does the system use maker-checker for claims?**
The maker-checker principle (Staff recommends, Admin approves) prevents single-user fraud or accidental payouts. It ensures a secondary review process for all financial disbursements.

**8. How do you prevent a customer from buying the same health plan twice?**
Before saving a new policy, the Service layer queries the repository for active policies with the same `ProductType` and `UserId`. If one exists in an `ACTIVE` state, a `BusinessValidationException` is thrown.

---

## Database (6 questions)

**1. Walk me through the data model.**
We have `User` and `Role` for auth. `PolicyPlan`, `PricingRule`, and `CoverageOption` for product config. `Quote` for temporary pricing. `Policy` for active contracts, and `Claim` (with `ClaimDocument`) for payouts. Everything links back to `User`.

**2. Why does the Policy store pricing snapshots?**
Insurance is a legal contract. If the base price of a plan changes next year, the current active policy must reflect the exact price the user agreed to. Storing a snapshot in the `Policy` prevents historical mutation.

**3. What is @Version and why is it on Policy and Claim?**
`@Version` enables Optimistic Locking in Hibernate. If two staff members try to approve the same claim simultaneously, the DB version increments. The second transaction fails with an `OptimisticLockException`, preventing race conditions.

**4. Why use BigDecimal for money?**
`Double` and `Float` suffer from precision loss during arithmetic due to binary floating-point representation. `BigDecimal` guarantees exact precision, which is legally and functionally required for all financial calculations.

**5. Why soft delete instead of hard delete?**
Insurance systems are highly audited. We use `isActive = false` or `deletedAt = timestamp` instead of SQL `DELETE` to retain historical records for compliance, troubleshooting, and analytics.

**6. Why is the pricing_audit_log not a foreign key relationship?**
Audit logs often outlive the entities they track. If a plan is eventually hard-deleted, we still need the audit log. Making it loosely coupled prevents constraint violations during massive data archival.

---

## Frontend (5 questions)

**1. How are protected routes implemented?**
React Router 7 is used alongside a custom `<ProtectedRoute>` wrapper. It checks the `AuthContext` for a valid token and user role. Unauthenticated users are redirected to `/login`, and unauthorized users to `/unauthorized`.

**2. How does the Axios interceptor handle token refresh?**
The interceptor catches `401 Unauthorized` responses. If caught, it pauses incoming requests, calls `/api/auth/refresh`, updates the in-memory access token, and retries the paused requests seamlessly.

**3. Why did you choose React Context over Redux?**
For this scale, Redux introduces unnecessary boilerplate. React Context provides sufficient global state management for authentication, user profiles, and theme preferences without heavy overhead.

**4. How does the role-based theming work?**
The `AuthContext` parses the JWT to extract `roles`. Based on the role (`ROLE_ADMIN` vs `ROLE_CUSTOMER`), conditional rendering swaps out navigation bars, dashboard layouts, and Bootstrap color schemas.

**5. How does the application restore session after page refresh?**
On mount, the `AuthContext` makes a silent call to `/api/auth/me` (or relies on the interceptor to trigger a refresh). Since the refresh token is in an HttpOnly cookie, the backend issues a new access token, restoring state.

---

## Operations (4 questions)

**1. How would you deploy this in production?**
I would containerize the frontend (Nginx) and backend (Spring Boot) using Docker. Deploy to AWS/GCP using Kubernetes or ECS. Use an RDS instance for MySQL and ElastiCache for Redis. Secrets managed via AWS Secrets Manager.

**2. What are the known performance bottlenecks?**
The PDF generation for quotes (`jsPDF`) blocks the main thread on the client. On the backend, heavy claim history queries lack covering indexes, which could slow down the Admin dashboard at scale.

**3. What would you improve with more time?**
Migrate from `ddl-auto=update` to Flyway for database versioning. Implement a real payment gateway (Stripe) instead of mock logic. Add Kafka for asynchronous email/SMS notifications.

**4. What is your biggest design trade-off?**
Storing the JWT in-memory on the client instead of local storage prevents XSS but means the user loses immediate state on hard refresh, requiring a brief round-trip to the `/refresh` endpoint to restore session.

---

## Quick Cheat Sheet

| Question | One-Line Answer |
|----------|-----------------|
| Architecture | N-Tier Spring Boot REST API + React SPA. |
| Premium Pattern | Strategy Pattern (`PremiumCalculator`). |
| JWT Storage | Access token in memory, Refresh token in HttpOnly DB-hashed cookie. |
| Money Type | `BigDecimal` to prevent floating-point precision loss. |
| Concurrency | JPA `@Version` for Optimistic Locking on Claims/Policies. |
| DB Migrations | Currently `ddl-auto=update` (future: Flyway). |
| Token Refresh | Handled silently by Axios Interceptors on 401s. |
| Auth Framework | Spring Security with stateless custom JWT filters. |
| Rate Limiting | Bucket4j filtering per IP + email. |
| Frontend routing | React Router 7 with `<ProtectedRoute>` wrappers. |

---

## Related Documents
- [Features Checklist](./Features_Checklist.md)
- [API Checklist](./API_Checklist.md)

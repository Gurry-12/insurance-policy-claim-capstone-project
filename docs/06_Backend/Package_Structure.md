# Backend Package Structure

## Purpose

This document is the single source of truth for the Java package layout of the backend application. It maps every package and class under `com.insurance.demo` to its responsibility so that developers can navigate the codebase without re-reading source files. Physical folder layout and build tooling are covered in the architecture folder-structure document; this document covers the logical package decomposition only.

## Overview

The backend is a Spring Boot 3.x / Java 17 REST application. All production code lives under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`. The root package `com.insurance.demo` holds the `DemoApplication` entry point, which enables scheduling. The remaining code is split into twelve feature-oriented subpackages:

- `config` — bean definitions, security wiring, filters, and startup seeding
- `controller` — REST HTTP layer (13 controllers)
- `dto` — request/response transfer objects (`request`, `response` subpackages)
- `enums` — domain enumerations
- `exception` — custom exception types and the global handler
- `model` — JPA entities
- `repository` — Spring Data JPA repositories
- `security` — JWT and authentication support classes
- `service` — business-logic contracts, including the premium-calculation `strategy` subpackage
- `serviceimpl` — implementations of the service contracts
- `util` — shared helpers and message constants
- `verification` — email/SMS/OTP delivery and attempt tracking

## Business Context

The layered structure keeps the HTTP layer (controllers/DTOs) separate from the business layer (services) and the persistence layer (repositories/models). This separation is what allows business rules to be enforced in exactly one place (services), which the Business Rules document relies on. The `service`/`serviceimpl` split follows Spring's interface-plus-implementation convention so that transaction boundaries and cross-cutting concerns can be applied declaratively via annotations. The `dto/request` and `dto/response` split guarantees that no HTTP-facing DTO exposes JPA entity internals.

## Technical Design

### Entry point

| Class | Location | Responsibility |
| --- | --- | --- |
| `DemoApplication` | `demo/DemoApplication.java` | `@SpringBootApplication`, `@EnableScheduling`; enables the refresh-token cleanup scheduler |

### `config` package

| Class | Responsibility |
| --- | --- |
| `AppConfig` | Declares the shared `ModelMapper` bean |
| `AppSecurityProperties` | Type-safe binding for `app.security.*` properties (JWT expiration, CORS origin, refresh-cookie secure flag) |
| `SecurityConfig` | Spring Security filter chain: stateless policy, CSRF disabled, method security, filter ordering |
| `CookieCsrfOriginFilter` | Builds the CSRF token and origin validation for cookie-based session flows |
| `RateLimitFilter` | Bucket4j rate limiter keyed by client IP, applied per endpoint group |
| `SecurityAuditLogger` | Central audit-log emitter for security events |
| `JwtAuthenticationFilter` | OncePerRequestFilter that validates the access token and populates the `SecurityContext` |
| `RefreshTokenCookieManager` | Reads and writes the refresh-token HTTP-only cookie |
| `RefreshTokenCleanupScheduler` | Scheduled job that deletes expired/stale refresh tokens |
| `CorsConfig` | CORS configuration for the configured front-end origin |
| `OpenApiConfig` | OpenAPI/Swagger documentation configuration |
| `CloudinaryConfig` | Cloudinary SDK bean from `cloudinary.*` properties |
| `DataInitializer` | Seeds the default admin unless `app.security.seed-admin.enabled=false` |
| `CachedBodyHttpServletRequest` | Request wrapper that caches the body so it can be read more than once (rate-limit and audit paths) |

### `controller` package (13 controllers)

| Class | Base path | Responsibility |
| --- | --- | --- |
| `AuthController` | `/api/auth` | Login, registration, OTP verification, refresh, logout, password reset |
| `PublicController` | `/api/public` | Unauthenticated product/plan browsing and portal statistics |
| `UserController` | `/api/users` | Admin management of users and staff accounts |
| `CustomerController` | `/api/customers` | Customer profile and customer management |
| `InsuranceProductController` | `/api/products` | Insurance product CRUD |
| `PolicyPlanController` | `/api/plans` | Policy plan CRUD and plan wizard flow |
| `PolicyController` | `/api/policies` | Policy purchase, issue, renewal, status lifecycle |
| `PremiumPaymentController` | `/api/payments` | Premium payments and payment history |
| `ClaimController` | `/api/claims` | Claim filing, review, recommendation, decision flow |
| `ClaimDocumentController` | `/api/claims` (document subresources) | Claim document upload/download |
| `CoverageOptionController` | `/api/coverage-options` | Coverage option CRUD for plans |
| `PricingRuleController` | `/api/pricing-rules` | Pricing rule CRUD, previews, audit log |
| `PremiumCalculationController` | `/api/premium-calculation` | Public/authenticated premium quotes and admin quote generation |

### `dto` package

| Package | Contents |
| --- | --- |
| `dto` (root) | Calculation payloads shared across flows: `PremiumCalculationRequest`, `AdminPremiumCalculationRequest`, `PremiumQuote`, `QuotePurchaseRequest` |
| `dto.request` | 18 request DTOs (one per write operation) carrying bean-validation annotations |
| `dto.response` | 17 response DTOs, including the uniform wrappers `ApiResponseDTO<T>`, `PageResponseDTO<T>`, `ErrorResponseDTO`, `ValidationErrorResponseDTO` |

### `enums` package

| Enum | Values |
| --- | --- |
| `Role` | `ADMIN`, `INTERNAL_STAFF`, `CUSTOMER` |
| `ClaimStatus` | `SUBMITTED`, `UNDER_REVIEW`, `RECOMMENDED_FOR_APPROVAL`, `RECOMMENDED_FOR_REJECTION`, `APPROVED`, `REJECTED` |
| `PolicyStatus` | `PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `CANCELLED` |
| `ProductType` | `HEALTH`, `MOTOR`, `LIFE`, `TRAVEL`, `INSURANCE` |
| `PremiumType` | `ONE_TIME`, `ANNUAL` |
| `PaymentMode` | `UPI`, `CARD`, `NET_BANKING`, `CASH` |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED` |
| `PricingRuleStatus` | `ACTIVE`, `INACTIVE` |
| `QuoteStatus` | `CREATED`, `USED`, `EXPIRED`, `CANCELLED` |
| `RoundingRule` | Rounding configuration for premium calculations |
| `Gender` | `MALE`, `FEMALE`, `OTHER` |

### `exception` package

| Class | Responsibility |
| --- | --- |
| `GlobalExceptionHandler` | `@RestControllerAdvice` mapping exceptions to uniform error responses |
| `ResourceNotFoundException` | Generic missing-resource error |
| `ProductNotFoundException` | Missing product |
| `PolicyNotFoundException` | Missing policy |
| `PlanNotActiveException` | Inactive plan used in a purchase/quote |
| `BadRequestException` | Invalid operation/business rule violation |
| `DuplicateResourceException` | Uniqueness conflicts (email, mobile, code) |
| `RefreshTokenException` | Refresh-token rotation/reuse errors |

### `model` package (16 JPA entities)

`AppUser`, `Customer`, `InsuranceProduct`, `PolicyPlan`, `CoverageOption`, `Policy`, `Quote`, `PremiumPayment`, `PricingRule`, `PricingAuditLog`, `Claim`, `ClaimStatusHistory`, `ClaimDocument`, `StaffSpeciality`, `RefreshToken`, `OtpVerification`. Entity relationships, keys, and mappings are documented in the database design.

### `repository` package (16 repositories)

One `JpaRepository` per entity, plus `JpaSpecificationExecutor` where dynamic filtering is required. Notable query techniques per repository are documented in Repositories.md.

### `security` package

| Class | Responsibility |
| --- | --- |
| `JwtService` | HS256 token generation/validation; claims `role`, `tokenVersion`, `jti`; clock-skew handling |
| `JwtAuthenticationFilter` | Validates access tokens, skips public/auth endpoints and OpenAPI docs |
| `CustomUserDetailsService` | Loads users by `email` + `isActive` |
| `AppUserDetails` | `UserDetails` adapter; authority is `role.name()` |
| `RefreshTokenService` | SHA-256-hashed refresh-token rotation, reuse detection, family revocation |

### `service` package

Contracts: `AuthService`, `UserService`, `CustomerService`, `InsuranceProductService`, `PolicyPlanService`, `CoverageOptionService`, `PolicyService`, `PremiumPaymentService`, `PricingRuleService`, `ClaimService`, `ClaimDocumentService`, `PremiumCalculationService`, `PublicService`, `CloudinaryService`.

`service.strategy` subpackage implements the premium calculation strategy pattern:

| Class | Responsibility |
| --- | --- |
| `PremiumCalculator` | Strategy interface |
| `OneTimePremiumCalculator` | ONE_TIME formula with duration discount |
| `AnnualPremiumCalculator` | ANNUAL formula returning the annual premium |
| `PremiumCalculatorFactory` | Selects calculator by `premiumType.name() + "_CALCULATOR"` |

### `serviceimpl` package (15 implementations)

`AuthServiceImpl`, `UserServiceImpl`, `CustomerServiceImpl`, `InsuranceProductServiceImpl`, `PolicyPlanServiceImpl`, `CoverageOptionServiceImpl`, `PolicyServiceImpl`, `PremiumPaymentServiceImpl`, `PricingRuleServiceImpl`, `ClaimServiceImpl`, `ClaimDocumentServiceImpl`, `PremiumCalculationServiceImpl`, `PublicServiceImpl`, `CloudinaryServiceImpl`, and the strategy beans in `service/strategy`.

### `util` package

| Class | Responsibility |
| --- | --- |
| `MessageConstants` | Centralized user-facing message strings (auth, validation, domain) |
| `PaginationValidator` | Page >= 0, size 1..100, allowed sort fields |
| `PolicyNumberGenerator` | `POL-XXXXXXXX` policy numbers |
| `ClaimNumberGenerator` | `CLM-XXXXXXXX` claim numbers |
| `TransactionReferenceGenerator` | `TRX-XXXXXXXXXXXX` payment references |

### `verification` package

| Class | Responsibility |
| --- | --- |
| `EmailService` | HTML email OTP delivery via `JavaMailSender` |
| `SmsService` | Twilio OTP delivery; logs OTP locally when Twilio unconfigured |
| `OtpService` | OTP generation, expiry handling, channel dispatch |
| `OtpAttemptRecorder` | Records verification attempts in a `REQUIRES_NEW` transaction |

### Test tree

`src/test/java/com/insurance/demo/`:

| Class | Responsibility |
| --- | --- |
| `DemoApplicationTests` | Context-load smoke test |
| `RefreshTokenIntegrationTest` | Refresh-token rotation/reuse integration coverage |
| `JwtSecurityIntegrationTest` | JWT-protected endpoint integration coverage |

## Workflow

1. A request arrives at a controller, which converts the body into a `dto.request` object (validated via `@Valid`).
2. The controller delegates to the matching `service` contract; the implementation in `serviceimpl` enforces business rules inside a transaction.
3. Business data is read/written through `repository` methods against `model` entities.
4. The result is mapped (ModelMapper) into a `dto.response` object and returned inside `ApiResponseDTO<T>`.
5. Failures bubble to `GlobalExceptionHandler`, which emits `ErrorResponseDTO` / `ValidationErrorResponseDTO`.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/DemoApplication.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/util/`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/verification/`
- `insurance-policy-claim-management-system/src/test/java/com/insurance/demo/`

Related: [Folder Structure](../01_System_Architecture/Folder_Structure.md)

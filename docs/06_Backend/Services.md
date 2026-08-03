# Services Layer

## Purpose

This document is the single source of truth for the backend service layer: the contract packages, the implementations, transaction semantics, mapping strategy, and where business rules are enforced. It is the reference used by the Business Rules and API documents rather than a re-statement of them.

## Overview

The service layer is split into contracts in `com.insurance.demo.service` and implementations in `com.insurance.demo.serviceimpl`. Every controller depends only on a contract; Spring wires in the implementation. The premium calculation strategy is isolated in `service.strategy` and orchestrated by `PremiumCalculationServiceImpl`. Cross-cutting concerns (ModelMapper mapping, transactional boundaries, business rule enforcement) are concentrated here so that they are not duplicated in controllers or repositories.

## Business Context

Services are the enforcement point for every business rule that is not structural (uniqueness of email/mobile is structural and enforced at the database via constraints, but surfaced through services). Because the entire domain is served by one Spring application context, no remote calls are made between services; dependencies are plain constructor-injected beans. The 1:1 interface/implementation ratio keeps the API contract stable even when persistence or formula details change.

## Technical Design

### Service inventory

| Contract | Implementation | Aggregates |
| --- | --- | --- |
| `AuthService` | `AuthServiceImpl` | Login, register, OTP verify/resend, refresh, logout, forgot/reset password |
| `UserService` | `UserServiceImpl` | User listing, status updates, staff creation |
| `CustomerService` | `CustomerServiceImpl` | Customer profile read/update |
| `InsuranceProductService` | `InsuranceProductServiceImpl` | Product CRUD and catalog reads |
| `PolicyPlanService` | `PolicyPlanServiceImpl` | Plan CRUD and plan wizard flow |
| `CoverageOptionService` | `CoverageOptionServiceImpl` | Coverage option CRUD, active-option listing |
| `PolicyService` | `PolicyServiceImpl` | Purchase, issue, renewal, cancel, status transitions |
| `PremiumPaymentService` | `PremiumPaymentServiceImpl` | Payment initiation/recording and history |
| `PricingRuleService` | `PricingRuleServiceImpl` | Pricing rule CRUD, previews, activation, audit log |
| `ClaimService` | `ClaimServiceImpl` | Claim filing, assignment, review, recommendation, decision, history |
| `ClaimDocumentService` | `ClaimDocumentServiceImpl` | Document upload (Cloudinary) and download |
| `PremiumCalculationService` | `PremiumCalculationServiceImpl` | Quote generation and quote-to-policy purchase |
| `PublicService` | `PublicServiceImpl` | Public catalog and portal stats |
| `CloudinaryService` | `CloudinaryServiceImpl` | Cloudinary upload/delete abstraction |
| (strategy) | `OneTimePremiumCalculator` | ONE_TIME premium formula |
| (strategy) | `AnnualPremiumCalculator` | ANNUAL premium formula |
| (strategy) | `PremiumCalculatorFactory` | Calculator lookup by premium type |

### Transaction semantics

- Write operations are annotated `@Transactional` (default propagation), guaranteeing that multi-entity updates — for example policy purchase plus quote status transition plus payment record — commit or roll back atomically.
- Read operations are annotated `@Transactional(readOnly = true)`.
- `OtpAttemptRecorder` uses `@Transactional(propagation = Propagation.REQUIRES_NEW)` so that a failed verification attempt is always persisted even when the surrounding OTP transaction rolls back.
- `RefreshTokenService` and repository-level `@Lock`/`@Modifying` operations provide the concurrency guarantees for token rotation; details are in JWT.md.
- `AppUserRepository` uses `@Lock(LockModeType.PESSIMISTIC_WRITE)` for the user lookup during refresh, serializing rotation attempts per user.

### Mapping strategy

A single `ModelMapper` bean (`AppConfig`) is shared across services. Entities are mapped to `dto/response` objects and request DTOs are mapped to entities. Sensitive fields are explicitly excluded at the field level with `@JsonIgnore` on DTO fields (for example the refresh token in `LoginResponseDTO`/`RefreshResponseDTO`) rather than by mass type-mapping, so no internal value is ever exposed accidentally.

### Business rule enforcement points

| Rule | Enforced in | Mechanism |
| --- | --- | --- |
| Minimum coverage amount (>= 50,000) | `PremiumCalculationServiceImpl` | Service-side check against the coverage option |
| Plan must be active | `PolicyServiceImpl`, `PremiumCalculationServiceImpl` | `PlanNotActiveException` |
| Policy cannot be purchased for a plan a customer already holds in an active status | `PolicyServiceImpl` | `existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn` |
| Duration validity per plan | `PolicyServiceImpl` | `existsByPolicyPlanIdAndPolicyDuration` |
| Payment must succeed before a policy becomes ACTIVE | `PolicyServiceImpl` | Payment status check in the issuance flow |
| Quote one-time use | `PremiumCalculationServiceImpl` | Quote status transition `USED` in the purchase transaction |
| Claim status transitions | `ClaimServiceImpl` | Guarded transitions per `ClaimStatus` |
| Review requires assignment | `ClaimServiceImpl` | Assigned-staff checks before review/recommendation |
| Pricing rule audit | `PricingRuleServiceImpl` | Writes `PricingAuditLog` on every rule change |
| Reuse-detection of refresh tokens | `RefreshTokenService` | Family revocation on reused token hashes |

## Workflow

1. A controller invokes one method on a service contract.
2. The service implementation validates business rules, loads the required aggregate via repositories, and mutates it inside one transaction.
3. The service maps result entities to response DTOs and returns them; the controller wraps them in `ApiResponseDTO<T>`.
4. When a service detects an invalid state it throws a domain exception from the `exception` package, which `GlobalExceptionHandler` converts to the uniform error response.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/AuthService.java` / `serviceimpl/AuthServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/PolicyService.java` / `serviceimpl/PolicyServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/ClaimService.java` / `serviceimpl/ClaimServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/PremiumCalculationService.java` / `serviceimpl/PremiumCalculationServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/PremiumPaymentService.java` / `serviceimpl/PremiumPaymentServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/PricingRuleService.java` / `serviceimpl/PricingRuleServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/ClaimDocumentService.java` / `serviceimpl/ClaimDocumentServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/verification/OtpAttemptRecorder.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/AppConfig.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/AppUserRepository.java`

Related: [Business Rules](../02_Business_Domain/Business_Rules.md), [Premium Calculation Service](Premium_Calculation_Service.md)

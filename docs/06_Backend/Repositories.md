# Repositories

## Purpose

This document is the single source of truth for the persistence query layer: the sixteen Spring Data JPA repositories, the derived-query conventions, and the advanced query techniques (`@Query`, `@Param`, `@EntityGraph`, `@Lock`, `@Modifying`, `JpaSpecificationExecutor`) used in each. Database schema and entity mappings live in the database design.

## Overview

All repositories extend `JpaRepository<T, ID>` and live in `com.insurance.demo.repository`. Query names follow the Spring Data derived-query grammar so that intent is readable from the method signature. Where derived queries are insufficient (join fetch, aggregation, locking), explicit `@Query`/`@Param` JPQL is used.

## Business Context

Repositories are the only layer allowed to touch the persistence API directly. Services depend on repository interfaces, which keeps the transactional boundary at the service layer and makes query behavior unit-testable. The derived-query conventions matter because the API documents guarantee certain lookup semantics (for example "latest active pricing rule for a plan"), and those semantics are implemented here, not in services.

## Technical Design

### Repository inventory and techniques

| Repository | Notable methods | Technique |
| --- | --- | --- |
| `AppUserRepository` | `findByEmailAndIsActiveTrue`, `existsByEmail`, `findByEmailForUpdate` | `@Lock(LockModeType.PESSIMISTIC_WRITE)` for refresh-token serialization |
| `RefreshTokenRepository` | `findByTokenHash`, `findByJti`, `revokeAndMarkReplaced`, `revokeAllActiveForUser`, `purgeStale` | SHA-256 hash lookup; `@Modifying(flushAutomatically = true)` writes; scheduled purge |
| `CustomerRepository` | `findByAppUserId`, `existsByMobile` | Derived queries for profile resolution and duplicate checks |
| `InsuranceProductRepository` | `findByProductType`, `findByIsActiveTrue` | Derived queries for catalog filtering |
| `PolicyPlanRepository` | `findByIdAndIsActiveTrue`, `findByProductId` | Explicit `@Query` for active-plan lookup; catalog reads |
| `CoverageOptionRepository` | `findByPolicyPlanIdAndIsActiveTrueOrderByDisplayOrderAsc` | Derived query for ordered active coverage listing |
| `PolicyRepository` | `findByCustomerId`, `existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn`, `existsByPolicyPlanIdAndPolicyDuration`, `existsByPolicyPlanIdAndSelectedCoverage` | Business-rule existence checks (duplicate plan, duration validity, coverage conflict) |
| `QuoteRepository` | `findByIdAndStatus`, `existsByPricingRuleId` | Quote lifecycle and pricing-rule usage checks |
| `PremiumPaymentRepository` | `findTopByPolicyIdAndPaymentStatusOrderByPaymentDateDesc`, `countByPolicyIdAndPaymentStatus` | Latest-successful-payment lookup; renewal eligibility counts |
| `PricingRuleRepository` | `findByPolicyPlanIdAndStatusOrderByIdDesc` | Latest pricing rule per plan |
| `PricingAuditLogRepository` | `findByPricingRuleIdOrderByChangedAtDesc` | Rule-change audit trail |
| `ClaimRepository` | `findByIdWithPolicyAndCustomer`, `findByPolicyCustomerUserId`, `findByAssignedStaffId` | `@EntityGraph` join fetching for policy/customer; customer-scoped claim lookups |
| `ClaimStatusHistoryRepository` | `findByClaimIdOrderByChangedAtAsc`, `findByClaimId` | Status history timeline |
| `ClaimDocumentRepository` | `findByClaimId` | Document listing per claim |
| `StaffSpecialityRepository` | `findByStaff` | Staff-to-speciality resolution |
| `OtpVerificationRepository` | `getTotalOtpSendsSince` | `@Query` with `COALESCE` for OTP send-rate limiting |

### Concurrency and locking notes

- Refresh-token rotation is serialized with a pessimistic write lock on the user row; the reuse-detection path relies on the token-hash uniqueness constraint in the database (see JWT.md).
- `@Modifying` repository writes (revoke/purge) bypass the persistence context by design; callers re-query state afterward rather than relying on stale first-level cache.
- `@EntityGraph` fetches avoid N+1 queries on claim reads; the loaded graph is fixed per method so consumers cannot influence it.

## Workflow

1. A service calls a repository method inside its transaction.
2. For derived queries Spring Data generates JPQL from the method name; for `@Query` methods the JPQL is explicit and validated at startup.
3. Locked/modifying methods acquire the required locks or flush as annotated, preserving the invariants the services rely on.
4. The returned entities are mapped to response DTOs by the service; entities never leave the service layer.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/AppUserRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/RefreshTokenRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PolicyRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/ClaimRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PricingRuleRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PremiumPaymentRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/QuoteRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/CoverageOptionRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/OtpVerificationRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/ClaimStatusHistoryRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/StaffSpecialityRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PricingAuditLogRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/InsuranceProductRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PolicyPlanRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/CustomerRepository.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/ClaimDocumentRepository.java`

Related: [Database](../04_Database), [Services](Services.md)

# Repository Pattern

## What It Is
- A data-access layer that isolates persistence from the rest of the application. Each aggregate gets a Spring Data `JpaRepository<T, Long>` interface in `repository/*.java`.
- Repositories provide derived query methods (named by convention), `@Query` JPQL for complex updates, and `JpaSpecificationExecutor` for dynamic filtering.
- Services depend only on repository interfaces, never on JDBC/EntityManager directly.

## Why It Is Used
- Encapsulates all SQL/JPQL in one place; service code expresses intent, not query mechanics.
- Spring Data generates implementations from method names, removing boilerplate.
- `Specification`-based queries enable optional, composable filters (status, customer, amount range) without writing dozens of method variants.

## Where It Is Used in This Project
- `repository/AppUserRepository.java`, `CustomerRepository.java`: identity and profile lookups (`findByEmail`, `findByUserEmail`).
- `repository/PolicyRepository.java`, `PolicyPlanRepository.java`, `InsuranceProductRepository.java`: catalog and policy queries, including duplicate-policy checks (`existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn`).
- `repository/ClaimRepository.java`, `ClaimDocumentRepository.java`, `ClaimStatusHistoryRepository.java`: claims and their history; `sumActiveClaimsByPolicyId` for remaining-cover computation.
- `repository/PremiumPaymentRepository.java`: payment queries (success counts, latest payment by policy).
- `repository/PricingRuleRepository.java`: `findByPolicyPlanIdAndStatusOrderByIdDesc` for the active rule.
- `repository/RefreshTokenRepository.java`: `revokeAndMarkReplaced` (atomic conditional update), `revokeAllActiveForUser`, `purgeStale`.
- `repository/OtpVerificationRepository.java`: OTP lookup and send counting.
- Dynamic filtering: `Specification` used in `PolicyServiceImpl`, `PremiumPaymentServiceImpl`, and `ClaimServiceImpl` pagination endpoints.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PolicyRepository.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/RefreshTokenRepository.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PricingRuleRepository.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/ClaimRepository.java

## Related Docs
- ../06_Backend/Repositories.md
- ../04_Database/Table_Descriptions.md
- ../06_Backend/Services.md

## Common Interview Questions
1. What does extending `JpaRepository<T, Long>` give you? — CRUD operations, pagination/sorting (`findAll(Pageable)`, `findAll(Specification, Pageable)`), and derived query support for free.
2. How are derived query methods written? — By method name convention, e.g., `existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn`; Spring Data parses the name into a query.
3. When is `@Query` used instead? — For bulk updates and complex logic, e.g., `revokeAndMarkReplaced` which atomically flips `revoked` with a conditional update.
4. What is `Specification` used for here? — Optional filter composition for paginated lists (policy/claim/payment filters such as status, customer, and amount range), including staff-speciality scoping.
5. Why use an interface-based pattern? — It keeps persistence replaceable, makes services unit-testable with mocks, and centralizes query knowledge.

# Indexing

> Current state of indexes in `insurance_db`, the hot query paths they serve, and concrete, clearly-marked recommendations (implemented vs. recommended).

## Purpose

This document is the authoritative reference for index coverage in `insurance_db`. It records what indexes Hibernate actually generates today, which queries are hot, where index gaps exist (including the findings in [`../06_Backend/Performance.md`](../06_Backend/Performance.md)), and what should be added — with every recommendation explicitly separated from what is already implemented.

## Overview

The schema is created by Hibernate under `spring.jpa.hibernate.ddl-auto=update`; the application does not run any manual migration scripts. Consequently, the index set is exactly what Hibernate derives from annotations:

- **Unique constraints** (`@Column(unique = true)`, `@UniqueConstraint`) become unique indexes.
- **Explicit `@Index` annotations** become named indexes — currently only on `refresh_tokens`.
- **Foreign-key columns** are not indexed by Hibernate itself, but MySQL/InnoDB automatically creates an index on every FK column when the FK constraint is added, so single-column FK equality lookups are served by those implicit indexes.
- Everything else (status columns, expiry columns, composite predicates) is **not indexed** today.

## Business Context

Index decisions serve the operational flows in [`../02_Business_Domain/Insurance_Domain.md`](../02_Business_Domain/Insurance_Domain.md): login by email, per-customer policy and claim lists, claims work queues for staff by product speciality, quote validation/expiry sweeps, and payment history lookups. Each hot path below corresponds to a derived query in `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/*.java`.

## Technical Design

### Current state (what is implemented today)

**Unique indexes created from unique constraints:**

| Table | Column(s) | Source |
|---|---|---|
| `users` | `email` | `@UniqueConstraint` `user_valid_email` |
| `users` | `mobile_number` | `@UniqueConstraint` `user_valid_phone` |
| `customers` | `user_id` | `@JoinColumn(unique = true)` (1:1) |
| `staff_specialities` | `user_id` | `@OneToOne` FK uniqueness |
| `insurance_products` | `product_name` | `@Column(unique = true)` |
| `policies` | `policy_number` | `@Column(unique = true)` |
| `premium_payments` | `transaction_reference` | `@Column(unique = true)` |
| `claims` | `claim_number` | `@Column(unique = true)` |

**Explicit indexes (the only explicitly-declared `@Index` set in the model):** `refresh_tokens` declares four named indexes — `refresh_token_jti` (unique, on `jti`), `refresh_token_user` (`user_id`), `refresh_token_hash` (`token_hash`), and `refresh_token_expires` (`expires_at`). This is the one table where Hibernate creates indexes beyond uniqueness.

**Implicit InnoDB FK indexes:** every FK column below receives an automatic InnoDB index because it backs a foreign key constraint. These serve single-column equality lookups:

`customers.user_id`, `staff_specialities.user_id`, `otp_verifications.user_id`, `refresh_tokens.user_id`, `policy_plans.product_id`, `policy_plan_durations.plan_id`, `coverage_options.plan_id`, `pricing_rules.plan_id`, `quotes.customer_id`, `quotes.plan_id`, `policies.customer_id`, `policies.plan_id`, `premium_payments.policy_id`, `claims.policy_id`, `claims.assigned_staff_id`, `claim_documents.claim_id`, `claim_status_histories.claim_id`.

### Hot query paths

| Hot path | Repository method(s) | Columns involved | Index coverage today |
|---|---|---|---|
| Login by email | `AppUserRepository.findByEmail`, `findByEmailAndIsActiveTrue`, `existsByEmail` | `users.email` | Served by the unique index `user_valid_email` |
| Policies by customer (paged) | `PolicyRepository.findByCustomerId`, `findByCustomerIdAndPolicyStatus` | `policies.customer_id` (+ `policy_status`) | FK equality served by implicit index; **no composite for the status filter** |
| Claims by policy | `ClaimRepository.findByPolicyId`, `sumActiveClaimsByPolicyId` | `claims.policy_id`, `claims.claim_status` | FK equality served; **no composite for `claim_status`** |
| Staff work queue | `ClaimRepository.findByAssignedStaffId`, `findByAssignedStaffIdAndClaimStatus` | `claims.assigned_staff_id`, `claim_status` | FK equality served; **no composite** |
| Claims by product type / status | `ClaimRepository.findByPolicyPolicyPlanInsuranceProductProductType...` | `policy_id → plan_id → product_type`, `claim_status` | Requires multi-table join; only FK indexes available |
| Claims by customer (security scoping) | `ClaimRepository.findByPolicyCustomerUserId` | `policy_id → customer_id`, `user_id` | Join through FKs; **no composite** |
| Payments by policy | `PremiumPaymentRepository.findByPolicyId`, `findByPolicyIdAndPaymentStatus`, `findTopByPolicyIdAndPaymentStatusOrderByPaymentDateDesc` | `premium_payments.policy_id`, `payment_status`, `payment_date` | FK equality served; **no composite** |
| Quote by id / exists by rule | `QuoteRepository.findById`, `existsByPricingRuleId` | `quotes.id` (PK), `pricing_rule_id` | PK served; `pricing_rule_id` **not indexed** |
| Quote expiry sweep | quote-status/expiry transitions in `serviceimpl` | `quotes.status`, `quotes.expires_at` | **Not indexed** |
| Latest OTP for a user | `OtpVerificationRepository.findTopByUserOrderByCreatedAtDesc` | `otp_verifications.user_id`, `created_at` | FK equality served; **no composite** |
| Refresh-token rotation/revocation | `RefreshTokenRepository.findByTokenHash`, `findByJti`, `revokeAndMarkReplaced`, `purgeStale` | `token_hash`, `jti`, `user_id`, `expires_at`, `created_at` | Fully served by the four explicit indexes |

### N+1 and query-count findings (`../06_Backend/Performance.md`)

[`../06_Backend/Performance.md`](../06_Backend/Performance.md) is the authoritative performance analysis; the index-relevant findings are:

- Four `@ManyToOne` associations are `EAGER` (`PolicyPlan.insuranceProduct`, `CoverageOption.policyPlan`, `PricingRule.policyPlan`, `PremiumPayment.policy`) and load on every entity read — overhead, not an indexing problem, but it interacts with the claims/payment reads above.
- `ClaimRepository` already uses `@EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})` on its paged/list finders, eliminating the N+1 on claim lists.
- Plan-detail assembly still issues several queries per request (plan, coverage options, durations, pricing); the `@EntityGraph` pattern is the recommended fix there.
- The N+1 audit found every lazy-relation access is inside `@Transactional` except the non-transactional quote path, so N+1 risk is contained; the remaining risk is per-query cost on the hot paths above, which is where indexes matter.

The prior index guidance (composite `(customer_id, policy_status)` on policies, `(policy_id, payment_status, payment_date DESC)` on payments, `(policy_id, claim_status)` on claims, `(assigned_staff_id)` on claims, `(claim_id, updated_date DESC)` on histories, `(plan_id, status, effective_from DESC)` on pricing rules, `(customer_id, status)` on quotes) remains valid and is consolidated below.

## Recommended indexes

The following are **recommendations only — not yet implemented.** They require either `@Index` annotations on the entities (applied on the next `ddl-auto=update` boot) or a manual migration script. They are marked `RECOMMENDED`; `IMPLEMENTED` rows are the current state listed above.

| Table | Recommended index | Rationale | Status |
|---|---|---|---|
| `policies` | `(customer_id, policy_status)` | `findByCustomerIdAndPolicyStatus` and my-policies list filtering | RECOMMENDED |
| `policies` | `(customer_id)` alone is sufficient for the plain list | Already served by implicit FK index | IMPLEMENTED (via InnoDB FK index) |
| `premium_payments` | `(policy_id, payment_status, payment_date DESC)` | Payment history paging, activation lookup, `countByPolicyIdAndPaymentStatus` | RECOMMENDED |
| `claims` | `(policy_id, claim_status)` | Claims-by-policy list + `sumActiveClaimsByPolicyId` aggregation | RECOMMENDED |
| `claims` | `(assigned_staff_id, claim_status)` | Staff work queue with status filter | RECOMMENDED (plain `assigned_staff_id` is IMPLEMENTED via FK index) |
| `claims` | `(policy_id)` | Single-column lookup | IMPLEMENTED (via InnoDB FK index) |
| `claim_status_histories` | `(claim_id, updated_date DESC)` | Timeline paging queries | RECOMMENDED |
| `pricing_rules` | `(plan_id, status, effective_from DESC)` | Active-rule lookup for premium calculation | RECOMMENDED |
| `quotes` | `(status, expires_at)` | Quote expiry sweep and status-based operations | RECOMMENDED |
| `quotes` | `(pricing_rule_id)` | `existsByPricingRuleId` used before pricing-rule edits | RECOMMENDED |
| `otp_verifications` | `(user_id, created_at DESC)` | Latest-OTP lookup and send-sum queries | RECOMMENDED |
| `refresh_tokens` | `jti` (unique), `user_id`, `token_hash`, `expires_at` | Rotation, revocation, family purge | IMPLEMENTED |

Implementation notes:

- Adding `@Index` to an entity column does not modify the existing physical schema under `ddl-auto=update` in all cases — Hibernate creates the index for new tables/constraints, but may not retroactively create an index for a pre-existing table unless the schema is re-created. For a guaranteed effect, run a manual `CREATE INDEX` statement or use a migration script. This is the key reason the recommendations above are treated as explicit work rather than a config change.
- InnoDB's implicit FK indexes mean the single-column FK lookups (claims by policy, payments by policy, policies by customer) are already adequately served; the gap is composite predicates and non-FK filter columns.

## Workflow

1. Confirm current indexes: `SHOW INDEX FROM <table>` in MySQL (run after one backend boot so `ddl-auto=update` has materialized the schema).
2. For any recommended index: apply via an `@Index` annotation and restart, or run a manual `CREATE INDEX` for immediate effect.
3. Re-run the hot-path queries in `EXPLAIN` to confirm the query plan uses the new index.

## Code References

| What | Path |
|---|---|
| Explicit `@Index` annotations (refresh_tokens) | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/RefreshToken.java` |
| Unique constraints (implicit indexes) | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/*.java` |
| Derived queries driving hot paths | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/*.java` |
| `@EntityGraph` usage (N+1 mitigation) | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/ClaimRepository.java` |
| Performance analysis (eager associations, N+1, plan-detail query counts) | `../06_Backend/Performance.md` |
| Persistence configuration (`ddl-auto=update`) | `insurance-policy-claim-management-system/src/main/resources/application.properties` |

## Diagrams

Structural diagram in [`ER_Diagram.md`](ER_Diagram.md); associations and join columns in [`Entity_Relationships.md`](Entity_Relationships.md); FK/unique constraints in [`Constraints.md`](Constraints.md).

## Best Practices

- Prefer composite indexes that match the exact predicate order of the hottest repository methods.
- Because `ddl-auto=update` is additive and may not retrofit indexes onto pre-existing tables, treat every new `@Index` as requiring verification (`SHOW INDEX`) after deployment.
- Keep using `@EntityGraph` for graph-traversal reads (claims lists) so indexes are not compensating for N+1.

## Future Improvements

- Introduce a migration tool (Flyway/Liquibase) so index changes are versioned and guaranteed to apply; see [`../10_Evaluation/Future_Enhancements.md`](../10_Evaluation/Future_Enhancements.md).
- After adding the composite indexes above, re-run `EXPLAIN` on all list endpoints and the quote expiry sweep to close the remaining gaps (e.g., claims-by-product-type joins).
- Cache `/api/public/stats` and catalog endpoints to reduce aggregate query load per [`../06_Backend/Performance.md`](../06_Backend/Performance.md).

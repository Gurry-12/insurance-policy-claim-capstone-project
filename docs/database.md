# Database Design

## Overview

- **Database:** MySQL 8, schema `insurance_db`.
- **Access:** Spring Data JPA + Hibernate, `spring.jpa.hibernate.ddl-auto=update` (Hibernate manages the schema).
- **Connection:** `jdbc:mysql://localhost:3306/insurance_db`, credentials from `env.properties` (`${DB_USER}`, `${DB_PASSWORD}`).
- **Enums:** stored as strings (`@Enumerated(EnumType.STRING)`).
- A minimal bootstrap script exists at [`imp-doc/03-database/create-insurance-database.sql`](../imp-doc/03-database/create-insurance-database.sql).

## Tables (15 entities)

| Entity | Table | Notes |
|--------|-------|-------|
| `AppUser` | `users` | auth principal; `email` UK, `mobile_number` UK |
| `Customer` | `customers` | 1:1 with user |
| `StaffSpeciality` | `staff_specialities` | 1:1 with user; product speciality |
| `OtpVerification` | `otp_verifications` | email + phone OTP per user |
| `InsuranceProduct` | `insurance_products` | `product_name` UK |
| `PolicyPlan` | `policy_plans` | + `policy_plan_durations` (ElementCollection) |
| `CoverageOption` | `coverage_options` | FK `plan_id` |
| `PricingRule` | `pricing_rules` | FK `plan_id`, status ACTIVE/INACTIVE |
| `PricingAuditLog` | `pricing_audit_logs` | audit trail for pricing rule changes |
| `Policy` | `policies` | `policy_number` UK; `@Version` optimistic lock |
| `PremiumPayment` | `premium_payments` | PK `payment_id`; `transaction_reference` UK |
| `Quote` | `quotes` | 30-min expiry |
| `Claim` | `claims` | `claim_number` UK; `@Version`; assigned staff FK |
| `ClaimDocument` | `claim_documents` | Cloudinary `public_id` |
| `ClaimStatusHistory` | `claim_status_histories` | status timeline |

## Entity-relationship summary

Full ER diagram (Mermaid) lives in [`architecture/03-domain-model.md`](architecture/03-domain-model.md). Key relationships:

- `users 1—1 customers`, `users 1—1 staff_specialities`, `users 1—N otp_verifications`
- `insurance_products 1—N policy_plans 1—N {coverage_options, pricing_rules, policies, quotes}`
- `customers 1—N policies 1—N {premium_payments, claims}`
- `users (assignedStaff) 1—N claims 1—N {claim_documents, claim_status_histories}`
- `pricing_rules 1—N pricing_audit_logs`

## Foreign keys & constraints

| Child table | Column | Parent table | Behavior |
|-------------|--------|--------------|----------|
| `customers` | `user_id` | `users` | unique (1:1) |
| `staff_specialities` | `staff_id` | `users` | unique (1:1) |
| `otp_verifications` | `user_id` | `users` | |
| `policy_plans` | `product_id` | `insurance_products` | |
| `coverage_options` | `plan_id` | `policy_plans` | |
| `pricing_rules` | `plan_id` | `policy_plans` | |
| `policies` | `customer_id` | `customers` | |
| `policies` | `plan_id` | `policy_plans` | |
| `premium_payments` | `policy_id` | `policies` | |
| `claims` | `policy_id` | `policies` | |
| `claims` | `assigned_staff_id` | `users` | nullable |
| `claim_documents` | `claim_id` | `claims` | |
| `claim_status_histories` | `claim_id` | `claims` | |
| `quotes` | `customer_id` | `customers` | |
| `quotes` | `plan_id` | `policy_plans` | |

Notable constraints:

- Unique: `users.email`, `users.mobile_number`, `customers.user_id`, `staff_specialities.staff_id`, `insurance_products.product_name`, `policies.policy_number`, `premium_payments.transaction_reference`, `claims.claim_number`, `premium_payments.payment_id`.
- Not-null business rules: policy amount/payment fields, pricing rule `effective_from`, plan `terms_and_conditions`, etc.
- Numeric precision: money amounts `DECIMAL(15,2)`; `base_risk_rate DECIMAL(10,4)`; `gst DECIMAL(5,2)`; `claim_amount DECIMAL(15,2)`.
- Optimistic locking: `@Version` on `Policy` and `Claim` (concurrent updates rejected with 409 via `ObjectOptimisticLockingFailureException` handler).

## Key custom repository queries

- `ClaimRepository` — `@EntityGraph(attributePaths={"policy.customer.user","policy.policyPlan.insuranceProduct","assignedStaff"})` on paged/list finders (avoids N+1 on the claim list); `sumActiveClaimsByPolicyId` via `@Query` (sum of non-terminal claim amounts for a policy).
- `OtpVerificationRepository` — `@Query` summing `sendCount` to enforce the 4-sends/24h OTP limit.
- `PremiumPaymentRepository` — `findTopByPolicyIdAndPaymentStatusOrderByPaymentDateDesc`, `countByPolicyIdAndPaymentStatus`, `existsByPolicyIdAndPaymentStatus` (drives policy activation and remaining-claim logic).
- `AppUserRepository` — derived finders for login, staff lists, paged admin filtering.
- `PolicyRepository` — guards duplicate/one-time policy creation for a customer+plan.

## Index recommendations

The schema relies on Hibernate's default indexes (FK columns and unique constraints only). For read-heavy list endpoints the following indexes would improve query plans. **These are recommendations, not yet applied** (applying requires `ddl-auto` management or a migration script).

| Table | Recommended index | Rationale |
|-------|-------------------|-----------|
| `policies` | `(customer_id, policy_status)` | `GET /api/policies/customer/*`, my-policies filtering by status |
| `premium_payments` | `(policy_id, payment_status, payment_date DESC)` | payment history + activation lookups |
| `claims` | `(policy_id, claim_status)` | claims-by-policy list + `sumActiveClaimsByPolicyId` |
| `claims` | `(assigned_staff_id)` | staff work queue |
| `claim_status_histories` | `(claim_id, updated_date DESC)` | timeline queries |
| `pricing_rules` | `(plan_id, status, effective_from DESC)` | active-rule lookup |
| `quotes` | `(customer_id, status)` | customer quote lookup; the 30-min expiry sweep |

## Migrations

Schema is currently managed with `ddl-auto=update`. For a controlled production lifecycle, a migration tool (Flyway/Liquibase) is recommended; see [`decision-records.md`](decision-records.md) and [`deployment.md`](deployment.md).

## See also

- [`architecture/03-domain-model.md`](architecture/03-domain-model.md)
- [`imp-doc/03-database/database-overview.md`](../imp-doc/03-database/database-overview.md)
- [`imp-doc/03-database/er-diagrams.md`](../imp-doc/03-database/er-diagrams.md)

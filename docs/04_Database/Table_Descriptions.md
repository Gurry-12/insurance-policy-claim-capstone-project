# Table Descriptions

> Per-table authoritative reference for all 17 physical tables in `insurance_db`: purpose, every column with its MySQL type and meaning, and the JPA entity that maps it.

## Purpose

This document is the column-level source of truth for the schema. Where [`ER_Diagram.md`](ER_Diagram.md) shows shape and cardinality, and [`Constraints.md`](Constraints.md) lists rules, this document defines *what each table stores and what each column means*. It is verified against `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/*.java`.

## Overview

There are 16 JPA entities and 17 physical tables. Two tables have no entity class: `policy_plan_durations` is the `@ElementCollection` join table for `PolicyPlan.allowedDurations`, and every other table maps one-to-one with an entity. One table (`premium_payments`) uses a custom `@Id` column name `payment_id` instead of the default `id`.

The MySQL type mapping applied throughout is Hibernate's standard mapping for Spring Boot on MySQL 8: `Long → BIGINT`, `Integer → INT`, `Boolean → BOOLEAN`, `String → VARCHAR(255)` unless a `length` is declared, `BigDecimal(p,s) → DECIMAL(p,s)`, `LocalDateTime → DATETIME(6)`, `LocalDate → DATE`, and `columnDefinition = "TEXT" → TEXT`.

## Business Context

The tables implement the business domain described in [`../02_Business_Domain/Insurance_Domain.md`](../02_Business_Domain/Insurance_Domain.md). Identity and access tables hold the auth principal and verification artifacts; catalog tables hold the product/plan/coverage/pricing configuration; sales tables hold quotes, policies, and the premium ledger; claims tables hold claims, their Cloudinary document references, and the status timeline.

## Technical Design

### 1. `users` — mapped by `AppUser`

Identity and authentication principal.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `full_name` | VARCHAR(255) | NOT NULL; letters/spaces only, 2–100 chars |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE (`user_valid_email`); login identifier |
| `password` | VARCHAR(255) | NOT NULL; BCrypt hash |
| `mobile_number` | VARCHAR(255) | NOT NULL, UNIQUE (`user_valid_phone`) |
| `is_active` | BOOLEAN | NOT NULL; account enablement flag |
| `role` | VARCHAR(255) | NOT NULL; `Role` enum stored as STRING |
| `token_version` | BIGINT | JWT version for refresh-family revocation; entity default 0 |
| `email_verified` | BOOLEAN | Entity default false |
| `phone_verified` | BOOLEAN | Entity default false |
| `created_date` | DATETIME(6) | Set by `@CreationTimestamp`, not updatable |
| `updated_date` | DATETIME(6) | Set by `@UpdateTimestamp` |

### 2. `refresh_tokens` — mapped by `RefreshToken`

Opaque refresh-token sessions (raw token never stored; SHA-256 digest only).

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `user_id` | BIGINT | NOT NULL, FK → `users.id`; indexed (`refresh_token_user`) |
| `token_hash` | VARCHAR(64) | NOT NULL; SHA-256 hex digest; indexed (`refresh_token_hash`) |
| `jti` | VARCHAR(36) | NOT NULL, UNIQUE (`refresh_token_jti`); token ID |
| `expires_at` | DATETIME(6) | NOT NULL; indexed (`refresh_token_expires`); 7-day TTL |
| `revoked` | BOOLEAN | NOT NULL; true after use/rotation/reuse |
| `replaced_by` | VARCHAR(36) | jti of the rotation successor; null for the last token in a family |
| `token_version` | BIGINT | NOT NULL; snapshot of `users.token_version` at issue time |
| `created_at` | DATETIME(6) | NOT NULL; set by `@PrePersist` |

### 3. `customers` — mapped by `Customer`

Customer profile, one-to-one with a user.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `user_id` | BIGINT | NOT NULL, UNIQUE, FK → `users.id`; 1:1 owner column |
| `date_of_birth` | DATE | Nullable until profile completed |
| `address` | VARCHAR(255) | Nullable |
| `city` | VARCHAR(255) | Nullable; used in filter queries |
| `state` | VARCHAR(255) | Nullable; used in filter queries |
| `pin_code` | VARCHAR(255) | Nullable |
| `nominee_name` | VARCHAR(255) | Nullable |
| `nominee_relation` | VARCHAR(255) | Nullable |
| `created_date` | DATETIME(6) | `@CreationTimestamp` |
| `updated_date` | DATETIME(6) | `@UpdateTimestamp` |

### 4. `staff_specialities` — mapped by `StaffSpeciality`

Maps each internal-staff user to exactly one product speciality.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `user_id` | BIGINT | NOT NULL, UNIQUE, FK → `users.id`; 1:1 (unique by virtue of `@OneToOne`) |
| `product_speciality` | VARCHAR(255) | NOT NULL; `ProductType` enum stored as STRING |

### 5. `otp_verifications` — mapped by `OtpVerification`

Dual email + SMS OTP records; one row per user per verification cycle.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `user_id` | BIGINT | NOT NULL, FK → `users.id` |
| `email_otp` | VARCHAR(255) | NOT NULL; 6-digit code (hashed/bound to user) |
| `phone_otp` | VARCHAR(255) | NOT NULL; 6-digit code |
| `expires_at` | DATETIME(6) | NOT NULL; 5-minute OTP expiry |
| `used` | BOOLEAN | Entity default false |
| `attempt_count` | INT | Verify-attempt counter; entity default 0; capped at 5 |
| `send_count` | INT | NOT NULL; **DB default 1** (`columnDefinition = "int default 1"`) |
| `last_sent_at` | DATETIME(6) | Set by `@PrePersist` |
| `created_at` | DATETIME(6) | Set by `@PrePersist`; used to find latest OTP and sum sends |

### 6. `insurance_products` — mapped by `InsuranceProduct`

Product catalog header.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `product_name` | VARCHAR(255) | NOT NULL, UNIQUE |
| `product_type` | VARCHAR(255) | NOT NULL; `ProductType` enum stored as STRING |
| `description` | VARCHAR(255) | NOT NULL; min 10 chars |
| `is_active` | BOOLEAN | NOT NULL; entity default true |
| `created_date` | DATETIME(6) | `@CreationTimestamp` |
| `updated_date` | DATETIME(6) | `@UpdateTimestamp` |

### 7. `policy_plans` — mapped by `PolicyPlan`

Versioned plan under a product.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `product_id` | BIGINT | NOT NULL, FK → `insurance_products.id` |
| `plan_name` | VARCHAR(255) | NOT NULL; 2–100 chars |
| `plan_version` | INT | NOT NULL; entity default 1 |
| `supported_premium_type` | VARCHAR(255) | NOT NULL; `PremiumType` enum stored as STRING |
| `terms_conditions` | VARCHAR(3000) | NOT NULL; declared `length = 3000` |
| `is_active` | BOOLEAN | NOT NULL; entity default true |
| `created_date` | DATETIME(6) | `@CreationTimestamp` |
| `updated_date` | DATETIME(6) | `@UpdateTimestamp` |

The `allowedDurations` element collection is materialized in the join table `policy_plan_durations` (see below).

### 8. `policy_plan_durations` — ElementCollection join table (no entity)

Allowed duration values per plan, produced by `PolicyPlan.allowedDurations` (`@ElementCollection`, `FetchType.LAZY`).

| Column | MySQL type | Notes |
|---|---|---|
| `plan_id` | BIGINT | NOT NULL, FK → `policy_plans.id`; join column |
| `duration` | INT | NOT NULL; one allowed duration (years) |

There is no surrogate primary key and no entity class. The table is owned and maintained by `PolicyPlan`; uniqueness of a `(plan_id, duration)` pair follows from the `Set<Integer>` semantics.

### 9. `coverage_options` — mapped by `CoverageOption`

Selectable coverage tiers per plan.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `plan_id` | BIGINT | NOT NULL, FK → `policy_plans.id` |
| `coverage_amount` | DECIMAL(15,2) | NOT NULL; must be positive |
| `label` | VARCHAR(255) | NOT NULL |
| `display_order` | INT | NOT NULL; ordering within a plan |
| `is_active` | BOOLEAN | NOT NULL; entity default true |

### 10. `pricing_rules` — mapped by `PricingRule`

Versioned pricing configuration per plan.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `plan_id` | BIGINT | NOT NULL, FK → `policy_plans.id` |
| `base_risk_rate` | DECIMAL(10,4) | NOT NULL; per-unit risk rate, >= 0 |
| `processing_fee` | DECIMAL(15,2) | NOT NULL; >= 0 |
| `gst` | DECIMAL(5,2) | NOT NULL; percentage, >= 0 |
| `remarks` | VARCHAR(500) | Nullable |
| `effective_from` | DATETIME(6) | NOT NULL |
| `effective_to` | DATETIME(6) | Nullable; null = open-ended |
| `status` | VARCHAR(255) | NOT NULL; `PricingRuleStatus` enum stored as STRING; entity default ACTIVE |
| `created_date` | DATETIME(6) | `@CreationTimestamp` |

### 11. `pricing_audit_logs` — mapped by `PricingAuditLog`

Append-only audit trail for pricing rule changes.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `pricing_rule_id` | BIGINT | NOT NULL; plain reference, **no FK constraint** |
| `old_configuration` | TEXT | Nullable; previous JSON/state |
| `new_configuration` | TEXT | NOT NULL; new state |
| `remarks` | VARCHAR(500) | Nullable |
| `changed_by` | VARCHAR(255) | NOT NULL; actor identity |
| `changed_at` | DATETIME(6) | `@CreationTimestamp`, not updatable |

### 12. `quotes` — mapped by `Quote`

Priced proposition snapshot for a customer and plan.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `customer_id` | BIGINT | NOT NULL, FK → `customers.id` |
| `plan_id` | BIGINT | NOT NULL, FK → `policy_plans.id` |
| `plan_version` | INT | NOT NULL; snapshot |
| `pricing_rule_id` | BIGINT | NOT NULL; snapshot, no FK |
| `coverage` | DECIMAL(15,2) | NOT NULL; selected coverage |
| `duration` | INT | NOT NULL; years |
| `premium_type` | VARCHAR(255) | NOT NULL; `PremiumType` enum stored as STRING |
| `risk_rate` | DECIMAL(10,4) | NOT NULL; >= 0 |
| `processing_fee` | DECIMAL(15,2) | NOT NULL; >= 0 |
| `gst` | DECIMAL(10,2) | NOT NULL; >= 0 |
| `premium` | DECIMAL(15,2) | NOT NULL; premium amount, >= 0 |
| `total` | DECIMAL(15,2) | NOT NULL; grand total, >= 0 |
| `status` | VARCHAR(255) | NOT NULL; `QuoteStatus` enum stored as STRING; entity default CREATED |
| `created_at` | DATETIME(6) | `@CreationTimestamp`, not updatable |
| `expires_at` | DATETIME(6) | NOT NULL; quote TTL |

### 13. `policies` — mapped by `Policy`

The active insurance contract; snapshots pricing and plan version at purchase.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `policy_number` | VARCHAR(50) | NOT NULL, UNIQUE; human-readable identifier |
| `customer_id` | BIGINT | NOT NULL, FK → `customers.id` |
| `plan_id` | BIGINT | NOT NULL, FK → `policy_plans.id` |
| `selected_coverage` | DECIMAL(15,2) | NOT NULL; pricing snapshot |
| `premium_type` | VARCHAR(255) | NOT NULL; `PremiumType` enum stored as STRING |
| `policy_duration` | INT | NOT NULL; years |
| `premium_rate_used` | DECIMAL(15,4) | NOT NULL; >= 0; snapshot |
| `processing_fee_used` | DECIMAL(15,2) | NOT NULL; >= 0; snapshot |
| `gst_used` | DECIMAL(15,2) | NOT NULL; >= 0; snapshot |
| `calculated_premium` | DECIMAL(15,2) | NOT NULL; >= 0; snapshot |
| `plan_version` | INT | NOT NULL; snapshot |
| `pricing_rule_id` | BIGINT | NOT NULL; snapshot, no FK |
| `quote_id` | BIGINT | Nullable; logical link to originating quote, no FK, not unique at DB level |
| `purchase_date` | DATETIME(6) | Set at purchase/issue |
| `start_date` | DATE | NOT NULL |
| `end_date` | DATE | NOT NULL; start + duration |
| `policy_status` | VARCHAR(255) | NOT NULL; `PolicyStatus` enum stored as STRING |
| `total_premium_paid` | DECIMAL(15,2) | NOT NULL; entity default 0; incremented on SUCCESS payment |
| `version` | BIGINT | `@Version` optimistic-lock column |
| `created_date` | DATETIME(6) | `@CreationTimestamp` |
| `updated_date` | DATETIME(6) | `@UpdateTimestamp` |

### 14. `premium_payments` — mapped by `PremiumPayment`

Premium payment ledger. **The `@Id` column is named `payment_id`**, not `id`.

| Column | MySQL type | Notes |
|---|---|---|
| `payment_id` | BIGINT | PK, auto-increment; entity field is `id` with `@Column(name = "payment_id")` |
| `policy_id` | BIGINT | NOT NULL, FK → `policies.id` |
| `amount` | DECIMAL(15,2) | NOT NULL; must be positive |
| `payment_date` | DATETIME(6) | NOT NULL; entity default `LocalDateTime.now()` |
| `payment_mode` | VARCHAR(255) | NOT NULL; `PaymentMode` enum stored as STRING |
| `transaction_reference` | VARCHAR(255) | NOT NULL, UNIQUE; guards against double processing |
| `payment_status` | VARCHAR(255) | NOT NULL; `PaymentStatus` enum stored as STRING |
| `created_date` | DATETIME(6) | `@CreationTimestamp` |

### 15. `claims` — mapped by `Claim`

Claim records raised against a policy.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `claim_number` | VARCHAR(50) | NOT NULL, UNIQUE; human-readable identifier |
| `policy_id` | BIGINT | NOT NULL, FK → `policies.id` |
| `assigned_staff_id` | BIGINT | FK → `users.id`; nullable until assigned |
| `claim_amount` | DECIMAL(15,2) | NOT NULL; must be positive |
| `claim_reason` | VARCHAR(255) | NOT NULL |
| `incident_date` | DATETIME(6) | NOT NULL |
| `claim_status` | VARCHAR(255) | NOT NULL; `ClaimStatus` enum stored as STRING |
| `staff_remarks` | VARCHAR(255) | Nullable |
| `admin_remarks` | VARCHAR(255) | Nullable |
| `version` | BIGINT | `@Version` optimistic-lock column |
| `created_date` | DATETIME(6) | `@CreationTimestamp` |
| `updated_date` | DATETIME(6) | `@UpdateTimestamp` |

### 16. `claim_documents` — mapped by `ClaimDocument`

Metadata for claim documents; the binary is stored in Cloudinary.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `claim_id` | BIGINT | NOT NULL, FK → `claims.id` |
| `document_name` | VARCHAR(255) | NOT NULL |
| `document_type` | VARCHAR(255) | NOT NULL |
| `document_reference` | VARCHAR(255) | Cloudinary URL |
| `public_id` | VARCHAR(255) | Cloudinary public id |
| `uploaded_date` | DATETIME(6) | Upload timestamp |

### 17. `claim_status_histories` — mapped by `ClaimStatusHistory`

Append-only status-change timeline for claims.

| Column | MySQL type | Notes |
|---|---|---|
| `id` | BIGINT | PK, auto-increment |
| `claim_id` | BIGINT | NOT NULL, FK → `claims.id` |
| `previous_status` | VARCHAR(255) | Nullable; null for the initial SUBMITTED row |
| `new_status` | VARCHAR(255) | NOT NULL; plain string, not a FK |
| `remarks` | VARCHAR(255) | Nullable |
| `updated_by` | VARCHAR(255) | NOT NULL; actor identity |
| `updated_date` | DATETIME(6) | Change timestamp |

## Workflow

To reconcile this reference against the live database:

1. Boot the backend once so Hibernate (`ddl-auto=update`) materializes the schema in `insurance_db`.
2. Run `SHOW CREATE TABLE <table>` for any table of interest and compare types/lengths with the tables above.
3. Update this document whenever an entity field is added, renamed, or retyped.

## Code References

| What | Path |
|---|---|
| Entity classes (source of truth) | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/*.java` |
| Enum literals | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/*.java` |
| Persistence configuration (`ddl-auto=update`, port 8081, schema `insurance_db`) | `insurance-policy-claim-management-system/src/main/resources/application.properties` |
| Demo seed data showing column layouts | `demo-data/sql/*.sql` |

## Diagrams

See [`ER_Diagram.md`](ER_Diagram.md) for the diagram view and [`Entity_Relationships.md`](Entity_Relationships.md) for association-level detail.

## Best Practices

- Always declare `@Column(name = "...", nullable = ..., length = ..., precision = ..., scale = ...)` explicitly so the physical column is deterministic and this reference stays stable.
- Keep decimal money fields as `DECIMAL(p,2)` (never floating point); rates as `DECIMAL(p,4)`.
- Treat snapshot columns (`pricing_rule_id`, `quote_id`, `plan_version`) as immutable copies of reference data.

## Future Improvements

- Consider archiving `otp_verifications` and `claim_status_histories` when volumes grow (no cleanup job exists for OTPs).
- Add a real migration tool (Flyway/Liquibase) to replace `ddl-auto=update` for production lifecycle management; see [`../10_Evaluation/Future_Enhancements.md`](../10_Evaluation/Future_Enhancements.md).

# Constraints

> Constraint reference for `insurance_db`: primary keys, foreign keys and their ON DELETE behavior, unique constraints, NOT NULL rules, enum columns (stored as STRING), optimistic-lock columns, element-collection constraints, defaults, and what Hibernate generates under `ddl-auto=update`.

## Purpose

This document is the authoritative list of every constraint on the `insurance_db` schema. It answers "what can and cannot be stored, and what is enforced at the database vs. the application layer." Facts are verified against the JPA annotations in `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/*.java` and the enum literals in `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/*.java`.

## Overview

All constraints originate from entity annotations. Hibernate translates them to MySQL DDL under `spring.jpa.hibernate.ddl-auto=update`:

- `@Id` + `@GeneratedValue(IDENTITY)` → `BIGINT AUTO_INCREMENT PRIMARY KEY`.
- `@Column(nullable = false)` → `NOT NULL`.
- `@Column(unique = true)` and `@UniqueConstraint` → `UNIQUE` constraints (unique indexes).
- `@JoinColumn` on `@ManyToOne`/`@OneToOne` → `FOREIGN KEY` constraints.
- `@Version` → a `BIGINT` column managed by Hibernate for optimistic locking.
- `@ElementCollection` → a join table with its own FK.

Important nuance: Hibernate emits FK constraints **without** `ON DELETE` actions, so the MySQL default (`RESTRICT`/`NO ACTION`) applies at the database level. Cascade behavior is implemented in the application layer via `CascadeType.ALL` + `orphanRemoval` on the owning `@OneToMany` collections (see [`Entity_Relationships.md`](Entity_Relationships.md)).

## Business Context

The constraints protect the business invariants documented in [`../02_Business_Domain/Business_Rules.md`](../02_Business_Domain/Business_Rules.md): one account per email/phone, one customer profile per user, unique policy and claim numbers, no duplicate payment transactions, and concurrent-update safety via optimistic locking on `policies` and `claims`.

## Technical Design

### Primary keys

Every table except `policy_plan_durations` has a surrogate `BIGINT AUTO_INCREMENT` primary key. `premium_payments` names its PK column `payment_id` via `@Column(name = "payment_id")`; all others use `id`.

| Table | PK column | Notes |
|---|---|---|
| `users` | `id` | |
| `refresh_tokens` | `id` | |
| `customers` | `id` | |
| `staff_specialities` | `id` | |
| `otp_verifications` | `id` | |
| `insurance_products` | `id` | |
| `policy_plans` | `id` | |
| `policy_plan_durations` | `(plan_id, duration)` | ElementCollection; no surrogate key |
| `coverage_options` | `id` | |
| `pricing_rules` | `id` | |
| `pricing_audit_logs` | `id` | |
| `quotes` | `id` | |
| `policies` | `id` | |
| `premium_payments` | `payment_id` | Custom `@Id` column name |
| `claims` | `id` | |
| `claim_documents` | `id` | |
| `claim_status_histories` | `id` | |

### Foreign keys and ON DELETE behavior

| Child table | Column | Parent table | Column | ON DELETE (as implemented) |
|---|---|---|---|---|
| `customers` | `user_id` | `users` | `id` | No `ON DELETE` clause — MySQL `RESTRICT`/`NO ACTION` at DB level; app-level cascade `ALL` + `orphanRemoval` from `AppUser.customer` |
| `staff_specialities` | `user_id` | `users` | `id` | `RESTRICT`; app-level cascade from `AppUser.staffSpeciality` |
| `otp_verifications` | `user_id` | `users` | `id` | `RESTRICT`; no JPA cascade |
| `refresh_tokens` | `user_id` | `users` | `id` | `RESTRICT`; no JPA cascade (tokens managed by repository queries) |
| `policy_plans` | `product_id` | `insurance_products` | `id` | `RESTRICT`; app-level cascade `ALL` + `orphanRemoval` from `InsuranceProduct.policyPlans` |
| `policy_plan_durations` | `plan_id` | `policy_plans` | `id` | `RESTRICT`; owned by the element collection |
| `coverage_options` | `plan_id` | `policy_plans` | `id` | `RESTRICT`; app-level cascade from `PolicyPlan.coverageOptions` |
| `pricing_rules` | `plan_id` | `policy_plans` | `id` | `RESTRICT`; no JPA cascade |
| `quotes` | `customer_id` | `customers` | `id` | `RESTRICT`; no cascade |
| `quotes` | `plan_id` | `policy_plans` | `id` | `RESTRICT`; no cascade |
| `policies` | `customer_id` | `customers` | `id` | `RESTRICT`; no cascade |
| `policies` | `plan_id` | `policy_plans` | `id` | `RESTRICT`; no cascade |
| `premium_payments` | `policy_id` | `policies` | `id` | `RESTRICT`; app-level cascade `ALL` + `orphanRemoval` from `Policy.payments` |
| `claims` | `policy_id` | `policies` | `id` | `RESTRICT`; app-level cascade `ALL` + `orphanRemoval` from `Policy.claims` |
| `claims` | `assigned_staff_id` | `users` | `id` | `RESTRICT`; nullable; no cascade |
| `claim_documents` | `claim_id` | `claims` | `id` | `RESTRICT`; app-level cascade from `Claim.claimDocuments` |
| `claim_status_histories` | `claim_id` | `claims` | `id` | `RESTRICT`; app-level cascade from `Claim.claimStatusHistories` |

**Not foreign keys (plain columns):** `pricing_audit_logs.pricing_rule_id`, `quotes.pricing_rule_id`, `policies.pricing_rule_id`, `policies.quote_id`. These are snapshot/denormalized references without constraints; their semantics are documented in [`Entity_Relationships.md`](Entity_Relationships.md).

### Unique constraints

| Table | Column(s) | Constraint/index name | Source annotation |
|---|---|---|---|
| `users` | `email` | `user_valid_email` | `@UniqueConstraint` + `@Column(unique = true)` |
| `users` | `mobile_number` | `user_valid_phone` | `@UniqueConstraint` + `@Column(unique = true)` |
| `customers` | `user_id` | generated UK | `@JoinColumn(unique = true)` (1:1) |
| `staff_specialities` | `user_id` | generated UK | `@OneToOne` (Hibernate marks the FK column unique) |
| `insurance_products` | `product_name` | generated UK | `@Column(unique = true)` |
| `policies` | `policy_number` | generated UK | `@Column(unique = true)` |
| `premium_payments` | `transaction_reference` | generated UK | `@Column(unique = true)` |
| `claims` | `claim_number` | generated UK | `@Column(unique = true)` |
| `refresh_tokens` | `jti` | `refresh_token_jti` | `@Index(unique = true)` + `@Column(unique = true)` |
| `policy_plan_durations` | `(plan_id, duration)` | set uniqueness | `Set<Integer>` element collection semantics |

**Not unique at the database level:** `policies.quote_id`. The one-policy-per-quote invariant is enforced by the service layer (a quote must still be `CREATED` and unexpired to be purchased; it is flipped to `USED` on conversion).

### NOT NULL rules

The following columns are declared `nullable = false`:

- `users`: `full_name`, `email`, `password`, `mobile_number`, `is_active`, `role`.
- `refresh_tokens`: `user_id`, `token_hash`, `jti`, `expires_at`, `revoked`, `token_version`, `created_at`.
- `customers`: `user_id` (all profile fields nullable until completed).
- `staff_specialities`: `user_id`, `product_speciality`.
- `otp_verifications`: `user_id`, `email_otp`, `phone_otp`, `expires_at`, `send_count` (`int default 1`); `used`, `attempt_count`, `last_sent_at`, `created_at` nullable.
- `insurance_products`: `product_name`, `product_type`, `description`, `is_active`.
- `policy_plans`: `product_id`, `plan_name`, `plan_version`, `supported_premium_type`, `terms_conditions`, `is_active`.
- `policy_plan_durations`: `plan_id`, `duration`.
- `coverage_options`: `plan_id`, `coverage_amount`, `label`, `display_order`, `is_active`.
- `pricing_rules`: `plan_id`, `base_risk_rate`, `processing_fee`, `gst`, `effective_from`, `status`.
- `pricing_audit_logs`: `pricing_rule_id`, `new_configuration`, `changed_by`.
- `quotes`: `customer_id`, `plan_id`, `plan_version`, `pricing_rule_id`, `coverage`, `duration`, `premium_type`, `risk_rate`, `processing_fee`, `gst`, `premium`, `total`, `status`, `expires_at`.
- `policies`: `policy_number`, `customer_id`, `plan_id`, `selected_coverage`, `premium_type`, `policy_duration`, `premium_rate_used`, `processing_fee_used`, `gst_used`, `calculated_premium`, `plan_version`, `pricing_rule_id`, `start_date`, `end_date`, `policy_status`, `total_premium_paid`. (`quote_id`, `purchase_date`, `version` nullable.)
- `premium_payments`: `policy_id`, `amount`, `payment_date`, `payment_mode`, `transaction_reference`, `payment_status`.
- `claims`: `claim_number`, `claim_amount`, `claim_reason`, `incident_date`, `claim_status`, `policy_id`. (`assigned_staff_id`, `staff_remarks`, `admin_remarks`, `version` nullable.)
- `claim_documents`: `claim_id`, `document_name`, `document_type`.
- `claim_status_histories`: `claim_id`, `new_status`, `updated_by`.

### Enum columns (stored as STRING)

All enums use `@Enumerated(EnumType.STRING)`, so the database stores the enum name literally as `VARCHAR`, never an ordinal integer.

| Column | Table | Enum | Allowed values |
|---|---|---|---|
| `role` | `users` | `Role` | `ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER` |
| `product_speciality` | `staff_specialities` | `ProductType` | `HEALTH`, `MOTOR`, `LIFE`, `TRAVEL`, `INSURANCE` |
| `product_type` | `insurance_products` | `ProductType` | `HEALTH`, `MOTOR`, `LIFE`, `TRAVEL`, `INSURANCE` |
| `supported_premium_type` | `policy_plans` | `PremiumType` | `ONE_TIME`, `ANNUAL` |
| `premium_type` | `quotes` | `PremiumType` | `ONE_TIME`, `ANNUAL` |
| `premium_type` | `policies` | `PremiumType` | `ONE_TIME`, `ANNUAL` |
| `status` | `quotes` | `QuoteStatus` | `CREATED`, `USED`, `EXPIRED`, `CANCELLED` |
| `status` | `pricing_rules` | `PricingRuleStatus` | `ACTIVE`, `INACTIVE` |
| `policy_status` | `policies` | `PolicyStatus` | `PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `CANCELLED` |
| `payment_mode` | `premium_payments` | `PaymentMode` | `UPI`, `CARD`, `NET_BANKING`, `CASH` |
| `payment_status` | `premium_payments` | `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED` |
| `claim_status` | `claims` | `ClaimStatus` | `SUBMITTED`, `UNDER_REVIEW`, `RECOMMENDED_FOR_APPROVAL`, `RECOMMENDED_FOR_REJECTION`, `APPROVED`, `REJECTED` |

Plain-string status-like columns (not enums): `claim_status_histories.previous_status`, `claim_status_histories.new_status`.

### Optimistic-lock columns (`@Version`)

| Table | Column | Type | Behavior |
|---|---|---|---|
| `policies` | `version` | BIGINT | Incremented by Hibernate on every update; conflicting concurrent updates throw `ObjectOptimisticLockingFailureException` |
| `claims` | `version` | BIGINT | Same, on claims |

`version` is never set manually; it is maintained entirely by Hibernate.

### Element-collection constraints

`policy_plan_durations` is generated from `@ElementCollection(fetch = FetchType.LAZY)` + `@CollectionTable(name = "policy_plan_durations", joinColumns = @JoinColumn(name = "plan_id"))` + `@Column(name = "duration")`:

- `plan_id` is `NOT NULL` and is a FK to `policy_plans.id`.
- `duration` is `NOT NULL`.
- No surrogate PK; `(plan_id, duration)` uniqueness follows from the `Set<Integer>` semantics.
- The rows are owned by `PolicyPlan`; Hibernate removes them when the owning plan is removed or the set changes.

### Defaults

Database-level defaults are minimal; most defaults are applied at the entity/field level in Java.

| Table | Column | Default | Where set |
|---|---|---|---|
| `otp_verifications` | `send_count` | `1` | **Database**: `columnDefinition = "int default 1"` |
| `otp_verifications` | `used`, `attempt_count` | `false`, `0` | Entity field initialization |
| `users` | `token_version`, `email_verified`, `phone_verified` | `0`, `false`, `false` | Entity field initialization |
| `policy_plans` | `plan_version`, `is_active` | `1`, `true` | Entity field initialization |
| `insurance_products` | `is_active` | `true` | Entity field initialization |
| `coverage_options` | `is_active` | `true` | Entity field initialization |
| `pricing_rules` | `status` | `ACTIVE` | Entity field initialization |
| `quotes` | `status` | `CREATED` | Entity field initialization |
| `policies` | `total_premium_paid` | `0` | Entity field initialization |
| `premium_payments` | `payment_date` | current time | Entity field initialization |

Timestamp columns are populated by Hibernate (`@CreationTimestamp`/`@UpdateTimestamp`) or `@PrePersist` methods rather than by database defaults.

### What Hibernate generates under `ddl-auto=update`

With `spring.jpa.hibernate.ddl-auto=update` (backend port 8081, schema `insurance_db`):

- On startup, Hibernate compares the entity mappings against the existing schema and issues `CREATE TABLE` / `ALTER TABLE` for **missing** tables, columns, and constraints only. It never drops or truncates existing data.
- Unique constraints and explicit `@Index` definitions are created from annotations (see [`Indexing.md`](Indexing.md)).
- FK constraints are created without `ON DELETE` actions.
- Because the mode is additive and non-destructive, schema changes that require restructuring (dropping columns, changing types) are not applied — they need a manual migration.

## Workflow

To verify constraints against the live database:

1. Boot the backend once so `ddl-auto=update` materializes the schema.
2. Run `SHOW CREATE TABLE <table>` and inspect `PRIMARY KEY`, `UNIQUE KEY`, `KEY`, and `CONSTRAINT` lines.
3. Confirm enum columns are `VARCHAR` storing literal enum names by selecting a row, e.g. `SELECT role FROM users LIMIT 1`.
4. Update this document when entity annotations change.

## Code References

| What | Path |
|---|---|
| Entity annotations (all constraints) | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/*.java` |
| Enum literals | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/*.java` |
| `ddl-auto=update`, port 8081, schema `insurance_db` | `insurance-policy-claim-management-system/src/main/resources/application.properties` |
| Optimistic-lock handling | `serviceimpl` exception-handling layer (409 on `ObjectOptimisticLockingFailureException`) |

## Diagrams

See [`ER_Diagram.md`](ER_Diagram.md) for where each constraint sits in the diagram and [`Table_Descriptions.md`](Table_Descriptions.md) for column-level detail.

## Best Practices

- Keep enums as `EnumType.STRING`: adding new values never corrupts existing rows, and queries stay readable.
- Do not rely on `ddl-auto=update` for destructive schema evolution; it only adds. Plan manual migrations for anything that drops or renames columns.
- Rely on the application-layer cascade for child cleanup, and understand that the database will `RESTRICT` any delete that bypasses the application.

## Future Improvements

- Add `ON DELETE` policies explicitly if bulk deletes are ever needed, or switch to a migration tool (Flyway/Liquibase) for controlled schema lifecycle.
- Promote the logically-unique `policies.quote_id` to a database unique constraint if the service-layer guarantee should be hardened.
- Add composite indexes to serve the constraint-driven query paths; see [`Indexing.md`](Indexing.md) and [`../10_Evaluation/Future_Enhancements.md`](../10_Evaluation/Future_Enhancements.md).

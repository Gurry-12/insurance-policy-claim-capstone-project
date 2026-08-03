# Database Architecture

> System view of the MySQL persistence layer: schema, entity model, naming strategy, enum mapping, audit tables, optimistic locking, and transactional design.

## Purpose

Explains how the backend persists data for engineers and evaluators reading the schema. This is an overview document; full table descriptions, relationships, and index analysis live in [`../04_Database/*.md`](../04_Database/Table_Descriptions.md).

## Overview

The system uses **MySQL 8** with schema `insurance_db`, accessed through Spring Data JPA/Hibernate with `spring.jpa.hibernate.ddl-auto=update` (the schema is evolved automatically in dev/test). All tables are created from **16 JPA entities** under `com.insurance.demo.model`. There are no raw SQL DDL scripts; the code-first model is the source of the schema.

## Business Context

Insurance data is highly relational: users and customers, products and plans, pricing rules with audit history, policies with payments, and claims with documents and status history. The relational model guarantees referential integrity across the policy lifecycle while the audit tables preserve a complete, queryable trail of pricing changes and claim decisions — a regulatory and operational requirement.

## Technical Design

### Entities (16)

| Entity | Table | Role |
|---|---|---|
| `AppUser` | `app_users` | Authentication principal (email, BCrypt password, role, token version) |
| `RefreshToken` | `refresh_tokens` | Opaque DB-backed refresh token (SHA-256 hash, jti, rotation chain) |
| `Customer` | `customers` | 1:1 customer profile for a user |
| `StaffSpeciality` | `staff_specialities` | Product speciality scoping for staff |
| `OtpVerification` | `otp_verifications` | Dual email/phone OTP records |
| `InsuranceProduct` | `insurance_products` | Product catalog (HEALTH/MOTOR/LIFE/TRAVEL/INSURANCE) |
| `PolicyPlan` | `policy_plans` | Plan versions under a product |
| `CoverageOption` | `coverage_options` | Plan coverage tiers |
| `PricingRule` | `pricing_rules` | Rate/fee/GST configuration per plan |
| `PricingAuditLog` | `pricing_audit_logs` | Audit trail of pricing rule changes |
| `Quote` | `quotes` | Computed premium quotes |
| `Policy` | `policies` | Issued policies with payment/status lifecycle |
| `PremiumPayment` | `premium_payments` | Payment records |
| `Claim` | `claims` | Claim lifecycle with staff/admin review |
| `ClaimDocument` | `claim_documents` | Cloudinary document references |
| `ClaimStatusHistory` | `claim_status_histories` | Audit trail of claim status transitions |

Detail per table: [`../04_Database/Table_Descriptions.md`](../04_Database/Table_Descriptions.md). Relationships: [`../04_Database/ER_Diagram.md`](../04_Database/ER_Diagram.md).

### Physical naming strategy

Hibernate's default Spring physical naming strategy (**camelCase to snake_case**) maps Java fields and table names to MySQL identifiers: `fullName` → `full_name`, `PolicyPlan` → `policy_plans`, `claimStatusHistory` → `claim_status_histories`. Detail: [`../04_Database/ER_Diagram.md`](../04_Database/ER_Diagram.md).

### Enums as STRING

Domain enums (`Role`, `ProductType`, `PremiumType`, `PolicyStatus`, `ClaimStatus`, `PaymentMode`, `PaymentStatus`, `QuoteStatus`, `PricingRuleStatus`) are persisted with `@Enumerated(EnumType.STRING)`, storing stable names rather than fragile ordinals.

### ElementCollection durations

`PolicyPlan.allowedDurations` is an `@ElementCollection(fetch = FetchType.LAZY)` set, materialized in a separate join table (`policy_plan_durations`) rather than a column or a child entity. Detail: [`../04_Database/Table_Descriptions.md`](../04_Database/Table_Descriptions.md).

### Audit tables

Two dedicated audit tables preserve history:

- `pricing_audit_logs` — old/new configuration snapshots, remarks, and who changed a pricing rule.
- `claim_status_histories` — previous/new status, remarks, and who updated a claim.

Both are written transactionally with the domain change they document. Detail: [`../04_Database/Table_Descriptions.md`](../04_Database/Table_Descriptions.md).

### Optimistic locking

`Policy` and `Claim` carry a `@Version` field. Concurrent updates to the same row produce `ObjectOptimisticLockingFailureException` / `StaleObjectStateException`, which `GlobalExceptionHandler` maps to **409 Conflict** — preventing silent lost updates on the two highest-contention entities. Detail: [`../04_Database/Constraints.md`](../04_Database/Constraints.md).

### Transactional design

Services use declarative `@Transactional`: write operations (purchase, issue, payment, claim transitions, catalog CRUD) run in read-write transactions (some with `rollbackFor = Exception.class`), and read paths use `@Transactional(readOnly = true)`. The refresh-token rotation path additionally uses `REQUIRES_NEW` transactions so family revocation survives the intentional rollback that follows a replay rejection.

## Workflow

1. A service method annotated `@Transactional` begins a transaction when a controller delegates to it.
2. The service loads entities through Spring Data JPA repositories; Hibernate translates to SQL against `insurance_db`.
3. Writes to `Policy`/`Claim` bump their `@Version`; Hibernate detects conflicting concurrent writes and raises the optimistic-lock exception.
4. Domain transitions append to the audit tables (`claim_status_histories`, `pricing_audit_logs`) within the same transaction.
5. On commit, changes flush to MySQL; on any exception the transaction rolls back and `GlobalExceptionHandler` returns the mapped error.

## Code References

| Concern | File (repo-root-relative path) |
|---|---|
| JPA config (ddl-auto, show-sql) | `insurance-policy-claim-management-system/src/main/resources/application.properties` |
| Entities | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/*.java` (16 classes) |
| Enums | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/*.java` |
| Repositories | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/*.java` |
| Optimistic locking example | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Policy.java` (`@Version`), `model/Claim.java` (`@Version`) |
| ElementCollection example | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/PolicyPlan.java` |
| Audit entities | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/PricingAuditLog.java`, `model/ClaimStatusHistory.java` |

## Performance Notes

Known findings that affect read performance are documented and analyzed in [`../04_Database/Indexing.md`](../04_Database/Indexing.md):

- **Eager loading** — four `@ManyToOne` associations are mapped `EAGER` (on `PremiumPayment`, `CoverageOption`, `PricingRule`, `PolicyPlan`), all `@JsonIgnore`; they add join costs on every load.
- **OSIV** — Spring Boot enables Open Entity Manager in View by default; the app relies on it in a few non-transactional read paths.
- **Unindexed foreign keys** — several FK columns lack explicit indexes, degrading join-heavy queries.

## Diagrams

- ER diagram: [`../04_Database/ER_Diagram.md`](../04_Database/ER_Diagram.md).
- Class diagrams: [`../04_Database/ER_Diagram.md`](../04_Database/ER_Diagram.md).

## Best Practices

- `ddl-auto=update` keeps dev/test schemas in sync with the entity model automatically.
- String enums, snake_case naming, and explicit audit tables make the schema self-documenting and stable.
- `@Version` optimistic locking gives 409-on-conflict semantics without holding DB locks.
- Audit data is written in the same transaction as the domain change, so history is never out of step with state.

## Future Improvements

- Move FK-adjacent lazy fetching and explicit index DDL into controlled migrations (e.g. Flyway/Liquibase) for production.
- Replace EAGER associations with `@EntityGraph` or fetch joins and disable OSIV.
- Partition or archive large audit/history tables.
- See [`../10_Evaluation/Future_Enhancements.md`](../10_Evaluation/Future_Enhancements.md).

## See Also

- [`High_Level_Architecture.md`](High_Level_Architecture.md) — system context.
- [`Backend_Architecture.md`](Backend_Architecture.md) — how repositories fit the layered design.
- [`Security_Architecture.md`](Security_Architecture.md) — `refresh_tokens` table and audit logging.
- [`../04_Database/Table_Descriptions.md`](../04_Database/Table_Descriptions.md) — full schema detail.
- [`../04_Database/Indexing.md`](../04_Database/Indexing.md) — performance findings and analysis.

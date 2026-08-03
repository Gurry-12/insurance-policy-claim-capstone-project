# Entity Relationships

> Association-level reference for the `insurance_db` schema: every JPA association with its cardinality, join column, owning side, cascade and fetch semantics, plus prose on the key relationship chains and the non-association references that are stored as plain columns.

## Purpose

This document is the authoritative map of how the 16 JPA entities relate to each other. It complements [`ER_Diagram.md`](ER_Diagram.md) (diagram view) and [`Table_Descriptions.md`](Table_Descriptions.md) (column view) by explaining *who owns each foreign key, what cascades when, and what fetch type applies*. It is verified directly against the `@OneToOne`, `@OneToMany`, `@ManyToOne`, and `@ElementCollection` annotations in `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/*.java`.

## Overview

Two ownership patterns exist in the model:

- **Bidirectional parent→child collections** where the child owns the FK and the parent declares `@OneToMany(mappedBy = "...")` with `CascadeType.ALL` + `orphanRemoval`. Removing a parent deletes its children in the application layer.
- **Unidirectional child→parent references** where only the child declares the `@ManyToOne` / `@OneToOne`. No cascade flows from the parent, so a parent row cannot be deleted while children reference it (the database FK defaults to `RESTRICT`; see [`Constraints.md`](Constraints.md)).

Additionally, several "links" are stored as **plain `Long` columns, not JPA associations**: `pricing_rules` → `pricing_audit_logs`, `quotes.pricing_rule_id`, `policies.pricing_rule_id`, and `policies.quote_id`. These are intentional snapshots and must not be mistaken for foreign keys.

## Business Context

The relationship graph is the physical expression of the business flows documented in [`../02_Business_Domain/Insurance_Domain.md`](../02_Business_Domain/Insurance_Domain.md): a user can be a customer or a staff member (1:1), products contain plans that define coverages and pricing, customers generate quotes that convert into policies, policies accumulate premium payments and claims, and claims collect documents plus a status timeline. The chains below trace exactly those paths.

## Technical Design

### Association table

| # | From entity | To entity | Cardinality | Join column(s) | Owning side | Cascade (JPA) | Fetch type (as annotated) |
|---|---|---|---|---|---|---|---|
| 1 | `AppUser` | `Customer` | 1 : 0..1 | `customers.user_id` (unique) | `Customer` | `CascadeType.ALL`, `orphanRemoval=true` | `LAZY` |
| 2 | `AppUser` | `StaffSpeciality` | 1 : 0..1 | `staff_specialities.user_id` (unique) | `StaffSpeciality` | `CascadeType.ALL`, `orphanRemoval=true` | `LAZY` |
| 3 | `AppUser` | `OtpVerification` | 1 : N | `otp_verifications.user_id` | `OtpVerification` | none | `LAZY` |
| 4 | `AppUser` | `RefreshToken` | 1 : N | `refresh_tokens.user_id` | `RefreshToken` | none | `LAZY` |
| 5 | `AppUser` | `Claim` (assigned staff) | 1 : N | `claims.assigned_staff_id` (nullable) | `Claim` | none | `LAZY` |
| 6 | `InsuranceProduct` | `PolicyPlan` | 1 : N | `policy_plans.product_id` | `PolicyPlan` | `CascadeType.ALL`, `orphanRemoval=true` | `EAGER` (default `@ManyToOne`) |
| 7 | `PolicyPlan` | `CoverageOption` | 1 : N | `coverage_options.plan_id` | `CoverageOption` | `CascadeType.ALL`, `orphanRemoval=true` | `EAGER` (default `@ManyToOne`) |
| 8 | `PolicyPlan` | `PricingRule` | 1 : N | `pricing_rules.plan_id` | `PricingRule` | none | `EAGER` (default `@ManyToOne`) |
| 9 | `PolicyPlan` | `Policy` | 1 : N | `policies.plan_id` | `Policy` | none | `LAZY` (both sides) |
| 10 | `PolicyPlan` | `Quote` | 1 : N | `quotes.plan_id` | `Quote` | none | `LAZY` |
| 11 | `PolicyPlan` | `policy_plan_durations` | 1 : N (element) | `policy_plan_durations.plan_id` | `PolicyPlan` (owns the collection) | element collection (owned) | `LAZY` |
| 12 | `Customer` | `Quote` | 1 : N | `quotes.customer_id` | `Quote` | none | `LAZY` |
| 13 | `Customer` | `Policy` | 1 : N | `policies.customer_id` | `Policy` | none | `LAZY` |
| 14 | `Policy` | `PremiumPayment` | 1 : N | `premium_payments.policy_id` | `PremiumPayment` | `CascadeType.ALL`, `orphanRemoval=true` | `LAZY` collection; the `PremiumPayment.policy` back-reference is `EAGER` |
| 15 | `Policy` | `Claim` | 1 : N | `claims.policy_id` | `Claim` | `CascadeType.ALL`, `orphanRemoval=true` | `LAZY` |
| 16 | `Claim` | `ClaimDocument` | 1 : N | `claim_documents.claim_id` | `ClaimDocument` | `CascadeType.ALL`, `orphanRemoval=true` | `LAZY` |
| 17 | `Claim` | `ClaimStatusHistory` | 1 : N | `claim_status_histories.claim_id` | `ClaimStatusHistory` | `CascadeType.ALL`, `orphanRemoval=true` | `LAZY` |

Notes:

- **Eager `@ManyToOne` associations (4):** `PolicyPlan.insuranceProduct` (#6), `CoverageOption.policyPlan` (#7), `PricingRule.policyPlan` (#8), and `PremiumPayment.policy` (#14). None declares a `fetch` attribute, so JPA's default `EAGER` applies. All four are `@JsonIgnore`-annotated. [`../06_Backend/Performance.md`](../06_Backend/Performance.md) flags these as per-read overhead and recommends switching them to `LAZY`.
- **Cascade is application-level, not database-level.** Hibernate does not emit `ON DELETE` actions on the FK constraints; when `CascadeType.ALL` + `orphanRemoval` is declared, Hibernate itself issues the child deletes within the transaction. See [`Constraints.md`](Constraints.md).
- **`PolicyPlan → Policy` (#9) carries no cascade.** Policies are never removed wholesale with their plan; the `@OneToMany(mappedBy = "policyPlan")` collection exists for read navigation only.

### Non-association references (plain columns, no FK)

| Owner table | Column | References | Why it is not an FK |
|---|---|---|---|
| `pricing_audit_logs` | `pricing_rule_id` | `pricing_rules.id` | Audit rows must survive pricing-rule changes; the id is captured as text-like configuration anyway. |
| `quotes` | `pricing_rule_id` | `pricing_rules.id` | Snapshot of the pricing version used to compute the quote. |
| `policies` | `pricing_rule_id` | `pricing_rules.id` | Snapshot of the pricing version used at purchase time. |
| `policies` | `quote_id` | `quotes.id` | Originating quote. Uniqueness (one policy per quote) is enforced in the service layer, not by a database constraint. |

## Key relationship chains

### User ↔ customer (1:1, identity to profile)

`AppUser` (`users`) is the auth principal; `Customer` (`customers`) is the owning side via `customers.user_id` (unique). The `AppUser.customer` side is `mappedBy = "user"` with `CascadeType.ALL` + `orphanRemoval`, so a user owns its profile lifecycle. A customer may not exist yet for a newly registered user — the profile is created during registration and completed before any purchase.

### Staff ↔ speciality (1:1)

`StaffSpeciality` (`staff_specialities`) owns the FK `user_id` (unique) back to `users`. Each `ROLE_INTERNAL_STAFF` user gets exactly one `ProductType` speciality, used to gate which product type a staff member may review/issue claims for.

### Refresh tokens → users (N:1)

`RefreshToken` (`refresh_tokens`) holds an opaque, SHA-256-hashed token per active session, with a `user_id` FK, a `token_version` snapshot, and family-revocation metadata (`replaced_by`). The relationship is unidirectional — no collection on `AppUser` — and deliberately has no cascade: tokens are managed (revoked, rotated, purged) by `RefreshTokenRepository` queries and the cleanup scheduler, not by deleting the user.

### Product → plan → coverage / pricing (1:N, catalog spine)

`InsuranceProduct` → `PolicyPlan` is a cascade-all, orphan-removal collection. Each `PolicyPlan` in turn owns `CoverageOption` (cascade-all) and `PricingRule` (no cascade). The `policy_plan_durations` element collection rides on the plan. Pricing rules are versioned per plan and audited in `pricing_audit_logs` via a plain `pricing_rule_id` column.

### Customer → policy (1:N)

`Policy` owns the FKs `customers.customer_id` and `policy_plans.plan_id`. A customer can hold many policies; the duplicate-policy business rules (HEALTH vs non-HEALTH) are enforced by derived queries on `PolicyRepository`, not by database constraints.

### Quote → policy (N:1, then 1:1 logical conversion)

`Quote` is owned by `Customer` and `PolicyPlan`. When a quote is purchased, `PolicyServiceImpl` builds the policy, sets `policies.quote_id = quote.id`, and flips the quote to `USED`. Uniqueness is enforced logically: `validateQuoteForPurchase` rejects any quote whose status is not `CREATED`, so a `USED`/`EXPIRED`/`CANCELLED` quote can never be converted twice. The column itself is not declared unique.

### Policy → payments / claims (1:N)

`Policy` owns `PremiumPayment` and `Claim` collections (cascade-all, orphan-removal). Payments activate the policy (`PENDING_PAYMENT` → `ACTIVE` on first `SUCCESS`) and increment `total_premium_paid`; claims are only permitted on `ACTIVE` policies.

### Claim → documents / history (1:N)

`Claim` owns `ClaimDocument` and `ClaimStatusHistory` (cascade-all, orphan-removal). `ClaimDocument` stores Cloudinary metadata; `ClaimStatusHistory` is an append-only timeline — no update or delete is ever issued against it.

### Plan → durations (ElementCollection)

`PolicyPlan.allowedDurations` is `@ElementCollection(fetch = FetchType.LAZY)` with `@CollectionTable(name = "policy_plan_durations")` and `@Column(name = "duration")`. It produces a join table of `(plan_id, duration)` pairs with no entity class and no surrogate primary key. The `@Version` optimistic locks on `Policy` and `Claim` are described in [`Constraints.md`](Constraints.md).

## Workflow

To trace a relationship end-to-end:

1. Start from the owning entity's `@JoinColumn` (that is the physical FK).
2. Resolve cascade from the opposite `mappedBy` collection on the parent (if one exists).
3. If the target is reached through a plain `Long` column instead of an association, treat it as a snapshot and consult the service layer for its semantics.

## Code References

| What | Path |
|---|---|
| All association annotations | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/*.java` |
| Refresh-token rotation/revocation queries | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/RefreshTokenRepository.java` |
| Quote→policy conversion and validation | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java` |
| Eager-association and N+1 analysis | `../06_Backend/Performance.md` |

## Diagrams

The entity-relationship diagram lives in [`ER_Diagram.md`](ER_Diagram.md). Additional class/domain diagrams are referenced from [`../09_Diagrams/`](../09_Diagrams/).

## Best Practices

- Read associations as two halves: the owning `@JoinColumn` (FK) and the parent's `mappedBy` collection. Only the owning side has cascade semantics on write.
- Keep `@OneToMany` collections lazy; fetch eagerly only via `@EntityGraph` on repository methods (already done for claims in `ClaimRepository`).
- Treat snapshot columns (`pricing_rule_id`, `quote_id`) as immutable copies of the referenced state; never join on them expecting referential integrity.

## Future Improvements

- Convert the four eager `@ManyToOne` associations to `LAZY` and add `@Transactional(readOnly = true)` where needed, per [`../06_Backend/Performance.md`](../06_Backend/Performance.md).
- Promote `policies.quote_id` to a real `@OneToOne` with a unique constraint if the service-layer guarantee needs database enforcement.
- Consider a real FK (or foreign-key index) for `pricing_audit_logs.pricing_rule_id` if audit lookups become hot; see [`Indexing.md`](Indexing.md).

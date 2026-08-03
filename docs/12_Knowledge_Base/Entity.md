# Entity

## What It Is
- JPA entities in `model/*.java` that map Java classes to MySQL tables. There are 16 entities in the domain.
- Each entity uses `@Entity`, `@Table`, `@Id @GeneratedValue`, and `@Enumerated(EnumType.STRING)` for enums; `Policy` and `Claim` carry a `@Version` field for optimistic locking.
- Timestamps are handled with `@CreationTimestamp` and `@UpdateTimestamp`.
- `PolicyPlan.allowedDurations` uses `@ElementCollection` (stored in the `policy_plan_durations` table).

## Why It Is Used
- Object-relational mapping lets the code work with domain objects instead of SQL.
- Relationships (`@OneToOne`, `@OneToMany`, `@ManyToOne`) model the business graph (customer → policies → claims → documents).
- Storing enums as strings keeps the database readable and resilient to enum reordering.

## Where It Is Used in This Project
- `model/AppUser.java`: identity + role + `tokenVersion`; one-to-one with `Customer` and `StaffSpeciality`.
- `model/RefreshToken.java`: SHA-256 `tokenHash`, `jti`, expiry, `revoked`, `replacedBy`, `tokenVersion` snapshot.
- `model/InsuranceProduct.java` → `PolicyPlan` → `CoverageOption` / `PricingRule`: the catalog hierarchy.
- `model/Quote.java`: validated price snapshot with `QuoteStatus` and 30-minute `expiresAt`.
- `model/Policy.java`: pricing snapshot, `PolicyStatus`, `totalPremiumPaid`, optimistic `version`, collections of payments and claims.
- `model/Claim.java`: claim lifecycle with `assignedStaff`, documents, and status-history collections.
- Supporting entities: `Customer`, `StaffSpeciality`, `OtpVerification`, `PremiumPayment`, `ClaimDocument`, `ClaimStatusHistory`, `PricingAuditLog`.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/AppUser.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Policy.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Claim.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Quote.java

## Related Docs
- ../04_Database/Entity_Relationships.md
- ../04_Database/Table_Descriptions.md
- ../04_Database/ER_Diagram.md
- ../01_System_Architecture/Database_Architecture.md

## Common Interview Questions
1. Why are enums stored as `STRING`? — The database holds readable values that survive enum reordering and make raw SQL debugging easier.
2. What is the `@Version` field for? — Optimistic locking: a concurrent update to the same `Policy`/`Claim` row throws `ObjectOptimisticLockingFailureException`, which the `GlobalExceptionHandler` maps to HTTP 409.
3. How many entities exist and where are they listed? — 16 entities in `model/*.java`; the canonical list is in the fact sheet in `docs/CONTRIBUTING.md`.
4. What is `@ElementCollection` used for? — `PolicyPlan.allowedDurations` (a set of integers) is stored in a separate collection table rather than a dedicated entity.
5. How are timestamps maintained? — Hibernate `@CreationTimestamp` and `@UpdateTimestamp` populate `created_date` / `updated_date` automatically.

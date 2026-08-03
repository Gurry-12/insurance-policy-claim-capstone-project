# Cascade

## What It Is
- JPA cascade settings that propagate persistence operations (persist, merge, remove, refresh, detach) from a parent entity to its associated children.
- The project uses `CascadeType.ALL` combined with `orphanRemoval = true` on `@OneToMany` / `@OneToOne` relationships.
- Cascading flows from the **owning** side; the mapped side (`mappedBy = ...`) declares the inverse.

## Why It Is Used
- Saving or deleting an aggregate (e.g., a policy) automatically persists or removes its children (payments, claims) in one graph operation.
- `orphanRemoval` removes children that are dropped from the collection, keeping the collection in sync with the database.
- Avoids manual per-child repository calls for owned sub-entities.

## Where It Is Used in This Project
- `model/AppUser.java`: `@OneToOne(mappedBy = "user", cascade = ALL, orphanRemoval = true)` for `customer` and `staffSpeciality`.
- `model/Policy.java`: `@OneToMany(mappedBy = "policy", cascade = ALL, orphanRemoval = true)` for `payments` and `claims`.
- `model/Claim.java`: `@OneToMany(mappedBy = "claim", cascade = ALL, orphanRemoval = true)` for `claimDocuments` and `claimStatusHistories`.
- `model/InsuranceProduct.java`: cascade ALL on `policyPlans`.
- `model/PolicyPlan.java`: cascade ALL on `coverageOptions`.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Policy.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Claim.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/AppUser.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/InsuranceProduct.java

## Related Docs
- ../04_Database/Entity_Relationships.md
- ../04_Database/Table_Descriptions.md
- ../06_Backend/Repositories.md

## Common Interview Questions
1. What is the difference between cascade and `orphanRemoval`? — Cascade propagates operations to children; `orphanRemoval` deletes children no longer referenced by the parent collection. `CascadeType.ALL` + `orphanRemoval` together mean "persist and delete children with the parent".
2. Which side is the owning side? — The side with `@JoinColumn` (or no `mappedBy`); `mappedBy` marks the inverse side, which does not manage the foreign key.
3. Why cascade on `Policy → payments/claims`? — Payments and claims are owned parts of the policy aggregate, so they persist and are removed with the policy.
4. What is a risk of `CascadeType.ALL`? — A careless `save` can cascade deletes across large graphs; here it is deliberately limited to tightly owned sub-entities.
5. Does cascade apply to queries? — No; cascade affects persistence operations only. Reads are controlled by `FetchType` and query design.

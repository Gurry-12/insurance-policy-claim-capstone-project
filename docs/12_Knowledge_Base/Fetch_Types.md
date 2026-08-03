# Fetch Types

## What It Is
- JPA `FetchType` controls when related data is loaded from the database: `EAGER` loads it immediately with the parent, `LAZY` defers loading until first access.
- The project explicitly sets `FetchType.LAZY` on most associations, overriding the `@ManyToOne` default of EAGER.
- `@OneToMany` collections and `@ElementCollection` fields default to LAZY and are declared LAZY here as well.

## Why It Is Used
- Avoids loading entire object graphs (and their rows) on every read, which prevents performance degradation and the N+1 query problem.
- Lets services load only what a given operation needs.
- Requires associations to be accessed inside an active transaction/session to avoid `LazyInitializationException`.

## Where It Is Used in This Project
- `model/Policy.java`: `payments` and `claims` are `@OneToMany(..., fetch = LAZY)`; `customer`/`policyPlan` are `@ManyToOne(fetch = LAZY)`.
- `model/Claim.java`: `policy`, `claimDocuments`, `claimStatusHistories` are LAZY.
- `model/Quote.java`: `customer` and `policyPlan` are `@ManyToOne(fetch = LAZY)`.
- `model/RefreshToken.java`: `user` is `@ManyToOne(fetch = LAZY)`.
- `model/Customer.java`: `user` is `@OneToOne(fetch = LAZY)`.
- `model/PolicyPlan.java`: `allowedDurations` is `@ElementCollection(fetch = LAZY)`.
- Some simple references keep the default EAGER: `CoverageOption.policyPlan`, `PricingRule.policyPlan`, `PolicyPlan.insuranceProduct`, `PremiumPayment.policy`.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Policy.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Claim.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Quote.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/RefreshToken.java

## Related Docs
- ../04_Database/Entity_Relationships.md
- ../06_Backend/Repositories.md
- ../06_Backend/Services.md

## Common Interview Questions
1. What is the default fetch for `@ManyToOne` vs `@OneToMany`? — `@ManyToOne` defaults to EAGER; `@OneToMany` and `@ElementCollection` default to LAZY. This project makes most associations LAZY explicitly.
2. What is the N+1 problem and how is it avoided? — Lazy collections cause a query per child when accessed in a loop; the code uses `Specification`-based `findAll` and repository-level queries instead of looping over lazy collections.
3. What is `LazyInitializationException`? — Thrown when a lazy association is accessed outside the session/transaction; services keep reads inside `@Transactional` methods.
4. Why keep a few references EAGER? — Simple, always-needed lookups (e.g., a coverage option's plan) avoid extra queries without a meaningful cost.
5. How does LAZY interact with ModelMapper? — Mapping a lazy field outside a transaction can trigger `LazyInitializationException`, so mapping happens inside service transactions.

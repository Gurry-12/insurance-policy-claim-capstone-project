# Coverage Options

## What It Is
- The selectable sum-insured tiers defined per `PolicyPlan`. Each tier is a `CoverageOption` with `coverageAmount`, `label`, `displayOrder`, and `isActive`.
- Coverage is the basis of pricing: `base = coverage × baseRiskRate`, so the chosen option drives the premium.
- A plan exposes a set of coverage options via `PolicyPlan.coverageOptions`.

## Why It Is Used
- Constrains customers to approved coverage tiers instead of arbitrary sums insured.
- Keeps pricing predictable: only tiers that exist on the active plan can be quoted and purchased.
- Administrative control via `isActive` lets the business retire a tier without deleting historical quotes/policies.

## Where It Is Used in This Project
- `model/CoverageOption.java`: entity fields (`coverageAmount`, `label`, `displayOrder`, `isActive`).
- `model/PolicyPlan.java`: `@OneToMany(mappedBy = "policyPlan", cascade = ALL, orphanRemoval = true)` list of coverage options.
- `serviceimpl/PremiumCalculationServiceImpl.java`: rejects a requested coverage amount that does not exactly match an active option; pricing then runs against that amount.
- `serviceimpl/CoverageOptionServiceImpl.java` + `controller/CoverageOptionController.java`: admin management.
- `model/Policy.java`: `selectedCoverage` snapshots the option amount at purchase.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/CoverageOption.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/PolicyPlan.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/CoverageOptionServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumCalculationServiceImpl.java

## Related Docs
- ../02_Business_Domain/Coverage_Options.md
- ../02_Business_Domain/Premium_Calculation.md
- ../04_Database/Entity_Relationships.md

## Common Interview Questions
1. How is the requested coverage validated? — `PremiumCalculationServiceImpl` matches the requested amount against the plan's coverage options; a non-matching or inactive option is rejected.
2. Why is `selectedCoverage` snapshotted on a policy? — So the insured sum and the premium derived from it remain immutable on the issued policy even if options change later.
3. What drives the premium from a coverage option? — The coverage amount feeds `base = coverage × baseRiskRate` from the active pricing rule.
4. How are coverage tiers managed? — Admin services/controllers create, order, and activate/deactivate options per plan.
5. What is the relationship to plans? — Each `PolicyPlan` owns a list of `CoverageOption` rows (cascade ALL), one-to-many from the plan.

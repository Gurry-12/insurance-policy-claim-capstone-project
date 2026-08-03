# Pricing Rules

## What It Is
- The configurable rate/fee/tax parameters used by the premium calculation, attached to a `PolicyPlan` via the `PricingRule` entity.
- Fields: `baseRiskRate` (risk premium multiplier), `processingFee`, `gst`, `effectiveFrom`, `effectiveTo`, `remarks`, and `status` (`ACTIVE` / `INACTIVE`).
- A quote uses the latest ACTIVE pricing rule for the plan at calculation time; the rule id is snapshotted on both `Quote` and `Policy` for auditability.

## Why It Is Used
- Centralizes pricing parameters so rates, fees, and tax can change without code changes.
- Effective dates and ACTIVE/INACTIVE status let the business control when a rule applies.
- The `PricingAuditLog` entity records pricing activity for compliance and traceability.

## Where It Is Used in This Project
- `model/PricingRule.java`: entity fields and validation (`@PositiveOrZero`, `@NotNull`).
- `repository/PricingRuleRepository.java`: `findByPolicyPlanIdAndStatusOrderByIdDesc` selects the most recent ACTIVE rule for a plan.
- `serviceimpl/PremiumCalculationServiceImpl.java`: loads the active rule and passes it to the calculator; throws `BadRequestException` when none exists.
- `serviceimpl/PricingRuleServiceImpl.java` + `controller/PricingRuleController.java`: admin CRUD and status management under `/api/admin/**` and pricing endpoints.
- `model/PricingAuditLog.java`: audit trail of pricing changes.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/PricingRule.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PricingRuleRepository.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PricingRuleServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/PricingAuditLog.java

## Related Docs
- ../02_Business_Domain/Pricing_Rules.md
- ../02_Business_Domain/Premium_Calculation.md
- ../04_Database/Table_Descriptions.md

## Common Interview Questions
1. How is the active pricing rule selected? — `findByPolicyPlanIdAndStatusOrderByIdDesc(planId, ACTIVE)` returns the newest ACTIVE rule; if none exists, quote generation fails with a `BadRequestException`.
2. Why is `pricingRuleId` stored on `Quote` and `Policy`? — It snapshots which rule produced the price, so later recalculation or audit can reproduce the exact figure even if rates change.
3. What fields does a rule contain? — `baseRiskRate`, `processingFee`, `gst`, effective period, remarks, and status.
4. Who manages pricing rules? — Admin endpoints via `PricingRuleController` / `PricingRuleServiceImpl`; changes are audited in `PricingAuditLog`.
5. How do effective dates matter? — `effectiveFrom`/`effectiveTo` bound a rule's validity window; only rules whose status is ACTIVE are considered at quote time.

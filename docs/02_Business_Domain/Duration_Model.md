# Duration Model

> How policy durations are represented (`allowedDurations` as an ElementCollection), validated, and how they scale premiums, plus quote expiry.

## Purpose

Explains the duration dimension of plans and policies: storage, validation, premium scaling for `ONE_TIME`, and the 30-minute quote validity window. Table/constraint detail lives in `../04_Database/Constraints.md` and `../04_Database/ER_Diagram.md`.

## Overview

Durations are expressed in **years**. Each `PolicyPlan` declares the set of durations it supports (`allowedDurations`, e.g. {2, 3, 5}), persisted in a dedicated child table `policy_plan_durations`. Each plan also declares exactly one supported premium type (`supportedPremiumType`: `ONE_TIME` or `ANNUAL`). Duration drives both the policy's `endDate` (`startDate + duration years`) and the premium mathematics, and it can only be changed before policies are issued under that duration.

## Business Context

Policy terms in years are the commercial unit of an insurance offer: the same coverage can be sold for 2, 3, 5, 7, 10, 15, or 20 years, with longer one-time commitments rewarded by a bigger upfront discount. Locking the allowed set per plan prevents invalid tenors, while the duration-sensitive one-time discount encourages customers to commit longer for a lower total cost.

## Technical Design

### Storage

`PolicyPlan.allowedDurations` is a `Set<Integer>` annotated `@ElementCollection(fetch = LAZY)`:

```java
@ElementCollection(fetch = FetchType.LAZY)
@CollectionTable(name = "policy_plan_durations", joinColumns = @JoinColumn(name = "plan_id"))
@Column(name = "duration")
private Set<Integer> allowedDurations = new HashSet<>();
```

This produces the `policy_plan_durations(plan_id, duration)` table. See `../04_Database/Table_Descriptions.md` for column detail.

`supportedPremiumType` is `@Enumerated(EnumType.STRING)` on `PolicyPlan`.

### Validation

| Rule | Enforcement point | Effect |
|---|---|---|
| Duration must be in `allowedDurations` to generate a quote | `PremiumCalculationServiceImpl.generateQuoteInternal` (`contains(duration)`) | 400 `Invalid duration for this plan` |
| Premium type must equal `supportedPremiumType` | `PremiumCalculationServiceImpl.generateQuoteInternal` | 400 `Invalid premium type for this plan` |
| A duration already used by an issued policy cannot be removed from `allowedDurations` on plan update | `PolicyPlanServiceImpl.updatePolicyPlan` (`existsByPolicyPlanIdAndPolicyDuration`) | 400 `Cannot remove duration (N Year(s)) because policies have already been issued under this duration.` |
| Duration must be positive on request DTOs | `PremiumCalculationRequest.duration` `@Positive` | 400 validation error |

### Premium scaling by duration

- **ANNUAL**: `totalPremium = annualPremium` (per year); `totalCommitment = annualPremium × duration`; duration does not discount the per-year price.
- **ONE_TIME**: `totalCommitment = annualPremium × duration` then a duration discount is applied — `totalPremium = totalCommitment − discountAmount` where the discount rate rises with the term (2yr 2%, 3yr 5%, 5yr 8%, 7yr 10%, 10yr 12%, 15yr 15%, 20yr 18%, else 20%). Full math and examples: `Premium_Calculation.md`.

### Policy effect

`Policy.endDate = startDate.plusYears(policyDuration)`; `policyDuration` and `premiumType` are snapshotted at creation (`Policy_Workflow.md`). Annual renewals are bounded by `policyDuration` successful payments (`Business_Rules.md` 4.6).

### Quote expiry

Generated quotes carry `expiresAt = createdAt + 30 minutes` (`PremiumCalculationServiceImpl.generateQuoteInternal`). At purchase/issue time, an expired quote is flipped to `EXPIRED` and rejected; quotes are single-use (`USED` after consumption). See `Business_Rules.md` (1.3, 1.4, 8.x).

## Workflow

1. Admin creates a plan with `allowedDurations` and `supportedPremiumType`.
2. Admin edits the plan; durations in use by issued policies become immutable.
3. Customer requests a quote for a duration in the allowed set; the quote records `duration` and expires in 30 minutes.
4. Policy snapshots `policyDuration`; `endDate = startDate + duration years`.
5. ONE_TIME total scales with duration and discount; ANNUAL scales per year.

## Code References

- `model/PolicyPlan.java` — `allowedDurations` ElementCollection, `supportedPremiumType`.
- `serviceimpl/PremiumCalculationServiceImpl.java` — duration/premium-type validation, quote expiry.
- `serviceimpl/PolicyPlanServiceImpl.java` — duration immutability on update.
- `service/strategy/OneTimePremiumCalculator.java` — duration discount schedule.

All under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Duration table relationship: `../04_Database/ER_Diagram.md`.
- Plan class structure: `../09_Diagrams/Class_Diagrams/`.

## Best Practices

- ElementCollection keeps durations as a simple value set without an extra entity while still being queryable.
- Duration is validated at the service boundary (not only by DTO annotations), and immutability is enforced once real policies depend on it.
- One-time discounting is driven solely by duration, keeping the pricing model explainable.

## Future Improvements

- Allow fractional years (e.g., half-year terms) or month-based durations.
- Auto-expiry scheduler for quotes and policies.
- See `../10_Evaluation/Future_Enhancements.md`.

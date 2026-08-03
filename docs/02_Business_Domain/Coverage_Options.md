# Coverage Options

> The per-plan sum-assured ladder: `CoverageOption` fields, validation bounds, exact-match premium requirement, admin CRUD, and the regenerate endpoint.

## Purpose

Explains how coverage slabs are defined, validated, and consumed by quoting. Entity/column details are in `../04_Database/Table_Descriptions.md`; how a premium must exactly match an active coverage amount is also stated in `Business_Rules.md` (3.4).

## Overview

A `CoverageOption` (`coverage_options` table) represents one purchasable sum-assured tier of a `PolicyPlan` — for example "₹10 Lakhs", "₹25 Lakhs", "₹50 Lakhs". Every option belongs to exactly one plan, carries a `coverageAmount`, a human-readable `label`, a `displayOrder`, and an `isActive` flag. A customer can only quote (and therefore purchase) a coverage amount that exactly equals an **active** option of the selected plan.

## Business Context

Coverage tiers keep product offers structured and prevent free-form sum-assured negotiation in the self-service flow. The exact-match rule means the quoted price always corresponds to a canonical, approved product configuration rather than an arbitrary amount, and it keeps the coverage headroom math for claims deterministic.

## Technical Design

### Entity: `CoverageOption`

| Field | Validation / notes |
|---|---|
| `policyPlan` | `@ManyToOne plan_id`, required |
| `coverageAmount` | `@Positive`, `@NotNull`, `precision 15 scale 2` |
| `label` | `@NotBlank` |
| `displayOrder` | `@NotNull` integer |
| `isActive` | `@NotNull`, default `true` |

### Coverage amount bounds

Enforced by `CoverageOptionServiceImpl.validateCoverageAmount` (create, update, regenerate):

| Rule | Error |
|---|---|
| Must not be null | 400 `Coverage amount cannot be null` |
| ≥ ₹50,000 | 400 `Coverage amount must be at least ₹50,000` |
| ≤ ₹5,00,00,000 (5 Crores) | 400 `Coverage amount cannot exceed ₹5,00,00,000 (5 Crores)` |
| Multiple of ₹50,000 | 400 `Coverage amount must be a multiple of ₹50,000` |

### Exact-match consumption

- `PremiumCalculationServiceImpl.generateQuoteInternal` matches the requested `coverageAmount` to `plan.getCoverageOptions()` by exact `BigDecimal.compareTo == 0` and rejects the quote if absent (`Invalid coverage amount selected`) or if the matched option is inactive (`Selected coverage option is not active`).
- Customers see only active options: `PolicyPlanServiceImpl.viewActivePlans` and `getPlanById` filter out inactive coverage options for `ROLE_CUSTOMER`.

### Admin CRUD

| Operation | Endpoint (all ADMIN) | Behaviour |
|---|---|---|
| Create | `POST /api/admin/policy-plans/{planId}/coverage-options` | Bounds check; `activeStatus` optional (default true) |
| Update | `PUT …/{optionId}` | Option must belong to the plan; changing the amount is blocked if policies were issued under the old amount (`existsByPolicyPlanIdAndSelectedCoverage`); bounds re-checked |
| List | `GET …` | All options for a plan (admin view, includes inactive) |
| Activate | `PATCH …/{optionId}/activate` | `isActive = true` |
| Deactivate | `PATCH …/{optionId}/deactivate` | `isActive = false` |
| Delete | `DELETE …/{optionId}` | Blocked if policies were issued under the option's amount |
| Regenerate | `POST …/regenerate` | Rebuild the ladder (below) |

### Regenerate ladder endpoint

`CoverageOptionServiceImpl.regenerateCoverageOptions(planId, {minCoverage, maxCoverage, incrementStep})`:

1. Validates `minCoverage` and `incrementStep` against the bounds; `maxCoverage ≤ 5 Crores`.
2. Requires `minCoverage < maxCoverage`.
3. Rejects the operation if the resulting tier count exceeds **30** (`Number of coverage tiers cannot exceed 30…`).
4. **Blocks regeneration if any policy exists under the plan** (`Cannot regenerate coverage tiers because policies have already been issued under this plan. You can add custom tiers instead.`).
5. Deletes all existing options for the plan, then generates a new ladder from `minCoverage` stepping by `incrementStep`, with auto labels `₹<n> Lakhs` (rounded `HALF_UP` to 2 decimals on lakhs), sequential `displayOrder` starting at 1, and `isActive = true`.

Note: because regeneration deletes and recreates tiers, the safe order for a plan with existing options is **deactivate first** for any tier you want to retire, then add custom tiers — regeneration is only possible before policies are issued under the plan.

## Workflow

1. Admin creates a plan via `POST /api/plans/wizard` (which creates its coverage options).
2. Admin adjusts the ladder via CRUD, or rebuilds it with `/regenerate` before any policy is issued.
3. Customer selects a plan; the UI shows only active options.
4. Customer requests a quote with a coverage amount that exactly matches an active option; quote and policy snapshot `selectedCoverage`.

## Code References

- `serviceimpl/CoverageOptionServiceImpl.java` — CRUD, bounds, regenerate.
- `model/CoverageOption.java` — entity.
- `serviceimpl/PremiumCalculationServiceImpl.java` — exact-match validation at quote time.
- `serviceimpl/PolicyPlanServiceImpl.java` — customer-facing filtering of inactive options.

All under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Coverage ↔ plan ↔ policy relationships: `../04_Database/ER_Diagram.md` and `../09_Diagrams/ER_Diagrams/`.

## Best Practices

- First-class tiers (rather than free-form amounts) make quoting and claims headroom deterministic.
- Hard bounds (₹50k–₹5Cr, multiples of ₹50k, ≤ 30 tiers) prevent nonsensical product configurations.
- In-use tiers are protected from deletion/amount-change once policies exist, preserving contract integrity.

## Future Improvements

- Soft-deactivate-only mode for regeneration (keep labels, disable) instead of hard delete.
- See `../10_Evaluation/Future_Enhancements.md`.

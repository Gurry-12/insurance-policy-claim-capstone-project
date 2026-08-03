# Pricing Flow

> The pricing-rule lifecycle: admin creates or updates a rule for a plan, the change is audit-logged, one active rule per plan governs quote generation, admins preview premium impact, and customer quotes consume the active rule.

## Purpose

Explains how a `PricingRule` moves from creation to production and how it feeds customer pricing. The rule semantics, defaults, and one-active-rule invariant are authoritative in `../02_Business_Domain/Pricing_Rules.md`; the premium mathematics in `../02_Business_Domain/Premium_Calculation.md`; the API contracts in `../03_API/Pricing_API.md`.

## Overview

A pricing rule holds the three actuarial inputs (`baseRiskRate`, `processingFee`, `gst` percentage) plus an `effectiveFrom`/`effectiveTo` window, a status (`ACTIVE`/`INACTIVE`), and remarks. Admins create rules per plan, and the system enforces **exactly one active rule per plan**. Every create/update/activate/deactivate writes a `PricingAuditLog` entry capturing the new configuration, remarks, and the operator's email. The active rule is what `POST /api/premium/calculate` uses to produce a customer quote; `POST /api/admin/pricing-rules/preview` lets the admin estimate a rule's premium effect before switching it on.

## Business Context

Pricing is the actuarial lever: rates must be changeable (a motor risk rate rise, a fee change) without retroactively mutating contracts. That is achieved by versioning rules as rows and snapshotting the rule's inputs into each quote and policy. The one-active-rule invariant guarantees a plan never prices ambiguously, and the audit log satisfies the "who changed what, when" regulatory need.

## Technical Design

### Rule inputs and defaults

| Input | Meaning |
|---|---|
| `baseRiskRate` | risk rate multiplied by coverage to give the base premium |
| `processingFee` | fixed fee added per year |
| `gst` | GST percentage applied to the taxable amount |

If a create request omits any of these, product-type defaults apply (`PricingRuleServiceImpl.applyDefaults`): HEALTH 0.025 / 100.00 / 0.00, MOTOR 0.030 / 150.00 / 18.00, TRAVEL 0.015 / 50.00 / 18.00, LIFE 0.008 / 200.00 / 0.00, INSURANCE 0.020 / 100.00 / 18.00.

### One-active-rule-per-plan behaviour (code-verified)

- **Create** (`POST /api/admin/pricing-rules`): if the plan has no `ACTIVE` rule, the new rule is created `ACTIVE`; otherwise it is created `INACTIVE`. `effectiveFrom` defaults to now; `effectiveTo` is optional.
- **Activate** (`PATCH /{ruleId}/activate`): fails with `An active pricing rule already exists for this plan…` unless the existing active rule is deactivated first — the swap is explicit.
- **Deactivate** (`PATCH /{ruleId}/deactivate`): sets `INACTIVE`; fails if already inactive.
- **Lookup**: quote generation and `GET /api/admin/pricing-rules/plan/{planId}/active` use `findByPolicyPlanIdAndStatusOrderByIdDesc(planId, ACTIVE)` and take the first (highest-id) row.
- **Update** (`PUT /{ruleId}`): the rule cannot move to another plan (`Cannot change plan of existing pricing rule`); inputs, effective window, and remarks are replaced.
- **Delete** (`DELETE /{ruleId}`): blocked with 400 while any quote or policy references the rule.

### Effective dates

`effectiveFrom` (required) and `effectiveTo` (optional) define the rule's intended validity window. Note that the system does not yet auto-activate on `effectiveFrom` or auto-expire on `effectiveTo` — activation is an explicit admin action and the `ACTIVE` status is what the quote path checks. This is a documented future improvement.

### Audit log

`PricingAuditLog` rows are written on create/update/activate/deactivate with `pricingRuleId`, `newConfiguration` (JSON snapshot of the full rule), `remarks` ("Activated", "Deactivated", or the operator's remarks), `changedBy` (email), `changedAt`. History is read via `GET /{ruleId}/history` (newest first).

### Premium preview (admin)

`POST /api/admin/pricing-rules/preview` requires the rule to be `ACTIVE` and returns a simplified `PremiumQuote` for a coverage/duration combination. Its math is an approximation (`basePremium = coverage × rate`; `gst = processingFee × gst%`; totals per premium type) — it is a "what-if" for configuring rules and is **not** the pricing used for real quotes. Authoritative quote math is `../02_Business_Domain/Premium_Calculation.md`.

### Consumption by customer quotes

`PremiumCalculationServiceImpl.generateQuoteInternal`:
1. Validates the plan/product are active, duration allowed, premium type supported, coverage matches an active option.
2. Reads the plan's highest-id `ACTIVE` rule; none → 400 `No active pricing rule found for this plan`.
3. `PremiumCalculatorFactory` resolves the strategy (`ONE_TIME`/`ANNUAL`) which computes the premium from `baseRiskRate`, `processingFee`, `gst` with `BigDecimal` HALF_UP rounding.
4. The quote persists a snapshot: `planVersion`, `pricingRuleId`, `riskRate`, `processingFee`, `gst`, premium, and total.

## Workflow

1. **Create** — plan detail/pricing screen → `POST /api/admin/pricing-rules` (plan, inputs or defaults, effective window, remarks). If no active rule exists for the plan, the rule starts `ACTIVE`; otherwise `INACTIVE`. Audit row written.
2. **List / inspect** — `GET /api/admin/pricing-rules?planId=&status=`; `GET /api/admin/pricing-rules/{ruleId}`; `GET /api/admin/pricing-rules/plan/{planId}/active` to see what customers currently price against.
3. **Preview** — `POST /api/admin/pricing-rules/preview` to estimate the premium impact of a rule on a coverage/duration.
4. **Update** — `PUT /api/admin/pricing-rules/{ruleId}` to revise inputs within the same plan; audit row written. Existing quotes/policies keep their snapshots.
5. **Swap** — deactivate the current active rule (`PATCH .../deactivate`), then activate the replacement (`PATCH .../activate`) — activation is rejected while another rule is active.
6. **Audit** — `GET /api/admin/pricing-rules/{ruleId}/history` for the change trail.
7. **Consume** — customers generate quotes (`POST /api/premium/calculate`) against the active rule; the resulting quote carries the pricing snapshot and a `pricingRuleId` that is copied to the purchased policy.

```mermaid
flowchart LR
    Admin([Admin]) --> Create[POST /api/admin/pricing-rules]
    Create --> Check{Plan has an\nACTIVE rule?}
    Check -- no --> Active[Rule created ACTIVE]
    Check -- yes --> Inactive[Rule created INACTIVE]
    Active --> Audit[PricingAuditLog written]
    Inactive --> Audit
    Audit --> Preview[POST .../preview : premium what-if]
    Audit --> Swap[Deactivate current -> activate new]
    Swap --> ActiveRule[Highest-id ACTIVE rule for the plan]

    ActiveRule --> Calc[POST /api/premium/calculate]
    Calc --> Quote[Quote + pricing snapshot\nplanVersion, pricingRuleId, riskRate, fee, gst, total]
    Quote --> Policy[Policy stores the same snapshot]

    subgraph Audit trail
        Audit --> History[GET .../{ruleId}/history]
    end
```

## Code References

- `controller/PricingRuleController.java` — full admin rule lifecycle + preview.
- `serviceimpl/PricingRuleServiceImpl.java` — defaults, one-active-rule logic, activation/deactivation, delete guards, preview, audit logging.
- `serviceimpl/PremiumCalculationServiceImpl.java` — active-rule lookup for customer quotes.
- `model/{PricingRule,PricingAuditLog,Quote,Policy}.java`, `enums/PricingRuleStatus.java`, `enums/PremiumType.java`.
- Frontend: plan detail and pricing management screens under `src/pages/admin/plans/**`.

All backend paths under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Full lifecycle narrative: `../02_Business_Domain/Pricing_Rules.md`.
- Premium strategy math: `../02_Business_Domain/Premium_Calculation.md`.
- Entity relationships (rule ↔ plan ↔ quote ↔ policy): `../04_Database/ER_Diagram.md`.
- Activity diagrams: `../09_Diagrams/Activity_Diagrams/`.

## Best Practices

- The explicit "deactivate first, then activate" protocol makes repricing a deliberate, two-step act and prevents surprise pricing changes.
- Versioned rules plus quote/policy snapshots mean catalogue changes never mutate in-force contracts.
- The audit log records the full new configuration and the operator on every change — a complete regulatory trail.
- Delete is blocked once a rule is referenced, so historical pricing integrity is preserved.

## Future Improvements

- Effective-dated auto-activation (a scheduled job flips a rule `ACTIVE` when `effectiveFrom` arrives) and auto-expiry at `effectiveTo`.
- Populate `oldConfiguration` in the audit log (the column already exists).
- Rule dry-run comparisons across candidate rules before switching.
- See `../10_Evaluation/Future_Enhancements.md`.

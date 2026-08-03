# Pricing Rules

> The lifecycle and semantics of `PricingRule`: actuarial inputs, one-active-rule-per-plan behaviour, activation/deactivation, the pricing audit log, and the preview endpoint.

## Purpose

Explains how pricing rules are created, updated, activated, deactivated, audited, and previewed. Rule mechanics are code-verified against `PricingRuleServiceImpl`; the premium mathematics they feed are authoritative in `Premium_Calculation.md`; API contracts in `../03_API/Pricing_API.md`; operational flow in `../08_Workflows/Pricing_Flow.md`.

## Overview

A `PricingRule` (`pricing_rules` table) holds the three actuarial inputs used to price any coverage amount on a plan: `baseRiskRate`, `processingFee`, and `gst` (percentage). Rules are versioned by row (with `effectiveFrom`/`effectiveTo` windows) and carry a `PricingRuleStatus` (`ACTIVE`/`INACTIVE`). Each plan has **exactly one ACTIVE rule at a time**; quote generation always uses the highest-id active rule.

## Business Context

Pricing is the actuarial lever of the business. Admins must be able to change prices (e.g., raise a motor risk rate) without rewriting history — quotes and policies already created keep their own snapshots. The one-active-rule invariant prevents ambiguous pricing, and the audit log preserves who changed what and when for regulatory review.

## Technical Design

### Entity: `PricingRule`

| Field | Validation / notes |
|---|---|
| `policyPlan` | `@ManyToOne plan_id`, required |
| `baseRiskRate` | `@PositiveOrZero`, `precision 10 scale 4` |
| `processingFee` | `@PositiveOrZero`, `precision 15 scale 2` |
| `gst` | `@PositiveOrZero`, `precision 5 scale 2` (percentage) |
| `remarks` | max 500 chars |
| `effectiveFrom` | required `LocalDateTime` |
| `effectiveTo` | optional `LocalDateTime` |
| `status` | `PricingRuleStatus` {ACTIVE, INACTIVE}, default ACTIVE |
| `createdDate` | auto timestamp |

### Defaults on create

If `baseRiskRate`, `processingFee`, and `gst` are all provided in the request they are used verbatim; otherwise defaults are applied by product type (`PricingRuleServiceImpl.applyDefaults`):

| ProductType | baseRiskRate | processingFee | gst |
|---|---|---|---|
| HEALTH | 0.025 | 100.00 | 0.00 |
| MOTOR | 0.030 | 150.00 | 18.00 |
| TRAVEL | 0.015 | 50.00 | 18.00 |
| LIFE | 0.008 | 200.00 | 0.00 |
| INSURANCE (default) | 0.020 | 100.00 | 18.00 |

### One-active-rule-per-plan behaviour

- **Create**: if the plan has no ACTIVE rule, the new rule is created `ACTIVE`; otherwise it is created `INACTIVE`.
- **Activate**: `PATCH /api/admin/pricing-rules/{id}/activate` fails with `An active pricing rule already exists…` unless the plan's existing active rule is deactivated first. This makes the swap explicit.
- **Deactivate**: `PATCH …/deactivate` sets `INACTIVE`; fails if already inactive.
- **Lookup**: quote generation and `GET …/plan/{planId}/active` use `findByPolicyPlanIdAndStatusOrderByIdDesc(planId, ACTIVE)` and take the first (highest-id) row.
- **Delete**: `DELETE …/{id}` is blocked with 400 if the rule is referenced by any quote (`existsByPricingRuleId`) or policy (`existsByPricingRuleId`).

### Update

`PUT /api/admin/pricing-rules/{id}` cannot move a rule to another plan (`Cannot change plan of existing pricing rule`). Fields `baseRiskRate`, `processingFee`, `gst`, `effectiveFrom`, `effectiveTo`, `remarks` are replaced. Existing quotes/policies are unaffected (they hold snapshots).

### PricingAuditLog

`pricing_audit_logs` records on every create/update/activate/deactivate:

| Field | Notes |
|---|---|
| `pricingRuleId` | FK to the rule |
| `oldConfiguration` | TEXT JSON of the prior configuration (column exists; currently not populated by the service) |
| `newConfiguration` | TEXT JSON of the full current configuration (always written) |
| `remarks` | max 500 chars ("Activated", "Deactivated", or the caller's remarks) |
| `changedBy` | authenticated user email |
| `changedAt` | auto timestamp |

History is read via `GET …/history` ordered by `changedAt` descending. Full column definitions: `../04_Database/Table_Descriptions.md`.

### Preview endpoint

`POST /api/admin/pricing-rules/preview` requires the rule to be `ACTIVE` and returns a simplified `PremiumQuote` used to sanity-check a rule's effect on a coverage/duration combination. Its math is an approximation (documented in `Premium_Calculation.md` "Admin / preview variants") and is not used to price real quotes.

## Workflow

1. **Create** — `POST /api/admin/pricing-rules` (admin): plan lookup → set inputs (or product defaults) → effective window → status by one-active rule → save → audit log.
2. **List** — `GET /api/admin/pricing-rules?planId=&status=` (paginated, sortable).
3. **View active** — `GET /api/admin/pricing-rules/plan/{planId}/active`.
4. **Update** — `PUT …/{id}` (plan immutable) → save → audit log.
5. **Deactivate then activate** — `PATCH …/{id}/deactivate` → `PATCH …/{newId}/activate` (activation rejected while another rule is active).
6. **Preview** — `POST …/preview` to estimate premium impact before switching rules.
7. **Delete** — blocked if referenced by quotes or policies.
8. **Audit** — `GET …/{id}/history`.

## Code References

- `serviceimpl/PricingRuleServiceImpl.java` — all lifecycle operations, defaults, preview, audit.
- `model/PricingRule.java`, `model/PricingAuditLog.java`.
- `enums/PricingRuleStatus.java`.
- `repository/PricingRuleRepository.java` — active-rule lookup.

All under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Pricing flow: `../08_Workflows/Pricing_Flow.md` and `../09_Diagrams/Activity_Diagrams/`.
- Pricing rule ↔ plan ↔ quote relationships: `../04_Database/ER_Diagram.md`.

## Best Practices

- Explicit one-active-rule invariant with a clear "deactivate first, then activate" protocol prevents surprise repricing.
- Versioned rules + quote/policy snapshots mean catalogue price changes never mutate in-force contracts.
- Full audit trail per change supports regulatory "who, what, when".

## Future Improvements

- Populate `oldConfiguration` in the audit log (column already exists).
- Effective-dated auto-activation via a scheduled job when `effectiveFrom` arrives.
- See `../10_Evaluation/Future_Enhancements.md`.

# Premium Calculation

> The authoritative premium mathematics: base risk premium, processing fee, GST, duration discounts, and HALF_UP rounding, exactly as implemented in the strategy classes.

## Purpose

Single source of truth for how premiums are computed. All other documents — quotes, policies, payments, pricing previews — reference this file rather than re-deriving the math.

## Overview

A premium is computed from a coverage amount using the plan's active `PricingRule` inputs (`baseRiskRate`, `processingFee`, `gst`), the requested duration, and the plan's `PremiumType` (`ONE_TIME` or `ANNUAL`). The computation is implemented by two strategy classes selected by `PremiumCalculatorFactory`: `AnnualPremiumCalculator` and `OneTimePremiumCalculator`.

## Business Context

Deterministic, audit-safe pricing is non-negotiable in insurance. Every step rounds with `BigDecimal` and `RoundingMode.HALF_UP`, so the exact amount quoted is the exact amount a customer must pay — payment validation is an exact equality against `calculatedPremium` (see `Business_Rules.md` 4.1).

## Technical Design

### Shared annual calculation (both strategies)

Let `coverage` = selected coverage amount, `rate` = `baseRiskRate`, `fee` = `processingFee`, `gstPct` = `gst` percentage.

1. **Base risk premium** (rounded to 0 decimals):
   `base = round(coverage × rate)` (HALF_UP)
2. **Processing fee** (rounded to 0 decimals): `processingFee = round(fee)`
3. **Taxable amount** (per year): `taxable = base + processingFee`
4. **GST** (rounded to 0 decimals): `gst = round(taxable × gstPct / 100)`
5. **Annual premium** (cost per year): `annualPremium = taxable + gst`
6. **Total commitment** over the full duration (rounded to 0 decimals): `totalCommitment = round(annualPremium × duration)`

> Note: the `gst` percentage is a field of the active `PricingRule`. Seed defaults by product type: HEALTH 0.00%, LIFE 0.00%, MOTOR/TRAVEL/INSURANCE 18.00%. The canonical "18% GST" applies whenever the product type's rule carries 18.

### ANNUAL

`totalPremium = annualPremium` (cost per year). The customer pays `annualPremium` each year, up to `policyDuration` payments. No lump-sum discount is applied: `discountPercentage = 0`, `discountAmount = 0`.

### ONE_TIME

`totalCommitment = annualPremium × duration`, then:

7. **Duration discount rate** `d` from the schedule below.
8. **Discount amount** (rounded to 0 decimals): `discountAmount = round(totalCommitment × d)`
9. **Final one-time premium** (rounded to 0 decimals):
   `totalPremium = totalCommitment − discountAmount`

Equivalently `totalPremium = annualPremium × duration × (1 − d)`, computed with intermediate rounding.

### Duration discount schedule (`OneTimePremiumCalculator.getDurationDiscountRate`)

| Duration (years) | Discount rate |
|---|---|
| ≤ 1 | 0% |
| 2 | 2% |
| 3 | 5% |
| 5 | 8% |
| 7 | 10% |
| 10 | 12% |
| 15 | 15% |
| 20 | 18% |
| else | 20% |

### Rounding

Every `setScale` in both calculators uses `RoundingMode.HALF_UP` at scale 0 (whole rupees). Money fields are stored `precision 15, scale 2`.

### Admin / preview variants

- **Admin quote**: `POST /api/premium/admin/calculate` (`AdminPremiumCalculationRequest`) calls the same `generateQuoteInternal` and therefore the same strategy math on behalf of a customer.
- **Pricing preview**: `POST /api/admin/pricing-rules/preview` (`PricingRuleServiceImpl.previewPremium`) is a lightweight, deliberately simplified estimate (`basePremium = coverage × rate`; `gst = processingFee × gstPct`; one-time total = `base + fee + gst`, annual total = `base × duration + fee + gst`). It is **not** the pricing used for quotes/policies — treat it as a quick "what-if" for admins configuring rules. Authoritative quote math is this document.

## Workflow

1. Customer/admin selects plan, coverage, duration, premium type.
2. `PremiumCalculationServiceImpl.generateQuoteInternal` validates plan/product active, duration in `allowedDurations`, premium type supported, coverage matches an active `CoverageOption`, and an active `PricingRule` exists.
3. `PremiumCalculatorFactory.getCalculator(premiumType)` resolves the strategy bean (`ONE_TIME_CALCULATOR` / `ANNUAL_CALCULATOR`).
4. Strategy computes the `PremiumQuote`; a `Quote` row is persisted with `premium = annualPremium` and `total = totalPremium`, expiring in 30 minutes.
5. `Policy.calculatedPremium` = quote `total`; payment must equal it exactly.

### Worked example 1 — ONE_TIME, MOTOR

`coverage = 10,00,000`, `rate = 0.030`, `fee = 150`, `gstPct = 18`, `duration = 3`.

- base = 10,00,000 × 0.030 = **30,000**
- processingFee = **150**
- taxable = 30,000 + 150 = **30,150**
- gst = 30,150 × 18 / 100 = 5,427.0 → **5,427**
- annualPremium = 30,150 + 5,427 = **35,577**
- totalCommitment = 35,577 × 3 = **106,731**
- discount (3 yr = 5%) = 106,731 × 0.05 = 5,336.55 → **5,337**
- **totalPremium = 106,731 − 5,337 = 101,394**

### Worked example 2 — ANNUAL, LIFE

`coverage = 50,00,000`, `rate = 0.008`, `fee = 200`, `gstPct = 0`, `duration = 10`.

- base = 50,00,000 × 0.008 = **40,000**
- processingFee = **200**
- taxable = **40,200**
- gst = 40,200 × 0 / 100 = **0**
- annualPremium = **40,200**
- totalCommitment = 40,200 × 10 = **402,000**
- discount = **0**
- **totalPremium (per year) = 40,200**

### Worked example 3 — ONE_TIME, HEALTH

`coverage = 5,00,000`, `rate = 0.025`, `fee = 100`, `gstPct = 0`, `duration = 2`.

- base = 5,00,000 × 0.025 = **12,500**
- processingFee = **100**
- taxable = **12,600**
- gst = **0**
- annualPremium = **12,600**
- totalCommitment = 12,600 × 2 = **25,200**
- discount (2 yr = 2%) = 25,200 × 0.02 = **504**
- **totalPremium = 25,200 − 504 = 24,696**

## Code References

- `service/strategy/PremiumCalculator.java` — strategy interface.
- `service/strategy/AnnualPremiumCalculator.java` — ANNUAL math.
- `service/strategy/OneTimePremiumCalculator.java` — ONE_TIME math and discount schedule.
- `service/strategy/PremiumCalculatorFactory.java` — strategy resolution.
- `serviceimpl/PremiumCalculationServiceImpl.java` — orchestration, validation, quote persistence.
- `serviceimpl/PricingRuleServiceImpl.java` — `previewPremium` (approximation only).

All under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

Implementation detail: `../06_Backend/Premium_Calculation_Service.md`.

## Diagrams

- Quote generation sequence: `../09_Diagrams/Sequence_Diagrams/`.
- Premium strategy class structure: `../09_Diagrams/Class_Diagrams/`.

## Best Practices

- Single calculation path (strategy pattern) keeps ONE_TIME and ANNUAL consistent and testable.
- All money arithmetic is `BigDecimal` with explicit `HALF_UP` rounding — no floating point.
- The strategy beans are selected by name (`ONE_TIME_CALCULATOR`/`ANNUAL_CALCULATOR`), so adding a premium type is a new component + bean name.

## Future Improvements

- Move discount schedule to configuration so rates can change without code changes.
- Explicit rounding-scale configuration and a full pricing engine.
- See `../10_Evaluation/Future_Enhancements.md`.

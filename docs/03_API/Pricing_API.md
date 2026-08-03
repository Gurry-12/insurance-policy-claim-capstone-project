# Pricing API

> Admin pricing-rule management under `/api/admin/pricing-rules` (CRUD, activate/deactivate, preview) and premium-quote calculation under `/api/premium` for customers and staff/admin.

## Purpose

Reference for the pricing-rule CRUD API, the premium preview endpoint, and the premium-calculation (quote) endpoints, including the `PremiumCalculationRequest`, `AdminPremiumCalculationRequest`, and `PremiumQuote` shapes and the quote expiry rule.

## Overview

Pricing rules encode the financial parameters of a plan: `baseRiskRate`, `processingFee`, and `gst`. Quotes are generated from an active pricing rule and are persisted with a `quoteId` and a 30-minute expiry. Base URL: `http://localhost:8081/api`.

## Business Context

Premium mathematics — `base = coverage × baseRiskRate`, `taxable = base + processingFee`, `gst = 18% of taxable`, ANNUAL vs ONE_TIME totals and duration discounts — is defined in `../02_Business_Domain/Premium_Calculation.md` and summarized in `../02_Business_Domain/Business_Rules.md`.

## Technical Design

### Pricing-rule endpoint matrix

All under `/api/admin/pricing-rules`, **ADMIN only** (`@PreAuthorize("hasRole('ADMIN')")`).

| Method | Path | Response envelope | Notes |
|---|---|---|---|
| POST | `/api/admin/pricing-rules` | `ApiResponseDTO<PricingRuleResponseDTO>` | `201 Created` |
| PUT | `/api/admin/pricing-rules/{ruleId}` | `ApiResponseDTO<PricingRuleResponseDTO>` | |
| GET | `/api/admin/pricing-rules/{ruleId}` | `ApiResponseDTO<PricingRuleResponseDTO>` | |
| GET | `/api/admin/pricing-rules` | `ApiResponseDTO<PageResponseDTO<PricingRuleResponseDTO>>` | `planId`, `status` filters |
| PATCH | `/api/admin/pricing-rules/{ruleId}/activate` | `ApiResponseDTO<PricingRuleResponseDTO>` | |
| PATCH | `/api/admin/pricing-rules/{ruleId}/deactivate` | `ApiResponseDTO<PricingRuleResponseDTO>` | |
| DELETE | `/api/admin/pricing-rules/{ruleId}` | `ApiResponseDTO<Void>` | Blocked if referenced by quotes/policies |
| GET | `/api/admin/pricing-rules/{ruleId}/history` | `ApiResponseDTO<List<PricingAuditLog>>` | |
| GET | `/api/admin/pricing-rules/plan/{planId}/active` | `ApiResponseDTO<PricingRuleResponseDTO>` | |
| POST | `/api/admin/pricing-rules/preview` | `ApiResponseDTO<PremiumQuote>` | Preview, no quote persisted |

### Pricing-rule create/update — `PricingRuleRequestDTO`

```json
{
  "planId": 3,
  "baseRiskRate": 0.0180,
  "processingFee": 450.00,
  "gst": 18.00,
  "effectiveFrom": "2026-08-03T00:00:00",
  "effectiveTo": null,
  "remarks": "Demo pricing rule."
}
```

Validation: `baseRiskRate`, `processingFee`, `gst` must be positive-or-zero. `gst` is a percentage (0–100). `effectiveFrom`/`effectiveTo` are optional.

### Premium preview — `PricingPreviewRequestDTO`

`POST /api/admin/pricing-rules/preview` computes a quote **without persisting it** (no `quoteId`). Note it takes `productId` + `pricingRuleId`, not `planId`:

```json
{
  "productId": 2,
  "coverageAmount": 500000.00,
  "duration": 2,
  "premiumType": "ANNUAL",
  "pricingRuleId": 3
}
```

### Premium-calculation endpoints

| Method | Path | Role | Request | Notes |
|---|---|---|---|---|
| POST | `/api/premium/calculate` | CUSTOMER | `PremiumCalculationRequest` | Persists a `Quote`, returns `quoteId` |
| POST | `/api/premium/admin/calculate` | ADMIN, INTERNAL_STAFF | `AdminPremiumCalculationRequest` | Adds `customerId` |

`PremiumCalculationRequest`:

```json
{
  "planId": 1,
  "coverageAmount": 1000000.00,
  "duration": 1,
  "premiumType": "ANNUAL"
}
```

`AdminPremiumCalculationRequest` (identical plus `customerId`):

```json
{
  "customerId": 2,
  "planId": 3,
  "coverageAmount": 500000.00,
  "duration": 1,
  "premiumType": "ANNUAL"
}
```

Validation: `planId` and `premiumType` required; `coverageAmount` and `duration` required and positive.

### Quote validation rules

Before a quote is produced, all of the following must hold (from `PremiumCalculationServiceImpl`):

- The plan and its product are active.
- `duration` ∈ plan `allowedDurations`.
- `premiumType` equals the plan `supportedPremiumType`.
- `coverageAmount` **exactly** matches an **active** coverage option of the plan.
- At least one `ACTIVE` pricing rule exists for the plan (the latest by id is used).

### Response — `PremiumQuote`

```json
{
  "message": "Quote generated successfully",
  "success": true,
  "data": {
    "quoteId": 8,
    "selectedCoverage": 1000000.00,
    "duration": 1,
    "premiumType": "ANNUAL",
    "basePremium": 18000.00,
    "annualPremium": 18540.00,
    "processingFee": 450.00,
    "gst": 90.00,
    "totalCommitment": 18540.00,
    "discountPercentage": 0,
    "discountAmount": 0.00,
    "oneTimeDiscount": 0.00,
    "totalPremium": 18540.00,
    "expiresAt": "2026-08-03T10:30:00",
    "status": "CREATED"
  },
  "timeStamp": "2026-08-03T10:00:00"
}
```

Field notes:

- `basePremium` = coverage × baseRiskRate.
- `annualPremium` = base + processingFee (+ GST).
- ANNUAL: `totalPremium` = annualPremium; ONE_TIME: `totalPremium` = annualPremium × duration × (1 − durationDiscount).
- `totalCommitment` is the annual commitment before any one-time discount.
- `discountPercentage`/`discountAmount`/`oneTimeDiscount` are non-zero for multi-year ONE_TIME quotes.
- `expiresAt` = creation + **30 minutes**.
- `status` = `CREATED` (a `QuoteStatus` enum value).

### Quote expiry

Quotes persist with status `QuoteStatus.CREATED` and `expiresAt = now + 30 minutes`. On policy purchase (`POST /api/policies/purchase` or `/issue`), the service validates:

1. The quote belongs to the purchasing customer.
2. `quote.status == CREATED` (not `USED`, `EXPIRED`, or `CANCELLED`).
3. `quote.expiresAt` is still in the future — otherwise the quote is flipped to `EXPIRED` and the purchase is rejected with `400`.

After a successful purchase the quote is marked `USED`. Quote statuses: `CREATED`, `USED`, `EXPIRED`, `CANCELLED`.

## Workflow

1. Admin defines pricing: `POST /api/admin/pricing-rules`, then `PATCH .../activate`.
2. Admin sanity-checks numbers without persisting: `POST /api/admin/pricing-rules/preview`.
3. Customer requests a quote: `POST /api/premium/calculate`.
4. Staff/admin quote on a customer's behalf: `POST /api/premium/admin/calculate`.
5. The returned `quoteId` is used by `POST /api/policies/purchase`.

## Code References

| Concern | Path |
|---|---|
| Pricing rule controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PricingRuleController.java` |
| Premium calculation controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PremiumCalculationController.java` |
| Calculation service | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumCalculationServiceImpl.java` |
| Pricing rule service | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PricingRuleServiceImpl.java` |
| Request DTOs | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/{PricingRuleRequestDTO,PricingPreviewRequestDTO}.java` |
| Premium DTOs | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/{PremiumCalculationRequest,AdminPremiumCalculationRequest,PremiumQuote}.java` |
| Calculator strategies | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/` |
| Sample payloads | `demo-data/api-test-payloads/06-pricing-rules.md`, `07-premium-calculation.md` |

## Diagrams

The pricing-rule audit trail and quote lifecycle are described in `../04_Database/Table_Descriptions.md`.

## Best Practices

- Preview is deliberately non-persisting, keeping admin exploration side-effect free.
- Quotes are single-use (CREATED → USED) and time-boxed (30 min), preventing stale pricing.
- Pricing rule changes are captured in `PricingAuditLog` and versioned via plan `planVersion`/`pricingRuleId` on the policy.
- Calculator strategy classes isolate ANNUAL vs ONE_TIME math.

## Future Improvements

- Consider automatic expiry sweeps for stale `CREATED` quotes.
- Link to `../10_Evaluation/Future_Enhancements.md`.

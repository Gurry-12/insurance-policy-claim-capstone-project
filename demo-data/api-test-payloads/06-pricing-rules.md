# Pricing Rules API — Request Payloads

Request bodies for pricing-rule endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/admin/pricing-rules

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN (Bearer token) |
| Description | Create a pricing rule for a plan. `gst` is a percentage (0–100). Effective range optional. |

**Body**

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

## PUT /api/admin/pricing-rules/{ruleId}

| Field | Value |
|---|---|
| Method | `PUT` |
| Auth | ADMIN (Bearer token) |
| Description | Update a pricing rule (seeded `ruleId` 1–6). |

**Body**

```json
{
  "planId": 3,
  "baseRiskRate": 0.0170,
  "processingFee": 450.00,
  "gst": 18.00,
  "effectiveFrom": "2026-08-03T00:00:00",
  "effectiveTo": null,
  "remarks": "Updated demo pricing rule."
}
```

## PATCH /api/admin/pricing-rules/{ruleId}/activate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Activate a pricing rule. |

**Body:** none

## PATCH /api/admin/pricing-rules/{ruleId}/deactivate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Deactivate a pricing rule. |

**Body:** none

## GET /api/admin/pricing-rules/plan/{planId}/active

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN (Bearer token) |
| Description | Get the active pricing rule for a plan (seeded `planId` 1–6 → one rule each). |

**Body:** none

## POST /api/admin/pricing-rules/preview

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN (Bearer token) |
| Description | Preview premium for a plan without creating a quote. **NOTE:** this takes `productId` + `pricingRuleId` (not `planId`). |

**Body**

```json
{
  "productId": 2,
  "coverageAmount": 500000.00,
  "duration": 2,
  "premiumType": "ANNUAL",
  "pricingRuleId": 3
}
```

# Plans API — Request Payloads

Request bodies for plan endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/plans/wizard

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN (Bearer token) |
| Description | Create a plan + coverage options + pricing rule in one call. `allowedDurations` are stored in `policy_plan_durations`; coverage amounts must match one of the `coverageOptions` for the premium calculator. Note the nested structure: `planDetails` / `coverageOptions[]` / `pricingRule`. |

**Body**

```json
{
  "planDetails": {
    "productId": 2,
    "planName": "Drive Safe Pro",
    "allowedDurations": [1, 2, 3],
    "supportedPremiumType": "ANNUAL",
    "termsAndConditions": "Own damage and third-party cover. No-claim bonus up to 20% on renewal.",
    "activeStatus": true
  },
  "coverageOptions": [
    { "coverageAmount": 1000000.00, "label": "Base Cover", "displayOrder": 1, "activeStatus": true },
    { "coverageAmount": 2000000.00, "label": "Silver Cover", "displayOrder": 2, "activeStatus": true },
    { "coverageAmount": 3000000.00, "label": "Gold Cover", "displayOrder": 3, "activeStatus": true }
  ],
  "pricingRule": {
    "planId": null,
    "baseRiskRate": 0.0180,
    "processingFee": 450.00,
    "gst": 18.00,
    "effectiveFrom": "2026-08-03T00:00:00",
    "effectiveTo": null,
    "remarks": "Demo plan created from test payload."
  }
}
```

## PUT /api/plans/{planId}

| Field | Value |
|---|---|
| Method | `PUT` |
| Auth | ADMIN (Bearer token) |
| Description | Update an existing plan (seeded `planId` 1–6). Cannot update an inactive plan. |

**Body**

```json
{
  "productId": 1,
  "planName": "Health Shield",
  "allowedDurations": [1, 2, 3, 5],
  "supportedPremiumType": "ANNUAL",
  "termsAndConditions": "Coverage is subject to hospitalisation in a network hospital. Updated terms for the demo.",
  "activeStatus": true
}
```

## PATCH /api/plans/{planId}/activate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Activate a plan. |

**Body:** none

## PATCH /api/plans/{planId}/deactivate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Deactivate a plan. |

**Body:** none

## GET /api/plans/active

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | List active plans (seeded: 6). |

**Body:** none

## GET /api/plans/{productId}/active

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | Active plans under a product (e.g. `productId=1` returns plans 1 and 2). |

**Body:** none

## GET /api/plans/{planId}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | Get plan by id (seeded 1–6). |

**Body:** none

# Plan API

> Endpoints under `/api/plans` for creating, updating, activating, and querying insurance plans, including the wizard that creates a plan, its coverage options, and pricing rule in one call.

## Purpose

Reference for plan management endpoints: the wizard create payload (`planDetails` / `coverageOptions` / `pricingRule`), the update payload, activation lifecycle, listing, and pagination. Covers `allowedDurations` and `supportedPremiumType`.

## Overview

A plan is a concrete product offering: it belongs to a product, defines the set of allowed durations (`allowedDurations`), a supported premium type (`supportedPremiumType`), terms and conditions, and a list of coverage options (sum-insured ladder). Base URL: `http://localhost:8081/api`.

## Business Context

Plans represent what a customer can actually buy. The premium calculator only accepts a `coverageAmount` that exactly matches an active coverage option of the plan, a `duration` inside `allowedDurations`, and the plan's `supportedPremiumType`. Domain rules are in `../02_Business_Domain/Business_Rules.md`.

## Technical Design

### Endpoint matrix

| Method | Path | Role | Response envelope | Notes |
|---|---|---|---|---|
| POST | `/api/plans/wizard` | ADMIN | `ApiResponseDTO<PlanWizardResponseDTO>` | `201 Created`; plan + coverage + pricing in one call |
| PUT | `/api/plans/{planId}` | ADMIN | `ApiResponseDTO<PlanResponseDTO>` | Cannot update an inactive plan |
| PATCH | `/api/plans/{planId}/activate` | ADMIN | `ApiResponseDTO<PlanResponseDTO>` | No body |
| PATCH | `/api/plans/{planId}/deactivate` | ADMIN | `ApiResponseDTO<PlanResponseDTO>` | No body |
| GET | `/api/plans/active` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<List<PlanResponseDTO>>` | All active plans |
| GET | `/api/plans/{productId}/active` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<List<PlanResponseDTO>>` | Active plans under a product |
| GET | `/api/plans/{planId}` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<PlanResponseDTO>` | — |
| GET | `/api/plans/page` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<PageResponseDTO<PlanResponseDTO>>` | Paginated + filters |

### Wizard create — `PlanWizardRequestDTO`

The wizard wraps a `PlanRequestDTO`, a list of `CoverageOptionRequestDTO`, and a `PricingRuleRequestDTO`:

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

The `planId` inside `pricingRule` is ignored (set to `null`) because the rule is bound to the newly created plan.

`PlanWizardResponseDTO`:

```json
{
  "policyPlanId": 7,
  "planName": "Drive Safe Pro",
  "coverageOptionIds": [19, 20, 21],
  "pricingRuleId": 7
}
```

### Update — `PlanRequestDTO`

`PUT /api/plans/{planId}` accepts the same `PlanRequestDTO` used inside the wizard:

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

Validation (from `PlanRequestDTO.java`):

| Field | Rule |
|---|---|
| `productId` | required |
| `planName` | required, letters/spaces only |
| `allowedDurations` | required, set of integers (stored in `policy_plan_durations`) |
| `supportedPremiumType` | required, `PremiumType` enum: `ONE_TIME`, `ANNUAL` |
| `termsAndConditions` | required |
| `activeStatus` | required boolean |

### Response — `PlanResponseDTO`

```json
{
  "planId": 7,
  "productId": 2,
  "productName": "Drive Safe Pro",
  "planName": "Drive Safe Pro",
  "planVersion": 1,
  "allowedDurations": [1, 2, 3],
  "supportedPremiumType": "ANNUAL",
  "coverageOptions": [
    { "id": 19, "coverageAmount": 1000000.00, "label": "Base Cover", "displayOrder": 1, "isActive": true }
  ],
  "termsAndConditions": "Own damage and third-party cover. No-claim bonus up to 20% on renewal.",
  "isActive": true,
  "createdDate": "2026-08-03T10:00:00"
}
```

### Paginated list

`GET /api/plans/page`:

| Query param | Default | Notes |
|---|---|---|
| `pageNumber` | `0` | |
| `pageSize` | `10` | |
| `sortBy` | `createdDate` | |
| `sortDirection` | `desc` | |
| `productId` | — | optional filter |
| `isActive` | — | optional boolean filter |
| `planName` | — | optional partial match |
| `minCoverageAmount` / `maxCoverageAmount` | — | optional coverage range |
| `minPremiumAmount` / `maxPremiumAmount` | — | optional premium range |

## Workflow

1. Admin creates a plan with coverage options and pricing in one call: `POST /api/plans/wizard`.
2. Admin refines plan details: `PUT /api/plans/{planId}`.
3. Admin toggles availability: `PATCH /api/plans/{planId}/activate` / `.../deactivate`.
4. All roles browse: `GET /api/plans/active`, `GET /api/plans/{productId}/active`, `GET /api/plans/{planId}`.
5. Staff/admin administer: `GET /api/plans/page`.

## Code References

| Concern | Path |
|---|---|
| Controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PolicyPlanController.java` |
| Wizard request DTO | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/PlanWizardRequestDTO.java` |
| Plan request DTO | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/PlanRequestDTO.java` |
| Coverage option request DTO | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/CoverageOptionRequestDTO.java` |
| Response DTOs | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/{PlanResponseDTO,PlanWizardResponseDTO,CoverageOptionResponseDTO}.java` |
| Coverage option admin API | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/CoverageOptionController.java` |
| Sample payloads | `demo-data/api-test-payloads/04-plans.json`, `05-coverage-options.json` |

## Diagrams

Plan structure and the plan-versioning relationship are described in `../04_Database/Table_Descriptions.md` and `../01_System_Architecture/Database_Architecture.md`.

## Best Practices

- One wizard call keeps plan, coverage options, and pricing rule transactionally consistent.
- Enums (`PremiumType`) and explicit `allowedDurations` prevent invalid premium configurations at the boundary.
- Plan versioning (`planVersion`) preserves the exact configuration used by existing policies.

## Future Improvements

- Consider a dedicated plan version history endpoint for auditability.
- Link to `../10_Evaluation/Future_Enhancements.md`.

# Policy API

> Endpoints under `/api/policies` for purchasing, issuing, listing, fetching, canceling policies, and reading a policy's claims.

## Purpose

Reference for policy lifecycle endpoints: purchase from a quote, manual issue by staff/admin, customer and admin listings, single-policy lookup, claims-by-policy, and cancellation. Documents `PolicyPurchaseRequestDTO`, `PolicyIssueRequestDTO`, `PolicyResponseDTO`, and the policy status lifecycle.

## Overview

A policy is created `PENDING_PAYMENT` from a validated quote, becomes `ACTIVE` once a SUCCESS payment is recorded, and can be `CANCELLED` (when no open claims exist) or eventually `EXPIRED`. Base URL: `http://localhost:8081/api`.

## Business Context

Policies bind a customer, a plan (with a specific version and pricing rule), a selected coverage, a duration, and a start date. Duplicate-policy and claim-gating rules are described in `../02_Business_Domain/Policy.md` and `../02_Business_Domain/Business_Rules.md`.

## Technical Design

### Endpoint matrix

| Method | Path | Role | Response envelope | Notes |
|---|---|---|---|---|
| POST | `/api/policies/purchase` | CUSTOMER | `ApiResponseDTO<PolicyResponseDTO>` | `201 Created`; from a quote |
| POST | `/api/policies/issue` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<PolicyResponseDTO>` | `201 Created`; manual issue |
| GET | `/api/policies/my-policies` | CUSTOMER | `ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>>` | Own policies |
| GET | `/api/policies/customer/{customerId}` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>>` | By customer |
| GET | `/api/policies` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>>` | Filters: `customerId`, `status`, `policyNumber` |
| GET | `/api/policies/{policyId}` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<PolicyResponseDTO>` | Ownership enforced for customers |
| GET | `/api/policies/{policyId}/claims` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<List<ClaimResponseDTO>>` | Delegates to claim service |
| PATCH | `/api/policies/{policyId}/cancel` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<PolicyResponseDTO>` | Blocked while open claims exist |

### Purchase — `PolicyPurchaseRequestDTO`

```json
{
  "quoteId": 4,
  "paymentReferenceId": null
}
```

`quoteId` is required. `paymentReferenceId` is optional. The `quoteId` comes from `POST /api/premium/calculate`. The customer's profile must be complete (nominee, address, city, state). The policy is created in `PENDING_PAYMENT`.

### Issue — `PolicyIssueRequestDTO`

```json
{
  "customerId": 3,
  "quoteId": 3,
  "startDate": "2026-07-25"
}
```

`customerId`, `quoteId`, and `startDate` are required; `startDate` must be past or present (`@PastOrPresent`).

### Purchase/issue validation

From `PolicyServiceImpl` (`validateQuoteForPurchase` + duplicate checks):

- The quote must belong to the target customer, be `CREATED`, and not be expired (see `Pricing_API.md#quote-expiry`).
- The plan and its product must be active.
- HEALTH products: no duplicate `ACTIVE` or `PENDING_PAYMENT` policy for the same customer+plan.
- Non-HEALTH products: no duplicate `PENDING_PAYMENT` policy for the same customer+plan.

### Response — `PolicyResponseDTO`

```json
{
  "policyId": 1,
  "policyNumber": "POL-HLTH-00001",
  "customerId": 4,
  "customerName": "Rajesh Sharma",
  "planId": 1,
  "planName": "Health Shield",
  "startDate": "2026-07-25",
  "endDate": "2027-07-25",
  "policyStatus": "PENDING_PAYMENT",
  "totalPremiumPaid": 0.00,
  "productType": "HEALTH",
  "selectedCoverage": 1000000.00,
  "premiumType": "ANNUAL",
  "policyDuration": 1,
  "premiumRateUsed": 0.0180,
  "processingFeeUsed": 450.00,
  "gstUsed": 90.00,
  "calculatedPremium": 18540.00,
  "planVersion": 1,
  "pricingRuleId": 1,
  "quoteId": 8,
  "purchaseDate": "2026-08-03T10:00:00",
  "createdDate": "2026-08-03T10:00:00",
  "remainingClaimAmount": 1000000.00
}
```

Field notes:

- `policyNumber` is a human-friendly unique identifier.
- `policyStatus` is one of `PolicyStatus`: `PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `CANCELLED`.
- `endDate = startDate + duration` years.
- `calculatedPremium` is the amount a payment must match exactly to activate the policy.
- `planVersion` and `pricingRuleId` freeze the configuration used at purchase time.
- `remainingClaimAmount` = `selectedCoverage` minus approved/outstanding claims.

### List query params (shared)

`pageNumber` (default `0`), `pageSize` (default `10`), `sortBy` (default `id`), `sortDirection` (default `desc`).

## Workflow

1. Customer requests a quote (`POST /api/premium/calculate`) and obtains a `quoteId`.
2. Customer purchases: `POST /api/policies/purchase` → policy `PENDING_PAYMENT`.
3. Customer (or staff on their behalf) pays: `POST /api/payments` → policy becomes `ACTIVE`.
4. Staff/admin can also issue directly: `POST /api/policies/issue`.
5. Customer tracks: `GET /api/policies/my-policies`; staff/admin use `GET /api/policies` or `GET /api/policies/customer/{customerId}`.
6. Customer views claims against a policy: `GET /api/policies/{policyId}/claims`.
7. Staff/admin cancel: `PATCH /api/policies/{policyId}/cancel` (rejected while open claims exist).

## Code References

| Concern | Path |
|---|---|
| Controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PolicyController.java` |
| Service | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java` |
| Request DTOs | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/{PolicyPurchaseRequestDTO,PolicyIssueRequestDTO}.java` |
| Response DTO | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/PolicyResponseDTO.java` |
| Policy status enum | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/PolicyStatus.java` |
| Sample payloads | `demo-data/api-test-payloads/08-policies.json` |

## Diagrams

Policy lifecycle and claim relationships are documented in `../04_Database/Table_Descriptions.md` and `../08_Workflows/Policy_Lifecycle.md`.

## Best Practices

- Policies are always created from a validated, single-use quote, so the financial terms are immutable snapshots.
- `planVersion`/`pricingRuleId` snapshots keep historical policies auditable even when plans change.
- Duplicate-policy rules are enforced server-side per product type.

## Future Improvements

- Consider policy renewal and end-to-end policy-number formatting configuration.
- Link to `../10_Evaluation/Future_Enhancements.md`.

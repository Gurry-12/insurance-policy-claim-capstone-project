# Payment API

> Endpoints under `/api/payments` for recording premium payments and reading payment history for customers, staff, and admin.

## Purpose

Reference for payment recording and history endpoints, including `PaymentRequestDTO`, `PaymentResponseDTO`, the exact-amount matching rule, and the `SUCCESS → policy ACTIVE` activation rule.

## Overview

Payments activate policies: recording a `SUCCESS` payment for a `PENDING_PAYMENT` policy flips it to `ACTIVE` and increments `totalPremiumPaid`. Payments are recorded by customers (for their own policies) or by internal staff (for policies matching their `productSpeciality`). Base URL: `http://localhost:8081/api`.

## Business Context

Premium payment is the single event that activates a policy. Duplicate-payment rules for ONE_TIME vs ANNUAL premiums and the annual renewal window are described in `../02_Business_Domain/Payment.md` and `../02_Business_Domain/Business_Rules.md`.

## Technical Design

### Endpoint matrix

| Method | Path | Role | Response envelope | Notes |
|---|---|---|---|---|
| POST | `/api/payments` | CUSTOMER, INTERNAL_STAFF | `ApiResponseDTO<PaymentResponseDTO>` | `201 Created`; activates PENDING policy on SUCCESS |
| GET | `/api/payments/my-payments` | CUSTOMER | `ApiResponseDTO<List<PaymentResponseDTO>>` | Own history |
| GET | `/api/payments/my-policies/{policyId}` | CUSTOMER | `ApiResponseDTO<List<PaymentResponseDTO>>` | Own policy payments |
| GET | `/api/payments/policy/{id}` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<List<PaymentResponseDTO>>` | By policy |
| GET | `/api/payments/{id}` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<PaymentResponseDTO>` | Ownership enforced |
| GET | `/api/payments/page` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<PageResponseDTO<PaymentResponseDTO>>` | Filters: `policyId`, `paymentStatus`, `transactionId`, `minAmount`, `maxAmount` |

### Record payment — `PaymentRequestDTO`

```json
{
  "policyId": 3,
  "amount": 2655.00,
  "paymentMode": "UPI",
  "paymentStatus": "SUCCESS"
}
```

Fields (from `PaymentRequestDTO.java`):

| Field | Type | Notes |
|---|---|---|
| `policyId` | Long | policy to pay (validated server-side) |
| `amount` | BigDecimal | must be positive (`@Positive`) |
| `paymentMode` | `PaymentMode` | required enum: `UPI`, `CARD`, `NET_BANKING`, `CASH` |
| `paymentStatus` | `PaymentStatus` | enum: `PENDING`, `SUCCESS`, `FAILED` |

### Exact-amount matching rule

`recordPayment` (from `PremiumPaymentServiceImpl`) rejects the payment with a `400` unless the submitted `amount` **exactly** equals the policy's `calculatedPremium`:

```java
if (policy.getCalculatedPremium().compareTo(dto.getAmount()) != 0) {
    throw new BadRequestException(MessageConstants.Payment.AMOUNT_MISMATCH);
}
```

`calculatedPremium` is the quote's `totalPremium` frozen on the policy (see `Pricing_API.md` and `Policy_API.md`).

### Payment validation rules

- Policy must not be `CANCELLED` or `EXPIRED`.
- Customers may only pay their own policies; staff may only pay policies whose product type matches their `productSpeciality`.
- **ONE_TIME** premium: only one SUCCESS payment per policy is allowed.
- **ANNUAL** premium: the next payment is eligible roughly one year after the last SUCCESS payment, with a 15-day early-payment window; the number of SUCCESS payments cannot exceed `policyDuration`.
- `totalPremiumPaid + amount` cannot exceed `calculatedPremium × duration`.
- `transactionReference` is auto-generated (e.g. `TXN-...`); a reference collision is retried.

### Activation rule

On a `SUCCESS` payment the policy is saved with:

- `policyStatus = ACTIVE` (when it was `PENDING_PAYMENT`)
- `totalPremiumPaid = totalPremiumPaid + amount`

### Response — `PaymentResponseDTO`

```json
{
  "paymentId": 1,
  "policyId": 3,
  "policyNumber": "POL-MTR-00001",
  "amount": 2655.00,
  "paymentMode": "UPI",
  "transactionReference": "TXN-2026-HLTH-00001",
  "paymentStatus": "SUCCESS",
  "paymentDate": "2026-08-03T10:15:00"
}
```

### List query params

`GET /api/payments/page`: `pageNumber` (default `0`), `pageSize` (default `10`), `sortBy` (default `id`), `sortDirection` (default `asc`), optional `policyId`, `paymentStatus`, `transactionId`, `minAmount`, `maxAmount`.

## Workflow

1. Policy is purchased: `POST /api/policies/purchase` → `PENDING_PAYMENT`.
2. Customer (or staff with matching speciality) records the exact premium: `POST /api/payments` with `paymentStatus: "SUCCESS"` → policy `ACTIVE`.
3. Customer verifies: `GET /api/payments/my-payments`.
4. Staff/admin audit: `GET /api/payments/policy/{id}` or `GET /api/payments/page`.

## Code References

| Concern | Path |
|---|---|
| Controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PremiumPaymentController.java` |
| Service | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumPaymentServiceImpl.java` |
| Request DTO | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/PaymentRequestDTO.java` |
| Response DTO | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/PaymentResponseDTO.java` |
| Enums | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/{PaymentMode,PaymentStatus,PolicyStatus}.java` |
| Sample payloads | `demo-data/api-test-payloads/09-payments.md` |

## Diagrams

Payment and policy-activation relationships are documented in `../04_Database/Table_Descriptions.md`.

## Best Practices

- Exact `BigDecimal` comparison prevents partial or over-payment drift.
- Only `SUCCESS` payments mutate policy state; `FAILED`/`PENDING` are recorded without side effects.
- Auto-generated transaction references keep every payment traceable.

## Future Improvements

- Consider gateway callback/webhook integration instead of client-submitted status.
- Link to `../10_Evaluation/Future_Enhancements.md`.

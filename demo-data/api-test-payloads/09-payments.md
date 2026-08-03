# Payments API — Request Payloads

Request bodies for payment endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/payments

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | CUSTOMER or INTERNAL_STAFF (Bearer token) |
| Description | Record a premium payment. `amount` must EXACTLY match the plan's calculated premium (`annualPremium` for ANNUAL, `totalPremium` for ONE_TIME). A `SUCCESS` payment on a `PENDING_PAYMENT` policy activates it. `transactionReference` is auto-generated. |

**Body**

```json
{
  "policyId": 3,
  "amount": 2655.00,
  "paymentMode": "UPI",
  "paymentStatus": "SUCCESS"
}
```

## GET /api/payments/my-payments

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | CUSTOMER (Bearer token) |
| Description | Own payment history. |

**Body:** none

## GET /api/payments/my-policies/{policyId}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | CUSTOMER (Bearer token) |
| Description | Payments for own policy (e.g. `policyId=1` has payment `TXN-2026-HLTH-00001`). |

**Body:** none

## GET /api/payments/policy/{id}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN or INTERNAL_STAFF (Bearer token) |
| Description | Payments by policy (seeded `policyId` 1–4). |

**Body:** none

## GET /api/payments/{id}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | Get payment by id (seeded `payment_id` 1–4). |

**Body:** none

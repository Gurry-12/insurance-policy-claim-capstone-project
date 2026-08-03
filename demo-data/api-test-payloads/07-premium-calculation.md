# Premium Calculation API — Request Payloads

Request bodies for quote-generation endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/premium/calculate

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | CUSTOMER (Bearer token) |
| Description | Generate a quote for the logged-in customer. `coverageAmount` must EXACTLY match an active coverage option of the plan; `duration` must be in the plan's allowed durations; `premiumType` must match the plan. Creates a Quote (`quotes` table) and returns its `quoteId`. |

**Body**

```json
{
  "planId": 1,
  "coverageAmount": 1000000.00,
  "duration": 1,
  "premiumType": "ANNUAL"
}
```

## POST /api/premium/admin/calculate

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN or INTERNAL_STAFF (Bearer token) |
| Description | Generate a quote for any customer (seeded `customerId` 1–4). |

**Body**

```json
{
  "customerId": 2,
  "planId": 3,
  "coverageAmount": 500000.00,
  "duration": 1,
  "premiumType": "ANNUAL"
}
```

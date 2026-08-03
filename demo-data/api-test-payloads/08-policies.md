# Policies API — Request Payloads

Request bodies for policy endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/policies/purchase

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | CUSTOMER (Bearer token) |
| Description | Purchase a policy from a quote. The `quoteId` comes from `POST /api/premium/calculate`. The customer profile must be complete. Policy is created in `PENDING_PAYMENT`. |

**Body**

```json
{
  "quoteId": 4,
  "paymentReferenceId": null
}
```

## POST /api/policies/issue

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN or INTERNAL_STAFF (Bearer token) |
| Description | Issue a policy directly to a customer from a quote. Uses `customerId` + `quoteId` + `startDate`. |

**Body**

```json
{
  "customerId": 3,
  "quoteId": 3,
  "startDate": "2026-07-25"
}
```

## GET /api/policies/my-policies

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | CUSTOMER (Bearer token) |
| Description | Own policies (paginated). Query: `?pageNumber=0&pageSize=10&sortBy=id&sortDirection=desc`. |

**Body:** none

## GET /api/policies/{policyId}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | Get policy by id (seeded 1–4). |

**Body:** none

## GET /api/policies/{policyId}/claims

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | Claims under a policy (e.g. `policyId=1` has claims `CLM-9U2X4Y6Z` and `CLM-2N4P6Q9R`). |

**Body:** none

## PATCH /api/policies/{policyId}/cancel

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN or INTERNAL_STAFF (Bearer token) |
| Description | Cancel a policy. Cannot cancel if any claim is open. |

**Body:** none

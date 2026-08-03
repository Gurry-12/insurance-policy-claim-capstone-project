# Claims API — Request Payloads

Request bodies for claim endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/claims/raise

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | CUSTOMER (Bearer token) |
| Content type | `multipart/form-data` |
| Description | Raise a claim with supporting documents. Two parts: `claim` (JSON string) and `files` (one or more JPEG/PNG/PDF, max 5 MB each). Policy must be ACTIVE; `claimAmount` ≤ remaining coverage; `incidentDate` within policy period. |

**Multipart parts**

| Part | Value |
|---|---|
| `claim` | JSON string (see below) |
| `files` | e.g. `incident_photo.jpg` (at least one file) |

**`claim` JSON**

```json
{
  "policyId": 2,
  "claimAmount": 45000.00,
  "claimReason": "Rear bumper dent in parking lot collision",
  "incidentDate": "2026-08-01"
}
```

**curl**

```bash
curl -X POST http://localhost:8081/api/claims/raise \
  -H "Authorization: Bearer <customer-token>" \
  -F 'claim={"policyId":2,"claimAmount":45000,"claimReason":"Rear bumper dent","incidentDate":"2026-08-01"}' \
  -F "files=@incident_photo.jpg"
```

## GET /api/claims/my-claims

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | CUSTOMER (Bearer token) |
| Description | Own claims. |

**Body:** none

## GET /api/claims/{claimId}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | Get claim by id (seeded 1–3). |

**Body:** none

## GET /api/claims/{claimId}/history

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN, INTERNAL_STAFF or CUSTOMER (Bearer token) |
| Description | Claim status history / audit trail (claim 1 has 3 transitions). Query: `?pageNumber=0&pageSize=10&sortBy=id&sortDirection=desc`. |

**Body:** none

## PATCH /api/claims/{claimId}/under-review

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | INTERNAL_STAFF (Bearer token) |
| Description | Move a `SUBMITTED` claim to `UNDER_REVIEW`. Use `claimId=3` (`CLM-2N4P6Q9R`). |

**Body:** none

## PATCH /api/claims/{claimId}/assign

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | INTERNAL_STAFF (Bearer token) |
| Description | Assign an `UNDER_REVIEW` claim to the current staff member. |

**Body:** none

## PATCH /api/claims/{claimId}/review

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | INTERNAL_STAFF (Bearer token) |
| Description | Review and recommend. `recommendedStatus` must be `RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION`. Claim must be assigned to the caller. |

**Body**

```json
{
  "recommendedStatus": "RECOMMENDED_FOR_APPROVAL",
  "remarks": "All documentation verified. Claim is valid."
}
```

## PATCH /api/claims/{claimId}/final-decision

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Final decision. `recommendedStatus` must be `APPROVED` or `REJECTED`. Claim must be in `RECOMMENDED_FOR_APPROVAL`/`RECOMMENDED_FOR_REJECTION`. |

**Body**

```json
{
  "recommendedStatus": "APPROVED",
  "remarks": "Approved. Settlement will be processed."
}
```

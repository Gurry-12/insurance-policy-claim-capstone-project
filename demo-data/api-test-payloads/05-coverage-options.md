# Coverage Options API — Request Payloads

Request bodies for coverage-option endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/admin/policy-plans/{planId}/coverage-options

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN (Bearer token) |
| Description | Add a coverage option to a plan (seeded `planId` 1–6). |

**Body**

```json
{
  "coverageAmount": 3000000.00,
  "label": "Platinum Cover",
  "displayOrder": 4,
  "activeStatus": true
}
```

## PUT /api/admin/policy-plans/{planId}/coverage-options/{optionId}

| Field | Value |
|---|---|
| Method | `PUT` |
| Auth | ADMIN (Bearer token) |
| Description | Update a coverage option (seeded `optionId` 1–18). |

**Body**

```json
{
  "coverageAmount": 4000000.00,
  "label": "Platinum Cover",
  "displayOrder": 4,
  "activeStatus": true
}
```

## PATCH /api/admin/policy-plans/{planId}/coverage-options/{optionId}/activate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Activate a coverage option. |

**Body:** none

## PATCH /api/admin/policy-plans/{planId}/coverage-options/{optionId}/deactivate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Deactivate a coverage option. |

**Body:** none

## DELETE /api/admin/policy-plans/{planId}/coverage-options/{optionId}

| Field | Value |
|---|---|
| Method | `DELETE` |
| Auth | ADMIN (Bearer token) |
| Description | Delete a coverage option. |

**Body:** none

## POST /api/admin/policy-plans/{planId}/coverage-options/regenerate

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN (Bearer token) |
| Description | Regenerate a plan's coverage options as a ladder (min → max stepping by `incrementStep`). |

**Body**

```json
{
  "minCoverage": 100000.00,
  "maxCoverage": 1000000.00,
  "incrementStep": 100000.00
}
```

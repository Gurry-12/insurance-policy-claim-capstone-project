# Public API — Request Payloads

Request bodies for public endpoints. Base URL: `http://localhost:8081/api`.

## GET /api/public/stats

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | PUBLIC (no token) |
| Description | Platform statistics for the landing page. With the seed data loaded the response should be: `activeProducts=5`, `activePlans=6`, `totalPolicies=4`, `claimsProcessed=3`. Falls back to 0 if the DB is empty. |

**Body:** none

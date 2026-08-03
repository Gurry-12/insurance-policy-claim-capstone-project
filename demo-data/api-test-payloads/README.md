# API Test Payloads

Request bodies for every endpoint that takes a JSON (or multipart) body, keyed to the
**seeded demo IDs** (see `demo-data/sql/` and `demo-data/04-evaluator-demo.md`).

Base URL: `http://localhost:8081/api` — backend runs on **port 8081** (not 8080).

## Files
| File | Endpoint group |
|---|---|
| `01-auth.json` | register, verify-otp, resend-otp, login, forgot/reset-password, refresh, logout |
| `02-customers.json` | create / update / view customer profiles |
| `03-products.json` | create / update / activate / deactivate products |
| `04-plans.json` | plan wizard, update / activate / deactivate plans |
| `05-coverage-options.json` | coverage options CRUD + regenerate |
| `06-pricing-rules.json` | pricing rules CRUD + preview |
| `07-premium-calculation.json` | quote generation (customer + admin/staff) |
| `08-policies.json` | purchase (from quote), issue, cancel |
| `09-payments.json` | record premium payment + lookups |
| `10-claims.json` | raise (multipart), review, final decision |
| `11-admin-users.json` | create staff, manage users |
| `12-public.json` | public stats |

## Format of each entry
```json
{
  "endpoint": "POST /api/...",
  "method": "POST",
  "auth": "ROLE (Bearer token) | PUBLIC | Cookie only",
  "description": "Notes incl. which seeded ID to use",
  "body": { "...": "..." }
}
```
- `body: null` = no request body (GET/PATCH/DELETE with no payload).
- `contentType: multipart/form-data` = use the `multipartParts` + `curlExample` shown.
- Replace `<token>` placeholders with a real JWT (`Authorization: Bearer <token>`).

## Seeded IDs referenced here
- Products `1..5`, Plans `1..6`, Pricing rules `1..6`, Coverage options `1..18`
- Customers `1..4`, Policies `1..4`, Payments `1..4`, Claims `1..3`
- Users `1..7` (admin, 3 customers, 2 staff, 1 pending customer)

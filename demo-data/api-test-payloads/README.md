# API Test Payloads

Request bodies for every endpoint that takes a JSON (or multipart) body, keyed to the
**seeded demo IDs** (see `demo-data/sql/` and `demo-data/04-evaluator-demo.md`).

Base URL: `http://localhost:8081/api` — backend runs on **port 8081** (not 8080).

## Files

| File | Endpoint group |
|---|---|
| `01-auth.md` | register, verify-otp, resend-otp, login, forgot/reset-password, refresh, logout |
| `02-customers.md` | create / update / view customer profiles |
| `03-products.md` | create / update / activate / deactivate products |
| `04-plans.md` | plan wizard, update / activate / deactivate plans |
| `05-coverage-options.md` | coverage options CRUD + regenerate |
| `06-pricing-rules.md` | pricing rules CRUD + preview |
| `07-premium-calculation.md` | quote generation (customer + admin/staff) |
| `08-policies.md` | purchase (from quote), issue, cancel |
| `09-payments.md` | record premium payment + lookups |
| `10-claims.md` | raise (multipart), review, final decision |
| `11-admin-users.md` | create staff, manage users |
| `12-public.md` | public stats |

## Format of each entry

Every endpoint in a file is a `## POST/PUT/PATCH/DELETE/GET <path>` section with a
small metadata table (`Method`, `Auth`, `Description`, optional `Content type`) followed
by the request body as a `json` code block:

- `**Body:** none` — no request body (GET/PATCH/DELETE with no payload).
- `Content type: multipart/form-data` — see the `claim` JSON + `curl` example shown.
- Replace `<token>` / `<otp-from-db-or-console>` placeholders with real values
  (`Authorization: Bearer <token>`).

> The payloads are unchanged from the earlier `*.json` versions — only the wrapper
> format is now Markdown.

## Seeded IDs referenced here

- Products `1..5`, Plans `1..6`, Pricing rules `1..6`, Coverage options `1..18`
- Customers `1..4`, Policies `1..4`, Payments `1..4`, Claims `1..3`
- Users `1..7` (admin, 3 customers, 2 staff, 1 pending customer)

# API Checklist

> Endpoint-level evaluation checklist. Full contracts: `../03_API/`.

## How to use

Every endpoint is verifiable via Swagger (`/swagger-ui.html`), `demo-data/api-test-payloads/`,
or Postman (`insurance-policy-claim-management-system/postman/`).

## Public

- [ ] `GET /api/public/stats` — platform statistics

## Authentication (`/api/auth`)

- [ ] `POST /register` — create user, dispatch OTPs
- [ ] `POST /verify-otp` — verify email + phone OTP → ACTIVE
- [ ] `POST /resend-otp` — resend with cooldown
- [ ] `POST /login` — JWT + refresh cookie
- [ ] `POST /forgot-password` — send reset OTP
- [ ] `POST /reset-password` — reset with OTP + new password
- [ ] `POST /refresh` — rotate refresh token, new access token (cookie)
- [ ] `POST /logout` — revoke refresh token

## Users (`/api/users` — ADMIN)

- [ ] `POST /staff` — create staff with productSpeciality
- [ ] List / paginated search / get by id
- [ ] `PATCH` activate / deactivate

## Customers (`/api/customers`)

- [ ] `POST` create profile (own), `PUT` update profile
- [ ] `GET /profile`, `GET /{id}` (admin/staff), paginated list (admin/staff)

## Products (`/api/products`)

- [ ] Admin CRUD + activate/deactivate (request field `activeStatus`)
- [ ] `GET /active` — customer-visible active products

## Plans (`/api/plans`)

- [ ] `GET` list, `GET /{productId}/active`, `GET /{id}`
- [ ] `POST /wizard` — plan + coverage options + pricing rule
- [ ] `PUT /{id}`, `PATCH` activate / deactivate

## Coverage Options (`/api/admin/policy-plans/{planId}/coverage-options` — ADMIN)

- [ ] CRUD
- [ ] `POST /regenerate` — coverage ladder regeneration

## Pricing Rules (`/api/admin/pricing-rules` — ADMIN)

- [ ] CRUD + activate
- [ ] `POST /preview` — preview premium for rule/customer inputs

## Premium (`/api/premium`)

- [ ] `POST /calculate` (CUSTOMER) — planId/coverageAmount/duration/premiumType → PremiumQuote
- [ ] `POST /admin/calculate` (STAFF/ADMIN) — adds customerId

## Policies (`/api/policies`)

- [ ] `POST /purchase` {quoteId, paymentReferenceId}
- [ ] `POST /issue` (staff/admin) {customerId, quoteId, startDate}
- [ ] `GET /my-policies`, `GET /{id}`, `GET /{id}/claims`
- [ ] `PATCH /{id}/cancel`

## Payments (`/api/payments`)

- [ ] `POST /` record payment
- [ ] `GET /my-payments`, `GET /policy/{policyId}`, `GET /{paymentId}`

## Claims (`/api/claims`)

- [ ] `POST /raise` (multipart: claim JSON + files)
- [ ] `GET /my-claims`, `GET /{id}`, `GET /{id}/history`
- [ ] `PATCH /{id}/under-review` (staff)
- [ ] `PATCH /{id}/assign` (staff)
- [ ] `PATCH /{id}/review` {recommendedStatus, remarks} (staff)
- [ ] `PATCH /{id}/final-decision` (admin)
- [ ] `POST /api/document/upload/{claimId}` (customer)

## Response wrappers (verified)

- Success: `{ message, success, data, timeStamp }`
- Paged: `{ content, pageNumber, pageSize, totalRecords, totalPages, lastPage, sortingType }`
- Error: `{ timestamp, statusCode, errorType, message, requestPath }`
- Validation error adds `fieldErrors`

## Related

- `../03_API/API_Flow.md` — end-to-end call sequences
- `../../demo-data/api-test-payloads/` — request bodies
- `../../demo-data/03-testing-flow.md` — curl walkthrough

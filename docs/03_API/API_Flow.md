# API Flow — End-to-End Call Sequences

> End-to-end API call sequences for onboarding, quote-to-active-policy, claim handling, and admin configuration, followed by a reference section on response wrappers, pagination, and common error codes.

## Purpose

A guide that strings individual endpoints into complete, runnable journeys. Each step names the HTTP method and path and who performs it, and links to the detailed API document that describes the payload. Also serves as the canonical reference for response-wrapper field names, pagination query parameters, and error codes.

## Overview

Base URL for every step is `http://localhost:8081/api`. Authenticated steps require `Authorization: Bearer <access-token>`. Login also sets the `refresh_token` HttpOnly cookie used by `/api/auth/refresh` and `/api/auth/logout` (see `Authentication_API.md`).

## Business Context

These flows map to the domain workflows in `../02_Business_Domain/Business_Rules.md` and `../08_Workflows/`. Data layout for every step is described in `../04_Database/Table_Descriptions.md`.

## Workflow

### (a) Customer onboarding

1. `POST /api/auth/register` — PUBLIC — create the account; dual OTPs are sent. → [Authentication_API.md](Authentication_API.md)
2. `POST /api/auth/verify-otp` — PUBLIC — submit `emailOtp` + `phoneOtp` to activate the account. → [Authentication_API.md](Authentication_API.md)
3. `POST /api/auth/login` — PUBLIC — obtain the access token and refresh cookie. → [Authentication_API.md](Authentication_API.md)
4. `POST /api/customers` — CUSTOMER — complete the customer profile (nominee, address, city, state). A complete profile is required before policy purchase.

### (b) Quote → purchase → pay → policy ACTIVE

1. `POST /api/auth/login` — CUSTOMER — obtain the access token. → [Authentication_API.md](Authentication_API.md)
2. `GET /api/products/active` — CUSTOMER — browse the active catalog. → [Product_API.md](Product_API.md)
3. `GET /api/plans/{productId}/active` — CUSTOMER — see active plans for a product. → [Plan_API.md](Plan_API.md)
4. `GET /api/plans/{planId}` — CUSTOMER — view plan details (durations, premium type, coverage options). → [Plan_API.md](Plan_API.md)
5. `POST /api/premium/calculate` — CUSTOMER — `{planId, coverageAmount, duration, premiumType}`; returns `quoteId` with a 30-minute `expiresAt`. → [Pricing_API.md](Pricing_API.md)
6. `POST /api/policies/purchase` — CUSTOMER — `{quoteId, paymentReferenceId}`; creates the policy as `PENDING_PAYMENT`. → [Policy_API.md](Policy_API.md)
7. `POST /api/payments` — CUSTOMER — `{policyId, amount, paymentMode, paymentStatus: "SUCCESS"}` with the amount exactly equal to `calculatedPremium`; policy becomes `ACTIVE`. → [Payment_API.md](Payment_API.md)
8. `GET /api/policies/my-policies` — CUSTOMER — confirm `policyStatus: "ACTIVE"`. → [Policy_API.md](Policy_API.md)

### (c) Claim raise → staff review → admin decision

1. `POST /api/auth/login` — CUSTOMER — obtain the access token. → [Authentication_API.md](Authentication_API.md)
2. `POST /api/claims/raise` — CUSTOMER — multipart request with the `claim` JSON part and at least one `files` part; claim is created as `SUBMITTED`. → [Claim_API.md](Claim_API.md)
3. `GET /api/claims/my-claims` — CUSTOMER — track the claim. → [Claim_API.md](Claim_API.md)
4. `GET /api/claims` — INTERNAL_STAFF — list claims (optionally filter `status=SUBMITTED`); staff only see claims matching their `productSpeciality`. → [Claim_API.md](Claim_API.md)
5. `PATCH /api/claims/{claimId}/under-review` — INTERNAL_STAFF — move the claim to `UNDER_REVIEW`. → [Claim_API.md](Claim_API.md)
6. `PATCH /api/claims/{claimId}/assign` — INTERNAL_STAFF — assign the claim to self. → [Claim_API.md](Claim_API.md)
7. `PATCH /api/claims/{claimId}/review` — INTERNAL_STAFF — `{recommendedStatus, remarks}` with `RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION`. → [Claim_API.md](Claim_API.md)
8. `PATCH /api/claims/{claimId}/final-decision` — ADMIN — `{recommendedStatus: "APPROVED"|"REJECTED", remarks}` to finalize. → [Claim_API.md](Claim_API.md)
9. `GET /api/claims/{claimId}/history` — ADMIN / CUSTOMER — read the audit trail of transitions. → [Claim_API.md](Claim_API.md)

### (d) Admin: product, plan, and staff creation

1. `POST /api/auth/login` — ADMIN — obtain the admin access token (seeded admin `admin@insurance.com` / `Admin@123`). → [Authentication_API.md](Authentication_API.md)
2. `POST /api/products` — ADMIN — create a product (`activeStatus: true`). → [Product_API.md](Product_API.md)
3. `POST /api/plans/wizard` — ADMIN — create plan + coverage options + pricing rule in one call. → [Plan_API.md](Plan_API.md)
4. `POST /api/admin/pricing-rules` — ADMIN — optionally add further pricing rules; activate the active rule with `PATCH /api/admin/pricing-rules/{ruleId}/activate`. → [Pricing_API.md](Pricing_API.md)
5. `POST /api/admin/pricing-rules/preview` — ADMIN — sanity-check a premium without persisting a quote. → [Pricing_API.md](Pricing_API.md)
6. `POST /api/users/staff` — ADMIN — create an internal-staff account with a `productSpeciality` (e.g. `MOTOR`); OTPs are sent. → Authentication / User Management (admin `UserController`)
7. `PATCH /api/users/{id}/activate` — ADMIN — activate the staff account once verified.

## Reference: response wrappers (code-verified field names)

Every endpoint returns one of these envelopes. Field names are taken from the DTO source.

### ApiResponseDTO<T> — single-item response

Fields: `message` (String), `success` (boolean), `data` (T), `timeStamp` (LocalDateTime).

```json
{
  "message": "User logged in successfully.",
  "success": true,
  "data": {},
  "timeStamp": "2026-08-03T10:00:00"
}
```

### PageResponseDTO<T> — paginated response

Fields: `content` (List\<T\>), `pageNumber` (int), `pageSize` (int), `totalRecords` (long), `totalPages` (int), `lastPage` (boolean), `sortingType` (String).

```json
{
  "content": [],
  "pageNumber": 0,
  "pageSize": 10,
  "totalRecords": 100,
  "totalPages": 10,
  "lastPage": false,
  "sortingType": "desc"
}
```

### ErrorResponseDTO — error response

Fields: `timestamp` (LocalDateTime), `statusCode` (int), `errorType` (String), `message` (String), `requestPath` (String).

```json
{
  "timestamp": "2026-08-03T10:05:00",
  "statusCode": 400,
  "errorType": "BAD_REQUEST",
  "message": "Amount does not match the expected premium.",
  "requestPath": "/api/payments"
}
```

### ValidationErrorResponseDTO — bean-validation error

All `ErrorResponseDTO` fields plus `fieldErrors` (Map\<String,String\>).

```json
{
  "timestamp": "2026-08-03T10:05:00",
  "statusCode": 400,
  "errorType": "VALIDATION_ERROR",
  "message": "Validation failed",
  "requestPath": "/api/auth/register",
  "fieldErrors": {
    "password": "must match \"^(?=.*[A-Za-z])(?=.*\\d).{8,64}$\"",
    "mobileNumber": "must match \"^\\+[1-9]\\d{7,14}$\""
  }
}
```

## Reference: pagination query parameters

Paginated endpoints (`/page`, `/my-policies`, history, etc.) use these query parameters as implemented in the controllers:

| Param | Default | Description |
|---|---|---|
| `pageNumber` | `0` | 0-based page index |
| `pageSize` | `10` | items per page |
| `sortBy` | varies per endpoint (e.g. `id`, `createdDate`) | sort field |
| `sortDirection` | varies (`asc` or `desc`) | sort direction |

Per-endpoint filters (e.g. `status`, `productType`, `isActive`, `policyId`, `customerId`, `minAmount`, `maxAmount`) are documented on each detail page.

## Reference: common error codes

| HTTP | `errorType` | When |
|---|---|---|
| `400` | `BAD_REQUEST` / `VALIDATION_ERROR` / `INVALID_INPUT` / `INVALID_JSON_BODY` | bean validation failures, business-rule violations (e.g. amount mismatch, expired quote, duplicate policy), malformed input |
| `401` | `UNAUTHORIZED` / `SESSION_EXPIRED` | missing/invalid/expired access token, bad credentials, missing or rejected refresh token |
| `403` | `ACCESS_DENIED` / `FORBIDDEN` | role not permitted, staff speciality mismatch, CSRF origin mismatch |
| `404` | `NOT_FOUND` | resource does not exist (product, plan, policy, claim, user, customer) |
| `409` | `CONFLICT` | duplicate resource (email/mobile/name), optimistic-lock conflict, DB constraint violation, pricing rule in use |
| `429` | `RATE_LIMITED` | Bucket4j rate limit exceeded on auth endpoints |
| `500` | `INTERNAL_SERVER_ERROR` | unexpected server error |

## Code References

| Concern | Path |
|---|---|
| Controllers | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/*.java` |
| Response wrappers | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/{ApiResponseDTO,PageResponseDTO,ErrorResponseDTO,ValidationErrorResponseDTO}.java` |
| Exception mapping | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/GlobalExceptionHandler.java` |
| Sample payloads | `demo-data/api-test-payloads/*.json` |
| Demo/evaluator flows | `demo-data/` (repo root) |

## Diagrams

Cross-cutting sequence diagrams for these flows are in [`../09_Diagrams/Sequence_Diagrams/`](../09_Diagrams/Sequence_Diagrams/README.md).

## Best Practices

- Each journey starts with login and proceeds through the same service paths the UI uses.
- Quotes must be consumed before their 30-minute expiry; regenerate if expired.
- Payments require an exact amount match; compute from the policy's `calculatedPremium`, not a client-cached value.
- Claims need at least one document at raise time; attach more via `/api/document/upload/{claimId}` if needed.

## Future Improvements

- Provide ready-to-run Postman collections mirroring these flows.
- Link to `../10_Evaluation/Future_Enhancements.md`.

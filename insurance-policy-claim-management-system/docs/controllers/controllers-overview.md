# Controllers Overview

## Purpose

This document explains every REST controller — their endpoints, security, DTOs, validation, and the service they delegate to.

---

## Controller Index

| Controller | Base URL | Tags | Purpose |
|---|---|---|---|
| `AuthController` | `/api/auth` | 1. Authentication API | Login, register, OTP |
| `CustomerController` | `/api/customers` | 3. Customer API | Profile management |
| `InsuranceProductController` | `/api/products` | 4. Insurance Product API | Product CRUD |
| `PolicyPlanController` | `/api/plans` | 5. Policy Plan API | Plan CRUD |
| `PolicyController` | `/api/policies` | 6. Insurance Policy API | Policy lifecycle |
| `PremiumPaymentController` | `/api/payments` | 7. Premium Payment API | Payment recording |
| `ClaimController` | `/api/claims` | 8. Insurance Claim API | Claim lifecycle |
| `ClaimDocumentController` | `/api/document` | 9. Claim Document API | Document upload |
| `UserController` | `/api/users` | 2. User Management API | Admin user management |

---

## AuthController (`/api/auth`)

**Security:** Public (no JWT required)

| Method | Path | Request DTO | Response DTO | Description |
|---|---|---|---|---|
| POST | `/login` | `LoginRequestDTO` | `LoginResponseDTO` | Authenticate user, return JWT |
| POST | `/register` | `UserRequestDTO` | `UserResponseDTO` | Register new customer |
| POST | `/verify-otp` | `VerifyOtpRequest` | `UserResponseDTO` | Activate account via OTP |
| POST | `/resend-otp` | `ResendOtpRequestDTO` | `ResendOtpResponseDTO` | Resend OTP |
| POST | `/forgot-password` | `ForgotPasswordRequestDTO` | `String` (null) | Request password reset OTP |
| POST | `/reset-password` | `ResetPasswordRequestDTO` | `String` (null) | Reset password with OTP |

---

## CustomerController (`/api/customers`)

**Security:** JWT required; role restrictions per endpoint

| Method | Path | Role | Request DTO | Description |
|---|---|---|---|---|
| POST | `/profile` | CUSTOMER | `CustomerRequestDTO` | Complete customer profile |
| PUT | `/{id}` | CUSTOMER | `CustomerRequestDTO` | Update customer profile |
| GET | `/profile` | CUSTOMER | — | Get own profile |
| GET | `/` | ADMIN, INTERNAL_STAFF | — | Get all customers (paginated) |
| GET | `/page` | ADMIN, INTERNAL_STAFF | — | Get paginated customers |
| GET | `/{id}` | ADMIN, INTERNAL_STAFF | — | Get customer by ID |

**Notes:**
- Customer can only update their OWN profile (ownership check in service)
- Age validation: must be ≥18 years

---

## InsuranceProductController (`/api/products`)

**Security:** JWT required

| Method | Path | Role | Request DTO | Description |
|---|---|---|---|---|
| POST | `/` | ADMIN | `InsuranceRequestDTO` | Create new insurance product |
| PUT | `/{id}` | ADMIN | `ProductRequestDTO` | Update product |
| PATCH | `/{id}/deactivate` | ADMIN | — | Deactivate product |
| PATCH | `/{id}/activate` | ADMIN | — | Activate product |
| GET | `/active` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Get all active products |
| GET | `/page` | ADMIN, INTERNAL_STAFF | — | Get paginated products |
| GET | `/{id}` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Get product by ID |

---

## PolicyPlanController (`/api/plans`)

**Security:** JWT required

| Method | Path | Role | Request DTO | Description |
|---|---|---|---|---|
| POST | `/` | ADMIN | `PlanRequestDTO` | Create new plan under a product |
| PUT | `/{id}` | ADMIN | `PlanRequestDTO` | Update plan |
| PATCH | `/{id}/deactivate` | ADMIN | — | Deactivate plan |
| PATCH | `/{id}/activate` | ADMIN | — | Activate plan |
| GET | `/active` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | All active plans |
| GET | `/{productId}/active` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Active plans under product |
| GET | `/page` | ADMIN, INTERNAL_STAFF | — | Paginated plans |
| GET | `/{id}` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Get plan by ID |

---

## PolicyController (`/api/policies`)

**Security:** JWT required

| Method | Path | Role | Request DTO | Description |
|---|---|---|---|---|
| POST | `/purchase` | CUSTOMER | `PolicyPurchaseRequestDTO` | Customer buys a policy |
| POST | `/issue` | ADMIN, INTERNAL_STAFF | `PolicyIssueRequestDTO` | Issue policy to customer |
| GET | `/my-policies` | CUSTOMER | — | Get own policies (paginated) |
| GET | `/customer/{customerId}` | ADMIN, INTERNAL_STAFF | — | Get policies by customer |
| GET | `/` | ADMIN, INTERNAL_STAFF | — | All policies (paginated+filtered) |
| GET | `/{policyId}` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Get policy by ID |
| GET | `/{policyId}/claims` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Get claims for policy |
| PATCH | `/{policyId}/cancel` | ADMIN, INTERNAL_STAFF | — | Cancel a policy |

---

## PremiumPaymentController (`/api/payments`)

**Security:** JWT required

| Method | Path | Role | Request DTO | Description |
|---|---|---|---|---|
| POST | `/` | CUSTOMER, INTERNAL_STAFF | `PaymentRequestDTO` | Record a premium payment |
| GET | `/policy/{id}` | ADMIN, INTERNAL_STAFF | — | Payments by policy ID |
| GET | `/{id}` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Payment by ID |
| GET | `/page` | ADMIN, INTERNAL_STAFF | — | All payments (paginated+filtered) |
| GET | `/my-payments` | CUSTOMER | — | Own payment history |
| GET | `/my-policies/{policyId}` | CUSTOMER | — | Own payments for specific policy |

---

## ClaimController (`/api/claims`)

**Security:** JWT required

| Method | Path | Role | Request DTO | Description |
|---|---|---|---|---|
| POST | `/raise` | CUSTOMER | `ClaimRequestDTO` + files | File a new claim with documents |
| GET | `/my-claims` | CUSTOMER | — | Own claims list |
| GET | `/` | ADMIN, INTERNAL_STAFF | — | All claims (paginated+filtered) |
| GET | `/{claimId}` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Claim by ID |
| GET | `/{claimId}/history` | ADMIN, INTERNAL_STAFF, CUSTOMER | — | Claim audit history |
| PATCH | `/{claimId}/under-review` | INTERNAL_STAFF | — | Move to UNDER_REVIEW |
| PATCH | `/{claimId}/assign` | INTERNAL_STAFF | — | Assign claim to self |
| PATCH | `/{claimId}/review` | INTERNAL_STAFF | `ClaimReviewRequestDTO` | Recommend approval/rejection |
| PATCH | `/{claimId}/final-decision` | ADMIN | `ClaimReviewRequestDTO` | Approve or reject claim |

**Note:** `/raise` uses `multipart/form-data` with two parts:
- `claim` (JSON): `ClaimRequestDTO`
- `files` (multipart): one or more files

---

## ClaimDocumentController (`/api/document`)

**Security:** JWT required; CUSTOMER only

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/upload/{claimId}` | CUSTOMER | Upload additional documents to an existing claim |

---

## UserController (`/api/users`)

**Security:** JWT required; Admin-heavy

| Method | Path | Role | Request DTO | Description |
|---|---|---|---|---|
| POST | `/staff` | ADMIN | `CreateStaffRequestDTO` | Create new staff account |
| GET | `/` | ADMIN | — | Get all users |
| GET | `/{id}` | ADMIN | — | Get user by ID |
| GET | `/page` | ADMIN | — | Paginated user list |
| PATCH | `/{id}/status` | ADMIN | `UserStatusUpdateRequestDTO` | Activate/deactivate user |

---

## Consistent Response Structure

All endpoints return `ApiResponseDTO<T>`:

```json
{
  "message": "Human-readable success message",
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T10:00:00"
}
```

Error responses return `ErrorResponseDTO`:
```json
{
  "timestamp": "2024-01-01T10:00:00",
  "statusCode": 400,
  "errorType": "BAD_REQUEST",
  "message": "Descriptive error message",
  "requestPath": "/api/claims/raise"
}
```

Validation errors return `ValidationErrorResponseDTO`:
```json
{
  "timestamp": "...",
  "statusCode": 400,
  "errorType": "VALIDATION_FAILED",
  "message": "Validation Failed.",
  "requestPath": "...",
  "fieldErrors": {
    "claimAmount": "Claim amount must be strictly greater than 0",
    "incidentDate": "Incident date is required"
  }
}
```

---

## Pagination Parameters (all paginated endpoints)

| Parameter | Default | Description |
|---|---|---|
| `pageNumber` | `0` | Zero-based page index |
| `pageSize` | `10` | Records per page |
| `sortBy` | varies | Field name to sort by (validated) |
| `sortDirection` | `asc` or `desc` | Sort direction |

Paginated responses use `PageResponseDTO<T>`:
```json
{
  "content": [...],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 150,
  "totalPages": 15,
  "last": false,
  "sortDirection": "desc"
}
```

---

## Common Controller Mistakes

1. **Do NOT add business logic in controllers** — validation only, delegate to service
2. **Do NOT forget `@Valid`** — without it, `@NotBlank`, `@Size`, etc. are not enforced
3. **Do NOT return entity objects directly** — always use DTOs
4. **Do NOT catch exceptions in controllers** — let `GlobalExceptionHandler` handle them
5. **Do NOT add security logic in controllers** — security belongs in service layer for ownership checks

---

## Related Documents

- [services/services-overview.md](../services/services-overview.md)
- [dto/dto-overview.md](../dto/dto-overview.md)
- [security/security-overview.md](../security/security-overview.md)

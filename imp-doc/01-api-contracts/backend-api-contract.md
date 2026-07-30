# Insurance Policy & Claim Management System — API Contract

> **Base URL:** `http://localhost:8080/api`  
> **Auth:** JWT Bearer token (`Authorization: Bearer <token>`)  
> **Content-Type:** `application/json` (unless file upload)

---

## Enums Reference

```typescript
// Roles
enum Role { ROLE_ADMIN, ROLE_INTERNAL_STAFF, ROLE_CUSTOMER }

// Product Types
enum ProductType { HEALTH, MOTOR, LIFE, TRAVEL, INSURANCE }

// Premium Types
enum PremiumType { ONE_TIME, ANNUAL }

// Policy Statuses
enum PolicyStatus { PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED }

// Claim Statuses (state machine order)
enum ClaimStatus { SUBMITTED, UNDER_REVIEW, RECOMMENDED_FOR_APPROVAL, RECOMMENDED_FOR_REJECTION, APPROVED, REJECTED }

// Payment Modes
enum PaymentMode { UPI, CARD, NET_BANKING, CASH }

// Payment Statuses
enum PaymentStatus { PENDING, SUCCESS, FAILED }
```

---

## Common Response Wrappers

### `ApiResponseDTO<T>` — Single-item response

```json
{
  "message": "string",
  "success": true,
  "data": { /* T */ },
  "timeStamp": "2026-07-01T12:00:00"
}
```

### `PageResponseDTO<T>` — Paginated response

```json
{
  "content": [ /* T[] */ ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalRecords": 100,
  "totalPages": 10,
  "lastPage": false,
  "sortingType": "asc"
}
```

### `ErrorResponseDTO` — Error response (HTTP 4xx/5xx)

```json
{
  "timestamp": "2026-07-01T12:00:00",
  "statusCode": 400,
  "errorType": "BAD_REQUEST",
  "message": "Human-readable error",
  "requestPath": "/api/auth/login"
}
```

---

## 1. Authentication API — `/auth`

### `POST /auth/register` — PUBLIC — Register as Customer

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Pass@123",
  "mobileNumber": "+919876543210"
}
```
**Validation rules:**
- `fullName`: 2–100 chars, letters/spaces only
- `email`: valid email
- `password`: 6–15 chars, must contain uppercase + lowercase + digit + special char
- `mobileNumber`: international format e.g. `+919876543210`

**Response** `201 Created` — `ApiResponseDTO<UserResponseDTO>`
```json
{
  "message": "Customer registered successfully. OTP sent to email and phone.",
  "success": true,
  "data": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "mobileNumber": "+919876543210",
    "role": "ROLE_CUSTOMER",
    "isActive": false,
    "emailVerified": false,
    "phoneVerified": false,
    "createdDate": "2026-07-01T12:00:00",
    "updatedDate": "2026-07-01T12:00:00"
  },
  "timeStamp": "2026-07-01T12:00:00"
}
```

---

### `POST /auth/verify-otp` — PUBLIC — Verify OTP (activate account)

**Request:**
```json
{
  "email": "john@example.com",
  "emailOtp": "123456",
  "phoneOtp": "654321"
}
```

**Response** `200 OK` — `ApiResponseDTO<UserResponseDTO>`
```json
{
  "message": "Your account has been activated successfully.",
  "success": true,
  "data": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "ROLE_CUSTOMER",
    "isActive": true,
    "emailVerified": true,
    "phoneVerified": true,
    ...
  },
  "timeStamp": "2026-07-01T12:00:00"
}
```

**Flow:** You must call register first → OTPs are sent → Call verify-otp with both OTPs.

---

### `POST /auth/resend-otp` — PUBLIC — Resend OTP

**Request:**
```json
{
  "email": "john@example.com",
  "phone": "+919876543210"
}
```

**Response** `200 OK` — `ApiResponseDTO<ResendOtpResponseDTO>`
```json
{
  "message": "OTP has been resent to your email and phone.",
  "success": true,
  "data": {
    "email": "john@example.com",
    "phone": "+919876543210"
  },
  "timeStamp": "2026-07-01T12:00:00"
}
```

**Flow:** Only works if previous OTP has expired. If a valid OTP is still active, you get a 400 error.

---

### `POST /auth/login` — PUBLIC — Login

**Request:**
```json
{
  "email": "john@example.com",
  "password": "Pass@123"
}
```

**Response** `200 OK` — `LoginResponseDTO`
```json
{
  "userId": 1,
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "ROLE_CUSTOMER",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "message": "Login successful",
  "tokenType": "Bearer"
}
```

**Flow:** User must be verified (emailVerified + phoneVerified) and active (isActive = true).

---

### `POST /auth/forgot-password` — PUBLIC — Request password reset OTP

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response** `200 OK` — `ApiResponseDTO<String>`
```json
{
  "message": "OTP sent to your registered email and phone number.",
  "success": true,
  "data": null,
  "timeStamp": "2026-07-01T12:00:00"
}
```

---

### `POST /auth/reset-password` — PUBLIC — Reset password with OTP

**Request:**
```json
{
  "email": "john@example.com",
  "emailOtp": "123456",
  "phoneOtp": "654321",
  "newPassword": "NewPass@123"
}
```
**Note:** `newPassword` must be at least 8 characters.

**Response** `200 OK` — `ApiResponseDTO<String>`

---

## 2. User Management API — `/users` (Admin only)

All endpoints require `Authorization: Bearer <admin-token>`.

### `GET /users` — ADMIN — List all users

**Response** `200 OK` — `ApiResponseDTO<List<UserResponseDTO>>`

### `GET /users/page?page=0&size=10&sortBy=id&sortDirection=asc&role=&isActive=` — ADMIN — Paginated users

**Query params:** `pageNumber`, `pageSize` (max 100), `sortBy` (id|fullName|email|mobileNumber|role|isActive), `sortDirection` (asc|desc), `role` (optional filter: ROLE_CUSTOMER|ROLE_INTERNAL_STAFF|ROLE_ADMIN), `isActive` (optional boolean filter)

**Response** `200 OK` — `PageResponseDTO<UserResponseDTO>`

### `GET /users/{id}` — ADMIN — Get user by ID

**Response** `200 OK` — `ApiResponseDTO<UserResponseDTO>`

### `POST /users/staff` — ADMIN — Create internal staff

**Request:**
```json
{
  "fullName": "Staff Name",
  "email": "staff@insurance.com",
  "password": "Staff@123",
  "mobileNumber": "+919876543210",
  "productSpeciality": "HEALTH"
}
```
`productSpeciality` is one of `ProductType`: `HEALTH`, `MOTOR`, `LIFE`, `TRAVEL`, `INSURANCE`

**Response** `201 Created` — `ApiResponseDTO<UserResponseDTO>` (Account created. OTP sent.)

### `PATCH /users/{id}/activate` — ADMIN — Activate user

**Response** `200 OK` — `ApiResponseDTO<UserResponseDTO>`
- Cannot self-activate (400 error)
- User must be email-verified first

### `PATCH /users/{id}/deactivate` — ADMIN — Deactivate user

**Response** `200 OK` — `ApiResponseDTO<UserResponseDTO>`
- Cannot self-deactivate (400 error)

---

## 3. Customer Profile API — `/customers`

### `POST /customers` — CUSTOMER — Create/complete profile

**Request:**
```json
{
  "dateOfBirth": "1990-01-15",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "nomineeName": "Jane Doe",
  "nomineeRelation": "Spouse"
}
```
**Validation:** `pinCode` must be 6 digits, `dateOfBirth` must be in past, city/state/nomineeName/nomineeRelation letters/spaces only.

**Response** `201 Created` — `ApiResponseDTO<CustomerResponseDTO>`

### `GET /customers/profile` — CUSTOMER — Get own profile

**Response** `200 OK` — `ApiResponseDTO<CustomerResponseDTO>`

### `PUT /customers/{customerId}` — CUSTOMER — Update own profile

**Request:** Same body as `POST /customers`

**Response** `200 OK` — `ApiResponseDTO<CustomerResponseDTO>`
- Customers can only update their own profile (ownership enforced server-side)

### `GET /customers` — ADMIN, INTERNAL_STAFF — List all customers

**Response** `200 OK` — `ApiResponseDTO<List<CustomerResponseDTO>>`

### `GET /customers/page?page=0&size=10&sortBy=id&sortDirection=asc&city=&state=` — ADMIN, INTERNAL_STAFF — Paginated customers

**Query params:** `pageNumber`, `pageSize`, `sortBy` (id|city|state|pinCode|createdDate), `sortDirection` (asc|desc), `city` (optional filter), `state` (optional filter)

### `GET /customers/{customerId}` — ADMIN, INTERNAL_STAFF — Get customer by ID

**Response** `200 OK` — `ApiResponseDTO<CustomerResponseDTO>`

---

## 4. Insurance Product API — `/products`

### `POST /products` — ADMIN — Create product

**Request:**
```json
{
  "productName": "Health Insurance",
  "productType": "HEALTH",
  "description": "Comprehensive health coverage plan",
  "activeStatus": true
}
```

**Response** `201 Created` — `ApiResponseDTO<ProductResponseDTO>`

### `PUT /products/{id}` — ADMIN — Update product

**Request:** Same body as POST

**Response** `200 OK` — `ProductResponseDTO` (note: direct object, not wrapped)

### `PATCH /products/{id}/activate` — ADMIN — Activate product

**Response** `200 OK` — `ApiResponseDTO<ProductResponseDTO>`

### `PATCH /products/{id}/deactivate` — ADMIN — Deactivate product

**Response** `200 OK` — `ApiResponseDTO<ProductResponseDTO>`

### `GET /products/active` — ALL ROLES — List active products

**Response** `200 OK` — `ApiResponseDTO<List<ProductResponseDTO>>`

### `GET /products/{id}` — ALL ROLES — Get product by ID

**Response** `200 OK` — `ApiResponseDTO<ProductResponseDTO>`

### `GET /products/page?page=0&size=10&sortBy=id&sortDirection=asc&productType=&isActive=` — ADMIN, INTERNAL_STAFF — Paginated products

**Query params:** `pageNumber`, `pageSize`, `sortBy` (id|productName|productType), `sortDirection`, `productType` (optional filter), `isActive` (optional filter)

**Response** `200 OK` — `PageResponseDTO<ProductResponseDTO>`

---

## 5. Policy Plan API — `/plans`

### `POST /plans` — ADMIN — Create plan

**Request:**
```json
{
  "productId": 1,
  "planName": "Gold Plan",
  "coverageAmount": 500000,
  "premiumAmount": 5000,
  "premiumType": "ANNUAL",
  "duration": 10,
  "termsAndConditions": "Terms and conditions apply...",
  "activeStatus": true
}
```
**Business rules:**
- `coverageAmount` must be > `premiumAmount`
- Product must be active
- Plan name must be unique (case-insensitive)
- `duration` cannot exceed 40

**Response** `201 Created` — `ApiResponseDTO<PlanResponseDTO>`

### `PUT /plans/{planId}` — ADMIN — Update plan

**Request:** Same body as POST

**Response** `200 OK` — `ApiResponseDTO<PlanResponseDTO>`
- Cannot update an inactive plan
- Plan name uniqueness excludes self

### `PATCH /plans/{planId}/activate` — ADMIN — Activate plan

**Response** `200 OK` — `ApiResponseDTO<PlanResponseDTO>`

### `PATCH /plans/{planId}/deactivate` — ADMIN — Deactivate plan

**Response** `200 OK` — `ApiResponseDTO<PlanResponseDTO>`

### `GET /plans/active` — ALL ROLES — List all active plans

**Response** `200 OK` — `ApiResponseDTO<List<PlanResponseDTO>>`

### `GET /plans/{productId}/active` — ALL ROLES — Active plans under a product

**Response** `200 OK` — `ApiResponseDTO<List<PlanResponseDTO>>`

### `GET /plans/{planId}` — ALL ROLES — Get plan by ID

**Response** `200 OK` — `ApiResponseDTO<PlanResponseDTO>`
- Customers see active plans only (inactive plans return 404 for customers)

### `GET /plans/page?page=0&size=10&sortBy=createdDate&sortDirection=desc&productId=&isActive=` — ADMIN, INTERNAL_STAFF — Paginated plans

**Query params:** `pageNumber`, `pageSize`, `sortBy` (id|planName|coverageAmount|premiumAmount|createdDate), `sortDirection`, `productId` (optional), `isActive` (optional)

---

## 6. Policy API — `/policies`

### `POST /policies/purchase` — CUSTOMER — Purchase a policy

**Request:**
```json
{
  "planId": 1,
  "startDate": "2026-07-01"
}
```
**Business rules:**
- Customer profile must be complete (nominee name + address + city + state filled)
- `startDate` cannot be in the future
- For HEALTH products: cannot have duplicate ACTIVE or PENDING_PAYMENT policies on same plan
- For non-HEALTH: cannot have duplicate PENDING_PAYMENT policies on same plan
- Policy is created in `PENDING_PAYMENT` status

**Response** `201 Created` — `ApiResponseDTO<PolicyResponseDTO>`
```json
{
  "message": "Policy purchased successfully. Please complete the payment to activate.",
  "success": true,
  "data": {
    "policyId": 1,
    "policyNumber": "POL-ABC12345",
    "customerId": 1,
    "customerName": "John Doe",
    "planId": 1,
    "planName": "Gold Plan",
    "startDate": "2026-07-01",
    "endDate": "2036-07-01",
    "policyStatus": "PENDING_PAYMENT",
    "totalPremiumPaid": 0,
    "productType": "HEALTH",
    "coverageAmount": 500000,
    "premiumAmount": 5000,
    "premiumType": "ANNUAL",
    "createdDate": "2026-07-01T12:00:00",
    "remainingClaimAmount": 500000
  },
  "timeStamp": "2026-07-01T12:00:00"
}
```

### `POST /policies/issue` — ADMIN, INTERNAL_STAFF — Issue policy to customer

**Request:**
```json
{
  "customerId": 1,
  "planId": 1,
  "startDate": "2026-07-01"
}
```

**Response** `201 Created` — `ApiResponseDTO<PolicyResponseDTO>`

### `GET /policies/my-policies?page=0&size=10&sort=id&direction=asc` — CUSTOMER — Get own policies (paginated)

**Response** `200 OK` — `PageResponseDTO<PolicyResponseDTO>`

### `GET /policies/{policyId}` — ALL ROLES — Get policy by ID

**Response** `200 OK` — `ApiResponseDTO<PolicyResponseDTO>`
- Customers can only see their own policies (ownership enforced server-side)

### `GET /policies` — ADMIN, INTERNAL_STAFF — List all policies (paginated)

**Query params:** `page`, `size`, `sort` (id|policyNumber|policyStatus|totalPremiumPaid), `direction`, `customerId` (optional), `status` (optional filter: PENDING_PAYMENT|ACTIVE|EXPIRED|CANCELLED), `policyNumber` (optional, partial match), `fromDate` (optional, filters by createdDate ≥), `toDate` (optional, filters by createdDate ≤)

**Response** `200 OK` — `PageResponseDTO<PolicyResponseDTO>`

### `GET /policies/customer/{customerId}?page=0&size=10&sort=id&direction=asc` — ADMIN, INTERNAL_STAFF — Policies by customer

### `GET /policies/{policyId}/claims` — ALL ROLES — Claims under a policy

**Response** `200 OK` — `ResponseEntity<...>` (delegates to claim service)

### `PATCH /policies/{policyId}/cancel` — ADMIN, INTERNAL_STAFF — Cancel policy

**Response** `200 OK` — `ApiResponseDTO<PolicyResponseDTO>`
- Cannot cancel if any claim is open (SUBMITTED, UNDER_REVIEW, RECOMMENDED_FOR_APPROVAL, RECOMMENDED_FOR_REJECTION)

---

## 7. Premium Payment API — `/payments`

### `POST /payments` — CUSTOMER, INTERNAL_STAFF — Record a payment

**Request:**
```json
{
  "policyId": 1,
  "amount": 5000,
  "paymentMode": "UPI",
  "paymentStatus": "SUCCESS"
}
```

**Business rules:**
- `amount` must exactly match the plan's `premiumAmount`
- Policy must not be CANCELLED or EXPIRED
- `ONE_TIME` premium: only one payment allowed (prevents duplicates)
- `ANNUAL` premium: allows multiple payments up to `duration` limit
- Only `SUCCESS` payments are recorded; `transactionReference` is auto-generated
- Successful payment sets policy to `ACTIVE` (if PENDING_PAYMENT)
- `totalPremiumPaid` tracked on policy (cannot exceed `premiumAmount * duration`)

**Response** `201 Created` — `ApiResponseDTO<PaymentResponseDTO>`

### `GET /payments/my-payments` — CUSTOMER — Own payment history

**Response** `200 OK` — `ApiResponseDTO<List<PaymentResponseDTO>>`

### `GET /payments/my-policies/{policyId}` — CUSTOMER — Payments for own policy

**Response** `200 OK` — `ApiResponseDTO<List<PaymentResponseDTO>>`

### `GET /payments/{id}` — ALL ROLES — Get payment by ID

**Response** `200 OK` — `ApiResponseDTO<PaymentResponseDTO>`
- Customers can only see payments linked to their own policies

### `GET /payments/policy/{id}` — ADMIN, INTERNAL_STAFF — Payments by policy

### `GET /payments/page?pageNumber=0&pageSize=10&sortBy=id&sortDirection=asc&policyId=&paymentStatus=` — ADMIN, INTERNAL_STAFF — Paginated payments

**Query params:** `pageNumber`, `pageSize`, `sortBy` (id|amount|paymentDate|paymentMode|paymentStatus), `sortDirection`, `policyId` (optional), `paymentStatus` (optional)

---

## 8. Premium Calculation API — `/premium`

### `POST /premium/calculate` — CUSTOMER — Generate a premium quote

**Request:**
```json
{
  "planId": 1,
  "coverageAmount": 500000,
  "duration": 3,
  "premiumType": "ONE_TIME"
}
```

**Response** `200 OK` — `ApiResponseDTO<PremiumQuote>`

```json
{
  "message": "Premium quote generated successfully",
  "success": true,
  "data": {
    "quoteId": 1,
    "selectedCoverage": 500000,
    "duration": 3,
    "premiumType": "ONE_TIME",
    "basePremium": 12500.00,
    "annualPremium": 12800.00,
    "processingFee": 100.00,
    "gst": 0.00,
    "totalCommitment": 38400.00,
    "discountPercentage": 5,
    "discountAmount": 1920.00,
    "oneTimeDiscount": 1920.00,
    "totalPremium": 36480.00,
    "expiresAt": "2026-07-28T12:01:00",
    "status": "CREATED"
  },
  "timeStamp": "2026-07-28T12:00:00"
}
```

**Premium Calculation Logic:**
- `basePremium = coverageAmount × riskRate`
- `annualPremium = basePremium + processingFee + gst`
- **ANNUAL**: `totalPremium = annualPremium` (customer pays each year)
- **ONE_TIME**: `totalPremium = (annualPremium × duration) - durationDiscount`
  - Duration discounts: 2yr=2%, 3yr=5%, 5yr=8%, 7yr=10%, 10yr=12%, 15yr=15%, 20yr=18%, 25yr+=20%

### `POST /premium/admin/calculate` — ADMIN, INTERNAL_STAFF — Generate quote for a customer

**Request:**
```json
{
  "customerId": 1,
  "planId": 1,
  "coverageAmount": 500000,
  "duration": 3,
  "premiumType": "ONE_TIME"
}
```

**Response** `200 OK` — `ApiResponseDTO<PremiumQuote>` (same as above)

---

## 9. Claim API — `/claims`

### Claim State Machine

```
SUBMITTED → UNDER_REVIEW → RECOMMENDED_FOR_APPROVAL → APPROVED
                                      or
                            RECOMMENDED_FOR_REJECTION → REJECTED
```

- **CUSTOMER**: raises claim → SUBMITTED
- **INTERNAL_STAFF**: moves to UNDER_REVIEW → assigns to self → reviews (recommends APPROVAL or REJECTION)
- **ADMIN**: final decision (APPROVE or REJECT)

### `POST /claims/raise` — CUSTOMER — Submit a claim

**Request** (multipart/form-data):
| Field | Type | Notes |
|---|---|---|
| `claim` | JSON string | `ClaimRequestDTO` (see below) |
| `files` | File[] | At least 1 file, JPEG/PNG/PDF only, max 5MB each |

**ClaimRequestDTO (JSON field)**:
```json
{
  "policyId": 1,
  "claimAmount": 25000,
  "claimReason": "Accident damage to vehicle",
  "incidentDate": "2026-06-15"
}
```

**Business rules:**
- Policy must be ACTIVE
- Claim amount ≤ remaining coverage (`coverageAmount - sum(active claims)`)
- Incident date must be within policy period and not in the future
- At least 1 supporting document required

**Response** `201 Created` — `ApiResponseDTO<ClaimResponseDTO>`
```json
{
  "message": "Claim submitted successfully with supporting documents.",
  "success": true,
  "data": {
    "claimId": 1,
    "claimNumber": "CLM-ABC12345",
    "policyId": 1,
    "policyNumber": "POL-ABC12345",
    "claimAmount": 25000,
    "claimReason": "Accident damage to vehicle",
    "incidentDate": "2026-06-15",
    "claimStatus": "SUBMITTED",
    "staffRemarks": null,
    "adminRemarks": null,
    "customerName": "John Doe",
    "createdDate": "2026-07-01T12:00:00",
    "updatedDate": "2026-07-01T12:00:00",
    "documents": [
      {
        "documentName": "damage_photo.jpg",
        "documentType": "image/jpeg",
        "documentReference": "https://res.cloudinary.com/..."
      }
    ],
    "assignedStaffId": null,
    "assignedStaffName": null
  },
  "timeStamp": "2026-07-01T12:00:00"
}
```

### `GET /claims/my-claims` — CUSTOMER — Own claims

**Response** `200 OK` — `ApiResponseDTO<List<ClaimResponseDTO>>`

### `GET /claims/{claimId}` — ALL ROLES — Get claim by ID

**Response** `200 OK` — `ApiResponseDTO<ClaimResponseDTO>`
- Customers can only view their own claims

### `GET /claims/{claimId}/history?pageNumber=0&pageSize=10&sortBy=id&sortDirection=desc&updatedBy=&status=` — ALL ROLES — Claim status history

**Response** `200 OK` — `PageResponseDTO<ClaimHistoryResponseDTO>`
```json
{
  "historyId": 1,
  "previousStatus": "SUBMITTED",
  "newStatus": "UNDER_REVIEW",
  "remarks": "Claim under review",
  "updatedBy": "staff@insurance.com",
  "updatedDate": "2026-07-01T12:30:00"
}
```
- Customers can only view history of their own claims

### `GET /claims?pageNumber=0&pageSize=10&sortBy=createdDate&sortDirection=desc&customerId=&status=` — ADMIN, INTERNAL_STAFF — All claims (paginated)

**Query params:** `pageNumber`, `pageSize`, `sortBy` (id|claimNumber|claimAmount|createdDate|claimStatus), `sortDirection`, `customerId` (optional), `status` (optional — ClaimStatus value)

**Response** `200 OK` — `PageResponseDTO<ClaimResponseDTO>`
- INTERNAL_STAFF sees only claims matching their `productSpeciality`

### `PATCH /claims/{claimId}/under-review` — INTERNAL_STAFF — Move claim to UNDER_REVIEW

**Request:** No body required

**Response** `200 OK` — `ApiResponseDTO<ClaimResponseDTO>`
- Claim must be in SUBMITTED status
- Claim must not already be APPROVED or REJECTED

### `PATCH /claims/{claimId}/assign` — INTERNAL_STAFF — Assign claim to self

**Request:** No body required

**Response** `200 OK` — `ApiResponseDTO<ClaimResponseDTO>`
- Claim must be in UNDER_REVIEW status
- Claim must not already be assigned to another staff member

### `PATCH /claims/{claimId}/review` — INTERNAL_STAFF — Review & recommend

**Request:**
```json
{
  "recommendedStatus": "RECOMMENDED_FOR_APPROVAL",
  "remarks": "All documentation verified. Claim is valid."
}
```
`recommendedStatus` must be either `RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION`.

**Response** `200 OK` — `ApiResponseDTO<ClaimResponseDTO>`
- Claim must be assigned to the current staff member
- Claim must be in UNDER_REVIEW status

### `PATCH /claims/{claimId}/final-decision` — ADMIN — Final approve/reject

**Request:**
```json
{
  "recommendedStatus": "APPROVED",
  "remarks": "Approved. Payment will be processed."
}
```
`recommendedStatus` must be either `APPROVED` or `REJECTED`.

**Response** `200 OK` — `ApiResponseDTO<ClaimResponseDTO>`
- Claim must be in RECOMMENDED_FOR_APPROVAL or RECOMMENDED_FOR_REJECTION status
- Cannot be reversed once finalized

---

## 9. Claim Document API — `/document`

### `POST /document/upload/{claimId}` — CUSTOMER — Upload documents to existing claim

**Request** (multipart/form-data):
| Field | Type | Notes |
|---|---|---|
| `files` | File[] | JPEG/PNG/PDF only, max 10MB each |

**Response** `200 OK` — `ApiResponseDTO<List<ClaimDocumentResponseDTO>>`
```json
{
  "message": "Supporting documents uploaded successfully.",
  "success": true,
  "data": [
    {
      "documentName": "report.pdf",
      "documentType": "application/pdf",
      "documentReference": "https://res.cloudinary.com/..."
    }
  ],
  "timeStamp": "2026-07-01T12:00:00"
}
```
- Customers can only upload to their own claims

---

## 10. Pagination Query Parameters

Most list endpoints accept these standard query params:

| Param | Default | Description |
|---|---|---|
| `pageNumber` / `page` | 0 | Page index (0-based) |
| `pageSize` / `size` | 10 | Items per page (max 100) |
| `sortBy` / `sort` | varies | Sort field (varies per endpoint, listed above) |
| `sortDirection` / `direction` | varies | `asc` or `desc` |

---

## 11. Complete Flow by Role

### Customer Flow
```
1. POST /auth/register              → Account created, OTP sent
2. POST /auth/verify-otp            → Account activated
3. POST /auth/login                 → JWT token received
4. POST /customers                  → Complete profile
5. GET  /products/active            → Browse products
6. GET  /plans/{productId}/active   → See plans under product
7. GET  /plans/{planId}             → View plan details
8. POST /policies/purchase          → Purchase policy (PENDING_PAYMENT)
9. POST /payments                   → Pay premium → policy ACTIVE
10. POST /claims/raise + files      → Raise claim with documents
11. GET  /claims/my-claims          → Track claims
12. GET  /claims/{id}/history       → View claim audit trail
13. POST /document/upload/{id}      → Add more documents if needed
```

### Internal Staff Flow
```
1. (Admin creates staff account)
2. POST /auth/login                 → JWT token
3. GET  /claims?status=SUBMITTED    → View submitted claims
4. PATCH /claims/{id}/under-review  → Start reviewing
5. PATCH /claims/{id}/assign        → Assign to self
6. PATCH /claims/{id}/review        → Recommend approval/rejection
7. POST /policies/issue             → Issue policies to customers
8. PATCH /policies/{id}/cancel      → Cancel policies if needed
9. GET  /customers/page             → Manage customer records
```

### Admin Flow
```
1. (Seed data creates admin)
2. POST /auth/login                 → JWT token
3. POST /products                   → Create insurance products
4. POST /plans                      → Create policy plans
5. POST /users/staff                → Create staff accounts
6. PATCH /users/{id}/activate       → Activate users
7. PATCH /claims/{id}/final-decision → Final approve/reject claims
8. All other endpoints accessible
```

# Documentation & Diagram Audit Report

> **Completed:** Post-implementation. Source code was the single source of truth for all corrections.

---

## Audit Scope

| Area | Files Audited |
|---|---|
| Diagrams | `diagrams/` — 6 existing files + 1 new |
| API Documentation | `docs/03_API/` — 4 files corrected |
| Source Code Reference | All entities, controllers, DTOs, services, enums in `com.insurance.demo` |

---

## Discrepancy Log & Corrections

### D1 — Class Diagram: Wrong `Customer` Entity Fields
- **File:** `diagrams/05_Class_and_Design_Patterns.md`
- **Problem:** Diagram showed `Gender gender` field on `Customer`. No `gender` field exists in `Customer.java`.
- **Fix:** Removed `gender` field. Added actual fields: `city`, `state`, `pinCode`, `nomineeName`, `nomineeRelation`.

### D2 — Class Diagram: Wrong `CoverageOption` Field Name
- **File:** `diagrams/05_Class_and_Design_Patterns.md`
- **Problem:** Diagram showed `String tierName`. Actual entity field is `String label`.
- **Fix:** Renamed `tierName` to `label`.

### D3 — Class Diagram: All `ClaimDocument` Field Names Wrong
- **File:** `diagrams/05_Class_and_Design_Patterns.md`
- **Problem:** Diagram showed `documentName`, `documentUrl`, `cloudinaryPublicId`, `uploadedAt`. None of these match the actual entity.
- **Fix:** Corrected to `name`, `documentType`, `documentReference`, `publicId`, `uploadedDate`.

### D4 — Class Diagram: Wrong `PricingRule` Fields
- **File:** `diagrams/05_Class_and_Design_Patterns.md`
- **Problem:** Diagram showed `Integer version` (does not exist). Actual entity has `effectiveFrom`, `effectiveTo`, `remarks`.
- **Fix:** Removed `version`, added `effectiveFrom`, `effectiveTo`, `remarks`.

### D5 — Class Diagram: Non-Existent `PolicyPlan.description` Field
- **File:** `diagrams/05_Class_and_Design_Patterns.md`
- **Problem:** Diagram showed `String description`. `PolicyPlan.java` has no `description` field; it has `termsAndConditions`.
- **Fix:** Removed `description`, added `termsAndConditions`.

### D6 — Class Diagram: Wrong `RefreshToken` Fields
- **File:** `diagrams/05_Class_and_Design_Patterns.md`
- **Problem:** Diagram showed `replacedByTokenHash`, `ipAddress`, `userAgent`. None of these exist in `RefreshToken.java`.
- **Fix:** Removed non-existent fields. Added actual fields: `tokenVersion`, `createdAt`.

### D7 — Class Diagram: Missing Enums
- **File:** `diagrams/05_Class_and_Design_Patterns.md`
- **Problem:** `PaymentMode`, `PaymentStatus`, `QuoteStatus`, `PricingRuleStatus` enums were missing from the diagram.
- **Fix:** Added all four enums with their correct values.

### D8 — ER Diagram: CUSTOMERS Table Wrong NULL Constraints
- **File:** `diagrams/02_ER_Diagrams.md`
- **Problem:** `dob DATE NOT NULL` and `address TEXT NOT NULL` were shown. Both are nullable in `Customer.java`.
- **Fix:** Removed `NOT NULL` constraints. Marked as nullable.

### D9 — ER Diagram: POLICIES Table Wrong FK Column Name
- **File:** `diagrams/02_ER_Diagrams.md`
- **Problem:** FK shown as `policy_plan_id`. Actual `@JoinColumn(name = "plan_id")` in `Policy.java`.
- **Fix:** Corrected to `plan_id`.

### D10 — ER Diagram: RefreshToken Schema Wrong Fields
- **File:** `diagrams/02_ER_Diagrams.md`
- **Problem:** Schema showed `replacedByTokenHash`, `ipAddress`, `userAgent` — none exist in `RefreshToken.java`. Missing `token_version`, `created_at`.
- **Fix:** Removed non-existent columns. Added `token_version` and `created_at`.

### D11 — ER Diagram: Missing Tables
- **File:** `diagrams/02_ER_Diagrams.md`
- **Problem:** `coverage_options`, `pricing_rules`, `quotes`, `policy_plan_durations`, `claim_documents` were not shown.
- **Fix:** Added all missing table schemas with correct columns.

### D12 — Sequence Diagram: Customer KYC Step Not Clear
- **File:** `diagrams/03_Sequence_Diagrams.md`
- **Problem:** Old sequence did not clearly describe that `registerUser()` also saves an empty `Customer` record.
- **Confirmed from source:** `AuthServiceImpl.registerUser()` explicitly calls `customerRepository.save(emptyCustomer)`.
- **Fix:** Added explicit step "Save empty Customer record (linked to AppUser)" in registration sequence.

### D13 — Sequence Diagram: OTP Verify Shows Wrong Fields
- **File:** `diagrams/03_Sequence_Diagrams.md`
- **Problem:** Did not show the actual DTO fields. `VerifyOtpRequest` has `email`, `emailOtp`, `phoneOtp`.
- **Fix:** Updated sequence to show actual request fields.

### D14 — Sequence Diagram: Missing Sequences
- **File:** `diagrams/03_Sequence_Diagrams.md`
- **Problem:** No sequence for Customer Profile creation or Product/Plan creation.
- **Fix:** Added "Customer Profile Creation Sequence" (Seq 2) and "Product & Plan Creation Sequence" (Seq 3).

### D15 — Policy_API.md: Three Wrong Endpoint URLs
- **File:** `docs/03_API/Policy_API.md`
- **Problem:** `POST /api/admin/policies/issue`, `GET /api/admin/policies`, `GET /api/staff/policies` do not exist.
- **Actual:** `POST /api/policies/issue`, `GET /api/policies`, `GET /api/policies/customer/{customerId}`
- **Fix:** All corrected.

### D16 — Policy_API.md: Wrong Purchase Request Body
- **File:** `docs/03_API/Policy_API.md`
- **Problem:** Showed `paymentReference` and `amountPaid`. `PolicyPurchaseRequestDTO` has `quoteId` and `paymentReferenceId` only.
- **Fix:** Corrected to `{ "quoteId": 123, "paymentReferenceId": "optional-ref" }`.

### D17 — Policy_API.md: Purchase Creates PENDING_PAYMENT, Not ACTIVE
- **File:** `docs/03_API/Policy_API.md`
- **Problem:** Old doc implied purchase directly activates the policy. Actual: purchase creates `PENDING_PAYMENT`, first payment creates `ACTIVE`.
- **Fix:** Documented the two-step flow correctly.

### D18 — Policy_API.md: Missing Endpoints
- **File:** `docs/03_API/Policy_API.md`
- **Problem:** `GET /api/policies/customer/{customerId}`, `GET /api/policies/{policyId}/claims`, `POST /api/premium/admin/calculate` were missing.
- **Fix:** Added all missing endpoints.

### D19 — Payment_API.md: Wrong Request Body
- **File:** `docs/03_API/Payment_API.md`
- **Problem:** Showed `quoteId`, `transactionId`, `paymentMethod`. `PaymentRequestDTO` has `policyId`, `amount`, `paymentMode`.
- **Fix:** Corrected to match actual `PaymentRequestDTO`. Documented `PaymentMode` enum values.

### D20 — Payment_API.md: Missing Endpoints
- **File:** `docs/03_API/Payment_API.md`
- **Problem:** Only 3 endpoints documented. Actual controller has 6.
- **Fix:** Added `GET /api/payments/my-policies/{policyId}`, `GET /api/payments/{paymentId}`, `GET /api/payments/page`.

### D21 — Claim_API.md: Wrong Assign Endpoint Behavior
- **File:** `docs/03_API/Claim_API.md`
- **Problem:** Documented that assign requires SUBMITTED status and changes status to UNDER_REVIEW. Both wrong.
- **Actual:** Assign requires UNDER_REVIEW status and only sets `assignedStaff` — does NOT change status.
- **Fix:** Corrected description. Assign and Under-Review documented as separate, sequential steps.

### D22 — Claim_API.md: Under-Review Has No Request Body
- **File:** `docs/03_API/Claim_API.md`
- **Problem:** Documented `{ "notes": "..." }` as request body. `ClaimController.markUnderReview()` takes no request body.
- **Fix:** Removed the request body from documentation.

### D23 — Claim_API.md: Missing Get All Claims Endpoint
- **File:** `docs/03_API/Claim_API.md`
- **Problem:** `GET /api/claims` was not documented.
- **Fix:** Added with correct query parameters: `status`, `customerId`, `minClaimAmount`, `maxClaimAmount`, `page`, `size`.

### D24 — Authentication_API.md: Wrong OTP Verify Request Body
- **File:** `docs/03_API/Authentication_API.md`
- **Problem:** Showed `{ "email", "otp", "context" }`. Actual `VerifyOtpRequest`: `email`, `emailOtp`, `phoneOtp`. No `context` field.
- **Fix:** Corrected to `{ "email", "emailOtp", "phoneOtp" }`.

### D25 — Authentication_API.md: Wrong Resend OTP Request Body
- **File:** `docs/03_API/Authentication_API.md`
- **Problem:** Showed `{ "email", "context" }`. Actual `ResendOtpRequestDTO`: `email`, `phone`. No `context` field.
- **Fix:** Corrected to `{ "email", "phone" }`.

### D26 — Authentication_API.md: Wrong Code Reference
- **File:** `docs/03_API/Authentication_API.md`
- **Problem:** Code references showed class `JwtUtils` which does not exist. Actual class is `JwtService`.
- **Fix:** Corrected to `JwtService` with correct package path. Added `RefreshTokenService`.

### D27 — Authentication_API.md: Missing Logout-All Endpoint
- **File:** `docs/03_API/Authentication_API.md`
- **Problem:** `POST /api/auth/logout-all` was not documented in the API section.
- **Fix:** Added endpoint with correct description.

### NEW — Use Case Diagram Created
- **File:** `diagrams/07_Use_Case_Diagram.md`
- **Reason:** No use case diagram existed. Added comprehensive coverage of all 3 actors (Customer, Internal Staff, Admin) and all system use cases.

---

## Files Modified Summary

| File | Type | Changes |
|---|---|---|
| `diagrams/05_Class_and_Design_Patterns.md` | Modified | 7 attribute corrections, 4 missing enums added |
| `diagrams/02_ER_Diagrams.md` | Modified | NULL constraints, FK name, RefreshToken schema, 5 missing tables added |
| `diagrams/03_Sequence_Diagrams.md` | Modified | Registration flow corrected, OTP fields corrected, 3 new sequences added |
| `diagrams/07_Use_Case_Diagram.md` | **NEW** | Full use case coverage for all 3 actors |
| `diagrams/README.md` | Modified | Added Use Case Diagram to index table |
| `docs/03_API/Policy_API.md` | Modified | 3 wrong URLs, wrong request body, 3 missing endpoints |
| `docs/03_API/Payment_API.md` | Modified | Request body corrected, 3 missing endpoints added |
| `docs/03_API/Claim_API.md` | Modified | Assign behavior fixed, request body removed, 1 missing endpoint |
| `docs/03_API/Authentication_API.md` | Modified | 2 request bodies, code references, logout-all endpoint |

---

## Verified Correct — No Changes Needed

| File | Verification |
|---|---|
| `diagrams/01_Architecture_Diagrams.md` | Controllers, services, repositories match actual code |
| `diagrams/04_State_and_Activity_Diagrams.md` | Claim and policy state machines match actual enums |
| `diagrams/06_Flowcharts.md` | Payment and login flows match actual service logic |
| `docs/02_Business_Domain/` | Business rules and workflows are accurate |
| `docs/09_Evaluation/API_Checklist.md` | Endpoint paths already correct |

# Business Rules

> The authoritative, code-verified catalogue of every enforced business rule in the platform: purchase eligibility, duplicate policies, payment activation, claim constraints, cancellation, OTP, and rate limits.

## Purpose

Single source of truth for business rules. All other documents reference this file instead of restating rules. Each rule states what is enforced, where (enforcement point), and the effect (error/HTTP outcome). Rules were verified against the service implementations.

## Overview

Rules are grouped by domain area. "Effect" lists the exception thrown and the resulting HTTP status as produced by the global exception handler: `BadRequestException` (400), `DuplicateResourceException` (409), `AccessDeniedException` (403), `ResourceNotFoundException`/`PolicyNotFoundException` (404).

## Business Context

Insurance systems must guarantee: no accidental double-cover, no claims on unpaid or expired contracts, payments that reconcile exactly to a computed premium, and separation of duties between the staff who investigate claims and the admin who approves payout. Every rule below serves one of those invariants.

## Technical Design

### 1. Purchase & issue eligibility

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 1.1 | The authenticated customer's profile must be complete (DOB, address, city, state, pin code, nominee) before purchasing or being issued a policy. | `PolicyServiceImpl.purchasePolicy` / `issuePolicy` → `isCustomerProfileComplete` | 400 `COMPLETE_PROFILE_FIRST` |
| 1.2 | The quote must belong to the authenticated customer. | `PolicyServiceImpl.validateQuoteForPurchase` | 400 `Quote does not belong to the authenticated customer` |
| 1.3 | The quote must be in `CREATED` status (not USED, EXPIRED, CANCELLED). | `PolicyServiceImpl.validateQuoteForPurchase` | 400 `Quote status is not CREATED…` |
| 1.4 | The quote must not be past `expiresAt`; on expiry the quote is flipped to `EXPIRED`. | `PolicyServiceImpl.validateQuoteForPurchase` | 400 `Quote has expired` |
| 1.5 | The selected plan and its product must both be active at purchase time. | `PolicyServiceImpl.validateQuoteForPurchase` | 400 `The selected Policy Plan is no longer active` / `The Insurance Product is no longer active` |
| 1.6 | Issuing a policy requires the target customer profile to be complete and a valid quote for that customer. | `PolicyServiceImpl.issuePolicy` | 400 as above |
| 1.7 | Staff issuing a policy must have a `productSpeciality` equal to the plan's `productType`. | `PolicyServiceImpl.issuePolicy` | 403 `SPECIALITY_ISSUE_DENIED` |
| 1.8 | Staff viewing a policy, customer policies, or all policies is scoped to policies whose product type matches their speciality; staff without a speciality see nothing. | `PolicyServiceImpl.getPolicyById` / `getAllPolicies` / `getPoliciesByCustomer` | 403 `SPECIALITY_VIEW_DENIED`; empty result set |

### 2. Duplicate-policy rules (per customer + plan)

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 2.1 | HEALTH: a customer may hold at most one policy in `ACTIVE` or `PENDING_PAYMENT` for the same plan (strict single-cover). | `PolicyServiceImpl.purchasePolicy` / `issuePolicy` via `existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(…, [ACTIVE, PENDING_PAYMENT])` | 409 `HEALTH_POLICY_EXISTS` |
| 2.2 | Non-HEALTH: a customer may not hold more than one `PENDING_PAYMENT` policy for the same plan, but may hold multiple active policies. | Same services via `existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(…, [PENDING_PAYMENT])` | 409 `POLICY_EXISTS` |
| 2.3 | Expired or cancelled policies do not count toward the duplicate checks, so a plan can be repurchased after expiry/cancellation. | Derived from the status sets in 2.1/2.2 | — |

### 3. Premium and quote generation

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 3.1 | Plan must be active and its product active to generate a quote. | `PremiumCalculationServiceImpl.generateQuoteInternal` | `IllegalArgumentException` → 400 `Selected plan is not active` / `Insurance product is not active` |
| 3.2 | The requested `duration` must be in the plan's `allowedDurations`. | `PremiumCalculationServiceImpl.generateQuoteInternal` | 400 `Invalid duration for this plan` |
| 3.3 | The requested `premiumType` must equal the plan's `supportedPremiumType`. | `PremiumCalculationServiceImpl.generateQuoteInternal` | 400 `Invalid premium type for this plan` |
| 3.4 | The requested coverage amount must exactly equal an **active** `CoverageOption` of the plan. | `PremiumCalculationServiceImpl.generateQuoteInternal` | 400 `Invalid coverage amount selected` / `Selected coverage option is not active` |
| 3.5 | A quote can only be produced when the plan has an active `PricingRule`; the highest-id active rule is used. | `PremiumCalculationServiceImpl.generateQuoteInternal` | 400 `No active pricing rule found for this plan` |
| 3.6 | Quotes expire 30 minutes after creation. | `PremiumCalculationServiceImpl.generateQuoteInternal` (sets `expiresAt = now + 30 min`) | see 1.4 |
| 3.7 | Premium mathematics (base, fees, GST, duration discounts, HALF_UP rounding) are authoritative in `Premium_Calculation.md`. | `service/strategy/AnnualPremiumCalculator.java`, `OneTimePremiumCalculator.java` | — |

### 4. Payment rules

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 4.1 | Payment amount must exactly equal `policy.calculatedPremium`. | `PremiumPaymentServiceImpl.recordPayment` | 400 `AMOUNT_MISMATCH` |
| 4.2 | Payments are not accepted for `CANCELLED` or `EXPIRED` policies. | `PremiumPaymentServiceImpl.recordPayment` | 400 `CANCELLED_POLICY_RESTRICTED` / `EXPIRED_POLICY_RESTRICTED` |
| 4.3 | A customer may only pay their own policy; staff may only pay policies matching their speciality. | `PremiumPaymentServiceImpl.recordPayment` | 403 `NOT_OWN_POLICY_PAYMENT` / `SPECIALITY_RECORD_PAYMENT_DENIED` |
| 4.4 | ONE_TIME: at most one `SUCCESS` payment per policy. | `PremiumPaymentServiceImpl.recordPayment` via `existsByPolicyIdAndPaymentStatus(…, SUCCESS)` | 400 `ONE_TIME_ALREADY_PAID` |
| 4.5 | ANNUAL: renewals are restricted until the 15-day window before the first anniversary of the latest successful payment. | `PremiumPaymentServiceImpl.recordPayment` (payment window = last success + 1 year − 15 days) | 400 `EARLY_PAYMENT_RESTRICTION` |
| 4.6 | ANNUAL: the number of successful payments must not exceed `policyDuration`. | `PremiumPaymentServiceImpl.recordPayment` via `countByPolicyIdAndPaymentStatus` | 400 `ALL_PREMIUMS_PAID` |
| 4.7 | `transactionReference` must be globally unique. | `PremiumPaymentServiceImpl.recordPayment` via `existsByTransactionReference` | 409 `DUPLICATE_REFERENCE` |
| 4.8 | Cumulative `totalPremiumPaid` plus this amount must not exceed `calculatedPremium × policyDuration`. | `PremiumPaymentServiceImpl.recordPayment` | 400 `PREMIUM_LIMIT_EXCEEDED` |
| 4.9 | A `SUCCESS` payment adds the amount to `totalPremiumPaid` and sets the policy to `ACTIVE`. | `PremiumPaymentServiceImpl.recordPayment` | Policy `PENDING_PAYMENT → ACTIVE` |
| 4.10 | A `PENDING` or `FAILED` payment is recorded without activating the policy; it stays `PENDING_PAYMENT`. | `PremiumPaymentServiceImpl.recordPayment` | — |

### 5. Claim constraints

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 5.1 | At least one document file must be attached; files must be non-empty with valid names, content type PDF or image, and each ≤ 5 MB on the raise path. | `ClaimServiceImpl.raiseClaim` | 404 `AT_LEAST_ONE_REQUIRED`; 400 `CANNOT_BE_EMPTY` / `INVALID_FILE_NAME` / `INVALID_FILE_TYPE_PDF_IMAGE` / `EXCEEDS_SIZE_5MB` |
| 5.2 | `claimAmount` must be positive. | `ClaimServiceImpl.raiseClaim` | 400 `AMOUNT_MUST_BE_POSITIVE` |
| 5.3 | The claim must be raised against a policy owned by the authenticated customer. | `ClaimServiceImpl.raiseClaim` | 400 `POLICY_NOT_OWNED` |
| 5.4 | Claims may only be raised against `ACTIVE` policies. | `ClaimServiceImpl.raiseClaim` | 400 `POLICY_NOT_ACTIVE` |
| 5.5 | `claimAmount` must not exceed the remaining coverage = `selectedCoverage − Σ(claims with status != REJECTED)`. | `ClaimServiceImpl.raiseClaim` via `sumActiveClaimsByPolicyId(id, REJECTED)` | 400 `EXCEEDS_LIMIT` (+ remaining amount) |
| 5.6 | `incidentDate` must not be in the future. | `ClaimServiceImpl.raiseClaim` | 400 `FUTURE_INCIDENT_DATE` |
| 5.7 | `incidentDate` must fall within the policy period (`startDate`..`endDate` inclusive). | `ClaimServiceImpl.raiseClaim` | 400 `INCIDENT_DATE_OUT_OF_BOUNDS` |
| 5.8 | Files are uploaded to Cloudinary and metadata stored in `claim_documents`; a `ClaimStatusHistory` record is created for `SUBMITTED`. | `ClaimServiceImpl.raiseClaim` → `ClaimDocumentServiceImpl.addDocumentsToClaim` | — |
| 5.9 | Additional documents may be appended to a claim only by the policy owner; content must be JPEG/PNG/PDF and ≤ 10 MB per file on the upload path. | `ClaimDocumentServiceImpl.addDocumentsToClaim`, `ClaimDocumentController` `POST /api/document/upload/{claimId}` | 400 `UPLOAD_OWN_CLAIMS_ONLY` / type / size errors |

### 6. Claim state machine and role rules

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 6.1 | Only staff whose `productSpeciality` matches the claim's product type may assign, move to review, recommend, or view a claim. | `ClaimServiceImpl.assignStaff` / `underReviewClaim` / `reviewClaim` / `getClaimById` / `getClaimsByPolicyId` / `getClaimHistory` / `getAllClaimsWithPagination` | 403 `SPECIALITY_*` variants |
| 6.2 | Assignment is only possible while the claim is `SUBMITTED`; a claim already assigned to another staff member cannot be reassigned. | `ClaimServiceImpl.assignStaff` | 400 `ASSIGN_MUST_BE_SUBMITTED` / `ALREADY_ASSIGNED` |
| 6.3 | Only `SUBMITTED` claims can move to `UNDER_REVIEW`. | `ClaimServiceImpl.underReviewClaim` | 400 `MOVE_TO_UNDER_REVIEW_RESTRICTED` |
| 6.4 | Staff may only recommend `RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION` — never a final decision. | `ClaimServiceImpl.reviewClaim` | 400 `STAFF_RECOMMENDATION_ONLY` |
| 6.5 | Staff must review only claims assigned to them. | `ClaimServiceImpl.reviewClaim` | 403 `REVIEW_ASSIGNED_TO_OTHER` |
| 6.6 | Review requires the claim to be `UNDER_REVIEW` and not already finalised. | `ClaimServiceImpl.reviewClaim` | 400 `MUST_BE_UNDER_REVIEW` / `ALREADY_FINALIZED` |
| 6.7 | Admin may only set `APPROVED` or `REJECTED` and only from a `RECOMMENDED_FOR_APPROVAL` / `RECOMMENDED_FOR_REJECTION` state; terminal states cannot be changed. | `ClaimServiceImpl.finalDecision` | 400 `ADMIN_DECISION_ONLY` / `MUST_BE_REVIEWED_FIRST` / `DECISION_ALREADY_MADE` |
| 6.8 | Customers may only view their own claims and histories; staff only within their speciality. | `ClaimServiceImpl.getClaimById` / `getClaimHistory` / `getMyClaims` | 403 `NOT_OWN_CLAIM*` / `SPECIALITY_*` |

The full `from → to → actor → action` transition table is in `Claim_Workflow.md`.

### 7. Cancellation rules

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 7.1 | Already-`CANCELLED` or `EXPIRED` policies cannot be cancelled again. | `PolicyServiceImpl.cancelPolicy` | 400 `CANCEL_INACTIVE_RESTRICTED` |
| 7.2 | Staff cancelling a policy must match the policy's product speciality. | `PolicyServiceImpl.cancelPolicy` | 403 `SPECIALITY_CANCEL_DENIED` |
| 7.3 | Cancellation is blocked while any open claim exists (`SUBMITTED`, `UNDER_REVIEW`, `RECOMMENDED_FOR_APPROVAL`, `RECOMMENDED_FOR_REJECTION`). | `PolicyServiceImpl.cancelPolicy` | 400 `CANCEL_WITH_OPEN_CLAIMS` |
| 7.4 | On success the policy is set to `CANCELLED`. | `PolicyServiceImpl.cancelPolicy` | `PENDING_PAYMENT`/`ACTIVE` → `CANCELLED` |

### 8. Quote status rules

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 8.1 | A quote is `CREATED` on generation, `USED` on purchase/issue, `EXPIRED` when consumed after `expiresAt`, and may be `CANCELLED`. | `PremiumCalculationServiceImpl`, `PolicyServiceImpl.validateQuoteForPurchase` | see 1.3/1.4 |
| 8.2 | A used or expired quote cannot be reused. | `PolicyServiceImpl.validateQuoteForPurchase` | 400 as in 1.3 |

### 9. OTP rules

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 9.1 | Registration activates an account only after both the email and phone OTP verify. | `AuthServiceImpl.registerUser` (inactive until `verifyOtp`) → `OtpService.verifyOtp` | Account created `isActive=false`; verification sets active |
| 9.2 | OTPs are 6 digits, generated with `SecureRandom`, valid for 5 minutes (`app.otp.expiry-minutes=5`). | `OtpService.createAndSendOtp` / `generateSixDigitOtp` | 400 `OTP_EXPIRED` |
| 9.3 | OTP verification fails (and consumes an attempt) on wrong email OTP or wrong phone OTP. | `OtpService.verifyOtp` | 400 `INVALID_EMAIL_OTP` / `INVALID_PHONE_OTP` |
| 9.4 | An OTP is marked used after 5 failed attempts (`app.security.max-otp-attempts=5`); remaining-attempt count is never exposed to the client. | `OtpAttemptRecorder.recordFailedAttempt` | OTP no longer verifiable |
| 9.5 | A used or expired OTP cannot verify. | `OtpService.verifyOtp` | 400 `OTP_NOT_FOUND` / `OTP_EXPIRED` |
| 9.6 | Resend is throttled to one per 60 seconds per user. | `OtpService.sendOrResendOtp` | 400 `OTP_RETRY_WAIT` |
| 9.7 | Resend is blocked once the number of OTP sends in the last 24 hours reaches 4 (i.e. an initial send plus three resends). | `OtpService.sendOrResendOtp` via `getTotalOtpSendsSince(…, now − 24h)` ≥ 4 | 400 `OTP_LIMIT_EXCEEDED` |
| 9.8 | Resend of an unexpired OTP re-sends the same code; expired/used OTPs are regenerated. | `OtpService.sendOrResendOtp` | — |
| 9.9 | Password reset uses the same dual-OTP verification and bumps `tokenVersion`, revoking all refresh tokens. | `AuthServiceImpl.resetPassword` → `OtpService.verifyOtp` | — |

### 10. Rate-limit rules (Bucket4j, per-IP+email)

| # | Rule | Enforcement point | Effect |
|---|---|---|---|
| 10.1 | Unauthenticated auth endpoints are rate limited per client IP + email parsed from the body: `/api/auth/login`, `/api/auth/register`, `/api/auth/verify-otp`, `/api/auth/resend-otp`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/refresh`. | `config/RateLimitFilter.java` | 429 `RATE_LIMITED` with `Retry-After` |
| 10.2 | Default per-minute limits: login 5/5, OTP endpoints 5/5, forgot-password 3/3, reset-password 5/5, register 5/5, refresh 10/10 (capacity = refill per minute). | `application.properties` `app.security.rate-limit.*` | 429 |
| 10.3 | Buckets are per-application-instance (in-memory) and purged after 10 minutes idle. | `RateLimitFilter` | — |

## Workflow

Enforcement order for the two principal flows:

1. **Purchase**: complete profile → quote exists & owned → quote CREATED → quote unexpired → plan active → product active → duplicate check (HEALTH vs non-HEALTH) → save `PENDING_PAYMENT` → mark quote `USED`.
2. **Claim**: documents valid → amount positive → policy owned → policy ACTIVE → coverage headroom → incident date valid → save `SUBMITTED` → upload documents → record history.

## Code References

| Rule area | Class |
|---|---|
| Purchase/issue/duplicate/cancel | `serviceimpl/PolicyServiceImpl.java` |
| Claims + state machine | `serviceimpl/ClaimServiceImpl.java` |
| Claim documents | `serviceimpl/ClaimDocumentServiceImpl.java` |
| Quote/premium validation | `serviceimpl/PremiumCalculationServiceImpl.java`, `service/strategy/*.java` |
| Payments | `serviceimpl/PremiumPaymentServiceImpl.java` |
| OTP | `verification/OtpService.java`, `verification/OtpAttemptRecorder.java`, `serviceimpl/AuthServiceImpl.java` |
| Rate limiting | `config/RateLimitFilter.java`, `config/AppSecurityProperties.java` |

All paths relative to `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Claim and policy state machines: `../09_Diagrams/Activity_Diagrams/`.
- Sequence diagrams for purchase, payment, and claim: `../09_Diagrams/Sequence_Diagrams/`.

## Best Practices

- Every rule is enforced in the service layer (defense in depth) even when the UI also enforces it.
- Business errors carry domain messages via `util/MessageConstants.java` and are mapped to proper HTTP statuses by the global exception handler.
- Rules that depend on money use `BigDecimal.compareTo`/`equals`, never floating point.

## Future Improvements

- Centralise rules into a rules engine for maintainability.
- Distributed rate limiting (Redis) for horizontal scaling.
- See `../10_Evaluation/Future_Enhancements.md`.

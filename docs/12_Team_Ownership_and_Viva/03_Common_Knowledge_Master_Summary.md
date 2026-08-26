# 💡 Common Knowledge — Master Summary & Viva Cheat-Sheet

> **Important Rule:** Every team member (**Gurpreet**, **Chandrashehar**, and **Shivaji**) must know all concepts in this document.  
> If an examiner asks any member about any stage of the journey or architecture, they must be able to answer fluently.

---

## 🧭 The 10-Step Complete Application Journey

Every member should be able to recite and draw this end-to-end flow:

```
[1. User Registration & Dual OTP]
   │  • Customer submits: full_name, email, mobile_number, password.
   │  • AppUser entity saved with isActive=false, emailVerified=false, phoneVerified=false.
   │  • Empty Customer record automatically created and linked to AppUser.
   │  • OtpService generates 6-digit OTPs sent via Twilio SMS and Gmail SMTP.
   ▼
[2. Account Verification & Login]
   │  • Customer enters emailOtp + phoneOtp at POST /api/auth/verify-otp.
   │  • Backend updates emailVerified=true, phoneVerified=true, isActive=true.
   │  • Login generates 15-minute Access JWT in response body and 7-day Refresh Token in HttpOnly cookie.
   ▼
[3. Customer KYC Profile Completion]
   │  • Customer enters DOB, address, city, state, pin_code, nominee_name, nominee_relation.
   │  • isCustomerProfileComplete() helper checks all fields before policy purchase is unlocked.
   ▼
[4. Catalog Browsing & Dynamic Quotation]
   │  • Customer selects Plan, Coverage (e.g. ₹5,00,000), Duration (3 years), Premium Type (ANNUAL).
   │  • PremiumCalculationService calls PremiumCalculatorFactory -> AnnualPremiumCalculator.
   │  • Strategy calculates: basePremium + processingFee + GST.
   │  • Quote entity saved (status=CREATED, TTL=30 minutes).
   ▼
[5. Policy Contract Binding & Immutability]
   │  • Customer submits POST /api/policies/purchase { quoteId }.
   │  • Anti-duplicate check: ensures customer doesn't already hold an active health policy for this plan.
   │  • Agreed rates are snapshotted onto the Policy entity (calculatedPremium, premiumRateUsed, etc.).
   │  • Policy created in PENDING_PAYMENT status. Quote marked as USED.
   ▼
[6. Premium Payment & Policy Activation]
   │  • Customer submits POST /api/payments { policyId, amount, paymentMode }.
   │  • Amount is strictly checked against policy.calculatedPremium.
   │  • Unique transactionReference recorded.
   │  • Policy status automatically transitions from PENDING_PAYMENT to ACTIVE.
   ▼
[7. Claim Submission & Evidence Ingestion]
   │  • Customer raises claim with incident date, reason, claim amount, and multipart files.
   │  • Validation: policy is ACTIVE, incidentDate within bounds, claimAmount <= remaining coverage.
   │  • Remaining Coverage = selectedCoverage - SUM(all claims NOT in REJECTED status).
   │  • Multipart files stream to Cloudinary CDN. URLs saved in ClaimDocument entity.
   │  • Claim created in SUBMITTED status. Audit log inserted in ClaimStatusHistory.
   ▼
[8. Staff Investigation (Maker Step)]
   │  • Internal Staff with matching productSpeciality opens the claim.
   │  • Staff calls PATCH /under-review (claimStatus = UNDER_REVIEW).
   │  • Staff calls PATCH /assign (assignedStaff = current staff user).
   │  • Staff investigates evidence and calls PATCH /review with RECOMMENDED_FOR_APPROVAL / REJECTION.
   ▼
[9. Admin Final Decision (Checker Step)]
   │  • Administrator reviews staff recommendation and remarks.
   │  • Admin calls PATCH /final-decision with APPROVED or REJECTED.
   │  • Claim enters immutable terminal state. Audit trail updated in ClaimStatusHistory.
   ▼
[10. Official Certificate & PDF Generation]
      • Customer or Staff clicks download.
      • Client-side React hook (usePolicyPdf / useClaimPdf) renders pixel-perfect PDF schedule.
```

---

## 🏛️ Core Technical Concepts Cheat-Sheet

### 1. Spring Security & JWT Architecture
- **Filter Chain:** `RateLimitFilter` $\rightarrow$ `CookieCsrfOriginFilter` $\rightarrow$ `JwtAuthenticationFilter` $\rightarrow$ Controller.
- **Why short-lived JWT?** 15-minute lifespan prevents attacker exploitation if intercepted.
- **Why HttpOnly Cookie for Refresh Token?** Inaccessible to JavaScript, completely mitigating Cross-Site Scripting (XSS).
- **How is logout handled since JWT is stateless?** 
  1. Revokes `RefreshToken` in database.
  2. Increments `AppUser.tokenVersion` (invalidates all existing access tokens upon re-verification).
  3. Blacklists access token's `jti` in Redis cache for the remaining lifetime.

### 2. Strategy Pattern in Actuarial Pricing
- **Interface:** `PremiumCalculator` with method `calculatePremium(request, rule, coverage)`.
- **Implementations:** `AnnualPremiumCalculator` and `OneTimePremiumCalculator`.
- **Factory:** `PremiumCalculatorFactory` injects both Spring beans and resolves the calculator based on `PremiumType` enum.
- **Why?** Complies with the Open-Closed Principle (OCP). Adding a new payment model (e.g. Monthly) requires zero edits to existing calculator code.

### 3. Segregation of Duties (Maker-Checker)
- **Maker:** Internal Staff investigates evidence, sets `UNDER_REVIEW`, and submits formal recommendation (`RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION`).
- **Checker:** Administrator reviews recommendation and executes final financial payout approval (`APPROVED` or `REJECTED`).
- **Why?** Prevents internal employee fraud and collusion. No single actor has end-to-end authority over financial disbursements.

### 4. Database Optimization & B-Tree Indexing
- **Composite & High-Frequency Indexes:** Placed on columns used in `WHERE` and `JOIN` clauses:
  - `idx_policy_status` on `policies(policy_status)`
  - `idx_claim_status` on `claims(claim_status)`
  - `idx_customer_user_id` on `customers(user_id)`
  - `refresh_token_hash` on `refresh_tokens(token_hash)`
- **Query Performance:** Reduces query complexity from $O(N)$ full table scan to $O(\log N)$ B-Tree index lookup.
- **Fetch Type:** `FetchType.LAZY` on `@ManyToOne` prevents loading entire object graphs unnecessarily (eliminates N+1 query problem).

### 5. Optimistic Locking (`@Version`)
- **Annotation:** `@Version private Long version;` on `Claim` and `Policy` entities.
- **Why?** If two staff members simultaneously attempt to review/assign the same claim, Hibernate checks the version number upon commit. The second transaction fails with an `OptimisticLockException`, preventing race conditions.

---

## 🎤 Top 10 Universal Questions Every Member Must Be Ready For

| # | Question | Answer Summary |
|:---:|:---|:---|
| **1** | *What is the database relationship between AppUser and Customer?* | `1:1` One-to-One relationship. `AppUser` holds authentication credentials, while `Customer` holds KYC profile details linked by `user_id`. |
| **2** | *What happens if a customer tries to buy two active health policies for the same plan?* | The system checks `existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn()` and throws a `BadRequestException` ("Customer already has an active policy for this health plan"). |
| **3** | *Why do we snapshot pricing rates onto the Policy entity?* | Because pricing rules can change in the future. Snapshotting locks the rate at the time of purchase, ensuring legal contract immutability. |
| **4** | *How does the frontend handle token expiration without logging the user out?* | The Axios response interceptor catches the `401 Unauthorized`, pauses queued requests, calls `POST /api/auth/refresh` (reading the HttpOnly cookie), gets a new JWT, and seamlessly replays the original request. |
| **5** | *How is remaining coverage calculated when filing a claim?* | `remainingCoverage = policy.selectedCoverage - SUM(claimAmount of all claims NOT in REJECTED status)`. |
| **6** | *Why use Cloudinary for document storage instead of saving files in MySQL BLOBs?* | Storing large binary files in MySQL bloats the database and slows down backups/queries. Cloudinary offloads bandwidth and serves files via CDN. |
| **7** | *What HTTP status code is returned when validation fails?* | `400 Bad Request` with a structured `ValidationErrorResponseDTO` containing field-level error messages. |
| **8** | *Why are claims restricted by Staff Speciality?* | `StaffSpeciality` matches staff members to product domains (`HEALTH`, `MOTOR`, etc.) so only domain experts investigate relevant claims. |
| **9** | *Can an Admin directly approve a SUBMITTED claim without staff review?* | No. The state machine strictly requires the claim to be in a `RECOMMENDED_*` state before Admin final decision is allowed, enforcing segregation of duties. |
| **10** | *How is client-side PDF generation implemented?* | Using React custom hooks (`usePolicyPdf`, `useClaimPdf`) with `jspdf` and `html2canvas`, rendering formatted policy schedules with rupee formatting (`formatINR`). |

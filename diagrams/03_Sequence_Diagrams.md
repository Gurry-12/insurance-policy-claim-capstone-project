# ⚡ Sequence Diagrams (Core Interaction Flows)

[⬅️ Back to Diagrams Hub](./README.md)

---

## 1. Authentication & Registration Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant UI as React Vite SPA
    participant AC as AuthController
    participant AS as AuthServiceImpl
    participant OTP as OtpService
    participant Comm as Twilio (SMS) & SMTP (Email)
    participant DB as MySQL DB

    User->>UI: Enter Registration Details (name, email, mobile, password)
    UI->>AC: POST /api/auth/register (JSON)
    AC->>AS: registerUser(dto)
    AS->>DB: Check unique email & mobile
    AS->>DB: Save AppUser (isActive=false, emailVerified=false)
    AS->>DB: Save empty Customer record (linked to AppUser)
    AS->>OTP: createAndSendOtp(user)
    OTP->>Comm: Send 6-digit OTP via Email & SMS
    AS-->>UI: 201 Created (prompt for OTP)

    User->>UI: Enter Email OTP & Phone OTP
    UI->>AC: POST /api/auth/verify-otp { email, emailOtp, phoneOtp }
    AC->>AS: verifyOtp(request)
    AS->>DB: Find user by email
    AS->>OTP: verifyOtp(user, emailOtp, phoneOtp)
    AS->>DB: Update emailVerified=true, phoneVerified=true, isActive=true
    AS-->>UI: 200 OK (account activated)

    User->>UI: Submit Login (email, password)
    UI->>AC: POST /api/auth/login
    AC->>AS: login(requestDto)
    AS->>DB: BCrypt verify password, check isActive
    AS->>AS: Generate 15-min JWT (with tokenVersion & jti)
    AS->>DB: Store SHA-256 Hashed Refresh Token (7-day TTL)
    AS-->>UI: 200 OK (JWT in body + Refresh Token in HttpOnly Cookie)
    UI->>UI: Store access token in memory, redirect to dashboard
```

---

## 2. Customer Profile Creation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer
    participant UI as React SPA
    participant CC as CustomerController
    participant CS as CustomerServiceImpl
    participant DB as MySQL DB

    Note over Cust,DB: Customer is authenticated (has JWT). Empty profile was created at registration.

    Cust->>UI: Fill in profile details (DOB, address, city, state, pinCode, nominee)
    UI->>CC: POST /api/customers (Bearer JWT)
    CC->>CS: createCustomer(dto)
    CS->>DB: Find AppUser by authenticated email
    CS->>DB: Find existing Customer record (created at registration)
    CS->>DB: Check if profile already filled (prevent duplicate)
    CS->>DB: Update Customer record with profile data
    CS-->>UI: 201 Created (CustomerResponseDTO)

    Cust->>UI: View or update profile
    UI->>CC: GET /api/customers/profile (Bearer JWT)
    CC->>CS: getCustomerProfile()
    CS->>DB: Find Customer by authenticated user email
    CS-->>UI: 200 OK (CustomerResponseDTO)

    Cust->>UI: Edit profile details
    UI->>CC: PUT /api/customers/{customerId} (Bearer JWT)
    CC->>CS: updateCustomer(customerId, dto)
    CS->>DB: Verify ownership (customer.user.email == authenticated user)
    CS->>DB: Save updated Customer record
    CS-->>UI: 200 OK (updated CustomerResponseDTO)
```

---

## 3. Product & Plan Creation Sequence (Admin)

```mermaid
sequenceDiagram
    autonumber
    actor Adm as Admin
    participant UI as React SPA
    participant PrC as InsuranceProductController
    participant PlC as PolicyPlanController
    participant PrS as InsuranceProductServiceImpl
    participant PlS as PolicyPlanServiceImpl
    participant DB as MySQL DB

    Adm->>UI: Create new insurance product
    UI->>PrC: POST /api/products (Bearer JWT, ADMIN)
    PrC->>PrS: createProduct(dto)
    PrS->>DB: Check product name is unique
    PrS->>DB: Save InsuranceProduct (isActive=true)
    PrS-->>UI: 201 Created (ProductResponseDTO)

    Adm->>UI: Create plan under product (with coverage tiers and pricing rule via wizard)
    UI->>PlC: POST /api/plans/wizard (Bearer JWT, ADMIN)
    PlC->>PlS: createPolicyPlan(dto)
    PlS->>DB: Save PolicyPlan
    PlS->>DB: Save CoverageOption records
    PlS->>DB: Save PricingRule (status=ACTIVE)
    PlS-->>UI: 201 Created (PlanWizardResponseDTO)

    Adm->>UI: Deactivate a plan
    UI->>PlC: PATCH /api/plans/{planId}/deactivate (Bearer JWT, ADMIN)
    PlC->>PlS: deactivatePolicyPlan(planId)
    PlS->>DB: Set PolicyPlan.isActive = false
    PlS-->>UI: 200 OK (PlanResponseDTO)
```

---

## 4. Quote → Policy Purchase → Payment Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer
    participant UI as React SPA
    participant PremAPI as PremiumCalculationController
    participant Strat as Annual/OneTime PremiumCalculator
    participant PolAPI as PolicyController
    participant PayAPI as PremiumPaymentController
    participant DB as MySQL DB

    Cust->>UI: Select Plan, Coverage, Duration, Premium Type
    UI->>PremAPI: POST /api/premium/calculate (Customer JWT)
    PremAPI->>Strat: calculatePremium(request, pricingRule, coverage)
    Strat-->>PremAPI: PremiumQuote (baseRiskRate, fee, GST, total)
    PremAPI->>DB: Save Quote (status=CREATED, expires in 30 min)
    PremAPI-->>UI: 200 OK (PremiumQuote with quoteId & 30-min countdown)

    Cust->>UI: Confirm and purchase policy
    UI->>PolAPI: POST /api/policies/purchase { quoteId } (Customer JWT)
    PolAPI->>DB: Validate Customer profile exists
    PolAPI->>DB: Check Quote status=CREATED & not expired
    PolAPI->>DB: Save Policy (status=PENDING_PAYMENT, snapshot quote rates)
    PolAPI->>DB: Update Quote status=USED
    PolAPI-->>UI: 201 Created (PolicyResponseDTO in PENDING_PAYMENT)

    Cust->>UI: Make payment
    UI->>PayAPI: POST /api/payments { policyId, amount, paymentMode } (Customer JWT)
    PayAPI->>DB: Validate amount == policy.calculatedPremium
    PayAPI->>DB: Save PremiumPayment (unique transactionReference, status=SUCCESS)
    PayAPI->>DB: Update Policy (totalPremiumPaid += amount, status=ACTIVE)
    PayAPI-->>UI: 201 Created (PaymentResponseDTO, Policy ACTIVE)
```

---

## 5. Claim Submission & Two-Tier Adjudication Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer
    actor Staff as Internal Staff
    actor Admin as Administrator
    participant ClaimAPI as ClaimController
    participant Cloud as Cloudinary CDN
    participant DB as MySQL DB

    Cust->>ClaimAPI: POST /api/claims/raise (multipart: claim JSON + files)
    ClaimAPI->>DB: Validate Policy is ACTIVE & owned by caller
    ClaimAPI->>DB: Validate claimAmount <= remaining coverage
    ClaimAPI->>DB: Validate incidentDate within policy start & end dates
    ClaimAPI->>Cloud: Upload files, receive secure URLs
    ClaimAPI->>DB: Save Claim (status=SUBMITTED, claimNumber=CLM-XXXXXXXX)
    ClaimAPI->>DB: Save ClaimDocument records (name, documentType, documentReference)
    ClaimAPI->>DB: Insert ClaimStatusHistory (newStatus=SUBMITTED)
    ClaimAPI-->>Cust: 201 Created (ClaimResponseDTO)

    Staff->>ClaimAPI: PATCH /api/claims/{claimId}/under-review (Internal Staff JWT)
    ClaimAPI->>DB: Check Claim status=SUBMITTED
    ClaimAPI->>DB: Update Claim status=UNDER_REVIEW
    ClaimAPI->>DB: Insert ClaimStatusHistory
    ClaimAPI-->>Staff: 200 OK (UNDER_REVIEW)

    Staff->>ClaimAPI: PATCH /api/claims/{claimId}/assign (Internal Staff JWT)
    ClaimAPI->>DB: Check Claim status=UNDER_REVIEW
    ClaimAPI->>DB: Set claim.assignedStaff = current staff user
    ClaimAPI->>DB: Insert ClaimStatusHistory
    ClaimAPI-->>Staff: 200 OK (Claim Assigned to Staff)

    Staff->>ClaimAPI: PATCH /api/claims/{claimId}/review { decision, staffRemarks } (Internal Staff JWT)
    ClaimAPI->>DB: Check caller is the assigned staff
    ClaimAPI->>DB: Update Claim status=RECOMMENDED_FOR_APPROVAL (or REJECTION)
    ClaimAPI->>DB: Insert ClaimStatusHistory
    ClaimAPI-->>Staff: 200 OK (Recommendation Submitted)

    Admin->>ClaimAPI: PATCH /api/claims/{claimId}/final-decision { decision, adminRemarks } (Admin JWT)
    ClaimAPI->>DB: Validate Claim is in RECOMMENDED_* status
    ClaimAPI->>DB: Update Claim status=APPROVED (or REJECTED)
    ClaimAPI->>DB: Save adminRemarks on Claim
    ClaimAPI->>DB: Insert ClaimStatusHistory
    ClaimAPI-->>Admin: 200 OK (Claim APPROVED/REJECTED — Terminal State)
```

---

## 6. Silent Token Refresh (Axios Single-Flight Mutex)

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Axios Interceptor
    participant API as Spring Boot API
    participant JWT as JwtService
    participant Redis as Redis Token Cache
    participant DB as MySQL DB

    UI->>API: GET /api/policies/my-policies (Expired 15-min JWT)
    API->>JWT: parseClaims(token) → ExpiredJwtException
    API-->>UI: 401 Unauthorized

    Note over UI: Axios pauses outgoing requests & triggers single-flight mutex
    UI->>API: POST /api/auth/refresh (HttpOnly Cookie: ss_refresh_token)
    API->>Redis: Check 10s grace window (auth:refresh:grace:{hash})
    API->>DB: Validate SHA-256 hash & revoke old refresh token
    API->>JWT: Generate fresh 15-min JWT (with same tokenVersion)
    API->>DB: Store new rotated SHA-256 refresh token
    API-->>UI: 200 OK (New JWT in body + Rotated Cookie)

    Note over UI: Axios saves new JWT & seamlessly replays original failed request
    UI->>API: GET /api/policies/my-policies (New Valid JWT)
    API-->>UI: 200 OK (Policy Data Returned)
```

# Sequence Diagrams

Request-level sequence diagrams for the main business flows. These describe the implemented behavior in the current codebase (Spring Boot 4.0.6 / React 19). Frontend side is summarized to the axios layer; focus is on the backend execution path.

> Diagram conventions: `JwtFilter` = `JwtAuthenticationFilter` (security package), `Ctrl` = controller, `Svc` = service impl, `Repo` = Spring Data JPA repository, `DB` = MySQL. Entities/values are simplified.

---

## 1. Customer Registration

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant AX as axios
    participant C as AuthController
    participant S as AuthServiceImpl
    participant U as AppUserRepository
    participant OT as OtpService
    participant EM as EmailService
    participant SM as SmsService
    participant DB as MySQL

    FE->>AX: POST /api/auth/register
    AX->>C: register(UserRequestDTO)
    C->>S: register(dto)
    S->>U: existsByEmail / existsByMobileNumber?
    U-->>S: duplicate check
    S->>U: save(AppUser, isActive=true)
    S->>OT: createAndSendOtp(user)
    OT->>DB: save OtpVerification
    OT->>EM: send email OTP (Gmail SMTP)
    OT->>SM: send SMS OTP (Twilio)
    S-->>C: ApiResponseDTO<UserResponseDTO>
    C-->>FE: 200 (success, account created, OTP sent)
```

## 2. Login & JWT Issue

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant AX as axios
    participant C as AuthController
    participant M as AuthenticationManager
    participant U as CustomUserDetailsService
    participant J as JwtService
    participant DB as MySQL

    FE->>AX: POST /api/auth/login
    AX->>C: login(LoginRequestDTO)
    C->>M: authenticate(username, password)
    M->>U: loadUserByUsername(email)
    U->>DB: findByEmailAndIsActiveTrue(email)
    DB-->>U: AppUser (with role)
    U-->>M: Spring User (authority = ROLE_*)
    M-->>C: Authenticated principal
    C->>J: generateToken(userDetails, fullName, productSpeciality)
    J-->>C: JWT (claims: roles, fullName, productSpeciality)
    C-->>FE: 200 ApiResponseDTO<LoginResponseDTO> {token, user}
```

## 3. JWT Authentication & Authorization (protected call)

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant F as JwtAuthenticationFilter
    participant SC as SecurityFilterChain
    participant C as Controller
    participant S as ServiceImpl
    participant R as Repository
    participant DB as MySQL

    FE->>F: GET /api/policies/my-policies (Authorization: Bearer JWT)
    F->>F: extract username, parse claims (jjwt 0.12+)
    F->>F: load UserDetails, validate token
    F-->>SC: set SecurityContext (authorities)
    SC->>SC: match requestMatchers rules (role check)
    SC-->>C: request allowed
    C->>S: getMyPolicies()
    S->>S: verify logged-in user owns the resource
    S->>R: findByPolicyCustomerUserId(...)
    R->>DB: SQL
    DB-->>R: rows
    R-->>S: entities → DTOs
    S-->>C: ApiResponseDTO
    C-->>FE: 200 JSON
```

## 4. Generate Premium Quote (customer self-service)

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant C as PremiumCalculationController
    participant S as PremiumCalculationServiceImpl
    participant CR as CustomerRepository
    participant PR as PolicyPlanRepository
    participant RX as PricingRuleRepository
    participant F as PremiumCalculatorFactory
    participant Q as QuoteRepository
    participant DB as MySQL

    FE->>C: POST /api/premium/calculate
    C->>S: generateQuote(request, username)
    S->>CR: findByUserEmail(username)
    S->>PR: findById(planId)
    S->>S: validate plan & product active, duration, premiumType
    S->>S: select CoverageOption matching coverageAmount
    S->>RX: findByPolicyPlanIdAndStatusOrderByIdDesc(planId, ACTIVE)
    S->>F: getCalculator(premiumType)
    F-->>S: AnnualPremiumCalculator | OneTimePremiumCalculator
    S->>S: calculatePremium(...) → PremiumQuote
    S->>Q: save(Quote, expiresAt = now + 30 min)
    DB-->>Q: quote row
    Q-->>S: saved quote (quoteId)
    S-->>C: PremiumQuote (id, totals, expiresAt)
    C-->>FE: 200 (quote valid for 30 minutes)
```

## 5. Purchase Policy (customer self-service)

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant C as PolicyController
    participant S as PolicyServiceImpl
    participant Q as QuoteRepository
    participant R as PolicyRepository
    participant U as AppUserRepository
    participant DB as MySQL

    FE->>C: POST /api/policies/purchase (QuotePurchaseRequest{quoteId})
    C->>S: purchasePolicy(quoteId, username)
    S->>Q: findById(quoteId)
    Q-->>S: Quote (status must be CREATED, not expired)
    S->>U: findByEmailAndIsActiveTrue(username)
    S->>R: guard: no duplicate active policy for same plan/customer
    S->>S: build Policy (PENDING_PAYMENT, from quote snapshot)
    S->>R: save(Policy)
    S->>Q: mark quote USED
    DB-->>S: committed
    S-->>C: ApiResponseDTO<PolicyResponseDTO>
    C-->>FE: 200 (policy created; payment needed to activate)
```

## 6. Issue Policy (admin / staff on behalf of customer)

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant C as PolicyController
    participant S as PolicyServiceImpl
    participant CU as CustomerRepository
    participant P as PolicyPlanRepository
    participant R as PolicyRepository
    participant DB as MySQL

    FE->>C: POST /api/policies/issue (PolicyIssueRequestDTO)
    C->>S: issuePolicy(dto, username)
    S->>CU: find customer
    S->>P: find plan (+ coverage + pricing snapshot)
    S->>S: compute premium snapshot (plan version, rates)
    S->>R: guard duplicates
    S->>R: save(Policy, PENDING_PAYMENT)
    DB-->>S: committed
    S-->>C: ApiResponseDTO<PolicyResponseDTO>
    C-->>FE: 200
```

## 7. Premium Payment (record / activate policy)

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant C as PremiumPaymentController
    participant S as PremiumPaymentServiceImpl
    participant R as PolicyRepository
    participant PR as PremiumPaymentRepository
    participant DB as MySQL

    FE->>C: POST /api/payments (PaymentRequestDTO)
    C->>S: recordPayment(dto, username)
    S->>R: find policy (verify ownership for CUSTOMER)
    S->>S: validate amount, allowed for status
    S->>PR: save(PremiumPayment, transactionReference generated)
    S->>S: if SUCCESS → update policy totalPremiumPaid, ACTIVE
    DB-->>S: committed
    S-->>C: ApiResponseDTO<PaymentResponseDTO>
    C-->>FE: 200 (receipt PDF downloadable from FE)
```

## 8. Raise Claim with Document Upload

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant C as ClaimController
    participant S as ClaimServiceImpl
    participant P as PolicyRepository
    participant CL as ClaimRepository
    participant CD as ClaimDocumentServiceImpl
    participant CLD as CloudinaryService
    participant DB as MySQL

    FE->>C: POST /api/claims/raise (ClaimRequestDTO + files, multipart)
    C->>S: raiseClaim(dto, files, username)
    S->>P: find policy (owned by user)
    S->>S: validate claim amount vs remaining cover, reason, incident date
    S->>CL: save(Claim, SUBMITTED, claimNumber CLM-...)
    S->>CD: addDocumentsToClaim(claimId, files)
    CD->>CLD: upload to Cloudinary (insurance_claims)
    CLD-->>CD: publicId + URL
    CD->>CL: saveAll(ClaimDocument)
    DB-->>S: committed
    S-->>C: ApiResponseDTO<ClaimResponseDTO>
    C-->>FE: 200 (claim SUBMITTED)
```

## 9. Claim Review Workflow (maker-checker)

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant C as ClaimController
    participant S as ClaimServiceImpl
    participant H as ClaimStatusHistoryRepository
    participant DB as MySQL

    Note over FE,DB: STAFF assigns claim to self
    FE->>C: PATCH /api/claims/{id}/assign
    C->>S: assignClaim(claimId, staffUsername)
    S->>H: record history
    DB-->>S: committed

    Note over FE,DB: STAFF marks under review
    FE->>C: PATCH /api/claims/{id}/under-review
    C->>S: markUnderReview(...)

    Note over FE,DB: STAFF reviews (recommend approve/reject)
    FE->>C: PATCH /api/claims/{id}/review (ClaimReviewRequestDTO)
    C->>S: reviewClaim(claimId, dto, staffUsername)
    S->>S: only INTERNAL_STAFF; history recorded
    DB-->>S: committed

    Note over FE,DB: ADMIN makes final decision
    FE->>C: PATCH /api/claims/{id}/final-decision (ClaimReviewRequestDTO)
    C->>S: finalDecision(claimId, dto, adminUsername)
    S->>S: only ROLE_ADMIN; APPROVED/REJECTED terminal
    S->>H: history record
    DB-->>S: committed
    S-->>FE: ClaimResponseDTO with status timeline
```

## 10. Forgot Password → Reset Password

```mermaid
sequenceDiagram
    participant FE as React SPA
    participant C as AuthController
    participant S as AuthServiceImpl
    participant U as AppUserRepository
    participant OT as OtpService
    participant EM as EmailService
    participant DB as MySQL

    Note over FE,DB: Step 1 — request reset OTP
    FE->>C: POST /api/auth/forgot-password (email)
    C->>S: forgotPassword(request)
    S->>U: findByEmail (must be active)
    S->>OT: sendOrResendOtp(user)
    OT->>DB: save/update OtpVerification
    OT->>EM: send OTP email
    S-->>C: ApiResponseDTO (OTP sent)
    C-->>FE: 200

    Note over FE,DB: Step 2 — reset with OTP
    FE->>C: POST /api/auth/reset-password (email + OTPs + new password)
    C->>S: resetPassword(request)
    S->>OT: verifyOtp(emailOtp, phoneOtp)
    OT-->>S: valid & unused
    S->>U: update password (BCrypt)
    S->>OT: mark OTP used
    DB-->>S: committed
    S-->>C: ApiResponseDTO (password updated)
    C-->>FE: 200
```

## Coverage matrix

| # | Flow | Roles | Backend entry points |
|---|------|-------|----------------------|
| 1 | Registration + OTP | public | `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/resend-otp` |
| 2 | Login / JWT | public | `POST /api/auth/login` |
| 3 | Authenticated call | all | any protected endpoint (JwtAuthenticationFilter) |
| 4 | Premium quote | CUSTOMER, ADMIN/STAFF (`/admin/calculate`) | `POST /api/premium/calculate` |
| 5 | Purchase policy | CUSTOMER | `POST /api/policies/purchase` |
| 6 | Issue policy | ADMIN, INTERNAL_STAFF | `POST /api/policies/issue` |
| 7 | Premium payment | CUSTOMER, INTERNAL_STAFF | `POST /api/payments` |
| 8 | Raise claim + uploads | CUSTOMER | `POST /api/claims/raise`, `POST /api/document/upload/{claimId}` |
| 9 | Claim review (maker-checker) | INTERNAL_STAFF, ADMIN | `PATCH /api/claims/*/{assign,under-review,review,final-decision}` |
| 10 | Password reset | public | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |

## See also

- [`imp-doc/04-workflows/auth-flow.md`](../imp-doc/04-workflows/auth-flow.md) — detailed auth workflow traces
- [`imp-doc/04-workflows/backend-workflows.md`](../imp-doc/04-workflows/backend-workflows.md) — 8 backend workflow traces
- [`imp-doc/07-diagrams/sequence-diagrams.md`](../imp-doc/07-diagrams/sequence-diagrams.md) — additional backend sequence diagrams

# UML Sequence Diagrams

This document illustrates the execution interactions, lifecycles, and transaction boundaries between backend components.

---

## 1. User Registration Flow

Illustrates a customer creating an unverified account and registering an initial profile.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App
    participant Ctrl as AuthController
    participant Service as AuthServiceImpl
    participant UserRepo as AppUserRepository
    participant CustRepo as CustomerRepository
    participant Otp as OtpService
    participant Email as EmailService
    participant SMS as SmsService

    Client->>Ctrl: POST /api/auth/register (Base64 password)
    activate Ctrl
    Ctrl->>Ctrl: Validate payload (@Valid)
    Ctrl->>Service: registerUser(UserRequestDTO)
    activate Service
    
    Service->>UserRepo: existsByEmail(email)
    UserRepo-->>Service: false
    Service->>UserRepo: existsByMobileNumber(mobile)
    UserRepo-->>Service: false
    
    Service->>Service: Decode Base64 password
    Service->>Service: BCrypt encode raw password
    Service->>UserRepo: save(AppUser)
    activate UserRepo
    UserRepo-->>Service: savedUser (ID generated)
    deactivate UserRepo
    
    Service->>CustRepo: save(emptyCustomer)
    CustRepo-->>Service: Customer profile (dateOfBirth is null)
    
    Service->>Otp: createAndSendOtp(savedUser)
    activate Otp
    Otp->>Otp: Generate 6-digit emailOtp & phoneOtp
    Otp->>Otp: Save OtpVerification (expires in 5m)
    
    Otp->>Email: sendOtp(email, emailOtp, isStaff=false)
    activate Email
    Email-->>Otp: Branded HTML OTP template sent
    deactivate Email
    
    Otp->>SMS: sendOtp(mobile, phoneOtp)
    activate SMS
    SMS-->>Otp: Plain numeric OTP dispatch via Twilio
    deactivate SMS
    
    Otp-->>Service: OTP dispatch successful
    deactivate Otp
    
    Service-->>Ctrl: ApiResponseDTO (Registration success)
    deactivate Service
    Ctrl-->>Client: 201 Created (JSON Response)
    deactivate Ctrl
```

---

## 2. Login Flow with JWT Generation

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App
    participant Ctrl as AuthController
    participant Service as AuthServiceImpl
    participant UserRepo as AppUserRepository
    participant AuthMgr as AuthenticationManager
    participant Jwt as JwtService

    Client->>Ctrl: POST /api/auth/login (Base64 password)
    activate Ctrl
    Ctrl->>Service: login(LoginRequestDTO)
    activate Service
    
    Service->>UserRepo: findByEmail(email)
    UserRepo-->>Service: appUser
    
    Note over Service: Assert emailVerified == true<br/>Assert phoneVerified == true<br/>Assert isActive == true
    
    Service->>Service: Decode Base64 password
    
    Service->>AuthMgr: authenticate(UsernamePasswordAuthenticationToken)
    activate AuthMgr
    AuthMgr-->>Service: Authentication (Authenticated)
    deactivate AuthMgr
    
    Service->>Jwt: generateToken(UserDetails, fullName, productSpeciality)
    activate Jwt
    Jwt-->>Service: jwtToken (Compact String)
    deactivate Jwt
    
    Service-->>Ctrl: ApiResponseDTO<LoginResponseDTO>
    deactivate Service
    Ctrl-->>Client: 200 OK (JSON with Bearer Token)
    deactivate Ctrl
```

---

## 3. Request JWT Authentication & Authorization Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App
    participant Filter as JwtAuthenticationFilter
    participant Details as CustomUserDetailsService
    participant UserRepo as AppUserRepository
    participant SecurityContext as SecurityContextHolder
    participant Ctrl as REST Controller

    Client->>Filter: Request Protected API (Header: "Bearer <token>")
    activate Filter
    Filter->>Filter: Extract JWT Token from header
    Filter->>Filter: Extract email (username) from claims
    
    Filter->>Details: loadUserByUsername(email)
    activate Details
    Details->>UserRepo: findByEmailAndIsActiveTrue(email)
    UserRepo-->>Details: appUser
    Details-->>Filter: UserDetails (with authorities)
    deactivate Details
    
    Filter->>Filter: Validate token (username match, expiration check)
    Filter->>SecurityContext: setAuthentication(UsernamePasswordAuthenticationToken)
    
    Filter->>Ctrl: Delegate Request to Controller Method
    activate Ctrl
    Note over Ctrl: Check Method Security (@PreAuthorize)<br/>Execute business code
    Ctrl-->>Client: REST API JSON Response
    deactivate Ctrl
    deactivate Filter
```

---

## 4. Purchase Policy Flow

Customers buying a policy plan directly.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Client)
    participant Ctrl as PolicyController
    participant Service as PolicyServiceImpl
    participant CustRepo as CustomerRepository
    participant PlanRepo as PolicyPlanRepository
    participant PolicyRepo as PolicyRepository

    Customer->>Ctrl: POST /api/policies/purchase (planId, startDate)
    activate Ctrl
    Ctrl->>Service: purchasePolicy(PolicyPurchaseRequestDTO)
    activate Service
    
    Service->>CustRepo: findByUserEmail(loggedInUserEmail)
    CustRepo-->>Service: customerEntity
    
    Service->>Service: isCustomerProfileComplete(customerEntity)?
    Note over Service: Verify address, nominee, DOB etc. is not null.<br/>Under age limit check (18+)
    
    Service->>PlanRepo: findByIdAndIsActiveTrue(planId)
    PlanRepo-->>Service: policyPlan
    
    Note over Service: Rule Check:<br/>IF HEALTH plan, verify customer has no pending or active policies of this plan.<br/>IF OTHER plan, verify no pending-payment policies.
    
    Service->>Service: Calculate endDate (startDate + plan.duration)
    Service->>PolicyRepo: save(Policy)
    activate PolicyRepo
    PolicyRepo-->>Service: savedPolicy (status = PENDING_PAYMENT)
    deactivate PolicyRepo
    
    Service-->>Ctrl: ApiResponseDTO<PolicyResponseDTO>
    deactivate Service
    Ctrl-->>Customer: 201 Created
    deactivate Ctrl
```

---

## 5. Premium Payment Workflow

Processes payments and auto-activates pending contracts.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Customer / Staff
    participant Ctrl as PremiumPaymentController
    participant Service as PremiumPaymentServiceImpl
    participant PolicyRepo as PolicyRepository
    participant PayRepo as PremiumPaymentRepository

    Client->>Ctrl: POST /api/payments
    activate Ctrl
    Ctrl->>Service: recordPayment(PaymentRequestDTO)
    activate Service
    
    Service->>PolicyRepo: findById(policyId)
    PolicyRepo-->>Service: policy
    
    Service->>Service: Verify payment ownership and speciality checks
    Note over Service: Verify paymentAmount == plan.premiumAmount<br/>Verify policy not cancelled or expired<br/>Verify early annual payment window (15 days)
    
    Service->>PayRepo: existsByTransactionReference(ref)
    PayRepo-->>Service: false
    
    Service->>PayRepo: save(PremiumPayment)
    activate PayRepo
    PayRepo-->>Service: savedPayment (status = SUCCESS)
    deactivate PayRepo
    
    Service->>Service: Set policy.totalPremiumPaid += amount
    Service->>Service: Set policy.policyStatus = ACTIVE (if status SUCCESS)
    Service->>PolicyRepo: save(policy)
    
    Service-->>Ctrl: ApiResponseDTO<PaymentResponseDTO>
    deactivate Service
    Ctrl-->>Client: 201 Created
    deactivate Ctrl
```

---

## 6. Claim Lifecycle & Review Workflow

Traces a customer raising a claim, staff assigning/reviewing, and admin final decisions.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Client)
    actor Staff as Operations Staff
    actor Admin as Administrator
    participant Ctrl as ClaimController
    participant Service as ClaimServiceImpl
    participant PolicyRepo as PolicyRepository
    participant ClaimRepo as ClaimRepository
    participant DocService as ClaimDocumentServiceImpl
    participant Cloudinary as CloudinaryService
    participant HistRepo as ClaimStatusHistoryRepository

    %% Raise Claim
    Customer->>Ctrl: POST /api/claims/raise (claim DTO + multipart files)
    activate Ctrl
    Ctrl->>Service: raiseClaim(ClaimRequestDTO, files)
    activate Service
    
    Service->>PolicyRepo: findById(policyId)
    PolicyRepo-->>Service: policy (Assert policyStatus == ACTIVE)
    
    Note over Service: Check total active claims sum <= plan.coverageAmount<br/>Check incidentDate is valid and within policy duration
    
    Service->>ClaimRepo: save(Claim)
    ClaimRepo-->>Service: savedClaim (status = SUBMITTED)
    
    Service->>DocService: uploadDocuments(savedClaim, files)
    activate DocService
    loop Each File
        DocService->>Cloudinary: uploadFile(file)
        Cloudinary-->>DocService: fileUrl, publicId
        DocService->>DocService: save(ClaimDocument)
    end
    DocService-->>Service: documents uploaded
    deactivate DocService
    
    Service->>HistRepo: save(ClaimStatusHistory: SUBMITTED)
    Service-->>Ctrl: ApiResponseDTO<ClaimResponseDTO>
    deactivate Service
    Ctrl-->>Customer: 201 Created
    deactivate Ctrl

    %% Assign Claim
    Staff->>Ctrl: PATCH /api/claims/{id}/assign
    activate Ctrl
    Ctrl->>Service: assignStaff(claimId)
    activate Service
    Note over Service: Verify claim.status == SUBMITTED<br/>Verify staff productSpeciality == policy.productType
    Service->>Service: Set claim.assignedStaff = currentStaff
    Service->>ClaimRepo: save(claim)
    Service->>HistRepo: save(ClaimStatusHistory)
    Service-->>Ctrl: ApiResponseDTO
    deactivate Service
    Ctrl-->>Staff: 200 OK (Claim Assigned)
    deactivate Ctrl

    %% Move to Under Review
    Staff->>Ctrl: PATCH /api/claims/{id}/under-review
    activate Ctrl
    Ctrl->>Service: underReviewClaim(claimId)
    activate Service
    Note over Service: Verify claim.status == SUBMITTED<br/>Verify staff productSpeciality == policy.productType
    Service->>Service: Set claim.claimStatus = UNDER_REVIEW
    Service->>ClaimRepo: save(claim)
    Service->>HistRepo: save(ClaimStatusHistory)
    Service-->>Ctrl: ApiResponseDTO
    deactivate Service
    Ctrl-->>Staff: 200 OK (Claim Under Review)
    deactivate Ctrl

    %% Recommend
    Staff->>Ctrl: PATCH /api/claims/{id}/review (RECOMMENDED_FOR_APPROVAL)
    activate Ctrl
    Ctrl->>Service: reviewClaim(claimId, ReviewRequestDTO)
    activate Service
    Note over Service: Verify claim.assignedStaff == currentStaff<br/>Verify claim.status == UNDER_REVIEW
    Service->>Service: Set claim.claimStatus = RECOMMENDED_FOR_APPROVAL
    Service->>ClaimRepo: save(claim)
    Service->>HistRepo: save(ClaimStatusHistory)
    Service-->>Ctrl: ApiResponseDTO
    deactivate Service
    Ctrl-->>Staff: 200 OK
    deactivate Ctrl

    %% Final Decision
    Admin->>Ctrl: PATCH /api/claims/{id}/final-decision (APPROVED)
    activate Ctrl
    Ctrl->>Service: finalDecisionOnClaim(claimId, ReviewRequestDTO)
    activate Service
    Note over Service: Verify claim.status is RECOMMENDED_FOR_*<br/>Verify caller role is ROLE_ADMIN
    Service->>Service: Set claim.claimStatus = APPROVED
    Service->>ClaimRepo: save(claim)
    Service->>HistRepo: save(ClaimStatusHistory)
    Service-->>Ctrl: ApiResponseDTO
    deactivate Service
    Ctrl-->>Admin: 200 OK
    deactivate Ctrl
```

# 🔀 System Logic Flowcharts

[⬅️ Back to Diagrams Hub](./README.md)

---

## 1. Premium Payment Validation Flowchart

```mermaid
flowchart TD
    Start([POST /api/payments]) --> PolicyLookup{Policy exists?}
    PolicyLookup -- No --> 404[Throw ResourceNotFoundException]
    PolicyLookup -- Yes --> AuthCheck{Is Customer?<br/>Does email match policy owner?}
    AuthCheck -- No --> 403[Throw AccessDeniedException]
    AuthCheck -- Yes --> StatusCheck{Policy status CANCELLED or EXPIRED?}
    StatusCheck -- Yes --> 400A[Throw BadRequestException: Inactive Policy]
    StatusCheck -- No --> AmountCheck{Amount == policy.calculatedPremium?}
    AmountCheck -- No --> 400B[Throw BadRequestException: Amount Mismatch]
    AmountCheck -- Yes --> TypeCheck{Premium Type?}
    
    TypeCheck -- ONE_TIME --> OneTimeCheck{Any existing SUCCESS payment?}
    OneTimeCheck -- Yes --> 400C[Throw BadRequestException: Already Paid]
    OneTimeCheck -- No --> RecordPay[Generate Unique TXN Reference & Save Payment]
    
    TypeCheck -- ANNUAL --> WindowCheck{Current Date >= Next Due Date - 15 days?}
    WindowCheck -- No --> 400D[Throw BadRequestException: Early Payment Window Not Open]
    WindowCheck -- Yes --> LimitCheck{Count of SUCCESS payments >= policyDuration?}
    LimitCheck -- Yes --> 400E[Throw BadRequestException: All Premiums Already Paid]
    LimitCheck -- No --> RecordPay
    
    RecordPay --> PolicyActive[Set policy.policyStatus = ACTIVE & update totalPremiumPaid]
    PolicyActive --> Success([Return 200 OK: PaymentResponseDTO])
```

---

## 2. Password Reset & Session Invalidation Flowchart

```mermaid
flowchart TD
    A[Customer requests /api/auth/forgot-password] --> B[Generate 6-digit OTP & send via Email/SMS]
    B --> C[Customer submits /api/auth/reset-password]
    C --> D{OTP valid and within 5 minutes?}
    D -- No --> E[Throw BadRequestException: Invalid or Expired OTP]
    D -- Yes --> F[Encode new password using BCrypt]
    F --> G[Increment AppUser.tokenVersion by 1]
    G --> H[Revoke all active Refresh Tokens in DB for user]
    H --> I[Save updated AppUser to MySQL]
    I --> J[Log SecurityAuditEvent: PASSWORD_RESET]
    J --> K([Return 200 OK: Password Reset Successfully])
```

---

## 3. Login & Authentication Decision Flow

```mermaid
flowchart TD
    LoginReq[POST /api/auth/login] --> FindUser{User exists in MySQL?}
    FindUser -- No --> BadCred1[Log LOGIN_FAILED & Throw BadCredentialsException]
    FindUser -- Yes --> EmailVerif{Email verified?}
    EmailVerif -- No --> BadCred2[Throw BadCredentialsException: Unverified]
    EmailVerif -- Yes --> PhoneVerif{Phone verified?}
    PhoneVerif -- No --> BadCred3[Throw BadCredentialsException: Unverified]
    PhoneVerif -- Yes --> ActiveCheck{Is user account active?}
    ActiveCheck -- No --> BadCred4[Throw BadCredentialsException: Disabled]
    ActiveCheck -- Yes --> PassCheck{BCrypt password matches?}
    PassCheck -- No --> BadCred5[Log LOGIN_FAILED & Throw BadCredentialsException]
    PassCheck -- Yes --> GenTokens[Mint 15-min JWT + SHA-256 Refresh Token Cookie]
    GenTokens --> Success([Return 200 OK: LoginResponseDTO])
```

# Sequence Diagrams

> Mermaid sequence diagrams for the primary interaction flows.

## Authentication: register → OTP verify → login

```mermaid
sequenceDiagram
    actor U as User
    participant UI as React SPA
    participant A as Auth API
    participant O as OtpService
    participant M as Email/SMS
    U->>UI: register(fullName, email, mobile, password)
    UI->>A: POST /api/auth/register
    A->>O: create OTPs (email + phone)
    O->>M: send email OTP + SMS OTP
    A-->>UI: success (await verification)
    U->>UI: enter email & phone OTP
    UI->>A: POST /api/auth/verify-otp
    A->>O: validate both OTPs (5-min expiry, max 5 attempts)
    A-->>UI: user ACTIVE
    U->>UI: login(email, password)
    UI->>A: POST /api/auth/login
    A->>A: verify BCrypt password, tokenVersion
    A-->>UI: access token (body) + refresh_token cookie
    UI->>UI: store token in memory, set session
```

## Quote → Purchase → Payment

```mermaid
sequenceDiagram
    actor C as Customer
    participant UI as React SPA
    participant P as Premium API
    participant PO as Policy API
    participant PA as Payment API
    C->>UI: select plan + coverage + duration
    UI->>P: POST /api/premium/calculate
    P->>P: validate plan/coverage/duration
    P->>P: compute premium (strategy) + persist Quote
    P-->>UI: PremiumQuote (quoteId, amounts)
    UI->>PO: POST /api/policies/purchase {quoteId}
    PO->>PO: validate user, plan, duplicate policy rules
    PO-->>UI: Policy (PENDING_PAYMENT)
    UI->>PA: POST /api/payments {policyId, amount, mode, SUCCESS}
    PA->>PA: amount == quote total?
    PA->>PA: mark policy ACTIVE, record payment
    PA-->>UI: PaymentResponse (policy ACTIVE)
```

## Claim lifecycle

```mermaid
sequenceDiagram
    actor C as Customer
    actor S as Staff
    actor Ad as Admin
    participant Cl as Claim API
    participant D as Cloudinary
    C->>Cl: POST /api/claims/raise (claim JSON + files)
    Cl->>D: upload documents
    Cl->>Cl: validate policy ACTIVE, amount ≤ remaining cover
    Cl-->>C: Claim (SUBMITTED)
    S->>Cl: PATCH /api/claims/{id}/under-review
    Cl-->>S: UNDER_REVIEW
    S->>Cl: PATCH /api/claims/{id}/assign
    S->>Cl: PATCH /api/claims/{id}/review {recommendedStatus, remarks}
    Cl->>Cl: write ClaimStatusHistory
    Ad->>Cl: PATCH /api/claims/{id}/final-decision
    Cl-->>Ad: APPROVED / REJECTED
    C->>Cl: GET /api/claims/{id}/history
    Cl-->>C: full status audit trail
```

## Token refresh (access + refresh)

```mermaid
sequenceDiagram
    participant UI as React SPA
    participant API as Backend API
    participant J as JwtService
    participant R as RefreshTokenService
    UI->>API: request (Bearer access token)
    API->>J: validate signature/expiry/tokenVersion
    alt token expired
        API-->>UI: 401
        UI->>API: POST /api/auth/refresh (refresh_token cookie)
        API->>R: hash + rotate (revoke old, create new)
        API->>J: mint new access token
        API-->>UI: new access token + rotated cookie
        UI->>API: retry original request (one retry)
    else valid
        API-->>UI: 200 response
    end
    Note over R: Reuse of a revoked token → revoke entire family
```

## Related

- `../08_Workflows/Authentication_Flow.md`, `Purchase_Flow.md`, `Claim_Flow.md`
- `../06_Backend/JWT.md` — token internals
- `../03_API/API_Flow.md` — endpoint-level call sequences

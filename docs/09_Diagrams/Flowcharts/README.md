# Flowcharts

> Simple process flowcharts (linear flows and decision points).

## Payment activation

```mermaid
flowchart LR
    P[Policy PENDING_PAYMENT] --> R[POST payments]
    R --> M{Mode}
    M -->|UPI / CARD / NET_BANKING / CASH| S{Status}
    S -->|SUCCESS + exact amount| A[Policy ACTIVE]
    S -->|PENDING| W[Remains PENDING_PAYMENT]
    S -->|FAILED| F[No change]
    A --> T[TXN reference recorded]
```

## Login / access flow

```mermaid
flowchart TD
    L[POST auth/login] --> V{BCrypt verify}
    V -- No --> 401
    V -- Yes --> TV{tokenVersion ok}
    TV -- No --> 401
    TV -- Yes --> J[Issue JWT + refresh cookie]
    J --> R[Call API with Bearer token]
    R --> E{Expired?}
    E -- No --> OK[200]
    E -- Yes --> RF[POST auth/refresh - rotate]
    RF --> OK
```

## Password reset

```mermaid
flowchart TD
    FP[POST auth/forgot-password] --> SEND[Send OTP via email]
    SEND --> RP[POST auth/reset-password]
    RP --> C{OTP valid + within 5 min}
    C -- No --> E[Error]
    C -- Yes --> P{Password policy ok}
    P -- No --> E
    P -- Yes --> D[Reset password, logout all]
```

## Related

- `../03_API/Authentication_API.md`, `../03_API/Payment_API.md`
- `../08_Workflows/Payment_Flow.md`, `../08_Workflows/Authentication_Flow.md`

# Activity Diagrams

> Business-process activity and state diagrams for the primary workflows.

## Policy lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : quote purchased
    PENDING_PAYMENT --> ACTIVE : SUCCESS payment
    PENDING_PAYMENT --> CANCELLED : cancel (no open claims)
    ACTIVE --> EXPIRED : end date reached
    ACTIVE --> CANCELLED : cancel (no open claims)
    EXPIRED --> [*]
    CANCELLED --> [*]
```

## User lifecycle

```mermaid
stateDiagram-v2
    [*] --> REGISTERED : register
    REGISTERED --> VERIFICATION_SENT : OTPs dispatched
    VERIFICATION_SENT --> ACTIVE : verify-otp (email+phone)
    ACTIVE --> DEACTIVATED : admin deactivate
    DEACTIVATED --> ACTIVE : admin activate
```

## Purchase activity

```mermaid
flowchart TD
    A[Select product] --> B[Select plan]
    B --> C[Choose coverage + duration + premium type]
    C --> D[POST premium/calculate]
    D --> E{Valid?}
    E -- No --> C
    E -- Yes --> F[Quote created - quoteId]
    F --> G[POST policies/purchase]
    G --> H[Policy PENDING_PAYMENT]
    H --> I[POST payments SUCCESS]
    I --> J{Amount matches?}
    J -- No --> K[Rejected - retry]
    J -- Yes --> L[Policy ACTIVE]
    K --> I
```

## Claim processing activity

```mermaid
flowchart TD
    A[Customer raises claim + documents] --> B{Valid policy ACTIVE?}
    B -- No --> X[Rejected]
    B -- Yes --> C{Amount <= remaining cover?}
    C -- No --> X
    C -- Yes --> D[SUBMITTED]
    D --> E[Staff: under-review]
    E --> F[Staff: assign]
    F --> G[Staff: review + recommend]
    G --> H{Recommendation}
    H -- Approve --> I[RECOMMENDED_FOR_APPROVAL]
    H -- Reject --> J[RECOMMENDED_FOR_REJECTION]
    I --> K[Admin: final decision]
    J --> K
    K --> L[APPROVED / REJECTED]
    L --> M[Audit history recorded]
```

## Admin catalog activity

```mermaid
flowchart TD
    A[Admin login] --> B{Action}
    B -- Product --> C[Create/update product]
    B -- Plan --> D[Wizard: plan + coverage + pricing]
    B -- Pricing --> E[Update pricing rule -> audit log]
    B -- Coverage --> F[Manage coverage options / regenerate]
    B -- Staff --> G[Create staff with speciality]
    C --> H[Activate / deactivate]
    D --> H
    E --> I[Premium preview]
    F --> H
```

## Related

- `../08_Workflows/` — narrative walkthroughs of these activities
- `../02_Business_Domain/` — the business rules behind each branch

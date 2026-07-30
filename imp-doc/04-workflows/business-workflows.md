# Domain-Driven Business Workflows

This document outlines key lifecycle stages and state machine transitions for core business flows.

---

## 1. User Lifecycle State Machine

Users transition across verification levels before obtaining system access:

```mermaid
stateDiagram-v2
    [*] --> REGISTERED : AuthController.registerUser()
    note right of REGISTERED
        User saved in DB.
        isActive = false
        emailVerified = false
        phoneVerified = false
        Empty Customer profile created.
    end note

    REGISTERED --> VERIFICATION_SENT : OtpService.createAndSendOtp()
    
    VERIFICATION_SENT --> ACTIVE : AuthController.verifyOtp()
    note right of ACTIVE
        Both email OTP + phone OTP matched.
        emailVerified = true
        phoneVerified = true
        isActive = true
    end note
    
    VERIFICATION_SENT --> REGISTERED : OTP Mismatch / OTP Expired (5m)
    
    ACTIVE --> DEACTIVATED : UserController.updateUserStatus(false)
    note right of DEACTIVATED
        Blocked by Administrator.
        isActive = false
    end note

    DEACTIVATED --> ACTIVE : UserController.updateUserStatus(true)
    
    ACTIVE --> [*]
```

---

## 2. Insurance Product Lifecycle

Managed strictly by system Administrators:

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : Admin creates InsuranceProduct (isActive=true)
    [*] --> INACTIVE : Admin creates InsuranceProduct (isActive=false)
    
    ACTIVE --> INACTIVE : Admin deactivates product
    note right of INACTIVE
        No new plans can be added.
        No new policies can be purchased under existing plans.
        Old policies continue running.
    end note

    INACTIVE --> ACTIVE : Admin reactivates product
```

---

## 3. Insurance Policy Lifecycle

Policies track actual client coverage contracts:

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : Purchase (Customer) / Issue (Staff)
    note right of PENDING_PAYMENT
        startDate & endDate calculated.
        totalPremiumPaid = 0.
        Claims cannot be raised.
    end note

    PENDING_PAYMENT --> ACTIVE : PremiumPayment SUCCESS
    note right of ACTIVE
        totalPremiumPaid = plan.premiumAmount.
        Claims can now be raised.
    end note
    
    PENDING_PAYMENT --> EXPIRED : Date reaches endDate (no payment)
    
    ACTIVE --> ACTIVE : Successful subsequent annual payments
    
    ACTIVE --> EXPIRED : Date reaches endDate
    
    ACTIVE --> CANCELLED : Staff / Admin cancels policy
    note right of CANCELLED
        Only allowed if there are no open claims
        (SUBMITTED/UNDER_REVIEW).
    end note

    PENDING_PAYMENT --> CANCELLED : Policy cancellation
```

---

## 4. Claim Processing State Machine

Tracks claim stages, assignments, reviews, and decision logic:

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Customer raises claim
    note right of SUBMITTED
        Requires document attachments.
        Unassigned.
    end note

    SUBMITTED --> ASSIGNED : Staff assigns claim to self
    note right of ASSIGNED
        Claim linked to staff member.
        Staff speciality matches policy product type.
    end note

    ASSIGNED --> UNDER_REVIEW : Staff begins review
    
    UNDER_REVIEW --> RECOMMENDED_FOR_APPROVAL : Staff verifies claims
    UNDER_REVIEW --> RECOMMENDED_FOR_REJECTION : Staff flags discrepancies
    
    RECOMMENDED_FOR_APPROVAL --> APPROVED : Admin finalDecision(APPROVED)
    note right of APPROVED
        Terminal state.
        Payout approved.
    end note

    RECOMMENDED_FOR_REJECTION --> REJECTED : Admin finalDecision(REJECTED)
    note right of REJECTED
        Terminal state.
        Claim denied.
    end note
```

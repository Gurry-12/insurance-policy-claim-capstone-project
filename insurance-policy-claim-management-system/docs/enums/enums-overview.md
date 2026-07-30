# Enums Overview

## Purpose

This document explains every enum in the system — what values are valid, what each value means in the business context, how state machines use them, and where they are used.

---

## Enum Index

| Enum | Package | Used In |
|---|---|---|
| `Role` | enums | AppUser, SecurityConfig, JWT |
| `ProductType` | enums | InsuranceProduct, PolicyPlan, StaffSpeciality |
| `PremiumType` | enums | PolicyPlan, PremiumPayment logic |
| `PolicyStatus` | enums | Policy |
| `PaymentStatus` | enums | PremiumPayment |
| `PaymentMode` | enums | PremiumPayment |
| `ClaimStatus` | enums | Claim, ClaimStatusHistory |
| `ProductCategory` | enums | *(if present)* |

---

## Role

**Values:**
| Value | Description |
|---|---|
| `ROLE_CUSTOMER` | Self-registered insurance policyholder |
| `ROLE_INTERNAL_STAFF` | Insurance company employee who reviews claims/issues policies |
| `ROLE_ADMIN` | System administrator with full access |

**Why `ROLE_` prefix?** Spring Security automatically looks for the `ROLE_` prefix when using `hasRole('CUSTOMER')` in `@PreAuthorize`. Without the prefix, Spring Security's `hasRole` would fail.

**Design decision:** Each user has exactly ONE role. There is no role hierarchy or multi-role assignment.

**Where used:**
- `AppUser.role` field
- `SecurityConfig` URL rules
- `@PreAuthorize` annotations on controllers
- `CustomUserDetailsService` → `SimpleGrantedAuthority(role.name())`
- JWT token `roles` claim

---

## ProductType

**Values:**

| Value | Business Meaning |
|---|---|
| `HEALTH` | Health/medical insurance |
| `MOTOR` | Car/bike/vehicle insurance |
| `LIFE` | Life insurance |
| `TRAVEL` | Travel insurance |
| `INSURANCE` | *(Deprecated — legacy value, do not use for new products)* |

> **Note:** The `INSURANCE` value is a domain error (it's the domain name, not a product type). It exists for backward compatibility only. New product types should use meaningful names like `HOME`, `CYBER`, or `PET`.

**Where used:**
- `InsuranceProduct.productType`
- `PolicyPlan` (via product)
- `StaffSpeciality.productSpeciality` — defines staff domain
- `ClaimRepository` speciality filtering queries
- Business rule: one active HEALTH policy per customer per plan

---

## PremiumType

**Values:**

| Value | Business Meaning |
|---|---|
| `ONE_TIME` | Single premium payment for the entire policy duration |
| `ANNUAL` | Yearly premium payments for each year of the policy |

**Impact on payment logic:**

```
ONE_TIME:
  - Only ONE success payment allowed per policy
  - No payment window restrictions
  - Total required = premiumAmount (once)

ANNUAL:
  - One payment per year
  - Payment window: 15 days before each anniversary
  - Max payments = plan.duration (one per year)
  - Total required = premiumAmount × duration
```

**Where used:**
- `PolicyPlan.premiumType`
- `PremiumPaymentServiceImpl.recordPayment()` — controls all payment validation logic

---

## PolicyStatus

**Values:**

| Value | Description |
|---|---|
| `PENDING_PAYMENT` | Policy created but no premium paid yet |
| `ACTIVE` | Coverage is active (first payment received) |
| `EXPIRED` | Policy duration has ended |
| `CANCELLED` | Policy was terminated by admin/staff |

**State machine:**

```
        [Purchase/Issue]
              │
              ▼
      PENDING_PAYMENT
              │
              │ First SUCCESS payment recorded
              ▼
           ACTIVE
              │
    ┌─────────┤
    │         │
    │         │ Admin/Staff cancels
    │         ▼
    │      CANCELLED ← (terminal)
    │
    │ (manual expiry — Not implemented as scheduler)
    ▼
  EXPIRED ← (terminal)
```

**Where used:**
- `Policy.policyStatus`
- Payment rules: cannot pay for CANCELLED or EXPIRED policies
- Cancellation rules: cannot cancel already CANCELLED or EXPIRED
- Claim rules: can only file claims against ACTIVE policies

---

## PaymentStatus

**Values:**

| Value | Business Meaning |
|---|---|
| `PENDING` | Payment initiated but not yet confirmed |
| `SUCCESS` | Payment was successfully processed |
| `FAILED` | Payment attempt was unsuccessful |

**Why record FAILED payments?**
For audit and reconciliation purposes. A FAILED payment does NOT activate the policy and does NOT increment `totalPremiumPaid`. It still generates a `transactionReference` if provided.

**Where used:**
- `PremiumPayment.paymentStatus`
- Repository queries for finding latest SUCCESS (for ANNUAL window), counting SUCCESS (for ONE_TIME check)

---

## PaymentMode

**Values:**

| Value | Description |
|---|---|
| `UPI` | Unified Payments Interface |
| `CARD` | Credit or Debit card |
| `NET_BANKING` | Internet banking |
| `CASH` | Physical cash payment |

**Where used:**
- `PremiumPayment.paymentMode`
- `PaymentRequestDTO.paymentMode` — client must send one of these values (enum deserialization fails if invalid)

---

## ClaimStatus

**Values:**

| Value | Stage | Set By |
|---|---|---|
| `SUBMITTED` | Initial | Customer (via `raiseClaim`) |
| `UNDER_REVIEW` | Staff picks up | Internal Staff (`/under-review`) |
| `RECOMMENDED_FOR_APPROVAL` | Staff recommends approval | Internal Staff (`/review`) |
| `RECOMMENDED_FOR_REJECTION` | Staff recommends rejection | Internal Staff (`/review`) |
| `APPROVED` | Admin approves | Admin (`/final-decision`) |
| `REJECTED` | Admin rejects | Admin (`/final-decision`) |

**State machine:**

```
SUBMITTED
    │
    ├── assignStaff() [staff] → SUBMITTED (+ assignedStaff set)
    │
    └── underReviewClaim() [staff] → UNDER_REVIEW
                                          │
                              reviewClaim() [staff]
                               ┌──────────┴────────────┐
                               ▼                       ▼
                  RECOMMENDED_FOR_APPROVAL   RECOMMENDED_FOR_REJECTION
                               │                       │
                         finalDecision() [admin]        │
                               └──────────┬────────────┘
                                          │
                               ┌──────────┴───────────┐
                               ▼                      ▼
                           APPROVED               REJECTED
                          (terminal)             (terminal)
```

**Where used:**
- `Claim.claimStatus`
- `ClaimStatusHistory.previousStatus` / `newStatus`
- Coverage calculation: excludes REJECTED claims
- Policy cancellation: blocks if any SUBMITTED / UNDER_REVIEW / RECOMMENDED exists
- `ClaimReviewRequestDTO.recommendedStatus` — validated per role in service

---

## Enum Serialization

All enums use `@Enumerated(EnumType.STRING)` in entities. This means:
- Database stores: `"ROLE_CUSTOMER"`, `"ACTIVE"`, `"SUCCESS"`, etc.
- NOT integer ordinals

**Why STRING?** Adding new enum values in the middle or reordering won't corrupt data. ORDINAL-based storage is fragile.

---

## JSON Deserialization

Jackson (Spring Boot default) deserializes enum values **case-sensitively** by default. If the client sends `"active"` instead of `"ACTIVE"`, it will fail with a JSON parse error → 400 BAD_REQUEST.

**To support case-insensitive:** Add to `application.properties`:
```properties
spring.jackson.deserialization.read-unknown-enum-values-as-null=true
```
Or use `@JsonProperty` on each enum value.  
**Not implemented** — client must send exact case-sensitive values.

---

## Adding a New Enum Value

1. Add the value to the enum class
2. Update any `switch` or `if-else` chains that enumerate values
3. Check business rules that depend on the enum (e.g., payment logic, status machine validation)
4. Verify `JPA` schema migration if needed (enums stored as VARCHAR — no migration needed for new values)
5. Update this documentation

---

## Related Documents

- [entities/entities-overview.md](../entities/entities-overview.md)
- [services/services-overview.md](../services/services-overview.md)
- [workflows/workflows-overview.md](../workflows/workflows-overview.md)

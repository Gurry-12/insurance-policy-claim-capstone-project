# Entities Overview

## Purpose

This document explains every JPA entity in the system — what it represents, why each field exists, its relationships, lifecycle, validation rules, and business significance.

---

## Entity Relationship Map

```
AppUser (users)
  │
  ├──── OneToOne ────── Customer (customers)
  │                         │
  │                         └──── OneToMany ──── Policy (policies)
  │                                                  │
  │                                                  ├──── OneToMany ──── PremiumPayment (premium_payments)
  │                                                  └──── OneToMany ──── Claim (claims)
  │                                                                           │
  │                                                                           ├──── OneToMany ── ClaimDocument (claim_documents)
  │                                                                           └──── OneToMany ── ClaimStatusHistory (claim_status_histories)
  │
  ├──── OneToOne ────── StaffSpeciality (staff_specialities)
  │
  └──── OneToMany ────── OtpVerification (otp_verifications)
  
  
InsuranceProduct (insurance_products)
  └──── OneToMany ──── PolicyPlan (policy_plans)
                           └──── OneToMany ──── Policy (policies)
```

---

## Entity 1: AppUser

**Table:** `users`  
**File:** `model/AppUser.java`

**Purpose:** Central user entity. Represents every person in the system regardless of role. All authentication happens against this table.

### Fields

| Field | Column | Type | Why It Exists |
|---|---|---|---|
| `id` | `id` | Long (PK) | Auto-generated surrogate key |
| `fullName` | `full_name` | String | Display name, also embedded in JWT |
| `email` | `email` | String (UNIQUE) | Primary login identifier, stored lowercase |
| `password` | `password` | String | BCrypt hash of decoded password |
| `mobileNumber` | `mobile_number` | String (UNIQUE) | For SMS OTP delivery and identity verification |
| `isActive` | `is_active` | Boolean | Gates login access; false = account blocked |
| `role` | `role` | Enum(STRING) | Single role per user; drives all authorization |
| `emailVerified` | `email_verified` | Boolean | Must be true before login is allowed |
| `phoneVerified` | `phone_verified` | Boolean | Must be true before login is allowed |
| `createdDate` | `created_date` | LocalDateTime | Auditing, @CreationTimestamp (auto-set) |
| `updatedDate` | `updated_date` | LocalDateTime | Auditing, @UpdateTimestamp (auto-set) |

### Relationships

| Relationship | Type | Cascade | Note |
|---|---|---|---|
| `customer` | OneToOne (mappedBy) | ALL, orphanRemoval | Created at registration; null for staff/admin |
| `staffSpeciality` | OneToOne (mappedBy) | ALL, orphanRemoval | Created when admin creates staff; null for customers |

### Unique Constraints (DB Level)

```sql
UNIQUE KEY user_valid_email (email)
UNIQUE KEY user_valid_phone (mobile_number)
```

### Validation Annotations

```
@Pattern(regexp = "^[a-zA-Z\\s]*$") on fullName — rejects numeric/special chars
@Email on email
@Size(min=2, max=100) on fullName
```

### Why `isActive` + `emailVerified` + `phoneVerified`?

Three separate flags because they serve different purposes:
- `emailVerified` — has the user proven they own the email?
- `phoneVerified` — has the user proven they own the phone?
- `isActive` — is the account operational? (Can be deactivated by admin independently)

---

## Entity 2: Customer

**Table:** `customers`  
**File:** `model/Customer.java`

**Purpose:** Stores customer-specific profile data. Created empty at registration, filled by the customer later. All policy operations require a complete profile.

### Fields

| Field | Column | Why |
|---|---|---|
| `user` | `user_id` (FK) | OneToOne link to AppUser for authentication |
| `dateOfBirth` | `date_of_birth` | Age verification (must be ≥18) |
| `address` | `address` | Required for policy issuance |
| `city` | `city` | Policy location data |
| `state` | `state` | Policy location data |
| `pinCode` | `pin_code` | Used in underwriting |
| `nomineeName` | `nominee_name` | Insurance beneficiary designation |
| `nomineeRelation` | `nominee_relation` | Relationship to policyholder |

### Profile Completeness Check

Before purchasing a policy, `PolicyServiceImpl.isCustomerProfileComplete(customer)` verifies:
- `dateOfBirth != null`
- `address`, `city`, `state`, `pinCode` are non-empty
- `nomineeName`, `nomineeRelation` are non-empty

**Why this check exists:** Insurance regulations require verified personal and beneficiary information before coverage can be bound.

---

## Entity 3: InsuranceProduct

**Table:** `insurance_products`  
**File:** `model/InsuranceProduct.java`

**Purpose:** Represents a top-level insurance product category (e.g., "HealthShield Gold" of type HEALTH). Plans are created under products.

### Fields

| Field | Column | Why |
|---|---|---|
| `productName` | `product_name` (UNIQUE) | Prevents duplicate products |
| `productType` | `product_type` | Enum: HEALTH, LIFE, VEHICLE, PROPERTY, TRAVEL |
| `description` | `description` | Marketing and informational text |
| `isActive` | `is_active` | Inactive products cannot have new plans created; existing plans remain |

### Relationships

| Relationship | Type | Cascade |
|---|---|---|
| `policyPlans` | OneToMany | ALL, orphanRemoval |

**Important:** Deleting or deactivating a product cascades to its plans. Plans under inactive products cannot be used for new policies.

---

## Entity 4: PolicyPlan

**Table:** `policy_plans`  
**File:** `model/PolicyPlan.java`

**Purpose:** A specific offering under an InsuranceProduct — defines premium amount, coverage, duration, and terms. Customers purchase policies based on plans.

### Fields

| Field | Column | Why |
|---|---|---|
| `insuranceProduct` | `product_id` (FK) | Links plan to parent product |
| `planName` | `plan_name` | User-facing name |
| `coverageAmount` | `coverage_amount` | Max claimable amount over policy lifetime |
| `premiumAmount` | `premium_amount` | Per-period payment required |
| `premiumType` | `premium_type` | ONE_TIME or ANNUAL |
| `duration` | `duration` | Years the policy runs (max 40) |
| `termsAndConditions` | `terms_conditions` | Legal terms (up to 3000 chars) |
| `isActive` | `is_active` | Only active plans can be purchased |

### Business Rule: Coverage > Premium

Service layer enforces:
```
coverageAmount > (premiumAmount × duration)
```

**Why?** The policy must provide more coverage than the total premium paid — otherwise it's economically meaningless as insurance.

---

## Entity 5: Policy

**Table:** `policies`  
**File:** `model/Policy.java`

**Purpose:** Represents an actual insurance contract between a customer and the company. Created either by self-purchase or staff issuance.

### Fields

| Field | Column | Why |
|---|---|---|
| `policyNumber` | `policy_number` (UNIQUE) | Human-readable unique identifier |
| `customer` | `customer_id` (FK) | Policy owner |
| `policyPlan` | `plan_id` (FK) | Defines coverage terms |
| `startDate` | `start_date` | Coverage start |
| `endDate` | `end_date` | Calculated: startDate + plan.duration years |
| `policyStatus` | `policy_status` | PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED |
| `totalPremiumPaid` | `total_premium_paid` | Running total; auto-incremented on payment |
| `version` | (implicit) | Optimistic locking to prevent concurrent updates |

### Policy Status Lifecycle

```
[PENDING_PAYMENT]
      │
      │ First successful payment recorded
      ▼
   [ACTIVE]
      │
      ├─── Policy endDate < today → [EXPIRED] (manual/scheduled - Not implemented)
      └─── Admin/Staff cancels → [CANCELLED]
```

**Note:** The system does NOT automatically expire policies. An expiry scheduler is **Not implemented** — policies must be manually expired or a batch job added.

### Relationships

| Relationship | Type | Notes |
|---|---|---|
| `payments` | OneToMany | All premium payments for this policy |
| `claims` | OneToMany | All claims filed against this policy |

### `@Version` Field

Prevents two simultaneous API calls from both updating the same policy. If conflict detected → HTTP 409.

---

## Entity 6: PremiumPayment

**Table:** `premium_payments`  
**File:** `model/PremiumPayment.java`

**Purpose:** Records each premium payment attempt (success or failure) for a policy.

### Fields

| Field | Column | Why |
|---|---|---|
| `policy` | `policy_id` (FK) | Which policy this payment is for |
| `amount` | `amount` | Must match `plan.premiumAmount` exactly |
| `paymentDate` | `payment_date` | When payment was made |
| `paymentMode` | `payment_mode` | UPI, CARD, NETBANKING, CASH, CHEQUE |
| `transactionReference` | `transaction_reference` (UNIQUE) | Prevents duplicate payment processing |
| `paymentStatus` | `payment_status` | SUCCESS or FAILED |

### Why `transactionReference` is UNIQUE?

Prevents idempotency issues — if the same transaction ID is submitted twice (network retry), the second request fails with 409 instead of recording a duplicate payment.

---

## Entity 7: Claim

**Table:** `claims`  
**File:** `model/Claim.java`

**Purpose:** Represents a customer's insurance claim filed against an active policy.

### Fields

| Field | Column | Why |
|---|---|---|
| `claimNumber` | `claim_number` (UNIQUE) | Human-readable claim reference |
| `claimAmount` | `claim_amount` | Requested payout amount |
| `claimReason` | `claim_reason` | Description of the loss/incident |
| `incidentDate` | `incident_date` | Date the incident occurred (must be within policy period) |
| `claimStatus` | `claim_status` | Tracks lifecycle: SUBMITTED → UNDER_REVIEW → RECOMMENDED → APPROVED/REJECTED |
| `staffRemarks` | `staff_remarks` | Internal staff notes |
| `adminRemarks` | `admin_remarks` | Admin's decision rationale |
| `policy` | `policy_id` (FK) | Policy this claim is against |
| `assignedStaff` | `assigned_staff_id` (FK) | Staff reviewing this claim |
| `version` | (implicit) | Optimistic locking |

### Claim Status Lifecycle

```
[SUBMITTED]  ← Customer files claim with documents
     │
     │ Staff picks up claim (assign)
     ├─────────────────────────────────────────────────►
     │ Staff marks UNDER_REVIEW
     ▼
[UNDER_REVIEW]
     │
     │ Staff reviews & recommends
     ├──────────────────────────────────────────────────┐
     ▼                                                  ▼
[RECOMMENDED_FOR_APPROVAL]           [RECOMMENDED_FOR_REJECTION]
     │                                                  │
     │ Admin makes final decision                       │
     ├─────────────────────────────────────────────────►│
     ▼                                                  ▼
  [APPROVED]                                        [REJECTED]
```

### Business Rules

1. `claimAmount` must be ≤ remaining coverage (coverageAmount minus active non-rejected claims sum)
2. `incidentDate` must be in the past (not future)
3. `incidentDate` must be within policy's startDate and endDate
4. Policy must be ACTIVE (not PENDING_PAYMENT, EXPIRED, or CANCELLED)
5. Only staff assigned to the claim can review it
6. Only staff matching the claim's product type can assign/review it

---

## Entity 8: ClaimDocument

**Table:** `claim_documents`  
**File:** `model/ClaimDocument.java`

**Purpose:** Stores metadata about documents uploaded to support a claim. Actual files are in Cloudinary.

### Fields

| Field | Why |
|---|---|
| `name` | Document display name |
| `documentType` | Type label (e.g., "Medical Bill", "Police Report") |
| `documentReference` | Cloudinary URL (public access URL) |
| `publicId` | Cloudinary public ID for future deletion |
| `uploadedDate` | When the document was uploaded |
| `claim` | FK to Claim |

---

## Entity 9: ClaimStatusHistory

**Table:** `claim_status_histories`  
**File:** `model/ClaimStatusHistory.java`

**Purpose:** Immutable audit trail. Every time a claim's status changes, a new record is created here. Enables full traceability.

### Fields

| Field | Why |
|---|---|
| `previousStatus` | The status before the change (null on first SUBMITTED) |
| `newStatus` | The status after the change |
| `remarks` | Who said what and why |
| `updatedBy` | Email of the person who made the change |
| `updatedDate` | When the change happened |
| `claim` | FK to Claim |

**Why immutable (no updates)?** Audit records must never be modified. Once written, they represent a permanent fact. Developers should NEVER add update methods to this repository.

---

## Entity 10: StaffSpeciality

**Table:** `staff_specialities`  
**File:** `model/StaffSpeciality.java`

**Purpose:** Links an internal staff member to a specific insurance product type. Determines what they can work on.

### Fields

| Field | Why |
|---|---|
| `staff` | OneToOne FK to AppUser |
| `productSpeciality` | ProductType enum — HEALTH, LIFE, VEHICLE, etc. |

**Design note:** Each staff member has exactly ONE speciality. This is a deliberate constraint. A staff member working on HEALTH claims cannot view or touch LIFE claims.

---

## Entity 11: OtpVerification

**Table:** `otp_verifications`  
**File:** `model/OtpVerification.java`

**Purpose:** Stores OTP records for email and phone verification. Supports rate limiting via `sendCount` and `lastSentAt`.

### Fields

| Field | Why |
|---|---|
| `user` | @ManyToOne (one user can have multiple OTP records over time) |
| `emailOtp` | 6-digit OTP for email verification |
| `phoneOtp` | 6-digit OTP for SMS verification |
| `expiresAt` | When the OTP becomes invalid |
| `used` | Prevents replaying a used OTP |
| `sendCount` | Tracks total sends for rate limiting |
| `lastSentAt` | For 60-second cooldown enforcement |
| `createdAt` | Set by @PrePersist |

---

## Common Entity Mistakes

1. **Do NOT add `update()` methods to `ClaimStatusHistory`** — it must be append-only
2. **Do NOT update `createdDate` fields** — `updatable=false` is intentional
3. **Do NOT set `endDate` manually** — it is always `startDate + plan.duration years`
4. **Do NOT set `totalPremiumPaid` directly** — it is incremented by payment service
5. **Always use `@Transactional`** when modifying entities with cascades

---

## Related Documents

- [database/database-overview.md](../database/database-overview.md)
- [services/services-overview.md](../services/services-overview.md)

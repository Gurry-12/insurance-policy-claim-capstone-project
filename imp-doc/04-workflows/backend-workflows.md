# Workflows Overview

## Purpose

This document provides complete step-by-step execution traces for every major business workflow in the system. Each workflow shows the full execution path from HTTP request through controller → service → repository → database → response.

---

## Table of Contents

1. [Purchase Policy Workflow](#1-purchase-policy-workflow)
2. [Issue Policy (Staff/Admin)](#2-issue-policy-workflow)
3. [Premium Payment Workflow](#3-premium-payment-workflow)
4. [Raise a Claim Workflow](#4-raise-a-claim-workflow)
5. [Staff Claim Review Workflow](#5-staff-claim-review-workflow)
6. [Admin Final Decision Workflow](#6-admin-final-decision-workflow)
7. [Cancel Policy Workflow](#7-cancel-policy-workflow)
8. [Claim History Workflow](#8-claim-history-workflow)

---

## 1. Purchase Policy Workflow

**Who:** CUSTOMER only  
**Endpoint:** `POST /api/policies/purchase`

### Business Rules

1. Customer profile must be 100% complete (DOB, address, city, state, pinCode, nominee)
2. The plan must be active
3. **HEALTH plans:** Only ONE active or pending-payment policy per plan per customer allowed
4. **Other plans:** Only ONE pending-payment policy per plan allowed (can have multiple active)
5. End date is auto-calculated: `startDate + plan.duration years`
6. Policy is created in `PENDING_PAYMENT` status (NOT active until first payment)

### ASCII Flow Diagram

```
POST /api/policies/purchase
{ "planId": 5, "startDate": "2024-01-01" }

[CLIENT] ─────────────────────────────────────────────────────────────────────►
                     [PolicyController.purchasePolicy()]
                                   │
                    @PreAuthorize("hasRole('CUSTOMER')")
                    @Valid validates PolicyPurchaseRequestDTO
                                   │
                     [PolicyServiceImpl.purchasePolicy()]
                                   │
            ┌──────────────────────┴───────────────────────────────────┐
            │                                                          │
  Get customer email from SecurityContext              Find CustomerByEmail
  customerRepo.findByUserEmail(email)                        ▼
            │                                    isCustomerProfileComplete()?
            │                                    (DOB, address, city, state,
            │                                     pinCode, nominee all filled)
            │                                    NO → 400 COMPLETE_PROFILE_FIRST
            │
  policyPlanRepo.findByIdAndIsActiveTrue(planId)
  NOT FOUND → throw PlanNotActiveException → 400
            │
  Get productType from plan
            │
  IF productType == HEALTH:
    existsByCustomer+Plan+(ACTIVE,PENDING_PAYMENT)?
    YES → 409 HEALTH_POLICY_EXISTS
  ELSE:
    existsByCustomer+Plan+(PENDING_PAYMENT)?
    YES → 409 POLICY_EXISTS
            │
  new Policy {
    customer = customer,
    policyPlan = plan,
    policyNumber = PolicyNumberGenerator.generate(),  // POL-{timestamp}-{random}
    startDate = requestDTO.startDate,
    endDate = startDate.plusYears(plan.duration),
    policyStatus = PENDING_PAYMENT,
    totalPremiumPaid = 0
  }
            │
  policyRepo.save(policy)
            │
  return ApiResponseDTO<PolicyResponseDTO>(PURCHASED_SUCCESS, 201)

[CLIENT] ◄─────────────────────────────────────────────────────────────────────
```

### Response includes: `remainingClaimAmount` calculated as `coverageAmount - sum(active claims)`

---

## 2. Issue Policy Workflow

**Who:** ADMIN or INTERNAL_STAFF  
**Endpoint:** `POST /api/policies/issue`

### Differences from Purchase

- Admin issues on behalf of a customer (provides `customerId` instead of using JWT email)
- **Staff speciality check:** If issuer is INTERNAL_STAFF, their speciality must match the plan's product type
- Same profile completeness and duplicate checks apply

### ASCII Flow

```
POST /api/policies/issue
{ "customerId": 3, "planId": 5, "startDate": "2024-01-01" }
                     │
          [PolicyServiceImpl.issuePolicy()]
                     │
  customerRepo.findById(customerId) → check profile complete
                     │
  policyPlanRepo.findByIdAndIsActiveTrue(planId) → get plan
                     │
  IF caller is INTERNAL_STAFF:
    Get staffSpeciality
    plan.productType must == staffSpeciality
    MISMATCH → 403 SPECIALITY_ISSUE_DENIED
                     │
  [same duplicate checks as purchase]
                     │
  save Policy (PENDING_PAYMENT)
                     │
  return 201 ISSUED_SUCCESS
```

---

## 3. Premium Payment Workflow

**Who:** CUSTOMER or INTERNAL_STAFF  
**Endpoint:** `POST /api/payments`

### Business Rules

1. `amount` must EXACTLY match `policy.calculatedPremium` (the total premium including GST and fees)
2. Cannot pay for CANCELLED or EXPIRED policies
3. **ONE_TIME plans:** Only ONE successful payment allowed per policy
4. **ANNUAL plans:** Payment window = 15 days before each anniversary of last payment
5. ANNUAL plan total successful payments cannot exceed `policy.policyDuration`
6. `transactionReference` must be globally unique (prevents double-charging)
7. `totalPremiumPaid` cannot exceed `calculatedPremium × policyDuration`
8. On SUCCESS payment → policy status changes to ACTIVE

### ASCII Flow Diagram

```
POST /api/payments
{ "policyId": 10, "amount": 38400, "paymentMode": "UPI", "paymentStatus": "SUCCESS" }
                     │
         [PremiumPaymentServiceImpl.recordPayment()]
                     │
  policyRepo.findById(policyId) → or 404
                     │
  Ownership check: IF customer, email must match policy owner
                     │
  Staff speciality check: IF staff, productType must match
                     │
  amount == policy.calculatedPremium? NO → 400 AMOUNT_MISMATCH
                     │
  policy.status == CANCELLED? → 400 CANCELLED_POLICY_RESTRICTED
  policy.status == EXPIRED?   → 400 EXPIRED_POLICY_RESTRICTED
                     │
  IF premiumType == ONE_TIME:
    Any existing SUCCESS payment? → 400 ONE_TIME_ALREADY_PAID
                     │
  IF premiumType == ANNUAL:
    Latest SUCCESS payment + 1 year → nextEligibleDate
    paymentWindowStart = nextEligibleDate - 15 days
    now < paymentWindowStart → 400 EARLY_PAYMENT_RESTRICTION
    totalSuccessCount >= policyDuration → 400 ALL_PREMIUMS_PAID
                     │
  Generate transactionReference (TXN-{timestamp}-{random})
  Already exists? → 409 DUPLICATE_REFERENCE
                     │
  totalPremiumPaid + amount > calculatedPremium×policyDuration → 400 PREMIUM_LIMIT_EXCEEDED
                     │
  new PremiumPayment {
    policy, amount, paymentMode, transactionReference,
    paymentDate = now(), paymentStatus = dto.paymentStatus
  }
  paymentRepo.save(payment)
                     │
  IF paymentStatus == SUCCESS:
    policy.totalPremiumPaid += amount
    policy.policyStatus = ACTIVE   ← KEY: auto-activates policy
  policyRepo.save(policy)
                     │
  return 201 RECORDED_SUCCESS
```

---

## 4. Raise a Claim Workflow

**Who:** CUSTOMER only  
**Endpoint:** `POST /api/claims/raise` (multipart/form-data)

### Business Rules

1. At least ONE document file must be uploaded
2. Files must be PDF or image (not other types)
3. Each file ≤ 5MB
4. Claim can only be filed against CUSTOMER'S OWN active policy
5. Policy must be ACTIVE (not PENDING_PAYMENT, EXPIRED, CANCELLED)
6. `claimAmount` must be positive
7. Sum of all non-rejected claims must not exceed `plan.coverageAmount`
8. `incidentDate` must NOT be in the future
9. `incidentDate` must be within policy period (startDate to endDate)
10. All files are uploaded to Cloudinary; metadata saved to `claim_documents`
11. A `ClaimStatusHistory` record is created (status: SUBMITTED)

### ASCII Flow Diagram

```
POST /api/claims/raise
Content-Type: multipart/form-data
  claim: { "policyId": 10, "claimAmount": 50000, "claimReason": "...", "incidentDate": "2024-06-15" }
  files: [file1.pdf, file2.jpg]
                     │
         [ClaimServiceImpl.raiseClaim(dto, files)]
                     │
  Validate files: not empty, valid names, PDF/image, ≤5MB each
  ANY violation → 400
                     │
  Get email from SecurityContext
                     │
  claimAmount > 0? NO → 400 AMOUNT_MUST_BE_POSITIVE
                     │
  policyRepo.findById(policyId) → or 404
                     │
  policy.customer.user.email == callerEmail? NO → 400 POLICY_NOT_OWNED
                     │
  policy.policyStatus == ACTIVE? NO → 400 POLICY_NOT_ACTIVE
                     │
  activeClaimsSum = SUM(claimAmount where status != REJECTED)
  remainingCoverage = coverageAmount - activeClaimsSum
  claimAmount > remainingCoverage → 400 EXCEEDS_LIMIT + remainingAmount
                     │
  incidentDate > today → 400 FUTURE_INCIDENT_DATE
  incidentDate outside [startDate, endDate] → 400 INCIDENT_DATE_OUT_OF_BOUNDS
                     │
  new Claim {
    policy, claimAmount, claimReason,
    incidentDate = dto.incidentDate.atStartOfDay(),
    claimStatus = SUBMITTED,
    claimNumber = ClaimNumberGenerator.generate() // CLM-{timestamp}-{random}
  }
  claimRepo.save(claim)
                     │
  Upload files to Cloudinary via ClaimDocumentService
  Save ClaimDocument records (name, type, cloudinaryUrl, publicId, uploadedDate)
                     │
  recordClaimHistory(claim, null, SUBMITTED, "Claim submitted by customer", email)
  → new ClaimStatusHistory { previousStatus=null, newStatus=SUBMITTED, ... }
                     │
  return 201 SUBMITTED_SUCCESS with claim details + document list
```

---

## 5. Staff Claim Review Workflow

**Who:** INTERNAL_STAFF only  
**Steps:** Assign → Move to UNDER_REVIEW → Review → Recommend

### Step A: Assign Claim to Self

```
PATCH /api/claims/{claimId}/assign
                     │
  claim must be SUBMITTED (not already under review)
                     │
  Staff speciality must match claim's product type
                     │
  IF claim.assignedStaff != null AND != currentStaff → 400 ALREADY_ASSIGNED
                     │
  claim.assignedStaff = currentStaff
  save claim
  recordHistory(SUBMITTED→SUBMITTED, "Staff assigned")
```

### Step B: Move to Under Review

```
PATCH /api/claims/{claimId}/under-review
                     │
  Staff speciality must match claim's product type
                     │
  claim must be SUBMITTED (not already APPROVED/REJECTED)
                     │
  claim.claimStatus = UNDER_REVIEW
  recordHistory(SUBMITTED→UNDER_REVIEW, "Claim under review")
```

### Step C: Review and Recommend

```
PATCH /api/claims/{claimId}/review
{ "recommendedStatus": "RECOMMENDED_FOR_APPROVAL", "remarks": "All documents valid" }
                     │
  recommendedStatus must be RECOMMENDED_FOR_APPROVAL or RECOMMENDED_FOR_REJECTION
  (Staff CANNOT set APPROVED or REJECTED directly)
                     │
  Staff speciality must match claim's product type
                     │
  claim.assignedStaff must == currentStaff
  (Cannot review another staff's claim)
                     │
  claim must be UNDER_REVIEW (not finalized)
                     │
  claim.claimStatus = recommendedStatus
  claim.staffRemarks = remarks
  recordHistory(UNDER_REVIEW → recommendedStatus, remarks)
```

---

## 6. Admin Final Decision Workflow

**Who:** ADMIN only  
**Endpoint:** `PATCH /api/claims/{claimId}/final-decision`

```
{ "recommendedStatus": "APPROVED", "remarks": "Claim verified and approved" }
                     │
  recommendedStatus must be APPROVED or REJECTED
  (Admin CANNOT set RECOMMENDED_* statuses)
                     │
  claim must be RECOMMENDED_FOR_APPROVAL or RECOMMENDED_FOR_REJECTION
  (Must have been reviewed first — no skipping staff review)
                     │
  Cannot re-finalize an already APPROVED or REJECTED claim
                     │
  claim.claimStatus = dto.recommendedStatus
  claim.adminRemarks = remarks
  recordHistory(previous → APPROVED/REJECTED, remarks)
```

---

## 7. Cancel Policy Workflow

**Who:** ADMIN or INTERNAL_STAFF  
**Endpoint:** `PATCH /api/policies/{policyId}/cancel`

### Business Rules

1. Cannot cancel already CANCELLED or EXPIRED policies
2. Staff must match the policy's product type speciality
3. **Cannot cancel if ANY open claims exist** (SUBMITTED, UNDER_REVIEW, RECOMMENDED_FOR_APPROVAL, RECOMMENDED_FOR_REJECTION)

```
                     │
  policy.status == CANCELLED or EXPIRED → 400 CANCEL_INACTIVE_RESTRICTED
                     │
  IF staff: speciality must match policy product type → 403 SPECIALITY_CANCEL_DENIED
                     │
  ANY claim with status in [SUBMITTED, UNDER_REVIEW, REC_APPROVAL, REC_REJECTION]?
  YES → 400 CANCEL_WITH_OPEN_CLAIMS
                     │
  policy.policyStatus = CANCELLED
  save policy
```

---

## 8. Claim History Workflow

**Who:** ADMIN, INTERNAL_STAFF, CUSTOMER (with restrictions)  
**Endpoint:** `GET /api/claims/{claimId}/history`

```
Security checks:
  CUSTOMER: can only see history for their own claims
  INTERNAL_STAFF: can only see history for claims in their speciality
  ADMIN: sees all

Query ClaimStatusHistory:
  Filter by: updatedBy (contains, case-insensitive), newStatus
  Sort by: id, updatedDate, newStatus, updatedBy
  Page: pageNumber, pageSize

Returns: ClaimHistoryResponseDTO[] {
  historyId, previousStatus, newStatus, remarks, updatedBy, updatedDate
}
```

---

## Key State Machine: Claim Status

```
          ┌──────────────────────────────────────────────────────┐
          │                    CLAIM STATUS                       │
          └──────────────────────────────────────────────────────┘
                             SUBMITTED
                                │
                 ┌──────────────┴─────────────────────┐
                 │ Staff.assign()                      │ Staff.underReview()
                 ▼                                     ▼
         (staff assigned)                       UNDER_REVIEW
                                                     │
                                         Staff.review() → recommend
                                            ┌────────┴────────┐
                                            ▼                 ▼
                                  REC_FOR_APPROVAL   REC_FOR_REJECTION
                                            │                 │
                                       Admin.finalDecision()  │
                                            └────────┬────────┘
                                                     │
                                            ┌────────┴────────┐
                                            ▼                 ▼
                                        APPROVED           REJECTED
                                     (terminal)          (terminal)
```

---

## Related Documents

- [services/services-overview.md](../services/services-overview.md)
- [controllers/controllers-overview.md](../controllers/controllers-overview.md)
- [entities/entities-overview.md](../entities/entities-overview.md)

# Services Overview

## Purpose

This document explains every service in the system — their business rules, decision-making logic, why certain validations exist, how they interact with repositories, and how to safely extend them.

---

## Service Design Pattern

Every service is split into:
- **Interface** (`service/XxxService.java`) — defines the public contract
- **Implementation** (`serviceimpl/XxxServiceImpl.java`) — contains all logic

All implementations use `@RequiredArgsConstructor` (Lombok) for constructor injection and `@Slf4j` for structured logging.

---

## Strategy Pattern — Premium Calculation

**File:** `service/strategy/PremiumCalculator.java` (interface)  
**Factory:** `service/strategy/PremiumCalculatorFactory.java`  
**Implementations:** `AnnualPremiumCalculator`, `OneTimePremiumCalculator`

The system uses the Strategy Pattern to calculate premiums based on `PremiumType`:

| Strategy | Component Name | Behavior |
|---|---|---|
| `AnnualPremiumCalculator` | `ANNUAL_CALCULATOR` | Customer pays premium each year; no lump-sum discount |
| `OneTimePremiumCalculator` | `ONE_TIME_CALCULATOR` | Customer pays once upfront with duration-based discount (2-20%) |

**How selection works:**
```java
@Component
public class PremiumCalculatorFactory {
    private final Map<String, PremiumCalculator> calculators;
    
    public PremiumCalculator getCalculator(PremiumType premiumType) {
        return calculators.get(premiumType.name() + "_CALCULATOR");
    }
}
```

**Adding a new premium type (e.g., QUARTERLY):**
1. Add `QUARTERLY` to `PremiumType` enum
2. Create `QuarterlyPremiumCalculator implements PremiumCalculator` with `@Component("QUARTERLY_CALCULATOR")`
3. No changes to factory or consumer code needed

---

## AuthServiceImpl

**Interface:** `AuthService`  
**File:** `serviceimpl/AuthServiceImpl.java`

### Responsibilities

- User registration (CUSTOMER role only)
- OTP verification and account activation
- Login with JWT token generation
- OTP resend with rate limiting
- Forgot password OTP
- Password reset with OTP verification

### Key Business Decisions

**Why is BCrypt used for passwords?**
BCrypt is used because it is a secure, computationally expensive hashing algorithm that protects against rainbow table attacks.

**Why check `emailVerified` AND `phoneVerified` separately?**
They can be independently true/false. An account might have email verified but not phone if there was an SMS delivery failure. Both must be true before login is allowed.

**Why set `isActive=false` at registration?**
New accounts are locked until both email and phone OTPs are verified. This prevents bots from creating accounts without valid contact information.

---

## ClaimServiceImpl

**Interface:** `ClaimService`  
**File:** `serviceimpl/ClaimServiceImpl.java` (596 lines)

### Responsibilities

- Claim submission with file upload
- Moving claim to UNDER_REVIEW status
- Assigning claim to staff member
- Staff review and recommendation
- Admin final decision (APPROVED / REJECTED)
- Retrieving claims (with ownership/speciality scoping)
- Claim history with pagination and filtering

### Key Business Decisions

**Why check `staffSpeciality == claimProductType` in every staff operation?**
Insurance departments are specialized. A HEALTH specialist reviewing a VEHICLE claim would be unqualified. This ensures only domain-appropriate staff handle each claim.

**Why does `assignedStaff` get checked before `reviewClaim`?**
A claim is assigned to one staff member. If another staff tries to review it, they get a 403. This prevents two staff reviewing the same claim concurrently.

**Why is `ClaimStatusHistory` recorded for EVERY state change?**
Complete audit trail is required by insurance regulations. Every change — who, when, what status, what remarks — must be permanently recorded.

**Why does `@Version` exist on Claim?**
Two staff members could theoretically try to update the same claim simultaneously. `@Version` ensures only one succeeds; the other gets a 409 CONFLICT.

### Coverage Calculation

```java
BigDecimal activeClaimsSum = claimRepository.sumActiveClaimsByPolicyId(
    policy.getId(), ClaimStatus.REJECTED);
BigDecimal remainingCoverage = policy.getPolicyPlan().getCoverageAmount()
    .subtract(activeClaimsSum);
```

**Why exclude REJECTED?** Rejected claims don't consume coverage — the money was never paid out. Only non-rejected (SUBMITTED, UNDER_REVIEW, RECOMMENDED, APPROVED) claims count against the coverage limit.

### Speciality Scoping in getAllClaims

When INTERNAL_STAFF requests paginated claims, a JPA Specification automatically filters by their speciality:
```java
spec = spec.and((root, query, cb) ->
    cb.equal(root.get("policy").get("policyPlan")
        .get("insuranceProduct").get("productType"), staffSpeciality));
```
If staff has NO speciality → `cb.disjunction()` (zero results returned).

---

## PolicyServiceImpl

**Interface:** `PolicyService`  
**File:** `serviceimpl/PolicyServiceImpl.java`

### Responsibilities

- Policy purchase (self-service by customer)
- Policy issuance (by admin/staff on behalf of customer)
- Retrieving policies with access control
- Policy cancellation with open-claim guard

### Key Business Decisions

**Why is `isCustomerProfileComplete` checked before policy creation?**
Insurance contracts require verified personal information. An incomplete profile means the company doesn't have enough data to underwrite the risk.

**Why are HEALTH plans restricted to one active/pending per customer per plan?**
Health insurance covers an individual — multiple simultaneous identical health policies would mean double coverage, which is typically not permitted. Other insurance types (e.g., VEHICLE) can have multiple policies for different vehicles.

**Why does the service also do speciality checks when staff issues a policy?**
Staff should only issue policies for their domain. A HEALTH specialist should not issue LIFE policies.

**Why block policy cancellation with open claims?**
If a claim is being processed, the policy coverage is still needed. Cancelling the policy would create a contractual dispute about whether the claim should be paid.

**`convertToResponseDTO` why does it recalculate `remainingClaimAmount`?**
This provides real-time coverage availability information to the frontend, so customers and staff can immediately see how much claim amount is still available.

---

## PremiumPaymentServiceImpl

**Interface:** `PremiumPaymentService`  
**File:** `serviceimpl/PremiumPaymentServiceImpl.java`

### Responsibilities

- Recording premium payments (SUCCESS or FAILED)
- Enforcing payment rules (amount match, ONE_TIME restriction, ANNUAL window)
- Auto-activating policy on first SUCCESS payment
- Retrieving payments with access control

### Key Business Decisions

**Why must `amount == plan.premiumAmount` exactly?**
Partial payments are not supported. The system requires the full premium installment. This simplifies accounting — each row represents one full premium period.

**Why is there a 15-day early payment window for ANNUAL plans?**
Customers need flexibility to pay before the exact anniversary date. The window allows early payment from 15 days before the anniversary, preventing late payment lapses.

**Why is `transactionReference` unique?**
Protects against duplicate payment processing due to network retries. If the same transaction reference is submitted twice, the second request fails.

**Why does a SUCCESS payment immediately set policy to ACTIVE?**
Once the first premium is paid, coverage begins. There's no manual activation step — it's automatic and immediate.

**Why check `totalPremiumPaid + amount > totalRequiredPremium`?**
Prevents overpayment. The total premium over the policy lifetime is `premiumAmount × duration`. The system will not accept payments beyond this cap.

---

## CustomerServiceImpl

**Interface:** `CustomerService`  
**File:** `serviceimpl/CustomerServiceImpl.java`

### Responsibilities

- Creating/completing customer profiles
- Updating customer profile data
- Retrieving customer information (with ownership control)

### Key Business Decisions

**Why is `dateOfBirth` validated for age ≥18?**
Insurance regulations in India require policyholders to be adults. Minors cannot enter insurance contracts.

**Why is the Customer entity created empty at registration?**
Registration and profile completion are two separate steps. A customer can register immediately but fill in profile details later. This improves onboarding UX.

---

## InsuranceProductServiceImpl

**Interface:** `InsuranceProductService`  
**File:** `serviceimpl/InsuranceProductServiceImpl.java`

### Responsibilities

- Product CRUD (Admin only)
- Activate/deactivate products
- Retrieve active products (for plan browsing)

### Key Business Decisions

**Why can't plans be added to inactive products?**
If a product is deactivated, it signals it's no longer offered. New plans under it would be inconsistent.

**Why does deactivation not cascade to existing policies?**
Existing policies are contractual commitments that must be honored. Only NEW policy purchases are blocked when a plan is deactivated.

---

## PolicyPlanServiceImpl

**Interface:** `PolicyPlanService`  
**File:** `serviceimpl/PolicyPlanServiceImpl.java`

### Responsibilities

- Plan CRUD (Admin only)
- Plan activation/deactivation
- Retrieve active plans for customer browsing

### Key Business Decisions

**Why validate `coverageAmount > premiumAmount`?**
The service enforces: `coverageAmount > totalRequiredPremium (premiumAmount × duration)`. If coverage was less than premiums paid, the product provides no value.

**Why can't inactive plans be updated?**
Prevents confusion — if a plan is deactivated, it means it's retired. Modifications should only happen to active, live plans.

---

## UserServiceImpl

**Interface:** `UserService`  
**File:** `serviceimpl/UserServiceImpl.java`

### Responsibilities

- Create staff accounts (Admin only)
- List and retrieve users
- Activate/deactivate user accounts

### Key Business Decisions

**Why can't admins deactivate themselves?**
Self-deactivation would lock the admin out of the system permanently. The service throws 403 if the current user tries to change their own status.

**Why is OTP sent to newly created staff?**
Staff accounts are created by admin but still require email + phone verification before the staff can log in. This ensures the provided contact details are valid.

---

## ClaimDocumentServiceImpl

**Interface:** `ClaimDocumentService`  
**File:** `serviceimpl/ClaimDocumentServiceImpl.java`

### Responsibilities

- Upload files to Cloudinary
- Save document metadata to database
- Associate documents with a claim

### Key Business Decisions

**Why use Cloudinary?**
Cloud storage for documents provides: CDN delivery, reliable storage, Cloudinary-managed deletion, and no server disk space consumption.

**Why save `publicId` separately from `documentReference` (URL)?**
The URL alone is insufficient to delete from Cloudinary. The `publicId` is the Cloudinary-internal identifier needed for deletion APIs.

---

## CloudinaryServiceImpl

**Interface:** `CloudinaryService`  
**File:** `serviceimpl/CloudinaryServiceImpl.java`

### Responsibilities

- Upload files (images/PDFs) to Cloudinary
- Return upload result map containing URL and publicId

---

## How to Add a New Feature to Any Service

When adding new business logic to an existing service:

1. Add the method signature to the **service interface** first
2. Implement in the **serviceimpl** class
3. Use `@Transactional` for any write operations (multiple DB writes)
4. Use `@Transactional(readOnly = true)` for all read-only operations
5. Add all validation BEFORE any database write
6. Use `MessageConstants` for all error and success messages (no hardcoded strings)
7. Read the current user from `SecurityContextHolder.getContext().getAuthentication()`
8. Log the operation at `log.info()` level with relevant identifiers
9. Return `ApiResponseDTO<YourResponseType>`

---

## Common Service Mistakes

| Mistake | Consequence | Fix |
|---|---|---|
| Missing `@Transactional` on write methods | Partial updates not rolled back | Add `@Transactional` |
| Hardcoded string messages | Inconsistent error messages | Use `MessageConstants` |
| Not checking ownership in service | Security breach | Always verify via SecurityContext |
| Not checking staff speciality | Staff acts outside domain | Add speciality check |
| Catching exceptions silently | Errors swallowed | Let `GlobalExceptionHandler` handle |
| Manually setting `createdDate` | Overrides Hibernate auto-stamp | Use `@CreationTimestamp` |

---

## Related Documents

- [controllers/controllers-overview.md](../controllers/controllers-overview.md)
- [repositories/repositories-overview.md](../repositories/repositories-overview.md)
- [exceptions/exception-handling.md](../exceptions/exception-handling.md)

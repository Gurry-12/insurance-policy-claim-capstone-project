# Repositories Overview

## Purpose

This document explains every Spring Data JPA repository — their purpose, custom queries, derived methods, and performance considerations.

---

## Repository Design

All repositories extend:
- `JpaRepository<Entity, Long>` — standard CRUD + pagination
- `JpaSpecificationExecutor<Entity>` (where needed) — dynamic filtering via JPA Specifications

---

## AppUserRepository

**File:** `repository/AppUserRepository.java`  
**Entity:** `AppUser`

### Methods

| Method | Type | Purpose |
|---|---|---|
| `existsByEmail(String)` | Derived | Check email uniqueness on registration |
| `findByEmail(String)` | Derived | Find user for login, lookups |
| `existsByMobileNumber(String)` | Derived | Check phone uniqueness on registration |
| `findByEmailAndIsActiveTrue(String)` | Derived | Load active user only (used by CustomUserDetailsService) |
| `findByRoleIn(List<Role>)` | Derived | Find users by multiple roles |
| `findByRoleNot(Role)` | Derived | Find all non-admin users |
| `findByRoleAndIsActive(Role, Boolean, Pageable)` | Derived | Paginated users by role + active status |
| `findByRole(Role, Pageable)` | JPQL | Paginated users by role |
| `findByIsActive(Boolean, Pageable)` | Derived | Paginated users by active status |
| `findByEmailAndMobileNumber(String, String)` | Derived | Find user by email+phone (for OTP resend) |

### Why `findByEmailAndIsActiveTrue` in UserDetailsService?

When loading a user for JWT validation, we MUST ensure the account is still active. If an admin deactivates a user AFTER the user logged in, their token will be rejected on the next request because `findByEmailAndIsActiveTrue` returns empty.

---

## ClaimRepository

**File:** `repository/ClaimRepository.java`  
**Entity:** `Claim`  
**Extends:** `JpaRepository`, `JpaSpecificationExecutor`

### Methods

| Method | Type | Purpose |
|---|---|---|
| `findByClaimNumber(String)` | Derived | Look up claim by business ID |
| `findByIdAndPolicyCustomerUserId(Long, Long)` | Derived | Security: customer can only see their claim |
| `findByPolicyCustomerUserId(Long)` | Derived + @EntityGraph | Customer's claim list (with eager loading) |
| `findByPolicyId(Long)` | Derived + @EntityGraph | All claims for a policy |
| `findByPolicyCustomerUserId(Long, Pageable)` | Derived + @EntityGraph | Paginated customer claims |
| `findByClaimStatus(ClaimStatus, Pageable)` | Derived + @EntityGraph | Filter by status |
| `findByPolicyCustomerId(Long, Pageable)` | Derived | Claims by customer ID |
| `findByAssignedStaffId(Long, Pageable)` | Derived | Staff's assigned claims |
| `sumActiveClaimsByPolicyId(Long, ClaimStatus)` | JPQL | Sum active claims (coverage check) |

### Custom JPQL Query

```java
@Query("SELECT COALESCE(SUM(c.claimAmount), 0) FROM Claim c 
        WHERE c.policy.id = :policyId AND c.claimStatus != :status")
BigDecimal sumActiveClaimsByPolicyId(
    @Param("policyId") Long policyId, 
    @Param("status") ClaimStatus status);
```

**Why COALESCE?** If no claims exist, SUM returns NULL. COALESCE converts that to 0, preventing NullPointerExceptions when computing remaining coverage.

### @EntityGraph Usage

```java
@EntityGraph(attributePaths = {
    "policy.customer.user",
    "policy.policyPlan.insuranceProduct",
    "assignedStaff"
})
```

**Why?** Without EntityGraph, accessing `claim.getPolicy().getCustomer().getUser().getEmail()` would fire 3 separate SQL queries per claim (N+1 problem). EntityGraph forces a single JOIN query.

---

## PolicyRepository

**File:** `repository/PolicyRepository.java`  
**Entity:** `Policy`  
**Extends:** `JpaRepository`, `JpaSpecificationExecutor`

### Methods

| Method | Type | Purpose |
|---|---|---|
| `existsByPolicyNumber(String)` | Derived | Uniqueness check (though generated UUIDs rarely collide) |
| `findByCustomerId(Long, Pageable)` | Derived | Customer's paginated policies |
| `findByPolicyStatus(PolicyStatus, Pageable)` | Derived | Filter by status |
| `findByCustomerIdAndPolicyStatus(Long, PolicyStatus, Pageable)` | Derived | Combined filter |
| `findByPolicyStatus(PolicyStatus)` | Derived | All policies by status (list) |
| `existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(Long, Long, List<PolicyStatus>)` | Derived | Duplicate policy check |

### Duplicate Policy Check

```java
boolean existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(
    Long customerId,
    Long policyPlanId,
    List<PolicyStatus> statuses
);
```

Used for the health policy uniqueness rule:
```java
// Health: check ACTIVE or PENDING_PAYMENT
policyRepository.existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(
    customer.getId(), plan.getId(), 
    List.of(PolicyStatus.ACTIVE, PolicyStatus.PENDING_PAYMENT));
    
// Others: check only PENDING_PAYMENT
policyRepository.existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(
    customer.getId(), plan.getId(),
    List.of(PolicyStatus.PENDING_PAYMENT));
```

---

## PremiumPaymentRepository

**File:** `repository/PremiumPaymentRepository.java`  
**Entity:** `PremiumPayment`  
**Extends:** `JpaRepository`, `JpaSpecificationExecutor`

### Methods

| Method | Type | Purpose |
|---|---|---|
| `existsByTransactionReference(String)` | Derived | Prevent duplicate transaction |
| `findByPolicyId(Long)` | Derived | All payments for a policy |
| `findByPolicyCustomerUserId(Long)` | Derived | All payments for a customer (my-payments) |
| `findByPolicyIdAndPolicyCustomerUserId(Long, Long)` | Derived | Customer's payments for specific policy |
| `findTopByPolicyIdAndPaymentStatusOrderByPaymentDateDesc(Long, PaymentStatus)` | Derived | Latest SUCCESS payment (for ANNUAL window check) |
| `countByPolicyIdAndPaymentStatus(Long, PaymentStatus)` | Derived | Count SUCCESS payments (for annual limit) |
| `existsByPolicyIdAndPaymentStatus(Long, PaymentStatus)` | Derived | Check if ONE_TIME already paid |

### Annual Payment Window Logic (uses `findTop...`)

```java
Optional<PremiumPayment> latestPayment = paymentRepository
    .findTopByPolicyIdAndPaymentStatusOrderByPaymentDateDesc(
        policy.getId(), PaymentStatus.SUCCESS);

if (latestPayment.isPresent()) {
    LocalDateTime nextEligibleDate = latestPayment.get().getPaymentDate().plusYears(1);
    LocalDateTime paymentWindowStart = nextEligibleDate.minusDays(15);
    
    if (LocalDateTime.now().isBefore(paymentWindowStart)) {
        throw new BadRequestException(EARLY_PAYMENT_RESTRICTION + paymentWindowStart.toLocalDate());
    }
}
```

---

## CustomerRepository

**File:** `repository/CustomerRepository.java`  
**Entity:** `Customer`

### Methods

| Method | Purpose |
|---|---|
| `findByUserEmail(String)` | Find customer profile by user's email |
| `findByUserId(Long)` | Find customer by user ID |

---

## OtpVerificationRepository

**File:** `repository/OtpVerificationRepository.java`  
**Entity:** `OtpVerification`

### Methods

| Method | Purpose |
|---|---|
| `findTopByUserOrderByCreatedAtDesc(AppUser)` | Get latest OTP for a user |
| `getTotalOtpSendsSince(AppUser, LocalDateTime)` | Count OTP sends in last 24h (rate limiting) |

---

## PolicyPlanRepository

**File:** `repository/PolicyPlanRepository.java`  
**Entity:** `PolicyPlan`

### Methods

| Method | Purpose |
|---|---|
| `findByIdAndIsActiveTrue(Long)` | Find active plan (returns empty if deactivated) |
| `findByInsuranceProductIdAndIsActiveTrue(Long)` | Active plans under a specific product |
| `findByIsActiveTrue(Pageable)` | All active plans (paginated) |
| `existsByPlanNameAndInsuranceProductId(String, Long)` | Prevent duplicate plan names |

---

## InsuranceProductRepository

**File:** `repository/InsuranceProductRepository.java`  
**Entity:** `InsuranceProduct`

### Methods

| Method | Purpose |
|---|---|
| `findByProductName(String)` | Check product name uniqueness |
| `findByIsActiveTrue()` | All active products |
| `findByIsActiveTrueAndProductType(ProductType)` | Active products by type |

---

## ClaimStatusHistoryRepository

**File:** `repository/ClaimStatusHistoryRepository.java`  
**Entity:** `ClaimStatusHistory`

### Methods

| Method | Purpose |
|---|---|
| `findByClaimId(Long, Pageable)` | History for a claim (paginated) |
| `findByClaimIdAndUpdatedByContainingIgnoreCase(Long, String, Pageable)` | Filter by who updated |
| `findByClaimIdAndNewStatus(Long, String, Pageable)` | Filter by new status value |
| `findByClaimIdAndUpdatedByContainingIgnoreCaseAndNewStatus(Long, String, String, Pageable)` | Combined filter |

---

## ClaimDocumentRepository

**File:** `repository/ClaimDocumentRepository.java`  
**Entity:** `ClaimDocument`

### Methods

| Method | Purpose |
|---|---|
| `findByClaimId(Long)` | All documents for a claim |

---

## StaffSpecialityRepository

**File:** `repository/StaffSpecialityRepository.java`  
**Entity:** `StaffSpeciality`

Standard JPA methods only (findById, save, etc.)

---

## Performance Considerations

### When to use @EntityGraph vs @Transactional

- `@EntityGraph` → when you know upfront which associations you'll access
- `@Transactional` on service → when you need lazy loading within the session

### Avoiding N+1

The most common N+1 in this system:
```
// ClaimServiceImpl.getMyClaims():
// Without EntityGraph, this fires 3 queries per claim:
claims.stream().map(c -> c.getPolicy().getCustomer().getUser().getFullName())
```

**Fix:** `@EntityGraph` on `findByPolicyCustomerUserId` eagerly joins everything.

### JpaSpecificationExecutor for Dynamic Filters

Used in `ClaimRepository`, `PolicyRepository`, `PremiumPaymentRepository`, `AppUserRepository`.

Example — adding a new filter to claims pagination:
```java
if (incidentDateFrom != null) {
    spec = spec.and((root, query, cb) ->
        cb.greaterThanOrEqualTo(root.get("incidentDate"), incidentDateFrom.atStartOfDay()));
}
```

This is type-safe, composable, and avoids string concatenation SQL.

---

## Common Repository Mistakes

1. **Do NOT add business logic in repositories** — they are pure data access
2. **Do NOT use `@Transactional` in repositories** — manage transactions in services
3. **Do NOT add `deleteAll()` for audit tables** (`ClaimStatusHistory`) — these are append-only
4. **Do NOT ignore `@EntityGraph`** — missing it causes N+1 in list endpoints
5. **Always use `Optional` return types** for single-entity lookups

---

## Related Documents

- [entities/entities-overview.md](../entities/entities-overview.md)
- [database/database-overview.md](../database/database-overview.md)
- [services/services-overview.md](../services/services-overview.md)

# Best Practices & Guidelines

## Purpose

This document outlines the coding standards, design patterns, and architectural rules to follow when contributing to this project. Adhering to these rules ensures consistency, security, and maintainability.

---

## 1. Constants over Magic Strings

**Rule:** Never use hardcoded strings for error messages, success messages, or status codes.

**Why:** It creates a maintenance nightmare and makes debugging harder.

**Do this:**
```java
throw new BadRequestException(MessageConstants.Auth.OTP_LIMIT_EXCEEDED);
```
**Don't do this:**
```java
throw new BadRequestException("You have reached the maximum limit of 4 OTP requests.");
```

Always add new messages to the `util.MessageConstants` class.

---

## 2. Validation Belongs in DTOs

**Rule:** Use `@Valid` and Jakarta validation annotations (`@NotBlank`, `@NotNull`, `@Pattern`, `@Size`) on Request DTOs. 

**Why:** Fail fast. Invalid data should be rejected at the controller boundary before hitting the service layer.

**Do this:**
```java
public class CustomerRequestDTO {
    @Past(message = MessageConstants.Validation.DOB_PAST)
    private LocalDate dateOfBirth;
}
```
**Don't do this:**
```java
// Inside Service
if (dto.getDateOfBirth().isAfter(LocalDate.now())) {
    throw new BadRequestException("Date of birth must be in the past");
}
```

---

## 3. The Controller Rule

**Rule:** Controllers must be thin. No business logic, no `SecurityContext` parsing, no complex entity mapping.

**Why:** Keeps concerns separated. Services are easier to test than controllers.

**Do this:**
```java
@PostMapping("/issue")
public ApiResponseDTO<PolicyResponseDTO> issuePolicy(@Valid @RequestBody PolicyIssueRequestDTO dto) {
    return policyService.issuePolicy(dto);
}
```

---

## 4. Transaction Boundaries

**Rule:** Any service method that modifies data (save, update, delete) must be annotated with `@Transactional`.

**Rule:** Any service method that only reads data should use `@Transactional(readOnly = true)`.

**Why:** Ensures atomic operations. If a method writes to two repositories and the second fails, the first write will roll back. Read-only transactions offer performance benefits.

---

## 5. Null Checks and `Optional`

**Rule:** When a repository returns an `Optional`, handle it cleanly with `.orElseThrow()`.

**Do this:**
```java
Policy policy = policyRepository.findById(policyId)
    .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Policy.NOT_FOUND + policyId));
```

**Don't do this:**
```java
Optional<Policy> opt = policyRepository.findById(policyId);
if (!opt.isPresent()) {
    throw new RuntimeException("Not found");
}
Policy policy = opt.get();
```

---

## 6. Access Control and Ownership

**Rule:** Just because a user has the correct `@Role`, does NOT mean they own the data. Always check ownership.

**Why:** A user with `ROLE_CUSTOMER` should only view their own claims, not another customer's claims.

**Do this (in Service):**
```java
String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
if (!claim.getPolicy().getCustomer().getUser().getEmail().equals(currentUserEmail)) {
    throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_CLAIM);
}
```

---

## 7. Audit Immutability

**Rule:** The `ClaimStatusHistory` table is an immutable ledger. Never update or delete rows.

**Why:** Audit trails must be permanent. Append-only logic guarantees traceability.

---

## 8. BigDecimal for Money

**Rule:** Always use `java.math.BigDecimal` for any monetary fields (premiums, coverage, claim amounts).

**Why:** `double` and `float` lose precision and cause rounding errors which are unacceptable in financial/insurance systems.

**Do this:**
```java
private BigDecimal premiumAmount;
// ...
if (totalPremiumPaid.compareTo(requiredPremium) > 0) { ... }
```

---

## 9. Password Hashing

**Rule:** Passwords must be hashed with BCrypt before being stored in the database.

**Why:** To ensure that plaintext passwords are never stored.
```java
user.setPassword(passwordEncoder.encode(dto.getPassword()));
```

---

## 10. Avoid N+1 Query Problems

**Rule:** When fetching lists of entities that require accessing their relationships, use `@EntityGraph` in the repository.

**Why:** Without it, accessing lazy relationships in a loop generates 1+N database queries, tanking performance.

**Do this:**
```java
@EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
List<Claim> findByPolicyCustomerUserId(Long customerUserId);
```

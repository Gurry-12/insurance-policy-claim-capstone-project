# Transactions

## What It Is
- Declarative transaction management via `@Transactional` on service methods. A transaction wraps a business operation so it either commits fully or rolls back.
- By default a transaction rolls back on runtime exceptions; `rollbackFor = Exception.class` widens that to checked exceptions.
- Read-only queries are marked `@Transactional(readOnly = true)`.
- `RefreshTokenService` uses `TransactionTemplate` with `PROPAGATION_REQUIRES_NEW` for atomic token rotation and family revocation.

## Why It Is Used
- Guarantees atomicity of multi-step operations, e.g. "create policy and mark quote USED" or "record payment and activate policy".
- Prevents partial writes that would leave inconsistent business state (e.g., a paid policy still `PENDING_PAYMENT`).
- `readOnly=true` hints allow JPA/Hibernate to skip dirty checking on read paths.

## Where It Is Used in This Project
- `serviceimpl/PolicyServiceImpl.java`: `purchasePolicy`, `issuePolicy`, `cancelPolicy` are `@Transactional(rollbackFor = Exception.class)`.
- `serviceimpl/PremiumPaymentServiceImpl.java`: `recordPayment` is transactional; queries use `readOnly = true`.
- `serviceimpl/ClaimServiceImpl.java`: `raiseClaim`, `reviewClaim`, `finalDecision`, `underReviewClaim`, `assignStaff` are transactional.
- `serviceimpl/AuthServiceImpl.java`: `registerUser` and `resetPassword` are transactional (user + customer creation, OTP + token-version bump).
- `security/RefreshTokenService.java`: `rotate` uses `TransactionTemplate` with `REQUIRES_NEW` so the conditional update claim (`revokeAndMarkReplaced`) commits independently and avoids a self-deadlock.
- `config/RefreshTokenCleanupScheduler.java`: purges stale tokens transactionally.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumPaymentServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/RefreshTokenService.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimServiceImpl.java

## Related Docs
- ../06_Backend/Services.md
- ../04_Database/Constraints.md
- ../06_Backend/Exception_Handling.md

## Common Interview Questions
1. Why is `rollbackFor = Exception.class` used? — So checked exceptions also roll back the transaction, keeping business operations all-or-nothing.
2. What is the point of `readOnly = true`? — It marks read-only operations so Hibernate can skip flush/dirty checking and the transaction does not need to acquire write locks.
3. Why does refresh-token rotation use `REQUIRES_NEW`? — The atomic claim must commit on its own so a losing concurrent request can then revoke the session family without deadlocking on its own held row lock.
4. What happens if the transaction rolls back after a failed `recordPayment`? — The payment row, policy status change, and premium-amount update are all undone together.
5. How do transactions interact with the `@Version` optimistic lock? — On commit Hibernate verifies the version; a concurrent modification raises `ObjectOptimisticLockingFailureException`, mapped to HTTP 409.

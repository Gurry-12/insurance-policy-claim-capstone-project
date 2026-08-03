# Payment

## What It Is
- The `PremiumPayment` entity records a premium payment against a policy: `amount`, `paymentDate`, `paymentMode`, unique `transactionReference`, and `paymentStatus`.
- Enums: `PaymentMode` {UPI, CARD, NET_BANKING, CASH} and `PaymentStatus` {PENDING, SUCCESS, FAILED}.
- A `SUCCESS` payment adds the amount to the policy's `totalPremiumPaid` and activates the policy (`PENDING_PAYMENT` → `ACTIVE`).

## Why It Is Used
- Tracks the customer's premium obligations over the policy lifetime.
- Enforces payment business rules: exact amount, no over-payment, renewal windows for ANNUAL policies, single payment for ONE_TIME policies.
- Produces an auditable, unique transaction reference per payment.

## Where It Is Used in This Project
- `serviceimpl/PremiumPaymentServiceImpl.java` `recordPayment`:
  - Amount must exactly equal `policy.calculatedPremium`.
  - Payments blocked on `CANCELLED` or `EXPIRED` policies.
  - ONE_TIME: only one `SUCCESS` payment allowed per policy.
  - ANNUAL: no payment before the next-year window (15-day early window); total `SUCCESS` payments cannot exceed `policyDuration`; cumulative paid + amount cannot exceed `calculatedPremium × duration`.
  - Customer may pay only their own policy; staff must match the policy's product speciality.
- `model/PremiumPayment.java`; `enums/PaymentMode.java`, `enums/PaymentStatus.java`.
- `util/TransactionReferenceGenerator.java`: unique references.
- `repository/PremiumPaymentRepository.java`: success-count and latest-payment queries.
- `controller/PremiumPaymentController.java`: `/api/payments` endpoints; `SecurityConfig` allows customers and staff to record.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumPaymentServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/PremiumPayment.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/util/TransactionReferenceGenerator.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/PaymentStatus.java

## Related Docs
- ../02_Business_Domain/Payment_Workflow.md
- ../02_Business_Domain/Business_Rules.md
- ../03_API/Payment_API.md
- ../04_Database/Table_Descriptions.md

## Common Interview Questions
1. How is the payment amount validated? — It must exactly equal the policy's `calculatedPremium`; anything else throws `AMOUNT_MISMATCH`.
2. What is the rule for ONE_TIME policies? — Only one `SUCCESS` payment may exist for the policy; a second is rejected.
3. How do ANNUAL renewals work? — A renewal cannot be paid before 15 days prior to the next due date; total successful payments cannot exceed the policy duration.
4. How does payment activate a policy? — On `SUCCESS`, `totalPremiumPaid` increases and `policyStatus` is set to `ACTIVE`.
5. Why a unique transaction reference? — It makes every payment idempotent and traceable; duplicates throw `DUPLICATE_REFERENCE`.

# Policy

## What It Is
- The insured contract issued to a customer for a plan. The `Policy` entity carries a full pricing snapshot (coverage, premium type, duration, rates, fees, GST, calculated premium, plan version, pricing rule id) plus `startDate`, `endDate`, `policyStatus`, and `totalPremiumPaid`.
- Statuses (`PolicyStatus`): `PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `CANCELLED`.
- A policy starts `PENDING_PAYMENT` and becomes `ACTIVE` when a successful payment is recorded. It uses a `@Version` field for optimistic locking.

## Why It Is Used
- It is the core insured asset: all claims and payments attach to a policy.
- The pricing snapshot keeps the issued terms immutable even if plans or rates change later.
- Business rules (duplicate policies, claims only on ACTIVE policies, cancellation restrictions) are enforced around this entity.

## Where It Is Used in This Project
- `model/Policy.java`: entity with pricing snapshot, `@Version`, and collections of `payments` and `claims`.
- `serviceimpl/PolicyServiceImpl.java`: `purchasePolicy` (customer), `issuePolicy` (staff/admin), `cancelPolicy`; enforces complete customer profile, quote validation, duplicate-policy rules, and blocks cancellation while open claims exist.
- Duplicate rules: HEALTH products allow no duplicate `ACTIVE` or `PENDING_PAYMENT` policy per customer+plan; non-HEALTH products allow no duplicate `PENDING_PAYMENT`.
- `serviceimpl/PremiumPaymentServiceImpl.java`: a `SUCCESS` payment adds `totalPremiumPaid` and sets the policy to `ACTIVE`.
- `util/PolicyNumberGenerator.java`: unique policy numbers.
- `repository/PolicyRepository.java`: policy queries including `sumActiveClaimsByPolicyId` for remaining-cover calculations.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Policy.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumPaymentServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/util/PolicyNumberGenerator.java

## Related Docs
- ../02_Business_Domain/Policy_Workflow.md
- ../02_Business_Domain/Business_Rules.md
- ../03_API/Policy_API.md
- ../04_Database/Entity_Relationships.md

## Common Interview Questions
1. What is the policy status flow? — Policies are created `PENDING_PAYMENT`, become `ACTIVE` on a successful payment, and can later be `CANCELLED` or `EXPIRED` (by end date or rules).
2. Why does a policy store a pricing snapshot? — So coverage, premium, rates, plan version, and pricing rule are frozen at issue time and cannot be altered by later catalog changes.
3. What are the duplicate-policy rules? — For HEALTH, no duplicate ACTIVE or PENDING_PAYMENT policy per customer+plan; for other products, no duplicate PENDING_PAYMENT per customer+plan.
4. When is cancellation blocked? — While any open claim exists (`SUBMITTED`, `UNDER_REVIEW`, `RECOMMENDED_FOR_APPROVAL`, `RECOMMENDED_FOR_REJECTION`) or if the policy is already `CANCELLED`/`EXPIRED`.
5. What does the `@Version` field protect? — Concurrent updates to the same policy (e.g., two payments) fail one of the writers, surfaced as HTTP 409.

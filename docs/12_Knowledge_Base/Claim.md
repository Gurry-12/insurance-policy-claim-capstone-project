# Claim

## What It Is
- A customer's request for payout under a policy. The `Claim` entity holds `claimNumber`, `claimAmount`, `claimReason`, `incidentDate`, `claimStatus`, assigned staff, staff/admin remarks, and collections of documents and status history.
- Statuses (`ClaimStatus`): `SUBMITTED`, `UNDER_REVIEW`, `RECOMMENDED_FOR_APPROVAL`, `RECOMMENDED_FOR_REJECTION`, `APPROVED`, `REJECTED`.
- Every status change is recorded in `ClaimStatusHistory`, and the entity uses `@Version` for optimistic locking.

## Why It Is Used
- Structured adjudication: customer submits, staff reviews (matching their product speciality), admin makes the final decision.
- Enforces the business rules that make claims payable (active policy, incident within policy period, amount within remaining cover, documents present).
- The audit history provides traceability for compliance and customer communication.

## Where It Is Used in This Project
- `model/Claim.java` + `model/ClaimStatusHistory.java`: entities and relationships.
- `serviceimpl/ClaimServiceImpl.java`:
  - `raiseClaim`: policy must be ACTIVE and owned; incident date within `startDate`..`endDate`; amount ≤ remaining cover (`selectedCoverage` minus sum of active claims); at least one document; status `SUBMITTED`.
  - `underReviewClaim` / `assignStaff`: staff transitions `SUBMITTED` → `UNDER_REVIEW` and self-assigns (speciality-scoped).
  - `reviewClaim`: assigned staff recommends `RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION` with remarks.
  - `finalDecision`: admin approves or rejects.
  - `getClaimHistory`: paginated status-history endpoint.
- `enums/ClaimStatus.java`; `util/ClaimNumberGenerator.java`; `repository/ClaimRepository.java` (`sumActiveClaimsByPolicyId`).
- `controller/ClaimController.java`: `/api/claims` endpoints.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Claim.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/ClaimStatusHistory.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/ClaimStatus.java

## Related Docs
- ../02_Business_Domain/Claim_Workflow.md
- ../02_Business_Domain/Business_Rules.md
- ../03_API/Claim_API.md
- ../04_Database/Entity_Relationships.md

## Common Interview Questions
1. What is the full claim status flow? — `SUBMITTED` → `UNDER_REVIEW` → `RECOMMENDED_FOR_APPROVAL`/`RECOMMENDED_FOR_REJECTION` → `APPROVED`/`REJECTED` (admin final).
2. What rules are checked when a claim is raised? — Policy must be ACTIVE and owned, incident date inside the policy period, amount ≤ remaining cover, and at least one document uploaded.
3. How is remaining cover computed? — `selectedCoverage` minus the sum of active (non-rejected) claims for the policy (`sumActiveClaimsByPolicyId`).
4. Who can review and who decides? — Internal staff review only claims matching their `productSpeciality` (and they must be the assigned reviewer); only admin records the final decision.
5. Why is every transition recorded? — `ClaimStatusHistory` stores previous/new status, remarks, and the acting user for a full audit trail.

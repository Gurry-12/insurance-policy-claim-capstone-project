# Authorization

## What It Is
- The process of deciding what an already-authenticated identity is allowed to do. It is enforced in three layers: URL rules, service-layer data checks, and method-level authority checks.
- URL rules are declared in `SecurityConfig.authorizeHttpRequests` using `hasRole` / `hasAnyRole` and `authenticated()`.
- Service-layer checks enforce ownership (a customer may only read their own records) and scope (staff may only work within their `productSpeciality`).
- Failures surface as `AccessDeniedException`, mapped to HTTP 403 by the `GlobalExceptionHandler`.

## Why It Is Used
- Defense in depth: even if a URL rule is missed, the service layer still enforces data-level authorization.
- Role separation of duties (customer self-service, staff review, admin final decision) is enforced at both the endpoint and business-rule level.
- Keeps business rules (e.g., "staff only review claims matching their speciality") close to the data they protect.

## Where It Is Used in This Project
- `config/SecurityConfig.java`: role-gated matchers for plans, policies, claims, documents, customers, products, payments, and `/api/admin/**`; everything else requires authentication.
- `serviceimpl/PolicyServiceImpl.java`: ownership check for customers, speciality check for staff on view/issue/cancel.
- `serviceimpl/PremiumPaymentServiceImpl.java`: customers may only pay/record on their own policies; staff restricted to their speciality.
- `serviceimpl/ClaimServiceImpl.java`: customers see own claims; staff must match speciality and be the assigned reviewer for `reviewClaim`; admin only for `finalDecision`.
- `exception/GlobalExceptionHandler.java`: `AccessDeniedException` and `AuthenticationException` handlers return 403 / 401.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityConfig.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/GlobalExceptionHandler.java

## Related Docs
- ../01_System_Architecture/Security_Architecture.md
- ../06_Backend/Security.md
- ../02_Business_Domain/Business_Rules.md
- ../06_Backend/Exception_Handling.md

## Common Interview Questions
1. How is endpoint-level authorization declared? — With `authorizeHttpRequests` matchers in `SecurityConfig`, using `hasRole` / `hasAnyRole` on the `ROLE_*` authorities.
2. Why is authorization also checked inside services? — URL rules cannot express data ownership or speciality scope, so services verify "is this record the caller's" and "does the caller's speciality match".
3. What response does a denied request get? — `AccessDeniedException` is mapped by the `GlobalExceptionHandler` to HTTP 403 with a structured `ErrorResponseDTO`.
4. How does a customer's scope differ from staff scope? — Customers are limited to their own policies/claims/payments; staff are limited by `productSpeciality` to matching product types.
5. Where is the admin final claim decision enforced? — In `SecurityConfig` (`PATCH /api/claims/*/final-decision` → `ROLE_ADMIN`) and again in `ClaimServiceImpl.finalDecision`.

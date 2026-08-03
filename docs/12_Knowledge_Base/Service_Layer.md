# Service Layer

## What It Is
- The middle layer between controllers and repositories, split into interface (`service/*.java`) and implementation (`serviceimpl/*.java`).
- Owns business rules, transaction boundaries, authorization checks, and orchestration across repositories and external services.
- Controllers remain thin: they parse HTTP input and delegate to a service interface.

## Why It Is Used
- Keeps business logic in one place and out of controllers/entities.
- Interface + implementation split supports testing (mock the interface) and future implementation changes.
- Transactions (`@Transactional`) are applied at the service method level, which is the correct boundary for multi-entity operations.

## Where It Is Used in This Project
- `service/AuthService.java` + `serviceimpl/AuthServiceImpl.java`: registration, login, OTP, password reset, refresh, logout.
- `service/PolicyService.java` + `serviceimpl/PolicyServiceImpl.java`: purchase/issue/cancel, duplicate-policy rules, pricing snapshot, pagination.
- `service/ClaimService.java` + `serviceimpl/ClaimServiceImpl.java`: claim lifecycle and adjudication rules, history recording.
- `service/PremiumPaymentService.java` + `serviceimpl/PremiumPaymentServiceImpl.java`: payment validation and policy activation.
- `service/PremiumCalculationService.java` + `serviceimpl/PremiumCalculationServiceImpl.java`: quote generation using the strategy calculators.
- `service/ClaimDocumentService.java` + `serviceimpl/ClaimDocumentServiceImpl.java`: document validation, upload, metadata persistence.
- Also: `UserService`, `CustomerService`, `InsuranceProductService`, `PolicyPlanService`, `CoverageOptionService`, `PricingRuleService`, `PublicService`, `CloudinaryService`.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/PolicyService.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/ClaimService.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimServiceImpl.java

## Related Docs
- ../06_Backend/Services.md
- ../01_System_Architecture/Backend_Architecture.md
- ../06_Backend/Package_Structure.md

## Common Interview Questions
1. What belongs in the service layer? — Business rules, transaction boundaries, authorization checks, and orchestration of repositories/external services; controllers should not contain business logic.
2. Why interface + implementation? — It decouples callers from implementation details, simplifies mocking in tests, and permits swapping implementations.
3. Where do transactions get applied? — On service methods via `@Transactional`; this is the right scope because a business operation spans multiple entities/repositories.
4. Give an example of a business rule enforced here — `purchasePolicy` rejects duplicate HEALTH policies (ACTIVE or PENDING_PAYMENT) per customer+plan and marks the quote USED.
5. How do services protect data beyond URL rules? — They check ownership (customer's own records) and staff `productSpeciality` scope before performing any operation.

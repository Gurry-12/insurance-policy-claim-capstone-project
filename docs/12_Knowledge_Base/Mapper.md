# Mapper

## What It Is
- The component that converts between entities and DTOs. The project uses **ModelMapper 3.2.0** for automatic bean-to-bean mapping.
- Services inject a `ModelMapper` bean and call `modelMapper.map(source, TargetClass.class)`.
- Where the DTO shape diverges from the entity (flattened or computed fields), services use explicit manual conversion methods instead.

## Why It Is Used
- Eliminates repetitive getter/setter boilerplate for conventional field-by-field mapping.
- Keeps conversion logic in the service layer, close to the business logic that needs the resulting DTO.
- Manual overrides remain available for fields ModelMapper cannot derive (nested `policyNumber`, `customerName`, remaining amounts).

## Where It Is Used in This Project
- `serviceimpl/AuthServiceImpl.java`: maps `UserRequestDTO` → `AppUser`, `AppUser` → `UserResponseDTO`.
- `serviceimpl/PolicyServiceImpl.java`: `modelMapper.map(policy, PolicyResponseDTO.class)` inside `convertToResponseDTO`, then explicit setters for `policyId`, `customerId`, `remainingClaimAmount`, `customerName`, `planId`, `planName`, `productType`.
- `serviceimpl/PremiumPaymentServiceImpl.java`: maps `PremiumPayment` → `PaymentResponseDTO` and sets `policyNumber` manually.
- `serviceimpl/ClaimDocumentServiceImpl.java` and `ClaimServiceImpl.java`: maps documents and claims to response DTOs.
- `dto/PremiumQuote.java`: built by the strategy calculators with a Lombok builder (no ModelMapper).

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/AuthServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumPaymentServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimServiceImpl.java

## Related Docs
- ../06_Backend/DTOs.md
- ../06_Backend/Services.md
- ../07_Design_Patterns/Design_Patterns.md

## Common Interview Questions
1. Why ModelMapper instead of hand-written mapping? — It reduces boilerplate; the library matches fields by name and type and handles the common cases in one line.
2. When is manual mapping preferred? — When the DTO carries computed or flattened fields, such as `remainingClaimAmount` (derived from active claims) or `policyNumber` (read from the parent policy).
3. What are the risks of ModelMapper? — Reflection-based mapping can trigger lazy-loading (N+1), and ambiguous or unmatched fields can silently produce nulls unless handled explicitly.
4. Where does mapping happen in the architecture? — In the service layer (`serviceimpl/*.java`), not in controllers, keeping controllers thin.
5. Could MapStruct be used instead? — Yes, as a compile-time alternative; ModelMapper was chosen for its convention-based, zero-annotation mapping.

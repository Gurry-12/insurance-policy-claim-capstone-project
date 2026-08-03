# Validation

## What It Is
- Declarative input validation using the Jakarta Bean Validation API (`jakarta.validation` annotations) on request DTOs and entities.
- Triggered at the controller boundary by `@Valid` on `@RequestBody` parameters.
- Violations are collected centrally by the `GlobalExceptionHandler` into a `ValidationErrorResponseDTO` (HTTP 400 with per-field messages).
- Business-rule validation (not expressible as annotations) runs in the service layer and throws `BadRequestException` or `ResourceNotFoundException`.

## Why It Is Used
- Fails fast at the API boundary, keeping invalid data out of services and the database.
- Produces a consistent, machine-readable error contract (field name → message) for the React frontend.
- Complements DB constraints with early, friendly messages.

## Where It Is Used in This Project
- `dto/request/UserRequestDTO.java`: `@NotBlank`, `@Email`, `@Pattern` (letters-only names, password `^(?=.*[A-Za-z])(?=.*\d).{8,64}$`, mobile `^\+[1-9]\d{7,14}$`), `@Size`.
- `dto/request/ClaimRequestDTO.java`: `@NotNull`, `@Positive` on `claimAmount`; `@NotNull` on `policyId` and `incidentDate`; `@NotBlank` on `claimReason`.
- `dto/request/PaymentRequestDTO.java` and others: similar `@NotNull` / `@Positive` constraints.
- Entities also carry constraints (e.g., `Quote` `@PositiveOrZero`, `AppUser` name/email patterns).
- `exception/GlobalExceptionHandler.java`: `handleValidation` for `MethodArgumentNotValidException`; `handleBadRequest`, `handleTypeMismatch`, `handleInvalidJson` for other malformed input.
- Services: `PaginationValidator.validate(...)` for page/sort parameters; `PaginationValidator.validateSortField` whitelists sort columns.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/UserRequestDTO.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/ClaimRequestDTO.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/GlobalExceptionHandler.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/util/PaginationValidator.java

## Related Docs
- ../06_Backend/Validation.md
- ../06_Backend/Exception_Handling.md
- ../03_API/API_Flow.md

## Common Interview Questions
1. What is the difference between `@NotNull`, `@NotBlank`, and `@NotEmpty`? — `@NotNull` rejects null; `@NotBlank` rejects null/empty/whitespace-only strings; `@NotEmpty` rejects null/empty collections and strings.
2. Where is `@Valid` applied? — On controller `@RequestBody` parameters; the framework throws `MethodArgumentNotValidException` on failure.
3. How are field errors returned to the client? — `GlobalExceptionHandler.handleValidation` builds a `ValidationErrorResponseDTO` with a `fieldErrors` map, status 400.
4. Is validation enough to protect the API? — No; annotations handle shape, while the service layer enforces business rules (quote validity, premium amount match, ownership) and the DB adds constraints.
5. How is pagination validated? — `PaginationValidator` checks page/size bounds and whitelists allowed sort fields to prevent unsafe sorting.

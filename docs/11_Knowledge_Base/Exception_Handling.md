# Exception Handling

## What It Is
- A centralized exception-handling strategy: services throw typed runtime exceptions; `GlobalExceptionHandler` (annotated `@RestControllerAdvice`) converts them into structured HTTP responses.
- Two standard error payloads: `ErrorResponseDTO` (timestamp, statusCode, errorType, message, requestPath) and `ValidationErrorResponseDTO` (adds a field-errors map).
- Custom exceptions live in the `exception` package; framework exceptions (Spring Security, validation, JSON, optimistic-lock) are mapped explicitly.

## Why It Is Used
- Consistent API error contract for the frontend instead of ad-hoc messages or stack traces.
- Correct HTTP semantics (400/401/403/404/409/500) for each failure class.
- Hides internal details (SQL, class names) behind safe, user-oriented messages.

## Where It Is Used in This Project
- `exception/GlobalExceptionHandler.java`: handlers for `ResourceNotFoundException` (404), `DuplicateResourceException` (409), `BadRequestException` (400), `IllegalArgumentException` (400), `PlanNotActiveException` (400), `MethodArgumentNotValidException` (400 + field map), `MethodArgumentTypeMismatchException` (400), `HttpMessageNotReadableException` (400), `DataIntegrityViolationException` (409), optimistic-lock `ObjectOptimisticLockingFailureException` / `StaleObjectStateException` (409), `RefreshTokenException` (401), `AccessDeniedException` (403), `BadCredentialsException` (401), generic `AuthenticationException` (401), and a catch-all `Exception` (500).
- Custom exceptions: `ResourceNotFoundException`, `DuplicateResourceException`, `BadRequestException`, `PolicyNotFoundException`, `ProductNotFoundException`, `PlanNotActiveException`, `RefreshTokenException`.
- `dto/response/ErrorResponseDTO.java`, `ValidationErrorResponseDTO.java`: response bodies.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/GlobalExceptionHandler.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/BadRequestException.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/ErrorResponseDTO.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/ValidationErrorResponseDTO.java

## Related Docs
- ../06_Backend/Exception_Handling.md
- ../06_Backend/Validation.md
- ../03_API/API_Flow.md

## Common Interview Questions
1. What does `@RestControllerAdvice` do? — It applies `@ExceptionHandler` methods globally to all controllers, centralizing exception-to-response conversion.
2. How are 401 and 403 distinguished? — `RefreshTokenException`, `BadCredentialsException`, and `AuthenticationException` map to 401 (unauthenticated); `AccessDeniedException` maps to 403 (authenticated but not permitted).
3. How is a concurrent-edit conflict handled? — Optimistic-lock exceptions map to HTTP 409 `CONFLICT_RECORD_MODIFIED`, telling the client the record changed since read.
4. How are bean-validation failures returned? — `MethodArgumentNotValidException` produces a `ValidationErrorResponseDTO` with a `fieldErrors` map and status 400.
5. Why mask the generic `Exception` handler? — To avoid leaking stack traces and internal details; the client receives a safe 500 message while the server logs the full error.

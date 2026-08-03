# Exception Handling

## Purpose

This document is the single source of truth for error handling: the custom exception types, the `GlobalExceptionHandler` mapping to HTTP status codes, and the shape of error responses. Validation error aggregation (the `fieldErrors` map) is also defined here because it is produced by the same handler.

## Overview

Business and technical failures are represented by a small set of domain exceptions in `com.insurance.demo.exception`. `GlobalExceptionHandler`, annotated `@RestControllerAdvice`, converts every exception into a uniform `ErrorResponseDTO` (or `ValidationErrorResponseDTO` for bean-validation failures). Services throw domain exceptions; they never build HTTP responses.

## Business Context

A predictable error contract matters for the front end: every error response carries a timestamp, an HTTP status code, an error type, a user-facing message, and the request path. By centralizing conversion, the API guarantees that business-rule rejections (for example an inactive plan or a reused refresh token) surface consistently instead of leaking framework-level stack traces. The four response shapes are fixed and documented in the API flow.

## Technical Design

### Custom exception classes

| Exception | Purpose | Raised for |
| --- | --- | --- |
| `ResourceNotFoundException` | Generic missing resource | Missing user, customer, plan, policy, claim, etc. |
| `ProductNotFoundException` | Missing product | Product lookups |
| `PolicyNotFoundException` | Missing policy | Policy lookups and lifecycle operations |
| `PlanNotActiveException` | Inactive plan | Quote/calculation/purchase against a non-active plan |
| `BadRequestException` | Invalid operation | Business-rule violations and bad payload semantics |
| `DuplicateResourceException` | Uniqueness conflict | Existing email, mobile, plan, or product |
| `RefreshTokenException` | Token rejection | Refresh-token reuse, expiry, or family revocation |

`PlanNotActiveException` and `RefreshTokenException` carry dedicated `errorType` strings; all other domain exceptions use the HTTP status name as `errorType`.

### Handler-to-HTTP mapping

| Exception | HTTP status | Error type | Message |
| --- | --- | --- | --- |
| `ResourceNotFoundException` | 404 NOT_FOUND | `NOT_FOUND` | Exception message |
| `ProductNotFoundException` | 404 NOT_FOUND | `NOT_FOUND` | Exception message |
| `PolicyNotFoundException` | 404 NOT_FOUND | `NOT_FOUND` | Exception message |
| `DuplicateResourceException` | 409 CONFLICT | `CONFLICT` | Exception message |
| `BadRequestException` | 400 BAD_REQUEST | `BAD_REQUEST` | Exception message |
| `IllegalArgumentException` | 400 BAD_REQUEST | `BAD_REQUEST` | Exception message |
| `PlanNotActiveException` | 400 BAD_REQUEST | `PLAN_NOT_ACTIVE` | Exception message |
| `MethodArgumentNotValidException` | 400 BAD_REQUEST | `VALIDATION_FAILED` | Generic validation message; `fieldErrors` map per field |
| `MethodArgumentTypeMismatchException` | 400 BAD_REQUEST | `BAD_REQUEST` | Invalid-input message |
| `HttpMessageNotReadableException` | 400 BAD_REQUEST | `BAD_REQUEST` | Invalid JSON body message |
| `ObjectOptimisticLockingFailureException` / `StaleObjectStateException` | 409 CONFLICT | `CONFLICT` | Record-modified conflict message |
| `DataIntegrityViolationException` | 409 CONFLICT | `CONFLICT` | DB constraint violation message |
| `RefreshTokenException` | 401 UNAUTHORIZED | `INVALID_REFRESH_TOKEN` | Exception message |
| `AccessDeniedException` | 403 FORBIDDEN | `FORBIDDEN` | Exception message |
| `BadCredentialsException` | 401 UNAUTHORIZED | `UNAUTHORIZED` | Invalid-credentials message |
| `AuthenticationException` | 401 UNAUTHORIZED | `UNAUTHORIZED` | Unauthorized message |
| `Exception` (catch-all) | 500 INTERNAL_SERVER_ERROR | `INTERNAL_SERVER_ERROR` | Generic server error message |

### Validation error aggregation

`MethodArgumentNotValidException` is the only case producing `ValidationErrorResponseDTO`. The handler iterates `bindingResult.getFieldErrors()` in declaration order (a `LinkedHashMap`) and builds a `fieldErrors` map keyed by field name with the DTO's validation message as the value. Nested DTOs (for example `planDetails` inside `PlanWizardRequestDTO`) surface as dotted field names.

### Error response body

`ErrorResponseDTO`:

| Field | Type | Description |
| --- | --- | --- |
| `timestamp` | `LocalDateTime` | When the error occurred |
| `statusCode` | `int` | HTTP status code |
| `errorType` | `String` | Machine-readable error category |
| `message` | `String` | User-facing message |
| `requestPath` | `String` | The request URI that failed |

`ValidationErrorResponseDTO` extends this shape with `fieldErrors` (`Map<String, String>`).

## Workflow

1. A service detects an invalid state and throws a domain exception.
2. `GlobalExceptionHandler` matches the exception to its handler method.
3. The handler builds the `ErrorResponseDTO` (or `ValidationErrorResponseDTO`) using `MessageConstants` messages where framework messages would be noisy.
4. The client receives a deterministic HTTP status and structured body regardless of failure origin.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/GlobalExceptionHandler.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/ResourceNotFoundException.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/ProductNotFoundException.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/PolicyNotFoundException.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/PlanNotActiveException.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/BadRequestException.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/DuplicateResourceException.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/RefreshTokenException.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/ErrorResponseDTO.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/ValidationErrorResponseDTO.java`

Related: [Validation](Validation.md), [API Response Wrappers](../03_API/API_Flow.md#response-wrappers)

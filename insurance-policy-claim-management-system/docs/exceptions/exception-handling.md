# Exception Handling

## Purpose

This document explains the custom exception hierarchy, how `GlobalExceptionHandler` works, what HTTP status each exception maps to, and how to add new exceptions.

---

## Exception Hierarchy

```
java.lang.RuntimeException
  │
  ├── BadRequestException                 → HTTP 400
  ├── ResourceNotFoundException           → HTTP 404
  ├── DuplicateResourceException          → HTTP 409
  ├── PlanNotActiveException              → HTTP 400
  └── PolicyNotFoundException             → HTTP 404 (subclass of ResourceNotFoundException)
  
org.springframework.security.access.AccessDeniedException → HTTP 403 (Spring Security)
org.springframework.security.core.AuthenticationException → HTTP 401 (Spring Security)
```

---

## Custom Exceptions

### `BadRequestException`

**HTTP Status:** 400 BAD_REQUEST

**When to use:** The request is syntactically valid but fails a business rule.

**Examples:**
- Claim amount is 0 or negative
- Policy is not ACTIVE when trying to file a claim
- Incident date is in the future
- Account is deactivated
- Email not verified before login

```java
throw new BadRequestException(MessageConstants.Claim.POLICY_NOT_ACTIVE);
```

---

### `ResourceNotFoundException`

**HTTP Status:** 404 NOT_FOUND

**When to use:** A requested resource (user, policy, claim, plan, etc.) does not exist in the database.

**Examples:**
- `policyRepository.findById(id)` returns empty
- User not found by email
- OTP not found

```java
.orElseThrow(() -> new ResourceNotFoundException(
    MessageConstants.PolicyPlan.NOT_FOUND + dto.getPolicyId()));
```

---

### `DuplicateResourceException`

**HTTP Status:** 409 CONFLICT

**When to use:** Attempting to create a resource that already exists (unique constraint violation at business level).

**Examples:**
- Email already registered
- Mobile number already registered
- Health policy already exists for customer/plan
- Policy already pending payment
- Duplicate transaction reference

```java
throw new DuplicateResourceException(MessageConstants.Auth.EMAIL_ALREADY_REGISTERED);
```

---

### `PlanNotActiveException`

**HTTP Status:** 400 BAD_REQUEST

**When to use:** Specifically when a plan is not active (separate exception for clear error messages).

```java
policyPlanRepository.findByIdAndIsActiveTrue(requestDTO.getPlanId())
    .orElseThrow(PlanNotActiveException::new);
```

**Note:** Uses method reference (`::new`) which calls the no-arg constructor with the default message.

---

### `PolicyNotFoundException`

**HTTP Status:** 404 NOT_FOUND

**When to use:** When a policy is not found (provides cleaner error message with policy ID).

```java
throw new PolicyNotFoundException(policyId);
// Message: "Policy not found with ID: 123"
```

---

## GlobalExceptionHandler

**File:** `exception/GlobalExceptionHandler.java`  
**Annotation:** `@RestControllerAdvice`

All exceptions flow to this central handler. Controllers never need try-catch blocks.

### Handled Exceptions → HTTP Status Map

| Exception | HTTP Status | Notes |
|---|---|---|
| `ResourceNotFoundException` | 404 NOT_FOUND | Resource doesn't exist |
| `DuplicateResourceException` | 409 CONFLICT | Duplicate resource |
| `BadRequestException` | 400 BAD_REQUEST | Business rule violation |
| `IllegalArgumentException` | 400 BAD_REQUEST | Invalid argument |
| `MethodArgumentNotValidException` | 400 BAD_REQUEST | DTO validation failure → `ValidationErrorResponseDTO` |
| `PlanNotActiveException` | 400 BAD_REQUEST | Special error type: `PLAN_NOT_ACTIVE` |
| `ObjectOptimisticLockingFailureException` | 409 CONFLICT | Concurrent update conflict |
| `StaleObjectStateException` | 409 CONFLICT | Hibernate stale state |
| `MethodArgumentTypeMismatchException` | 400 BAD_REQUEST | Invalid path variable type |
| `HttpMessageNotReadableException` | 400 BAD_REQUEST | Malformed JSON body |
| `DataIntegrityViolationException` | 409 CONFLICT | DB constraint violation |
| `AccessDeniedException` | 403 FORBIDDEN | Insufficient permissions |
| `BadCredentialsException` | 401 UNAUTHORIZED | Wrong password |
| `AuthenticationException` | 401 UNAUTHORIZED | Auth failure |
| `Exception` (catchall) | 500 INTERNAL_SERVER_ERROR | Unexpected errors |

### Error Response Format

For most exceptions → `ErrorResponseDTO`:
```json
{
  "timestamp": "2024-01-01T10:00:00",
  "statusCode": 404,
  "errorType": "NOT_FOUND",
  "message": "Policy plan not found with ID: 5",
  "requestPath": "/api/policies/purchase"
}
```

For validation errors → `ValidationErrorResponseDTO`:
```json
{
  "timestamp": "2024-01-01T10:00:00",
  "statusCode": 400,
  "errorType": "VALIDATION_FAILED",
  "message": "Validation Failed.",
  "requestPath": "/api/claims/raise",
  "fieldErrors": {
    "claimAmount": "Claim amount must be strictly greater than 0",
    "incidentDate": "Incident date is required"
  }
}
```

### Security Exceptions Routing

Spring Security exceptions (`AuthenticationException`, `AccessDeniedException`) are routed through `HandlerExceptionResolver` to `GlobalExceptionHandler`:

```java
.exceptionHandling(ex -> ex
    .authenticationEntryPoint((req, res, authException) ->
        handlerExceptionResolver.resolveException(req, res, null, authException))
    .accessDeniedHandler((req, res, accessDeniedException) ->
        handlerExceptionResolver.resolveException(req, res, null, accessDeniedException))
)
```

**Why this approach?** By default, Spring Security writes its own response format. Routing through `HandlerExceptionResolver` ensures ALL errors use `GlobalExceptionHandler` and thus the consistent `ErrorResponseDTO` format.

---

## MessageConstants

**File:** `util/MessageConstants.java`

All error messages are stored as `public static final String` constants in nested classes:

```java
public final class MessageConstants {
    public static final class Auth { ... }
    public static final class Customer { ... }
    public static final class Product { ... }
    public static final class PolicyPlan { ... }
    public static final class Policy { ... }
    public static final class Payment { ... }
    public static final class Claim { ... }
    public static final class ClaimReview { ... }
    public static final class Document { ... }
    public static final class Common { ... }
    public static final class Security { ... }
    public static final class Validation { ... }
}
```

**Why a constants class?** Prevents magic strings scattered through the codebase. Enables easy message auditing, translation, and consistency checking.

---

## How to Add a New Exception

### Step 1: Create the Exception Class

```java
package com.insurance.demo.exception;

public class MyNewException extends RuntimeException {
    public MyNewException(String message) {
        super(message);
    }
    
    public MyNewException() {
        super("Default message here");
    }
}
```

### Step 2: Add Handler in GlobalExceptionHandler

```java
@ExceptionHandler(MyNewException.class)
public ResponseEntity<ErrorResponseDTO> handleMyNewException(
        MyNewException ex, HttpServletRequest request) {
    log.warn("My new exception: {}", ex.getMessage());
    return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
}
```

### Step 3: Add Message to MessageConstants

```java
public static final class MyModule {
    public static final String SOME_ERROR = "Descriptive error message.";
}
```

### Step 4: Throw in Service

```java
throw new MyNewException(MessageConstants.MyModule.SOME_ERROR);
```

---

## Logging in Exception Handler

All exceptions are logged with appropriate levels:
- `log.warn()` — 4xx client errors (expected in production)
- `log.error()` — 5xx server errors (unexpected, needs investigation)

The generic `Exception` handler uses `log.error("Unexpected error occurred", ex)` with the full stack trace for debugging.

---

## Optimistic Locking Exception

`@Version` fields on `Policy` and `Claim` protect against concurrent updates. If two requests modify the same entity simultaneously:

1. First request saves successfully (version incremented)
2. Second request detects version mismatch → Hibernate throws `ObjectOptimisticLockingFailureException`
3. `GlobalExceptionHandler` catches it → HTTP 409 with message: "The requested record has already been modified or is no longer available."

**Frontend should:** Show the user a message and refresh the data before retrying.

---

## Common Exception Handling Mistakes

1. **Never catch exceptions silently** (`catch(Exception e) {}`) — this hides bugs
2. **Never return `null` response** — always throw an exception or return valid DTO
3. **Never use generic `Exception`** in services — use specific custom exceptions
4. **Never duplicate exception handling** in controllers — let GlobalExceptionHandler do it
5. **Always include the ID or context** in not-found messages for debugging

---

## Related Documents

- [services/services-overview.md](../services/services-overview.md)
- [best-practices/best-practices.md](../best-practices/best-practices.md)

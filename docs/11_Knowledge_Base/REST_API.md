# REST API

## What It Is
- The HTTP interface exposed by the backend under the `/api` prefix on port 8081. Controllers in `controller/*.java` map URLs, HTTP verbs, and parameters to service calls.
- Conventions: `@RestController`, `@RequestMapping("/api/<resource>")`, `POST` for creation, `GET` for reads, `PUT`/`PATCH` for updates, `@PathVariable`/`@RequestParam` for identifiers and filters, `@RequestBody` for payloads.
- Every response is wrapped in `ApiResponseDTO`; paginated endpoints return `PageResponseDTO`. Documented via springdoc-openapi 3.0.2 at `/swagger-ui.html` when `app.security.swagger-enabled=true`.

## Why It Is Used
- Decouples the React frontend (Vite dev server 5173) from the backend through a stable, versioned contract.
- Stateless, Bearer-authenticated design that fits the security model.
- OpenAPI gives interactive documentation and a machine-readable contract.

## Where It Is Used in This Project
- `controller/AuthController.java`: `/api/auth/*` (login, register, OTP, forgot/reset password, refresh, logout) - public.
- `controller/PublicController.java`: `/api/public/**`.
- `controller/InsuranceProductController.java`, `PolicyPlanController.java`, `CoverageOptionController.java`, `PricingRuleController.java`: catalog and pricing administration.
- `controller/PolicyController.java`: `/api/policies` (purchase, issue, cancel, paginated list, my-policies).
- `controller/ClaimController.java`: `/api/claims` (raise, review, under-review, assign, final-decision, history, pagination).
- `controller/ClaimDocumentController.java`: `/api/document/upload/**` (multipart).
- `controller/PremiumPaymentController.java`: `/api/payments` (record, paginated list, my-payments).
- `controller/PremiumCalculationController.java`: quote generation endpoints.
- `controller/CustomerController.java`, `UserController.java`: customer profile and user administration.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/ClaimController.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PolicyController.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PremiumPaymentController.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/OpenApiConfig.java

## Related Docs
- ../03_API/API_Flow.md
- ../03_API/Claim_API.md
- ../03_API/Policy_API.md
- ../03_API/Authentication_API.md

## Common Interview Questions
1. What are the API conventions? — `/api` prefix, resource-based URLs, REST verbs, `ApiResponseDTO` envelope, pagination via `page`, `size`, `sortBy`, `sortDirection` query parameters.
2. How is pagination surfaced? — `PageResponseDTO<T>` with content, page number/size, totals, last-page flag, and sorting type; services use `PaginationValidator` plus `PageRequest`.
3. How is the API secured at the URL level? — `SecurityConfig` maps HTTP methods + paths to roles; unlisted endpoints require authentication.
4. Where is the API documented? — Swagger UI at `/swagger-ui.html` and OpenAPI JSON at `/v3/api-docs` when enabled by `app.security.swagger-enabled`.
5. How are errors shaped? — `GlobalExceptionHandler` returns `ErrorResponseDTO` / `ValidationErrorResponseDTO` with timestamp, status, error type, message, and request path.

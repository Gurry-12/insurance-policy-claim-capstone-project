# Controllers

## Purpose

This document is the single source of truth for the HTTP layer: the thirteen REST controllers, their base paths, primary endpoints, required roles, and the uniform response wrapping used across the API. It is a structural index; the full endpoint contract lives in the API documents.

## Overview

Every controller lives in `com.insurance.demo.controller` and returns `ApiResponseDTO<T>` (success) or the framework's error payloads for failures. Write endpoints are annotated with `@Valid` on request DTOs. Role enforcement uses Spring Security's method-level annotations (`@PreAuthorize`) wired by `@EnableMethodSecurity` in `SecurityConfig`.

## Business Context

The controller layer is intentionally thin: it performs DTO validation, extracts the authenticated principal where needed, delegates to a service, and wraps the result. It never contains business logic or direct repository access. The base-path convention mirrors the aggregate naming so that front-end consumers can predict URL structure, and the three-role model (`ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`) is what the annotations reference.

## Technical Design

### Response wrapping

All controller methods return `ApiResponseDTO<T>` with fields `message`, `success`, `data`, and `timeStamp`. Paginated results are returned with `data` of type `PageResponseDTO<T>` (content, pageNumber, pageSize, totalRecords, totalPages, lastPage, sortingType). Errors are produced by `GlobalExceptionHandler` and are not wrapped in `ApiResponseDTO`.

### Controller inventory

| Controller | Base path | Primary endpoints (method + path + role) |
| --- | --- | --- |
| `AuthController` | `/api/auth` | `POST /login` (public), `POST /register` (public), `POST /verify-otp` (public), `POST /resend-otp` (public), `POST /refresh` (public, cookie-driven), `POST /logout` (authenticated), `POST /forgot-password` (public), `POST /reset-password` (public) |
| `PublicController` | `/api/public` | `GET /products`, `GET /plans` (public catalog reads); `GET /stats` (portal statistics) |
| `UserController` | `/api/users` | `GET /` (list users, `ROLE_ADMIN`), `GET /{id}` (`ROLE_ADMIN`), `PATCH /{id}/status` (`ROLE_ADMIN`), `POST /staff` (create staff, `ROLE_ADMIN`) |
| `CustomerController` | `/api/customers` | `GET /me` (`ROLE_CUSTOMER`), `PUT /me` (`ROLE_CUSTOMER`), `GET /` (list, `ROLE_ADMIN`), `GET /{id}` (`ROLE_ADMIN`) |
| `InsuranceProductController` | `/api/products` | `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` (mutations `ROLE_ADMIN`, catalog reads public via `PublicController`) |
| `PolicyPlanController` | `/api/plans` | `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` (mutations `ROLE_ADMIN`); `POST /wizard` (plan wizard, `ROLE_ADMIN`) |
| `PolicyController` | `/api/policies` | `POST /purchase` (`ROLE_CUSTOMER`), `POST /{id}/issue` (`ROLE_ADMIN`), `GET /my-policies` (`ROLE_CUSTOMER`), `GET /` (all, `ROLE_ADMIN`/`ROLE_INTERNAL_STAFF`), `GET /{id}`, status/history endpoints |
| `PremiumPaymentController` | `/api/payments` | `POST /pay` (`ROLE_CUSTOMER`), `GET /my-payments` (`ROLE_CUSTOMER`), `GET /{policyId}` (payment history) |
| `ClaimController` | `/api/claims` | `POST /` (file claim, `ROLE_CUSTOMER`), `GET /my-claims` (`ROLE_CUSTOMER`), `GET /` (all, staff/admin), `GET /{id}`, `POST /{id}/review` (`ROLE_INTERNAL_STAFF`), `POST /{id}/recommend` (staff), `POST /{id}/decision` (`ROLE_ADMIN`), `GET /{id}/history` |
| `ClaimDocumentController` | `/api/claims/{claimId}/documents` | `POST /` (upload, `ROLE_CUSTOMER`), `GET /{documentId}` (download), `DELETE /{documentId}` |
| `CoverageOptionController` | `/api/coverage-options` | `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` (mutations `ROLE_ADMIN`) |
| `PricingRuleController` | `/api/pricing-rules` | `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` (mutations `ROLE_ADMIN`); `POST /preview` (pricing preview), `GET /{id}/audit` (audit log) |
| `PremiumCalculationController` | `/api/premium-calculation` | `POST /calculate` (authenticated), `POST /quote/generate` (`ROLE_ADMIN`), `POST /quote/{quoteId}/purchase` (`ROLE_CUSTOMER`) |

### Authentication integration

- `AuthController` login/refresh sets and clears the refresh-token cookie through `RefreshTokenCookieManager`; `LoginResponseDTO` and `RefreshResponseDTO` carry the refresh token in a `@JsonIgnore` field only, never in the JSON body.
- Protected endpoints resolve the caller from `AppUserDetails` (authority = `role.name()`); services receive the principal explicitly to scope data access (for example `findByIdAndPolicyCustomerUserId` for claims).

## Workflow

1. Spring routes the request to the matching controller method; `@PreAuthorize` (if present) is evaluated before the method body.
2. Request DTOs are validated; violations surface as `ValidationErrorResponseDTO` with a `fieldErrors` map.
3. The controller delegates to the service and wraps the returned DTO in `ApiResponseDTO<T>`.
4. Unhandled domain exceptions are converted by `GlobalExceptionHandler` into the uniform error payload.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/AuthController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PublicController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/UserController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/CustomerController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/InsuranceProductController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PolicyPlanController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PolicyController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PremiumPaymentController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/ClaimController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/ClaimDocumentController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/CoverageOptionController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PricingRuleController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/PremiumCalculationController.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/ApiResponseDTO.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/PageResponseDTO.java`

Related: [Authentication API](../03_API/Authentication_API.md), [API Response Wrappers](../03_API/API_Flow.md#response-wrappers)

> The HTTP entry points that route requests, validate inputs, and standardize responses.

---

## Purpose
Controllers handle incoming HTTP requests, delegate business logic to the service layer, and wrap the results in a standardized response format.

---

## Overview
- **Role-based Separation**: Distinct controllers for Admin, Staff, Customer, and Public endpoints.
- **Validation**: Relies on `@Valid` for request DTO validation.
- **Standardized Response**: All endpoints return `ApiResponseDTO<T>`.

---

## Business Context
By separating controllers based on roles and domains (e.g., `AdminUserController`, `CustomerPolicyController`), we ensure security rules are clear, swagger documentation is organized, and the codebase is easy to navigate.

---

## Controller Map
| Controller | Path Prefix | Role | Main Purpose |
|---|---|---|---|
| AuthController | `/api/auth` | Public | Login, Register, Refresh |
| AdminUserController | `/api/admin/users` | Admin | User management |
| CustomerPolicyController | `/api/customer/policies`| Customer | View/buy policies |
| StaffClaimController | `/api/staff/claims` | Staff | Review/approve claims |

---

## Request Lifecycle Diagram
```mermaid
flowchart TD
    A[HTTP Request] --> B[Filter Chain]
    B --> C[DispatcherServlet]
    C --> D[Controller Endpoint]
    D --> E[@Valid RequestDTO]
    E --> F[Service Layer]
    F --> G[ResponseDTO]
    G --> H[ApiResponseDTO Envelope]
    H --> I[HTTP Response]
```

---

## Backend Implementation
- **@RestController**: Combines `@Controller` and `@ResponseBody`.
- **@Valid**: Placed before `@RequestBody` to trigger Hibernate Validator.
- **ApiResponseDTO**: A generic wrapper class containing `success`, `message`, and `data` fields.

---

## Design Decisions
- **Why 13 controllers?** Keeping controllers small and focused on a specific entity and role (Single Responsibility Principle).
- **Why role-based separation?** Rather than having a `PolicyController` with messy `if(isAdmin)` logic, we separate `AdminPolicyController` and `CustomerPolicyController`. This makes URL-based security (`SecurityConfig`) foolproof.
- **Why ApiResponseDTO?** Provides a consistent structure for the frontend to parse, avoiding scenarios where some endpoints return an object, others an array, and others a plain string.

---

## Code References
| Component | Path |
|---|---|
| AuthController | `com.insurance.demo.controller.AuthController` |
| ApiResponseDTO | `com.insurance.demo.dto.ApiResponseDTO` |

---

## Related Documents
- [../06_Backend/DTOs.md](DTOs.md)
- [../06_Backend/Security.md](Security.md)

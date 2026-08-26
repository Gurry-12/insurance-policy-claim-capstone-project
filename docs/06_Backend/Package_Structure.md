> The architectural organization of the Spring Boot backend codebase.

---

## Purpose
Explains how backend files are organized by technical concern to maintain a scalable, readable, and maintainable project.

---

## Overview
- **Domain-Driven vs Layer-Driven**: The project primarily uses a Layer-Driven architecture (controllers, services, repositories) within the base package.

---

## Package Tree
```text
com.insurance.demo
├── config/        # Spring configuration (Security, CORS, ModelMapper)
├── controller/    # HTTP endpoints (REST Controllers)
├── dto/           # Data Transfer Objects (Request/Response)
├── entity/        # JPA Entities (Database tables)
├── exception/     # Custom exceptions & GlobalExceptionHandler
├── repository/    # Spring Data JPA interfaces
├── security/      # JWT filters, utilities, custom user details
├── service/       # Interfaces for business logic
│   └── impl/      # Implementations of service interfaces
└── util/          # Helper classes (e.g., Generators, constants)
```

---

## Package Responsibilities
| Package | Responsibility | Key Files |
|---|---|---|
| `config` | Application-wide configurations and beans | `SecurityConfig`, `DataInitializer` |
| `controller` | Routing, request parsing, response formatting | `AuthController`, `PolicyController` |
| `dto` | Data schemas for API payloads | `ApiResponseDTO`, `LoginRequestDTO` |
| `entity` | ORM mapping to database tables | `User`, `Policy`, `Claim` |
| `exception` | Error handling logic and definitions | `GlobalExceptionHandler` |
| `repository` | Database access and queries | `UserRepository`, `PolicyRepository` |
| `security` | Authentication and authorization mechanics | `JwtAuthenticationFilter`, `JwtService` |
| `service` | Business rules and transaction boundaries | `PolicyService`, `ClaimServiceImpl` |

---

## Design Decisions
- **Why Layer-Driven?** Grouping by technical layer (e.g., all controllers together) is standard in Spring Boot and works well for small-to-medium projects. It makes it obvious where to put a new file. For massive microservices, a domain-driven structure (grouping by feature, e.g., `policy`, `claim`) might be preferred, but layer-driven keeps this project accessible.

---

## Related Documents
- [../06_Backend/Controllers.md](Controllers.md)
- [../06_Backend/Services.md](Services.md)

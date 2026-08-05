# Folder Structure
> Comprehensive guide to the repository layout and package responsibilities for both backend and frontend modules.

---

## Purpose
This document maps the physical structure of the repository. It explains where code lives and why it is organized that way, helping developers navigate the codebase efficiently and maintain architectural consistency.

---

## Overview
The repository is a monorepo containing two distinct modules: the Spring Boot backend and the React frontend, along with project documentation and testing assets. 
The backend follows a layer-by-feature architecture inside a standard Maven layout. The frontend follows a feature-based folder structure inside a standard Vite layout.

---

## Business Context
A clear, predictable folder structure reduces onboarding time and cognitive load. By aligning the folder structure with architectural layers (backend) and domain features (frontend), developers can quickly locate bugs, add features, and ensure separation of concerns.

---

## Repository Root

```text
capstone-project/
├── docs/                        # Complete project documentation (Markdown)
├── demo-data/                   # SQL seed scripts, postman payloads, demo guides
├── screenshots/                 # UI screenshots categorized by role
├── insurance-policy-claim-management-system/   # Backend: Spring Boot module
├── insurance-policy-claim-management-app-ui/   # Frontend: React SPA module
├── CHANGELOG.md                 # Version history and major changes
└── README.md                    # Project landing page
```

---

## Backend Module Structure (`insurance-policy-claim-management-system`)

```text
src/main/java/com/insurance/demo/
├── config/            # App config, CORS, SecurityConfig, Filters, DataInitializer
├── controller/        # REST APIs. @RestController classes
├── dto/
│   ├── request/       # Incoming payloads (with @Valid annotations)
│   └── response/      # Outgoing payloads and standard API envelopes
├── enums/             # Domain constants (Role, Statuses, Types)
├── exception/         # GlobalExceptionHandler and custom exceptions
├── model/             # JPA @Entity classes (Database mapping)
├── repository/        # Spring Data JPA interfaces
├── security/          # JWT utilities, CustomUserDetailsService, Token services
├── service/           # Business logic interfaces
│   └── strategy/      # Premium Calculator Strategy pattern interfaces
├── serviceimpl/       # Implementations of services (@Transactional)
├── util/              # Helpers, constants, number generators
└── verification/      # OTP generation, Email (SMTP), SMS (Twilio) services
```

### Backend Package Responsibilities
| Package | Responsibility | Key Files |
|---|---|---|
| `controller` | Handle HTTP routes, validate DTOs, return responses. | `AuthController.java`, `ClaimController.java` |
| `service` | Define business contracts (Interfaces). | `ClaimService.java`, `PolicyService.java` |
| `serviceimpl` | Execute business logic, manage transactions. | `ClaimServiceImpl.java` |
| `repository` | Database queries. | `ClaimRepository.java` |
| `model` | Define DB schema. | `Claim.java`, `Policy.java` |
| `dto` | Data transfer objects. | `ClaimRequestDTO.java`, `ApiResponseDTO.java` |
| `security` | Authentication and authorization. | `JwtService.java`, `SecurityConfig.java` |

---

## Frontend Module Structure (`insurance-policy-claim-management-app-ui`)

```text
src/
├── api/               # axiosInstance.js, apiAdapter.js, tokenStore.js
├── common/            # Highly reusable, generic UI components (Buttons, Cards)
├── components/        # Feature-specific components organized by domain
│   ├── auth/
│   ├── claims/
│   ├── dashboard/
│   ├── layouts/       # UnifiedLayout, Sidebar, Navbar
│   └── tables/
├── context/           # React Contexts (AuthContext, ThemeContext)
├── hooks/             # Custom React Hooks (useApiTable, useApiForm)
├── pages/             # Route entry points, organized by role
│   ├── admin/
│   ├── auth/
│   ├── customer/
│   ├── public/
│   └── staff/
├── services/          # API call wrappers (authService.js, claimService.js)
├── utils/             # Helper functions, formatters, role constants
├── App.jsx            # Routing configuration and Guard wrappers
└── main.jsx           # Application entry point and Context Providers
```

### Frontend Folder Responsibilities
| Folder | Responsibility | Key Files |
|---|---|---|
| `api/` | Low-level HTTP configuration and interceptors. | `axiosInstance.js` |
| `services/` | API interaction logic mapped to backend endpoints. | `policyService.js` |
| `context/` | Global state management. | `AuthContext.jsx` |
| `pages/` | Top-level views assigned to routes. | `AdminDashboard.jsx` |
| `components/` | Reusable UI pieces that make up pages. | `UnifiedLayout.jsx` |
| `hooks/` | Reusable logic encapsulating state and effects. | `useApiTable.js` |

---

## Design Decisions
| Decision | Rationale |
|---|---|
| **Layered Backend Packages** | Grouping by technical concern (controller, service, repository) is the Spring Boot standard. It makes it extremely easy to enforce architectural boundaries (e.g., Controllers should never call Repositories directly). |
| **Interface/Impl Separation** | Placing interfaces in `service/` and implementations in `serviceimpl/` keeps contracts visible and allows for easy mocking in unit tests. |
| **Role-Based Page Grouping (UI)** | Grouping pages by `admin/`, `staff/`, and `customer/` directly mirrors the Role-Based Access Control, making route guarding logical and self-evident. |
| **Service Abstraction (UI)** | React components do not use Axios directly. They call functions in `services/`. This abstracts away URL paths and API logic, making components cleaner and the API layer easily refactorable. |

---

## Related Documents
- [High Level Architecture](High_Level_Architecture.md)
- [Backend Architecture](Backend_Architecture.md)
- [Frontend Architecture](Frontend_Architecture.md)

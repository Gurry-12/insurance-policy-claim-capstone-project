<Services>
> The core business logic layer of InsuranceFlow.

---

## Purpose
The service layer contains all business logic, transaction management, and orchestrates calls between repositories, external APIs, and other services.

---

## Overview
- **Interface + Implementation**: standard Spring pattern.
- **Transaction Boundary**: Uses `@Transactional` to ensure data consistency.
- **Stateless**: Services maintain no user state; they read the user context from `SecurityContextHolder`.

---

## Business Context
When a user buys a policy or submits a claim, multiple database tables must be updated (e.g., deduct balance, create policy, send email). The service layer ensures all these steps happen together or fail together.

---

## Service Map
| Interface | Implementation | Key Responsibility |
|---|---|---|
| PolicyService | PolicyServiceImpl | Issuing and managing policies |
| ClaimService | ClaimServiceImpl | Filing and processing claims |
| AuthService | AuthServiceImpl | Login, OTP, user registration |

---

## Backend Implementation
- **@Service**: Marks the class as a Spring Bean.
- **@Transactional**: Applied at the class or method level. Default is `readOnly = false`.
- **SecurityContext**: Services retrieve the logged-in user via `SecurityContextHolder.getContext().getAuthentication().getPrincipal()`.

---

## Design Decisions
- **Why Interface + Impl?** Enables easier testing via mocks and adheres to the Dependency Inversion Principle, though some argue it's overkill if there's only ever one implementation. We use it for architectural consistency.
- **Why is the Service Layer needed?** Controllers should only handle HTTP concerns. Repositories should only handle DB queries. Services bridge the gap, housing pure business rules (e.g., "Cannot approve a claim if policy is expired").
- **@Transactional usage**: We place it on the service layer because a business operation (like `approveClaim`) might involve multiple repository calls (update claim status, update policy limits, save audit log). If any fail, the whole operation rolls back.

---

## Code References
| Component | Path |
|---|---|
| PolicyServiceImpl | `com.insurance.demo.service.impl.PolicyServiceImpl` |

---

## Related Documents
- [../06_Backend/Controllers.md](Controllers.md)
- [../06_Backend/Repositories.md](Repositories.md)

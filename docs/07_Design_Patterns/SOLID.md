# SOLID Principles

> How the five SOLID principles map to concrete classes in this project, and where the design deliberately falls short.

## Purpose

This document is the single source of truth for the application of the SOLID principles in the backend. It maps each principle to verified examples in the code, provides the file references to inspect, and honestly records where the design is imperfect. It is the review companion for design-pattern and service-layer documents; it does not re-explain service internals.

## Overview

SOLID is the set of five object-oriented design principles — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. The backend does not apply them mechanically; it applies them where they buy the most: a strict interface/implementation split, narrow per-aggregate services, a strategy family for pricing, injected repositories and adapters, and a centralized error handler. The imperfections are equally real: a few large service implementations, a residual field-injection site, and transaction-bound lazy-loading coupling.

## Business Context

Insurance systems change constantly — pricing rules, product types, claim routing, payment modes. SOLID matters because the application must accommodate those changes without rewriting working code. The strategy calculators, the repository abstractions, and the adapter layer (Cloudinary, email, SMS, JPA) are the seams where business variability is deliberately isolated so a change to one formula, one provider, or one rule does not destabilize the rest.

## Technical Design

### Principle-by-principle map

| Principle | Example in this project | Files |
| --- | --- | --- |
| Single Responsibility | One service contract per aggregate; each owns exactly its aggregate's rules | `service/PolicyService.java`, `service/ClaimService.java`, `service/PremiumPaymentService.java` (+ `serviceimpl` counterparts) |
| Single Responsibility | One centralized class translates exceptions to HTTP responses | `exception/GlobalExceptionHandler.java` |
| Single Responsibility | One class owns JWT generation/parsing/validation | `security/JwtService.java` |
| Single Responsibility | One class owns string constants (no magic strings in business logic) | `util/MessageConstants.java` |
| Open/Closed | Premium calculators: new premium type = new strategy bean, no edits to existing classes | `service/strategy/*.java` |
| Open/Closed | Spring Data repositories: domain queries added as interface methods, implemented by the framework | `repository/PolicyRepository.java`, `repository/ClaimRepository.java` |
| Liskov Substitution | `OneTimePremiumCalculator` and `AnnualPremiumCalculator` are interchangeable through `PremiumCalculator`; the context treats any implementation identically | `service/strategy/PremiumCalculator.java`, `serviceimpl/PremiumCalculationServiceImpl.java` |
| Interface Segregation | Narrow service interfaces: each service exposes only its aggregate's operations (no fat god-interface) | `service/*.java` (14 interfaces) |
| Interface Segregation | Request/response DTO split keeps payloads small and role-specific; no entity internals leak | `dto/request/*`, `dto/response/*` |
| Dependency Inversion | High-level policies depend on abstractions: services depend on repository interfaces and adapter contracts, not on Hibernate/SDK/JDBC types | `serviceimpl/*.java`, `service/CloudinaryService.java`, `repository/*.java` |
| Dependency Inversion | `PremiumCalculationServiceImpl` depends on `PremiumCalculatorFactory` (an abstraction) and never on concrete calculators | `serviceimpl/PremiumCalculationServiceImpl.java` |

### Deep dives

**Single Responsibility.** The service layer follows one-service-per-aggregate: policy logic never lives in the claim service, and payment logic never lives in the policy service. Cross-cutting concerns are extracted rather than duplicated: `GlobalExceptionHandler` is the only place exceptions map to HTTP responses (see [Exception Handling](../06_Backend/Exception_Handling.md)); `JwtService` is the only place tokens are built and parsed; `MessageConstants` is the only home for user-facing strings. Each extracted class has exactly one reason to change.

**Open/Closed.** The strongest example is the premium engine. `PremiumCalculationServiceImpl`, the factory, and both calculators are closed for modification; the system is open for extension because a new `PremiumType` requires a new `PremiumCalculator` bean (matching the `*_CALCULATOR` bean-name convention) and nothing else changes. Repositories show the same shape: a derived query method is added to the interface and Spring Data generates the implementation.

**Liskov Substitution.** The calculators honour the `PremiumCalculator` contract — same inputs, same `PremiumQuote` output type, same rounding and precision conventions — so the context can swap them freely. The correctness of this is documented per formula in [Premium Calculation Service](../06_Backend/Premium_Calculation_Service.md); the pattern is in [Strategy](Strategy.md).

**Interface Segregation.** Services are kept narrow. `PremiumCalculationService` exposes exactly the quote-generation operations; `ClaimDocumentService` exposes document operations; nothing forces a client to depend on methods it does not use. The DTO split (`dto/request` for inputs, `dto/response` for outputs) is the data-side analogue: requests carry only what the API accepts, responses only what the client needs, and neither exposes JPA entity internals.

**Dependency Inversion.** Policy, claim, and payment services inject repository interfaces and adapter contracts rather than infrastructure types. `ClaimDocumentServiceImpl` depends on `CloudinaryService` (not the Cloudinary SDK); services depend on repository interfaces (not `EntityManager` or SQL). This inversion is what makes the [Adapter](Adapter.md) and [Dependency Injection](Dependency_Injection.md) designs possible and is what the integration tests rely on.

## Workflow

SOLID is a design property, not a runtime flow. In practice it manifests as a consistent change process:

1. A new requirement (for example a new premium model) is implemented by adding a new class behind an existing interface — no edits to the strategy family.
2. A new domain query is added to a repository interface — no edits to services beyond calling it.
3. A new exception type is handled by adding one `@ExceptionHandler` in `GlobalExceptionHandler` — no edits to controllers.
4. A new external provider swaps behind an adapter — no edits to business services.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/OneTimePremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/AnnualPremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculatorFactory.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumCalculationServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimDocumentServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/CloudinaryService.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/GlobalExceptionHandler.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/JwtService.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/util/MessageConstants.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/repository/PolicyRepository.java`

## Diagrams

_N/A_ — SOLID is expressed through the class structure already diagrammed in the strategy, adapter, and dependency-injection documents. See [Strategy](Strategy.md#diagrams), [Adapter](Adapter.md#diagrams), and [Dependency Injection](Dependency_Injection.md#diagrams).

## Best Practices

- **Apply the principles where variability exists.** The strategy family, repositories, and adapters are the high-variability seams; the pattern is concentrated there rather than applied dogmatically to every line.
- **Keep interfaces narrow and per-aggregate.** A client should never see methods it cannot use (Interface Segregation).
- **Depend on abstractions, inject dependencies.** Constructor-injected interfaces are the norm; see [Dependency Injection](Dependency_Injection.md).
- **Centralize cross-cutting concerns.** Error mapping, token handling, and message constants each have exactly one owner.
- **Verify Liskov with the deep-dive docs.** The calculators only satisfy the contract if their outputs match the documented rounding and formula conventions; keep those docs in sync when a strategy changes.

## Where the design is imperfect

Honest assessment against the code:

- **Fat service implementations.** `PolicyServiceImpl` (roughly 460 lines) mixes authorization checks, quote validation, filtering/specification building, mapping, and policy assembly. It satisfies Single Responsibility at the *aggregate* level but strains it at the *method* level; a `PolicyAssembly` helper or builder would thin it (see [Builder](Builder.md)).
- **Residual field injection.** `PremiumCalculationServiceImpl` and `PremiumCalculationController` still use `@Autowired` field injection, which hides dependencies and weakens the Dependency Inversion story the rest of the layer follows. The field-injection site is the same class that already had constructor-style collaborators via the factory, making it inconsistent.
- **Lazy-loading coupling.** Associations are `FetchType.LAZY` (verified in `Policy`, `Claim`, `Quote`, and friends), which is correct, but it means read methods must stay inside an open transaction to traverse collections (for example `PolicyServiceImpl.cancelPolicy` iterating `policy.getClaims()`). This couples business logic to the transaction boundary — an acceptable cost today, but a place where a dedicated query/reporting layer would pay off as the read surface grows.
- **Adapter return types.** `CloudinaryService` still exposes the SDK's raw `Map`, leaking a vendor type at the edge of the adapter; see [Adapter](Adapter.md#future-improvements).

## Future Improvements

- Extract policy assembly and staff-speciality authorization into focused collaborators to thin `PolicyServiceImpl`.
- Convert the remaining `@Autowired` field-injection sites to constructor injection for a uniform Dependency Inversion story.
- Consider dedicated read models or DTO projections for list/detail screens to decouple business logic from lazy-loading transaction boundaries.
- Track against future enhancements: `../10_Evaluation/Future_Enhancements.md`.

Related: [Strategy](Strategy.md), [Factory](Factory.md), [Adapter](Adapter.md), [Dependency Injection](Dependency_Injection.md), [Services](../06_Backend/Services.md)

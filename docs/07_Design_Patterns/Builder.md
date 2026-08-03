# Builder Pattern

> The Builder pattern in this project: Lombok `@Builder` on three classes, fluent assembly of the `PremiumQuote`, and setter-based entity assembly everywhere else.

## Purpose

This document is the single source of truth for how objects are constructed in this codebase. It states honestly where the Builder pattern is and is not used, describes the current construction styles (Lombok builders, setters, ModelMapper mapping), and recommends where a builder-style fluent API would reduce risk. It does not re-describe the mapping strategy in detail — that lives in the services document.

## Overview

The GoF Builder pattern separates the construction of a complex object from its representation, typically via a fluent API that sets fields step-by-step and validates before producing a final immutable object. This project uses **Lombok's `@Builder`** — a compile-time generated fluent builder — on a *subset* of classes, and relies on conventional setter-based construction and `ModelMapper` for most domain assembly.

Verified usage of Lombok `@Builder` (grep across `src/main/java`):

| Class | Package | Where the builder is used |
| --- | --- | --- |
| `PremiumQuote` | `com.insurance.demo.dto` | Both premium calculators and `PricingRuleServiceImpl` build quotes with `PremiumQuote.builder()`. |
| `RefreshToken` | `com.insurance.demo.model` | `RefreshTokenService` builds rotation and replacement tokens with `RefreshToken.builder()`. |
| `OtpVerification` | `com.insurance.demo.model` | `OtpService` builds OTP rows with `OtpVerification.builder()`. |

Domain aggregates such as `Policy`, `Claim`, `AppUser`, `Customer`, `InsuranceProduct`, and `PolicyPlan` do **not** use `@Builder`; they are assembled with setters.

## Business Context

Insurance objects carry a large number of fields, many of which are interdependent (a `Policy` must snapshot pricing values from a `Quote`, carry a generated policy number, and start in `PENDING_PAYMENT`). Incorrect or incomplete assembly is a real operational risk: a policy missing its pricing snapshot would silently produce wrong claims calculations later. Construction style therefore matters as a quality control measure as much as a convenience.

## Technical Design

### Style 1: Lombok `@Builder` (used)

`PremiumQuote` is annotated with `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, and `@Builder`. Both strategies build their result fluently, naming every monetary field:

```java
return PremiumQuote.builder()
        .selectedCoverage(coverageAmount)
        .duration(duration)
        .premiumType(PremiumType.ONE_TIME)
        .basePremium(basePremium)
        .annualPremium(annualPremium)
        .processingFee(processingFee)
        .gst(gstAmount)
        .totalCommitment(totalCommitment)
        .discountPercentage(discountRate.multiply(new BigDecimal("100"))...)
        .discountAmount(discountAmount)
        .oneTimeDiscount(discountAmount)
        .totalPremium(totalPremium)
        .build();
```

`RefreshToken` and `OtpVerification` are JPA entities that also carry a builder. This works because Lombok generates the builder while the entity keeps its no-argument constructor (via `@NoArgsConstructor`) that JPA requires.

### Style 2: Setter-based assembly (dominant for entities)

Most entities are constructed as `new Entity()` followed by a sequence of `setX(...)` calls. Two representative examples:

- `DataInitializer.initAdminData` creates the seeded admin with `new AppUser()` and ten setter calls.
- `PolicyServiceImpl.buildPolicyFromQuote` builds a `Policy` with roughly twenty setter calls (customer, plan, policy number, dates, status, and the full pricing snapshot from the `Quote`).

This style is simple and JPA-friendly, but it allows partially constructed objects, gives no compile-time guarantee that required fields were set, and is easy to get wrong when the field list grows.

### Style 3: DTO <-> entity mapping via `ModelMapper`

Request DTOs are mapped to entities and entities to response DTOs by the shared `ModelMapper` bean declared in `AppConfig` (`@Bean ModelMapper modelMapper()`). For example, `PolicyServiceImpl.convertToResponseDTO` calls `modelMapper.map(policy, PolicyResponseDTO.class)` and then fills in flattened fields (customer name, plan name, remaining claim amount) that mass mapping cannot derive. This is the dominant pattern for read-side DTO assembly; see [Services](../06_Backend/Services.md).

## Workflow

1. **Request path:** the controller maps the validated request DTO to service input; the service loads the involved aggregates and performs business-rule checks.
2. **Quote path:** `PremiumCalculationServiceImpl` delegates the formula to a strategy, which assembles a `PremiumQuote` with its Lombok builder.
3. **Policy path:** `PolicyServiceImpl.buildPolicyFromQuote` assembles the `Policy` entity field-by-field from the consumed `Quote` and persists it in the purchase transaction.
4. **Read path:** services map entities to response DTOs with `ModelMapper` and fill any remaining flattened fields manually.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/PremiumQuote.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/RefreshToken.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/OtpVerification.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java` (see `buildPolicyFromQuote` / `convertToResponseDTO`)
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/OneTimePremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/AnnualPremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/RefreshTokenService.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/verification/OtpService.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/AppConfig.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/DataInitializer.java`

## Diagrams

_N/A_ — the Builder pattern here is a code-level convenience (Lombok-generated), not a structural architecture pattern; a diagram would add no information beyond the Code References above.

## Best Practices

- **Builders are best for value objects and DTOs.** `PremiumQuote` is a read-only calculation result; a fluent builder makes each produced value explicit and self-documenting. This is the ideal use of `@Builder`.
- **Use builders where "required fields" matter.** `RefreshToken` and `OtpVerification` need their fields set consistently on every creation path; the builder keeps those call sites uniform (see the integration tests, which also use these builders when seeding test data).
- **Keep entities JPA-safe.** If `@Builder` is added to an entity, it must keep a no-argument constructor (`@NoArgsConstructor`) and avoid enforcing invariants that conflict with Hibernate's lifecycle.
- **Prefer builders over setter sequences in hot service assembly.** Long `new Entity()` + twenty `setX()` blocks are the riskiest construction code in the project.
- **Let ModelMapper do the mechanical work.** Mass mapping is correct for flat DTOs; reserve manual assembly for fields that need computation (remaining cover, derived names).

## Future Improvements

The strongest candidate for a builder-style fluent API is **policy assembly** in `PolicyServiceImpl.buildPolicyFromQuote`:

- The method currently performs roughly twenty setter calls on a freshly `new`-ed `Policy`, mixing identity fields, lifecycle fields, and pricing snapshots.
- A builder (either Lombok `@Builder` on a dedicated policy-construction value object, or a hand-written fluent assembler in the service) could group these into logical steps (`identity(...)`, `coverage(...)`, `status(...)`) and enforce required fields at compile time.
- A second candidate is the large read-side DTOs (for example `PolicyResponseDTO`), whose construction mixes a `ModelMapper` pass with several manual `set` calls; a builder would make the manual population stage explicit.

Remaining honest about current usage: only `PremiumQuote`, `RefreshToken`, and `OtpVerification` carry builders today, so any recommendation to expand the pattern is a change proposal, not a description of current behaviour. Track against future enhancements: `../10_Evaluation/Future_Enhancements.md`.

Related: [Services](../06_Backend/Services.md), [Premium Calculation Service](../06_Backend/Premium_Calculation_Service.md), [Strategy](Strategy.md)

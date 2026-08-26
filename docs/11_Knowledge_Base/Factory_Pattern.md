# Factory Pattern

## What It Is
The Factory pattern centralizes object creation: instead of a caller
instantiating or picking an implementation, a dedicated factory decides
which concrete object to return. It often pairs with a registry (a map)
of available instances.

## Why It Is Used
- Decouples callers from concrete classes and from bean-name details.
- Centralizes the selection rule in one place, so a caller just asks
  `getCalculator(type)`.
- New variants plug in automatically if they register under the
  expected key.

## Where It Is Used in This Project
Verified against the backend:
- `service/strategy/PremiumCalculatorFactory.java` is a `@Component`
  that injects `Map<String, PremiumCalculator>` (Spring populates the map
  from all `PremiumCalculator` beans, keyed by bean name).
- `getCalculator(PremiumType)` computes the key as
  `premiumType.name() + "_CALCULATOR"` (for example
  `ANNUAL_CALCULATOR`, `ONE_TIME_CALCULATOR`) and throws
  `IllegalStateException` if the key is missing.
- Producers: `AnnualPremiumCalculator` and `OneTimePremiumCalculator`
  are registered with explicit bean names via
  `@Component("ANNUAL_CALCULATOR")` and
  `@Component("ONE_TIME_CALCULATOR")`.
- The factory is the backend entry point for premium math used when
  quotes are created and policies are issued or purchased.

## Related Files
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculatorFactory.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/AnnualPremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/OneTimePremiumCalculator.java`

## Related Docs
- ../07_Design_Patterns/Factory_Pattern.md
- ../07_Design_Patterns/Strategy.md
- ../07_Design_Patterns/Dependency_Injection.md
- ../02_Business_Domain/Premium_Calculation.md

## Common Interview Questions
1. How does the factory receive its strategies?
   Spring injects a `Map<String, PremiumCalculator>` populated with every
   `PremiumCalculator` bean, keyed by bean name.
2. What happens when a new `PremiumType` is introduced?
   Add a new `@Component` implementation with the matching bean name;
   the factory logic and callers stay unchanged.
3. What is the downside of a missing key?
   The factory throws `IllegalStateException`, failing fast instead of
   silently computing nothing.
4. Factory vs direct instantiation?
   The factory hides bean naming and lifecycle from callers and keeps
   the selection policy in one auditable place.
5. How does this relate to DI?
   The factory is itself a bean that receives its strategy registry
   through constructor injection.

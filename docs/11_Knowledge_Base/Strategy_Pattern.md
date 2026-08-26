# Strategy Pattern

## What It Is
The Strategy pattern defines a family of interchangeable algorithms
behind one interface and selects one at runtime. Callers depend on the
interface, not on a concrete implementation.

## Why It Is Used
- Lets premium calculation vary by `PremiumType` (ANNUAL vs ONE_TIME)
  without `if/else` branching inside the caller.
- Each algorithm stays isolated and unit-testable.
- Adding a new premium type means adding one new strategy class; the
  factory and callers do not change.

## Where It Is Used in This Project
Verified against the backend (`service/strategy`):
- Interface: `PremiumCalculator.java` with
  `calculatePremium(PremiumCalculationRequest, PricingRule, BigDecimal)`.
- Implementations: `AnnualPremiumCalculator`
  (`@Component("ANNUAL_CALCULATOR")`) and `OneTimePremiumCalculator`
  (`@Component("ONE_TIME_CALCULATOR")`). They encode the fact-sheet math:
  ANNUAL applies base risk premium + processing fee + 18% GST per year;
  ONE_TIME applies duration discounts on the annual amount.
- Selection: `PremiumCalculatorFactory.getCalculator(PremiumType)`
  resolves a Spring bean by the name `premiumType.name() + "_CALCULATOR"`
  and throws `IllegalStateException` if none exists.
Frontend angle in this project:
- The axios layer is a form of strategy selection: `src/api/axiosInstance.js`
  decides between normal handling, single-flight refresh on 401, and
  error events, while `src/services/*.js` modules act as a facade over
  it. The canonical frontend docs cover this in depth.

## Related Files
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/AnnualPremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/OneTimePremiumCalculator.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculatorFactory.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/PremiumType.java`

## Related Docs
- ../07_Design_Patterns/Strategy.md
- ../07_Design_Patterns/Factory_Pattern.md
- ../07_Design_Patterns/Dependency_Injection.md
- ../02_Business_Domain/Premium_Calculation.md
- ../05_Frontend/API_Integration.md

## Common Interview Questions
1. How does the factory know which strategy to use?
   It maps `PremiumType` to a Spring bean name (`"ANNUAL_CALCULATOR"` /
   `"ONE_TIME_CALCULATOR"`) through an injected
   `Map<String, PremiumCalculator>`.
2. What happens if a `PremiumType` has no calculator?
   `getCalculator` throws `IllegalStateException`, failing fast at the
   calculation entry point.
3. Why not a switch on `PremiumType`?
   A switch couples the caller to every algorithm and grows with each
   new type; the strategy interface keeps the caller stable.
4. How is the strategy pattern different from the factory pattern?
   Strategy selects among interchangeable algorithms at runtime; the
   factory encapsulates that selection (here the two are combined).
5. Where does the same idea appear on the frontend?
   The axios interceptor chooses between normal request, refresh, and
   error handling, and the service modules expose a stable API facade.

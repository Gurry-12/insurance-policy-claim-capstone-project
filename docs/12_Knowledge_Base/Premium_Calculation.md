# Premium Calculation

## What It Is
- The pricing engine that turns coverage, duration, premium type, and an active pricing rule into a quote. Implemented as a **Strategy pattern** over two calculators.
- Formula (per the fact sheet): `base = coverage × baseRiskRate`; `taxable = base + processingFee`; `gst = 18% of taxable`; ANNUAL total = `taxable + gst` (per year); ONE_TIME total = `annualPremium × duration × (1 − durationDiscount)`.
- Duration discounts applied only for ONE_TIME: 2% (2 yr), 5% (3 yr), 8% (5 yr), 10% (7 yr), 12% (10 yr), 15% (15 yr), 18% (20 yr), 20% (over 20 yr).
- All amounts use `BigDecimal` with `HALF_UP` rounding.

## Why It Is Used
- Consistent, auditable, rule-driven pricing with no hard-coded magic numbers in controllers.
- The strategy/factory split makes it easy to add a new premium type without touching existing calculators.
- The calculated quote is persisted, so the price shown to the customer is traceable and reproducible.

## Where It Is Used in This Project
- `serviceimpl/PremiumCalculationServiceImpl.java`: validates plan/product active, duration allowed, coverage option active, and the presence of an active pricing rule; picks the calculator from the factory; persists a `Quote` (status `CREATED`, 30-minute expiry).
- `service/strategy/PremiumCalculator.java`: the strategy interface.
- `service/strategy/AnnualPremiumCalculator.java` (`@Component("ANNUAL_CALCULATOR")`): per-year premium, no lump-sum discount.
- `service/strategy/OneTimePremiumCalculator.java` (`@Component("ONE_TIME_CALCULATOR")`): applies the duration-discount ladder.
- `service/strategy/PremiumCalculatorFactory.java`: resolves calculators by `PremiumType` name.
- `dto/PremiumQuote.java`: the result payload with all pricing components.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumCalculationServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/OneTimePremiumCalculator.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/AnnualPremiumCalculator.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/service/strategy/PremiumCalculatorFactory.java

## Related Docs
- ../02_Business_Domain/Premium_Calculation.md
- ../02_Business_Domain/Pricing_Rules.md
- ../02_Business_Domain/Business_Rules.md
- ../06_Backend/Premium_Calculation_Service.md

## Common Interview Questions
1. Walk through the premium formula — `base = coverage × baseRiskRate`, then `taxable = base + processingFee`, `gst = 18% of taxable`; ANNUAL pays `taxable + gst` per year, ONE_TIME pays `annualPremium × duration` minus the duration discount.
2. Why use the Strategy pattern? — The formula differs by premium type; each calculator is a separate bean and the factory selects one by `PremiumType`, so new types only add a bean.
3. How is rounding handled? — All `BigDecimal` arithmetic uses `RoundingMode.HALF_UP`, matching the fact sheet.
4. What inputs are validated before pricing? — Plan and product must be active, the duration must be in the plan's allowed durations, the coverage must match an active coverage option, and an active pricing rule must exist.
5. Where does the result go? — `PremiumCalculationServiceImpl` persists a `Quote` (status `CREATED`, 30-minute expiry) and returns a `PremiumQuote` carrying the quote id.

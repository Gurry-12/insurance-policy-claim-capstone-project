# Quote

## What It Is
- A persisted, validated price offer for a specific customer and plan before purchase. Captures every pricing input and output: plan, `planVersion`, `pricingRuleId`, coverage, duration, premium type, `riskRate`, `processingFee`, `gst`, `premium`, `total`, status, and `expiresAt`.
- Statuses (`QuoteStatus`): `CREATED`, `USED`, `EXPIRED`, `CANCELLED`.
- Created with a **30-minute expiry**; a purchase must happen while the quote is `CREATED` and unexpired.

## Why It Is Used
- Locks in a price for a limited window so the customer can review before paying.
- Provides a full audit trail of the exact inputs used to compute the premium.
- Prevents purchase-time surprises: the policy takes the quote's values, including plan version and pricing rule id, as a snapshot.

## Where It Is Used in This Project
- `model/Quote.java`: entity fields and `@NotNull` / `@PositiveOrZero` validation.
- `serviceimpl/PremiumCalculationServiceImpl.java`: builds and persists the quote (`QuoteStatus.CREATED`, `expiresAt = now + 30 min`).
- `serviceimpl/PolicyServiceImpl.java`: `validateQuoteForPurchase` checks ownership, status `CREATED`, not expired (marks `EXPIRED` otherwise), and plan/product still active; `purchasePolicy`/`issuePolicy` then build the policy from the quote and mark it `USED`.
- `repository/QuoteRepository.java`: lookups by id.
- `enums/QuoteStatus.java`: lifecycle states.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/model/Quote.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumCalculationServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/QuoteStatus.java

## Related Docs
- ../02_Business_Domain/Premium_Calculation.md
- ../02_Business_Domain/Policy_Workflow.md
- ../03_API/Pricing_API.md

## Common Interview Questions
1. What is the quote lifecycle? — Created `CREATED` with a 30-minute expiry; becomes `USED` on purchase, `EXPIRED` if purchase happens after `expiresAt`, or `CANCELLED` by policy.
2. Why a 30-minute expiry? — It locks the price for a short, well-defined window, balancing customer convenience against rate changes.
3. What is validated before purchase? — The quote must belong to the customer, be `CREATED`, be unexpired, and the plan/product must still be active.
4. How does the quote feed the policy? — `buildPolicyFromQuote` copies coverage, premium type, duration, rates/fees/GST, calculated premium, plan version, and pricing rule id into the policy as a snapshot.
5. Where is the quote created? — `PremiumCalculationServiceImpl.generateQuote*` persists it after pricing validation.

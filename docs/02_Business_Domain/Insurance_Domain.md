# Insurance Domain

> An enterprise primer on how the Insurance Policy & Claim Management System models products, plans, coverage, pricing, premiums, quotes, policies, payments, claims, and the users that drive them.

## Purpose

Introduces the business vocabulary of the system for developers, architects, testers, and evaluators, and maps every business concept to its authoritative entity, enum, and service. Deeper behavior lives in the workflow documents; this document is the conceptual map of the whole domain.

## Overview

The platform is a three-role insurance back-office plus customer portal:

- **ROLE_ADMIN** manages the product catalogue, plans, pricing, coverage tiers, users, and makes final claim decisions.
- **ROLE_INTERNAL_STAFF** sells and issues policies on behalf of customers and investigates/recommends claims within their `productSpeciality`.
- **ROLE_CUSTOMER** browses active products, generates quotes, purchases policies, pays premiums, and raises claims.

The domain is organised as a product tree: **InsuranceProduct** → **PolicyPlan** → **CoverageOption** + **PricingRule**, from which **Quote** → **Policy** → **PremiumPayment** and **Policy** → **Claim** → **ClaimDocument**/**ClaimStatusHistory** flows are derived.

## Business Context

Insurance products in this system are discrete offer families (Health, Motor, Life, Travel, General). Customers must not be able to accidentally double-buy, must see only what is active, must have their money movement exactly reconciled to a computed premium, and must have a transparent, auditable claim path. Every structural decision in the domain model (premium snapshots on the policy, status histories, one-active-pricing-rule, coverage tiers as first-class entities) exists to guarantee those invariants.

## Technical Design

### Users and profiles

- `AppUser` (`users` table): full name, email, mobile, BCrypt password, `isActive`, `Role`, `tokenVersion`, email/phone verification flags. Email and mobile are unique.
- `Customer` (`customers` table): one-to-one profile record (DOB, address, city, state, pin code, nominee) linked to an `AppUser` with role `ROLE_CUSTOMER`.
- `StaffSpeciality` (`staff_specialities` table): one-to-one mapping of an internal-staff user to a `ProductType` (`productSpeciality`). Staff may only see, issue, and review work for that product type.
- `RefreshToken` (`refresh_tokens` table): opaque session tokens, stored as SHA-256 hash, rotated on every use; see `../01_System_Architecture/Security_Architecture.md`.
- `OtpVerification` (`otp_verifications` table): dual email+SMS 6-digit OTP for registration activation, resend, and password reset.

### Product catalogue tree

- **InsuranceProduct** (`insurance_products`): `productName` (unique, case-insensitive, stored lowercase), `productType` (`ProductType`), `description`, `isActive`.
- **PolicyPlan** (`policy_plans`): belongs to a product; `planName`, `planVersion`, `allowedDurations` (years, persisted via the `policy_plan_durations` ElementCollection table), `supportedPremiumType` (`ONE_TIME`/`ANNUAL`), `termsAndConditions`, `isActive`. See `Duration_Model.md`.
- **CoverageOption** (`coverage_options`): a purchasable sum-assured slab of a plan (`coverageAmount`, `label`, `displayOrder`, `isActive`). See `Coverage_Options.md`.
- **PricingRule** (`pricing_rules`): the actuarial inputs that turn a coverage amount into a premium — `baseRiskRate`, `processingFee`, `gst`, `effectiveFrom`/`effectiveTo`, `status`. See `Pricing_Rules.md`.
- **PricingAuditLog** (`pricing_audit_logs`): JSON change history for pricing rules.

### Quoting and policies

- **Quote** (`quotes`): a customer-scoped snapshot of a plan + coverage + duration + premium type plus the computed `riskRate`, `processingFee`, `gst`, `premium` (annual), and `total`. It pins the exact `pricingRuleId` and `planVersion` used, carries `expiresAt` (30 minutes), and transitions `CREATED → USED | EXPIRED | CANCELLED`.
- **Policy** (`policies`): the enforceable contract. Stores the full pricing snapshot (`selectedCoverage`, `premiumType`, `policyDuration`, `premiumRateUsed`, `processingFeeUsed`, `gstUsed`, `calculatedPremium`, `planVersion`, `pricingRuleId`, `quoteId`) so later price changes never alter an in-force contract. `startDate`/`endDate` bound the cover; `PolicyStatus` governs lifecycle (`PENDING_PAYMENT → ACTIVE → EXPIRED/CANCELLED`).
- **PremiumPayment** (`premium_payments`): money movements against a policy; exact-amount, globally unique `transactionReference`, `PaymentMode`, `PaymentStatus`. See `Payment_Workflow.md`.
- **Claim** (`claims`): a demand against an active policy; `claimAmount`, `claimReason`, `incidentDate`, remarks, and a strict `ClaimStatus` state machine. See `Claim_Workflow.md`.
- **ClaimDocument** (`claim_documents`): files uploaded to Cloudinary (`documentReference` = secure URL, `publicId`), linked to a claim.
- **ClaimStatusHistory** (`claim_status_histories`): append-only audit trail of every claim state change (`previousStatus`, `newStatus`, `remarks`, `updatedBy`, `updatedDate`).

### Money and numbers

- Money uses `BigDecimal` with `precision 15, scale 2` (coverage, fees, premiums, payments). Rates use `precision 10, scale 4`. All rounding is `HALF_UP`.
- Generated identifiers: policies `POL-<8 hex>`, claims `CLM-<8 hex>`, payment references `TRX-<12 hex>`.
- Enums are stored as `STRING` (`@Enumerated(EnumType.STRING)`).

### Concept → Entity mapping

| Concept | Entity / table | Notes |
|---|---|---|
| User (any role) | `AppUser` (`users`) | Unique email & mobile; BCrypt password; `tokenVersion`; verified flags |
| Customer profile | `Customer` (`customers`) | 1:1 with user; completeness gates purchases |
| Staff speciality | `StaffSpeciality` (`staff_specialities`) | 1:1 with staff user; gates issue/review/claim access |
| Session (refresh) | `RefreshToken` (`refresh_tokens`) | Opaque, hashed, rotated, 7-day TTL |
| OTP challenge | `OtpVerification` (`otp_verifications`) | Dual email+SMS, 5-min expiry, attempt counter |
| Insurance product | `InsuranceProduct` (`insurance_products`) | ProductType, name, description, active flag |
| Policy plan | `PolicyPlan` (`policy_plans`) | Durations, premium type, T&Cs, version, active flag |
| Coverage slab | `CoverageOption` (`coverage_options`) | Per-plan sum-assured ladder |
| Pricing inputs | `PricingRule` (`pricing_rules`) | Risk rate, processing fee, GST, effective window |
| Pricing change log | `PricingAuditLog` (`pricing_audit_logs`) | JSON old/new configuration, changed_by, changed_at |
| Quote | `Quote` (`quotes`) | 30-min validity; pins plan version + pricing rule |
| Policy contract | `Policy` (`policies`) | Full premium snapshot; `POL-…` number |
| Premium payment | `PremiumPayment` (`premium_payments`) | Exact-amount, `TRX-…` reference |
| Claim | `Claim` (`claims`) | `CLM-…` number; remarks; status machine |
| Claim evidence | `ClaimDocument` (`claim_documents`) | Cloudinary-backed files |
| Claim audit trail | `ClaimStatusHistory` (`claim_status_histories`) | Append-only status timeline |

## Workflow

The canonical domain flows are owned by dedicated documents:

1. Product catalogue lifecycle — `Product_Workflow.md`.
2. Quote → purchase/issue → payment → active → expired/cancelled — `Policy_Workflow.md` and `Payment_Workflow.md`.
3. Claim submission → staff review → admin decision — `Claim_Workflow.md`.
4. Premium computation and duration discounting — `Premium_Calculation.md` and `Duration_Model.md`.

## Code References

| Concern | Class (path under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`) |
|---|---|
| Entities | `model/*.java` (16 entities) |
| Enums | `enums/*.java` |
| Product service | `serviceimpl/InsuranceProductServiceImpl.java` |
| Plan service | `serviceimpl/PolicyPlanServiceImpl.java` |
| Coverage service | `serviceimpl/CoverageOptionServiceImpl.java` |
| Pricing service | `serviceimpl/PricingRuleServiceImpl.java` |
| Premium strategies | `service/strategy/PremiumCalculator.java`, `AnnualPremiumCalculator.java`, `OneTimePremiumCalculator.java`, `PremiumCalculatorFactory.java` |
| Quote service | `serviceimpl/PremiumCalculationServiceImpl.java` |
| Policy service | `serviceimpl/PolicyServiceImpl.java` |
| Payment service | `serviceimpl/PremiumPaymentServiceImpl.java` |
| Claim service | `serviceimpl/ClaimServiceImpl.java`, `serviceimpl/ClaimDocumentServiceImpl.java` |
| OTP | `verification/OtpService.java`, `verification/OtpAttemptRecorder.java` |
| Rate limiting | `config/RateLimitFilter.java` |

## Diagrams

- ER/domain model: `../09_Diagrams/ER_Diagrams/` and `../04_Database/ER_Diagram.md`.
- Class structure: `../09_Diagrams/Class_Diagrams/`.
- Request-level flows: `../09_Diagrams/Sequence_Diagrams/`.

## Best Practices

- Premium data is **snapshotted on the quote and again on the policy**, decoupling in-force contracts from later catalogue edits.
- Status is always an explicit enum stored as a string; transitions are validated in service code, and every claim transition is persisted to an audit log.
- Money never touches `double`/`float`; `BigDecimal` with `HALF_UP` rounding keeps accounting deterministic.
- Soft deactivation (`isActive`) instead of hard delete preserves history for a regulated insurance domain.

## Future Improvements

- Automatic transition of policies to `EXPIRED` at `endDate` via a scheduled job (currently enforced at the point of use).
- Policy renewal as an explicit first-class flow rather than a re-purchase.
- Distributed rate limiting (Redis-backed) as noted in `config/RateLimitFilter.java`.
- See `../10_Evaluation/Future_Enhancements.md`.

# Policy Workflow

> The full policy lifecycle from quote to purchase/issue, payment activation, and eventual expiry or cancellation, including the premium snapshot and a worked numeric example.

## Purpose

Explains how a customer moves from a quote to an in-force policy and how the policy is priced, stored, activated, and terminated. Endpoint payloads live in `../03_API/Policy_API.md`; the money math is owned by `Premium_Calculation.md`; payment mechanics by `Payment_Workflow.md`.

## Overview

A policy is a priced, dated contract for a specific customer on a specific plan. It is born `PENDING_PAYMENT`, becomes `ACTIVE` on a successful premium payment, and can be cancelled (when no open claims exist) or expire at its `endDate`. Every pricing input used at creation is snapshotted on the policy so later catalogue changes never alter an in-force contract.

## Business Context

Policies are the revenue and liability core of an insurance business. A policy must record exactly what was sold (coverage, duration, premium type) at exactly what price (rates, fees, GST, premium), so that claims, renewals, audits, and regulatory reporting are all grounded in a frozen snapshot rather than live catalogue values.

## Technical Design

### Policy status machine (`PolicyStatus`)

| From | To | Actor | Action |
|---|---|---|---|
| — | `PENDING_PAYMENT` | Customer (`POST /api/policies/purchase`) or Staff/Admin (`POST /api/policies/issue`) | Policy created from a valid quote |
| `PENDING_PAYMENT` | `ACTIVE` | Payment success (`POST /api/payments`) | First (or next) `SUCCESS` payment |
| `PENDING_PAYMENT` | `CANCELLED` | Admin/Staff (`PATCH /api/policies/{id}/cancel`) | Cancellation while unpaid, no open claims |
| `ACTIVE` | `CANCELLED` | Admin/Staff | Cancellation, blocked while open claims exist |
| `ACTIVE`/`PENDING_PAYMENT` | `EXPIRED` | Point-of-use enforcement | No background job currently flips status; `endDate` passage is enforced at claim and payment time |

Notes:

- `EXPIRED` is a real status in the enum; enforcement happens at the point of use (claims require `ACTIVE`; payments are rejected for `EXPIRED`). Auto-transition at `endDate` is a future enhancement.
- Cancellation rules: `Business_Rules.md` section 7.
- Duplicate-policy rules (HEALTH vs non-HEALTH) are enforced at purchase/issue: `Business_Rules.md` section 2.

### Premium snapshot fields on `Policy`

The following are copied from the quote at creation and never recomputed (`model/Policy.java`):

| Field | Source on quote | Meaning |
|---|---|---|
| `selectedCoverage` | `quote.coverage` | Sum assured purchased (must be an active coverage tier) |
| `premiumType` | `quote.premiumType` | `ONE_TIME` or `ANNUAL` |
| `policyDuration` | `quote.duration` | Years |
| `premiumRateUsed` | `quote.riskRate` | `baseRiskRate` in force at creation |
| `processingFeeUsed` | `quote.processingFee` | Fee in force at creation |
| `gstUsed` | `quote.gst` | GST in force at creation |
| `calculatedPremium` | `quote.total` | Total payable per payment (ONE_TIME total, or annual premium for ANNUAL) |
| `planVersion` / `pricingRuleId` / `quoteId` | quote | Lineage for audit |

Derived fields: `policyNumber` (`POL-<8 hex>` from `util/PolicyNumberGenerator.java`), `startDate` (purchase day, or a staff-supplied `startDate` on issue), `endDate = startDate.plusYears(policyDuration)`, `totalPremiumPaid` (starts `0`), and an optimistic-lock `version` column.

### Remaining claim amount

`remainingClaimAmount` is computed, not stored: `selectedCoverage − Σ(claims with status != REJECTED)` via `sumActiveClaimsByPolicyId` (see `Business_Rules.md` 5.5).

### Renewal / expiry handling

- **ANNUAL** policies are paid year by year; each successful payment keeps the policy `ACTIVE` up to `policyDuration` payments, gated by the renewal window rule (`Business_Rules.md` 4.5/4.6).
- **ONE_TIME** policies are fully paid once; a second successful payment is rejected (`Business_Rules.md` 4.4).
- Expiry: the contract ends at `endDate`; claims must fall inside the period and the policy must still be `ACTIVE` at claim time.

## Workflow

1. **Quote** — `POST /api/premium/calculate` (customer) or `POST /api/premium/admin/calculate` (admin/staff) produces a `PremiumQuote`, persists a `Quote` in `CREATED` status, valid 30 minutes.
2. **Purchase** — `POST /api/policies/purchase` (customer, body `{ quoteId }`): profile-complete check, quote ownership/status/expiry/active-plan checks, duplicate-policy check, save policy `PENDING_PAYMENT`, mark quote `USED`.
3. **Issue (staff/admin)** — `POST /api/policies/issue` (body `{ customerId, quoteId, startDate }`): same checks plus staff speciality match; start date is explicit.
4. **Pay** — `POST /api/payments` with exact `calculatedPremium`; on `SUCCESS` the policy becomes `ACTIVE`.
5. **In force** — claims can now be raised (`Claim_Workflow.md`); ANNUAL renewals re-pay within the 15-day window.
6. **Cancel** — `PATCH /api/policies/{id}/cancel` by admin/staff, blocked while open claims exist.
7. **Expire** — at `endDate` (enforced at point of use; auto-transition planned).

### Worked numeric example

Assumptions — MOTOR product, plan "motor-safe", `supportedPremiumType = ONE_TIME`, `allowedDurations = {2,3,5}`; pricing rule `baseRiskRate = 0.030`, `processingFee = 150.00`, `gst = 18.00`; coverage option `₹10,00,000 Lakhs`.

1. Customer requests `coverage = 10,00,000`, `duration = 3`, `premiumType = ONE_TIME`.
2. Calculation (`Premium_Calculation.md`): base = 10,00,000 × 0.030 = 30,000; taxable = 30,000 + 150 = 30,150; GST = 30,150 × 18 / 100 = 5,427; annual premium = 35,577; total commitment = 35,577 × 3 = 106,731; 3-year discount 5% = 5,337; **ONE_TIME total = 101,394**.
3. Quote persisted with `total = 101,394`, `expiresAt = now + 30 min`.
4. `POST /api/policies/purchase { quoteId }` → policy `POL-7E3F9A21`, `selectedCoverage = 10,00,000`, `calculatedPremium = 101,394`, `policyDuration = 3`, status `PENDING_PAYMENT`, `totalPremiumPaid = 0`, `startDate = today`, `endDate = today + 3 years`, quote marked `USED`.
5. `POST /api/payments { policyId, amount = 101,394, paymentMode = UPI, paymentStatus = SUCCESS }` → policy `ACTIVE`, `totalPremiumPaid = 101,394`.
6. Claim headroom for this policy = 10,00,000 − (open claims sum) until expiry.

## Code References

- `serviceimpl/PolicyServiceImpl.java` — purchase, issue, cancel, list, snapshot build.
- `serviceimpl/PremiumCalculationServiceImpl.java` — quote generation and expiry.
- `serviceimpl/PremiumPaymentServiceImpl.java` — payment activation.
- `model/Policy.java`, `model/Quote.java`, `enums/PolicyStatus.java`, `enums/QuoteStatus.java`.
- `util/PolicyNumberGenerator.java` — `POL-<8 hex>`.

All under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Policy lifecycle state machine: `../09_Diagrams/Activity_Diagrams/`.
- Purchase/payment sequence: `../09_Diagrams/Sequence_Diagrams/`.
- ER relationships: `../04_Database/ER_Diagram.md`.

## Best Practices

- **Snapshot-on-create**: the policy carries every pricing input used, making it immune to later catalogue edits.
- Optimistic locking (`@Version`) protects concurrent payment/update races.
- Quote single-use (`USED`) prevents double-purchasing from one quote.

## Future Improvements

- Scheduled `ACTIVE → EXPIRED` transition at `endDate`.
- First-class renewal flow (currently a re-purchase).
- See `../10_Evaluation/Future_Enhancements.md`.

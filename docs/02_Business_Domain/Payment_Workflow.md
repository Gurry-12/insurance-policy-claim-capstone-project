# Payment Workflow

> How premium payments are recorded: modes, statuses, exact-amount enforcement, policy activation, transaction references, and payment queries.

## Purpose

Describes the money-movement layer of the platform: `PremiumPayment` semantics, exact-amount activation, ONE_TIME vs ANNUAL payment constraints, `transactionReference` generation, and customer/staff payment queries. Business rules are authoritative in `Business_Rules.md` (section 4); endpoint contracts in `../03_API/Payment_API.md`.

## Overview

A `PremiumPayment` (`premium_payments` table) is a recorded money movement against a policy. Payments are made in one of four modes (`UPI`, `CARD`, `NET_BANKING`, `CASH`), with a status of `PENDING`, `SUCCESS`, or `FAILED`. A `SUCCESS` payment is what moves a policy from `PENDING_PAYMENT` to `ACTIVE`. The platform is a record-keeping layer: it does not execute the payment; it records the outcome of the external payment and validates it against the policy's computed premium.

## Business Context

Premium collection is where revenue enters the business. Exact-amount matching guarantees a customer pays precisely the quoted, GST-inclusive premium; single-payment rules for `ONE_TIME` and windowed renewals for `ANNUAL` prevent under- or over-collection; unique transaction references prevent duplicate charge recording. Policy activation is deliberately coupled to a successful payment so no cover is in force until paid.

## Technical Design

### Entity: `PremiumPayment`

| Field | Validation / notes |
|---|---|
| `policy` | `@ManyToOne policy_id`, required |
| `amount` | `@Positive`, `@NotNull`, `precision 15 scale 2` |
| `paymentDate` | defaults to now |
| `paymentMode` | `PaymentMode` {UPI, CARD, NET_BANKING, CASH}, required |
| `transactionReference` | `@NotBlank`, unique, generated `TRX-<12 hex>` (`util/TransactionReferenceGenerator.java`) |
| `paymentStatus` | `PaymentStatus` {PENDING, SUCCESS, FAILED}, required |

### Exact-amount enforcement

`PremiumPaymentServiceImpl.recordPayment` requires `policy.calculatedPremium.compareTo(dto.amount) == 0` (400 `AMOUNT_MISMATCH`). `calculatedPremium` is the quote's `total` snapshot — the full GST-inclusive payable (ONE_TIME total, or annual premium for ANNUAL).

### Payment status handling

- **PENDING / FAILED** — the payment row is saved with that status; the policy **stays `PENDING_PAYMENT`** and `totalPremiumPaid` is not incremented.
- **SUCCESS** — `totalPremiumPaid += amount`, and `policyStatus = ACTIVE`.

### Policy-state guards

- Payments are rejected for `CANCELLED` (400 `CANCELLED_POLICY_RESTRICTED`) and `EXPIRED` (400 `EXPIRED_POLICY_RESTRICTED`) policies.
- Ownership: a customer may only pay their own policy; staff only policies matching their speciality.

### ONE_TIME vs ANNUAL

| Premium type | Constraint |
|---|---|
| ONE_TIME | At most one `SUCCESS` payment per policy (400 `ONE_TIME_ALREADY_PAID`) |
| ANNUAL | Renewal restricted until the 15-day window before the first anniversary of the latest `SUCCESS` payment (400 `EARLY_PAYMENT_RESTRICTION`); successful payments must not exceed `policyDuration` (400 `ALL_PREMIUMS_PAID`) |

Additional guard: `totalPremiumPaid + amount` must not exceed `calculatedPremium × policyDuration` (400 `PREMIUM_LIMIT_EXCEEDED`).

### Transaction reference

Generated as `TRX-<first 12 hex of a UUID, uppercased>`, checked for uniqueness before insert (409 `DUPLICATE_REFERENCE` if colliding).

### Queries

| Endpoint | Roles | Purpose |
|---|---|---|
| `POST /api/payments` | CUSTOMER, INTERNAL_STAFF | Record a payment |
| `GET /api/payments/policy/{id}` | ADMIN, INTERNAL_STAFF | All payments for a policy (staff speciality-scoped) |
| `GET /api/payments/{id}` | all roles | Single payment (owner/scoping enforced) |
| `GET /api/payments/page` | ADMIN, INTERNAL_STAFF | Paginated all payments; filters `policyId`, `paymentStatus`, `transactionId`, `min/maxAmount`; staff scoped by speciality |
| `GET /api/payments/my-payments` | CUSTOMER | The customer's payment history |
| `GET /api/payments/my-policies/{policyId}` | CUSTOMER | Payments for one of the customer's policies |

## Workflow

1. Customer generates a quote and purchases/obtains a policy in `PENDING_PAYMENT` (`Policy_Workflow.md`).
2. Customer (or staff) calls `POST /api/payments` with `{ policyId, amount, paymentMode, paymentStatus }`.
3. Service validates: ownership/speciality, policy not CANCELLED/EXPIRED, `amount == calculatedPremium`, ONE_TIME/ANNUAL constraints, cumulative cap, unique reference.
4. Payment row is saved; on `SUCCESS` the policy is set to `ACTIVE` and `totalPremiumPaid` increased.
5. The policy can now accept claims; ANNUAL renewals repeat the flow within the allowed window.

### Worked example

ONE_TIME policy from `Policy_Workflow.md`: `calculatedPremium = 101,394`, duration 3 years. The customer pays exactly `101,394` via UPI; a `TRX-…` reference is generated; policy transitions `PENDING_PAYMENT → ACTIVE`; `totalPremiumPaid = 101,394`. A second `SUCCESS` payment attempt is rejected (`ONE_TIME_ALREADY_PAID`).

## Code References

- `serviceimpl/PremiumPaymentServiceImpl.java` — record, queries, scoping.
- `model/PremiumPayment.java` — entity.
- `enums/PaymentMode.java`, `enums/PaymentStatus.java`.
- `util/TransactionReferenceGenerator.java` — `TRX-<12 hex>`.
- `controller/PremiumPaymentController.java` — endpoint mapping.

All under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Payment sequence: `../09_Diagrams/Sequence_Diagrams/`.
- Payment table relationships: `../04_Database/ER_Diagram.md`.

## Best Practices

- Money is exact (`BigDecimal.compareTo`), never approximate.
- Activation is transactional and atomic with payment recording.
- Unique transaction references and cumulative caps make duplicate charging impossible at the data layer.
- Explicit PENDING/FAILED statuses keep payment attempts auditable even when they do not activate cover.

## Future Improvements

- Outbound payment gateway integration (the platform currently records outcomes).
- Automatic PENDING → FAILED reconciliation job.
- See `../10_Evaluation/Future_Enhancements.md`.

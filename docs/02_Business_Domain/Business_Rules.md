# Business Rules
> The authoritative, code-verified catalogue of every enforced business rule in the platform.

---

## Top 10 Critical Business Rules (Quick Reference)

| # | Domain | Rule | WHY it exists |
|---|---|---|---|
| 1 | **Policy** | HEALTH: a customer may hold at most one policy in `ACTIVE` or `PENDING_PAYMENT` for the same plan. | Enforces strict single-cover for health policies. |
| 2 | **Payment** | Payment amount must EXACTLY equal `policy.calculatedPremium`. | Prevents partial payments or overpayments. |
| 3 | **Payment** | ONE_TIME: at most one `SUCCESS` payment per policy. | Prevents double-charging for lump-sum plans. |
| 4 | **Claim** | `claimAmount` must not exceed `selectedCoverage - Σ(claims != REJECTED)`. | Prevents paying out more than the total sum assured. |
| 5 | **Claim** | Only staff matching the product speciality can assign/review claims. | Ensures domain expertise in investigation. |
| 6 | **Claim** | Admin decides payouts ONLY after a staff recommendation. | Maker-checker separation of duties prevents fraud. |
| 7 | **Pricing** | Each plan has exactly ONE active pricing rule at a time. | Prevents ambiguity during quote generation. |
| 8 | **Auth** | OTPs are valid for 5 minutes and fail after 5 attempts. | Standard brute-force protection. |
| 9 | **Policy** | Quotes expire exactly 30 minutes after creation. | Prevents users holding onto outdated prices. |
| 10 | **Policy** | Policy snapshots pricing fields from the quote. | Catalogue price changes never mutate in-force contracts. |

---

## Purpose
Single source of truth for business rules. All other documents reference this file instead of restating rules.

---

## Overview
Rules are grouped by domain area: Auth, Product, Policy, Payment, Claim, Pricing. They dictate exactly how the system reacts to edge cases and invalid states.

---

## Business Context
Insurance systems must guarantee: no accidental double-cover, no claims on unpaid contracts, exact money reconciliation, and separation of duties. These rules enforce those invariants.

---

## Feature Flow
N/A - General rules catalog.

---

## System Flow
N/A - General rules catalog.

---

## Sequence Diagram
N/A - General rules catalog.

---

## Architecture Diagram (if applicable)
N/A

---

## Database Design
N/A

---

## API Documentation (if applicable)
N/A

---

## Frontend Implementation (if applicable)
N/A

---

## Backend Implementation
Implemented across all service classes (e.g., `PolicyServiceImpl.java`, `ClaimServiceImpl.java`).

---

## Auth Rules
| Rule | WHY it exists |
|---|---|
| Registration requires dual Email + SMS OTP verification. | Ensures verified contact methods for legal correspondence. |
| Resend is throttled to 1 per 60s, max 4 per 24h. | Prevents SMS cost abuse and spam. |

## Product Rules
| Rule | WHY it exists |
|---|---|
| Coverage amount must be a multiple of ₹50,000, max 5 Cr. | Keeps the product catalogue sensible and bounded. |
| Cannot regenerate coverage tiers if policies have been issued. | Preserves historical data integrity for existing customers. |

## Policy Rules
| Rule | WHY it exists |
|---|---|
| Customer profile must be 100% complete before purchase. | Legal requirement for contract issuance. |
| Non-HEALTH: multiple active policies allowed, but only one `PENDING_PAYMENT`. | Prevents spamming unpaid carts. |

## Payment Rules
| Rule | WHY it exists |
|---|---|
| ANNUAL: renewals restricted until 15 days before anniversary. | Normalises revenue streams; prevents early double-payments. |
| `transactionReference` must be globally unique. | Idempotency key to prevent duplicate ledger entries. |

## Claim Rules
| Rule | WHY it exists |
|---|---|
| Incident date must be between policy start and end dates. | Core principle of insurance coverage. |
| Cannot cancel a policy if open claims exist. | Protects customer's right to claim processing even if they want out. |

## Pricing Rules
| Rule | WHY it exists |
|---|---|
| Highest-ID active rule is used for quoting. | Resolves any theoretical conflict if two rules were active. |

---

## Validation Rules
See specific domain documents.

---

## Error Handling
Rule violations throw domain exceptions which the GlobalExceptionHandler maps to HTTP 400, 403, 404, or 409.

---

## Design Decisions
N/A - Catalog document.

---

## Security (if applicable)
Rate limits (Bucket4j) are enforced at the filter level for all auth endpoints to prevent brute forcing.

---

## Code References

| Concern | Path |
|---|---|
| Services | `src/main/java/com/insurance/demo/serviceimpl/*.java` |

---

## Interview Notes
1. **How do you handle rate limiting?** Bucket4j per IP+Email applied at the filter level.
2. **Why do we snapshot pricing on the policy?** To decouple the active contract from future changes in the catalogue, maintaining legal integrity.
3. **How do you prevent duplicate payments?** We enforce an exact match of the amount, unique transaction references, and strict status checks on `ONE_TIME` vs `ANNUAL` policies.
4. **What is the difference between Health and Motor policy limits?** Health enforces strict single-cover (one active policy per plan). Motor allows multiple active policies but only one pending payment at a time.
5. **How is claim remaining balance calculated?** Deducting the sum of all non-rejected claims from the total selected coverage amount.

---

## Related Documents
- [Claim Workflow](../02_Business_Domain/Claim_Workflow.md)
- [Payment Workflow](../02_Business_Domain/Payment_Workflow.md)

---

## Future Enhancements
- Centralise rules into a dedicated rules engine (e.g., Drools) for easier maintainability.

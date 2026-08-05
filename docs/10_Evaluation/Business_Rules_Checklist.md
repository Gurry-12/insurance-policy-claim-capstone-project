# Business Rules Checklist
> Exhaustive list of domain rules and constraints enforced by the system.

---

## Purpose
To allow technical evaluators to verify that all business domain rules, constraints, and edge cases are properly handled by the backend logic.

---

## Premium & Quote Rules
- [ ] **Valid Duration:** Quotes are strictly valid for 30 minutes from creation.
- [ ] **Single Use:** A quote can only be used once to create a policy.
- [ ] **Strategy Routing:** ANNUAL payments apply annual modifiers, ONE_TIME payments apply one-time modifiers.
- [ ] **Base Minimums:** Premium cannot be negative or zero.
- [ ] **Age Modifiers:** Applicants over certain ages trigger higher multiplier rules defined in `PricingRule`.

## Payment Rules
- [ ] **Exact Match:** Incoming payment amount must exactly match the `Quote.calculatedPremium` (using `compareTo() == 0`).
- [ ] **Payment Status:** Policy is only `ACTIVE` if the payment processes successfully.

## Policy Rules
- [ ] **Duplication Lock:** A user cannot hold two `ACTIVE` policies of the same `ProductType` (e.g., two Health policies).
- [ ] **Immutability:** Once `ACTIVE`, base policy details and historical pricing snapshots cannot be altered.
- [ ] **Expiry:** Policies automatically transition to `EXPIRED` once the end date passes (requires auto-expiry scheduler to be active).

## Claim Rules
- [ ] **Active Policy Requirement:** Claims can only be filed against `ACTIVE` policies.
- [ ] **Workflow Strictness:** Claims must follow: `SUBMITTED` -> `UNDER_REVIEW` -> `RECOMMENDED_...` -> `APPROVED/REJECTED`.
- [ ] **Maker-Checker:** A claim cannot jump directly from `SUBMITTED` to `APPROVED`. It requires Staff recommendation first.
- [ ] **Amount Limit:** Claim amount cannot exceed the maximum coverage defined in the Policy.
- [ ] **Concurrency:** Claims use `@Version` to prevent two staff members from processing the same claim simultaneously.

## Security Rules
- [ ] **Deactivation:** If a user is deactivated by Admin, their session is terminated and tokens blacklisted instantly.
- [ ] **Token Rotation:** Re-using a used refresh token invalidates the entire token family.
- [ ] **OTP Expiry:** OTPs expire exactly 5 minutes after generation.
- [ ] **OTP Attempts:** Max 5 failed OTP attempts lock the verification process.

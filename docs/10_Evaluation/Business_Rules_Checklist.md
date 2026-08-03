# Business Rules Checklist

> Evaluation checklist of the business rules implemented in the service layer.
> Full detail: `../02_Business_Domain/Business_Rules.md`.

## Eligibility & Account Rules

- [ ] Purchase requires an **active** user, **active** product, and **active** plan
- [ ] Password policy: 8–64 chars, letters + digits
- [ ] Mobile: `^\+[1-9]\d{7,14}$` (E.164)
- [ ] PIN code: 6 digits starting 1–9
- [ ] Email uniqueness enforced

## OTP Rules

- [ ] 6-digit OTPs (email + phone), 5-minute expiry
- [ ] Max 5 verification attempts
- [ ] Resend cooldown 60 s
- [ ] Rate limits per IP + email (Bucket4j)

## Premium & Quote Rules

- [ ] Premium = `coverage × baseRiskRate`; taxable = base + processingFee;
      GST = 18% of taxable
- [ ] ANNUAL total = taxable + GST; ONE_TIME total =
      `annualPremium × duration × (1 − discount)` (2yr 2%, 3yr 5%, 5yr 8%, 10yr 12%…)
- [ ] Rounding HALF_UP to whole rupees
- [ ] `coverageAmount` must exactly match an active coverage option
- [ ] `duration` must be in the plan's allowed durations
- [ ] `premiumType` must match the plan's supported type
- [ ] Quote expires after 30 minutes

## Policy Rules

- [ ] Policy starts PENDING_PAYMENT; SUCCESS payment → ACTIVE
- [ ] HEALTH: no duplicate ACTIVE or PENDING_PAYMENT policy per customer+plan
- [ ] Non-HEALTH: no duplicate PENDING_PAYMENT per customer+plan
- [ ] Cancellation blocked while open claims exist
- [ ] Policy numbers unique (`POL-` + 8 hex chars)

## Payment Rules

- [ ] Amount must exactly equal the quote total
- [ ] PENDING payment keeps policy PENDING_PAYMENT; FAILED has no effect
- [ ] Unique transaction references

## Claim Rules

- [ ] Claims only on ACTIVE policies
- [ ] Incident date within the policy period and not in the future
- [ ] Claim amount ≤ remaining cover (accounting for open claims)
- [ ] At least one document required
- [ ] Documents: max size and allowed types (JPEG/PNG/PDF) enforced
- [ ] Staff may only review claims matching their `productSpeciality`
- [ ] State machine: SUBMITTED → UNDER_REVIEW → RECOMMENDED_FOR_APPROVAL /
      RECOMMENDED_FOR_REJECTION → APPROVED / REJECTED
- [ ] Every transition recorded in `claim_status_histories`

## Pricing Rules

- [ ] One active pricing rule per plan
- [ ] Every create/update logged to `pricing_audit_logs`

## Security Rules

- [ ] BCrypt password hashing
- [ ] JWT carries roles/fullName/productSpeciality/tokenVersion; tokenVersion checked per request
- [ ] Refresh token: SHA-256 hashed in DB, HttpOnly cookie, rotated each use,
      reuse → whole family revoked, 7-day TTL
- [ ] Roles: ROLE_ADMIN / ROLE_INTERNAL_STAFF / ROLE_CUSTOMER enforced

## Related

- `Business_Rules.md` — enforcement points (classes) for every rule
- `API_Checklist.md` — verify rules through endpoints

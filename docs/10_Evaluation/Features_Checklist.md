# Features Checklist

> Evaluation checklist of every implemented feature. Sources: `Features.md`,
> the frontend pages, and the API docs.

## How to use

Go through the list; each item is verifiable via the UI (`screenshots/`),
endpoints (`03_API/`), or demo data (`demo-data/`).

## Authentication & Users

- [ ] Registration with dual OTP (email + SMS) verification
- [ ] OTP resend with 60 s cooldown and 5-attempt limit
- [ ] Login issuing JWT + refresh cookie; logout
- [ ] Forgot / reset password via OTP
- [ ] Refresh-token rotation and reuse detection
- [ ] Admin creates staff accounts with product speciality
- [ ] User activate/deactivate; token-version revocation
- [ ] Seed admin auto-creation (`admin@insurance.com` / `Admin@123`)

## Catalog

- [ ] Products: create/update/activate/deactivate (5 types)
- [ ] Plans: wizard create (plan + coverage options + pricing rule), update,
      activate/deactivate
- [ ] Coverage options: per-plan CRUD, display order, regenerate ladder
- [ ] Pricing rules: CRUD + activate + preview + audit log
- [ ] Customer view limited to active products/plans/coverage

## Premium & Purchase

- [ ] Premium calculation (ANNUAL & ONE_TIME) with duration discounts
- [ ] Quote creation with 30-min validity, used/expired tracking
- [ ] Policy purchase from quote → PENDING_PAYMENT
- [ ] Staff/admin policy issuance
- [ ] Duplicate-policy guards (HEALTH vs non-HEALTH)

## Payments

- [ ] Record payment (UPI/CARD/NET_BANKING/CASH; PENDING/SUCCESS/FAILED)
- [ ] Exact-amount validation; SUCCESS activates the policy
- [ ] Payment history (my-payments, by-policy)
- [ ] PDF payment receipt

## Policies

- [ ] My policies, policy details, per-policy claims
- [ ] Policy lifecycle: PENDING_PAYMENT → ACTIVE → EXPIRED / CANCELLED
- [ ] Cancellation rules (blocked with open claims)

## Claims

- [ ] Raise claim (multipart: JSON + multiple documents → Cloudinary)
- [ ] Validation: ACTIVE policy, incident date in period, remaining cover
- [ ] Staff chain: under-review → assign → review (recommend)
- [ ] Admin final decision (APPROVED / REJECTED)
- [ ] Claim status history / audit trail
- [ ] Speciality-filtered staff queue
- [ ] PDF claim summary

## Platform

- [ ] Public stats endpoint + landing page stats
- [ ] Swagger UI
- [ ] Role-based dashboards and navigation
- [ ] Dark/light theme + role accents
- [ ] Pagination, filtering, sorting on list pages
- [ ] Transparent access-token refresh (single-flight, retry)
- [ ] Rate limiting on auth endpoints (Bucket4j)

## Related

- `../00_Project_Overview/Features.md` — detailed catalogue
- `API_Checklist.md` — endpoint-level verification
- `../../screenshots/` — UI evidence

# Features

> The feature catalogue of InsuranceFlow, grouped by role.

## Purpose

A quick, complete list of what the application can do. Detailed behaviour and
rules are documented in `02_Business_Domain/` and `08_Workflows/`.

## Common / Public

- Landing page with **live platform statistics** (products, plans, policies,
  claims) via `GET /api/public/stats`.
- **User registration** with dual OTP verification (email + SMS), login,
  forgot/reset password, refresh & logout.
- **Swagger/OpenAPI** at `/swagger-ui.html` and `/v3/api-docs`.

## Customer (ROLE_CUSTOMER)

- Complete **profile management** (name, DOB, address, city, state, pincode,
  nominee).
- Browse **active products**, view their **plans**, and inspect plan **coverage
  options**, durations, and premium type.
- Get an **instant premium quote** (choose coverage, duration, premium type)
  with a 30-minute quote validity.
- **Purchase a policy** from a quote → status `PENDING_PAYMENT`.
- **Pay premium** (UPI/CARD/NET_BANKING/CASH) → policy becomes `ACTIVE`.
- View **my policies**, policy details, and per-policy payment history.
- **Raise claims** with a reason, amount, incident date, and **document upload**
  (multiple files via Cloudinary).
- **Track claim status**, view the claim **status history / audit trail**, and
  download **PDF receipts** (policy, payment, claim, customer summary).
- **Cancel** an eligible policy (no open claims).

## Internal Staff (ROLE_INTERNAL_STAFF)

- Role-based dashboard and a **claim review queue filtered by product
  speciality** (e.g. HEALTH staff only see health claims).
- Process claims: move to **under-review**, **assign** to self, **review** and
  recommend **APPROVAL / REJECTION**.
- **Issue policies** to customers from quotes.
- View customers, policies, and payments; download PDFs.

## Admin (ROLE_ADMIN)

- Full **user management**: create **staff accounts** with a product
  speciality, list/search/paginate users, activate/deactivate users.
- **Product management**: create, update, activate/deactivate products.
- **Plan management**: wizard-based plan creation (plan + coverage options +
  pricing rule in one request), update, activate/deactivate.
- **Coverage option management**: per-plan CRUD + one-click **regenerate
  coverage ladder**.
- **Pricing rule management**: create/update/activate rules with **audit log**,
  and a **premium preview** tool.
- **Policy operations**: issue policies, view all policies/claims/payments,
  make **final claim decisions** (APPROVED / REJECTED).
- System **statistics** on the landing page.

## Cross-cutting

- **Security**: BCrypt, JWT access tokens with token-version revocation, opaque
  rotating refresh tokens (HttpOnly cookie), OTP with attempts/resend/rate
  limits, rate limiting (Bucket4j), CORS origin allowlist.
- **Auditability**: claim status history, pricing audit log, security audit
  logging.
- **Consistency**: exact-amount premium validation, coverage/duration matching,
  duplicate-policy guards, remaining-cover checks on claims.

## Related

- Feature details → `../08_Workflows/` (per-role flows) and `../03_API/`
  (endpoints)
- Feature checklist for evaluation → `../10_Evaluation/Features_Checklist.md`

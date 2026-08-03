# Future Enhancements

> Planned / scoped next steps. Implementation notes are high-level; deeper
> design lives in the referenced knowledge cards.

## Core domain

- **Policy renewals** — expiry-driven renewal quotes, auto-renewal opt-in,
  grace periods. See knowledge card
  `../12_Knowledge_Base/Backend_Policy_Lifecycle.md`.
- **Claims beyond damage claims** — hospitalisation/indemnity flows, cashless
  network, reimbursement tracking.
- **Settlement** — amount paid, transaction link, claim closure state.
- **Endorsements** — mid-term changes to coverage / sum assured.
- **Nominee / beneficiaries** on policies and claims.

## Commerce & operations

- **Payments integration** — Razorpay/Stripe/UPI gateways + webhooks, refunds,
  invoices (GST), payment ID idempotency keys.
- **Emails/SMS** — verified template delivery, OTP alternatives (TOTP app).
- **Admin analytics** — claims loss ratio, per-plan profitability, renewals
  funnel, dashboards with charts.
- **Notification centre** — in-app + email + push for claim status and due dates.

## Platform & UX

- **Document viewer** (Cloudinary) instead of download-only.
- **Search & filters** across claims/policies (severity, status, date range).
- **Bulk import/export** (CSV) for admin data operations.
- **i18n** — Hindi/English locale switch.
- **Accessibility (a11y)** audit — keyboard nav, contrast, ARIA.

## Engineering

- **Flyway/Liquibase** migrations (drop `ddl-auto=update`).
- **Test coverage expansion** — integration + e2e (Cypress/Playwright).
- **Observability** — Micrometer/Prometheus metrics, structured logging, tracing.
- **Caching** — product/plan read caches with targeted invalidation.
- **API versioning** and OpenAPI-first code generation.

## Security hardening

- **Rate limiting scope** to business actions (purchase, claim) and admin APIs.
- **Audit log query UI** (currently captured, not exposed).
- **Security headers default** (HSTS/HPKP) and XSS sanitisation tests.
- **Password-less login** (passkeys / email magic links).

## Related

- `Production_Improvements.md` — operational hardening
- `../12_Knowledge_Base/` — per-topic design notes to build on

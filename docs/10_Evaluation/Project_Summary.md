# Project Summary

> One-page executive summary for evaluators, interviewers, and recruiters.

## What It Is

**InsuranceFlow** — a full-stack **insurance policy & claim management system**
with role-based self-service for customers, a structured claim-review workflow
for internal staff, and full catalog/pricing/user administration for admins.

## The Problem It Solves

Legacy insurance shops run quoting, policy admin, payments, and claims on
disconnected tools with no self-service, no audit trail, and weak security.
InsuranceFlow digitizes the whole lifecycle.

## What Was Built

- **Customer self-service:** register (dual OTP), profile, browse products →
  plans → coverage → instant **quote** → **purchase** → **pay** → policy ACTIVE →
  **raise claim** with documents → track claim + audit history → PDF exports.
- **Staff workflow:** claim queue filtered by **product speciality**,
  under-review → assign → review → recommend; policy issuance.
- **Admin console:** users & staff management, product/plan wizard, coverage
  options + regenerate, **pricing rules with audit log** + premium preview,
  final claim decisions.
- **Security:** BCrypt, JWT access tokens with token-version revocation,
  rotating refresh tokens (HttpOnly cookie, reuse → family revocation), dual
  OTP, rate limiting (Bucket4j), RBAC, CORS allowlist, secrets via gitignored env.
- **Engineering:** layered Spring Boot backend (controller → service → serviceimpl
  → repository), Strategy pattern for premium calculation, DTOs + ModelMapper,
  global exception handling, 16-entity MySQL model, React 19 SPA with guarded
  role routes, transparent token refresh, role theming, live platform stats.

## Key Numbers

- 16 entities / 17 tables, 13 REST controllers, ~60 endpoints
- 3 roles: ADMIN, INTERNAL_STAFF, CUSTOMER
- 2 premium strategies (ONE_TIME / ANNUAL) with duration discounts
- 5 product types, 6 seeded plans, 3 claim states in review chain
- Frontend: 8 folders of services/hooks/utils, guarded routing per role

## Why It's a Strong Capstone

1. **Complete lifecycle** — from registration to claim settlement, end to end.
2. **Enterprise security** — not just login: token lifecycle, OTP, rate limits,
   audit, revocation.
3. **Real design patterns** — Strategy, Factory, Adapter, layered services,
   DTOs, repository pattern, dependency injection.
4. **Auditability** — claim status history + pricing audit log.
5. **Production-shaped docs** — this documentation tree is the single source
   of truth, plus demo data for a live evaluation.

## Quick Demo

See `demo-data/04-evaluator-demo.md` for credentials and the exact screens/data
to show, and `demo-data/03-testing-flow.md` for a curl walkthrough.

## Project Highlights

- Live public stats on the landing page.
- Wizard-based plan creation (plan + coverage + pricing in one request).
- One-click coverage-ladder regeneration.
- PDF receipts (policy/payment/claim/customer).
- Cloudinary document upload with per-product document categories.
- Refresh-token reuse detection that revokes the whole family.

## Challenges Solved

- Exact premium determinism (HALF_UP rounding, duration discounts).
- Stateless JWT + secure refresh without storing tokens in localStorage.
- Role-based UI that shares components across admin/staff.
- Keeping pricing governed (audit log, one active rule per plan).

## Related

- `Features_Checklist.md`, `Business_Rules_Checklist.md`, `API_Checklist.md`
- `Interview_Questions.md`
- `Future_Enhancements.md`, `Production_Improvements.md`

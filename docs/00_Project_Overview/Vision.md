# Vision

> Why this project exists, the problem it solves, and the success criteria.

## Purpose

Document the business problem and the product vision so that every design
decision in the codebase can be traced back to a goal.

## Problem Statement

Insurance companies typically run policy administration, premium billing, and
claims management on disconnected legacy systems or spreadsheets. This causes:

- **Slow, manual quoting** — customers cannot see a price without calling an agent.
- **No self-service** — customers cannot track their own policies or claims.
- **Fragmented claims handling** — no queued, role-based workflow with an audit trail.
- **Inconsistent pricing** — rates are not versioned, governed, or auditable.
- **Weak security posture** — passwords in plaintext, no token lifecycle management.

## Product Vision

InsuranceFlow is a **self-service digital insurance platform**:

1. **Customers** browse a governed product catalog, get instant quotes, buy
   policies, pay premiums online, raise claims with documents, and track every
   step — without contacting anyone.
2. **Internal staff** process claims through a structured review queue matched
   to their product speciality, with a complete decision audit trail.
3. **Admins** manage the catalog (products, plans, coverage options, pricing
   rules), create staff accounts, and make final claim decisions.
4. **Security is built in**: BCrypt password hashing, short-lived JWT access
   tokens, rotating refresh tokens, dual email+phone OTP verification, rate
   limiting, and role-based access control.

## Goals

- A production-shaped monorepo with clear separation of concerns.
- Enterprise-grade architecture that demonstrates real design patterns
  (Strategy, Factory, Adapter, layered services, DTOs).
- A security model that handles the complete auth lifecycle, not just login.
- Deterministic, governed premium pricing with an audit trail.
- Documentation complete enough that a new developer can contribute without
  asking questions (`docs/` is the single source of truth).

## Non-Goals

- Not a payment gateway integration — payments are recorded, not processed.
- Not a full insurance policy-administration suite (no underwriting engine,
  actuarial models, or regulatory filing).
- Not a multi-tenant SaaS — single company deployment.

## Success Criteria

- A user can complete **register → verify → quote → buy → pay → claim → decision**
  entirely through the UI.
- Every state change (policy, claim, pricing) is recorded and explainable.
- The demo data (`demo-data/`) allows an evaluator to log in and explore all
  roles in minutes.
- The documentation lets a developer return after 12 months and understand
  every design decision without reading the code first.

## Related

- `Features.md` — what was built
- `../10_Evaluation/Project_Summary.md` — measured outcomes
- `../10_Evaluation/Future_Enhancements.md` — roadmap

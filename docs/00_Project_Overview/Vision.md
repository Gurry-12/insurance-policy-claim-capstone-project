# Vision
> Why InsuranceFlow exists, the real-world problem it solves, and the fundamental design decisions that shape it.

---

## Purpose
Document the business problem and the product vision so that every design decision in the codebase can be logically traced back to a high-level goal.

---

## Overview
- **Digitizes the insurance lifecycle** from quote generation to claim payout.
- **Reduces friction** by enabling customer self-service.
- **Establishes a robust audit trail** for pricing rules and claim decisions.
- **Prioritizes enterprise security** through strict RBAC and advanced token management.

---

## Business Context & Problem Statement
Insurance companies historically run policy administration, premium billing, and claims management on disconnected legacy systems or manual spreadsheets. This causes:
- **Slow, manual quoting**: Customers cannot easily see a price without calling an agent.
- **No self-service**: Customers cannot track their own policies or upload claim evidence easily.
- **Fragmented claims handling**: No queued, role-based workflow with a definitive audit trail.
- **Inconsistent pricing**: Rates are not versioned, governed, or auditable.
- **Weak security posture**: Fragmented logins, long-lived unexpiring sessions, and lack of strong MFA.

InsuranceFlow solves this by centralizing these processes into a single, unified digital platform.

---

## Product Vision (Solution Overview)
InsuranceFlow is a **self-service digital insurance platform**:
1. **Customers** browse a governed product catalog, get instant quotes, buy policies, pay premiums online, raise claims with documents, and track every step — without contacting anyone.
2. **Internal staff** process claims through a structured review queue matched to their product speciality, with a complete decision audit trail.
3. **Admins** manage the catalog (products, plans, coverage options, pricing rules), create staff accounts, and make final claim decisions.

---

## Goals
- **Enterprise-grade Architecture**: Demonstrate real design patterns (Strategy, Factory, Adapter, layered services, DTOs).
- **Comprehensive Security Model**: Handle the complete auth lifecycle (BCrypt, short-lived JWT, opaque rotating refresh tokens, dual Email+SMS OTP, rate limiting, and RBAC).
- **Deterministic Pricing**: Ensure that every premium calculation is exactly calculated based on governed pricing rules with full auditability.
- **Exemplary Documentation**: Ensure a new developer can contribute immediately by referencing a single source of truth.

---

## Non-Goals
- **Payment Gateway Integration**: We record payments, we do not integrate with Stripe/PayPal to actually process real money.
- **Underwriting Engine**: No complex actuarial models or regulatory filing engines.
- **Multi-tenant SaaS**: This is designed as a single-company deployment.

---

## Success Criteria
- A user can complete **register → verify → quote → buy → pay → claim → decision** entirely through the UI.
- Every state change (policy, claim, pricing) is recorded and logically explainable.
- The demo data (`demo-data/`) allows an evaluator to explore all roles in under 10 minutes.
- The system prevents impossible states (e.g., duplicate active health policies, payments that don't match premiums, or claims on expired policies).

---

## Design Decisions
| Decision | Rationale | Trade-offs |
|---|---|---|
| **Separation of Frontend/Backend** | Allows building a true SPA (React) while keeping business logic secure in a Spring Boot API. | Slightly higher deployment complexity than a monolith. |
| **Strategy Pattern for Premium** | Enables clean separation between One-Time and Annual premium calculations, making it trivial to add monthly billing later. | Requires Factory overhead compared to simple `if/else`. |
| **Opaque Rotating Refresh Tokens** | Secures long-term sessions against XSS and hijacking via HttpOnly cookies and DB-hashed revocation checks. | Requires database lookups and state management for auth. |
| **Dual OTP (Email + SMS)** | Provides robust identity verification in a high-stakes financial domain. | Relies on external services (Twilio, Gmail) which can rate-limit or fail. |

---

## Related Documents
- `Features.md` — What was built.
- `../10_Evaluation/Project_Summary.md` — Measured outcomes.
- `../01_System_Architecture/High_Level_Architecture.md` — How it was built.

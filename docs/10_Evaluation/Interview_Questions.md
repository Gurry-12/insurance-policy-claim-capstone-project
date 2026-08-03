# Interview Questions

> Questions and answers for interviewers / evaluation panels, grouped by area.
> Answers link to the authoritative deep-dive docs.

## Architecture

**Q1. How is the backend layered, and why?**
Controller → Service (interface) → ServiceImpl → Repository. The interface
layer keeps contracts stable and enables strategy injection; each layer is
independently testable. See `../01_System_Architecture/Backend_Architecture.md`.

**Q2. What design patterns did you use? Give a concrete example.**
Strategy — premium calculation switches between `PremiumCalculationStrategy`
implementations for ANNUAL and ONE_TIME based on the plan's premium type,
selected at runtime via the strategy factory. See `../07_Design_Patterns/`.

**Q3. How does the premium stay deterministic across requests?**
Same inputs → same quote: BigDecimal throughout, HALF_UP rounding to whole
rupees, duration discounts applied in a fixed order, and the pricing rule is
fixed at quote time. See `../02_Business_Domain/Premium_Calculation.md`.

## Security

**Q4. How do access and refresh tokens work here?**
Access JWT (HS256, claims: roles/fullName/productSpeciality/tokenVersion) for
API authorization; refresh token stored SHA-256-hashed in DB, delivered as an
HttpOnly cookie, rotated on every use, reuse detection revokes the whole family,
7-day TTL. See `../01_System_Architecture/Security_Architecture.md` and
`../03_API/Authentication_API.md`.

**Q5. How do you revoke a logged-in user / block old tokens?**
`tokenVersion` claim. Bumping `user.tokenVersion` (deactivate, password change)
invalidates every outstanding access JWT immediately. Also rate limiting and
OTP attempt caps.

**Q6. Why is the refresh token hashed in the database?**
A leaked DB shouldn't leak usable tokens; only the SHA-256 digest is stored, so
a stolen row can't be replayed.

## Database

**Q7. Walk me through the data model.**
16 entities / 17 tables across users, profiles, products/plans/coverage,
pricing rules + audit, quotes, policies, payments, claims + status history,
refresh tokens, OTP. See `../04_Database/` and `../09_Diagrams/ER_Diagrams/`.

**Q8. How do you handle pricing audit history?**
`pricing_audit_logs` records every create/update with before/after, actor and
timestamp; enforcement in the pricing service. See
`../02_Business_Domain/Pricing_Rules.md`.

## Frontend

**Q9. How are protected routes enforced?**
`App.jsx` routes are wrapped by route guards keyed on `userContext.role`;
unauthorised roles are redirected. Axios interceptors attach the access token,
and a single-flight refresher retries 401s without user involvement. See
`../05_Frontend/Protected_Routes.md` and `State_Management.md`.

**Q10. How is state managed without a heavy state library?**
`AuthContext` + `ThemeContext` + token storage (`tokenStore`) plus focused
service hooks; each module owns its fetch logic. See
`../05_Frontend/State_Management.md`.

**Q11. How do role themes work?**
Design tokens in CSS with role-specific accent variables (admin blue, staff
violet, customer teal) selected from the auth context; a ThemeContext toggles
light/dark. See `../05_Frontend/Custom_Hooks.md`.

## Business logic

**Q12. How do you prevent a customer buying the same health plan twice?**
A policy service guard: HEALTH plans reject duplicates that are ACTIVE or
PENDING_PAYMENT for the same customer+plan. See
`../02_Business_Domain/Business_Rules.md`.

**Q13. What happens to a claim amount vs remaining cover?**
Remaining cover accounts for open claims; raising a claim beyond it is
rejected. See `../02_Business_Domain/Claim_Workflow.md`.

**Q14. Why can't staff see all claims?**
Claims are scoped to the staff member's `productSpeciality`; the admin makes
final decisions. This mirrors real underwriting segregation of duties.

## Operations

**Q15. How is this deployed and secured in production?**
Single fat jar + static `dist/` behind a TLS reverse proxy; Swagger off,
admin auto-seed off, secure refresh cookie, strict CSP, env-based secrets.
See `../11_Developer_Guide/Deployment.md`.

**Q16. What's your biggest design trade-off?**
`ddl-auto=update` for a capstone is fast but loses strict migration control —
the honest fix is Flyway/Liquibase in production (see
`Production_Improvements.md`).

## Behavioral

**Q17. What was the hardest bug you fixed?**
Plausible answers from this project: refresh-token family revocation on reuse,
exact-premium drift from floating-point arithmetic, CORS + cookie SameSite in
dev/prod, and the wizard ordering (plan → coverage → pricing) consistency.

**Q18. What would you add with more time?**
See `Future_Enhancements.md` (messaging, renewals, document viewer, etc.).

## Related

- All answers expand into `../02_…`, `../03_API/`, `../04_Database/`,
  `../05_Frontend/`, `../07_Design_Patterns/`, `../08_Workflows/`.

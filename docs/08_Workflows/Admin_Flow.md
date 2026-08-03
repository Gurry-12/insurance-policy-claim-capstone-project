# Admin Flow

> The admin's operational narrative: seeding, staff provisioning, catalogue management (products, plans, coverage, pricing), customer/policy oversight, policy issuance, and final claim decisions.

## Purpose

Explains how a `ROLE_ADMIN` operator runs the platform through the `/admin/*` console. It is the flow narrative for the endpoints in `../03_API/*` (users, products, plans, coverage, pricing, policies, claims, payments) and implements the business rules in `../02_Business_Domain/Business_Rules.md`. Admin is the only role that can manage users and catalogue items and make final claim decisions.

## Overview

A seeded admin signs in and from the dashboard (`/admin/dashboard`) reaches every administration surface: user and customer directories, product/plan/coverage/pricing management, all policies and payments, and claim adjudication. Staff are created with a `productSpeciality` and activate through the same dual-OTP flow as customers. The admin alone can create/activate/deactivate products and plans, manage pricing rules, and set a claim's final `APPROVED`/`REJECTED` status.

## Business Context

Separation of duties is the design goal. Staff investigate and recommend; admin decides. Only the admin holds catalogue control (what is sold, at what price, under which coverage options) and user control (who may log in). All of the admin's sensitive actions — user activation/deactivation, claim decisions — are written to the `SecurityAuditLogger` and claim/pricing audit trails for accountability.

## Technical Design

### Access

- Backend port **8081**, `/api` prefix; every endpoint below is `@PreAuthorize("hasRole('ADMIN')")` unless noted.
- Seeded admin: `admin@insurance.com` / `Admin@123`, created by `config/DataInitializer.java` (controllable via `app.security.seed-admin.enabled`). The seed log reminds operators to change the default password; the operator password reset uses the public dual-OTP flow (`/forgot-password` → `/reset-password`).
- Frontend namespace `/admin/*` is guarded by `RoleProtectedRoute allowedRole={ROLES.ADMIN}`.

### Capability matrix

| Capability | UI route | Endpoint |
|---|---|---|
| Login / session | `/login` | `POST /api/auth/login` |
| Dashboard | `/admin/dashboard` | aggregate views from the services below |
| List / paginate users | `/admin/users`, `/admin/users/:id` | `GET /api/users`, `GET /api/users/page`, `GET /api/users/{id}` |
| Activate / deactivate user | `/admin/users/:id` | `PATCH /api/users/{id}/activate`, `PATCH /api/users/{id}/deactivate` |
| Create staff (with `productSpeciality`) | `/admin/users/create` | `POST /api/users/staff` |
| View customers | `/admin/customers`, `/admin/customers/:id` | `GET /api/customers`, `GET /api/customers/page`, `GET /api/customers/{customerId}` |
| Manage products | `/admin/products`, `/admin/products/create`, `/admin/products/edit/:id`, `/admin/products/:id` | `POST /api/products`, `PUT /api/products/{id}`, `PATCH /api/products/{id}/activate`, `PATCH /api/products/{id}/deactivate`, `GET /api/products/{id}`, `GET /api/products/page` |
| Manage plans | `/admin/plans`, `/admin/plans/create`, `/admin/plans/edit/:id`, `/admin/plans/:id` | `POST /api/plans/wizard`, `PUT /api/plans/{planId}`, `PATCH /api/plans/{planId}/activate`, `PATCH /api/plans/{planId}/deactivate`, `GET /api/plans/{planId}`, `GET /api/plans/page` |
| Manage coverage options | plan detail page | `POST/PUT/GET /api/admin/policy-plans/{planId}/coverage-options[...]`, `PATCH .../{optionId}/activate`, `.../deactivate`, `DELETE .../{optionId}`, `POST .../regenerate` |
| Manage pricing rules | plan detail / pricing screens | `POST /api/admin/pricing-rules`, `PUT /{ruleId}`, `GET /{ruleId}`, `GET ?planId=&status=`, `PATCH /{ruleId}/activate`, `PATCH /{ruleId}/deactivate`, `DELETE /{ruleId}`, `GET /{ruleId}/history`, `GET /plan/{planId}/active`, `POST /preview` |
| Admin premium preview | — | `POST /api/premium/admin/calculate` (`generateQuoteForCustomer`) |
| View all policies | `/admin/policies`, `/admin/policies/:id` | `GET /api/policies`, `GET /api/policies/{policyId}`, `GET /api/policies/customer/{customerId}`, `GET /api/policies/{policyId}/claims` |
| Issue policy | `/admin/policies/issue` | `POST /api/policies/issue` |
| Cancel policy | `/admin/policies/:id` | `PATCH /api/policies/{policyId}/cancel` |
| View claims / make final decision | `/admin/claims`, `/admin/claims/:id` | `GET /api/claims`, `GET /api/claims/{claimId}`, `GET /api/claims/{claimId}/history`, `PATCH /api/claims/{claimId}/final-decision` |
| View payments | `/admin/payments` | `GET /api/payments/page`, `GET /api/payments/{id}`, `GET /api/payments/policy/{id}` |

### Notes on admin-specific behaviour

- **Create staff** (`UserServiceImpl.createInternalStaffUser`): role `ROLE_INTERNAL_STAFF`, `productSpeciality` stored on the `StaffSpeciality` entity, `isActive=false`; an OTP is sent and the staff member activates it themselves. There is no admin-initiated staff password setter — staff passwords are reset through the same public `/forgot-password` → `/reset-password` dual-OTP flow.
- **User lifecycle** (`UserServiceImpl.activateUser/deactivateUser`): cannot operate on the admin's own account. Deactivation bumps `tokenVersion` and revokes all active refresh tokens, instantly logging the user out everywhere.
- **Pricing rules** (`PricingRuleServiceImpl`): each plan keeps exactly one `ACTIVE` rule; the admin must deactivate the current rule before activating a replacement. Every create/update/activate/deactivate writes a `PricingAuditLog` row. Referenced rules cannot be deleted.
- **Final claim decision** (`ClaimServiceImpl.finalDecision`): only from `RECOMMENDED_FOR_APPROVAL` / `RECOMMENDED_FOR_REJECTION`, and only to `APPROVED` / `REJECTED`; terminal states are immutable.
- **Issue policy** (`PolicyServiceImpl.issuePolicy`): requires a complete customer profile and an owned, `CREATED`, unexpired quote; produces `PENDING_PAYMENT`. The admin is not bound by staff speciality scoping.

## Workflow

1. **Seed admin login** — `admin@insurance.com` / `Admin@123` on `/login`; change the password immediately via `/forgot-password`.
2. **Provision staff** — `/admin/users/create` → `POST /api/users/staff` with name, email, mobile, password, and `productSpeciality` (HEALTH/MOTOR/LIFE/TRAVEL/INSURANCE). The new staff account activates via its OTP.
3. **Manage users & customers** — `/admin/users` (activate/deactivate any account except your own), `/admin/customers` (browse profile completeness before issuing).
4. **Manage catalogue** — create/edit products (`ProductType`), create plans via the wizard (allowed durations, supported premium type, coverage regeneration), toggle plan/product active state, and configure coverage options per plan.
5. **Configure pricing** — create a rule for a plan (or accept product-type defaults), preview its premium impact, deactivate the old active rule, activate the new one; review `GET /{ruleId}/history` for the audit trail.
6. **Oversee operations** — view all policies (`/admin/policies`), payments (`/admin/payments`), and claims (`/admin/claims`); drill into detail pages; issue policies for walk-in customers with a valid quote (`/admin/policies/issue`); cancel policies (blocked while open claims exist).
7. **Adjudicate claims** — on a claim detail page, read the staff recommendation and remarks, then `PATCH .../final-decision` with `APPROVED` or `REJECTED` (the only legal values).

```mermaid
flowchart TD
    Start([Admin logs in]) --> Seed[admin@insurance.com / Admin@123]
    Seed --> Dash[/admin/dashboard/]

    Dash --> Staff[Create staff with productSpeciality]
    Staff --> StaffOTP[Staff activates via dual OTP]

    Dash --> Users[Manage users: activate / deactivate]
    Users --> UsersLock[tokenVersion bump + refresh tokens revoked]

    Dash --> Products[Manage products]
    Products --> Plans[Manage plans + coverage options]
    Plans --> Pricing[Manage pricing rules]

    Pricing --> PrCheck{Plan has an\nACTIVE rule?}
    PrCheck -- no --> PrActive[New rule created ACTIVE]
    PrCheck -- yes --> PrInactive[New rule created INACTIVE]
    PrInactive --> PrSwap[Deactivate current rule, then activate new one]
    PrActive --> PrAudit[PricingAuditLog written]
    PrSwap --> PrAudit

    Dash --> Policies[View all policies / customers]
    Policies --> Issue[Issue policy via quote]
    Issue --> Pending[Policy PENDING_PAYMENT]

    Dash --> Claims[View all claims]
    Claims --> Decision{Staff already\nrecommended?}
    Decision -- yes --> Final[Final decision APPROVED / REJECTED]
    Decision -- no --> Block[Blocked: must be reviewed first]
    Final --> History[ClaimStatusHistory recorded]
```

## Code References

- `controller/{UserController,InsuranceProductController,PolicyPlanController,CoverageOptionController,PricingRuleController,PolicyController,ClaimController,PremiumPaymentController,PremiumCalculationController}.java`.
- `serviceimpl/{UserServiceImpl,InsuranceProductServiceImpl,PolicyPlanServiceImpl,CoverageOptionServiceImpl,PricingRuleServiceImpl,PolicyServiceImpl,ClaimServiceImpl,PremiumPaymentServiceImpl,PremiumCalculationServiceImpl}.java`.
- `config/DataInitializer.java` (seed admin), `config/SecurityAuditLogger.java`, `serviceimpl/RefreshTokenService` usage in `UserServiceImpl`.
- Frontend: `src/pages/admin/**` (`AdminDashboard`, `users/*`, `customers/*`, `products/*`, `plans/*`, `policies/*`, `claims/*`, `payments/*`).

All backend paths under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Claim adjudication sequence: `../08_Workflows/Claim_Flow.md`.
- Pricing lifecycle: `../08_Workflows/Pricing_Flow.md`, `../02_Business_Domain/Pricing_Rules.md`.
- Supporting activity diagrams: `../09_Diagrams/Activity_Diagrams/`.

## Best Practices

- Separation of duties: staff recommend, admin decides; the final-decision endpoint accepts only `APPROVED`/`REJECTED` and only after a staff recommendation.
- Catalogue edits never mutate in-force contracts — quotes and policies carry pricing snapshots, so price changes only affect future purchases.
- Every privilege escalation (activation/deactivation, password reset) is audit-logged and bumps `tokenVersion`.
- One-active-rule-per-plan keeps pricing unambiguous and forces explicit "swap" operations.

## Future Improvements

- Admin-initiated staff password reset with forced change on first login.
- Approval workflows with comments and rework loops for rejected claims.
- Bulk policy issuance and CSV export for reporting.
- See `../10_Evaluation/Future_Enhancements.md`.

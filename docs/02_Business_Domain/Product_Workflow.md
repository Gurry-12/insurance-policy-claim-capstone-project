# Product Workflow

> The admin-driven lifecycle of insurance products: create, update, activate, deactivate, and list, plus how plans attach and what customers actually see.

## Purpose

Describes how `InsuranceProduct` is administered, validated, and surfaced to customers. It is the entry point of the product catalogue tree; plan and coverage mechanics live in `../04_Database/Table_Descriptions.md`, `Pricing_Rules.md`, and `Coverage_Options.md`.

## Overview

An `InsuranceProduct` (`insurance_products` table) is a family of insurance (`ProductType`), with a display name, description, and an `isActive` flag. Products are created and maintained only by `ROLE_ADMIN`. `PolicyPlan` records hang off a product; the plan is where durations, coverage tiers, and pricing rules are configured. Customers only see products that are active **and** that carry at least one active plan.

## Business Context

Products are long-lived commercial offers. Deactivating a product stops new business without destroying historical policies — an insurance back-office must never break records of issued policies. `ProductType` also drives staff speciality matching and duplicate-policy behaviour (see `Business_Rules.md`), so it is immutable in practice after creation.

## Technical Design

### Entity: `InsuranceProduct`

| Field | Rules (from `model/InsuranceProduct.java`) |
|---|---|
| `productName` | `@NotBlank`, 2–100 chars, unique case-insensitive; stored lowercase |
| `productType` | `@NotNull`, `ProductType` {HEALTH, MOTOR, LIFE, TRAVEL, INSURANCE} |
| `description` | `@NotBlank`, min 10 chars |
| `isActive` | `@NotNull`, default `true` |
| `createdDate` / `updatedDate` | auto-maintained timestamps |

`ProductType` enum: `HEALTH`, `MOTOR`, `LIFE`, `TRAVEL`, `INSURANCE`.

### How plans attach

- `PolicyPlan.insuranceProduct` (`@ManyToOne` on `product_id`) links a plan to exactly one product.
- `PolicyPlanServiceImpl.createPolicyPlan` requires the product to exist and be active (`UNDER_INACTIVE_PRODUCT` error otherwise).
- `PolicyPlanServiceImpl.updatePolicyPlan` allows re-linking a plan to another product only if that product is active.
- Plan creation is a wizard (`POST /api/plans/wizard`) that atomically creates the plan, its coverage options, and a pricing rule — a plan without a pricing rule is rejected (`Pricing rule is required to create a policy plan`).

### Customer-facing visibility

- `GET /api/products/active` returns only products with `isActive = true` **and** at least one active plan (`findByInsuranceProductIdAndIsActiveTrue`).
- `GET /api/products/{id}` hides inactive products from customers (returns 404 to `ROLE_CUSTOMER`).
- Staff see products/plans only within their `productSpeciality`; a staff user without a speciality sees an empty list.
- Active-plan listing filters out inactive coverage options for customers.

### Validation summary

- Duplicate product name (case-insensitive) → 409 `ALREADY_EXISTS`.
- `activeStatus` field on create defaults to `true` when omitted.
- Update preserves `productType` semantics; `activeStatus` is optional on update.

## Workflow

1. **Create** — `POST /api/products` (ADMIN). Duplicate-name check → validate fields → persist with `isActive` (default true) → 201.
2. **List** — `GET /api/products/page` (ADMIN/INTERNAL_STAFF) paginated with filters `productType`, `isActive`, `productName`. Customers use `GET /api/products/active`.
3. **View** — `GET /api/products/{id}` (all roles; customers restricted to active).
4. **Update** — `PUT /api/products/{id}` (ADMIN). Duplicate-name check excluding self → update name/type/description, optional `activeStatus`.
5. **Deactivate** — `PATCH /api/products/{id}/deactivate` (ADMIN). Already-inactive → 400 `ALREADY_INACTIVE`; else `isActive=false`.
6. **Activate** — `PATCH /api/products/{id}/activate` (ADMIN). Already-active → 400 `ALREADY_ACTIVE`; else `isActive=true`.
7. **Attach plans** — `POST /api/plans/wizard` under the product; deactivating a product blocks creating new plans under it.

## Code References

- `serviceimpl/InsuranceProductServiceImpl.java` — CRUD, activation, visibility.
- `serviceimpl/PolicyPlanServiceImpl.java` — plan attachment, wizard, staff scoping.
- `model/InsuranceProduct.java`, `model/PolicyPlan.java` — entities.
- `enums/ProductType.java` — product types.

All under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- ER relationships product ↔ plan ↔ coverage ↔ pricing: `../04_Database/ER_Diagram.md` and `../09_Diagrams/ER_Diagrams/`.
- Admin product lifecycle activity flow: `../09_Diagrams/Activity_Diagrams/`.

## Best Practices

- Soft deactivation over hard delete preserves policy history (see `../01_System_Architecture/Database_Architecture.md`).
- Case-insensitive uniqueness normalised to lowercase avoids duplicate catalogue entries.
- Product activation is idempotent and validated, matching the `isActive` boolean pattern used across plans, coverage options, and users.

## Future Improvements

- Add effective-dated catalogue changes and versioned products.
- See `../10_Evaluation/Future_Enhancements.md`.

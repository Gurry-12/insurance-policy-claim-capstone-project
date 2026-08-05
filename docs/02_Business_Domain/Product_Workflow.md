# Product Workflow
> The admin-driven lifecycle of insurance products and how they form the top of the catalogue hierarchy.

---

## Purpose
Describes how products are administered, validated, and surfaced to customers as the entry point of the product catalogue tree.

---

## Overview
An `InsuranceProduct` is a high-level family of insurance (e.g., Health, Motor). Plans, coverage options, and pricing rules are all ultimately nested under a product.

---

## Business Context
Products are long-lived commercial offers. Deactivating a product stops new business without destroying historical policies.

---

## Feature Flow
```mermaid
flowchart TD
    Admin[Admin] -->|Creates| Prod[Product]
    Admin -->|Creates| Plan[Plan (Wizard)]
    Plan --> Cov[Coverage Options]
    Plan --> Rule[Pricing Rule]
    Prod --> Plan
    Cust[Customer] -->|Views| Cat[Active Products with >= 1 Active Plan]
```

---

## System Flow
N/A

---

## Sequence Diagram
N/A

---

## Architecture Diagram (if applicable)
N/A

---

## Database Design

| Field | Rules |
|---|---|
| `productName` | Unique case-insensitive, stored lowercase. |

---

## API Documentation (if applicable)
- `POST /api/plans/wizard`: Atomically creates a plan, its coverage options, and a pricing rule.

---

## Frontend Implementation (if applicable)
N/A

---

## Backend Implementation
Implemented in `InsuranceProductServiceImpl.java`.

---

## Business Rules

| Rule | WHY it exists |
|---|---|
| Customers only see products with `isActive=true` AND at least one active plan. | Prevents customers clicking into empty product categories. |

---

## Validation Rules
N/A

---

## Error Handling
409 Conflict if product name already exists.

---

## Design Decisions

- **Why soft delete (`isActive`)?** 
  In a regulated industry, if we HARD delete a product, we break the foreign key relations for all historical policies that belong to it. Soft delete hides it from new business while keeping history intact.
- **Why wizard-based plan creation?** 
  A plan is useless without at least one coverage tier and one pricing rule. By forcing creation through a wizard API, we guarantee that no "orphan" or unsellable plans exist in the database.

---

## Security (if applicable)
Product creation is `ROLE_ADMIN` only.

---

## Code References

| Concern | Path |
|---|---|
| Service | `src/main/java/com/insurance/demo/serviceimpl/InsuranceProductServiceImpl.java` |

---

## Interview Notes
(Implicit in design decisions).

---

## Related Documents
- [Insurance Domain](../02_Business_Domain/Insurance_Domain.md)

---

## Future Enhancements
- Versioned products.

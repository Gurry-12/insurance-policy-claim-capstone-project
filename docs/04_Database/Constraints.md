</Agent System Instructions>
<Constraints>
> Data integrity guardrails defined at the database level.

---

## Purpose
Documents the strict rules enforced by MySQL to prevent invalid data states, orphaned records, and duplicate entries.

---

## Overview
- Defines Unique constraints.
- Defines NOT NULL rules.
- Documents Check constraints and foreign key behaviors.
- Explains the architectural decision behind soft deletes.

---

## Business Context
While Java Spring Boot performs extensive business validation, the database constraints serve as the final line of defense against bugs, race conditions, or manual DBA interventions.

---

## Database Design

### Unique Constraints

| Table | Column | Why |
|-------|--------|-----|
| `users` | `email` | Ensures no two accounts share a login. Required for Spring Security authentication. |
| `claims` | `claim_number` | Alphanumeric identifier given to customers; must be globally unique for tracking. |
| `refresh_tokens` | `token_hash` | Prevents token collision. |

### NOT NULL Constraints

| Table | Column | Why |
|-------|--------|-----|
| `quotes` | `calculated_premium` | A quote without a price is invalid business logic. |
| `policies`| `status` | System must always know if a policy is ACTIVE or EXPIRED. |
| `claims` | `amount_requested` | Cannot file a claim without asking for a specific payout. |

### Check Constraints
- `payments.amount > 0`: Payments must be positive.
- `quotes.expires_at > current_timestamp`: (Application level, backed by DB dates) Ensures quotes don't expire before they are created.

---

## Design Decisions
- **Why soft delete (`is_active` flag) instead of hard delete (`DELETE` statement)?**
  In the insurance domain, deleting a user account via a hard delete would either violate foreign key constraints (if they have policies) or cascade and delete legal financial records (if cascading is on). Soft deletes maintain referential integrity and comply with financial auditing regulations. We filter these out at the repository level using Hibernate `@Where(clause = "is_active = true")`.

---

## Interview Notes
1. **If you have validation in Spring Boot, why add constraints in the database?**  
   Defense in depth. If multiple instances of the backend are running, race conditions could bypass application-level uniqueness checks. The database is the single source of truth.
2. **How does soft delete affect your queries?**  
   It requires every query on that table to include `WHERE is_active = true`. I automate this using Hibernate's `@SQLRestriction` or `@Where` annotations so developers don't forget it.

---

## Related Documents
- `../04_Database/Table_Descriptions.md`

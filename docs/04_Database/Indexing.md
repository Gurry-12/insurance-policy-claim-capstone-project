> Database performance tuning through strategic B-Tree indexing on MySQL 8.0.

---

## Purpose
This document details the indexing architecture implemented in MySQL via JPA `@Table(indexes = { @Index(...) })` annotations to eliminate Full Table Scans ($O(N)$) and ensure sub-millisecond query lookups ($O(\log N)$).

---

## Overview
- **Foreign Key Indexing**: Speeds up relational `JOIN` operations across Customer, Policy, and Claim tables.
- **Filter-Clause Indexing**: Accelerates `WHERE` filtering on status, city, state, and role columns.
- **Unique Constraint Indexing**: Automatically creates underlying B-Trees on `email`, `mobile_number`, `policy_number`, `claim_number`, and `token_hash`.
- **Write Performance Balance**: Avoids over-indexing to keep `INSERT`, `UPDATE`, and `DELETE` transactions fast.

---

## Business Context
As the volume of policies, payments, and claims grows, customer and agent dashboards must remain responsive. Indexing high-frequency query columns ensures that filtering 100,000 policies by status or customer ID executes in milliseconds rather than causing database bottlenecks.

---

## Entity-Wise Index Mapping

### 1. Identity & Customer KYC
| Table | Index Name | Indexed Columns | Query Pattern & Purpose |
|:---|:---|:---|:---|
| `users` | `idx_user_role` | `role` | Admin filtering users by role (`ROLE_CUSTOMER`, `ROLE_INTERNAL_STAFF`). |
| `users` | `idx_user_is_active` | `is_active` | Filtering active accounts; checking login eligibility. |
| `customers` | `idx_customer_user_id` | `user_id` | Linking customer profile to authenticated `AppUser` ($O(1)$ lookup). |
| `customers` | `idx_customer_city_state` | `city`, `state` | Regional reporting and geographic customer lookups. |
| `staff_specialities` | `idx_staff_user_id` | `user_id` | Resolving staff domain speciality (`HEALTH`, `MOTOR`, etc.). |

### 2. Product & Plan Catalog
| Table | Index Name | Indexed Columns | Query Pattern & Purpose |
|:---|:---|:---|:---|
| `insurance_products` | `idx_product_type_active` | `product_type`, `is_active` | Fetching active products for public catalog. |
| `policy_plans` | `idx_plan_product_id` | `product_id`, `is_active` | Loading all active plans under a selected product category. |
| `coverage_options` | `idx_coverage_plan_id` | `plan_id` | Loading selectable sum assured tiers (₹3L, ₹5L, ₹10L) for a plan. |
| `pricing_rules` | `idx_pricing_plan_status` | `plan_id`, `status` | Strategy pricing engine resolving the single `ACTIVE` rate formula. |

### 3. Sales, Policies & Payments
| Table | Index Name | Indexed Columns | Query Pattern & Purpose |
|:---|:---|:---|:---|
| `quotes` | `idx_quote_customer_plan` | `customer_id`, `plan_id`, `status` | Checking transient 30-minute quote validity during checkout. |
| `policies` | `idx_policy_customer_id` | `customer_id` | Loading Customer Dashboard policy ledger. |
| `policies` | `idx_policy_status` | `policy_status` | Admin & Staff filtering policies (`PENDING_PAYMENT`, `ACTIVE`, `CANCELLED`). |
| `policies` | `idx_policy_plan_id` | `plan_id` | Anti-duplicate active health policy verification query. |
| `premium_payments` | `idx_payment_policy_id` | `policy_id` | Fetching payment installment history for a policy. |
| `premium_payments` | `idx_payment_status` | `payment_status` | Verifying if one-time premium has already been paid (`SUCCESS`). |

### 4. Claims & Evidence Subsystem
| Table | Index Name | Indexed Columns | Query Pattern & Purpose |
|:---|:---|:---|:---|
| `claims` | `idx_claim_policy_id` | `policy_id` | Calculating remaining coverage (`selectedCoverage - sum(activeClaims)`). |
| `claims` | `idx_claim_status` | `claim_status` | Staff queue filtering (`SUBMITTED`, `UNDER_REVIEW`, `RECOMMENDED_*`). |
| `claim_documents` | `idx_claim_doc_claim_id` | `claim_id` | Loading attached Cloudinary evidence URLs for a claim. |
| `claim_status_histories` | `idx_csh_claim_id` | `claim_id` | Rendering chronological audit timeline UI. |

---

## Technical Implementation (JPA)

Indexes are declared directly on JPA entity headers using Jakarta Persistence annotations:

```java
@Entity
@Table(name = "policies", indexes = {
    @Index(name = "idx_policy_customer_id", columnList = "customer_id"),
    @Index(name = "idx_policy_status", columnList = "policy_status"),
    @Index(name = "idx_policy_plan_id", columnList = "plan_id")
})
public class Policy { ... }
```

---

## Design Decisions & Trade-Offs

1. **Why not index every column?**  
   Every B-Tree index consumes disk space and adds write overhead to `INSERT` and `UPDATE` queries (as the tree must be rebalanced). We only index columns with high query frequency and high selectivity.
2. **Why B-Tree instead of Hash indexes?**  
   MySQL InnoDB uses B+ Trees by default. B+ Trees support range queries (`incident_date BETWEEN x AND y`, `created_date >= z`), sorting (`ORDER BY id DESC`), and exact equality lookups efficiently.
3. **Handling Foreign Keys:**  
   MySQL requires indexing foreign key columns to avoid full table locks during cascade and join operations.

---

## Interview Notes
1. **Q: What is a B-Tree index and how does it improve query speed?**  
   **A:** A self-balancing search tree that keeps data sorted and allows search, sequential access, insertions, and deletions in logarithmic time ($O(\log N)$) instead of scanning every row ($O(N)$).
2. **Q: What is the downside of having too many indexes?**  
   **A:** Slower write performance (`INSERT`/`UPDATE`/`DELETE`) and increased RAM/disk footprint.
3. **Q: How does Hibernate handle index creation?**  
   **A:** When `spring.jpa.hibernate.ddl-auto=update` is enabled, Hibernate generates the corresponding `CREATE INDEX` SQL statements during startup based on `@Table(indexes = { ... })`.

---

## Related Documents
- `../04_Database/Table_Descriptions.md`
- `../04_Database/Entity_Relationships.md`
- `../11_Knowledge_Base/Database_Indexing.md`

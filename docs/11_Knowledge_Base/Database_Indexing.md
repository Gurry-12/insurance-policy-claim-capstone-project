# 🗄️ Database Indexing & Performance Tuning

> **Layer:** Persistence / Performance Optimization  
> **Database:** MySQL 8.0 (InnoDB Engine)  
> **JPA Annotation:** `@Table(indexes = { @Index(...) })`

---

## 1. What is Database Indexing?

A database index is a specialized **B+ Tree data structure** that maintains a sorted reference to rows in a table. It allows the database engine to find specific rows in **logarithmic time ($O(\log N)$)** instead of scanning every single row in the table (**Full Table Scan $O(N)$**).

---

## 2. When to Create an Index

| Column Type | Index Recommendation | Example in our Project |
|:---|:---:|:---|
| **Foreign Keys** | **Must Index** | `policies(customer_id)`, `claims(policy_id)` |
| **High-Frequency `WHERE` Filters** | **Must Index** | `policies(policy_status)`, `claims(claim_status)` |
| **Unique Identifiers** | **Auto-Indexed** | `users(email)`, `policies(policy_number)` |
| **Low Cardinality (e.g. Boolean)** | **Avoid Indexing** | Avoid single-column index on `is_active` unless paired with high-cardinality column |
| **Frequently Updated Columns** | **Avoid Indexing** | Reduces write performance |

---

## 3. Indexes Configured in our System

```java
// Example from Policy.java
@Entity
@Table(name = "policies", indexes = {
    @Index(name = "idx_policy_customer_id", columnList = "customer_id"),
    @Index(name = "idx_policy_status", columnList = "policy_status"),
    @Index(name = "idx_policy_plan_id", columnList = "plan_id")
})
public class Policy { ... }
```

### Key Performance Impacts
- **Customer Dashboard:** `findByCustomer_User_Email()` executes in **< 5ms** because `customer_id` is indexed.
- **Staff Claim Queue:** `findByClaimStatus()` filters 50,000 claims in **< 2ms** via `idx_claim_status`.
- **Anti-Duplicate Check:** `existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn()` executes in **< 1ms** by combining index lookups on `customer_id`, `plan_id`, and `policy_status`.

---

## 4. Write Overhead & Trade-Offs

- **Read Operations (`SELECT`):** Massively accelerated.
- **Write Operations (`INSERT`, `UPDATE`, `DELETE`):** Slightly slower because MySQL must update both the table data and rebalance the B+ Tree index.
- **Design Balance:** We only indexed columns involved in `WHERE`, `JOIN`, and `ORDER BY` operations.

---

## 5. Interview Questions & Answers

1. **Q: Why does a B+ Tree provide faster lookups than a linear scan?**  
   **A:** A linear scan checks every row ($N$ operations). A B+ Tree divides the search space at each tree node level, requiring only $\log_B N$ comparisons (typically 3 to 4 disk reads for millions of rows).
2. **Q: What is a Composite Index?**  
   **A:** An index created on multiple columns together (e.g. `@Index(columnList = "product_type, is_active")`). It accelerates queries that filter by both columns simultaneously.

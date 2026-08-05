</Agent System Instructions>
<Indexing>
> Database performance tuning through strategic indexing.

---

## Purpose
This document details the indexes created in the MySQL database to optimize query performance, especially for read-heavy operations like authentication and policy lookups.

---

## Overview
- Identifies primary and secondary indexes.
- Explains the query patterns driving index creation.
- Discusses the performance trade-offs of indexing.

---

## Business Context
As the user base grows, searching for a user by email during login or fetching a user's policies must remain fast. Slow database queries directly translate to a sluggish UI and poor customer experience.

---

## Database Design

### Indexes and Query Patterns

| Table | Index Column(s) | Query Pattern | Impact |
|-------|-----------------|---------------|--------|
| `users` | `email` (Unique) | `findByEmail()` during login. | Extremely high. Prevents full table scan on every login attempt. |
| `policies` | `user_id` | `findByUserId()` for customer dashboard. | High. Users frequently check their active policies. |
| `claims` | `claim_number` | `findByClaimNumber()` for claim tracking. | High. Fast lookup for customer support staff. |
| `refresh_tokens` | `user_id` | Deleting old tokens when a user logs out. | Medium. Improves logout performance. |

---

## Design Decisions
- **Which queries drive each index decision?**  
  We indexed columns involved in `WHERE` clauses of our most frequent queries. For instance, Spring Security requires fetching the user by email on every authenticated request (if not cached). A full table scan here would cripple performance.
- **Why not index every column?**  
  Every index slows down `INSERT`, `UPDATE`, and `DELETE` operations because the B-Tree must be rebalanced. We deliberately did NOT index columns like `status` if the cardinality is low (e.g., only 3 statuses) because the database engine might ignore the index anyway.

---

## Interview Notes
1. **How do you decide what to index?**  
   I look at the application's most frequent `SELECT` queries and index columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses, prioritizing columns with high cardinality (many unique values).
2. **What is a covering index?**  
   An index that contains all the columns needed for a query, allowing the database to return results straight from the index without reading the actual table rows.

---

## Related Documents
- `../04_Database/Table_Descriptions.md`

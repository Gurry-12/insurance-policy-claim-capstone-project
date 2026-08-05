<Performance>
> Optimization strategies and database tuning in the InsuranceFlow backend.

---

## Purpose
Documents the mechanisms used to ensure the application remains fast and responsive under load, specifically focusing on database interactions and concurrency.

---

## Overview
- **Read-Only Transactions**: Optimizing Hibernate for read operations.
- **Fetch Strategies**: Managing `EAGER` vs `LAZY` loading to avoid N+1 queries.
- **Frontend Coordination**: Parallel loading.

---

## Performance Considerations
| Aspect | Strategy | Benefit |
|---|---|---|
| Transactions | `@Transactional(readOnly=true)` | Disables dirty checking, saves memory and CPU |
| Token Validation | Redis caching | Bypasses MySQL for every API request |
| Queries | Derived Queries / Pagination | Prevents loading entire tables into memory |

---

## Database Fetch Strategies
- **EAGER vs LAZY**: By default, JPA `@ManyToOne` is `EAGER`. If a `Claim` has 4 `@ManyToOne` relationships (User, Policy, Reviewer, Document), fetching 10 claims might result in 40 additional queries (The N+1 problem).
- **Mitigation**: We explicitly configure associations to `LAZY` where possible, or use `@Query("SELECT c FROM Claim c JOIN FETCH c.policy")` to load everything in a single SQL statement.

---

## Frontend Coordination
- **Parallel Loading**: Dashboard pages require data from multiple endpoints (stats, recent claims, user profile). The frontend uses `Promise.all([api.getStats(), api.getClaims()])` to execute these requests concurrently, reducing total load time.

---

## Design Decisions
- **Why readOnly transactions?** When a service method only reads data, setting `readOnly=true` tells Hibernate it doesn't need to track entity changes (dirty checking). This significantly reduces memory usage and speeds up the transaction.
- **Known issues / Roadmap**: 
  - *Issue*: Some heavy admin dashboard queries currently aggregate data in memory.
  - *Roadmap*: Implement native SQL aggregations or materialized views for dashboard statistics.

---

## Related Documents
- [../06_Backend/Repositories.md](Repositories.md)
- [../06_Backend/Caching.md](Caching.md)

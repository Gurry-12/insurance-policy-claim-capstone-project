<Repositories>
> Data access layer powered by Spring Data JPA and Hibernate.

---

## Purpose
Repositories handle all interactions with the MySQL database, abstracting away complex SQL queries into method names and `@Query` annotations.

---

## Overview
- **Spring Data JPA**: Extends `JpaRepository`.
- **Derived Queries**: Method names automatically converted to SQL.
- **Custom JPQL**: `@Query` used for complex joins and aggregations.

---

## Business Context
The system needs to efficiently query policies by status, claims by user, and users by role. The repository layer provides optimized and secure (SQL-injection-proof) ways to retrieve this data.

---

## Repository Map
| Repository | Entity | Key Derived Methods |
|---|---|---|
| UserRepository | User | `findByEmail`, `existsByEmail` |
| PolicyRepository | Policy | `findAllByUserIdAndStatus` |
| ClaimRepository | Claim | `findByPolicyId` |

---

## Backend Implementation
- **Extending JpaRepository**: Provides basic CRUD operations (`save`, `findById`, `findAll`).
- **Derived Queries**: E.g., `findByStatusAndType(String status, String type)`. Spring parses the name and generates the SQL.
- **Custom @Query**: Conceptually used when derived queries become too long. E.g., `@Query("SELECT c FROM Claim c JOIN c.policy p WHERE p.user.id = :userId")`.

---

## Design Decisions
- **Why Spring Data JPA over JDBC?** Developer productivity. It eliminates massive amounts of boilerplate code and handles ResultSet mapping automatically.
- **Eager vs Lazy**: We carefully map relationships (`@OneToMany`, `@ManyToOne`) to avoid performance bottlenecks, relying on Repositories to fetch associated data only when needed (or via `JOIN FETCH` in `@Query`).
- **ddl-auto=update**: Used in development to automatically update schema based on Entity classes. (Note: In production, tools like Flyway/Liquibase are preferred).

---

## Code References
| Component | Path |
|---|---|
| UserRepository | `com.insurance.demo.repository.UserRepository` |

---

## Related Documents
- [../06_Backend/Services.md](Services.md)
- [../06_Backend/Performance.md](Performance.md)

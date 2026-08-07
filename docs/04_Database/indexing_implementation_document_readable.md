
# Database Indexing & Performance Optimization

**Project:** Insurance Policy and Claim Management System  
**Focus:** Backend Database Optimization (Spring Boot, MySQL, JPA)

---

# 1. Executive Summary

## Goal
Improve database performance as the application grows.

### Why?
- Large tables cause **Full Table Scans**.
- Full scans slow down filtering and searching.
- Indexes help MySQL find data much faster.

### Result
- Faster search operations.
- Better JOIN performance.
- Improved dashboard and API response time.

---

# 2. Indexing Strategy

| Strategy | Purpose |
|----------|---------|
| Foreign Key Indexing | Speeds up JOIN operations |
| Frequently Filtered Columns | Improves WHERE clause performance |
| Avoid Over-Indexing | Keeps INSERT/UPDATE/DELETE operations fast |
| Use Existing Unique Indexes | Reused indexes created by UNIQUE constraints |

### Indexed Examples
- `status`
- `city`
- `state`
- `role`
- `policy_id`
- `customer_id`
- `plan_id`

---

# 3. Technical Implementation

| Item | Details |
|------|---------|
| ORM | Jakarta Persistence API (JPA) |
| Annotation | `@Table(indexes = { @Index(...) })` |
| Schema Update | `spring.jpa.hibernate.ddl-auto=update` |
| Database | MySQL |

Hibernate automatically creates the required indexes during application startup.

---

# 4. Entity-wise Index Mapping

## A. User & Customer

| Entity | Indexes |
|--------|---------|
| AppUser | role, is_active |
| Customer | user_id, city, state |
| StaffSpeciality | user_id |

## B. Product & Plan

| Entity | Indexes |
|--------|---------|
| InsuranceProduct | product_type, is_active |
| PolicyPlan | product_id, is_active |
| CoverageOption | plan_id |
| PricingRule | plan_id, status |
| PricingAuditLog | pricing_rule_id |

## C. Sales & Policy

| Entity | Indexes |
|--------|---------|
| Quote | customer_id, plan_id, status |
| Policy | customer_id, policy_status, plan_id |
| PremiumPayment | policy_id, payment_status |

## D. Claims

| Entity | Indexes |
|--------|---------|
| Claim | claim_status, policy_id |
| ClaimDocument | claim_id |
| ClaimStatusHistory | claim_id, updated_by, new_status |

## E. Security

| Entity | Indexes |
|--------|---------|
| OtpVerification | user_id, created_at |

---

# 5. Benefits

- Faster filtering and searching.
- Faster JOIN queries.
- Better dashboard performance.
- No changes required in frontend APIs.
- Seamless deployment using Hibernate DDL generation.

---

# 6. Key Takeaways

- Index only columns that are searched frequently.
- Always index foreign keys.
- Avoid unnecessary indexes.
- Use JPA annotations instead of raw SQL.
- Maintain a balance between read and write performance.

# Database Overview

## Purpose

This document explains the database structure — all tables, their columns, relationships, constraints, indexes, and the business reasons behind design decisions.

---

## Database: `insurance_db`

**Engine:** MySQL 8.x  
**DDL Strategy:** `spring.jpa.hibernate.ddl-auto=update` — Hibernate auto-creates/updates tables on startup. Never use `create` or `create-drop` in production.

---

## Table Overview

| Table | Entity Class | Rows (Approximate) | Purpose |
|---|---|---|---|
| `users` | AppUser | Hundreds–thousands | Central user identity |
| `customers` | Customer | Same as users | Customer profile details |
| `staff_specialities` | StaffSpeciality | Few dozen | Staff-to-productType mapping |
| `otp_verifications` | OtpVerification | High volume | OTP records (can be archived) |
| `insurance_products` | InsuranceProduct | Tens | Product catalog |
| `policy_plans` | PolicyPlan | Hundreds | Plan catalog |
| `policies` | Policy | Thousands | Active contracts |
| `premium_payments` | PremiumPayment | High volume | Payment ledger |
| `claims` | Claim | Medium volume | Claim records |
| `claim_documents` | ClaimDocument | High volume | Document metadata |
| `claim_status_histories` | ClaimStatusHistory | High volume | Audit trail |

---

## Table Schemas

### `users`

```sql
CREATE TABLE users (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,   -- UNIQUE CONSTRAINT: user_valid_email
  password       VARCHAR(255) NOT NULL,           -- BCrypt hash
  mobile_number  VARCHAR(255) NOT NULL UNIQUE,   -- UNIQUE CONSTRAINT: user_valid_phone
  is_active      BOOLEAN NOT NULL,
  role           VARCHAR(50) NOT NULL,            -- Stored as string: ROLE_CUSTOMER, etc.
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_date   DATETIME NOT NULL,
  updated_date   DATETIME
);
```

**Indexes:** email (unique), mobile_number (unique)  
**Business rules:** Email normalized to lowercase before storage. Role is an enum stored as VARCHAR.

---

### `customers`

```sql
CREATE TABLE customers (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT NOT NULL UNIQUE,   -- FK → users.id, one-to-one
  date_of_birth    DATE,
  address          VARCHAR(255),
  city             VARCHAR(255),
  state            VARCHAR(255),
  pin_code         VARCHAR(255),
  nominee_name     VARCHAR(255),
  nominee_relation VARCHAR(255),
  created_date     DATETIME,
  updated_date     DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Note:** All fields (except user_id) are nullable — the customer profile starts empty and is filled by the customer. The service layer enforces completeness before policy purchase.

---

### `staff_specialities`

```sql
CREATE TABLE staff_specialities (
  id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT NOT NULL UNIQUE,   -- FK → users.id
  product_speciality VARCHAR(50) NOT NULL,     -- ProductType enum as string
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Business rule:** Each staff member has EXACTLY ONE speciality. This is enforced by the UNIQUE constraint on user_id.

---

### `otp_verifications`

```sql
CREATE TABLE otp_verifications (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT NOT NULL,       -- FK → users.id (ManyToOne)
  email_otp    VARCHAR(255) NOT NULL,
  phone_otp    VARCHAR(255) NOT NULL,
  expires_at   DATETIME NOT NULL,
  used         BOOLEAN DEFAULT FALSE,
  send_count   INT DEFAULT 1,
  last_sent_at DATETIME,
  created_at   DATETIME,              -- set by @PrePersist
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Note:** ManyToOne to users — one user can have MULTIPLE OTP records over time (one per request cycle). The system always queries the LATEST by `created_at DESC`.

**Archival note:** This table can grow large. Consider archiving records older than 7 days. **Not implemented** — no cleanup job exists.

---

### `insurance_products`

```sql
CREATE TABLE insurance_products (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL UNIQUE,
  product_type VARCHAR(50) NOT NULL,   -- HEALTH, LIFE, VEHICLE, PROPERTY, TRAVEL
  description  TEXT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_date DATETIME,
  updated_date DATETIME
);
```

---

### `policy_plans`

```sql
CREATE TABLE policy_plans (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id        BIGINT NOT NULL,    -- FK → insurance_products.id
  plan_name         VARCHAR(255) NOT NULL,
  coverage_amount   DECIMAL(15,2) NOT NULL,
  premium_amount    DECIMAL(15,2) NOT NULL,
  premium_type      VARCHAR(50) NOT NULL,  -- ONE_TIME, ANNUAL
  duration          INT NOT NULL,           -- years, max 40
  terms_conditions  VARCHAR(3000) NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_date      DATETIME,
  updated_date      DATETIME,
  FOREIGN KEY (product_id) REFERENCES insurance_products(id)
);
```

**Cascade:** When an InsuranceProduct is deleted, all its plans are deleted (CascadeType.ALL, orphanRemoval=true).

---

### `policies`

```sql
CREATE TABLE policies (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  policy_number     VARCHAR(50) NOT NULL UNIQUE,
  customer_id       BIGINT NOT NULL,  -- FK → customers.id
  plan_id           BIGINT NOT NULL,  -- FK → policy_plans.id
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,    -- auto-calculated by service
  policy_status     VARCHAR(50) NOT NULL,  -- PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED
  total_premium_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_date      DATETIME,
  updated_date      DATETIME,
  version           BIGINT,           -- @Version for optimistic locking
  FOREIGN KEY (customer_id) REFERENCES customers.id,
  FOREIGN KEY (plan_id) REFERENCES policy_plans.id
);
```

**Critical columns:**
- `version` — never set manually; managed by Hibernate for optimistic locking
- `total_premium_paid` — incremented by PremiumPaymentServiceImpl on SUCCESS payment
- `policy_status` — set to ACTIVE on first SUCCESS payment

---

### `premium_payments`

```sql
CREATE TABLE premium_payments (
  payment_id             BIGINT AUTO_INCREMENT PRIMARY KEY,  -- NOTE: column name is payment_id, not id
  policy_id              BIGINT NOT NULL,
  amount                 DECIMAL(15,2) NOT NULL,
  payment_date           DATETIME NOT NULL,
  payment_mode           VARCHAR(50) NOT NULL,  -- UPI, CARD, NETBANKING, CASH, CHEQUE
  transaction_reference  VARCHAR(255) NOT NULL UNIQUE,
  payment_status         VARCHAR(50) NOT NULL,  -- SUCCESS, FAILED
  created_date           DATETIME,
  FOREIGN KEY (policy_id) REFERENCES policies.id
);
```

**Note:** PK column is named `payment_id` (not `id`). This is handled by `@Column(name = "payment_id")` on the `id` field. The entity field is still named `id`.

---

### `claims`

```sql
CREATE TABLE claims (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  claim_number        VARCHAR(50) NOT NULL UNIQUE,
  policy_id           BIGINT NOT NULL,          -- FK → policies.id
  assigned_staff_id   BIGINT,                   -- FK → users.id (nullable until assigned)
  claim_amount        DECIMAL(15,2) NOT NULL,
  claim_reason        TEXT NOT NULL,
  incident_date       DATETIME NOT NULL,
  claim_status        VARCHAR(50) NOT NULL,
  staff_remarks       TEXT,
  admin_remarks       TEXT,
  created_date        DATETIME,
  updated_date        DATETIME,
  version             BIGINT,                   -- optimistic locking
  FOREIGN KEY (policy_id) REFERENCES policies.id,
  FOREIGN KEY (assigned_staff_id) REFERENCES users.id
);
```

---

### `claim_documents`

```sql
CREATE TABLE claim_documents (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  claim_id            BIGINT NOT NULL,   -- FK → claims.id
  document_name       VARCHAR(255) NOT NULL,
  document_type       VARCHAR(255) NOT NULL,
  document_reference  VARCHAR(255),     -- Cloudinary URL
  public_id           VARCHAR(255),     -- Cloudinary public_id
  uploaded_date       DATETIME,
  FOREIGN KEY (claim_id) REFERENCES claims.id
);
```

---

### `claim_status_histories`

```sql
CREATE TABLE claim_status_histories (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  claim_id        BIGINT NOT NULL,
  previous_status VARCHAR(255),          -- null for initial SUBMITTED
  new_status      VARCHAR(255) NOT NULL,
  remarks         TEXT,
  updated_by      VARCHAR(255) NOT NULL, -- email of who made the change
  updated_date    DATETIME,
  FOREIGN KEY (claim_id) REFERENCES claims.id
);
```

**Immutability:** This table is append-only. No UPDATE or DELETE statements are ever issued to this table. All claim lifecycle changes produce a new row.

---

## Entity Relationship Diagram (ERD)

```
users ──────────────── customers ───────────── policies
  │                                               │
  ├── staff_specialities               premium_payments
  │
  └── otp_verifications

insurance_products ── policy_plans ──────── policies
                                               │
                                           claims ─── claim_documents
                                               │
                                           claim_status_histories
```

---

## Key Constraints and Their Rationale

| Constraint | Table.Column | Reason |
|---|---|---|
| UNIQUE on `email` | users | One account per email address |
| UNIQUE on `mobile_number` | users | One account per phone number |
| UNIQUE on `policy_number` | policies | Human-readable identifier must be unique |
| UNIQUE on `claim_number` | claims | Human-readable identifier must be unique |
| UNIQUE on `transaction_reference` | premium_payments | Prevents duplicate payment processing |
| UNIQUE on `product_name` | insurance_products | No two products with same name |
| NOT NULL on `claim_status` | claims | Claim must always have a known state |
| `@Version` (version) | policies, claims | Optimistic locking — prevents concurrent overwrites |

---

## Enums Stored as Strings

All enums use `@Enumerated(EnumType.STRING)`. This means database values are human-readable strings, not integers.

**Why STRING over ORDINAL?**
- Adding new enum values won't corrupt existing data (ORDINAL uses index positions)
- Database queries are readable without enum reference
- Refactoring enum order is safe

---

## Custom JPQL Queries

### Coverage remaining calculation (`ClaimRepository`)

```sql
SELECT COALESCE(SUM(c.claimAmount), 0) 
FROM Claim c 
WHERE c.policy.id = :policyId 
  AND c.claimStatus != :status    -- status = REJECTED
```

**Purpose:** Calculate total active (non-rejected) claims against a policy to determine remaining coverage available for new claims.

---

## Cascade Summary

| Parent | Child | Cascade | orphanRemoval |
|---|---|---|---|
| InsuranceProduct | PolicyPlan | ALL | true |
| AppUser | Customer | ALL | true |
| AppUser | StaffSpeciality | ALL | true |
| Policy | PremiumPayment | ALL | true |
| Policy | Claim | ALL | true |
| Claim | ClaimDocument | ALL | true |
| Claim | ClaimStatusHistory | ALL | true |

---

## Performance Considerations

### N+1 Problem Prevention

`ClaimRepository` uses `@EntityGraph` to pre-fetch related entities in a single query:
```java
@EntityGraph(attributePaths = {
    "policy.customer.user",
    "policy.policyPlan.insuranceProduct",
    "assignedStaff"
})
List<Claim> findByPolicyCustomerUserId(Long customerUserId);
```

Without this, accessing `claim.getPolicy().getCustomer().getUser()` would fire separate queries for each claim.

### Lazy Loading

Most `@ManyToOne` and `@OneToMany` relationships use `FetchType.LAZY` to avoid loading entire object graphs when not needed.

### Specifications for Dynamic Filtering

`JpaSpecificationExecutor` is used in all paginated endpoints. This generates efficient type-safe dynamic WHERE clauses instead of string concatenation.

---

## Indexing Recommendations (Not yet implemented)

The following indexes would improve query performance at scale:

```sql
-- Frequent claim lookups by policy
CREATE INDEX idx_claims_policy_id ON claims(policy_id);

-- Frequent claim lookups by status
CREATE INDEX idx_claims_status ON claims(claim_status);

-- OTP lookups by user
CREATE INDEX idx_otp_user_id ON otp_verifications(user_id);

-- Payment lookups by policy
CREATE INDEX idx_payments_policy_id ON premium_payments(policy_id);
```

These indexes are **Not implemented** — Hibernate's `ddl-auto=update` does not create these automatically from entity annotations alone.

---

## Related Documents

- [er-diagrams](./er-diagrams.md)
- [class-diagrams](../07-diagrams/class-diagrams.md)

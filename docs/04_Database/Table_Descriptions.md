</Agent System Instructions>
<Table Descriptions>
> Detailed dictionary of every table in the InsuranceFlow database.

---

## Purpose
Acts as the definitive data dictionary for the MySQL database. It details the purpose of each table, important columns, and business rules enforced at the database level.

---

## Overview
- Documents all 17 tables in the `insurance_db`.
- Grouped by functional domain.
- Details primary keys, foreign keys, and notable data types.

---

## Business Context
Understanding the physical tables is crucial for debugging production data issues, writing complex reporting queries, and planning future schema migrations.

---

## Database Design

### 1. Identity & Access

#### `users`
- **Purpose**: Stores all authenticated users (customers, staff, admins).
- **Key Columns**: `id` (PK), `email` (Unique), `password_hash`, `role`, `is_active` (Boolean for soft delete).
- **Example Data**: `(1, 'admin@insurance.com', '$2a$10...', 'ROLE_ADMIN', 1)`

#### `refresh_tokens`
- **Purpose**: Manages long-lived JWT refresh tokens.
- **Key Columns**: `id`, `user_id` (FK), `token_hash` (SHA-256), `expiry_date`.

### 2. Catalog & Pricing

#### `products`
- **Purpose**: Defines available insurance products.
- **Key Columns**: `id`, `name`, `product_type` (Enum: HEALTH, MOTOR, LIFE, TRAVEL, INSURANCE).

#### `pricing_rules`
- **Purpose**: Stores base pricing parameters for products.
- **Key Columns**: `id`, `product_id` (FK), `base_price` (BigDecimal).

#### `coverage_options`
- **Purpose**: Add-ons that customers can select to increase protection.
- **Key Columns**: `id`, `product_id` (FK), `coverage_name`, `additional_cost`.

### 3. Sales & Fulfillment

#### `quotes`
- **Purpose**: Temporary pricing offers generated for users.
- **Key Columns**: `id`, `user_id` (FK), `product_id` (FK), `calculated_premium`, `status` (CREATED, USED, EXPIRED), `expires_at` (30 min TTL).

#### `policies`
- **Purpose**: The final, purchased insurance contract.
- **Key Columns**: `id`, `quote_id` (FK), `user_id` (FK), `premium_amount`, `status` (PENDING_PAYMENT, ACTIVE, EXPIRED), `start_date`, `end_date`, `version` (Optimistic Locking).

#### `payments`
- **Purpose**: Records of financial transactions.
- **Key Columns**: `id`, `policy_id` (FK), `amount`, `payment_date`. **Rule**: Payment amount MUST equal calculatedPremium.

### 4. Claims Processing

#### `claims`
- **Purpose**: Customer requests for compensation.
- **Key Columns**: `id`, `policy_id` (FK), `claim_number` (Unique), `amount_requested`, `status` (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED), `version`.

#### `claim_documents`
- **Purpose**: Links to uploaded proof documents on Cloudinary.
- **Key Columns**: `id`, `claim_id` (FK), `document_url`, `document_type`.

---

## Interview Notes
1. **Why do you use `BigDecimal` for money columns?**  
   To prevent floating-point precision errors that occur when using `Double` or `Float` in Java/MySQL. Exact accuracy is required for financial calculations.
2. **How do you handle ENUMs in the database?**  
   We map Java Enums as Strings in the database using `@Enumerated(EnumType.STRING)` so they are human-readable and resilient to order changes, unlike ordinal mapping.

---

## Related Documents
- `../04_Database/ER_Diagram.md`
- `../04_Database/Constraints.md`

# Entity Relationship & Database Schema Diagrams

This document charts the database layout of `insurance_db`, listing columns, primary keys, foreign keys, constraints, and cardinalities.

---

## 1. Entity Relationship Diagram (ERD)

This diagram maps entity classes, properties, and foreign keys.

```mermaid
erDiagram
    users {
        bigint id PK
        varchar full_name "NOT NULL"
        varchar email "UNIQUE, NOT NULL"
        varchar password "NOT NULL"
        varchar mobile_number "UNIQUE, NOT NULL"
        boolean is_active "NOT NULL"
        varchar role "NOT NULL"
        boolean email_verified
        boolean phone_verified
        datetime created_date
        datetime updated_date
    }

    customers {
        bigint id PK
        bigint user_id FK "UNIQUE, NOT NULL"
        date date_of_birth
        varchar address
        varchar city
        varchar state
        varchar pin_code
        varchar nominee_name
        varchar nominee_relation
        datetime created_date
        datetime updated_date
    }

    staff_specialities {
        bigint id PK
        bigint user_id FK "UNIQUE, NOT NULL"
        varchar product_speciality "NOT NULL"
    }

    otp_verifications {
        bigint id PK
        bigint user_id FK "NOT NULL"
        varchar email_otp "NOT NULL"
        varchar phone_otp "NOT NULL"
        datetime expires_at "NOT NULL"
        boolean used
        int send_count
        datetime last_sent_at
        datetime created_at
    }

    insurance_products {
        bigint id PK
        varchar product_name "UNIQUE, NOT NULL"
        varchar product_type "NOT NULL"
        text description "NOT NULL"
        boolean is_active "NOT NULL"
        datetime created_date
        datetime updated_date
    }

    policy_plans {
        bigint id PK
        bigint product_id FK "NOT NULL"
        varchar plan_name "NOT NULL"
        int plan_version "NOT NULL, DEFAULT 1"
        varchar supported_premium_type "NOT NULL"
        varchar terms_conditions "3000, NOT NULL"
        boolean is_active "NOT NULL"
        datetime created_date
        datetime updated_date
    }

    policy_plan_durations {
        bigint plan_id FK "NOT NULL"
        int duration "NOT NULL"
    }

    coverage_options {
        bigint id PK
        bigint plan_id FK "NOT NULL"
        decimal coverage_amount "15,2, NOT NULL"
        varchar label "NOT NULL"
        int display_order "NOT NULL"
        boolean is_active "NOT NULL, DEFAULT true"
    }

    pricing_rules {
        bigint id PK
        bigint plan_id FK "NOT NULL"
        decimal base_risk_rate "10,4, NOT NULL"
        decimal processing_fee "15,2, NOT NULL"
        decimal gst "5,2, NOT NULL"
        varchar remarks "500"
        datetime effective_from "NOT NULL"
        datetime effective_to "NULLABLE"
        varchar status "NOT NULL, DEFAULT ACTIVE"
        datetime created_date
    }

    pricing_audit_logs {
        bigint id PK
        bigint pricing_rule_id "NOT NULL"
        text old_configuration
        text new_configuration "NOT NULL"
        varchar remarks "500"
        varchar changed_by "NOT NULL"
        datetime changed_at
    }

    quotes {
        bigint id PK
        bigint customer_id FK "NOT NULL"
        bigint plan_id FK "NOT NULL"
        int plan_version "NOT NULL"
        bigint pricing_rule_id "NOT NULL"
        decimal coverage "15,2, NOT NULL"
        int duration "NOT NULL"
        varchar premium_type "NOT NULL"
        decimal risk_rate "10,4, NOT NULL"
        decimal processing_fee "15,2, NOT NULL"
        decimal gst "10,2, NOT NULL"
        decimal premium "15,2, NOT NULL"
        decimal total "15,2, NOT NULL"
        varchar status "NOT NULL, DEFAULT CREATED"
        datetime created_at
        datetime expires_at "NOT NULL"
    }

    policies {
        bigint id PK
        varchar policy_number "UNIQUE, NOT NULL"
        bigint customer_id FK "NOT NULL"
        bigint plan_id FK "NOT NULL"
        decimal selected_coverage "15,2, NOT NULL"
        varchar premium_type "NOT NULL"
        int policy_duration "NOT NULL"
        decimal premium_rate_used "15,4, NOT NULL"
        decimal processing_fee_used "15,2, NOT NULL"
        decimal gst_used "15,2, NOT NULL"
        decimal calculated_premium "15,2, NOT NULL"
        int plan_version "NOT NULL"
        bigint pricing_rule_id "NOT NULL"
        bigint quote_id "NULLABLE"
        datetime purchase_date
        date start_date "NOT NULL"
        date end_date "NOT NULL"
        varchar policy_status "NOT NULL"
        decimal total_premium_paid "15,2, NOT NULL"
        datetime created_date
        datetime updated_date
        bigint version
    }

    premium_payments {
        bigint payment_id PK
        bigint policy_id FK "NOT NULL"
        decimal amount "15,2, NOT NULL"
        datetime payment_date "NOT NULL"
        varchar payment_mode "NOT NULL"
        varchar transaction_reference "UNIQUE, NOT NULL"
        varchar payment_status "NOT NULL"
        datetime created_date
    }

    claims {
        bigint id PK
        varchar claim_number "UNIQUE, NOT NULL"
        bigint policy_id FK "NOT NULL"
        bigint assigned_staff_id FK "NULLABLE"
        decimal claim_amount "15,2, NOT NULL"
        text claim_reason "NOT NULL"
        datetime incident_date "NOT NULL"
        varchar claim_status "NOT NULL"
        text staff_remarks
        text admin_remarks
        datetime created_date
        datetime updated_date
        bigint version
    }

    claim_documents {
        bigint id PK
        bigint claim_id FK "NOT NULL"
        varchar document_name "NOT NULL"
        varchar document_type "NOT NULL"
        varchar document_reference "Cloudinary URL"
        varchar public_id
        datetime uploaded_date
    }

    claim_status_histories {
        bigint id PK
        bigint claim_id FK "NOT NULL"
        varchar previous_status
        varchar new_status "NOT NULL"
        varchar remarks
        varchar updated_by "NOT NULL"
        datetime updated_date
    }

    %% Cardinality rules
    users ||--o| customers : "1 to 0..1 profile"
    users ||--o| staff_specialities : "1 to 0..1 speciality"
    users ||--o{ otp_verifications : "1 to many verification logs"
    
    customers ||--o{ policies : "owns 0 or many"
    customers ||--o{ quotes : "generates 0 or many"
    
    insurance_products ||--o{ policy_plans : "contains 0 or many"
    policy_plans ||--o{ policies : "underlying plan for"
    policy_plans ||--o{ coverage_options : "defines coverage tiers"
    policy_plans ||--o{ pricing_rules : "has pricing configurations"
    policy_plans ||--o{ quotes : "generates quotes"
    policy_plans ||--o{ policy_plan_durations : "allowed durations"
    
    pricing_rules ||--o{ pricing_audit_logs : "audit trail for changes"
    
    policies ||--o{ premium_payments : "logs many payments"
    policies ||--o{ claims : "secures claims"
    
    claims ||--o{ claim_documents : "attaches files"
    claims ||--o{ claim_status_histories : "logs audit trails"
    claims }o--o| users : "assigned to ops staff"
```

---

## 2. Foreign Key Definitions & Constraints

*   `customers.user_id` ➔ `users.id`
    *   Constraint: `FOREIGN KEY (user_id) REFERENCES users(id)`
    *   Behavior: Cascades operations on user deletion (profile gets wiped).
*   `staff_specialities.user_id` ➔ `users.id`
    *   Constraint: `FOREIGN KEY (user_id) REFERENCES users(id)`
*   `otp_verifications.user_id` ➔ `users.id`
    *   Constraint: `FOREIGN KEY (user_id) REFERENCES users(id)`
*   `policy_plans.product_id` ➔ `insurance_products.id`
    *   Constraint: `FOREIGN KEY (product_id) REFERENCES insurance_products(id)`
*   `policy_plan_durations.plan_id` ➔ `policy_plans.id`
    *   Constraint: `FOREIGN KEY (plan_id) REFERENCES policy_plans(id)`
*   `coverage_options.plan_id` ➔ `policy_plans.id`
    *   Constraint: `FOREIGN KEY (plan_id) REFERENCES policy_plans(id)`
*   `pricing_rules.plan_id` ➔ `policy_plans.id`
    *   Constraint: `FOREIGN KEY (plan_id) REFERENCES policy_plans(id)`
*   `quotes.customer_id` ➔ `customers.id`
    *   Constraint: `FOREIGN KEY (customer_id) REFERENCES customers(id)`
*   `quotes.plan_id` ➔ `policy_plans.id`
    *   Constraint: `FOREIGN KEY (plan_id) REFERENCES policy_plans(id)`
*   `policies.customer_id` ➔ `customers.id`
    *   Constraint: `FOREIGN KEY (customer_id) REFERENCES customers(id)`
*   `policies.plan_id` ➔ `policy_plans.id`
    *   Constraint: `FOREIGN KEY (plan_id) REFERENCES policy_plans(id)`
*   `premium_payments.policy_id` ➔ `policies.id`
    *   Constraint: `FOREIGN KEY (policy_id) REFERENCES policies(id)`
*   `claims.policy_id` ➔ `policies.id`
    *   Constraint: `FOREIGN KEY (policy_id) REFERENCES policies(id)`
*   `claims.assigned_staff_id` ➔ `users.id`
    *   Constraint: `FOREIGN KEY (assigned_staff_id) REFERENCES users(id)`
*   `claim_documents.claim_id` ➔ `claims.id`
    *   Constraint: `FOREIGN KEY (claim_id) REFERENCES claims(id)`
*   `claim_status_histories.claim_id` ➔ `claims.id`
    *   Constraint: `FOREIGN KEY (claim_id) REFERENCES claims(id)`

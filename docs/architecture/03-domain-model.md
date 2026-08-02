# Domain Model

The domain model is implemented as **15 JPA entities** under `com.insurance.demo.model`. The diagram below shows the entities, table names, and cardinalities as implemented (fetch types annotated where non-default).

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "user (1:1)"
    USERS ||--o| STAFF_SPECIALITIES : "staff (1:1)"
    USERS ||--o{ OTP_VERIFICATIONS : "user (1:N)"
    INSURANCE_PRODUCTS ||--o{ POLICY_PLANS : "insuranceProduct (1:N)"
    POLICY_PLANS ||--o{ COVERAGE_OPTIONS : "policyPlan (1:N)"
    POLICY_PLANS ||--o{ PRICING_RULES : "policyPlan (1:N)"
    PRICING_RULES ||--o{ PRICING_AUDIT_LOGS : "pricingRuleId (1:N)"
    CUSTOMERS ||--o{ POLICIES : "customer (1:N)"
    POLICY_PLANS ||--o{ POLICIES : "policyPlan (1:N)"
    POLICIES ||--o{ PREMIUM_PAYMENTS : "policy (1:N)"
    POLICIES ||--o{ CLAIMS : "policy (1:N)"
    USERS ||--o{ CLAIMS : "assignedStaff (1:N)"
    CLAIMS ||--o{ CLAIM_DOCUMENTS : "claim (1:N)"
    CLAIMS ||--o{ CLAIM_STATUS_HISTORIES : "claim (1:N)"
    CUSTOMERS ||--o{ QUOTES : "customer (1:N)"
    POLICY_PLANS ||--o{ QUOTES : "policyPlan (1:N)"

    USERS {
        bigint user_id PK
        varchar email UK
        varchar password
        varchar full_name
        varchar mobile_number UK
        varchar role "ROLE_ADMIN|ROLE_INTERNAL_STAFF|ROLE_CUSTOMER"
        boolean is_active
        boolean email_verified
        boolean phone_verified
        timestamp created_date
    }
    CUSTOMERS {
        bigint customer_id PK
        bigint user_id FK
        date date_of_birth
        varchar address
        varchar city
        varchar state
        varchar pin_code
        varchar nominee_name
        varchar nominee_relation
    }
    STAFF_SPECIALITIES {
        bigint id PK
        bigint staff_id FK
        varchar product_speciality "HEALTH|MOTOR|LIFE|TRAVEL|INSURANCE"
    }
    OTP_VERIFICATIONS {
        bigint id PK
        bigint user_id FK
        varchar email_otp
        varchar phone_otp
        timestamp expires_at
        boolean used
        int send_count
        timestamp last_sent_at
    }
    INSURANCE_PRODUCTS {
        bigint id PK
        varchar product_name UK
        varchar product_type "HEALTH|MOTOR|LIFE|TRAVEL|INSURANCE"
        varchar description
        boolean is_active
    }
    POLICY_PLANS {
        bigint id PK
        bigint product_id FK
        varchar plan_name
        int plan_version
        set allowed_durations "ElementCollection: policy_plan_durations"
        varchar supported_premium_type "ONE_TIME|ANNUAL"
        varchar terms_conditions
        boolean is_active
    }
    COVERAGE_OPTIONS {
        bigint id PK
        bigint plan_id FK
        decimal coverage_amount
        varchar label
        int display_order
        boolean is_active
    }
    PRICING_RULES {
        bigint id PK
        bigint plan_id FK
        decimal base_risk_rate
        decimal processing_fee
        decimal gst
        varchar remarks
        timestamp effective_from
        timestamp effective_to
        varchar status "ACTIVE|INACTIVE"
    }
    PRICING_AUDIT_LOGS {
        bigint id PK
        bigint pricing_rule_id
        text old_configuration
        text new_configuration
        varchar remarks
        varchar changed_by
        timestamp changed_at
    }
    POLICIES {
        bigint policy_id PK
        varchar policy_number UK
        bigint customer_id FK
        bigint plan_id FK
        decimal selected_coverage
        varchar premium_type
        int policy_duration
        decimal premium_rate_used
        decimal processing_fee_used
        decimal gst_used
        decimal calculated_premium
        int plan_version
        bigint pricing_rule_id
        bigint quote_id
        date start_date
        date end_date
        varchar policy_status "PENDING_PAYMENT|ACTIVE|EXPIRED|CANCELLED"
        decimal total_premium_paid
    }
    PREMIUM_PAYMENTS {
        bigint payment_id PK
        bigint policy_id FK
        decimal amount
        timestamp payment_date
        varchar payment_mode "UPI|CARD|NET_BANKING|CASH"
        varchar transaction_reference UK
        varchar payment_status "PENDING|SUCCESS|FAILED"
    }
    QUOTES {
        bigint id PK
        bigint customer_id FK
        bigint plan_id FK
        int plan_version
        bigint pricing_rule_id
        decimal coverage
        int duration
        varchar premium_type
        decimal risk_rate
        decimal processing_fee
        decimal gst
        decimal premium
        decimal total
        varchar status "CREATED|USED|EXPIRED|CANCELLED"
        timestamp created_at
        timestamp expires_at
    }
    CLAIMS {
        bigint claim_id PK
        varchar claim_number UK
        bigint policy_id FK
        bigint assigned_staff_id FK
        decimal claim_amount
        varchar claim_reason
        date incident_date
        varchar claim_status "SUBMITTED|UNDER_REVIEW|RECOMMENDED_FOR_APPROVAL|RECOMMENDED_FOR_REJECTION|APPROVED|REJECTED"
        varchar staff_remarks
        varchar admin_remarks
    }
    CLAIM_DOCUMENTS {
        bigint id PK
        bigint claim_id FK
        varchar name
        varchar document_type
        varchar document_reference
        varchar public_id
        timestamp uploaded_date
    }
    CLAIM_STATUS_HISTORIES {
        bigint id PK
        bigint claim_id FK
        varchar previous_status
        varchar new_status
        varchar remarks
        varchar updated_by
        timestamp updated_date
    }
```

## Fetch strategy notes

Most associations default to `LAZY`. Four `@ManyToOne` associations are currently mapped `EAGER`:

| Entity | Association | Field |
|--------|-------------|-------|
| `PremiumPayment` | `Policy` | `policy` |
| `CoverageOption` | `PolicyPlan` | `policyPlan` |
| `PricingRule` | `PolicyPlan` | `policyPlan` |
| `PolicyPlan` | `InsuranceProduct` | `insuranceProduct` |

All four are marked `@JsonIgnore`, so they never appear in JSON serialization. See [`../performance.md`](../performance.md) for the impact of these and the recommended change to `LAZY`.

## Supporting enums (11)

`ClaimStatus`, `Gender` (declared, currently unused by entities), `PaymentMode`, `PaymentStatus`, `PolicyStatus`, `PremiumType`, `PricingRuleStatus`, `ProductType`, `QuoteStatus`, `Role`, `RoundingRule`.

## Key uniqueness constraints

- `users.email` (unique index `user_valid_email`)
- `users.mobile_number` (unique index `user_valid_phone`)
- `customers.user_id` (1:1)
- `insurance_products.product_name`
- `policies.policy_number`
- `premium_payments.transaction_reference`
- `claims.claim_number`

## See also

- [`../database.md`](../database.md) — full schema, foreign keys, indexes
- [`imp-doc/03-database/er-diagrams.md`](../../imp-doc/03-database/er-diagrams.md)
- [`imp-doc/07-diagrams/class-diagrams.md`](../../imp-doc/07-diagrams/class-diagrams.md)

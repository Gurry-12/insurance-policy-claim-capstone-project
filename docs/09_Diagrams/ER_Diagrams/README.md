# ER Diagram (Overview)

> Entity-relationship overview. The authoritative, column-level ER diagram lives
> in `../../04_Database/ER_Diagram.md` — this page is the quick visual index.

```mermaid
erDiagram
    users ||--o| customers : "1:1"
    users ||--o{ refresh_tokens : "1:N"
    users ||--o{ otp_verifications : "1:N"
    users ||--o| staff_specialities : "1:1"
    customers ||--o{ quotes : "1:N"
    customers ||--o{ policies : "1:N"
    insurance_products ||--o{ policy_plans : "1:N"
    policy_plans ||--o{ coverage_options : "1:N"
    policy_plans ||--o{ pricing_rules : "1:N"
    policy_plans ||--o| policy_plan_durations : "1:N (ElementCollection)"
    pricing_rules ||--o{ pricing_audit_logs : "1:N"
    quotes ||--o| policies : "1:1"
    policies ||--o{ premium_payments : "1:N"
    policies ||--o{ claims : "1:N"
    claims ||--o{ claim_documents : "1:N"
    claims ||--o{ claim_status_histories : "1:N"
```

## Notes

- 16 entities → 17 physical tables (`policy_plan_durations` is an
  ElementCollection join table owned by `policy_plans`).
- `premium_payments.payment_id` is the primary key column name (from `@Id`
  column annotation).
- `Policy` and `Claim` carry a `version` column for optimistic locking (`@Version`).
- Enums are stored as STRING.

## Related

- `../../04_Database/ER_Diagram.md` — full ER with columns, PKs, FKs, and types
- `../../04_Database/Entity_Relationships.md` — relationship semantics (cascade/fetch)
- `../../04_Database/Constraints.md` — constraints and defaults

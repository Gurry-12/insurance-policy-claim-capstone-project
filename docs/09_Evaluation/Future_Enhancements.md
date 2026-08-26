# Future Enhancements
> Roadmap for continuous improvement of the InsuranceFlow system.

---

## Purpose
To outline planned improvements, technical debt reduction, and feature additions, categorized by effort and timeline. Perfect for interview discussions on "What would you do next?".

---

## Short Term (Easy Wins)

| Enhancement | Description | Why it matters | Effort |
|-------------|-------------|----------------|--------|
| **Flyway Migrations** | Replace `ddl-auto=update` with Flyway. | Prevents accidental data loss and ensures schema version control across environments. | S |
| **LAZY Loading** | Enforce `FetchType.LAZY` on all `@OneToMany` relationships. | Resolves N+1 query problems and improves database read performance. | S |
| **Auto-Expiry Scheduler** | Spring `@Scheduled` job to mark policies as `EXPIRED`. | Currently, expiry relies on lazy evaluation; cron jobs automate state accuracy. | S |
| **File Type Validation** | Strict MIME-type checking for Claim uploads. | Prevents malicious script uploads masquerading as PDFs/Images. | S |

---

## Medium Term (Core Features)

| Enhancement | Description | Why it matters | Effort |
|-------------|-------------|----------------|--------|
| **Payment Gateway** | Integrate Stripe API for real checkout processing. | Moves the system from simulated payments to production-ready financial tracking. | M |
| **Email Notifications** | Async Kafka/RabbitMQ queue for sending status emails. | Improves user experience without blocking the main HTTP request thread. | M |
| **Policy Renewal** | Allow renewing `EXPIRED` policies with updated pricing. | Core business requirement for customer retention. | M |
| **Claim Settlement** | Add a financial disbursement module post-approval. | Completes the end-to-end lifecycle from claim to actual bank payout. | M |

---

## Long Term (Architecture & Scale)

| Enhancement | Description | Why it matters | Effort |
|-------------|-------------|----------------|--------|
| **OAuth2 / OIDC** | Integrate Google/Okta login alongside JWT. | Industry standard authentication; improves user onboarding friction. | L |
| **MFA Module** | Time-based One Time Passwords (TOTP via Google Authenticator). | Higher security standard than SMS for administrative roles. | L |
| **Fraud Detection** | Basic ML or rule-engine (Drools) to flag suspicious claims. | Reduces manual review time for staff and prevents financial loss. | L |
| **Microservices Migration** | Split into `AuthService`, `PolicyService`, `ClaimService`. | Allows independent scaling of heavy workflows (like document uploads). | L |

---

## Interview Notes
- **Q: Why haven't you implemented Flyway yet?** 
  *A: During heavy prototyping, `ddl-auto=update` allowed rapid entity iteration. Migrating to Flyway is the immediate next step before production release.*
- **Q: How would you handle the email notification queue?**
  *A: I'd implement Spring Boot `@Async` backed by a ThreadPool first, then migrate to RabbitMQ to ensure message durability if the server crashes.*

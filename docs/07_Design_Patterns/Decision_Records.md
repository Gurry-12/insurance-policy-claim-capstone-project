</Agent System Instructions>
<Decision Records>
> Architecture Decision Records (ADRs) for InsuranceFlow.

---

## Purpose
Documents the major architectural choices made during the development of InsuranceFlow, including the context, rationale, and trade-offs of each decision.

---

## Overview
- Serves as a historical log for new developers to understand *why* the system is built this way.
- Covers 14 major decisions spanning Authentication, Database Design, Design Patterns, and Frontend State.

---

## ADRs

### ADR-001: JWT vs Session-based authentication
**Problem**: How should we manage user authentication securely and scalably?
**Decision**: Use stateless JWTs (JSON Web Tokens).
**Rationale**: The backend acts as a purely stateless REST API serving a React frontend. JWTs allow horizontal scaling without sticky sessions or centralized session storage.
**Trade-offs**: Harder to invalidate tokens before expiration.
**Alternatives Considered**: Stateful Spring Security Sessions (rejected due to REST paradigm).

### ADR-002: Refresh tokens in HttpOnly cookie vs localStorage
**Problem**: Where to store the long-lived refresh token to balance UX and security?
**Decision**: Store in a strict `HttpOnly`, `Secure` cookie.
**Rationale**: Prevents XSS (Cross-Site Scripting) attacks from accessing the refresh token. Short-lived access tokens remain in memory.
**Trade-offs**: Requires proper CORS configuration and CSRF protection (though less critical with stateless APIs).
**Alternatives Considered**: LocalStorage (rejected due to XSS vulnerability).

### ADR-003: Strategy pattern for premium calculation
**Problem**: Different insurance products require entirely different math.
**Decision**: Implement the Strategy Pattern via Spring bean injection.
**Rationale**: Adheres to Open/Closed principle.
**Trade-offs**: Slight increase in initial complexity and number of classes.
**Alternatives Considered**: Large `switch` statement in a single service.

### ADR-004: Pricing Rules as separate entity from PolicyPlan
**Problem**: How to handle different variables (age, location) for base pricing?
**Decision**: Extract to `pricing_rules` table.
**Rationale**: Normalizes the database. Allows rule updates without touching product definitions.
**Trade-offs**: Requires a JOIN to calculate quotes.
**Alternatives Considered**: JSON column in products table (rejected due to lack of strict typing).

### ADR-005: Coverage Options as separate entity from PolicyPlan
**Problem**: How to handle add-ons like "Roadside Assistance"?
**Decision**: Separate `coverage_options` table linked to products.
**Rationale**: Flexible many-to-one relationship.
**Trade-offs**: More complex Quote calculation.

### ADR-006: Snapshot pricing on Quote and Policy
**Problem**: If base prices change, what happens to existing quotes and policies?
**Decision**: Store the exact `calculated_premium` as a snapshot value in quotes and policies.
**Rationale**: Insurance is a legal contract. Historical prices must be perfectly immutable.
**Trade-offs**: Data duplication (premium is stored directly on the policy rather than calculated on the fly).
**Alternatives Considered**: Historical versioning of pricing tables (too complex).

### ADR-007: BigDecimal for all money calculations
**Problem**: Preventing rounding errors in financial math.
**Decision**: Use `java.math.BigDecimal` exclusively.
**Rationale**: `Double` and `Float` suffer from IEEE 754 precision issues (e.g., 0.1 + 0.2 = 0.30000000000000004).
**Trade-offs**: Slower performance and more verbose code (`.add()`, `.multiply()`).
**Alternatives Considered**: Integers representing cents (rejected due to backend complexity).

### ADR-008: Soft delete (isActive) vs hard delete
**Problem**: Handling user deletion requests.
**Decision**: Implement `is_active = false` (Soft Delete).
**Rationale**: Financial regulations require retaining audit trails.
**Trade-offs**: Every query must include `WHERE is_active = true`.
**Alternatives Considered**: Hard deletes with cascaded wiping (rejected due to legal compliance).

### ADR-009: ddl-auto=update vs Flyway migrations
**Problem**: Database schema management during development.
**Decision**: Use Hibernate `ddl-auto=update`.
**Rationale**: Speed of development for a prototype/capstone project.
**Trade-offs**: Dangerous for production data; does not track schema history.
**Alternatives Considered**: Flyway/Liquibase (planned for future production deployment).

### ADR-010: Maker-checker for claim decisions
**Problem**: Preventing fraud in claim approvals.
**Decision**: Status flow `SUBMITTED → UNDER_REVIEW → RECOMMENDED → APPROVED`.
**Rationale**: Requires multiple staff interactions, preventing a single compromised account from draining funds.
**Trade-offs**: Slower UX for customers.

### ADR-011: Cloudinary for document storage
**Problem**: Where to store user-uploaded proof images for claims.
**Decision**: Cloudinary CDN.
**Rationale**: Fast integration, offloads bandwidth from our server, built-in image optimization.
**Trade-offs**: Third-party dependency.
**Alternatives Considered**: Local file system (rejected due to statelessness), AWS S3 (slightly longer setup).

### ADR-012: Dual OTP (email + SMS) for verification
**Problem**: High security required for policy purchases.
**Decision**: Require 6-digit OTP via Email and SMS.
**Rationale**: Mitigates risk of a compromised email account.
**Trade-offs**: Added cost (Twilio) and friction for user.

### ADR-013: Bucket4j for rate limiting (not Redis-distributed)
**Problem**: Preventing brute-force OTP attacks.
**Decision**: In-memory Bucket4j tokens per IP/Email.
**Rationale**: Sufficient for single-node deployment.
**Trade-offs**: State is lost on restart; limits are per-node, not global.
**Alternatives Considered**: Redis-backed rate limiting (overkill for current scale).

### ADR-014: React Context vs Redux for state management
**Problem**: Managing global auth state in the React frontend.
**Decision**: React Context API.
**Rationale**: Auth state changes rarely (login/logout). Context is built-in and sufficient.
**Trade-offs**: Re-renders children on update.
**Alternatives Considered**: Redux Toolkit (rejected as boilerplate-heavy for simple needs).

---

## Interview Notes
1. **What was the hardest architectural decision you made?**  
   (Reference ADR-006) Deciding to snapshot pricing. I initially tried to dynamically calculate premiums on the fly for dashboards, but realized if a base price changed, the user's dashboard would show a different price than what they paid. Snapshotting fixed this data integrity issue.

---

## Related Documents
- `../04_Database/ER_Diagram.md`
- `../07_Design_Patterns/Strategy.md`

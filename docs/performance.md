# Performance Review

> **Status: analysis.** This is a review of the current implementation with concrete recommendations. No code has been changed for this document.

## Current-state observations

### 1. Eager `@ManyToOne` associations (4)

These relations are mapped `EAGER` and are loaded for **every** entity read:

- `PremiumPayment → Policy` (`policy`)
- `CoverageOption → PolicyPlan` (`policyPlan`)
- `PricingRule → PolicyPlan` (`policyPlan`)
- `PolicyPlan → InsuranceProduct` (`insuranceProduct`)

Impact:
- Every `PremiumPayment` fetch also loads the full `Policy` (which itself has lazy collections) even when the caller only needs the payment row.
- Every `CoverageOption` / `PricingRule` fetch loads its `PolicyPlan`, and every `PolicyPlan` fetch loads its `InsuranceProduct`.
- All four are `@JsonIgnore`d, so the extra data never reaches JSON — it is pure overhead.

**Recommendation:** switch to `LAZY`. All call sites that read these relations sit inside `@Transactional` service methods, except `PremiumCalculationServiceImpl.generateQuoteInternal` (non-transactional), which would need `@Transactional(readOnly = true)` on its public entry points. After that change, lazy loading remains safe even with OSIV disabled. See [`decision-records.md`](decision-records.md).

### 2. Open Entity Manager in View (OSIV)

Spring Boot 4.0.6 enables OSIV by default (`spring.jpa.open-in-view`, `matchIfMissing=true`). Consequences:

- The Hibernate session is bound to the request thread for its **entire** lifetime, not just the transaction.
- Lazy access can (and currently does) happen outside `@Transactional` — convenient but keeps connections/sessions alive longer and masks transaction-boundary mistakes.

**Recommendation:** after making all lazy access transaction-scoped (item 1 + `PremiumCalculationServiceImpl`), set `spring.jpa.open-in-view=false` explicitly and document the transaction boundaries.

### 3. List endpoints and N+1

- `ClaimRepository` already uses `@EntityGraph(attributePaths={...})` on its paged/list finders to fetch the policy → customer/user and plan → product graphs in one query — good.
- `CoverageOptionServiceImpl.getCoverageOptions` and pricing lookups use derived `findByPolicyPlanId(...)` queries (fine).
- Plan detail assembly (`PolicyPlanServiceImpl` / `PricingRuleServiceImpl`) fetches plan, then coverage options, then durations, then pricing separately — acceptable at capstone scale but produces several queries per request. The `@EntityGraph` pattern could be applied here too.

### 4. `/api/public/stats` — 4 COUNT queries per hit

`PublicServiceImpl.getStats()` issues 4 COUNT queries (active products, active plans, total policies, processed claims) on **every** landing-page load. Trivial to cache (see [`caching.md`](caching.md)). Recommendation: cache with a 60s TTL.

### 5. Pagination & query validation

- All list endpoints are server-side paginated (`PageResponseDTO<T>` with `pageNumber` (0-based), `pageSize`, sorting) and bounded by `PaginationValidator` (`MAX_PAGE_SIZE=100`, whitelisted sort fields/directions).
- Customer-facing lists (`my-policies`, `my-claims`, `my-payments`) are returned in full (unpaged) — acceptable given single-customer volumes.

### 6. File uploads

- Claim documents upload **synchronously** to Cloudinary inside the claim request (multipart). Large files increase request latency. Acceptable at capstone scope; a queue/async path is the scale-out option (documented in [`decision-records.md`](decision-records.md)).

### 7. DTO mapping

- Services use `ModelMapper` and hand-written `convertToResponseDTO` helpers. Negligible cost; the hand-written mappers are explicit and readable.

### 8. Frontend

- **No code splitting / no lazy routes** — all page bundles load up front. This was a deliberate decision (instant navigation, `PageTransition` disabled). Trade-off: larger initial bundle (~single bundle). Fine for this app size; revisit if the bundle grows.
- Tables use a **stale-while-loading** strategy (dimmed previous rows while the next page loads) — keeps the UI responsive and avoids skeleton flash.
- `big.js` is declared in `package.json` but unused; `framer-motion`'s `PageTransition` and `ThemeToggle` stub are unused. Minor dead-weight cleanup candidates (no functional impact).
- `claimService.uploadDocuments` duplicates `claimDocumentService.uploadClaimDocuments` — a maintenance nit, not a performance issue.

## N+1 audit result

After auditing the relation-access sites (`serviceimpl/**`), **every** lazy-relation access is inside a `@Transactional` method except the one non-transactional quote path already called out in item 1. No hidden N+1 loops were found in controllers or DTO mapping.

## Recommended priority order

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| 1 | Cache `/api/public/stats` (60s) | S | Saves 4 queries/landing hit |
| 2 | `EAGER→LAZY` on 4 relations + `@Transactional(readOnly=true)` on quote service | S | Removes eager overhead on every payment/coverage/pricing/plan read |
| 3 | `spring.jpa.open-in-view=false` after (2) | S | Hardens transaction boundaries |
| 4 | `@EntityGraph` for plan-detail assembly | M | Cuts plan-browse query count |
| 5 | Cache catalog endpoints (Caffeine) | M | See [`caching.md`](caching.md) |
| 6 | Async Cloudinary upload | L | Only if uploads get heavy |

## See also

- [`caching.md`](caching.md)
- [`database.md`](database.md) — index recommendations for the read paths above
- [`decision-records.md`](decision-records.md)

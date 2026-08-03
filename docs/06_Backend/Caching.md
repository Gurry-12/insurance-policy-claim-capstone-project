# Caching Strategy

> **Status: analysis and design only — no caching is implemented in the current codebase.** This document describes the opportunity and the recommended design. Relocated from the legacy flat `docs/` tree; the canonical home is now `06_Backend/`.

## Current state

- No `@Cacheable`, no `CacheManager`, no Redis, no in-memory cache anywhere in the backend (`pom.xml` has no cache starter).
- Several read paths hit the database on **every** request:

| Hot path | Cost today | Consumers |
|----------|-----------|-----------|
| `GET /api/public/stats` | 4 COUNT queries per call | landing page (`/public/stats`) |
| `GET /api/products/active` | 1 query + per-plan coverage/pricing when expanded | product browsing |
| `GET /api/plans/active` / `GET /api/plans/{productId}/active` | plan + coverage options + pricing rules | plan browsing |
| `GET /api/admin/pricing-rules/plan/{planId}/active` | query + history | pricing panels |
| `GET /api/plans/{planId}` (detail) | plan + coverage + durations | plan detail, quote page |

## Design principles

1. **Never cache transactional, identity-scoped data** (policies, claims, payments, quotes). These are read infrequently and must always be fresh.
2. **Cache catalog + aggregate read-only data** with short, bounded TTLs.
3. **Evict on write** — when an admin deactivates a product/plan/pricing rule or edits pricing, the affected cache entries are invalidated so the next read is fresh.
4. Use **cache-aside** (`@Cacheable` / `@CacheEvict`).

## Recommended cache catalog

| Cache name | Contents | TTL | Evicted on |
|------------|----------|-----|------------|
| `stats` | `PublicStatsResponseDTO` (4 COUNTs collapsed to 1) | 60 s | — (time-based only) |
| `activeProducts` | active product list | 5 min | product create/update/activate/deactivate |
| `activePlans` | active plan catalog (per product) | 5 min | plan wizard/update/activate/deactivate, coverage change |
| `planCatalog` | plan detail bundle (plan + coverage + durations) | 5 min | plan/coverage/pricing writes |
| `pricingRules` | active pricing rule + audit metadata | 10 min | pricing rule create/activate/deactivate |

## Target shape (implementation sketch, not yet applied)

```yaml
spring.cache.type=caffeine
spring.cache.cache-names=stats,activeProducts,activePlans,planCatalog,pricingRules
spring.cache.caffeine.spec=maximumSize=500,expireAfterWrite=5m
```

Spring Boot `spring-boot-starter-cache` + `com.github.ben-manes.caffeine:caffeine`; `@EnableCaching` in a config class; `@Cacheable("stats")` on `PublicServiceImpl.getStats()`, `@CacheEvict(cacheNames="activeProducts", allEntries=true)` on product writes, and so on.

## Redis vs Caffeine

| Aspect | Caffeine (in-process) | Redis (external) |
|--------|----------------------|------------------|
| Complexity | Zero infra, in-process | Requires a Redis server |
| Consistency | Per-node (fine for 1 instance) | Shared across instances |
| Right for | Single-instance capstone deployment | Multi-instance production |
| Recommendation | **Adopt first** | Document as the scale-out path |

At capstone scale (single backend instance, MySQL localhost) Caffeine is the right call. Redis is recorded in [`../11_Developer_Guide/Deployment.md`](../11_Developer_Guide/Deployment.md) and [`../07_Design_Patterns/Decision_Records.md`](../07_Design_Patterns/Decision_Records.md) (ADR-007) as the future multi-instance step.

## Why this matters

`/api/public/stats` is on the public landing page — every visitor triggers 4 DB COUNTs. At low volume this is negligible; it becomes the first thing to cache because it is trivially cacheable (aggregate, non-transactional, 60s freshness is fine). The catalog endpoints are the second target because they are read by every browse/quote session but only change when an admin edits the catalog.

## See also

- [`Performance.md`](Performance.md) — related query/N+1 analysis
- [`Logging.md`](Logging.md) — how cache hits/misses would be observable
- [`../07_Design_Patterns/Decision_Records.md`](../07_Design_Patterns/Decision_Records.md) — ADR-007 ("No Redis at capstone scale")

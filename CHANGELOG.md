# Changelog

All notable changes to the Insurance Policy & Claim Management System are documented here.

Dates follow `YYYY-MM-DD` (newest first). Each entry links to the implementing commit.

---

## 2026-08-03

### Docs: Documentation reorganization into a single enterprise `docs/` tree

**Documentation only** - no application code changed.

- Consolidated all project documentation into one `docs/` tree: `00_Project_Overview/` through `11_Developer_Guide/` plus `12_Knowledge_Base/` (34 concept cards) and `09_Diagrams/` (Mermaid sequence/class/ER/activity/flowcharts).
- Added `docs/CONTRIBUTING.md` (mandatory 9-section template, knowledge-card template, single-source-of-truth map, and a code-verified Fact Sheet) and a top-level `docs/README.md` index with audience-specific reading paths.
- Added evaluation material (`10_Evaluation/`: project summary, feature/business-rule/API checklists, interview Q&A, roadmap) and a developer guide (`11_Developer_Guide/`: setup, run, build, environment, deployment, troubleshooting).
- Relocated the performance, caching, logging, and ADR analysis docs into the new tree (`06_Backend/Performance.md`, `06_Backend/Caching.md`, `06_Backend/Logging.md`, `07_Design_Patterns/Decision_Records.md`) with all cross-links repaired.
- Removed legacy/duplicate content: `imp-doc/` (~38 files, incl. byte-identical Postman scenario guides already kept in the backend `postman/`), superseded flat `docs/*.md` and `docs/architecture/`, UI `docs/` (stale theming specs), Vite boilerplate UI `README.md`, and backend `HELP.md`.
- Fixed all broken/renamed cross-links across the kept docs (full link scan now passes) and updated root `README.md`, backend `README.md`, and this changelog.

---

## 2026-08-02

### Docs: Technical documentation set + documentation consistency fixes

[`a36fa7b`](https://github.com/Gurry-12/insurance-policy-claim-capstone-project/commit/a36fa7b)

**Documentation only** - no application code changed.

- Added a new `docs/` set with architecture diagrams (Mermaid), sequence diagrams, database reference, caching, logging + logging strategy, performance, security, decision records (ADRs), and deployment guides; added `docs/README.md` index and wired it into the root README.
- Fixed documentation inconsistencies: backend stack/port (Spring Boot 4.0.6, `:8081`), `env.properties` key names in Quick Start, 18 broken frontend doc links, 7 broken "Related Documents" blocks, and stale `AGENT` role references (now `INTERNAL_STAFF` / staff) across `imp-doc/` and the frontend `docs/`.

---

## 2026-08-02

### Feat: Staff speciality UI, unified status color palette, role theming & UI cleanup

[`d00da73`](https://github.com/Gurry-12/insurance-policy-claim-capstone-project/commit/d00da73)

**Frontend**

- **`SpecialityBadge` component** (`src/components/ui/SpecialityBadge.jsx`) — renders a pill badge with a per-specialty icon and color. Mapped via `SPECIALITY_META` for `HEALTH`, `LIFE`, `MOTOR`, `TRAVEL`, `INSURANCE`, and `ALL` (generalist fallback). Used in the admin user detail page, staff dashboard, and sidebar. Sizes: `sm` / default / `lg`.
- **Unified status badge palette** — `StatusBadge.jsx` now drives all status pills through `STATUS_CONFIG` with CSS-variable tokens instead of Bootstrap utility classes. One hue per meaning:
  - Green = Active / Approved / Success / Recommended for Approval
  - Amber = Pending / Under Review / Pending Payment / **Expired** (changed from gray)
  - Blue = Submitted / Assigned
  - Orange = Recommended for Rejection
  - Red = Rejected / Cancelled / Failed
  - Slate = Inactive / default
  - Fixed undefined `-subtle` tokens and incorrect fallbacks; dark-mode text contrast improved.
  - `PricingRulePanel` migrated to the shared badge.
- **Role theming** — each portal applies an accent-only theme class on the layout wrapper (`THEME_CLASS_BY_ROLE` in `UnifiedLayout.jsx`): admin = blue (`theme-admin`), staff = violet (`theme-staff`, class name corrected from `theme-Staff`), customer = teal (`theme-customer`). Overrides live in `src/index.css` under `ROLE THEMES`.
- **Client-side pagination** — new `useClientPagination` hook (`src/hooks/useClientPagination.js`) paginates fully-fetched lists in memory (used by customer product/plan/policy lists); auto-clamps to last page when the dataset shrinks.
- **Shared dashboard components** — `StatTile` and `QuickAction` extracted to `src/components/dashboard/` and reused by Admin / Staff / Customer dashboards.
- **Removed 18 dead components** (unused `src/common/` breadcrumb/stat/header files, `DashboardCard`, `RoleBadge`, and 13 unused customer widgets under `src/components/ui/customer/`).
- Fixed mojibake string encodings and the OTP countdown timer; dark-mode fixes for auth pages (`Otp.css` added).

---

## 2026-07-31

### Fix: Whole-rupee amounts, `formatINR` app-wide, customer detail pagination

[`bb56c50`](https://github.com/Gurry-12/insurance-policy-claim-capstone-project/commit/bb56c50)

**Frontend**

- Added `formatINR(amount)` to `src/utils/formatters.js` — renders `₹` + integer value with `en-IN` grouping, rounding to whole rupees (no paise).
- Replaced ad-hoc amount rendering with `formatINR` across all role dashboards and policy/payment list & detail pages.
- Fixed `CustomerDetailPage` and `StaffCustomerDetailPage`: policy list pagination and policy loading on page change.

**Backend**

- Rounded premium calculations to whole rupees at the source (`AnnualPremiumCalculator`, `OneTimePremiumCalculator`).

---

## 2026-07-30

### Fix: Transactional integrity, real dashboard stats, parallel loading

[`0f8e4b7`](https://github.com/Gurry-12/insurance-policy-claim-capstone-project/commit/0f8e4b7)

**Backend**

- Added missing `@Transactional(readOnly = true)` to `PolicyServiceImpl`, `PricingRuleServiceImpl`, and `PublicServiceImpl`.
- Fixed `PremiumType` import in `PolicyServiceImpl`.
- Removed hardcoded statistics — stats are computed from the database.

**Frontend**

- Dashboard pages now load stat tiles in parallel (`Promise.all`) instead of sequentially.
- Fixed `policyService` returning the wrong value (returned `response.data` instead of the extracted payload).

### Feat: Public stats API + landing page hero stats

[`a9370dd`](https://github.com/Gurry-12/insurance-policy-claim-capstone-project/commit/a9370dd)

**Backend**

- New unauthenticated endpoint `GET /api/public/stats` (`PublicController`, permitted in `SecurityConfig`).
- `PublicService` / `PublicServiceImpl` aggregate live platform counts (active products, active plans, total policies, claims processed) and return `PublicStatsResponseDTO`. Falls back to zeroes if the DB is empty.

**Frontend**

- New `publicService.getPlatformStats()` consumed by `LandingPage.jsx` to populate hero statistics.

### Fix: Hide disabled coverage options from customer views

[`3ed3953`](https://github.com/Gurry-12/insurance-policy-claim-capstone-project/commit/3ed3953)

- `PolicyPlanServiceImpl` returns only active coverage options for customer-facing endpoints.
- `CustomerPlanListPage` and `PurchasePolicyPage` filter out disabled coverage options.

### Fix: Bug batch — inactive products, preview premium, claim docs, null pricing rules

[`ae49e3a`](https://github.com/Gurry-12/insurance-policy-claim-capstone-project/commit/ae49e3a)

**Backend**

- `InsuranceProductServiceImpl`: inactive products are no longer returned to customer-facing lookups; `previewPremium` handles empty product lists.
- `PolicyPlanServiceImpl`: missing `@Transactional` added; handles empty plan lists.
- `PricingRuleServiceImpl`: guards against null pricing rules (no more NPE); `@Transactional(readOnly)` on reads.
- `ClaimDocumentRepository`: corrected `ClaimDoc` type in the native query.

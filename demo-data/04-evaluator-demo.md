# Evaluator Display Data & Demo Guide

Everything you need to show the application working end-to-end, backed by the
seed data in `demo-data/sql/`. Import the three SQL files after the first app
boot, then restart the app (see `03-testing-flow.md` step 0).

## 1. Demo credentials
All seeded passwords are stored as real BCrypt hashes, so **log in directly** —
no registration/OTP needed for these accounts.

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@insurance.com` | `Admin@123` | Full access; also auto-created by DataInitializer |
| Customer | `rajesh.sharma@example.com` | `Customer@123` | Has ACTIVE policies + claims |
| Customer | `priya.verma@example.com` | `Customer@123` | Has ACTIVE motor policy |
| Customer | `amit.patel@example.com` | `Customer@123` | Has CANCELLED policy + open quote |
| Staff (HEALTH) | `kavita.nair@insurance.com` | `Staff@123` | Sees health claims |
| Staff (MOTOR) | `sanjay.gupta@insurance.com` | `Staff@123` | Sees motor claims |
| Pending customer | `meena.iyer@example.com` | `Customer@123` | Unverified; for the OTP/verify demo (OTP `555555`) |

## 2. Public stats (landing page)
`GET /api/public/stats` after seeding:
- `activeProducts = 5`
- `activePlans = 6`
- `totalPolicies = 4`
- `claimsProcessed = 3`

## 3. Pre-populated display data (by screen)
| Screen | What to show |
|---|---|
| Landing page | 4 stat cards from `GET /api/public/stats` (above) |
| Browse products | 5 products: Health, Motor, Life, Travel, General (all active) |
| Product detail | Plans under it, e.g. product 1 → *Health Shield*, *Critical Care Plus* |
| Plan detail | Coverage options (Base/Silver/Gold), allowed durations, premium type |
| Customer dashboard | Rajesh: 2 policies — `POL-3F7K9Q2X` (ACTIVE), `POL-1A4C7E9B` (PENDING_PAYMENT) |
| Admin/staff policy list | 4 policies across ACTIVE ×2, PENDING_PAYMENT, CANCELLED |
| Payments | `TXN-2026-HLTH-00001` (₹5,015 UPI SUCCESS), `TXN-2026-MOTR-00001` (₹12,272 CARD SUCCESS), `TXN-2025-LIFE-00001` (₹17,653 NET_BANKING SUCCESS), `TXN-2026-HLTH-00002` (₹2,655 PENDING) |
| Claims | `CLM-9U2X4Y6Z` APPROVED, `CLM-7J3K5L8M` UNDER_REVIEW, `CLM-2N4P6Q9R` SUBMITTED |
| Claim detail | Documents, staff/admin remarks, audit trail |
| Pricing | 6 ACTIVE pricing rules (one per plan); audit logs show initial creation by admin |

## 4. Customer view — Rajesh Sharma (rajesh.sharma@example.com)
- **My policies:** `POL-3F7K9Q2X` (ACTIVE, Health Shield, 1-yr, paid ₹5,015) and
  `POL-1A4C7E9B` (PENDING_PAYMENT, Health Shield, ₹2,655 due).
- **My payments:** `TXN-2026-HLTH-00001` and the pending `TXN-2026-HLTH-00002`.
- **My claims:** `CLM-9U2X4Y6Z` (APPROVED — ₹25,000) and `CLM-2N4P6Q9R` (SUBMITTED — ₹75,000).
- Demo actions: raise a claim on the ACTIVE policy; see the audit trail update.

## 5. Claim lifecycle walkthrough (live demo)
Shows the full state machine using seeded claim **`CLM-2N4P6Q9R`** (id 3, SUBMITTED):
1. Customer (Rajesh) → `GET /api/claims/my-claims` shows status SUBMITTED.
2. Staff (Kavita Nair, HEALTH) → `PATCH /api/claims/3/under-review` → UNDER_REVIEW.
3. Staff → `PATCH /api/claims/3/assign` → assigned to Kavita.
4. Staff → `PATCH /api/claims/3/review` with `RECOMMENDED_FOR_APPROVAL` + remarks.
5. Admin → `PATCH /api/claims/3/final-decision` with `APPROVED` + remarks.
6. Anyone → `GET /api/claims/3/history` shows the full audit trail
   (SUBMITTED → UNDER_REVIEW → RECOMMENDED_FOR_APPROVAL → APPROVED with updatedBy + remarks).

Already-approved example: `CLM-9U2X4Y6Z` has 3 history rows ending in APPROVED.

## 6. Quote → purchase → payment demo (live)
1. Login as **Priya Verma** (customer, id 3).
2. `POST /api/premium/calculate` `{planId: 3, coverageAmount: 500000, duration: 1, premiumType: ANNUAL}`
   → returns `quoteId` and `totalPremium: 12272.00`.
3. `POST /api/policies/purchase` `{quoteId}` → new policy in PENDING_PAYMENT.
4. `POST /api/payments` `{policyId, amount: 12272.00, paymentMode, paymentStatus: SUCCESS}` → policy ACTIVE.
   (Priya already holds an ACTIVE motor policy — a second one is allowed for non-HEALTH.)

## 7. OTP / verification demo (offline-friendly)
- Seeded pending customer **Meena Iyer** (`meena.iyer@example.com`, OTP `555555` / `555555`):
  `POST /api/auth/verify-otp` activates her account, then she can log in.
- Fresh register: OTPs appear in the server console (phone, when Twilio unconfigured) and in the
  `otp_verifications` table (both).

## 8. Sample seeded values (fast-reference)
- Products: Health, Motor, Life, Travel, General (ids 1–5)
- Plans: Health Shield, Critical Care Plus, Drive Safe, Life Protect, Trip Assure, Flexi Cover (ids 1–6)
- Pricing: base risk rate 0.0040 → 0.0200, processing fee 150–400, GST 18%
- Policies: `POL-3F7K9Q2X` (₹5,015 ACTIVE), `POL-8H2M5T9W` (₹12,272 ACTIVE),
  `POL-1A4C7E9B` (₹2,655 PENDING), `POL-5D6R8P0L` (₹17,653 CANCELLED)
- Claims: `CLM-9U2X4Y6Z` (₹25,000 APPROVED), `CLM-7J3K5L8M` (₹1,20,000 UNDER_REVIEW),
  `CLM-2N4P6Q9R` (₹75,000 SUBMITTED)

## 9. Reset after a demo run
The seed scripts use `INSERT IGNORE` + explicit IDs, so re-running them will not duplicate rows.
To fully reset the demo data (only the rows with the seeded IDs are removed):
```sql
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM claim_documents WHERE id IN (1,2,3);
DELETE FROM claim_status_histories WHERE id IN (1,2,3,4);
DELETE FROM claims WHERE id IN (1,2,3);
DELETE FROM premium_payments WHERE payment_id IN (1,2,3,4);
DELETE FROM policies WHERE id IN (1,2,3,4);
DELETE FROM quotes WHERE id IN (1,2,3,4);
DELETE FROM pricing_audit_logs WHERE id IN (1,2);
DELETE FROM pricing_rules WHERE id IN (1,2,3,4,5,6);
DELETE FROM coverage_options WHERE id BETWEEN 1 AND 18;
DELETE FROM policy_plan_durations;
DELETE FROM policy_plans WHERE id BETWEEN 1 AND 6;
DELETE FROM insurance_products WHERE id BETWEEN 1 AND 5;
DELETE FROM refresh_tokens WHERE id IN (1,2);
DELETE FROM otp_verifications WHERE id IN (1,2,3);
DELETE FROM staff_specialities WHERE id IN (1,2);
DELETE FROM customers WHERE id IN (1,2,3,4);
DELETE FROM users WHERE id BETWEEN 1 AND 7;
SET FOREIGN_KEY_CHECKS = 1;
```
(Admin id 1 is re-created by DataInitializer on next app boot.)

# API Checklist
> Comprehensive verified checklist of all 48 REST API endpoints for testing and validation.

---

## 🔐 1. Authentication & Session Management (`/api/auth`)
- [ ] `POST /api/auth/register` - Registers customer and sends dual OTP (SMS + Email).
- [ ] `POST /api/auth/verify-otp` - Verifies email & phone OTP to activate account.
- [ ] `POST /api/auth/resend-otp` - Resends OTP for unactivated account.
- [ ] `POST /api/auth/login` - Authenticates user, issues 15-min JWT & 7-day HttpOnly refresh cookie.
- [ ] `POST /api/auth/refresh` - Validates HttpOnly cookie, rotates refresh token, issues new JWT.
- [ ] `POST /api/auth/forgot-password` - Sends password reset OTP.
- [ ] `POST /api/auth/reset-password` - Resets password with OTP, increments `tokenVersion`, revokes sessions.
- [ ] `POST /api/auth/logout` - Blacklists JWT in Redis, revokes refresh token, clears cookie.
- [ ] `POST /api/auth/logout-all` - Revokes all active refresh tokens for the user in DB.

---

## 👥 2. User & Staff Management (`/api/users`)
- [ ] `POST /api/users/staff` - Creates Internal Staff member with domain speciality (Admin).
- [ ] `GET /api/users` - List all users (Admin).
- [ ] `GET /api/users/page` - Paginated user list with sorting & filtering (Admin).
- [ ] `GET /api/users/{id}` - Fetch user by ID (Admin).
- [ ] `PATCH /api/users/{id}/activate` - Activates user account (Admin).
- [ ] `PATCH /api/users/{id}/deactivate` - Deactivates user account & increments `tokenVersion` (Admin).

---

## 👤 3. Customer Profile Management (`/api/customers`)
- [ ] `POST /api/customers` - Create initial customer KYC profile (Customer).
- [ ] `GET /api/customers/profile` - Fetch authenticated customer's own profile (Customer).
- [ ] `PUT /api/customers/{customerId}` - Update customer KYC profile (Customer).
- [ ] `GET /api/customers/{customerId}` - Fetch customer by ID (Admin/Staff).
- [ ] `GET /api/customers` - List all customers (Admin/Staff).
- [ ] `GET /api/customers/page` - Paginated customer list (Admin/Staff).

---

## 📦 4. Insurance Product Catalog (`/api/products`)
- [ ] `POST /api/products` - Create new insurance product (Admin).
- [ ] `PUT /api/products/{id}` - Update product details (Admin).
- [ ] `GET /api/products/{id}` - Fetch product by ID (All authenticated).
- [ ] `GET /api/products/active` - List all active products (All authenticated).
- [ ] `GET /api/products/page` - Paginated product list (Admin/Staff).
- [ ] `PATCH /api/products/{id}/activate` - Activate product (Admin).
- [ ] `PATCH /api/products/{id}/deactivate` - Soft deactivate product (Admin).

---

## 📋 5. Policy Plans & Wizard (`/api/plans`)
- [ ] `POST /api/plans/wizard` - Multi-step transactional plan, coverage, and pricing rule creation (Admin).
- [ ] `PUT /api/plans/{planId}` - Update plan metadata (Admin).
- [ ] `GET /api/plans/{planId}` - Fetch plan by ID (All authenticated).
- [ ] `GET /api/plans/active` - List active plans across all products (All authenticated).
- [ ] `GET /api/plans/{productId}/active` - List active plans for a specific product (All authenticated).
- [ ] `GET /api/plans/page` - Paginated plan list (Admin/Staff).
- [ ] `PATCH /api/plans/{planId}/activate` - Activate plan (Admin).
- [ ] `PATCH /api/plans/{planId}/deactivate` - Soft deactivate plan (Admin).

---

## 🛡️ 6. Coverage Options & Pricing Rules (`/api/admin`)
- [ ] `GET /api/admin/policy-plans/{planId}/coverage-options` - List coverage tiers for plan (Admin).
- [ ] `POST /api/admin/policy-plans/{planId}/coverage-options` - Add custom coverage tier (Admin).
- [ ] `POST /api/admin/policy-plans/{planId}/coverage-options/regenerate` - Regenerate default tiers (Admin).
- [ ] `POST /api/admin/pricing-rules` - Create and activate new pricing rule for plan (Admin).
- [ ] `GET /api/admin/pricing-rules/plan/{planId}/active` - Get active pricing rule for plan (Admin).
- [ ] `POST /api/admin/pricing-rules/preview` - Preview premium calculation with test parameters (Admin).

---

## 📐 7. Actuarial Quotations (`/api/premium`)
- [ ] `POST /api/premium/calculate` - Generates actuarial quote & 30-min transient Quote snapshot (Customer).
- [ ] `POST /api/premium/admin/calculate` - Generates quote on behalf of customer (Admin/Staff).

---

## 📄 8. Policy Management (`/api/policies`)
- [ ] `POST /api/policies/purchase` - Consumes quote, snapshots rates, creates Policy in `PENDING_PAYMENT` (Customer).
- [ ] `POST /api/policies/issue` - Staff forward-dated policy issuance on behalf of customer (Staff/Admin).
- [ ] `GET /api/policies/my-policies` - List authenticated customer's policies (Customer).
- [ ] `GET /api/policies/{policyId}` - View policy details with remaining coverage calculation (Customer/Staff/Admin).
- [ ] `GET /api/policies/customer/{customerId}` - List policies by customer ID (Staff/Admin).
- [ ] `GET /api/policies` - List all policies in system with filters (Staff/Admin).
- [ ] `PATCH /api/policies/{policyId}/cancel` - Cancel active policy without open claims (Staff/Admin).

---

## 💳 9. Premium Payments (`/api/payments`)
- [ ] `POST /api/payments` - Record premium payment installment; activates policy upon first success (Customer/Staff).
- [ ] `GET /api/payments/my-payments` - List all payment history for logged-in customer (Customer).
- [ ] `GET /api/payments/my-policies/{policyId}` - List payments for customer's specific policy (Customer).
- [ ] `GET /api/payments/policy/{policyId}` - List payments for policy ID (Staff/Admin).
- [ ] `GET /api/payments/{paymentId}` - View specific payment record (Customer/Staff/Admin).
- [ ] `GET /api/payments/page` - Paginated payment ledger with filters (Staff/Admin).

---

## ⚖️ 10. Claims & Evidence (`/api/claims` & `/api/document`)
- [ ] `POST /api/claims/raise` - File new claim with attached multi-part documents to Cloudinary (Customer).
- [ ] `GET /api/claims/my-claims` - List claims filed by customer (Customer).
- [ ] `GET /api/claims/{claimId}` - Get full claim details with attached document URLs (Customer/Staff/Admin).
- [ ] `GET /api/claims/{claimId}/history` - View complete chronological status audit trail (Customer/Staff/Admin).
- [ ] `GET /api/claims` - List all claims filtered by staff speciality domain (Staff/Admin).
- [ ] `PATCH /api/claims/{claimId}/under-review` - Move submitted claim to review (Staff).
- [ ] `PATCH /api/claims/{claimId}/assign` - Assign claim to self (Staff).
- [ ] `PATCH /api/claims/{claimId}/review` - Submit formal recommendation (`RECOMMENDED_*`) (Staff).
- [ ] `PATCH /api/claims/{claimId}/final-decision` - Grant final binding decision (`APPROVED/REJECTED`) (Admin).
- [ ] `POST /api/document/upload/{claimId}` - Upload additional evidence documents (Customer).

---

## 🌐 11. Public APIs (`/api/public`)
- [ ] `GET /api/public/stats` - Public aggregation of active products, plans, and issued policies (Public).
- [ ] `GET /swagger-ui.html` - Interactive OpenAPI documentation.

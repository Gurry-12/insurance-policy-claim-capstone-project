# API Checklist
> Exhaustive list of REST API endpoints for testing and validation.

---

## Purpose
To verify the health, security, and correctness of all exposed API routes.

---

## Authentication (`/api/auth`)
- [ ] `POST /api/auth/register` - Creates user, sends OTP.
- [ ] `POST /api/auth/verify-otp` - Validates email & SMS OTP.
- [ ] `POST /api/auth/login` - Authenticates, issues JWT and HttpOnly cookie.
- [ ] `POST /api/auth/refresh` - Rotates refresh token, issues new JWT.
- [ ] `POST /api/auth/logout` - Blacklists token, clears cookie.
- [ ] `GET /api/auth/me` - Returns active user profile.

## Plans & Pricing (`/api/plans`)
- [ ] `GET /api/plans` - List all active policy plans (Public).
- [ ] `POST /api/plans` - Create a new plan (Admin only).
- [ ] `PUT /api/plans/{id}` - Update plan details (Admin only).
- [ ] `POST /api/plans/{id}/pricing-rules` - Add pricing modifiers (Admin).

## Quotes (`/api/quotes`)
- [ ] `POST /api/quotes/generate` - Calculates premium and creates a 30-min quote (Customer).
- [ ] `GET /api/quotes/{id}` - Retrieve quote details.

## Policies (`/api/policies`)
- [ ] `POST /api/policies/purchase` - Consumes quote, validates payment, creates Policy (Customer).
- [ ] `GET /api/policies/my-policies` - List active user's policies (Customer).
- [ ] `GET /api/policies` - List all policies in system (Staff/Admin).
- [ ] `POST /api/policies/{id}/cancel` - Force cancel a policy (Admin).

## Claims (`/api/claims`)
- [ ] `POST /api/claims` - Submit a new claim against a policy (Customer).
- [ ] `POST /api/claims/{id}/upload` - Upload supporting document to Cloudinary (Customer).
- [ ] `GET /api/claims/my-claims` - List user's claims (Customer).
- [ ] `GET /api/claims` - List all pending claims (Staff/Admin).
- [ ] `PUT /api/claims/{id}/recommend` - Move to `RECOMMENDED_*` (Staff).
- [ ] `PUT /api/claims/{id}/approve` - Move to `APPROVED/REJECTED` (Admin).

## System (`/api/system`)
- [ ] `GET /api/system/health` - Basic ping check.
- [ ] `GET /api/system/audit` - View pricing audit logs (Staff/Admin).

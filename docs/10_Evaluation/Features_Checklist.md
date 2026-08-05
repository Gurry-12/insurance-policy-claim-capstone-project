# Features Checklist
> Evaluator checklist to verify all system features function as designed.

---

## Purpose
A comprehensive, interactive checklist for Q&A, testing, and evaluation of the InsuranceFlow system, grouped by user roles.

---

## 1. Authentication & Security (All Users)
- [ ] **Registration:** User can register with valid email and password.
- [ ] **Dual OTP:** Registration triggers Email and SMS OTP.
- [ ] **Login:** User can login and receives a JWT (stored securely).
- [ ] **Token Refresh:** Waiting 1 minute (dev expiry) and navigating auto-refreshes the token.
- [ ] **Rate Limiting:** Attempting to login >5 times in a minute triggers 429 Too Many Requests.
- [ ] **Logout:** Logs user out, destroys HttpOnly cookie, blacklists token in Redis.

## 2. Customer Features
- [ ] **View Plans:** Can browse active `PolicyPlans`.
- [ ] **Generate Quote:** Can fill details and generate a price quote.
- [ ] **Purchase Policy:** Can convert an active quote into an `ACTIVE` policy using exact `BigDecimal` payment.
- [ ] **Duplicate Prevention:** Cannot purchase a second active policy of the same `ProductType`.
- [ ] **View My Policies:** Dashboard displays active and expired policies.
- [ ] **Download PDF:** Can generate and download a jsPDF summary of the policy.
- [ ] **Submit Claim:** Can submit a claim against an active policy.
- [ ] **Upload Document:** Can attach images/PDFs to the claim (uploads to Cloudinary).
- [ ] **Track Claim:** Can view real-time status of submitted claims.

## 3. Internal Staff Features
- [ ] **Dashboard:** Can view system-wide policy counts and pending claims.
- [ ] **View All Policies:** Can search and view any customer's policy details.
- [ ] **Claim Review (Maker):** Can review a `SUBMITTED` claim.
- [ ] **Claim Recommendation:** Can change claim status to `RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION`.
- [ ] **Pricing Audit:** Can view the historical `pricing_audit_log`.

## 4. Admin Features
- [ ] **System Configuration:** Can create new `PolicyPlan`, `PricingRule`, and `CoverageOption`.
- [ ] **Claim Approval (Checker):** Can review recommended claims and mark them as `APPROVED` or `REJECTED`.
- [ ] **Optimistic Locking Test:** (Advanced) Two admins trying to approve the same claim simultaneously results in a version conflict.
- [ ] **User Management:** Can deactivate user accounts (immediately invalidating their tokens).
- [ ] **Override Restrictions:** Can manually cancel active policies.

---

## Demo Instructions
1. Run backend, frontend, MySQL, and Redis.
2. Login with `admin@insurance.com` / `Admin@123`.
3. Create a Health Plan.
4. Open an Incognito window, register a new Customer.
5. Purchase the Health Plan as the Customer.
6. Submit a Claim.
7. Login as Staff (create one via Admin) and Recommend Approval.
8. Login as Admin and Approve the claim.

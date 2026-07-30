# Business Workflows

> **What:** End-to-end business process flows across all three user roles.  
> **Why:** Business workflows connect multiple pages, APIs, and state updates - understanding them is essential for feature development and debugging.  
> **How:** Each workflow maps user actions to the exact code that runs.

---

## Login Workflow

**Actors:** All users  
**Entry:** `/login`  
**Success Exit:** Role-specific dashboard

```
1. User opens /login
   └─ GuestRoute: if already authenticated → redirect to dashboard

2. User enters email + password
   └─ react-hook-form validates on 'onTouched'
   └─ Real-time inline errors appear after leaving each field

3. User clicks "Sign In"
   └─ handleSubmit(onSubmit) fires
   └─ setLoading(true) → LoadingButton shows spinner
   └─ authService.login({ email, btoa(password) })
   └─ POST /auth/login

4a. SUCCESS:
    └─ JWT decoded → user object built
    └─ AuthContext.login(token, user) → saved to localStorage
    └─ toast.success("Logged in successfully!")
    └─ navigate(ROLE_HOME[user.role] OR location.state.from)

4b. ERROR (email not verified):
    └─ error.message contains "verif"
    └─ ResendOtp modal opens
    └─ User resends OTP → navigates to /verify-otp

4c. ERROR (wrong credentials):
    └─ toast.error(err.message)
```

---

## Register Workflow

**Actors:** New customer  
**Entry:** `/register`  
**Success Exit:** `/verify-otp`

```
1. User fills registration form (name, mobile, email, password, confirmPassword)
   └─ Real-time confirmPassword comparison on every keystroke
   └─ PasswordStrength indicator updates live

2. User clicks "Register for free"
   └─ validate() runs all field checks
   └─ If errors → display inline, stop

3. authService.register(payload)
   └─ Mobile formatted: "+91" + 10-digit number
   └─ Password encoded: btoa(password)
   └─ POST /auth/register

4a. SUCCESS:
    └─ toast.success("Account created!")
    └─ setTimeout(2200ms)
    └─ navigate('/verify-otp', { state: { registered: true, email } })

4b. ERROR:
    └─ toast.error(err.message)
```

---

## Forgot Password Workflow

**Actors:** Any user  
**Entry:** `/forgot-password`  
**Success Exit:** `/login`

```
STEP 1 - Enter Email:
  POST /auth/forgot-password { email }
  → OTP sent to email
  → advance to step 2

STEP 2 - Verify OTP:
  POST /auth/verify-otp { email, otp }
  → advance to step 3

STEP 3 - New Password:
  POST /auth/reset-password { email, otp, newPassword: btoa(newPassword) }
  → toast.success
  → navigate('/login')
```

---

## Customer Profile Workflow

**Actors:** Customer, Staff  
**Entry:** `/customer/profile` or `/staff/profile`

### First-time Profile Creation

```
1. Customer logs in → navigates to /customer/profile
   └─ ProfilePage calls customerService.getProfile()
   └─ GET /customers/profile → 404 (profile not exist)
   └─ Shows "Complete Your Profile" CTA

2. Customer clicks "Complete Profile"
   └─ navigate('/customer/profile/edit')

3. EditProfilePage:
   └─ getProfile() → 404 → form starts empty (create mode)
   └─ Customer fills: DOB, address, city, state, pinCode, nomineeName, nomineeRelation

4. Submit:
   └─ customerService.createProfile(payload)
   └─ POST /customers
   └─ toast.success
   └─ navigate('/customer/profile')
```

### Editing Existing Profile

```
1. Customer visits /customer/profile → sees existing data
2. Clicks "Edit Profile"
3. EditProfilePage:
   └─ getProfile() → 200 → form pre-populated (edit mode)
4. Submit:
   └─ customerService.updateProfile(customerId, payload)
   └─ PUT /customers/:customerId
   └─ toast.success
   └─ navigate('/customer/profile')
```

---

## Purchase Policy Workflow

**Actors:** Customer  
**Entry:** `/customer/products` → `/customer/products/:productId/plans` → `/customer/purchase-policy/:planId`

```
1. Customer browses /customer/products
   └─ GET /products/active → displays product cards

2. Customer clicks "View Plans" on a product
   └─ navigate('/customer/products/:productId/plans')
   └─ GET /plans/:productId/active → displays plan cards

3. Customer clicks "Purchase" on a plan
   └─ navigate('/customer/purchase-policy/:planId')

4. PurchasePolicyPage loads:
   └─ GET /plans/:planId → shows plan details
   └─ GET /customers/profile → verify profile exists
   └─ If no profile → shows "Complete Profile" message with link

5. Customer selects Start Date, confirms

6. policyService.purchasePolicy({ planId, startDate })
   └─ POST /policies/purchase
   └─ Policy created with status: PENDING_PAYMENT
   └─ toast.success
   └─ navigate('/customer/payments/pay/' + policyId)

7. RecordPaymentPage:
   └─ GET /policies/:policyId → loads premium amount
   └─ Customer selects payment mode, confirms payment

8. paymentService.recordPayment({ policyId, amount, paymentMode, paymentStatus: 'SUCCESS' })
   └─ POST /payments
   └─ Backend: if SUCCESS → policy.status = ACTIVE
   └─ toast.success
   └─ navigate('/customer/policies')
```

---

## Issue Policy Workflow (Admin/Staff)

**Actors:** Admin, Staff  
**Entry:** `/admin/policies/issue` or `/staff/issue-policy`

```
1. Admin/Staff opens Issue Policy form
   └─ GET /customers → customer dropdown
   └─ GET /plans/active → plan dropdown

2. Selects customer, plan, and start date

3. policyService.issuePolicy({ customerId, planId, startDate })
   └─ POST /policies/issue
   └─ Policy created (admin can issue directly in ACTIVE status)
   └─ toast.success
   └─ navigate back to policies list
```

---

## Raise Claim Workflow

**Actors:** Customer  
**Entry:** `/customer/claims/raise`

```
1. Customer navigates to Raise Claim
   └─ GET /policies/my-policies → filter ACTIVE only for dropdown
   └─ If no active policies → shows message

2. Customer fills:
   - Policy (select from active policies)
   - Claim Amount (≤ remainingClaimAmount on policy)
   - Claim Reason (text)
   - Incident Date (within policy start-end range)

3. claimService.raiseClaim(formData)
   └─ FormData with:
      - claim: Blob({ policyId, claimAmount, claimReason, incidentDate })
      - [files: optional documents]
   └─ POST /claims/raise (multipart/form-data)
   └─ Claim created with status: SUBMITTED
   └─ toast.success
   └─ navigate('/customer/claims/upload/' + claimId)

4. UploadDocumentsPage:
   └─ GET /claims/:claimId → load claim (to know productType for document categories)
   └─ Customer selects and uploads files

5. claimService.uploadDocuments(claimId, files)
   └─ POST /document/upload/:claimId (multipart/form-data with files[])
   └─ Documents stored and linked to claim
   └─ toast.success
   └─ navigate('/customer/claims/' + claimId)
```

---

## Claim Review Workflow (Staff)

**Actors:** Internal Staff  
**Entry:** `/staff/claims`

```
1. Staff opens claim list
   └─ GET /claims → paginated claims

2. Staff opens a SUBMITTED claim
   └─ GET /claims/:id
   └─ GET /claims/:id/history

3. Staff clicks "Assign to Me"
   └─ PATCH /claims/:id/assign
   └─ Claim assigned to logged-in staff

4. Staff clicks "Mark Under Review"
   └─ PATCH /claims/:id/under-review
   └─ Claim status → UNDER_REVIEW

5. Staff reviews documents (DocumentPreviewModal)
   └─ Reviews claim details, attached files

6. Staff writes remarks and selects recommendation
   └─ recommendedStatus: RECOMMENDED_FOR_APPROVAL or RECOMMENDED_FOR_REJECTION

7. claimService.reviewClaim(claimId, { recommendedStatus, remarks })
   └─ PATCH /claims/:id/review
   └─ Claim status → RECOMMENDED_FOR_APPROVAL or RECOMMENDED_FOR_REJECTION
   └─ toast.success
```

---

## Claim Approval Workflow (Admin)

**Actors:** Admin  
**Entry:** `/admin/claims`

```
1. Admin sees claims with status RECOMMENDED_FOR_APPROVAL or RECOMMENDED_FOR_REJECTION
   └─ GET /claims (all)

2. Admin opens claim detail
   └─ GET /claims/:id
   └─ Reviews staff remarks, documents, history

3a. Admin APPROVES:
    └─ ConfirmModal opens (requires admin remarks)
    └─ claimService.approveClaim(claimId, { remarks })
    └─ PATCH /claims/:id/final-decision { recommendedStatus: "APPROVED", remarks }
    └─ Claim status → APPROVED
    └─ Policy remainingClaimAmount reduced
    └─ toast.success + page refresh

3b. Admin REJECTS:
    └─ ConfirmModal opens (requires admin remarks)
    └─ claimService.rejectClaim(claimId, remarks)
    └─ PATCH /claims/:id/final-decision { recommendedStatus: "REJECTED", remarks }
    └─ Claim status → REJECTED
    └─ toast.success + page refresh
```

---

## Dashboard Workflow

**Actors:** Admin  
**Entry:** `/admin/dashboard`

```
1. AdminDashboard mounts
   └─ dashboardService.getAdminStats() called
   └─ 7 parallel API calls (with individual error fallbacks)

2. Stats populate:
   └─ Total customers count
   └─ Active policies count
   └─ Pending/reviewed claims count
   └─ Active users count
   └─ Total products count
   └─ 5 most recent claims
   └─ 5 most recent policies

3. DashboardCards render with values
4. Recent activity tables render
```

---

## Payment Recording Workflow

**Actors:** Customer (self) or Staff (on behalf of customer)

```
Customer path: /customer/payments/pay/:policyId
Staff path:    /staff/payments/pay/:policyId

1. Page loads:
   └─ GET /policies/:policyId → load policy, get premiumAmount

2. Form pre-populates:
   - Amount = premiumAmount (editable)
   - Payment Mode (select)
   - Payment Status (select: SUCCESS or FAILED)

3. Submit:
   └─ paymentService.recordPayment({ policyId, amount, paymentMode, paymentStatus })
   └─ POST /payments
   └─ If paymentStatus === SUCCESS → backend activates policy
   └─ toast.success
   └─ navigate to policies list
```

---

## Related Documentation

- [Admin Pages](../pages/admin-pages.md)
- [Staff Pages](../pages/staff-pages.md)
- [Customer Pages](../pages/customer-pages.md)
- [Services Overview](../services/services-overview.md)
- [API Flow Diagrams](../services/api-flow-diagrams.md)

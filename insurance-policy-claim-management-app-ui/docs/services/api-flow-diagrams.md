# API Flow Diagrams

> **What:** Sequence diagrams for every major API interaction in the application.  
> **Why:** Shows the exact data path from UI event to database and back.  
> **How:** Each diagram follows the chain: React Component → Hook → Service → Axios → Backend → Response → State → UI

---

## Login Flow

```
User submits email + password
        ↓
Login.jsx (onSubmit)
  ├─ setLoading(true)
  └─ authService.login({ email, password })
           ↓
      authService.js
        password = btoa(password)
        axiosInstance.post('/auth/login', { email, btoa(password) })
                 ↓
          Request Interceptor
            NProgress.start()
            + Authorization: Bearer token (if exists)
                     ↓
              Backend: POST /auth/login
              Validates credentials
              Returns LoginResponseDTO
                     ↑
          Response Interceptor
            NProgress.done()
            parseSuccessResponse(response)
                 ↑
      authService.js
        jwtDecode(token) → extract role, name, email
        returns { token, user: { id, email, role, name, productSpeciality } }
           ↑
Login.jsx
  ├─ AuthContext.login(token, user)
  │    localStorage.setItem('ss_token', token)
  │    localStorage.setItem('ss_user', JSON.stringify(user))
  │    setToken(token) → setUser(user)
  ├─ toast.success("Logged in successfully!")
  └─ navigate(ROLE_HOME[user.role])
```

**On Error:**
```
axiosInstance catches error
  ↓
parseErrorResponse(error) → { message, fieldErrors }
  ↓
Login.jsx catch block
  ├─ If message contains "verif" → setShowUnverifiedModal(true)
  └─ else → toast.error(msg)
```

---

## Register Flow

```
User fills registration form
        ↓
Register.jsx (handleSubmit)
  ├─ validate() → check all fields
  ├─ if errors → setErrors(errs), return
  └─ authService.register(payload)
           ↓
      authService.js
        password = btoa(password)
        mobileNumber = "+91" + 10-digit
        axiosInstance.post('/auth/register', payload)
                 ↓
              Backend: POST /auth/register
              Creates user with ROLE_CUSTOMER
              Sends OTP to email + phone
                     ↑
Register.jsx
  ├─ toast.success("Account created!")
  └─ setTimeout(2200ms) → navigate('/verify-otp', { state: { registered: true, email } })
```

---

## Forgot Password Flow

```
Step 1: Enter Email
  ForgotPassword.jsx → POST /auth/forgot-password { email }
    ↓ on success → advance to step 2

Step 2: Enter OTP
  ForgotPassword.jsx → POST /auth/verify-otp { email, otp }
    ↓ on success → advance to step 3

Step 3: New Password
  ForgotPassword.jsx → POST /auth/reset-password { email, otp, newPassword: btoa(newPassword) }
    ↓ on success → toast.success + navigate('/login')
```

---

## Purchase Policy Flow

```
Customer clicks "Purchase" on a plan
        ↓
PurchasePolicyPage
  ├─ planService.getPlanById(planId)    → GET /plans/:planId
  ├─ customerService.getProfile()       → GET /customers/profile
  │    if null → redirect to /customer/profile/edit
  └─ Customer fills Start Date, submits
           ↓
      policyService.purchasePolicy({ planId, startDate })
           ↓
      axiosInstance.post('/policies/purchase', payload)
                 ↓
              Backend creates policy with status: PENDING_PAYMENT
                     ↑
PurchasePolicyPage
  ├─ toast.success("Policy purchased!")
  └─ navigate('/customer/payments/pay/' + policyId)
              ↓
      RecordPaymentPage
        paymentService.recordPayment({ policyId, amount, paymentMode, paymentStatus: 'SUCCESS' })
              ↓
        POST /payments
              ↓
        Backend: if SUCCESS → policy.status = ACTIVE
              ↑
        toast.success + navigate('/customer/policies')
```

---

## Raise Claim Flow

```
Customer clicks "Raise Claim"
        ↓
RaiseClaimPage
  ├─ policyService.getMyPolicies()  → GET /policies/my-policies
  │    Filters for ACTIVE policies only
  └─ Customer fills form (policy, amount, reason, incident date)
           ↓
      Build FormData:
        formData.append('claim', Blob(JSON.stringify(claimPayload)))
        // files optional at this stage
           ↓
      claimService.raiseClaim(formData)
           ↓
      axiosInstance.post('/claims/raise', formData)
        (request interceptor removes Content-Type so browser sets multipart/form-data boundary)
                 ↓
              Backend creates claim with status: SUBMITTED
                     ↑
RaiseClaimPage
  ├─ toast.success("Claim raised!")
  └─ navigate('/customer/claims/upload/' + claimId)
              ↓
      UploadDocumentsPage
        claimService.uploadDocuments(claimId, files[])
              ↓
        POST /document/upload/:claimId (multipart/form-data with files[])
              ↓
        Backend stores documents, links to claim
              ↑
        toast.success + navigate('/customer/claims/' + claimId)
```

---

## Claim Review Flow (Staff)

```
Staff opens StaffClaimDetailPage
  claimService.getClaimById(claimId)  → GET /claims/:claimId
  claimService.getClaimHistory(claimId) → GET /claims/:claimId/history

Staff assigns claim:
  claimService.assignClaim(claimId)  → PATCH /claims/:claimId/assign
  Claim status: SUBMITTED → UNDER_REVIEW (internal)

Staff marks under review:
  claimService.markUnderReview(claimId) → PATCH /claims/:claimId/under-review
  Claim status → UNDER_REVIEW

Staff reviews documents, writes remarks, selects recommendation:
  claimService.reviewClaim(claimId, {
    recommendedStatus: "RECOMMENDED_FOR_APPROVAL",
    remarks: "Documents verified, claim looks valid"
  })
  → PATCH /claims/:claimId/review
  Claim status → RECOMMENDED_FOR_APPROVAL (or REJECTION)
  toast.success
```

---

## Claim Approval Flow (Admin)

```
Admin opens ClaimDetailPage
  claimService.getClaimById(claimId)  → GET /claims/:claimId
  claimService.getClaimHistory(claimId) → GET /claims/:claimId/history

Admin clicks "Approve":
  ConfirmModal (with remarks input field)
    claimService.approveClaim(claimId, { remarks })
    → PATCH /claims/:claimId/final-decision
      body: { recommendedStatus: "APPROVED", remarks }
    Claim status → APPROVED
    Policy.remainingClaimAmount -= claimAmount
    toast.success + refresh page

Admin clicks "Reject":
  ConfirmModal (with remarks input field)
    claimService.rejectClaim(claimId, remarks)
    → PATCH /claims/:claimId/final-decision
      body: { recommendedStatus: "REJECTED", remarks }
    Claim status → REJECTED
    toast.success + refresh page
```

---

## Profile Create/Update Flow

```
Customer visits /customer/profile/edit
        ↓
EditProfilePage useEffect
  customerService.getProfile()  → GET /customers/profile
    if 404 → form is empty (create mode)
    if data → form pre-populated (edit mode)

Customer fills form, submits:
  if create mode → customerService.createProfile(payload)
    → POST /customers
  if edit mode → customerService.updateProfile(customerId, payload)
    → PUT /customers/:customerId
        ↓
    toast.success + navigate('/customer/profile')
```

---

## Paginated Table Data Flow

```
Page renders → useTableState() initialized
  ↓ getQueryParams() builds params
  ↓ useEffect fires (on mount + param changes)
  ↓ service.getAllXxxPaginated(params)
  ↓ axiosInstance.get('/endpoint', { params })
  ↓ parseSuccessResponse() → { data: [], pagination: {...} }
  ↓ setData(response.data)
  ↓ setTotalPages(response.pagination.totalPages)
  ↓ DataTable re-renders with new rows
  ↓ PaginationBar re-renders with new page info

User sorts column:
  ↓ handleSort(field) → setSortBy / setSortDirection
  ↓ getQueryParams() rebuilds params
  ↓ useEffect fires again → new API call

User enters filter:
  ↓ useDebounceFilters delays 500ms
  ↓ handleFilterChange(filters) → setCurrentPage(1)
  ↓ getQueryParams() rebuilds params
  ↓ useEffect fires → new API call

User changes page:
  ↓ PaginationBar onPageChange(page)
  ↓ setCurrentPage(page)
  ↓ getQueryParams() rebuilds params
  ↓ useEffect fires → new API call
```

---

## Logout Flow

```
User clicks Logout (in Sidebar)
        ↓
Sidebar.handleLogout()
  ├─ AuthContext.logout()
  │    localStorage.setItem('isLoggingOut', 'true')  ← prevents redirect loop
  │    localStorage.removeItem('ss_token')
  │    localStorage.removeItem('ss_user')
  │    setToken(null) → setUser(null)
  ├─ notify.success("Logged out successfully!")
  └─ navigate('/login', { replace: true })

ProtectedRoute sees isAuthenticated = false:
  checks localStorage.getItem('isLoggingOut')
  ├─ if true → removes flag → Navigate to /login (no extra toast)
  └─ if false → Navigate to /login with state.from (the interrupted page)
```

---

## Token Expiry Flow (Silent 401)

```
User is on a page, token has expired
        ↓
Any API call fires → Backend returns 401
        ↓
Axios response interceptor (in axiosInstance.js):
  localStorage.removeItem('ss_token')
  localStorage.removeItem('ss_user')
  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        ↓
GlobalApiHandler.jsx (listens for 'auth:unauthorized'):
  AuthContext.logout()
  notify.error('Session expired. Please log in again.')
  navigate('/login', { state: { from: location }, replace: true })
        ↓
After login → ProtectedRoute redirects to location.state.from.pathname
```

---

## Related Documentation

- [Axios Layer](./axios-layer.md)
- [Services Overview](./services-overview.md)
- [Business Workflows](../workflows/workflows.md)
- [Debugging](../debugging/debugging.md)

# Policy Management Feature Deep Dive

> **What:** Line-by-line execution flow for Purchasing Policies, Issuing Policies, and Recording Payments.
> **Why:** Critical core business flows that handle monetary transactions and change entity states (Pending Payment → Active).

---

## 1. Purchase Policy Flow (Customer)

**Entry Point:** `/customer/purchase-policy/:planId`

### Component Mount & Data Fetching

```text
React Router extracts `planId` from URL params.
↓
`<PurchasePolicyPage />` mounts.
↓
State initialized:
  `isSubmitting` = false
  `planDetails` = null
  `loadingPlan` = true
  `acceptedTerms` = false
↓
`useEffect(() => { ... }, [planId])` fires.
↓
`getPlanById(planId)` calls Axios: GET `/plans/:planId`
↓
Backend returns Plan DTO.
↓
`setPlanDetails(data)`, `setLoadingPlan(false)`.
↓
Component Re-renders:
  └─ Shows Plan Name, Coverage, Premium Amount, Term, and Start Date.
```

### Form Submission & Purchase Execution

```text
User checks the "Terms" checkbox.
↓
`onChange` → `setAcceptedTerms(e.target.checked)` and clears `errors.acceptedTerms`.
↓
User clicks "Confirm & Purchase Policy".
↓
`handleSubmit(e)` fires:
  1. `e.preventDefault()`
  2. Validation: `if (!acceptedTerms)` → `setErrors(...)` → halts execution.
  3. Valid: `setIsSubmitting(true)`
↓
Builds Payload:
  `planId`: Number(planId)
  `startDate`: new Date().toISOString().split('T')[0] (Local current date string YYYY-MM-DD)
↓
`purchasePolicy(payload)` calls Axios POST `/policies/purchase`.
↓
Backend creates Policy in `PENDING_PAYMENT` status.
↓
Axios returns 200 OK.
↓
`notify.success(res, "Policy Purchased Successfully")`.
↓
`navigate("/customer/policies")`.
↓
(Cleanup) `setIsSubmitting(false)`.
```

---

## 2. Issue Policy Flow (Admin / Staff)

**Entry Point:** `/admin/policies/issue` or `/staff/issue-policy`

### Component Mount & Parallel API Fetching

```text
`<IssuePolicyPage />` mounts.
↓
`useEffect(() => { ... }, [])` fires.
↓
`Promise.all([...])` executes 3 parallel API requests:
  1. `getAllCustomers()` (Admin/Staff gets full list)
  2. `getAllPlans()`
  3. `getAllProducts()`
↓
APIs return.
↓
Client-side Filtering Logic:
  1. Creates `Set(activeProductIds)`.
  2. Filters `plansData` to only include plans where `plan.productId` is in `activeProductIds` (Ensures we don't issue deprecated plans).
↓
State updates:
  `setCustomers(customersData)`
  `setPlans(activeProductPlans)`
↓
Auto-select logic:
  Selects the first customer and first plan in the list to pre-populate `formData`.
↓
Component Re-renders with `<ModernSelect>` dropdowns populated.
```

### Form Submission & Issuance Execution

```text
Admin clicks "Issue Policy".
↓
`handleSubmit(e)` fires.
↓
`setSubmitting(true)`.
↓
Validation ensures `customerId` and `planId` exist.
↓
Builds Payload:
  `customerId`: Number(formData.customerId)
  `planId`: Number(formData.planId)
  `startDate`: YYYY-MM-DD
↓
`issuePolicy(payload)` calls Axios POST `/policies/issue`.
↓
Backend validates staff role, creates Policy (likely directly `ACTIVE` or bypasses payment gateway constraints).
↓
Axios returns 200 OK.
↓
`notify.success(...)`.
↓
`navigate('/admin/policies')`.
```

---

## 3. Record Payment Flow (Customer / Staff)

**Entry Point:** `/customer/payments/pay/:policyId` (Optional `policyId` param)

### Component Mount & Pre-filling

```text
React Router parses optional `policyId`.
↓
`<RecordPaymentPage />` mounts.
↓
`useEffect` calls `getMyPolicies()`. (If Staff, calls `getAllPolicies()` or equivalent).
↓
API returns List of Policies.
↓
`setPolicies(list)`.
↓
If `policyId` exists in URL param:
  1. Finds the policy in the returned `list`.
  2. `setFormData(prev => ({ ...prev, amount: selected.premiumAmount }))`.
     └─ *Crucial feature*: Pre-fills the exact payment amount required so the user doesn't underpay/overpay.
↓
`setIsLoadingPolicies(false)`.
↓
Component Re-renders.
  └─ If URL had `policyId`, `<ModernSelect>` is `isDisabled={true}` (locked to that policy).
  └─ Amount input is `readOnly`.
```

### Payment Processing Execution

```text
User selects "Payment Mode" (UPI, CREDIT_CARD, etc.) and clicks "Pay Premium".
↓
`handleSubmit(e)` fires.
↓
Validates `policyId` and `amount > 0`.
↓
`setIsSubmitting(true)`.
↓
Builds Payload:
  `policyId`, `amount: Number`, `paymentMode`, `paymentStatus` (mocked as 'SUCCESS' in this UI).
↓
`recordPayment(payload)` calls Axios POST `/payments`.
↓
Backend logic execution:
  1. Records payment receipt.
  2. Evaluates if `policy.premiumAmount == payment.amount` and `status == SUCCESS`.
  3. Triggers Policy State Machine: `PENDING_PAYMENT` → `ACTIVE`.
↓
Axios returns 200 OK.
↓
`notify.success(...)`.
↓
`navigate("/customer/payments")`.
```

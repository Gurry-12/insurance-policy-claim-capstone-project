# Services Overview

> **What:** All 9 service files that manage API communication with the backend.  
> **Why:** Services are the single point of contact between React components and the backend REST API. No component should call `axiosInstance` directly.  
> **How:** Each service exports named async functions. Every function calls `axiosInstance` and returns the parsed response (already normalized by `apiAdapter`).  
> **Where:** `src/services/`

---

## Architecture

```
Component / Hook
    ↓ calls
Service Function (e.g., claimService.raiseClaim)
    ↓ calls
axiosInstance.post/get/put/patch
    ↓ interceptor transforms
apiAdapter.parseSuccessResponse / parseErrorResponse
    ↓ returns
{ success, message, data, pagination } or throws { message, fieldErrors, errorType }
```

---

## authService.js

**File:** [`src/services/authService.js`](../../src/services/authService.js)

**Purpose:** Handles all authentication and account management operations.

### Functions

| Function                     | Method | Endpoint                | Purpose                       |
| ---------------------------- | ------ | ----------------------- | ----------------------------- |
| `login(credentials)`         | POST   | `/auth/login`           | Authenticate user, decode JWT |
| `register(userData)`         | POST   | `/auth/register`        | Create new customer account   |
| `verifyOtpApi(payload)`      | POST   | `/auth/verify-otp`      | Verify OTP after registration |
| `resendOtpApi(payload)`      | POST   | `/auth/resend-otp`      | Resend OTP to email           |
| `forgotPasswordApi(payload)` | POST   | `/auth/forgot-password` | Initiate password reset       |
| `resetPasswordApi(payload)`  | POST   | `/auth/reset-password`  | Submit new password with OTP  |

### Password Encoding

All functions that send passwords encode them with `btoa()` before transmission:

```js
if (payloadReq.password) {
  payloadReq.password = btoa(payloadReq.password);
}
```

### Login Response Processing

```js
const decoded = jwtDecode(payload.token);
const user = {
  id: payload.userId,
  email: payload.email || decoded.sub,
  role: payload.role || decoded.role,
  name: payload.fullName || decoded.name,
  productSpeciality: payload.productSpeciality || decoded.productSpeciality,
};
return { token: payload.token, user, message: response.message };
```

**DTOs:**

- Request: `{ email, password }`
- Response: `LoginResponseDTO { userId, fullName, email, role, token, tokenType }`

---

## userService.js

**File:** [`src/services/userService.js`](../../src/services/userService.js)

**Purpose:** Admin-only user management operations.

### Functions

| Function                 | Method | Endpoint                    | Purpose                                |
| ------------------------ | ------ | --------------------------- | -------------------------------------- |
| `getAllUsers(params)`    | GET    | `/users/page`               | Paginated list of all users            |
| `getUserById(userId)`    | GET    | `/users/:userId`            | Single user details                    |
| `createStaff(payload)`   | POST   | `/users/staff`              | Create staff member (password encoded) |
| `activateUser(userId)`   | PATCH  | `/users/:userId/activate`   | Activate user account                  |
| `deactivateUser(userId)` | PATCH  | `/users/:userId/deactivate` | Deactivate user account                |

**DTO:** `UserResponseDTO { id, fullName, email, mobileNumber, role, isActive, emailVerified, productSpeciality, createdDate }`

---

## customerService.js

**File:** [`src/services/customerService.js`](../../src/services/customerService.js)

**Purpose:** Customer profile CRUD operations.

### Functions

| Function                             | Method | Endpoint                 | Purpose                               |
| ------------------------------------ | ------ | ------------------------ | ------------------------------------- |
| `getProfile()`                       | GET    | `/customers/profile`     | Current user's profile                |
| `createProfile(payload)`             | POST   | `/customers`             | Create new profile for logged-in user |
| `updateProfile(customerId, payload)` | PUT    | `/customers/:customerId` | Update existing profile               |
| `getAllCustomers()`                  | GET    | `/customers`             | All customers (admin use)             |
| `getAllCustomersPaginated(params)`   | GET    | `/customers/page`        | Paginated customer list               |
| `getCustomerById(customerId)`        | GET    | `/customers/:customerId` | Specific customer by ID               |

**DTO:** `CustomerResponseDTO { customerId, userId, fullName, email, mobileNumber, dateOfBirth, address, city, state, pinCode, nomineeName, nomineeRelation, createdDate }`

---

## productService.js

**File:** [`src/services/productService.js`](../../src/services/productService.js)

**Purpose:** Insurance product CRUD and status management.

### Functions

| Function                            | Method | Endpoint                          | Purpose                        |
| ----------------------------------- | ------ | --------------------------------- | ------------------------------ |
| `getAllProducts()`                  | GET    | `/products/active`                | All active products            |
| `getAllProductsPaginated(params)`   | GET    | `/products/page`                  | Paginated all products (admin) |
| `getProductById(productId)`         | GET    | `/products/:productId`            | Single product details         |
| `createProduct(payload)`            | POST   | `/products`                       | Create new product             |
| `updateProduct(productId, payload)` | PUT    | `/products/:productId`            | Update product                 |
| `activateProduct(productId)`        | PATCH  | `/products/:productId/activate`   | Activate product               |
| `deactivateProduct(productId)`      | PATCH  | `/products/:productId/deactivate` | Deactivate product             |
| `getActiveProducts()`               | GET    | `/products/active`                | Active products (alias)        |

**DTO:** `ProductResponseDTO { productId, productName, productType, description, isActive, createdDate }`

---

## planService.js

**File:** [`src/services/planService.js`](../../src/services/planService.js)

**Purpose:** Insurance plan CRUD and status management.

### Functions

| Function                       | Method | Endpoint                    | Purpose                     |
| ------------------------------ | ------ | --------------------------- | --------------------------- |
| `getAllPlansPaginated(params)` | GET    | `/plans/page`               | Paginated all plans (admin) |
| `getPlanById(planId)`          | GET    | `/plans/:planId`            | Single plan details         |
| `getAllPlans()`                | GET    | `/plans/active`             | All active plans            |
| `createPlan(payload)`          | POST   | `/plans`                    | Create new plan             |
| `updatePlan(planId, payload)`  | PUT    | `/plans/:planId`            | Update plan                 |
| `activatePlan(planId)`         | PATCH  | `/plans/:planId/activate`   | Activate plan               |
| `deactivatePlan(planId)`       | PATCH  | `/plans/:planId/deactivate` | Deactivate plan             |
| `getActivePlans()`             | GET    | `/plans/active`             | Active plans (alias)        |
| `getPlansByProduct(productId)` | GET    | `/plans/:productId/active`  | Plans filtered by product   |

**DTO:** `PlanResponseDTO { planId, productId, productName, planName, coverageAmount, premiumAmount, premiumType, duration, termsAndConditions, isActive, createdDate }`

---

## policyService.js

**File:** [`src/services/policyService.js`](../../src/services/policyService.js)

**Purpose:** Policy lifecycle management - purchase, issue, cancel, and retrieval.

### Functions

| Function                              | Method | Endpoint                         | Purpose                              |
| ------------------------------------- | ------ | -------------------------------- | ------------------------------------ |
| `getMyPolicies(params)`               | GET    | `/policies/my-policies`          | Current customer's policies          |
| `getAllPoliciesPaginated(params)`     | GET    | `/policies`                      | All policies paginated (admin/staff) |
| `getPolicyById(policyId)`             | GET    | `/policies/:policyId`            | Single policy details                |
| `getPoliciesByCustomerId(customerId)` | GET    | `/policies/customer/:customerId` | All policies for a customer          |
| `getClaimsByPolicy(policyId)`         | GET    | `/policies/:policyId/claims`     | Claims linked to a policy            |
| `issuePolicy(payload)`                | POST   | `/policies/issue`                | Admin/Staff issues a policy          |
| `cancelPolicy(policyId)`              | PATCH  | `/policies/:policyId/cancel`     | Cancel a policy                      |
| `purchasePolicy(payload)`             | POST   | `/policies/purchase`             | Customer self-purchases a policy     |

**Purchase DTO:** `PolicyPurchaseRequestDTO { planId, startDate }`  
**Issue DTO:** `PolicyIssueRequestDTO { customerId, planId, startDate }`  
**Response DTO:** `PolicyResponseDTO { policyId, policyNumber, customerId, customerName, planId, planName, startDate, endDate, policyStatus, totalPremiumPaid, coverageAmount, premiumAmount, premiumType, remainingClaimAmount, createdDate }`

**Policy Statuses:** `PENDING_PAYMENT`, `ACTIVE`, `CANCELLED`, `EXPIRED`

---

## paymentService.js

**File:** [`src/services/paymentService.js`](../../src/services/paymentService.js)

**Purpose:** Payment recording and retrieval.

### Functions

| Function                          | Method | Endpoint                          | Purpose                              |
| --------------------------------- | ------ | --------------------------------- | ------------------------------------ |
| `getAllPaymentsPaginated(params)` | GET    | `/payments/page`                  | All payments paginated (admin/staff) |
| `recordPayment(paymentData)`      | POST   | `/payments`                       | Record a new payment                 |
| `getMyPayments()`                 | GET    | `/payments/my-payments`           | Current customer's all payments      |
| `getPaymentsByMyPolicy(policyId)` | GET    | `/payments/my-policies/:policyId` | Customer's payments for a policy     |
| `getPaymentsByPolicyId(policyId)` | GET    | `/payments/policy/:policyId`      | Admin: all payments for a policy     |

**Payment DTO:**

```json
{
  "policyId": 7,
  "amount": 15000.0,
  "paymentMode": "UPI",
  "paymentStatus": "SUCCESS"
}
```

**Response DTO:** `PaymentResponseDTO { paymentId, policyId, policyNumber, amount, paymentMode, transactionReference, paymentStatus, paymentDate }`

---

## claimService.js

**File:** [`src/services/claimService.js`](../../src/services/claimService.js)

**Purpose:** Claim lifecycle management from creation to approval/rejection.

### Functions

| Function                                | Method | Endpoint                          | Purpose                               |
| --------------------------------------- | ------ | --------------------------------- | ------------------------------------- |
| `getAllClaimsPaginated(params, config)` | GET    | `/claims`                         | All claims paginated (admin/staff)    |
| `getClaimById(claimId)`                 | GET    | `/claims/:claimId`                | Single claim with full details        |
| `getMyClaims()`                         | GET    | `/claims/my-claims`               | Customer's own claims                 |
| `raiseClaim(formData)`                  | POST   | `/claims/raise`                   | Customer raises new claim (multipart) |
| `uploadDocuments(claimId, files)`       | POST   | `/document/upload/:claimId`       | Upload supporting files               |
| `assignClaim(claimId)`                  | PATCH  | `/claims/:claimId/assign`         | Staff self-assigns claim              |
| `markUnderReview(claimId)`              | PATCH  | `/claims/:claimId/under-review`   | Staff marks claim under review        |
| `reviewClaim(claimId, reviewData)`      | PATCH  | `/claims/:claimId/review`         | Staff submits recommendation          |
| `approveClaim(claimId, payload)`        | PATCH  | `/claims/:claimId/final-decision` | Admin approves claim                  |
| `rejectClaim(claimId, remarks)`         | PATCH  | `/claims/:claimId/final-decision` | Admin rejects claim                   |
| `getClaimHistory(claimId)`              | GET    | `/claims/:claimId/history`        | Claim audit trail                     |

**Important - Multipart Upload:**

`raiseClaim` sends a `FormData` object. The claim JSON is wrapped as a Blob:

```js
const formData = new FormData();
formData.append(
  "claim",
  new Blob([JSON.stringify(claimData)], { type: "application/json" }),
);
formData.append("files", file1);
```

The `axiosInstance` request interceptor automatically removes the `Content-Type` header for `FormData` so the browser can set it with the correct `boundary`.

**ClaimResponseDTO fields:** `claimId`, `claimNumber`, `policyId`, `policyNumber`, `customerName`, `claimAmount`, `claimReason`, `incidentDate`, `claimStatus`, `staffRemarks`, `adminRemarks`, `assignedStaffId`, `documents[]`, `createdDate`, `updatedDate`

---

## dashboardService.js

**File:** [`src/services/dashboardService.js`](../../src/services/dashboardService.js)

**Purpose:** Aggregates data from multiple APIs to produce dashboard statistics.

### Functions

| Function          | Returns                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `getAdminStats()` | Aggregated stats object with: `totalCustomers`, `activePolicies`, `claims`, `activeUsers`, `totalProducts`, `recentClaims`, `recentPolicies` |

### How it works

`getAdminStats()` fires 7 parallel API calls using `Promise` + `.catch(() => default)`. Each failure gracefully returns a zero/empty default, so one API failure doesn't break the entire dashboard.

```js
return {
  totalCustomers: await getCustomerCount().catch(() => 0),
  activePolicies: await getTotalActivePolicies().catch(() => 0),
  claims: await getOpenClaimsCount().catch(() => {}),
  // ...
};
```

---

## Related Documentation

- [Axios Layer](./axios-layer.md)
- [API Flow Diagrams](./api-flow-diagrams.md)
- [Custom Hooks](../hooks/hooks.md)
- [Error Handling](../debugging/debugging.md)

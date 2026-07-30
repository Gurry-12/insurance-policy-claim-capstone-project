# Customer Pages

> **What:** All pages in the Customer Portal (`ROLE_CUSTOMER`).  
> **Why:** Customers need to browse products, purchase policies, make payments, raise claims, and track their claim status.  
> **Where:** `src/pages/customer/`  
> **Role Restriction:** `ROLE_CUSTOMER` - enforced by `RoleProtectedRoute`

---

## Customer Dashboard

**File:** [`src/pages/customer/CustomerDashboard.jsx`](../../src/pages/customer/CustomerDashboard.jsx)  
**Route:** `/customer/dashboard`

### Purpose

The customer's home screen. Displays their active policy summary, recent claims, quick-action buttons, and payment history.

### APIs Used

- `GET /policies/my-policies` - customer's own policies
- `GET /claims/my-claims` - customer's own claims
- `GET /payments/my-payments` - customer's own payments
- `GET /customers/profile` - customer profile info

### State

| State      | Purpose                 |
| ---------- | ----------------------- |
| `policies` | List of user's policies |
| `claims`   | List of user's claims   |
| `payments` | List of user's payments |
| `profile`  | Customer profile object |
| `loading`  | Initial loading state   |

### Quick Actions

- **Browse Products** → `/customer/products`
- **My Policies** → `/customer/policies`
- **Raise a Claim** → `/customer/claims/raise`
- **Payment History** → `/customer/payments`

### Profile Completeness Check

If `profile` is null (customer hasn't filled their profile), the dashboard shows a prompt: _"Complete your profile to purchase policies."_

---

## Profile Pages

### ProfilePage

**Route:** `/customer/profile` and `/staff/profile`  
**File:** `src/pages/customer/profile/ProfilePage.jsx`

**Purpose:** Display the current user's full profile (personal details, nominee info).

**API:** `GET /customers/profile`

**Response fields:** `customerId`, `userId`, `fullName`, `email`, `mobileNumber`, `dateOfBirth`, `address`, `city`, `state`, `pinCode`, `nomineeName`, `nomineeRelation`, `createdDate`

**Actions:**

- **Edit Profile** → `/customer/profile/edit` (or `/staff/profile/edit`)

**Note:** If profile does not exist yet (404), a "Create Profile" CTA is shown.

---

### EditProfilePage

**Route:** `/customer/profile/edit` and `/staff/profile/edit`  
**File:** `src/pages/customer/profile/EditProfilePage.jsx`

**Purpose:** Create or update the customer's profile details.

**APIs:**

- `GET /customers/profile` - load current data (for edit mode)
- `POST /customers` - create new profile
- `PUT /customers/:customerId` - update existing profile

**Form Fields:**
| Field | Validation |
|---|---|
| Date of Birth | Required, must be in the past |
| Address | Required |
| City | Required |
| State | Required |
| Pin Code | Required, 5–10 digits |
| Nominee Name | Required |
| Nominee Relation | Required, select from predefined list |

**Dropdown Options (Nominee Relations):**  
Father, Mother, Spouse, Husband, Wife, Son, Daughter, Brother, Sister, Grandfather, Grandmother, Legal Guardian, Partner

**Success:** Toast + navigate back to profile page

---

## Product Browsing

### CustomerProductListPage

**Route:** `/customer/products`  
**File:** `src/pages/customer/products/CustomerProductListPage.jsx`

**Purpose:** Browse active insurance products as cards (Health, Life, Motor, Travel, Insurance).

**API:** `GET /products/active`

**Layout:** Card grid. Each card shows:

- Product name and type icon
- Description
- **"View Plans" button** → navigates to `/customer/products/:productId/plans`

---

## Plan Browsing

### CustomerPlanListPage

**Route:** `/customer/plans` or `/customer/products/:productId/plans`  
**File:** `src/pages/customer/plans/CustomerPlanListPage.jsx`

**Purpose:** Browse available insurance plans. Can be viewed as "all active plans" or filtered by a specific product.

**APIs:**

- `GET /plans/active` - all plans
- `GET /plans/:productId/active` - plans for a specific product (when `productId` param exists)

**Layout:** Card/table view. Each plan shows:

- Plan name, coverage amount, premium amount, premium type, duration
- **"Purchase Policy" button** → navigates to `/customer/purchase-policy/:planId`

---

## Policy Management

### PurchasePolicyPage

**Route:** `/customer/purchase-policy/:planId`  
**File:** `src/pages/customer/policies/PurchasePolicyPage.jsx`

**Purpose:** Confirm and purchase a policy for a selected plan.

**Pre-condition:** Customer must have a completed profile. If not, a redirect to `/customer/profile/edit` is shown.

**APIs:**

- `GET /plans/:planId` - load plan details
- `GET /customers/profile` - verify profile exists
- `POST /policies/purchase`

**Form Fields:**
| Field | Details |
|---|---|
| Plan | Pre-populated (read-only) from URL param |
| Start Date | Required, past or present |

**Request Payload:**

```json
{
  "planId": 5,
  "startDate": "2024-01-15"
}
```

**Success Flow:**

1. Policy created with status `PENDING_PAYMENT`
2. Toast success
3. Navigate to `/customer/payments/pay/:policyId` to complete the first payment

---

### CustomerPolicyListPage

**Route:** `/customer/policies`  
**File:** `src/pages/customer/policies/CustomerPolicyListPage.jsx`

**Purpose:** View all of the customer's own policies.

**API:** `GET /policies/my-policies`

**Table Columns:** Policy Number, Plan Name, Coverage, Premium, Start Date, Status, Actions

**Status values:** `PENDING_PAYMENT`, `ACTIVE`, `CANCELLED`, `EXPIRED`

---

### CustomerPolicyDetailPage

**Route:** `/customer/policies/:policyId`  
**File:** `src/pages/customer/policies/CustomerPolicyDetailPage.jsx`

**Purpose:** View detailed information about a specific policy.

**APIs:**

- `GET /policies/:policyId`
- `GET /payments/my-policies/:policyId`
- `GET /policies/:policyId/claims`

**Actions:**

- **Pay Premium** → `/customer/payments/pay/:policyId` (only if `PENDING_PAYMENT`)
- **Raise Claim** → `/customer/claims/raise` (only if `ACTIVE`)

---

## Payment Management

### CustomerPaymentHistoryPage

**Route:** `/customer/payments`  
**File:** `src/pages/customer/payments/CustomerPaymentHistoryPage.jsx`

**Purpose:** View all payment transactions made by the customer.

**API:** `GET /payments/my-payments`

**Table Columns:** Transaction Ref, Policy Number, Amount, Mode, Status, Date

---

### RecordPaymentPage

**Route:** `/customer/payments/pay/:policyId`  
**File:** `src/pages/customer/payments/RecordPaymentPage.jsx`

**Purpose:** Customer submits payment for a policy's premium.

**APIs:**

- `GET /policies/:policyId` - load policy details + premium amount
- `POST /payments`

**Form Fields:**
| Field | Details |
|---|---|
| Amount | Pre-populated from `premiumAmount`, editable |
| Payment Mode | Select: CREDIT_CARD, DEBIT_CARD, NET_BANKING, UPI |
| Payment Status | Select: SUCCESS, FAILED |

**Important:** The payment status is explicitly submitted by the user. This simulates a real payment gateway that would return SUCCESS/FAILED. A `PENDING_PAYMENT` policy becomes `ACTIVE` when a SUCCESS payment is recorded.

**Request Payload:**

```json
{
  "policyId": 7,
  "amount": 15000,
  "paymentMode": "UPI",
  "paymentStatus": "SUCCESS"
}
```

**Success:** Toast + navigate to `/customer/policies`

---

## Claim Management

### CustomerClaimListPage

**Route:** `/customer/claims`  
**File:** `src/pages/customer/claims/CustomerClaimListPage.jsx`

**Purpose:** View all of the customer's claims with current status.

**API:** `GET /claims/my-claims`

**Table Columns:** Claim Number, Policy Number, Amount, Reason, Status, Date, Actions

**Status Color Coding:**

- `SUBMITTED` → blue
- `UNDER_REVIEW` → yellow
- `RECOMMENDED_FOR_APPROVAL` → cyan
- `RECOMMENDED_FOR_REJECTION` → orange
- `APPROVED` → green
- `REJECTED` → red

---

### RaiseClaimPage

**Route:** `/customer/claims/raise`  
**File:** `src/pages/customer/claims/RaiseClaimPage.jsx`

**Purpose:** Customer raises a new insurance claim.

**Pre-condition:** Customer must have at least one `ACTIVE` policy.

**APIs:**

- `GET /policies/my-policies` - load active policies for dropdown
- `POST /claims/raise` (multipart/form-data)

**Form Fields:**
| Field | Validation |
|---|---|
| Policy | Required, select from ACTIVE policies only |
| Claim Amount | Required, positive, ≤ remaining claim amount |
| Claim Reason | Required, descriptive text |
| Incident Date | Required, must be within policy start and end dates |

**Important - Multipart Form:**  
The claim is submitted as `multipart/form-data`. The claim details are serialized as a JSON blob:

```js
const formData = new FormData();
formData.append(
  "claim",
  new Blob([JSON.stringify(claimPayload)], { type: "application/json" }),
);
// Files are optional at raise time - can be uploaded later
```

**Success Flow:**

1. Claim created with status `SUBMITTED`
2. Toast success
3. Navigate to `/customer/claims/upload/:claimId` to upload documents

---

### UploadDocumentsPage

**Route:** `/customer/claims/upload/:claimId`  
**File:** `src/pages/customer/claims/UploadDocumentsPage.jsx`

**Purpose:** Upload supporting documents for a claim (medical bills, FIR, photos, etc.).

**APIs:**

- `GET /claims/:claimId` - load claim details (to know the product type)
- `POST /document/upload/:claimId` (multipart/form-data with `files[]`)

**Document Categories (from `documentCategories.js`):**

| Product Type | Document Types                                                             |
| ------------ | -------------------------------------------------------------------------- |
| HEALTH       | Hospital Bills, Discharge Summary, Lab Reports, Pharmacy Bills, etc.       |
| MOTOR        | RC Book, Driving License, FIR, Vehicle Damage Photos, Garage Invoice, etc. |
| LIFE         | Death Certificate, Nominee Identity Proof, Hospital Records, etc.          |
| TRAVEL       | Passport Copy, Flight Ticket, Visa Copy, Police Complaint, etc.            |
| INSURANCE    | Policy Copy, Identity Proof, Property Photos, Survey Report, etc.          |

**Success:** Toast + navigate to `/customer/claims/:claimId`

---

### ClaimDetailsPage

**Route:** `/customer/claims/:claimId`  
**File:** `src/pages/customer/claims/ClaimDetailsPage.jsx`

**Purpose:** View full details of a specific claim including status, remarks, and uploaded documents.

**APIs:**

- `GET /claims/:claimId`
- `GET /claims/:claimId/history`

**Sections:**

- Claim summary (amount, reason, incident date, status)
- Staff remarks and admin remarks (visible after review)
- Uploaded documents list with preview links
- Claim history timeline

**Actions:**

- **Upload More Documents** → `/customer/claims/upload/:claimId` (if not yet resolved)

---

## Related Documentation

- [Customer Workflows](../workflows/workflows.md)
- [Services Overview](../services/services-overview.md)
- [Routing](../routing/routing.md)
- [Purchase Policy Workflow](../workflows/workflows.md#purchase-policy-workflow)
- [Raise Claim Workflow](../workflows/workflows.md#raise-claim-workflow)

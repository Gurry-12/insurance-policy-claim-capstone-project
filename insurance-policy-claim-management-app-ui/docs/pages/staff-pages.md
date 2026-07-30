# Staff Pages

> **What:** All pages in the Staff Console (`ROLE_INTERNAL_STAFF`).  
> **Why:** Staff members handle day-to-day operations: reviewing claims, issuing policies, recording payments, and assisting customers.  
> **Where:** `src/pages/staff/`  
> **Role Restriction:** `ROLE_INTERNAL_STAFF` - enforced by `RoleProtectedRoute`

---

## Staff Dashboard

**File:** [`src/pages/staff/StaffDashboard.jsx`](../../src/pages/staff/StaffDashboard.jsx)  
**Route:** `/staff/dashboard`

### Purpose

Provides a staff member's workspace overview. Shows assigned claims, pending actions, and relevant statistics specific to the staff member's product speciality.

### APIs Used

- `GET /claims` - claims assigned to/relevant for staff
- `GET /customers` - customer count
- `GET /policies` - recent policies
- `GET /payments/page` - recent payments

### State

| State | Purpose |
|---|---|
| Stats object | Counts of claims, policies, payments |
| Recent activity tables | Last 5 claims and policies |
| `loading` | Initial data loading |

### Product Speciality Filtering

Staff are assigned a `productSpeciality` (HEALTH, LIFE, MOTOR, TRAVEL, INSURANCE). The sidebar navigation filters items based on this value via:

```js
// In Sidebar.jsx
if (user?.role === "INTERNAL_STAFF" && user?.productSpeciality && item.speciality) {
  return item.speciality === user.productSpeciality || user.productSpeciality === "ALL";
}
```

---

## Customer Management (Staff)

### StaffCustomerListPage
**Route:** `/staff/customers`  
**File:** `src/pages/staff/customers/StaffCustomerListPage.jsx`

**Purpose:** View all customers that the staff member works with. Staff cannot create or delete customers.

**API:** `GET /customers/page?pageNumber=&pageSize=`

**Table Columns:** Sr No, Full Name, Email, Mobile, City, State, Actions (View)

**Features:** Search/filter, pagination

---

### StaffCustomerDetailPage
**Route:** `/staff/customers/:id`  
**File:** `src/pages/staff/customers/StaffCustomerDetailPage.jsx`

**Purpose:** View a customer's profile, their policies, and payment history.

**APIs:**
- `GET /customers/:id`
- `GET /policies/customer/:id`

---

## Policy Management (Staff)

### StaffPolicyListPage
**Route:** `/staff/policies`  
**File:** `src/pages/staff/policies/StaffPolicyListPage.jsx`

**Purpose:** View all policies accessible to the staff member.

**API:** `GET /policies?pageNumber=&pageSize=`

**Table Columns:** Policy Number, Customer, Plan, Start Date, End Date, Status, Premium, Actions

**Features:** Pagination, filter by status

---

### StaffPolicyDetailPage
**Route:** `/staff/policies/:policyId`  
**File:** `src/pages/staff/policies/StaffPolicyDetailPage.jsx`

**Purpose:** View a policy's complete details including payments and claims.

**APIs:**
- `GET /policies/:policyId`
- `GET /payments/policy/:policyId`
- `GET /policies/:policyId/claims`

---

### StaffIssuePolicyPage
**Route:** `/staff/issue-policy`  
**File:** `src/pages/staff/policies/StaffIssuePolicyPage.jsx`

**Purpose:** Staff member issues a policy for a customer. Similar to admin's `IssuePolicyPage`.

**APIs:**
- `GET /customers` (dropdown)
- `GET /plans/active` (dropdown)
- `POST /policies/issue`

**Form Fields:** Customer, Plan, Start Date

**Note:** Staff can issue policies but cannot cancel them (that requires admin).

---

## Claim Management (Staff)

### StaffClaimListPage
**Route:** `/staff/claims`  
**File:** `src/pages/staff/claims/StaffClaimListPage.jsx`

**Purpose:** View all claims. Staff can assign claims to themselves and set them to "Under Review".

**API:** `GET /claims?pageNumber=&pageSize=`

**Table Columns:** Claim Number, Customer, Policy, Amount, Status, Date, Actions

**Features:** Filter by status, sort

---

### StaffClaimDetailPage
**Route:** `/staff/claims/:id`  
**File:** `src/pages/staff/claims/StaffClaimDetailPage.jsx`

**Purpose:** View full claim details, assign the claim, mark as under review, and submit a recommendation.

**APIs:**
- `GET /claims/:id`
- `GET /claims/:id/history`
- `PATCH /claims/:id/assign` - assigns claim to the logged-in staff member
- `PATCH /claims/:id/under-review` - changes status to UNDER_REVIEW
- `PATCH /claims/:id/review` - submits recommendation (RECOMMENDED_FOR_APPROVAL / RECOMMENDED_FOR_REJECTION)

### Claim Review Workflow (Staff)

```
SUBMITTED
  ↓ Staff assigns claim
ASSIGNED (internal)
  ↓ Staff marks under review
UNDER_REVIEW
  ↓ Staff reviews documents and submits recommendation
RECOMMENDED_FOR_APPROVAL or RECOMMENDED_FOR_REJECTION
  ↓ Admin takes final decision
APPROVED or REJECTED
```

### Form (Claim Review)

```js
{
  recommendedStatus: "RECOMMENDED_FOR_APPROVAL" | "RECOMMENDED_FOR_REJECTION",
  remarks: string (required)
}
```

---

## Payment Management (Staff)

### StaffPaymentListPage
**Route:** `/staff/payments`  
**File:** `src/pages/staff/payments/StaffPaymentListPage.jsx`

**Purpose:** View all payment records accessible to staff.

**API:** `GET /payments/page?pageNumber=&pageSize=`

**Features:** Pagination, filter by payment status and mode

---

### StaffRecordPaymentPage
**Route:** `/staff/payments/pay/:policyId`  
**File:** `src/pages/staff/payments/StaffRecordPaymentPage.jsx`

**Purpose:** Staff records a payment on behalf of a customer for a specific policy.

**APIs:**
- `GET /policies/:policyId` (load policy info, premium amount)
- `POST /payments`

**Form Fields:**
| Field | Details |
|---|---|
| Policy ID | Pre-populated from URL param |
| Amount | Pre-populated from `premiumAmount`, editable |
| Payment Mode | Select: CARD, NET_BANKING, UPI, CASH |
| Payment Status | Select: SUCCESS, FAILED, PENDING |

**Success:** Toast + navigate back to payments list

---

## Shared Pages Used by Staff

Both staff and customers share these pages under their respective route prefixes:

| Route | Component |
|---|---|
| `/staff/profile` | `ProfilePage` (same component as customer's) |
| `/staff/profile/edit` | `EditProfilePage` (same component as customer's) |

The `ProfilePage` component detects the user's role and renders accordingly.

---

## Related Documentation

- [Customer Pages](./customer-pages.md)
- [Workflows - Claim Review](../workflows/workflows.md#claim-review-workflow)
- [Claim Service](../services/services-overview.md#claimservice)
- [Routing](../routing/routing.md)

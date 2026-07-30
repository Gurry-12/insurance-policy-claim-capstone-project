# Admin Pages

> **What:** All pages in the Admin Portal (`ROLE_ADMIN`).  
> **Why:** Admins manage the full lifecycle: users, products, plans, policies, claims, and payments.  
> **Where:** `src/pages/admin/`  
> **Role Restriction:** `ROLE_ADMIN` - enforced by `RoleProtectedRoute`

---

## Admin Dashboard

**File:** [`src/pages/admin/AdminDashboard.jsx`](../../src/pages/admin/AdminDashboard.jsx)  
**Route:** `/admin/dashboard`

### Purpose

High-level overview of the system state. Displays key metrics and recent activity.

### Service Used

`dashboardService.getAdminStats()` - aggregates multiple API calls:

| Metric                  | API Call                                |
| ----------------------- | --------------------------------------- |
| Total Customers         | `GET /customers`                        |
| Active Policies         | `GET /plans/active`                     |
| Pending/Reviewed Claims | `GET /claims?pageNumber=0&pageSize=100` |
| Active Users            | `GET /users`                            |
| Total Products          | `GET /products/active`                  |
| Recent Claims           | `GET /claims?pageNumber=0&pageSize=5`   |
| Recent Policies         | `GET /policies`                         |

### State

| State          | Source                             |
| -------------- | ---------------------------------- |
| `stats` object | `dashboardService.getAdminStats()` |
| `loading`      | `useState(true)` initially         |

### Components

- `DashboardCard` - displays each metric with icon and value
- Recent Claims table - compact `DataTable`
- Recent Policies table - compact `DataTable`

---

## User Management

### UserListPage

**Route:** `/admin/users`  
**File:** `src/pages/admin/users/UserListPage.jsx`

**Purpose:** View all system users (admins, staff, customers) in a paginated, filterable table.

**API:** `GET /users/page?pageNumber=&pageSize=&sortBy=&sortDirection=`

**Table Columns:** Sr No, Full Name, Email, Mobile, Role, Status, Actions

**Features:** Pagination, sort, filter by role/status, CSV export, click row to view details

---

### CreateStaffPage

**Route:** `/admin/users/create`  
**File:** `src/pages/admin/users/CreateStaffPage.jsx`

**Purpose:** Create a new internal staff member.

**API:** `POST /users/staff`

**Form Fields:**
| Field | Validation |
|---|---|
| Full Name | Required, letters + spaces only |
| Email | Required, valid email |
| Mobile Number | Required, 10 digits |
| Password | Required, 6–15 chars, strength policy |
| Product Speciality | Required, select from HEALTH/LIFE/MOTOR/TRAVEL/INSURANCE |

**Success:** Toast + navigate to `/admin/users`

---

### UserDetailPage

**Route:** `/admin/users/:id`  
**File:** `src/pages/admin/users/UserDetailPage.jsx`

**Purpose:** View a user's full profile, activate/deactivate account.

**APIs:**

- `GET /users/:id`
- `PATCH /users/:id/activate`
- `PATCH /users/:id/deactivate`

**Actions:**

- Toggle user active status with a `ConfirmModal`

---

## Customer Management

### CustomerListPage

**Route:** `/admin/customers`  
**File:** `src/pages/admin/customers/CustomerListPage.jsx`

**Purpose:** View all registered customer profiles.

**API:** `GET /customers/page?pageNumber=&pageSize=`

**Table Columns:** Sr No, Full Name, Email, City, State, Date of Birth, Actions

**Features:** Pagination, search, CSV export

---

### CustomerDetailPage

**Route:** `/admin/customers/:id`  
**File:** `src/pages/admin/customers/CustomerDetailPage.jsx`

**Purpose:** View a customer's complete profile, linked policies, and payment history.

**APIs:**

- `GET /customers/:id`
- `GET /policies/customer/:id`
- `GET /payments/policy/:policyId` (per policy)

---

## Product Management

### ProductListPage

**Route:** `/admin/products`  
**File:** `src/pages/admin/products/ProductListPage.jsx`

**Purpose:** View all insurance products with filter by status.

**API:** `GET /products/page?pageNumber=&pageSize=`

**Table Columns:** Sr No, Product Name, Type, Status, Created, Actions (View/Edit/Toggle)

**Features:** Pagination, status filter, CSV export, activate/deactivate

---

### CreateProductPage

**Route:** `/admin/products/create`  
**File:** `src/pages/admin/products/CreateProductPage.jsx`

**Purpose:** Create a new insurance product category.

**API:** `POST /products`

**Form Fields:**
| Field | Validation |
|---|---|
| Product Name | Required, letters + spaces only |
| Product Type | Required, select: HEALTH/AUTO/LIFE/TRAVEL/MOTOR |
| Description | Required |
| Active Status | Toggle (boolean) |

---

### EditProductPage

**Route:** `/admin/products/edit/:id`  
**File:** `src/pages/admin/products/EditProductPage.jsx`

**Purpose:** Edit an existing product's details.

**APIs:**

- `GET /products/:id` (load current values)
- `PUT /products/:id` (save changes)

---

### ProductDetailPage

**Route:** `/admin/products/:id`  
**File:** `src/pages/admin/products/ProductDetailPage.jsx`

**Purpose:** View a product's full details, its linked plans, and toggle active status.

**APIs:**

- `GET /products/:id`
- `PATCH /products/:id/activate`
- `PATCH /products/:id/deactivate`

---

## Plan Management

### PlanListPage

**Route:** `/admin/plans`  
**File:** `src/pages/admin/plans/PlanListPage.jsx`

**Purpose:** View all insurance plans with filter by product and status.

**API:** `GET /plans/page?pageNumber=&pageSize=`

**Table Columns:** Sr No, Plan Name, Product, Coverage Amount, Premium Amount, Type, Duration, Status, Actions

**Features:** Pagination, filter by product/status, CSV export

---

### CreatePlanPage

**Route:** `/admin/plans/create`  
**File:** `src/pages/admin/plans/CreatePlanPage.jsx`

**Purpose:** Create a new plan linked to a product.

**APIs:**

- `GET /products/active` (populate product dropdown)
- `POST /plans`

**Form Fields:**
| Field | Validation |
|---|---|
| Plan Name | Required, letters + spaces only |
| Product | Required, select from active products |
| Coverage Amount | Required, positive decimal |
| Premium Amount | Required, positive decimal |
| Premium Type | Required: ONE_TIME or ANNUAL |
| Duration | Required, positive integer (max 40 years) |
| Terms and Conditions | Required text |
| Active Status | Toggle |

---

### EditPlanPage

**Route:** `/admin/plans/edit/:id`  
**File:** `src/pages/admin/plans/EditPlanPage.jsx`

**Purpose:** Edit an existing plan's details.

**APIs:**

- `GET /plans/:id`
- `PUT /plans/:id`

---

### PlanDetailPage

**Route:** `/admin/plans/:id`  
**File:** `src/pages/admin/plans/PlanDetailPage.jsx`

**Purpose:** View a plan's complete details and toggle active status.

**APIs:**

- `GET /plans/:id`
- `PATCH /plans/:id/activate`
- `PATCH /plans/:id/deactivate`

---

## Policy Management

### PolicyListPage

**Route:** `/admin/policies`  
**File:** `src/pages/admin/policies/PolicyListPage.jsx`

**Purpose:** View all policies across all customers.

**API:** `GET /policies?pageNumber=&pageSize=`

**Table Columns:** Sr No, Policy Number, Customer, Plan, Start Date, End Date, Status, Premium, Actions

**Features:** Pagination, filter by status, CSV export

---

### PolicyDetailPage

**Route:** `/admin/policies/:id`  
**File:** `src/pages/admin/policies/PolicyDetailPage.jsx`

**Purpose:** View a policy's complete details, payment history, and associated claims.

**APIs:**

- `GET /policies/:id`
- `GET /payments/policy/:id`
- `GET /policies/:id/claims`
- `PATCH /policies/:id/cancel`

---

### IssuePolicyPage

**Route:** `/admin/policies/issue`  
**File:** `src/pages/admin/policies/IssuePolicyPage.jsx`

**Purpose:** Admin manually issues a policy for a specific customer.

**APIs:**

- `GET /customers` (populate customer dropdown)
- `GET /plans/active` (populate plan dropdown)
- `POST /policies/issue`

**Form Fields:**
| Field | Validation |
|---|---|
| Customer | Required, select from all customers |
| Plan | Required, select from active plans |
| Start Date | Required, past or present |

---

## Claim Management

### ClaimListPage

**Route:** `/admin/claims`  
**File:** `src/pages/admin/claims/ClaimListPage.jsx`

**Purpose:** View all claims in the system with filter by status.

**API:** `GET /claims?pageNumber=&pageSize=`

**Table Columns:** Sr No, Claim Number, Customer, Policy, Amount, Status, Date, Actions

**Features:** Pagination, filter by status, sort by date/amount

---

### ClaimDetailPage

**Route:** `/admin/claims/:id`  
**File:** `src/pages/admin/claims/ClaimDetailPage.jsx`

**Purpose:** View full claim details, audit history, and take approval/rejection decisions.

**APIs:**

- `GET /claims/:id`
- `GET /claims/:id/history`
- `PATCH /claims/:id/final-decision` (APPROVED / REJECTED)

**Business Rule:** Admin can approve or reject claims. Staff can only recommend.

**Components:**

- Claim detail cards
- Document viewer (shows uploaded documents with preview)
- Claim history timeline
- Approve/Reject action buttons with `ConfirmModal` + remarks input

---

## Payment Management

### PaymentListPage

**Route:** `/admin/payments`  
**File:** `src/pages/admin/payments/PaymentListPage.jsx`

**Purpose:** View all payment transactions across all policies.

**API:** `GET /payments/page?pageNumber=&pageSize=`

**Table Columns:** Sr No, Transaction Ref, Policy Number, Customer, Amount, Mode, Status, Date

**Features:** Pagination, filter by status/mode, CSV export

---

## Related Documentation

- [Admin Workflows](../workflows/workflows.md)
- [Services Overview](../services/services-overview.md)
- [Routing](../routing/routing.md)

# 🧩 Shared & Common Components

> Covers everything under `components/` - the reusable UI building blocks used across all roles.

---

## 📌 Overview

All reusable components live in `src/components/`. They are **role-agnostic** - the same component is used in Admin, Agent, and Customer pages.

The design principle: **pages contain logic, components contain presentation.**

---

## 🗂️ Component Categories

```
components/
├── cards/          ← Dashboard stat cards
├── common/         ← App-wide utilities (spinner, header, badges)
├── forms/          ← Reusable form field components
├── layouts/        ← Page wrapper layouts
├── modals/         ← Dialog/popup components
├── navigation/     ← Sidebar + Top navbar
├── tables/         ← Data table + pagination
└── ui/             ← Status indicators, error displays
```

---

## 📊 Cards

### `DashboardCard.jsx`

A summary card showing a KPI metric (e.g., "Total Policies: 142").

**Props:**

```jsx
<DashboardCard
  title="Total Policies"
  value={142}
  icon="bi bi-file-earmark-text"
  color="primary" // Bootstrap color variant
  subtitle="This month" // optional
/>
```

**Used in:** `AdminDashboard`, `AgentDashboard`, `CustomerDashboard`

---

## 🔧 Common

### `LoadingSpinner.jsx`

Full-page or inline spinner shown during API fetches.

```jsx
<LoadingSpinner />          // centered full-page
<LoadingSpinner size="sm"/> // small inline
```

### `PageHeader.jsx`

Consistent page title + breadcrumb area.

```jsx
<PageHeader
  title="Claim Management"
  breadcrumbs={["Admin", "Claims"]}
  actions={<button>Export</button>} // optional right-side buttons
/>
```

### `RoleBadge.jsx`

Colored badge showing a user's role.

```jsx
<RoleBadge role="ROLE_ADMIN" />    // renders "Admin" in red
<RoleBadge role="ROLE_AGENT" />    // "Agent" in blue
<RoleBadge role="ROLE_CUSTOMER" /> // "Customer" in green
```

### `ThemeToggle.jsx`

Light/dark mode toggle switch. Reads/writes from `ThemeContext`.

```jsx
<ThemeToggle />
```

**Used in:** `TopNavbar`

---

## 📝 Forms

### `FormInput.jsx`

A labeled `<input>` with error display built in.

```jsx
<FormInput
  label="Email Address"
  id="email"
  type="email"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  error={errors.email}
  required
/>
```

### `FormSelect.jsx`

A labeled `<select>` dropdown with options array.

```jsx
<FormSelect
  label="Insurance Product"
  id="productId"
  value={formData.productId}
  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
  options={products.map((p) => ({ value: p.id, label: p.name }))}
  error={errors.productId}
/>
```

### `FormTextarea.jsx`

A labeled `<textarea>` with character count (optional).

```jsx
<FormTextarea
  label="Claim Description"
  id="description"
  value={formData.description}
  onChange={handleChange}
  rows={4}
  error={errors.description}
/>
```

---

## 🗃️ Layouts

### `DashboardLayout.jsx`

The master layout wrapper for **all authenticated pages**.

```
┌─────────────────────────────────────┐
│           TopNavbar                 │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │     {children}           │
│          │   (Page Content)         │
│          │                          │
└──────────┴──────────────────────────┘
```

```jsx
// Usage in App.jsx for role routes:
<Route element={<DashboardLayout />}>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="claims" element={<ClaimListPage />} />
  // ...
</Route>
```

**Renders:** `Sidebar` + `TopNavbar` + `<Outlet />` (from React Router)

---

## 💬 Modals

### `ConfirmModal.jsx`

A "Are you sure?" confirmation dialog.

```jsx
<ConfirmModal
  isOpen={showConfirm}
  title="Delete Product"
  message="This will permanently delete the product. Continue?"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
  confirmText="Delete"
  confirmVariant="danger"
/>
```

### `AlertModal.jsx`

A success or error notification dialog.

```jsx
<AlertModal
  isOpen={showAlert}
  type="success" // "success" | "error" | "warning" | "info"
  title="Claim Submitted!"
  message="Your claim has been filed and is under review."
  onClose={() => setShowAlert(false)}
/>
```

---

## 🧭 Navigation

### `Sidebar.jsx`

The left-side navigation menu - renders different links per role.

**Logic:**

```js
// Inside Sidebar.jsx
const { user } = useAuth();

// Role-based nav items
const navItems =
  {
    ROLE_ADMIN: [
      { label: "Dashboard", path: "/admin/dashboard", icon: "bi-grid" },
      { label: "Products", path: "/admin/products", icon: "bi-box" },
      { label: "Plans", path: "/admin/plans", icon: "bi-list-check" },
      { label: "Policies", path: "/admin/policies", icon: "bi-file-text" },
      { label: "Customers", path: "/admin/customers", icon: "bi-people" },
      { label: "Claims", path: "/admin/claims", icon: "bi-clipboard2-pulse" },
      { label: "Payments", path: "/admin/payments", icon: "bi-cash-coin" },
      { label: "Users", path: "/admin/users", icon: "bi-person-gear" },
      { label: "Reports", path: "/admin/reports", icon: "bi-bar-chart" },
    ],
    ROLE_AGENT: [
      { label: "Dashboard", path: "/agent/dashboard", icon: "bi-grid" },
      { label: "Customers", path: "/agent/customers", icon: "bi-people" },
      { label: "Policies", path: "/agent/policies", icon: "bi-file-text" },
      { label: "Claims", path: "/agent/claims", icon: "bi-clipboard2-pulse" },
      { label: "Payments", path: "/agent/payments", icon: "bi-cash-coin" },
    ],
    ROLE_CUSTOMER: [
      { label: "Dashboard", path: "/customer/dashboard", icon: "bi-grid" },
      { label: "Products", path: "/customer/products", icon: "bi-box" },
      {
        label: "My Policies",
        path: "/customer/policies",
        icon: "bi-file-text",
      },
      {
        label: "Claims",
        path: "/customer/claims",
        icon: "bi-clipboard2-pulse",
      },
      { label: "Payments", path: "/customer/payments", icon: "bi-cash-coin" },
      { label: "Profile", path: "/customer/profile", icon: "bi-person" },
    ],
  }[user?.role] ?? [];
```

### `TopNavbar.jsx`

Top horizontal bar with:

- App logo / name
- Current user info (name, role badge)
- `ThemeToggle`
- Logout button

---

## 📋 Tables

### `DataTable.jsx`

Reusable table component that accepts columns and data.

```jsx
<DataTable
  columns={[
    { key: "policyNumber", label: "Policy #" },
    { key: "customerName", label: "Customer" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button onClick={() => navigate(`/admin/policies/${row.id}`)}>
          View
        </button>
      ),
    },
  ]}
  data={policies}
  loading={loading}
  emptyMessage="No policies found"
/>
```

### `PaginationBar.jsx`

Renders page navigation buttons.

```jsx
<PaginationBar
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

---

## 🎨 UI

### `EmptyState.jsx`

Shown when a list has no results.

```jsx
<EmptyState
  icon="bi-inbox"
  title="No Claims Yet"
  message="You haven't raised any claims."
  actionLabel="Raise a Claim"
  onAction={() => navigate("/customer/claims/raise")}
/>
```

### `ErrorAlert.jsx`

Displays an API error message inline.

```jsx
<ErrorAlert message={error} onDismiss={() => setError(null)} />
```

### `StatusBadge.jsx`

Color-coded pill badge for status values.

```jsx
<StatusBadge status="ACTIVE" />        // green
<StatusBadge status="PENDING" />       // yellow
<StatusBadge status="UNDER_REVIEW" />  // blue
<StatusBadge status="APPROVED" />      // green
<StatusBadge status="REJECTED" />      // red
<StatusBadge status="EXPIRED" />       // gray
```

---

## 📐 Concepts to Learn

| Concept                       | Applied In                 | Resource                                                                                      |
| ----------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| Component Props & PropTypes   | All components             | [React Props](https://react.dev/learn/passing-props-to-a-component)                           |
| React `children` prop         | `DashboardLayout`          | [Children docs](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) |
| React Router `<Outlet>`       | `DashboardLayout`          | [Outlet API](https://reactrouter.com/api/components/Outlet)                                   |
| Bootstrap Icons               | All icon usage             | [Bootstrap Icons](https://icons.getbootstrap.com/)                                            |
| Conditional class names       | `StatusBadge`, `RoleBadge` | Plain JS / classnames library                                                                 |
| `useContext` + `ThemeContext` | `ThemeToggle`              | [useContext](https://react.dev/reference/react/useContext)                                    |
| `useLocation` for active nav  | `Sidebar` active link      | [useLocation](https://reactrouter.com/api/hooks/useLocation)                                  |

---

## ✅ Components Checklist

**Cards**

- [ ] `DashboardCard.jsx` - props: title, value, icon, color

**Common**

- [ ] `LoadingSpinner.jsx`
- [ ] `PageHeader.jsx` - props: title, breadcrumbs, actions
- [ ] `RoleBadge.jsx` - props: role
- [ ] `ThemeToggle.jsx`

**Forms**

- [ ] `FormInput.jsx` - props: label, id, type, value, onChange, error
- [ ] `FormSelect.jsx` - props: label, id, options, value, onChange, error
- [ ] `FormTextarea.jsx` - props: label, id, value, onChange, rows, error

**Layout**

- [ ] `DashboardLayout.jsx` - Sidebar + Navbar + Outlet

**Modals**

- [ ] `ConfirmModal.jsx` - props: isOpen, title, message, onConfirm, onCancel
- [ ] `AlertModal.jsx` - props: isOpen, type, title, message, onClose

**Navigation**

- [ ] `Sidebar.jsx` - role-aware nav items
- [ ] `TopNavbar.jsx` - user info, theme toggle, logout

**Tables**

- [ ] `DataTable.jsx` - props: columns, data, loading, emptyMessage
- [ ] `PaginationBar.jsx` - props: currentPage, totalPages, onPageChange

**UI**

- [ ] `EmptyState.jsx` - props: icon, title, message, actionLabel, onAction
- [ ] `ErrorAlert.jsx` - props: message, onDismiss
- [ ] `StatusBadge.jsx` - props: status

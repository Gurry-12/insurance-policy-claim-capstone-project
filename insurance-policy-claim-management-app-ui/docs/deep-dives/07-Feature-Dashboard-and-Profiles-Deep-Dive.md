# Dashboard and Profiles Feature Deep Dive

> **What:** Line-by-line execution flow for Dashboards (Customer, Admin) and Profile components.
> **Why:** Understand how complex data aggregation is handled on the client side using `Promise.all` and how Profile states are passed to avoid redundant API calls.

---

## 1. Dashboard Data Aggregation Flow (Customer Dashboard)

**Entry Point:** `/customer/dashboard`

### Component Mount & Parallel Fetching

```text
`<CustomerDashboard />` mounts.
↓
State initialized:
  `loading` = true
  `stats` = { totalPolicies: 0, pendingPolicies: 0, ... }
↓
`useEffect` calls `fetchDashboardData()`
↓
Executes parallel API calls using `Promise.all`:
  1. `getMyPolicies()`
  2. `getMyClaims()`
  3. `getMyPayments()`
↓
Each API uses `.catch(() => null)` to ensure one failing endpoint doesn't break the entire dashboard.
↓
Data Processing:
  - Standardizes response (`res.content || res.data || []`)
  - Sorts arrays descending by ID to get the newest items first.
  - Counts `PENDING_PAYMENT` policies.
↓
State Updates:
  `setStats(...)`
  `setPoliciesList(policies.slice(0, 4))`
  `setRecentClaims(claims.slice(0, 4))`
↓
`setLoading(false)`
↓
Component Re-renders.
```

### Dashboard UI Rendering (Bento Grid)

```text
The Dashboard utilizes a "Bento Grid" CSS layout (`ip-bento-grid`).
↓
`<StatTile />` renders top KPIs.
↓
`<QuickAction />` maps over quick links.
↓
`<DataTable />` renders the `recentClaims`.
  - Uses `onRowClick` to navigate to `/customer/claims/:id`.
↓
Policies Map renders visually distinct cards:
  - Dynamic styling: If status === `PENDING_PAYMENT`, background is warning gradient, else success gradient.
  - Action button switches between "Pay Now" and "View" based on status.
```

---

## 2. Admin Dashboard Flow

**Entry Point:** `/admin/dashboard`

```text
`<AdminDashboard />` mounts.
↓
`useEffect` calls `getAdminStats()`.
  └─ Note: Unlike the customer dashboard which aggregates data on the client, the Admin dashboard calls a dedicated backend aggregation endpoint (`/api/dashboard/admin/stats`).
↓
Backend returns pre-calculated statistics and top 5 recent lists.
↓
State Updates: `setStats(data)`
↓
UI Rendering:
  - `<StatTile>` components render values (or placeholders if loading).
  - `<DataTable>` renders `recentClaims` and `recentPolicies`.
```

---

## 3. Profile Viewing and Passing State Flow

**Entry Point:** `/customer/profile`

### Profile View Flow

```text
`<CustomerProfilePage profile={profile} />` mounts.
↓
Note: The `profile` prop is actually fetched in the Parent component (`ProfilePage.jsx` container) and passed down to role-specific layouts.
↓
UI Renders using Lucide-react icons and Bootstrap layout.
  - Displays avatar with `profile.fullName.charAt(0)`.
```

### Edit Profile Navigation Flow

```text
User clicks "Update Profile".
↓
`<Link to="/customer/profile/edit" state={{ profile }} />`
↓
React Router navigates to Edit page, passing the `profile` object in the HTML5 History API `state`.
↓
`<EditProfilePage />` mounts.
↓
Extracts `location.state.profile`.
↓
Sets initial form state immediately WITHOUT making a GET request.
  `setFormData(location.state.profile)`
↓
This pattern significantly improves UX by removing loading spinners on the edit page.
```

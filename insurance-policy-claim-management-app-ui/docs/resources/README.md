# 📚 Insurance App - Developer Docs Index

> A complete reference guide for building the Insurance Policy & Claim Management frontend.

---

## 🗂️ Documentation Files

| #   | File                                                 | What's Inside                                                                 |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| 0   | [00_PROJECT_OVERVIEW.md](./00_PROJECT_OVERVIEW.md)   | Architecture, folder structure, role system, data flow, tech stack            |
| 1   | [01_AUTH_FLOW.md](./01_AUTH_FLOW.md)                 | Login, Register, JWT lifecycle, AuthContext, Protected Routes                 |
| 2   | [02_ADMIN_FLOW.md](./02_ADMIN_FLOW.md)               | Products, Plans, Customers, Policies, Claims (Approve/Reject), Users, Reports |
| 3   | [03_AGENT_FLOW.md](./03_AGENT_FLOW.md)               | Customer view, Policy issue, Claim review & recommendation, Record payment    |
| 4   | [04_CUSTOMER_FLOW.md](./04_CUSTOMER_FLOW.md)         | Browse products/plans, Purchase policy, Pay premium, Raise claim, Profile     |
| 5   | [05_SHARED_COMPONENTS.md](./05_SHARED_COMPONENTS.md) | All reusable components - props, usage, concepts                              |
| 6   | [06_API_SERVICES.md](./06_API_SERVICES.md)           | axiosInstance, all services, hooks, utils, route guards                       |

---

## 🔁 Build Order (Recommended)

```
1. Setup (main.jsx, App.jsx, index.css, App.css)
        │
2. Utils & Constants (utils/)
        │
3. Storage & Auth Logic (storageUtils.js, AuthContext, ThemeContext)
        │
4. Axios Instance + Services (api/, services/)
        │
5. Custom Hooks (hooks/)
        │
6. Common Components (components/common/, components/ui/)
        │
7. Form Components (components/forms/)
        │
8. Navigation (components/navigation/ - Sidebar, TopNavbar)
        │
9. Layout (components/layouts/DashboardLayout)
        │
10. Table + Cards (components/tables/, components/cards/)
        │
11. Modals (components/modals/)
        │
12. Auth Pages (Login, Register)
        │
13. Route Guards (routes/)
        │
14. Admin Pages → Agent Pages → Customer Pages
        │
15. Shared Pages (NotFound, Unauthorized, PlaceholderPage)
        │
16. App.jsx route assembly
```

---

## 🔗 Quick Role → Pages Map

### Admin (`/admin/*`)

| Route                       | Component                |
| --------------------------- | ------------------------ |
| `/admin/dashboard`          | `AdminDashboard.jsx`     |
| `/admin/products`           | `ProductListPage.jsx`    |
| `/admin/products/create`    | `CreateProductPage.jsx`  |
| `/admin/products/edit/:id`  | `EditProductPage.jsx`    |
| `/admin/plans`              | `PlanListPage.jsx`       |
| `/admin/plans/create`       | `CreatePlanPage.jsx`     |
| `/admin/plans/edit/:id`     | `EditPlanPage.jsx`       |
| `/admin/customers`          | `CustomerListPage.jsx`   |
| `/admin/customers/:id`      | `CustomerDetailPage.jsx` |
| `/admin/policies`           | `PolicyListPage.jsx`     |
| `/admin/policies/issue`     | `IssuePolicyPage.jsx`    |
| `/admin/payments`           | `PaymentListPage.jsx`    |
| `/admin/claims`             | `ClaimListPage.jsx`      |
| `/admin/claims/:id`         | `ClaimDetailPage.jsx`    |
| `/admin/users`              | `UserListPage.jsx`       |
| `/admin/users/create-agent` | `CreateAgentPage.jsx`    |
| `/admin/reports`            | `ReportsPage.jsx`        |

### Agent (`/agent/*`)

| Route                    | Component                     |
| ------------------------ | ----------------------------- |
| `/agent/dashboard`       | `AgentDashboard.jsx`          |
| `/agent/customers`       | `AgentCustomerListPage.jsx`   |
| `/agent/customers/:id`   | `AgentCustomerDetailPage.jsx` |
| `/agent/policies`        | `AgentPolicyListPage.jsx`     |
| `/agent/policies/issue`  | `AgentIssuePolicyPage.jsx`    |
| `/agent/claims`          | `AgentClaimListPage.jsx`      |
| `/agent/claims/:id`      | `AgentClaimDetailPage.jsx`    |
| `/agent/payments`        | `AgentPaymentListPage.jsx`    |
| `/agent/payments/record` | `AgentRecordPaymentPage.jsx`  |

### Customer (`/customer/*`)

| Route                          | Component                        |
| ------------------------------ | -------------------------------- |
| `/customer/dashboard`          | `CustomerDashboard.jsx`          |
| `/customer/products`           | `CustomerProductListPage.jsx`    |
| `/customer/plans`              | `CustomerPlanListPage.jsx`       |
| `/customer/plans/:id`          | `CustomerPlanDetailPage.jsx`     |
| `/customer/policies`           | `CustomerPolicyListPage.jsx`     |
| `/customer/policies/purchase`  | `PurchasePolicyPage.jsx`         |
| `/customer/payments`           | `CustomerPaymentHistoryPage.jsx` |
| `/customer/payments/record`    | `RecordPaymentPage.jsx`          |
| `/customer/claims`             | `CustomerClaimListPage.jsx`      |
| `/customer/claims/raise`       | `RaiseClaimPage.jsx`             |
| `/customer/claims/:id/history` | `ClaimStatusHistoryPage.jsx`     |
| `/customer/profile`            | `CustomerProfilePage.jsx`        |
| `/customer/profile/edit`       | `EditProfilePage.jsx`            |

### Public / Shared

| Route           | Component          |
| --------------- | ------------------ |
| `/login`        | `Login.jsx`        |
| `/register`     | `Register.jsx`     |
| `/unauthorized` | `Unauthorized.jsx` |
| `*`             | `NotFound.jsx`     |

---

## 📚 External Resources

| Topic            | Link                                     |
| ---------------- | ---------------------------------------- |
| React 19 Docs    | https://react.dev                        |
| React Router v7  | https://reactrouter.com                  |
| Axios            | https://axios-http.com                   |
| Bootstrap 5      | https://getbootstrap.com/docs/5.3        |
| Bootstrap Icons  | https://icons.getbootstrap.com           |
| jwt-decode       | https://www.npmjs.com/package/jwt-decode |
| Vite             | https://vite.dev                         |
| JWT Introduction | https://jwt.io/introduction              |

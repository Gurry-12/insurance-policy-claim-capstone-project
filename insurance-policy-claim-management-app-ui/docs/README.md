# InsureFlow - Frontend Developer Knowledge Base

> **Insurance Policy Claim Management System**  
> React 19 · Vite 8 · Bootstrap 5 · React Router v7

---

## What is this?

This is the complete frontend developer knowledge base for the **InsureFlow** application - an enterprise Insurance Policy & Claim Management System. The purpose of this documentation is to allow a developer to **understand, maintain, and extend** the frontend confidently without first reading the entire codebase.

Every document is structured around four questions:

| Question  | Meaning                                                 |
| --------- | ------------------------------------------------------- |
| **What**  | What does this file/component/service do?               |
| **Why**   | Why does it exist? What business problem does it solve? |
| **How**   | How does it work technically?                           |
| **Where** | Where in the codebase does this live?                   |

---

## Project Overview

InsureFlow is a **multi-role enterprise web application** with three distinct user portals:

| Role                  | Portal          | Home Route            |
| --------------------- | --------------- | --------------------- |
| `ROLE_ADMIN`          | Admin Panel     | `/admin/dashboard`    |
| `ROLE_INTERNAL_STAFF` | Staff Console   | `/staff/dashboard`    |
| `ROLE_CUSTOMER`       | Customer Portal | `/customer/dashboard` |

Each role has its own set of pages, navigation items, and permissions enforced at both the route and service level.

---

## Technology Stack

| Layer           | Technology                     | Version  |
| --------------- | ------------------------------ | -------- |
| UI Framework    | React                          | ^19.2.6  |
| Build Tool      | Vite                           | ^8.0.12  |
| CSS Framework   | Bootstrap + Bootstrap Icons    | ^5.3.8   |
| Routing         | React Router DOM               | ^7.18.0  |
| Form Management | React Hook Form                | ^7.80.0  |
| HTTP Client     | Axios                          | ^1.18.0  |
| Notifications   | React Hot Toast                | ^2.6.0   |
| Date Picker     | React Datepicker               | ^9.1.0   |
| Select          | React Select                   | ^5.10.2  |
| Icons           | Lucide React + Bootstrap Icons | latest   |
| PDF Export      | jsPDF + jsPDF Autotable        | ^4.2.1   |
| Animations      | Framer Motion                  | ^12.42.2 |
| Auth Decode     | jwt-decode                     | ^4.0.0   |
| Progress Bar    | NProgress                      | ^0.2.0   |

---

## Documentation Index

### 🏗️ Architecture

- [Architecture Overview](./architecture/overview.md) - System-level design, data flow, and folder structure
- [Routing](./routing/routing.md) - Public, protected, and role-based routes

### 📄 Pages

- [Auth Pages](./pages/auth-pages.md) - Login, Register, Forgot Password, Verify OTP
- [Admin Pages](./pages/admin-pages.md) - Dashboard, Users, Customers, Products, Plans, Policies, Claims, Payments
- [Staff Pages](./pages/staff-pages.md) - Dashboard, Customers, Policies, Claims, Payments
- [Customer Pages](./pages/customer-pages.md) - Dashboard, Profile, Products, Plans, Policies, Payments, Claims

### 🧩 Components

- [Layout Components](./components/layouts.md) - UnifiedLayout, Sidebar, TopNavbar
- [Reusable UI Components](./components/ui-components.md) - DataTable, PaginationBar, FormInput, StatusBadge, Modal, etc.
- [Common Components](./components/common-components.md) - PageHeader, ExportButton, GlobalApiHandler, GlobalToaster

### 🌐 Services & API

- [Services Overview](./services/services-overview.md) - All 9 service files documented
- [Axios Layer](./services/axios-layer.md) - axiosInstance, apiAdapter, interceptors
- [API Flow Diagrams](./services/api-flow-diagrams.md) - Sequence diagrams for every major API call

### 🪝 Hooks

- [Custom Hooks](./hooks/hooks.md) - useApiTable, useApiForm, useTableState, usePagination, useDebounceFilters, useAuth, useTheme

### 🗃️ Contexts

- [State Management](./contexts/state-management.md) - AuthContext, ThemeContext, component communication patterns

### 🔄 Workflows

- [Business Workflows](./workflows/workflows.md) - End-to-end flows: Login → Register → Purchase → Claim → Approval

### 🎨 Design System

- [Design System](./design-system/design-system.md) - Colors, typography, components, spacing, theming

### 🛠️ Developer Guide

- [Developer Guide](./developer-guide.md) - How to add pages, APIs, forms, tables, modules, and change permissions

### 🐛 Debugging

- [Common Debugging](./debugging/debugging.md) - API failures, toast issues, state bugs, routing bugs, auth issues

---

## Quick Reference: Where to Find Things

| I want to...            | Go to...                                                               |
| ----------------------- | ---------------------------------------------------------------------- |
| Add a new page          | [`developer-guide.md`](./developer-guide.md#adding-a-new-page)         |
| Add a new API call      | [`developer-guide.md`](./developer-guide.md#adding-a-new-api-call)     |
| Modify a form           | [`developer-guide.md`](./developer-guide.md#modifying-a-form)          |
| Change role permissions | [`developer-guide.md`](./developer-guide.md#changing-role-permissions) |
| Understand login flow   | [`workflows/workflows.md`](./workflows/workflows.md#login-workflow)    |
| Understand claim flow   | [`workflows/workflows.md`](./workflows/workflows.md#claim-workflow)    |
| Debug an API error      | [`debugging/debugging.md`](./debugging/debugging.md#api-failures)      |
| Understand routing      | [`routing/routing.md`](./routing/routing.md)                           |
| Understand auth state   | [`contexts/state-management.md`](./contexts/state-management.md)       |

---

## Key Environment Variables

| Variable            | Description               | Example                     |
| ------------------- | ------------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend REST API base URL | `http://localhost:8081/api` |

Set in `.env` at project root.

---

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Backend Swagger

The backend exposes live API documentation at:

- **Swagger UI:** `http://localhost:8081/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8081/v3/api-docs`

---

_This knowledge base is generated from the actual source code only. No functionality is invented._

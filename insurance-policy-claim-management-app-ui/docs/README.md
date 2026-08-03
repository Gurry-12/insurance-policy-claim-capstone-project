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

> **Note:** the detailed docs previously under `docs/` were consolidated into the project-level `imp-doc/` and `docs/` folders. The links below point to the canonical documents.

### 🏗️ Architecture

- [Frontend Architecture Overview](../../imp-doc/02-architecture/frontend-architecture-overview.md) - System-level design, data flow, and folder structure
- [Frontend Architecture (project docs)](../../docs/architecture/04-frontend-architecture.md) - Layers, routing & guards, state, data flow

### 📄 Pages

- [Auth Pages](../../imp-doc/04-workflows/auth-flow.md) - Login, Register, Forgot Password, Verify OTP
- [Admin Pages](../../imp-doc/04-workflows/admin-flow.md) - Dashboard, Users, Customers, Products, Plans, Policies, Claims, Payments
- [Staff & Customer Pages](../../docs/architecture/04-frontend-architecture.md) - per-role route map and page components

### 🧩 Components

- [Layout & UI Components](../../docs/architecture/04-frontend-architecture.md) - UnifiedLayout, Sidebar, TopNavbar, ui/ and common/ components
- [Design System](../../imp-doc/02-architecture/design-system.md) - DataTable, PaginationBar, FormInput, StatusBadge, Modal, theming

### 🌐 Services & API

- [Services & API (frontend contract)](../../imp-doc/01-api-contracts/frontend-api-contract.md) - endpoint inventory per service
- [Axios Layer](../../docs/architecture/04-frontend-architecture.md) - axiosInstance, apiAdapter, interceptors
- [API Flow Diagrams](../../docs/sequence-diagrams.md) - Sequence diagrams for the major API calls

### 🪝 Hooks

- [Custom Hooks](../../docs/architecture/04-frontend-architecture.md) - useApiTable, useApiForm, useTableState, usePagination, useDebounceFilters, useAuth, useTheme

### 🗃️ Contexts

- [State Management](../../docs/architecture/04-frontend-architecture.md) - AuthContext, ThemeContext, component communication patterns

### 🔄 Workflows

- [Business Workflows](../../imp-doc/04-workflows/business-workflows.md) - Lifecycle & state machines: user, product, policy, claim
- [Backend Workflows](../../imp-doc/04-workflows/backend-workflows.md) - End-to-end flows: Purchase → Payment → Claim → Review

### 🎨 Design System

- [Design System](../../imp-doc/02-architecture/design-system.md) - Colors, typography, components, spacing, theming

### 🛠️ Developer Guide

- [Developer Guide](../../imp-doc/05-deployment/frontend-developer-guide.md) - How to add pages, APIs, forms, tables, modules, and change permissions

### 🐛 Debugging

- [Common Mistakes & Debugging](../../imp-doc/04-workflows/auth-flow.md) - API failures, toast issues, state bugs, routing bugs, auth issues

---

## Quick Reference: Where to Find Things

| I want to...            | Go to...                                                               |
| ----------------------- | ---------------------------------------------------------------------- |
| Add a new page          | [`frontend-developer-guide.md`](../../imp-doc/05-deployment/frontend-developer-guide.md) |
| Add a new API call      | [`frontend-api-contract.md`](../../imp-doc/01-api-contracts/frontend-api-contract.md) |
| Modify a form           | [`frontend-developer-guide.md`](../../imp-doc/05-deployment/frontend-developer-guide.md) |
| Change role permissions | [`frontend-developer-guide.md`](../../imp-doc/05-deployment/frontend-developer-guide.md) |
| Understand login flow   | [`auth-flow.md`](../../imp-doc/04-workflows/auth-flow.md) |
| Understand claim flow   | [`backend-workflows.md`](../../imp-doc/04-workflows/backend-workflows.md) |
| Debug an API error      | [`auth-flow.md`](../../imp-doc/04-workflows/auth-flow.md) |
| Understand routing      | [`04-frontend-architecture.md`](../../docs/architecture/04-frontend-architecture.md) |
| Understand auth state   | [`04-frontend-architecture.md`](../../docs/architecture/04-frontend-architecture.md) |

---

## Key Environment Variables

| Variable            | Description                                                         | Example       |
| ------------------- | ------------------------------------------------------------------- | ------------- |
| `VITE_API_BASE_URL` | API base URL (same-origin proxy in dev, host serving `/api` in prod) | `/api`        |
| `VITE_API_PROXY_TARGET` | Backend origin for the Vite dev-server proxy (dev only)      | `http://localhost:8081` |

Set in `.env` at project root (gitignored; see `.env.example`). The backend
origin for the dev proxy lives only in `.env`, so it is never committed.

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

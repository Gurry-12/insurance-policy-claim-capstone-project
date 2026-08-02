# 📦 Insurance Policy & Claim Management - Project Overview

> **Stack**: React 19 + Vite + React Router v7 + Bootstrap 5 + Axios + JWT

---

## 🗂️ Table of Contents

| #   | Flow                              | File                      |
| --- | --------------------------------- | ------------------------- |
| 1   | Project Overview (this file)      | `00_PROJECT_OVERVIEW.md`  |
| 2   | Authentication - Login & Register | `01_AUTH_FLOW.md`         |
| 3   | Admin Flow                        | `02_ADMIN_FLOW.md`        |
| 4   | Staff Flow                       | `03_STAFF_FLOW.md`        |
| 5   | Customer Flow                     | `04_CUSTOMER_FLOW.md`     |
| 6   | Shared / Common Components        | `05_SHARED_COMPONENTS.md` |
| 7   | API & Services Layer              | `06_API_SERVICES.md`      |

---

## 🏗️ Architecture at a Glance

```
src/
├── main.jsx              ← App entry point (ReactDOM.createRoot)
├── App.jsx               ← Router root, Context providers, Route tree
├── index.css             ← Global CSS variables & resets
├── App.css               ← App-level layout styles
│
├── api/
│   └── axiosInstance.js  ← Single Axios instance with interceptors
│
├── context/
│   ├── AuthContext.jsx   ← Global auth state (user, token, login/logout)
│   └── ThemeContext.jsx  ← Dark/light mode toggle state
│
├── hooks/                ← Reusable logic (useAuth, useTheme, etc.)
├── services/             ← API call functions per domain
├── utils/                ← Constants, formatters, validators, roles
├── routes/               ← Protected & role-guarded route wrappers
│
├── components/           ← Reusable presentational components
│   ├── cards/
│   ├── common/
│   ├── forms/
│   ├── layouts/
│   ├── modals/
│   ├── navigation/
│   ├── tables/
│   └── ui/
│
└── pages/                ← Feature pages (render data + call services)
    ├── auth/
    ├── admin/
    ├── staff/
    ├── customer/
    └── shared/
```

---

## 🔐 Role System

| Role          | Value                  | Access Level                                |
| --------      | ---------------------- | ------------------------------------------- |
| Admin         | `ROLE_ADMIN`           | Full system control                         |
| Internal Staff| `ROLE_INTERNAL_STAFF`  | Claims review, customer & policy management |
| Customer      | `ROLE_CUSTOMER`        | Own data, purchase policies, raise claims   |

Roles are decoded from the **JWT token** after login and stored in `AuthContext`.

---

## 🔄 Data Flow (per page)

```
User Action
    │
    ▼
Page Component (e.g. ClaimListPage.jsx)
    │  calls
    ▼
Service Function (e.g. claimService.getAllClaims())
    │  uses
    ▼
axiosInstance.js   ←── attaches Bearer token automatically
    │  hits
    ▼
Backend REST API
    │  returns
    ▼
Service Function returns data
    │
    ▼
Page sets state → renders DataTable / Cards
```

---

## 📐 Key Concepts You Need to Know

| Concept               | Where Used                    | Learn From                                                                           |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| React Context API     | `AuthContext`, `ThemeContext` | [React Docs – Context](https://react.dev/reference/react/createContext)              |
| React Router v7       | `App.jsx`, `routes/`          | [React Router Docs](https://reactrouter.com/home)                                    |
| Axios Interceptors    | `axiosInstance.js`            | [Axios Docs](https://axios-http.com/docs/interceptors)                               |
| JWT (JSON Web Tokens) | Auth flow, `useAuth`          | [jwt.io](https://jwt.io/introduction)                                                |
| Custom Hooks          | `hooks/` folder               | [React Docs – Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) |
| Protected Routes      | `routes/ProtectedRoute.jsx`   | [React Router Auth Guide](https://reactrouter.com/how-to/redirecting)                |
| Bootstrap 5           | All UI components             | [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3)                                |

---

## 📁 Utility Files Reference

| File                    | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `utils/constants.js`    | API base URL, pagination defaults, status values |
| `utils/formatters.js`   | Date, currency, phone number formatting          |
| `utils/roles.js`        | Role constants (`ADMIN`, `INTERNAL_STAFF`, `CUSTOMER`)    |
| `utils/storageUtils.js` | `localStorage` get/set/remove for token & user   |
| `utils/validators.js`   | Form field validation functions                  |

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🌐 Environment Variables

```env
# .env
VITE_API_BASE_URL=http://localhost:8080/api
```

Access in code: `import.meta.env.VITE_API_BASE_URL`

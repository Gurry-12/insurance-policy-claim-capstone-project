# 🔐 Auth Flow - Login & Register

> Covers: `pages/auth/Login.jsx`, `pages/auth/Register.jsx`, `context/AuthContext.jsx`, `hooks/useAuth.js`, `services/authService.js`, `api/axiosInstance.js`

---

## 📌 Overview

The auth flow handles:

1. **Login** - submits credentials, receives JWT, decodes role, redirects to role-based dashboard
2. **Register** - public sign-up for **Customer** role only (Admin/Agent created by Admin)
3. **Token Persistence** - JWT stored in `localStorage` via `storageUtils.js`
4. **Auto-redirect** - if token exists, skip login and go to dashboard
5. **Logout** - clears storage and resets context state

---

## 🗂️ Files Involved

| File                            | Role in Auth Flow                                     |
| ------------------------------- | ----------------------------------------------------- |
| `pages/auth/Login.jsx`          | Login form UI + submission handler                    |
| `pages/auth/Register.jsx`       | Register form UI + submission handler                 |
| `context/AuthContext.jsx`       | Global auth state provider                            |
| `hooks/useAuth.js`              | Exposes `{ user, token, login, logout }` from context |
| `services/authService.js`       | `login()` and `register()` API calls                  |
| `api/axiosInstance.js`          | Attaches `Authorization: Bearer <token>` header       |
| `utils/storageUtils.js`         | `getToken()`, `saveToken()`, `removeToken()`          |
| `utils/roles.js`                | Role constants for redirect logic                     |
| `utils/validators.js`           | Email, password, required field validators            |
| `routes/ProtectedRoute.jsx`     | Blocks non-authenticated users                        |
| `routes/RoleProtectedRoute.jsx` | Blocks users with wrong role                          |

---

## 🔄 Login Flow Step-by-Step

```
1. User opens /login
2. Login.jsx renders a form (email + password)
3. On submit → calls authService.login({ email, password })
4. authService hits POST /api/auth/login via axiosInstance
5. Backend returns { token: "eyJ..." }
6. authService decodes token using jwt-decode → extracts { role, sub (email), exp }
7. Calls AuthContext.login(token, decodedUser)
8. AuthContext saves token to localStorage via storageUtils
9. Sets user state: { email, role }
10. Login.jsx reads role → redirects:
    - ROLE_ADMIN    → /admin/dashboard
    - ROLE_AGENT    → /agent/dashboard
    - ROLE_CUSTOMER → /customer/dashboard
```

---

## 🔄 Register Flow Step-by-Step

```
1. User opens /register
2. Register.jsx renders a form (name, email, password, phone, etc.)
3. On submit → validate fields via validators.js
4. Calls authService.register(formData)
5. authService hits POST /api/auth/register via axiosInstance
6. On success → redirect to /login with success message
7. On error → display error message from API (email already exists, etc.)
```

---

## 🔄 Token Lifecycle

```mermaid
flowchart TD
    Login["Login Success"] --> Save["Save JWT to localStorage"]
    
    Save --> Request{"Axios Request Interceptor"}
    Request --> |Reads Token| Attach["Attach Authorization Header"]
    
    Attach --> API((Backend API))
    
    API -- 200 OK --> Data["Return Data"]
    API -- 401 Unauthorized --> Intercept{"Axios Response Interceptor"}
    
    Intercept --> Catch401["Catch 401 Error"]
    Catch401 --> Dispatch["Dispatch auth:unauthorized event"]
    
    Dispatch --> GlobalHandler["GlobalApiHandler catches event"]
    GlobalHandler --> Logout[AuthContext.logout]
    Logout --> Clear["Clear localStorage"]
    Clear --> Redirect["Redirect to /login"]
```

---

## 📝 AuthContext.jsx - What It Manages

```jsx
// State shape inside AuthContext
{
  user: {
    email: "john@example.com",
    role: "ROLE_CUSTOMER",
    // any other decoded JWT fields
  },
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  isAuthenticated: true,
  login: (token, user) => void,
  logout: () => void,
}
```

---

## 📝 useAuth.js - Custom Hook

```js
// Usage in any component:
const { user, token, login, logout, isAuthenticated } = useAuth();
```

This hook wraps `useContext(AuthContext)` so you never need to import `AuthContext` directly in pages.

---

## 🧩 Component Breakdown

### `Login.jsx`

- State: `email`, `password`, `error`, `loading`
- Uses: `FormInput`, `LoadingSpinner`, `ErrorAlert`
- On success: calls `useNavigate()` from React Router

### `Register.jsx`

- State: `formData { name, email, password, phone, ... }`, `errors`, `loading`
- Uses: `FormInput`, `FormSelect` (for optional fields), `ErrorAlert`

---

## 🔒 Route Protection Logic

```
App.jsx defines routes like:
  /login          → Login.jsx           (public)
  /register       → Register.jsx        (public)
  /admin/*        → RoleProtectedRoute (role="ROLE_ADMIN") → AdminDashboard
  /agent/*        → RoleProtectedRoute (role="ROLE_AGENT") → AgentDashboard
  /customer/*     → RoleProtectedRoute (role="ROLE_CUSTOMER") → CustomerDashboard

ProtectedRoute.jsx:
  - Checks isAuthenticated → if false → redirect to /login

RoleProtectedRoute.jsx:
  - Checks user.role === required role → if false → redirect to /unauthorized
```

---

## 📐 Concepts to Learn

| Concept                        | Link                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| JWT decoding with `jwt-decode` | [npm: jwt-decode](https://www.npmjs.com/package/jwt-decode)                             |
| React Context + useReducer     | [React Docs](https://react.dev/learn/scaling-up-with-reducer-and-context)               |
| Axios request interceptors     | [Axios interceptors](https://axios-http.com/docs/interceptors)                          |
| React Router `<Navigate>`      | [Navigate API](https://reactrouter.com/api/components/Navigate)                         |
| localStorage in React          | [MDN Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) |
| React Hook Form (optional)     | [react-hook-form.com](https://react-hook-form.com/)                                     |

---

## ✅ Checklist

- [ ] `AuthContext.jsx` - createContext, Provider, login/logout functions
- [ ] `useAuth.js` - wraps useContext
- [ ] `storageUtils.js` - token save/get/remove
- [ ] `axiosInstance.js` - request interceptor adds token; response interceptor handles 401
- [ ] `authService.js` - login() and register() functions
- [ ] `Login.jsx` - form, submit, redirect by role
- [ ] `Register.jsx` - form, validation, submit
- [ ] `ProtectedRoute.jsx` - auth guard
- [ ] `RoleProtectedRoute.jsx` - role guard

---

## ⚠️ Common Pitfalls

| Issue                                            | Fix                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Token not persisting on refresh                  | Initialize state from `localStorage` inside `AuthContext`                            |
| 401 loop (interceptor calling logout infinitely) | Add a flag to prevent interceptor from triggering on `/auth/login` endpoint          |
| Role comparison fails                            | Ensure token roles match your `roles.js` constants exactly (`ROLE_ADMIN` vs `admin`) |
| Form submit without validation                   | Always validate before calling service                                               |
